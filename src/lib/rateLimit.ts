// Attempt limits kept in memory. DeckForge runs as a single PM2 process, so a Map is enough (it empties on restart).

// Next builds the API routes and the pages into separate bundles, so a plain module-level Map would
// exist once per bundle and every limit or cache would quietly count twice. Keeping them on globalThis
// means one copy for the whole process (same trick as db.ts uses for Prisma).
export function shared<T>(name: string, make: () => T): T {
  const g = globalThis as unknown as Record<string, unknown>;
  const key = `__deckforge_${name}`;
  if (!(key in g)) g[key] = make();
  return g[key] as T;
}

// what authorize() throws when a limit is hit; the login forms check for it to show a "slow down" message
export const TOO_MANY_ATTEMPTS = "TooManyAttempts";

// the address the request really came from, stamped on every request by src/instrumentation.ts
export const PEER_HEADER = "x-deckforge-peer";

type Bucket = { count: number; resetAt: number };
export type LimitResult = { ok: boolean; retryAfterMs: number };

/** Allows `limit` hits per key in each `windowMs` window. */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private limit: number;
  private windowMs: number;
  private maxKeys: number;

  constructor(limit: number, windowMs: number, maxKeys = 20_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  private bucket(key: string, now: number): Bucket | undefined {
    const b = this.buckets.get(key);
    if (b && b.resetAt <= now) {
      this.buckets.delete(key);
      return undefined;
    }
    return b;
  }

  /** Whether the key is still under its limit, without counting anything. */
  check(key: string, now = Date.now()): LimitResult {
    const b = this.bucket(key, now);
    return b && b.count >= this.limit ? { ok: false, retryAfterMs: b.resetAt - now } : { ok: true, retryAfterMs: 0 };
  }

  /** Counts one go for the key and says whether it's still within the limit. */
  hit(key: string, now = Date.now()): LimitResult {
    let b = this.bucket(key, now);
    if (!b) {
      if (this.buckets.size >= this.maxKeys) this.prune(now);
      b = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, b);
    }
    b.count++;
    return b.count <= this.limit ? { ok: true, retryAfterMs: 0 } : { ok: false, retryAfterMs: b.resetAt - now };
  }

  reset(key: string) {
    this.buckets.delete(key);
  }

  // drop finished windows; if someone floods it with new keys anyway, drop the oldest so memory stays bounded
  private prune(now: number) {
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
    for (const k of this.buckets.keys()) {
      if (this.buckets.size < this.maxKeys) break;
      this.buckets.delete(k);
    }
  }
}

type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined | null;

function header(h: HeaderSource, name: string): string | undefined {
  if (!h) return undefined;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name) ?? undefined;
  const v = (h as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(v) ? v[0] : v;
}

const isLoopback = (ip: string) => ip === "::1" || /^(::ffff:)?127\./.test(ip);
const looksLikeIp = (s: string) => /^[0-9a-f:.]{2,45}$/i.test(s) && /[.:]/.test(s);

// IPv6 visitors usually get a whole /64, so count them by that rather than by single address
function bucketFor(ip: string): string {
  const v4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4) return v4[1];
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const front = head ? head.split(":") : [];
  const back = ip.includes("::") && tail ? tail.split(":") : [];
  const groups = [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back];
  return groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

let warnedNoPeer = false;

/**
 * Who's asking, for rate limits. Production is Cloudflare -> nginx (on this box) -> Next, so when the request came
 * from loopback the visitor is in CF-Connecting-IP; from anywhere else that header could be made up, so the socket
 * address is used instead.
 */
export function clientIp(h: HeaderSource): string {
  const peer = header(h, PEER_HEADER)?.trim();
  const cf = header(h, "cf-connecting-ip")?.trim();
  if (!peer) {
    // shouldn't happen (instrumentation stamps every request); better a fakeable key than one bucket for everyone
    if (!warnedNoPeer) {
      warnedNoPeer = true;
      console.warn("[rate-limit] request had no peer address; is src/instrumentation.ts running?");
    }
    return cf && looksLikeIp(cf) ? bucketFor(cf) : "unknown";
  }
  if (isLoopback(peer) && cf && looksLikeIp(cf)) return bucketFor(cf);
  return bucketFor(peer);
}

export function tooManyRequests(message: string, retryAfterMs: number, extra: Record<string, unknown> = {}) {
  return Response.json(
    { error: message, ...extra },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) } }
  );
}
