import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAuditEvents, verifyAuditChain, currentUserIsAdmin } from "@/lib/audit.functions";
import { AUDIT_ACTIONS, AUDIT_OUTCOMES, type AuditEvent } from "@/lib/audit-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log | Portfolio Admin" },
      { name: "description", content: "Tamper-evident audit log for privileged portfolio actions." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Audit log | Portfolio Admin" },
      { property: "og:description", content: "Tamper-evident audit log for privileged actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [action, setAction] = useState<string>("");
  const [outcome, setOutcome] = useState<string>("");
  const [q, setQ] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [chain, setChain] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const role = useQuery({ queryKey: ["is-admin"], queryFn: () => currentUserIsAdmin() });

  const filter = useMemo(
    () => ({
      ...(action ? { action: [action] } : {}),
      ...(outcome ? { outcome: [outcome as (typeof AUDIT_OUTCOMES)[number]] } : {}),
      ...(q ? { q } : {}),
      ...(cursors.length ? { cursor: cursors[cursors.length - 1] } : {}),
      limit: 50,
    }),
    [action, outcome, q, cursors],
  );

  const events = useQuery({
    queryKey: ["audit", filter],
    queryFn: () => listAuditEvents({ data: filter }),
    enabled: role.data?.isAdmin === true,
  });

  async function download() {
    setExporting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (outcome) params.set("outcome", outcome);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/audit/export?${params}`, {
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      });
      if (!res.ok) {
        throw new Error(describeAdminFailure(res.status, res.headers.get("retry-after")));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-export.json.gz";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setChain(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (role.isLoading) return <Shell>Checking permissions…</Shell>;
  if (!role.data?.isAdmin) return <Shell>Administrator access required.</Shell>;

  const rows = (events.data?.events ?? []) as AuditEvent[];

  return (
    <Shell>
      <h1 className="text-2xl font-semibold text-foreground">Audit log</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <select
          aria-label="Filter by action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setCursors([]);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by outcome"
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setCursors([]);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All outcomes</option>
          {AUDIT_OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          aria-label="Search actor, resource or action"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursors([]);
          }}
          placeholder="Search…"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={download}
          disabled={exporting}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          {exporting ? "Exporting…" : "Export (.json.gz)"}
        </button>
        <button
          onClick={async () => {
            setChain("Verifying…");
            try {
              const res = await verifyAuditChain({ data: { fromId: 0 } });
              setChain(
                res.ok
                  ? `Chain intact — ${res.checked} records verified.`
                  : `Tampering detected at record ${res.first_bad_id}.`,
              );
            } catch {
              setChain("Verification failed.");
            }
          }}
          className="rounded-md border border-input px-3 py-2 text-sm"
        >
          Verify chain
        </button>
      </div>
      {chain ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {chain}
        </p>
      ) : null}

      {events.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading events…</p> : null}
      {events.isError ? (
        <p className="mt-6 text-sm text-destructive">Unable to load audit events.</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(row.occurred_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{row.actor_email ?? "—"}</td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="px-3 py-2">
                  {row.resource_type}
                  {row.resource_id ? `:${row.resource_id}` : ""}
                </td>
                <td className="px-3 py-2">{row.outcome}</td>
              </tr>
            ))}
            {!rows.length && !events.isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No audit events match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          disabled={!cursors.length}
          onClick={() => setCursors((c) => c.slice(0, -1))}
          className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={!events.data?.nextCursor}
          onClick={() =>
            setCursors((c) => (events.data?.nextCursor ? [...c, events.data.nextCursor] : c))
          }
          className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>;
}