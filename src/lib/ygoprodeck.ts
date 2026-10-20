import { shared } from "@/lib/rateLimit";
import { getCardIndex } from "@/lib/cardData";
import { cardsByIds, searchIndex, slimCard } from "@/lib/cardIndex";
import { PAGE_WAIT_MS, SEARCH_WAIT_MS, UpstreamBusyError, YgoApiError, apiFetchText } from "@/lib/ygoApi";
import type { YgoCard, SearchFilters } from "@/types/yugioh";

export { UpstreamBusyError, YgoApiError };

// Card data for the app. Everything comes from DeckForge's own copy of the card database (cardData.ts); only while
// there's no copy yet (the first download hasn't finished, or failed) do searches and lookups go to YGOPRODeck's
// live API, through the shared queue in ygoApi.ts and the caches below.

// how long a request waits for the copy to load (from disk that's well under a second) before going live instead
const SEARCH_LOAD_WAIT_MS = 3_000;
const PAGE_LOAD_WAIT_MS = 8_000;

// ── Live API fallback ──────────────────────────────────────────────────────────────────────────────────────────

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
  const raw = (JSON.parse(text) as { data?: unknown }).data;
  // cut down the same way as the local copy, so pages get the same shape (and no links to YGOPRODeck's images)
  const result: CardList = { data: Array.isArray(raw) ? raw.map(slimCard).filter((c): c is YgoCard => c !== null) : [] };
  const perCard = Math.ceil(text.length / Math.max(1, result.data.length));
  for (const card of result.data) cardCache.set(card.id, card, perCard);
  return { result, bytes: text.length };
}

async function liveSearch(filters: SearchFilters): Promise<CardList> {
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

async function liveCardsByIds(wanted: number[], canFetch?: () => boolean): Promise<YgoCard[]> {
  const found: YgoCard[] = [];
  const missing: number[] = [];
  for (const id of wanted) {
    const card = cardCache.get(id);
    if (card) found.push(card);
    else missing.push(id);
  }
  if (missing.length === 0 || (canFetch && !canFetch())) return found;

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

const liveArchetypes = shared("ygoArchetypes", () => ({ cache: null as { expires: number; list: string[] } | null }));

// ── What the app calls ─────────────────────────────────────────────────────────────────────────────────────────

export async function searchCards(filters: SearchFilters): Promise<{ data: YgoCard[] }> {
  const index = await getCardIndex(SEARCH_LOAD_WAIT_MS);
  return index ? searchIndex(index, filters) : liveSearch(filters);
}

/**
 * Card data for a list of passcodes, from the local copy. Without one, cards seen lately come from memory and the
 * rest are asked for in a call or two, but only if `canFetch` (when given) says this caller still has lookups left;
 * if YGOPRODeck is busy or down, it gives back what it has rather than failing.
 */
export async function getCardsByIds(ids: number[], opts: { canFetch?: () => boolean } = {}): Promise<YgoCard[]> {
  const wanted = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0).slice(0, MAX_IDS);
  if (wanted.length === 0) return [];
  const index = await getCardIndex(PAGE_LOAD_WAIT_MS);
  // the copy is the whole database, so a passcode it doesn't know isn't worth asking YGOPRODeck about
  return index ? cardsByIds(index, wanted) : liveCardsByIds(wanted, opts.canFetch);
}

export async function getCardById(id: number): Promise<YgoCard | null> {
  const [card] = await getCardsByIds([id]);
  return card ?? null;
}

export async function getArchetypes(): Promise<string[]> {
  const index = await getCardIndex(PAGE_LOAD_WAIT_MS);
  if (index) return index.archetypes;

  if (liveArchetypes.cache && liveArchetypes.cache.expires > Date.now()) return liveArchetypes.cache.list;
  try {
    const result = JSON.parse(await apiFetchText("/archetypes.php")) as { archetype_name: string }[];
    const list = result.map((a) => a.archetype_name).sort();
    liveArchetypes.cache = { expires: Date.now() + 6 * 60 * 60_000, list };
    return list;
  } catch {
    // try again in a minute rather than on every deck builder load
    liveArchetypes.cache = { expires: Date.now() + 60_000, list: liveArchetypes.cache?.list ?? [] };
    return liveArchetypes.cache.list;
  }
}

export async function getRandomCard(): Promise<YgoCard | null> {
  const index = await getCardIndex(PAGE_LOAD_WAIT_MS);
  if (index) return index.cards[Math.floor(Math.random() * index.cards.length)] ?? null;
  try {
    const result = JSON.parse(await apiFetchText("/randomcard.php")) as { data?: unknown[] };
    return slimCard(result.data?.[0]);
  } catch {
    return null;
  }
}
