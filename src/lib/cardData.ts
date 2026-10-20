import { promises as fs } from "node:fs";
import path from "node:path";
import { shared } from "@/lib/rateLimit";
import { PAGE_WAIT_MS, apiFetchText } from "@/lib/ygoApi";
import { buildIndex, slimCard, type CardIndex } from "@/lib/cardIndex";
import type { YgoCard } from "@/types/yugioh";

// DeckForge's own copy of the card database. YGOPRODeck's API guide asks sites to keep the data themselves rather
// than call the API on every request, so the whole database is downloaded once (one cardinfo.php call, plus
// archetypes.php), saved in data/ (gitignored) and kept in memory. Once a day checkDBVer.php is asked whether there's
// a newer version, and only then is it downloaded again. Until there's a copy (say the first download failed),
// ygoprodeck.ts falls back to asking the live API, so the site keeps working.

// bump this when the saved shape changes: an older copy is then downloaded again rather than read
const FORMAT = 1;
const DAY_MS = 24 * 60 * 60_000;
// after a failed download or version check, wait this long before trying again
const RETRY_MS = 30 * 60_000;
// a full download is ~3 MB compressed (~21 MB of JSON), so it gets longer than a page-load call
const DOWNLOAD_TIMEOUT_MS = 120_000;
// fewer cards than this means YGOPRODeck sent something broken; keep what we have instead
const MIN_CARDS = 5_000;

const CARDS_FILE = "cards.json"; // { format, version, downloadedAt, archetypes, cards }
const META_FILE = "meta.json"; // { version, checkedAt }: rewritten by the daily check without touching the cards

/** Where the copy lives: CARD_DATA_DIR, or data/ next to package.json. */
export function cardDataDir() {
  return process.env.CARD_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");
}

type Saved = { version: string; archetypes: string[] | null; cards: YgoCard[] };

const state = shared("cardData", () => ({
  index: null as CardIndex | null,
  loading: null as Promise<CardIndex | null> | null,
  checking: null as Promise<void> | null,
  /** when the first load may be tried again after it failed */
  retryAt: 0,
  /** when to ask checkDBVer.php again */
  checkAt: 0,
}));

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * The local copy, loading it first if it isn't in memory yet (waiting up to `waitMs` for that). Null means there's
 * no copy right now and the caller should ask the live API instead.
 */
export async function getCardIndex(waitMs: number): Promise<CardIndex | null> {
  if (state.index) {
    checkForUpdateIfDue();
    return state.index;
  }
  const loading = startLoading();
  if (!loading) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => (timer = setTimeout(() => resolve(null), waitMs)));
  try {
    return await Promise.race([loading, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Starts loading the copy without waiting for it; the server calls this when it starts (see instrumentation.ts). */
export function warmCardData() {
  void startLoading();
}

function startLoading(): Promise<CardIndex | null> | null {
  if (state.loading) return state.loading;
  if (Date.now() < state.retryAt) return null;
  state.loading = loadCardData()
    .catch((err) => {
      console.error("[card data] couldn't load the card data:", errorText(err));
      return null;
    })
    .then((index) => {
      if (index) {
        state.index = index;
        checkForUpdateIfDue(); // a saved copy may not have been checked for a day or more
      } else {
        state.retryAt = Date.now() + RETRY_MS;
      }
      return index;
    })
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

// the saved copy if there is one, otherwise a fresh download
async function loadCardData(): Promise<CardIndex | null> {
  const saved = await readSaved();
  if (saved) {
    state.checkAt = saved.checkedAt + DAY_MS;
    return buildIndex(saved.cards, saved.archetypes, saved.version);
  }
  try {
    const fresh = await download(await fetchVersion().catch(() => "unknown"));
    await save(fresh);
    state.checkAt = Date.now() + DAY_MS;
    console.log(`[card data] downloaded ${fresh.cards.length} cards (database version ${fresh.version})`);
    return buildIndex(fresh.cards, fresh.archetypes, fresh.version);
  } catch (err) {
    console.error("[card data] download failed, using the live API for now:", errorText(err));
    return null;
  }
}

function checkForUpdateIfDue() {
  if (state.checking || Date.now() < state.checkAt) return;
  state.checkAt = Date.now() + DAY_MS;
  state.checking = checkForUpdate()
    .catch((err) => {
      console.error("[card data] update check failed:", errorText(err));
      state.checkAt = Date.now() + RETRY_MS;
    })
    .finally(() => {
      state.checking = null;
    });
}

/** Asks YGOPRODeck for its database version and downloads the cards again only if it has changed. */
async function checkForUpdate() {
  const version = await fetchVersion();
  if (state.index && version === state.index.version) {
    await saveMeta(version);
    return;
  }
  const fresh = await download(version);
  await save(fresh);
  state.index = buildIndex(fresh.cards, fresh.archetypes, fresh.version);
  console.log(`[card data] updated to database version ${version} (${fresh.cards.length} cards)`);
}

async function fetchVersion(): Promise<string> {
  const rows = JSON.parse(await apiFetchText("/checkDBVer.php", {}, PAGE_WAIT_MS)) as { database_version?: unknown }[];
  const version = Array.isArray(rows) ? rows[0]?.database_version : undefined;
  if ((typeof version !== "string" && typeof version !== "number") || String(version) === "") {
    throw new Error("checkDBVer.php sent no version");
  }
  return String(version);
}

async function download(version: string): Promise<Saved> {
  const text = await apiFetchText("/cardinfo.php", {}, PAGE_WAIT_MS, DOWNLOAD_TIMEOUT_MS);
  const raw = (JSON.parse(text) as { data?: unknown }).data;
  const cards = Array.isArray(raw) ? raw.map(slimCard).filter((c): c is YgoCard => c !== null) : [];
  if (cards.length < MIN_CARDS) throw new Error(`cardinfo.php sent only ${cards.length} cards`);

  // without archetypes.php's list, buildIndex makes one from the cards
  let archetypes: string[] | null = null;
  try {
    const rows = JSON.parse(await apiFetchText("/archetypes.php", {}, PAGE_WAIT_MS)) as { archetype_name?: unknown }[];
    const names = rows.map((a) => a?.archetype_name).filter((a): a is string => typeof a === "string" && a !== "");
    if (names.length > 0) archetypes = names;
  } catch (err) {
    console.error("[card data] archetypes.php failed:", errorText(err));
  }
  return { version, archetypes, cards };
}

async function readSaved(): Promise<(Saved & { checkedAt: number }) | null> {
  const dir = cardDataDir();
  let saved: { format?: unknown; version?: unknown; archetypes?: unknown; cards?: unknown };
  try {
    saved = JSON.parse(await fs.readFile(path.join(dir, CARDS_FILE), "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[card data] saved copy unreadable, downloading again:", errorText(err));
    }
    return null;
  }
  if (saved.format !== FORMAT || typeof saved.version !== "string" || !Array.isArray(saved.cards)) return null;

  // when it was last confirmed up to date; without a record, check soon (it's a small call)
  let checkedAt = 0;
  try {
    const meta = JSON.parse(await fs.readFile(path.join(dir, META_FILE), "utf8")) as { version?: unknown; checkedAt?: unknown };
    if (meta.version === saved.version && typeof meta.checkedAt === "string") checkedAt = Date.parse(meta.checkedAt) || 0;
  } catch {
    // no record
  }
  const archetypes = Array.isArray(saved.archetypes) ? (saved.archetypes as string[]) : null;
  return { version: saved.version, archetypes, cards: saved.cards as YgoCard[], checkedAt };
}

// written to a temporary file and renamed into place, so a crash halfway never leaves half a file behind
async function writeAtomic(file: string, text: string) {
  const dir = cardDataDir();
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${file}.${process.pid}.tmp`);
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, path.join(dir, file));
}

// saving is best effort: if the disk is full or read-only, the copy in memory still works until the next restart
async function save(data: Saved) {
  try {
    const { version, archetypes, cards } = data;
    await writeAtomic(CARDS_FILE, JSON.stringify({ format: FORMAT, version, downloadedAt: new Date().toISOString(), archetypes, cards }));
    await saveMeta(version);
  } catch (err) {
    console.error("[card data] couldn't save the card data:", errorText(err));
  }
}

async function saveMeta(version: string) {
  try {
    await writeAtomic(META_FILE, JSON.stringify({ version, checkedAt: new Date().toISOString() }));
  } catch (err) {
    console.error("[card data] couldn't save the check time:", errorText(err));
  }
}

/** Forgets the copy in memory (the saved one stays); for the tests. */
export function resetCardDataForTests() {
  Object.assign(state, { index: null, loading: null, checking: null, retryAt: 0, checkAt: 0 });
}

/** Waits for a background update check to finish; for the tests. */
export async function cardDataCheckForTests() {
  await state.checking;
}
