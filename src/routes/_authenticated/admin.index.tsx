import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollText, ShieldCheck, Users } from "lucide-react";
import { listManagedUsers, setUserRole } from "@/lib/admin-roles.functions";
import { AdminAccessNotice } from "@/components/admin-access-notice";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard | Portfolio Admin" },
      { name: "description", content: "Manage users, roles, certificates and the audit log." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin dashboard | Portfolio Admin" },
      { property: "og:description", content: "Portfolio administration dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

const ROLES = ["admin", "moderator", "user"] as const;

function AdminDashboard() {
  const list = useServerFn(listManagedUsers);
  const change = useServerFn(setUserRole);
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list(), retry: false });

  async function toggle(userId: string, role: (typeof ROLES)[number], grant: boolean) {
    setMsg(null);
    try {
      await change({ data: { userId, role, grant } });
      setMsg(`${grant ? "Granted" : "Revoked"} ${role}. Recorded in the audit log.`);
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Role change failed");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Admin dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every action here is checked server-side and written to the tamper-evident audit log.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/admin/audit" className="glass rounded-2xl p-5 hover:border-primary/40">
          <ScrollText className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="mt-2 font-semibold">Audit log</div>
          <p className="text-sm text-muted-foreground">Filter, verify the chain, export NDJSON.</p>
        </Link>
        <Link to="/admin/certificates" className="glass rounded-2xl p-5 hover:border-primary/40">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="mt-2 font-semibold">Certificate upload & validation</div>
          <p className="text-sm text-muted-foreground">
            Upload a PDF, compare SHA-256 against the pinned digest.
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" /> Users & roles
        </h2>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">{msg}</p>
        {users.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : users.isError ? (
          <AdminAccessNotice />
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Joined</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-2">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.data?.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-3 py-2">{u.email ?? u.id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.createdAt.slice(0, 10)}</td>
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <td key={r} className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={has}
                            aria-label={`${r} role for ${u.email ?? u.id}`}
                            onChange={() => void toggle(u.id, r, !has)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
