import type { SearchFilters } from "@/types/yugioh";

// What the card search accepts. Anything else is refused rather than passed on to YGOPRODeck.
export const MAX_RESULTS = 100;
const MAX_OFFSET = 20_000; // a bit over the whole card pool
const MAX_TEXT = 100;

const TYPES = new Set([
  "Monster", "Spell Card", "Trap Card", // what the filter dropdown sends
  "Normal Monster", "Effect Monster", "Ritual Monster", "Ritual Effect Monster", "Fusion Monster", "Synchro Monster",
  "XYZ Monster", "Link Monster", "Pendulum Effect Monster", "Pendulum Normal Monster", "Pendulum Fusion Monster",
  "Synchro Pendulum Effect Monster", "XYZ Pendulum Effect Monster", "Skill Card", "Token",
]);
const RACES = new Set([
  "Aqua", "Beast", "Beast-Warrior", "Creator-God", "Cyberse", "Dinosaur", "Divine-Beast", "Dragon", "Fairy", "Fiend",
  "Fish", "Illusion", "Insect", "Machine", "Plant", "Psychic", "Pyro", "Reptile", "Rock", "Sea Serpent", "Spellcaster",
  "Thunder", "Warrior", "Winged Beast", "Wyrm", "Zombie",
  // spell and trap "races"
  "Normal", "Field", "Equip", "Continuous", "Quick-Play", "Ritual", "Counter",
]);
const ATTRIBUTES = new Set(["DARK", "LIGHT", "WATER", "FIRE", "EARTH", "WIND", "DIVINE"]);
const BANLIST = new Set(["Banned", "Limited", "Semi-Limited", "Unlimited"]);
const FRAME_TYPES = new Set([
  "normal", "effect", "ritual", "fusion", "synchro", "xyz", "link", "normal_pendulum", "effect_pendulum",
  "ritual_pendulum", "fusion_pendulum", "synchro_pendulum", "xyz_pendulum", "spell", "trap", "token", "skill",
]);
const SORTS = new Set(["name", "atk", "def", "level", "id"]);

export type ParsedSearch = { ok: true; filters: SearchFilters } | { ok: false; error: string };

function whole(raw: string | null, min: number, max: number, fallback: number): number | null {
  if (raw === null || raw === "") return fallback;
  if (!/^\d{1,6}$/.test(raw)) return null;
  return Math.min(max, Math.max(min, Number(raw)));
}

/** Checks the search's query string; numbers are clamped, everything else must be a value we know. */
export function parseSearchParams(sp: URLSearchParams): ParsedSearch {
  const bad = (what: string): ParsedSearch => ({ ok: false, error: `Invalid ${what}` });
  const pick = (key: string, allowed: Set<string>) => {
    const v = sp.get(key);
    if (!v) return { ok: true as const, value: undefined };
    return allowed.has(v) ? { ok: true as const, value: v } : { ok: false as const };
  };
  const text = (key: string) => {
    const v = sp.get(key)?.trim();
    return v ? v.slice(0, MAX_TEXT) : undefined;
  };

  const type = pick("type", TYPES);
  if (!type.ok) return bad("type");
  const race = pick("race", RACES);
  if (!race.ok) return bad("race");
  const attribute = pick("attribute", ATTRIBUTES);
  if (!attribute.ok) return bad("attribute");
  const banlist = pick("banlist", BANLIST);
  if (!banlist.ok) return bad("banlist");
  const frameType = pick("frameType", FRAME_TYPES);
  if (!frameType.ok) return bad("frameType");
  const sort = pick("sort", SORTS);
  if (!sort.ok) return bad("sort");

  const level = sp.get("level") ? whole(sp.get("level"), 0, 13, 0) : undefined;
  if (level === null) return bad("level");
  const num = whole(sp.get("num"), 1, MAX_RESULTS, 60);
  if (num === null) return bad("num");
  const offset = whole(sp.get("offset"), 0, MAX_OFFSET, 0);
  if (offset === null) return bad("offset");

  return {
    ok: true,
    filters: {
      name: text("name"),
      type: type.value,
      race: race.value,
      attribute: attribute.value as SearchFilters["attribute"],
      level,
      archetype: text("archetype"),
      banlist: banlist.value as SearchFilters["banlist"],
      frameType: frameType.value as SearchFilters["frameType"],
      sort: (sort.value ?? "name") as SearchFilters["sort"],
      num,
      offset,
    },
  };
}
