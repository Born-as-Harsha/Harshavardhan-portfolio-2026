/**
 * Fixed-window rate limiter — pure, injectable, unit-testable.
 *
 * The store is a plain Map so the limiter can be exercised deterministically in
 * tests (`now` and `store` are both injectable). In production each serverless
 * isolate keeps its own window, which is a best-effort abuse brake rather than
 * a global quota; the authoritative protections remain auth + RBAC + row caps.
 */

export type RateLimitPolicy = {
  /** Maximum requests allowed inside one window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds when the current window ends. */
  resetAt: number;
  /** Whole seconds the caller should wait; 0 when allowed. */
  retryAfterSeconds: number;
};

type Bucket = { count: number; resetAt: number };

export type RateLimitStore = Map<string, Bucket>;

/** Policies for the privileged endpoints. Tuned for a single-admin console. */
export const RATE_LIMITS = {
  /** Exports are heavy: a handful per minute is plenty for a human operator. */
  auditExport: { limit: 5, windowMs: 60_000 } satisfies RateLimitPolicy,
  /** Uploads hash the whole body server-side, so keep the ceiling modest. */
  certificateValidate: { limit: 20, windowMs: 60_000 } satisfies RateLimitPolicy,
} as const;

const defaultStore: RateLimitStore = new Map();

/** Drops expired buckets so a long-lived isolate cannot grow unbounded. */
function sweep(store: RateLimitStore, now: number): void {
  if (store.size < 1000) return;
  for (const [key, bucket] of store) if (bucket.resetAt <= now) store.delete(key);
}

/**
 * Consumes one token for `key`. Calling it is the decision — a blocked call
 * does not increment further, so a hammering client cannot extend its own ban.
 */
export function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
  options: { now?: number; store?: RateLimitStore } = {},
): RateLimitDecision {
  const now = options.now ?? Date.now();
  const store = options.store ?? defaultStore;
  sweep(store, now);

  const existing = store.get(key);
  const bucket =
    existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + policy.windowMs };

  if (bucket.count >= policy.limit) {
    store.set(key, bucket);
    return {
      allowed: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return {
    allowed: true,
    limit: policy.limit,
    remaining: policy.limit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

/** Standard response headers describing the caller's remaining quota. */
export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    "x-ratelimit-limit": String(decision.limit),
    "x-ratelimit-remaining": String(decision.remaining),
    "x-ratelimit-reset": String(Math.ceil(decision.resetAt / 1000)),
  };
  if (!decision.allowed) headers["retry-after"] = String(decision.retryAfterSeconds);
  return headers;
}

/** Test seam: forget every window. */
export function resetRateLimits(store: RateLimitStore = defaultStore): void {
  store.clear();
}
