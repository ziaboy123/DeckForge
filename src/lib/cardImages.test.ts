import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getCardImageUrl } from "@/lib/cardImages";

test("card pictures come from Millennium Arena's copies on this site", () => {
  assert.equal(getCardImageUrl(46986414), "/millenniumarena/img/cards/46986414.jpg");
  assert.equal(getCardImageUrl(46986414, "normal"), "/millenniumarena/img/cards/46986414.jpg");
  assert.equal(getCardImageUrl(46986414, "small"), "/millenniumarena/img/small/46986414.jpg");
  assert.equal(getCardImageUrl(46986414, "cropped"), "/millenniumarena/img/cropped/46986414.jpg");
});

test("nothing in the app links to YGOPRODeck's image server", () => {
  const root = path.join(process.cwd(), "src");
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (!entry.name.includes(".test.") && readFileSync(file, "utf8").includes("images.ygoprodeck.com")) offenders.push(file);
    }
  };
  walk(root);
  for (const config of ["next.config.ts"]) {
    if (readFileSync(path.join(process.cwd(), config), "utf8").includes("images.ygoprodeck.com")) offenders.push(config);
  }
  assert.deepEqual(offenders, []);
});
