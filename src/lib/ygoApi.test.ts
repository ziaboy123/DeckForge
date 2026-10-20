import { test } from "node:test";
import assert from "node:assert/strict";
import { UpstreamBusyError, waitForUpstreamSlot } from "@/lib/ygoApi";

test("the YGOPRODeck queue lets a burst of 6 through, then spaces calls out and turns away long waits", async () => {
  const t0 = Date.now() + 60_000; // well clear of anything else this process has queued
  for (let i = 0; i < 6; i++) await waitForUpstreamSlot(0, t0); // the burst: no waiting
  // the 7th would have to wait a sixth of a second, more than it's willing to
  await assert.rejects(waitForUpstreamSlot(0, t0), UpstreamBusyError);
  // a turned-away call doesn't take a place: one willing to wait gets that slot
  const started = Date.now();
  await waitForUpstreamSlot(1_000, t0);
  const waited = Date.now() - started;
  assert.ok(waited >= 150 && waited < 1_000, `waited ${waited}ms`);
});
