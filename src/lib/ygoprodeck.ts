import { shared } from "@/lib/rateLimit";
import type { YgoCard, SearchFilters } from "@/types/yugioh";

const BASE_URL = "https://db.ygoprodeck.com/api/v7";

// only the status goes in the message: YGOPRODeck's own error text never reaches visitors
export class YgoApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`YGOPRODeck API error ${status}`);
    this.status = status;
  }
}

// thrown when the queue for YGOPRODeck is too long to wait in right now
export class UpstreamBusyError extends Error {
  constructor() {
    super("YGOPRODeck queue is full");
  }
}

// Every call to YGOPRODeck (searches, deck pages, card lookups, archetypes) waits its turn in one queue that lets
// out at most 6 a second (after a burst of 6), well under its limit of 20 a second. Going over that gets the server
// blocked for an hour, which would break card data on every page. Calls go in the order they arrived, and one that
// would have to wait longer than it's willing to gives up straight away (without taking a place in the queue).
const UPSTREAM_GAP_MS = 167; // a sixth of a second, rounded up (whole numbers keep the sums exact)
const UPSTREAM_BURST = 6;
// shared() keeps one queue for the whole process, not one per bundle (see rateLimit.ts)
const upstream = shared("ygoUpstream", () => ({ nextAt: 0 }));

/** Waits for this call's turn to go to YGOPRODeck; exported for the tests. */
export async function waitForUpstreamSlot(maxWaitMs: number, now = Date.now()) {
  const due = Math.max(upstream.nextAt, now);
  const wait = due - (UPSTREAM_BURST - 1) * UPSTREAM_GAP_MS - now;
  if (wait > maxWaitMs) throw new UpstreamBusyError();
  upstream.nextAt = due + UPSTREAM_GAP_MS;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

// how long each kind of call will queue for: searches are typed live so they give up sooner than a page load
const SEARCH_WAIT_MS = 5_000;
const PAGE_WAIT_MS = 8_000;

async function apiFetchText(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  maxWaitMs = SEARCH_WAIT_MS
): Promise<string> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  await waitForUpstreamSlot(maxWaitMs);
  // no Next fetch cache: the caches below do that job, and Next's would write every unique search to disk
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15_000), // don't leave pages hanging if YGOPRODeck stops answering
  });

  if (!res.ok) {
    await res.body?.cancel();
    throw new YgoApiError(res.status);
  }

  return res.text();
}

// A Map where entries expire, with a cap on the total size (of the JSON they came from); the oldest go first.
class TtlCache<K, V> {
  private entries = new Map<K, { expires: number; bytes: number; value: V }>();
  private total = 0;
  private ttlMs: number;
  private maxBytes: number;

  constructor(ttlMs: number, maxBytes: number) {
    this.ttlMs = ttlMs;
    this.maxBytes = maxBytes;
  }

  get(key: K): V | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.expires > Date.now()) return e.value;
    this.drop(key);
    return undefined;
  }

  set(key: K, value: V, bytes: number) {
    this.drop(key);
    if (bytes > this.maxBytes) return;
    const now = Date.now();
    // oldest first: drop what's expired, then whatever it takes to make room
    for (const [k, v] of this.entries) {
      if (v.expires > now && this.total + bytes <= this.maxBytes) break;
      this.drop(k);
    }
    this.entries.set(key, { expires: now + this.ttlMs, bytes, value });
    this.total += bytes;
  }

  private drop(key: K) {
    const e = this.entries.get(key);
    if (!e) return;
    this.entries.delete(key);
    this.total -= e.bytes;
  }
}

// Searches repeat a lot (typing, deck imports), and deck pages ask for the same cards over and over, so both are
// kept in memory for a while. Every card a search brings back goes in the card cache too, so a deck built from
// searches usually loads without asking YGOPRODeck at all.
type CardList = { data: YgoCard[] };
const searchCache = shared("ygoSearchCache", () => new TtlCache<string, CardList>(10 * 60_000, 16 * 1024 * 1024));
const cardCache = shared("ygoCardCache", () => new TtlCache<number, YgoCard>(60 * 60_000, 8 * 1024 * 1024)); // a few thousand cards
const searchesInFlight = shared("ygoSearchesInFlight", () => new Map<string, Promise<CardList>>());

/** One cardinfo.php call; remembers each card it brings back. `bytes` is the size of the JSON it came as. */
async function fetchCards(
  params: Record<string, string | number | undefined>,
  maxWaitMs: number
): Promise<{ result: CardList; bytes: number }> {
  let text: string;
  try {
    text = await apiFetchText("/cardinfo.php", params, maxWaitMs);
  } catch (err) {
    // YGOPRODeck answers 400 when nothing matches
    if (err instanceof YgoApiError && err.status === 400) text = '{"data":[]}';
    else throw err;
  }
  const result = JSON.parse(text) as CardList;
  if (!Array.isArray(result.data)) result.data = [];
  const perCard = Math.ceil(text.length / Math.max(1, result.data.length));
  for (const card of result.data) if (Number.isInteger(card?.id)) cardCache.set(card.id, card, perCard);
  return { result, bytes: text.length };
}

export async function searchCards(
  filters: SearchFilters
): Promise<{ data: YgoCard[] }> {
  const params: Record<string, string | number | undefined> = {
    fname: filters.name || undefined,
    type: filters.type || undefined,
    race: filters.race || undefined,
    attribute: filters.attribute || undefined,
    level: filters.level || undefined,
    archetype: filters.archetype || undefined,
    banlist: filters.banlist || undefined,
    sort: filters.sort || "name",
    num: filters.num || 60,
    offset: filters.offset || 0,
  };

  if (filters.atk !== undefined && filters.atk !== "") {
    params["atk"] = filters.atk;
  }
  if (filters.def !== undefined && filters.def !== "") {
    params["def"] = filters.def;
  }

  const key = JSON.stringify(params);
  const cached = searchCache.get(key);
  if (cached) return cached;

  // the same search asked for twice at once only goes upstream once
  let pending = searchesInFlight.get(key);
  if (!pending) {
    pending = fetchCards(params, SEARCH_WAIT_MS)
      .then(({ result, bytes }) => {
        searchCache.set(key, result, bytes);
        return result;
      })
      .finally(() => searchesInFlight.delete(key));
    searchesInFlight.set(key, pending);
  }
  return pending;
}

// a deck holds 90 cards at most, so this is plenty; it also keeps each upstream URL a sensible length
const MAX_IDS = 300;
const IDS_PER_CALL = 100;

/**
 * Card data for a list of passcodes. Cards in memory come straight back; the rest are asked for in a call or two,
 * but only if `canFetch` (when given) says this caller still has lookups left. If YGOPRODeck is busy or down, it
 * gives back what it has rather than failing.
 */
export async function getCardsByIds(ids: number[], opts: { canFetch?: () => boolean } = {}): Promise<YgoCard[]> {
  const wanted = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0).slice(0, MAX_IDS);
  const found: YgoCard[] = [];
  const missing: number[] = [];
  for (const id of wanted) {
    const card = cardCache.get(id);
    if (card) found.push(card);
    else missing.push(id);
  }
  if (missing.length === 0 || (opts.canFetch && !opts.canFetch())) return found;

  for (let i = 0; i < missing.length; i += IDS_PER_CALL) {
    try {
      const { result } = await fetchCards({ id: missing.slice(i, i + IDS_PER_CALL).join(",") }, PAGE_WAIT_MS);
      found.push(...result.data);
    } catch (err) {
      if (!(err instanceof UpstreamBusyError)) {
        console.error("[ygoprodeck] card lookup failed:", err instanceof Error ? err.message : err);
      }
      break;
    }
  }
  return found;
}

export async function getCardById(id: number): Promise<YgoCard | null> {
  const [card] = await getCardsByIds([id]);
  return card ?? null;
}

const archetypes = shared("ygoArchetypes", () => ({ cache: null as { expires: number; list: string[] } | null }));

export async function getArchetypes(): Promise<string[]> {
  if (archetypes.cache && archetypes.cache.expires > Date.now()) return archetypes.cache.list;
  try {
    const result = JSON.parse(await apiFetchText("/archetypes.php")) as { archetype_name: string }[];
    const list = result.map((a) => a.archetype_name).sort();
    archetypes.cache = { expires: Date.now() + 6 * 60 * 60_000, list };
    return list;
  } catch {
    // try again in a minute rather than on every deck builder load
    archetypes.cache = { expires: Date.now() + 60_000, list: archetypes.cache?.list ?? [] };
    return archetypes.cache.list;
  }
}

export async function getRandomCard(): Promise<YgoCard | null> {
  try {
    const result = JSON.parse(await apiFetchText("/randomcard.php")) as { data?: YgoCard[] };
    return result.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export function getCardImageUrl(cardId: number, size: "normal" | "small" | "cropped" = "normal"): string {
  switch (size) {
    case "small":
      return `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
    case "cropped":
      return `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`;
    default:
      return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
  }
}
