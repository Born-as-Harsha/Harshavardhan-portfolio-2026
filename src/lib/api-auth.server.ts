/**
 * Bearer-token authentication + admin RBAC for raw HTTP server routes.
 *
 * TanStack `createServerFn` middleware does not run for `src/routes/api/*`
 * handlers, so every raw route authenticates the caller itself through this
 * helper. It validates the JWT against Supabase Auth (`getClaims`) and then
 * re-checks the role server-side with the `has_role()` security-definer
 * function — the client is never trusted for either step.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthedCaller = {
  supabase: SupabaseClient<Database>;
  userId: string;
  email: string | null;
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
    /** Extra response headers, e.g. `retry-after` on a 429. */
    readonly headers: Record<string, string> = {},
  ) {
    super(message ?? code);
  }
}

/** Generic, non-leaky JSON error body. Never includes stack traces. */
export function jsonError(error: unknown): Response {
  const err =
    error instanceof HttpError ? error : new HttpError(500, "internal_error", "Unexpected error");
  if (!(error instanceof HttpError)) {
    console.error("[api] unhandled", error instanceof Error ? error.message : "unknown");
  }
  return Response.json(
    { error: err.code, message: err.message },
    { status: err.status, headers: { ...SECURITY_HEADERS, ...err.headers } },
  );
}

/**
 * Rejects a request that declares (or turns out to carry) more bytes than the
 * endpoint accepts, before anything is buffered into memory.
 */
export function assertRequestSize(request: Request, maxBytes: number): void {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, "E_SIZE", "The request body is larger than this endpoint accepts.");
  }
}

/**
 * Applies a fixed-window quota. Keyed by authenticated user when known so one
 * abusive account cannot exhaust everyone's budget, otherwise by client IP.
 */
export function enforceRateLimit(
  request: Request,
  bucket: string,
  policy: RateLimitPolicy,
  identity?: string | null,
): Record<string, string> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const decision = consumeRateLimit(`${bucket}:${identity ?? `ip:${ip}`}`, policy);
  const headers = rateLimitHeaders(decision);
  if (!decision.allowed) {
    throw new HttpError(
      429,
      "rate_limited",
      "Too many requests. Wait a moment and try again.",
      headers,
    );
  }
  return headers;
}

export const SECURITY_HEADERS: Record<string, string> = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
};

function isOpaqueKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/**
 * Builds a request-scoped Supabase client that acts as the caller (RLS
 * applies). Opaque `sb_` keys are not JWTs, so they go in `apikey` only.
 */
function callerClient(token: string): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new HttpError(500, "misconfigured", "Backend is not configured");

  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Extracts and verifies the bearer token. Throws 401 for anything invalid. */
export async function requireUser(request: Request): Promise<AuthedCaller> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "unauthorized", "Sign in required");
  const token = header.slice(7).trim();
  // A JWT has three dot-separated parts; anything else (e.g. an API key) is rejected.
  if (!token || token.split(".").length !== 3) {
    throw new HttpError(401, "unauthorized", "Sign in required");
  }

  const supabase = callerClient(token);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new HttpError(401, "unauthorized", "Sign in required");

  return {
    supabase,
    userId: String(data.claims.sub),
    email: typeof data.claims["email"] === "string" ? (data.claims["email"] as string) : null,
  };
}

/** Bearer auth + server-side admin role check. Throws 401 then 403. */
export async function requireAdmin(request: Request): Promise<AuthedCaller> {
  const caller = await requireUser(request);
  const { data, error } = await caller.supabase.rpc("has_role", {
    _user_id: caller.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new HttpError(403, "forbidden", "Administrator access required");
  return caller;
}
