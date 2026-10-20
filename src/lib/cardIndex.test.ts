import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, cardsByIds, searchIndex, slimCard } from "@/lib/cardIndex";
import { parseSearchParams } from "@/lib/cardSearch";
import type { SearchFilters, YgoCard } from "@/types/yugioh";

// a few cards shaped like YGOPRODeck's cardinfo.php answer (trimmed, but with the fields DeckForge drops)
const RAW = [
  {
    id: 46986414, name: "Dark Magician", type: "Normal Monster", frameType: "normal", desc: "The ultimate wizard.",
    race: "Spellcaster", atk: 2500, def: 2100, level: 7, attribute: "DARK", archetype: "Dark Magician",
    ygoprodeck_url: "https://ygoprodeck.com/card/dark-magician-4003", typeline: ["Spellcaster", "Normal"],
    card_sets: [{ set_name: "Legend of Blue Eyes White Dragon", set_code: "LOB-005" }],
    card_prices: [{ cardmarket_price: "0.10" }],
    card_images: [
      { id: 46986414, image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg" },
      { id: 36996508, image_url: "https://images.ygoprodeck.com/images/cards/36996508.jpg" },
    ],
  },
  { id: 38033121, name: "Dark Magician Girl", type: "Effect Monster", frameType: "effect", desc: "Gains ATK.", race: "Spellcaster", atk: 2000, def: 1700, level: 6, attribute: "DARK", archetype: "Dark Magician", card_images: [{ id: 38033121 }] },
  { id: 89631139, name: "Blue-Eyes White Dragon", type: "Normal Monster", frameType: "normal", desc: "Legendary dragon.", race: "Dragon", atk: 3000, def: 2500, level: 8, attribute: "LIGHT", archetype: "Blue-Eyes", card_images: [{ id: 89631139 }] },
  { id: 40737112, name: "Kuriboh", type: "Effect Monster", frameType: "effect", desc: "Discard this card.", race: "Fiend", atk: 300, def: 200, level: 1, attribute: "DARK", archetype: "Kuriboh", card_images: [{ id: 40737112 }] },
  { id: 33245030, name: "Clear Kuriboh", type: "Effect Monster", frameType: "effect", desc: "Negate.", race: "Fiend", atk: 300, def: 200, level: 1, attribute: "DARK", archetype: "Kuriboh", card_images: [{ id: 33245030 }] },
  { id: 1861629, name: "Decode Talker", type: "Link Monster", frameType: "link", desc: "2+ Effect Monsters.", race: "Cyberse", atk: 2300, def: null, level: null, linkval: 3, linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"], attribute: "DARK", card_images: [{ id: 1861629 }] },
  { id: 55144522, name: "Pot of Greed", type: "Spell Card", frameType: "spell", desc: "Draw 2 cards.", race: "Normal", banlist_info: { ban_tcg: "Forbidden", ban_ocg: "Forbidden" }, card_images: [{ id: 55144522 }] },
  { id: 12580477, name: "Raigeki", type: "Spell Card", frameType: "spell", desc: "Destroy all monsters your opponent controls.", race: "Normal", banlist_info: { ban_tcg: "Limited" }, card_images: [{ id: 12580477 }] },
  { id: 44095762, name: "Mirror Force", type: "Trap Card", frameType: "trap", desc: "Destroy all attack position monsters.", race: "Normal", card_images: [{ id: 44095762 }] },
  { id: 9264485, name: "Evil★Twin Ki-sikil", type: "Effect Monster", frameType: "effect", desc: "Ki-sikil.", race: "Fiend", atk: 1100, def: 1100, level: 2, attribute: "DARK", archetype: "Evil★Twin", card_images: [{ id: 9264485 }] },
  { id: 81167171, name: "Doll Monster Miss Mädchen", type: "Effect Monster", frameType: "effect", desc: "Doll.", race: "Fairy", atk: 1300, def: 1100, level: 4, attribute: "LIGHT", card_images: [{ id: 81167171 }] },
  { id: 75500286, name: "Gaia's Gift", type: "Spell Card", frameType: "spell", desc: "Made up, for the apostrophe test.", race: "Normal", card_images: [{ id: 75500286 }] },
  { id: 9929399, name: "Kuriboh Token", type: "Token", frameType: "token", desc: "Special Summoned with Scapegoat.", race: "Fiend", atk: 0, def: 0, level: 1, attribute: "DARK", card_images: [{ id: 9929399 }] },
];

const cards = RAW.map(slimCard).filter((c): c is YgoCard => c !== null);
const index = buildIndex(cards, ["Kuriboh", "Blue-Eyes", "Dark Magician", "Evil★Twin"], "1.0");
const names = (f: SearchFilters) => searchIndex(index, f).data.map((c) => c.name);

test("slimCard keeps what DeckForge uses and drops the rest", () => {
  const dm = slimCard(RAW[0])!;
  assert.deepEqual(Object.keys(dm).sort(), [
    "archetype", "atk", "attribute", "card_images", "def", "desc", "frameType", "id", "level", "name", "race", "type",
  ]);
  // no links to YGOPRODeck's image server, just each artwork's passcode
  assert.deepEqual(dm.card_images, [{ id: 46986414 }, { id: 36996508 }]);
  assert.ok(!JSON.stringify(cards).includes("ygoprodeck.com"));

  // nulls (a Link Monster's DEF and level) are left out rather than kept as null
  const decode = slimCard(RAW[5])!;
  assert.equal("def" in decode, false);
  assert.equal("level" in decode, false);
  assert.equal(decode.linkval, 3);

  assert.equal(slimCard(null), null);
  assert.equal(slimCard({ name: "No passcode" }), null);
  assert.equal(slimCard({ id: 1.5, name: "Bad passcode" }), null);
  assert.deepEqual(slimCard({ id: 7, name: "No images" })!.card_images, [{ id: 7 }]);
});

test("cards are kept in name order and found by any passcode", () => {
  assert.deepEqual(index.cards.map((c) => c.name).slice(0, 3), ["Blue-Eyes White Dragon", "Clear Kuriboh", "Dark Magician"]);
  assert.equal(index.byId.get(36996508)?.name, "Dark Magician"); // an alternate artwork
  assert.deepEqual(index.archetypes, ["Blue-Eyes", "Dark Magician", "Evil★Twin", "Kuriboh"]);
});

test("archetypes come from the cards when archetypes.php's list is missing", () => {
  assert.deepEqual(buildIndex(cards, null, "1.0").archetypes, ["Blue-Eyes", "Dark Magician", "Evil★Twin", "Kuriboh"]);
});

test("name search ignores case, accents and punctuation", () => {
  assert.deepEqual(names({ name: "dark mag" }), ["Dark Magician", "Dark Magician Girl"]);
  assert.deepEqual(names({ name: "blue eyes" }), ["Blue-Eyes White Dragon"]);
  assert.deepEqual(names({ name: "BLUE-EYES" }), ["Blue-Eyes White Dragon"]);
  assert.deepEqual(names({ name: "evil twin" }), ["Evil★Twin Ki-sikil"]);
  assert.deepEqual(names({ name: "madchen" }), ["Doll Monster Miss Mädchen"]);
  assert.deepEqual(names({ name: "gaias gift" }), ["Gaia's Gift"]);
  assert.deepEqual(names({ name: "gaia's" }), ["Gaia's Gift"]);
  assert.deepEqual(names({ name: "nothing like this" }), []);
});

test("a card whose whole name matches comes first (deck-list imports take the first result)", () => {
  assert.deepEqual(names({ name: "kuriboh" }), ["Kuriboh", "Clear Kuriboh", "Kuriboh Token"]);
  assert.deepEqual(names({ name: "Dark Magician", num: 1 }), ["Dark Magician"]);
  assert.deepEqual(names({ name: "blue eyes white dragon", num: 1 }), ["Blue-Eyes White Dragon"]);
});

test("type filter: Monster means any monster; spells and traps match exactly", () => {
  const monsters = names({ type: "Monster" });
  assert.ok(monsters.includes("Decode Talker") && monsters.includes("Dark Magician"));
  assert.ok(!monsters.includes("Pot of Greed") && !monsters.includes("Mirror Force") && !monsters.includes("Kuriboh Token"));
  assert.deepEqual(names({ type: "Spell Card" }), ["Gaia's Gift", "Pot of Greed", "Raigeki"]);
  assert.deepEqual(names({ type: "Trap Card" }), ["Mirror Force"]);
  assert.deepEqual(names({ type: "Link Monster" }), ["Decode Talker"]);
});

test("race, attribute, level, archetype and frame filters", () => {
  assert.deepEqual(names({ race: "Spellcaster" }), ["Dark Magician", "Dark Magician Girl"]);
  assert.deepEqual(names({ attribute: "LIGHT" }), ["Blue-Eyes White Dragon", "Doll Monster Miss Mädchen"]);
  assert.deepEqual(names({ level: 8 }), ["Blue-Eyes White Dragon"]);
  assert.deepEqual(names({ archetype: "kuriboh" }), ["Clear Kuriboh", "Kuriboh"]);
  assert.deepEqual(names({ frameType: "trap" }), ["Mirror Force"]);
  assert.deepEqual(names({ race: "Fiend", attribute: "DARK", level: 1, type: "Monster" }), ["Clear Kuriboh", "Kuriboh"]);
});

test("banlist filter reads the TCG list (YGOPRODeck calls banned cards Forbidden)", () => {
  assert.deepEqual(names({ banlist: "Banned" }), ["Pot of Greed"]);
  assert.deepEqual(names({ banlist: "Limited" }), ["Raigeki"]);
  assert.deepEqual(names({ banlist: "Semi-Limited" }), []);
  const unlimited = names({ banlist: "Unlimited" });
  assert.equal(unlimited.length, cards.length - 2);
  assert.ok(!unlimited.includes("Pot of Greed") && !unlimited.includes("Raigeki"));
});

test("ATK and DEF filters take a number or lt/lte/gt/gte", () => {
  assert.deepEqual(names({ atk: 2500 }), ["Dark Magician"]);
  assert.deepEqual(names({ atk: "gte2500" }), ["Blue-Eyes White Dragon", "Dark Magician"]);
  assert.deepEqual(names({ atk: "lt300", type: "Monster" }), []);
  assert.deepEqual(names({ def: "gt2000" }), ["Blue-Eyes White Dragon", "Dark Magician"]);
  assert.deepEqual(names({ atk: "nonsense" }), []);
});

test("sorting: ATK, DEF and level highest first with blanks last; id ascending", () => {
  assert.deepEqual(names({ race: "Spellcaster", sort: "atk" }), ["Dark Magician", "Dark Magician Girl"]);
  const byAtk = names({ sort: "atk" });
  assert.equal(byAtk[0], "Blue-Eyes White Dragon");
  assert.deepEqual(byAtk.slice(-4), ["Gaia's Gift", "Mirror Force", "Pot of Greed", "Raigeki"]); // no ATK, in name order
  assert.deepEqual(names({ type: "Monster", sort: "level" }).slice(0, 2), ["Blue-Eyes White Dragon", "Dark Magician"]);
  const ids = searchIndex(index, { sort: "id" }).data.map((c) => c.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
});

test("paging with num and offset", () => {
  const all = names({});
  assert.equal(all.length, cards.length);
  assert.deepEqual(names({ num: 3 }), all.slice(0, 3));
  assert.deepEqual(names({ num: 3, offset: 3 }), all.slice(3, 6));
  assert.deepEqual(names({ offset: 1000 }), []);
  // 60 a page unless asked otherwise, like YGOPRODeck's API
  const many = buildIndex(Array.from({ length: 70 }, (_, i) => slimCard({ id: i + 1, name: `Card ${i}` })!), null, "1");
  assert.equal(searchIndex(many, {}).data.length, 60);
});

test("the search route's query strings give the same results", () => {
  const run = (qs: string) => {
    const parsed = parseSearchParams(new URLSearchParams(qs));
    assert.ok(parsed.ok);
    return searchIndex(index, parsed.filters).data.map((c) => c.name);
  };
  // what the deck builder sends while typing and filtering
  assert.deepEqual(run("name=dark&type=Monster&attribute=DARK&sort=atk&num=60"), ["Dark Magician", "Dark Magician Girl"]);
  // what a deck-list import sends for each line
  assert.deepEqual(run(`name=${encodeURIComponent("Kuriboh")}&num=1`), ["Kuriboh"]);
  assert.deepEqual(run("banlist=Banned&num=60"), ["Pot of Greed"]);
});

test("cardsByIds skips unknown passcodes and gives each card once", () => {
  const found = cardsByIds(index, [46986414, 999, 36996508, 89631139, 46986414]);
  assert.deepEqual(found.map((c) => c.name), ["Dark Magician", "Blue-Eyes White Dragon"]);
  assert.deepEqual(cardsByIds(index, []), []);
});
