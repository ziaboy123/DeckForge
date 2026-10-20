import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cardDataCheckForTests, getCardIndex, resetCardDataForTests } from "@/lib/cardData";
import { getArchetypes, getCardsByIds, searchCards } from "@/lib/ygoprodeck";

// YGOPRODeck stand-in: answers the calls DeckForge makes and records each one
let calls: string[] = [];
let dbVersion = "100.1";
let cardCount = 6000;
let failCardinfo = false;

function fakeCards(n: number, prefix = "Card") {
  return Array.from({ length: n }, (_, i) => ({
    id: 1000 + i,
    name: `${prefix} ${String(i).padStart(5, "0")}`,
    type: i % 2 ? "Effect Monster" : "Spell Card",
    frameType: i % 2 ? "effect" : "spell",
    desc: "Text.",
    race: i % 2 ? "Dragon" : "Normal",
    archetype: i % 10 === 0 ? "Tenth" : undefined,
    card_prices: [{ tcgplayer_price: "1.00" }],
    card_images: [{ id: 1000 + i, image_url: `https://images.ygoprodeck.com/images/cards/${1000 + i}.jpg` }],
  }));
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const realFetch = globalThis.fetch;
let dir = "";

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "deckforge-cards-"));
  process.env.CARD_DATA_DIR = dir;
  calls = [];
  dbVersion = "100.1";
  cardCount = 6000;
  failCardinfo = false;
  resetCardDataForTests();
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.pathname.replace("/api/v7/", "") + url.search);
    if (url.pathname.endsWith("/checkDBVer.php")) return json([{ database_version: dbVersion, last_update: "2026-10-16 16:01:51" }]);
    if (url.pathname.endsWith("/archetypes.php")) return json([{ archetype_name: "Tenth" }, { archetype_name: "Another" }]);
    if (url.pathname.endsWith("/cardinfo.php")) {
      if (failCardinfo) return new Response("down", { status: 500 });
      // a live search (the fallback) asks with parameters; the full download asks without any
      if (url.search) return json({ data: fakeCards(2, "Live") });
      return json({ data: fakeCards(cardCount, `v${dbVersion}`) });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  rmSync(dir, { recursive: true, force: true });
});

test("the first load downloads the whole database once, saves it, and searches it locally", async () => {
  const index = await getCardIndex(10_000);
  assert.ok(index);
  assert.equal(index.version, "100.1");
  assert.equal(index.cards.length, 6000);
  assert.deepEqual(calls, ["checkDBVer.php", "cardinfo.php", "archetypes.php"]);

  // saved, cut down (no prices or YGOPRODeck image links)
  const saved = readFileSync(path.join(dir, "cards.json"), "utf8");
  assert.ok(!saved.includes("ygoprodeck.com") && !saved.includes("tcgplayer_price"));
  assert.equal(JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8")).version, "100.1");

  // searches, lookups and archetypes now come from memory, not YGOPRODeck
  calls = [];
  const { data } = await searchCards({ name: "00042" });
  assert.deepEqual(data.map((c) => c.id), [1042]);
  assert.deepEqual((await getCardsByIds([1001, 1002, 999_999])).map((c) => c.id), [1001, 1002]);
  assert.deepEqual(await getArchetypes(), ["Another", "Tenth"]);
  assert.deepEqual(calls, []);
});

test("after a restart the saved copy is read from disk without calling YGOPRODeck", async () => {
  await getCardIndex(10_000);
  resetCardDataForTests();
  calls = [];
  const index = await getCardIndex(10_000);
  assert.equal(index?.cards.length, 6000);
  await cardDataCheckForTests();
  assert.deepEqual(calls, []); // checked less than a day ago, so not even the version check
});

test("once a day it checks the version and downloads again only when there's a new one", async () => {
  await getCardIndex(10_000);
  const metaFile = path.join(dir, "meta.json");
  const checkedTwoDaysAgo = () => {
    const meta = JSON.parse(readFileSync(metaFile, "utf8"));
    writeFileSync(metaFile, JSON.stringify({ ...meta, checkedAt: new Date(Date.now() - 2 * 86_400_000).toISOString() }));
    resetCardDataForTests();
  };

  // same version: just the check
  checkedTwoDaysAgo();
  calls = [];
  await getCardIndex(10_000);
  await cardDataCheckForTests();
  assert.deepEqual(calls, ["checkDBVer.php"]);
  assert.ok(Date.now() - Date.parse(JSON.parse(readFileSync(metaFile, "utf8")).checkedAt) < 60_000);

  // a new version: downloaded and swapped in, while the old copy kept answering
  checkedTwoDaysAgo();
  dbVersion = "100.2";
  calls = [];
  const before = await getCardIndex(10_000);
  assert.equal(before?.version, "100.1");
  await cardDataCheckForTests();
  assert.deepEqual(calls, ["checkDBVer.php", "cardinfo.php", "archetypes.php"]);
  const after = await getCardIndex(10_000);
  assert.equal(after?.version, "100.2");
  assert.ok(after?.cards[0].name.startsWith("v100.2"));
  assert.equal(JSON.parse(readFileSync(path.join(dir, "cards.json"), "utf8")).version, "100.2");

  // and not again the same day
  calls = [];
  await getCardIndex(10_000);
  await cardDataCheckForTests();
  assert.deepEqual(calls, []);
});

test("a failed update check keeps the copy it has", async () => {
  await getCardIndex(10_000);
  const metaFile = path.join(dir, "meta.json");
  writeFileSync(metaFile, JSON.stringify({ version: "100.1", checkedAt: "2000-01-01T00:00:00Z" }));
  resetCardDataForTests();
  dbVersion = "100.2";
  failCardinfo = true;
  const index = await getCardIndex(10_000);
  await cardDataCheckForTests();
  assert.equal((await getCardIndex(10_000))?.version, "100.1");
  assert.equal(index?.cards.length, 6000);
});

test("if the first download fails, the live API answers instead and the download isn't retried straight away", async () => {
  failCardinfo = true;
  assert.equal(await getCardIndex(10_000), null);
  assert.equal(existsSync(path.join(dir, "cards.json")), false);

  failCardinfo = false;
  calls = [];
  const { data } = await searchCards({ name: "dragon" });
  assert.deepEqual(data.map((c) => c.name), ["Live 00000", "Live 00001"]);
  assert.ok(!JSON.stringify(data).includes("ygoprodeck.com")); // live answers are cut down the same way
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^cardinfo\.php\?fname=dragon&/);
});

test("a download with too few cards is refused", async () => {
  cardCount = 10;
  assert.equal(await getCardIndex(10_000), null);
  assert.equal(existsSync(path.join(dir, "cards.json")), false);
});

test("an unreadable or out-of-date saved copy is downloaded again", async () => {
  writeFileSync(path.join(dir, "cards.json"), "{ not json");
  assert.equal((await getCardIndex(10_000))?.cards.length, 6000);

  resetCardDataForTests();
  writeFileSync(path.join(dir, "cards.json"), JSON.stringify({ format: 0, version: "1", cards: [] }));
  calls = [];
  assert.equal((await getCardIndex(10_000))?.cards.length, 6000);
  assert.ok(calls.includes("cardinfo.php"));
});
