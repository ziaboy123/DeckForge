import { shared } from "@/lib/rateLimit";

// Talking to YGOPRODeck's API. Day to day DeckForge works from its own copy of the card data (see cardData.ts), so
// the only calls left are that copy's download and daily version check, plus live lookups while there's no copy yet.

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

// Every call to YGOPRODeck (downloads, version checks, live searches and lookups) waits its turn in one queue that
// lets out at most 6 a second (after a burst of 6), well under its limit of 20 a second. Going over that gets the
// server blocked for an hour, which would break card data on every page. Calls go in the order they arrived, and one
// that would have to wait longer than it's willing to gives up straight away (without taking a place in the queue).
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
export const SEARCH_WAIT_MS = 5_000;
export const PAGE_WAIT_MS = 8_000;

export async function apiFetchText(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  maxWaitMs = SEARCH_WAIT_MS,
  timeoutMs = 15_000 // don't leave pages hanging if YGOPRODeck stops answering
): Promise<string> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  await waitForUpstreamSlot(maxWaitMs);
  // no Next fetch cache: the local copy and the caches in ygoprodeck.ts do that job
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    await res.body?.cancel();
    throw new YgoApiError(res.status);
  }

  return res.text();
}
