import { RateLimiter, clientIp, shared, tooManyRequests } from "@/lib/rateLimit";

// Card searches and lookups per signed-in user, and per visitor address (so a pile of new accounts doesn't get
// round it). Generous enough for typing and a full deck-list import (one search per line), tight enough that
// nobody can hog the server, or (while there's no local copy of the card data) the YGOPRODeck budget.
const cardLookupsPerUser = shared("cardLookupsPerUser", () => new RateLimiter(150, 60_000));
const cardLookupsPerIp = shared("cardLookupsPerIp", () => new RateLimiter(300, 60_000));

function firstBlocked(userId: string, ip: string) {
  return [cardLookupsPerUser.hit(userId), cardLookupsPerIp.hit(ip)].find((r) => !r.ok);
}

/** Counts one card search/lookup; gives back a 429 response when this user or address has had too many. */
export function cardLookupLimit(req: Request, userId: string, extra: Record<string, unknown> = {}) {
  const blocked = firstBlocked(userId, clientIp(req.headers));
  return blocked ? tooManyRequests("Too many card searches. Wait a moment and try again.", blocked.retryAfterMs, extra) : null;
}

/** Same count, for pages: true while this user and address still have lookups left this minute. */
export function cardLookupAllowed(userId: string, ip: string) {
  return !firstBlocked(userId, ip);
}
