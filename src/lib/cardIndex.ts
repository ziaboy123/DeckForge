import type { BanStatus, CardImage, SearchFilters, YgoCard } from "@/types/yugioh";

// The whole card database in memory, and the card search run against it. Nothing here touches the network or the
// disk (cardData.ts does that), so the tests can feed it a handful of cards.

// what DeckForge shows or searches on; prices, set lists and YGOPRODeck's image links are left out (pictures come
// from cardImages.ts), which keeps the copy about a third the size of what YGOPRODeck sends
const KEPT_FIELDS = [
  "id", "name", "type", "frameType", "desc", "race", "attribute", "level", "atk", "def", "linkval", "linkmarkers",
  "scale", "archetype", "banlist_info",
] as const;

/** One card from YGOPRODeck, cut down to the fields above; null if it isn't a card at all. */
export function slimCard(raw: unknown): YgoCard | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (!Number.isInteger(c.id) || typeof c.name !== "string") return null;

  const card: Record<string, unknown> = {};
  // YGOPRODeck sends null for stats a card doesn't have (a Link Monster's DEF); leaving them out reads the same
  for (const k of KEPT_FIELDS) if (c[k] !== undefined && c[k] !== null) card[k] = c[k];

  // just the passcode of each artwork
  const images: CardImage[] = [];
  if (Array.isArray(c.card_images)) {
    for (const img of c.card_images) {
      const id = (img as { id?: unknown } | null)?.id;
      if (typeof id === "number" && Number.isInteger(id)) images.push({ id });
    }
  }
  card.card_images = images.length > 0 ? images : [{ id: c.id }];
  return card as unknown as YgoCard;
}

// Names are matched two ways: as typed (ignoring case and accents), and as just their words (apostrophes dropped,
// other punctuation read as a space), so "blue eyes" finds "Blue-Eyes White Dragon", "evil twin" finds
// "Evil★Twin Ki-sikil" and "gaias" finds "Gaia's".
const fold = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plainKey = (s: string) => fold(s).replace(/\s+/g, " ").trim();
const wordsKey = (s: string) => fold(s).replace(/['\u2018\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export interface CardIndex {
  /** YGOPRODeck's database version this copy came from */
  version: string;
  /** every card, in name order */
  cards: YgoCard[];
  /** search keys for each card's name, in the same order as `cards` */
  names: { plain: string; words: string }[];
  /** every passcode, alternate artworks included */
  byId: Map<number, YgoCard>;
  archetypes: string[];
}

const byName = new Intl.Collator("en", { sensitivity: "base" });

export function buildIndex(cards: YgoCard[], archetypes: string[] | null, version: string): CardIndex {
  const sorted = [...cards].sort((a, b) => byName.compare(a.name, b.name) || a.id - b.id);
  const byId = new Map<number, YgoCard>();
  for (const card of sorted) {
    byId.set(card.id, card);
    for (const img of card.card_images ?? []) if (!byId.has(img.id)) byId.set(img.id, card);
  }
  // archetypes.php's list when there is one, otherwise whatever the cards themselves name
  const list = archetypes ?? [...new Set(sorted.map((c) => c.archetype).filter((a): a is string => !!a))];
  return {
    version,
    cards: sorted,
    names: sorted.map((c) => ({ plain: plainKey(c.name), words: wordsKey(c.name) })),
    byId,
    archetypes: [...list].sort(),
  };
}

// ATK/DEF filters take a number, or one with lt/lte/gt/gte in front (as YGOPRODeck's API did)
function statTest(raw: number | string | undefined): ((v: number | undefined) => boolean) | null {
  if (raw === undefined || raw === "") return null;
  const m = String(raw).match(/^(lt|lte|gt|gte)?(\d{1,6})$/);
  if (!m) return () => false;
  const n = Number(m[2]);
  switch (m[1]) {
    case "lt": return (v) => v !== undefined && v < n;
    case "lte": return (v) => v !== undefined && v <= n;
    case "gt": return (v) => v !== undefined && v > n;
    case "gte": return (v) => v !== undefined && v >= n;
    default: return (v) => v === n;
  }
}

// the filter's "Monster" means any kind of monster; the other types are matched exactly
const typeMatches = (type: string, wanted: string) => (wanted === "Monster" ? type.includes("Monster") : type === wanted);

// the TCG list; YGOPRODeck calls banned cards "Forbidden", and a card that isn't on the list is unlimited
function banMatches(card: YgoCard, wanted: BanStatus): boolean {
  const status: string | undefined = card.banlist_info?.ban_tcg;
  if (wanted === "Unlimited") return !status || status === "Unlimited";
  if (wanted === "Banned") return status === "Banned" || status === "Forbidden";
  return status === wanted;
}

// ATK, DEF and level sort highest first (as the filter's labels say), cards without one last; ties stay in name order
const SORT_KEYS = { atk: (c: YgoCard) => c.atk, def: (c: YgoCard) => c.def, level: (c: YgoCard) => c.level };

/** The card search, with the same filters and paging the deck builder sent to YGOPRODeck. */
export function searchIndex(index: CardIndex, filters: SearchFilters): { data: YgoCard[] } {
  const plain = filters.name ? plainKey(filters.name) : "";
  const words = filters.name ? wordsKey(filters.name) : "";
  const archetype = filters.archetype?.toLowerCase();
  const atk = statTest(filters.atk);
  const def = statTest(filters.def);

  const exact: YgoCard[] = [];
  let hits: YgoCard[] = [];
  index.cards.forEach((card, i) => {
    const name = index.names[i];
    if (plain && !name.plain.includes(plain) && !(words && name.words.includes(words))) return;
    if (filters.type && !typeMatches(card.type, filters.type)) return;
    if (filters.race && card.race !== filters.race) return;
    if (filters.attribute && card.attribute !== filters.attribute) return;
    if (filters.level && card.level !== filters.level) return;
    if (archetype && card.archetype?.toLowerCase() !== archetype) return;
    if (filters.banlist && !banMatches(card, filters.banlist)) return;
    if (filters.frameType && card.frameType !== filters.frameType) return;
    if (atk && !atk(card.atk)) return;
    if (def && !def(card.def)) return;
    // a card whose whole name is what was typed comes first, so a deck-list import gets "Kuriboh", not "Clear Kuriboh"
    if (plain && (name.plain === plain || (words && name.words === words))) exact.push(card);
    else hits.push(card);
  });

  const sort = filters.sort ?? "name";
  if (sort === "id") {
    hits.sort((a, b) => a.id - b.id);
  } else if (sort !== "name") {
    const key = SORT_KEYS[sort];
    hits.sort((a, b) => (key(b) ?? -1) - (key(a) ?? -1));
  }
  hits = exact.concat(hits);

  const offset = filters.offset ?? 0;
  const num = filters.num || 60;
  return { data: hits.slice(offset, offset + num) };
}

/** The cards for a list of passcodes, in the order asked for; unknown passcodes are skipped. */
export function cardsByIds(index: CardIndex, ids: number[]): YgoCard[] {
  const found = new Set<YgoCard>();
  for (const id of ids) {
    const card = index.byId.get(id);
    if (card) found.add(card);
  }
  return [...found];
}
