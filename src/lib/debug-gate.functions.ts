import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Backend gate for the telemetry/debug panel.
 *
 * A query param can never enable the panel in production. The client sends an
 * opaque token of the form `<expiryEpochSeconds>.<hexHmac>`; only this handler
 * knows DEBUG_PANEL_SECRET, so tokens can't be forged in the browser. Mint one
 * for an operator with:
 *
 *   exp=$(( $(date +%s) + 3600 ))
 *   sig=$(printf "%s" "$exp" | openssl dgst -sha256 -hmac "$DEBUG_PANEL_SECRET" -hex | awk '{print $2}')
 *   echo "$exp.$sig"
 *
 * Every decision is written to the server log as a structured audit record.
 */
export const verifyDebugToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; route?: string }) => ({
    token: String(input?.token ?? "").slice(0, 256),
    route: String(input?.route ?? "").slice(0, 256),
  }))
  .handler(async ({ data }) => {
    const secret = process.env["DEBUG_PANEL_SECRET"];
    const { tryWriteAuditEvent } = await import("./audit.server");
    // Persisted to the tamper-evident audit log. The token itself is never
    // stored — only a short non-reversible prefix for correlation.
    const audit = async (allowed: boolean, reason: string) => {
      await tryWriteAuditEvent({
        action: "debug_gate.verify",
        resourceType: "debug_panel",
        outcome: allowed ? "allow" : "deny",
        resourceId: data.route || null,
        context: { reason, tokenPrefix: data.token.slice(0, 8) },
      });
      return { allowed, reason };
    };

    if (!secret) return await audit(false, "gate_unconfigured");

    const [expRaw, sig] = data.token.split(".");
    const exp = Number(expRaw);
    if (!expRaw || !sig || !Number.isFinite(exp)) return await audit(false, "malformed_token");
    if (exp * 1000 < Date.now()) return await audit(false, "expired");

    const expected = createHmac("sha256", secret).update(expRaw).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(sig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return await audit(false, "bad_signature");

    return await audit(true, "ok");
  });