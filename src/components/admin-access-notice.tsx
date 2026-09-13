/**
 * Actionable guidance for a caller who is signed in but not an administrator,
 * or whose privileged request came back 403 / 429.
 *
 * When the database reports that no administrator exists yet, the notice also
 * offers the one-time bootstrap claim. The button only asks — the database
 * decides, and records the attempt in the audit log either way.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBootstrapAvailable, claimAdminBootstrap } from "@/lib/admin-bootstrap.functions";

/** Maps a failed privileged response to guidance the operator can act on. */
export function describeAdminFailure(status: number, retryAfter?: string | null): string {
  if (status === 401) return "Your session expired. Sign in again to continue.";
  if (status === 403)
    return "Administrator access required. This account is signed in but has no admin role — ask an existing administrator to grant it, or use first-run setup if no administrator exists yet.";
  if (status === 429)
    return `Too many requests. Wait ${retryAfter ?? "60"} seconds before retrying; this endpoint is rate limited to protect the audit store.`;
  if (status === 413) return "The file is larger than this endpoint accepts (20 MB maximum).";
  return `Request failed (${status}).`;
}

export function AdminAccessNotice({ email }: { email?: string | null }) {
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const bootstrap = useQuery({
    queryKey: ["admin-bootstrap-available"],
    queryFn: () => adminBootstrapAvailable(),
  });

  async function claim() {
    setClaiming(true);
    setMessage(null);
    try {
      const result = await claimAdminBootstrap();
      if (result.granted) {
        setMessage("Administrator role granted and recorded in the audit log.");
        await queryClient.invalidateQueries();
      } else {
        setMessage(
          "Setup is already complete — an administrator exists. Ask them to grant you access.",
        );
      }
    } catch {
      setMessage("Could not complete setup. Try again in a moment.");
    } finally {
      setClaiming(false);
      void bootstrap.refetch();
    }
  }

  return (
    <section
      aria-labelledby="admin-access-heading"
      className="mx-auto max-w-xl rounded-xl border border-border bg-card/60 p-6"
    >
      <h1 id="admin-access-heading" className="text-lg font-semibold text-foreground">
        Administrator access required
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {email ? <>Signed in as {email}. </> : null}
        This console reads the tamper-evident audit log and certificate integrity records, so it is
        limited to accounts holding the administrator role.
      </p>

      <h2 className="mt-5 text-sm font-medium text-foreground">How to request access</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Ask an existing administrator to grant your account the admin role.</li>
        <li>They can confirm the grant in the audit log — every role change is recorded.</li>
        <li>Reload this page once the role is granted; no sign-out is needed.</li>
      </ol>

      {bootstrap.data?.available ? (
        <div className="mt-5 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm text-foreground">
            No administrator exists yet. You can complete first-run setup and claim the role for
            this account. This is possible exactly once and is written to the audit log.
          </p>
          <button
            type="button"
            onClick={claim}
            disabled={claiming}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {claiming ? "Setting up…" : "Grant me administrator access"}
          </button>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {message}
      </p>
    </section>
  );
}
