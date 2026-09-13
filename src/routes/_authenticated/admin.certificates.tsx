import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sha256Of, type ValidationResult } from "@/lib/cert-upload-validation";
import { describeAdminFailure } from "@/components/admin-access-notice";

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  head: () => ({
    meta: [
      { title: "Certificate integrity | Portfolio Admin" },
      {
        name: "description",
        content: "Upload and verify certificate PDFs against pinned checksums.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Certificate integrity | Portfolio Admin" },
      { property: "og:description", content: "Verify certificate PDFs against pinned checksums." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const [assetId, setAssetId] = useState("");
  const [digest, setDigest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function pick(selected: File | null) {
    setFile(selected);
    setResult(null);
    setError(null);
    setDigest(selected ? await sha256Of(await selected.arrayBuffer()) : null);
  }

  async function submit() {
    if (!file || !digest) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("clientSha256", digest);
      if (assetId) form.set("assetId", assetId);
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/certificates/validate", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: form,
      });
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        setError(describeAdminFailure(res.status, res.headers.get("retry-after")));
        return;
      }
      const body = (await res.json()) as ValidationResult;
      setResult(body);
    } catch {
      setError("Validation request failed. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Certificate integrity</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The browser computes a SHA-256 digest for instant feedback; the server recomputes it from
        the received bytes and decides the outcome.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-border p-6">
        <label className="block text-sm text-muted-foreground" htmlFor="assetId">
          Asset UUID (optional)
          <input
            id="assetId"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value.trim())}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
          />
        </label>
        <label className="block text-sm text-muted-foreground" htmlFor="file">
          Certificate PDF
          <input
            id="file"
            type="file"
            accept="application/pdf"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>
        {digest ? (
          <div className="flex items-center gap-2 text-xs">
            <code className="truncate rounded bg-muted px-2 py-1 font-mono">{digest}</code>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(digest)}
              className="rounded-md border border-input px-2 py-1"
            >
              Copy
            </button>
          </div>
        ) : null}
        <button
          onClick={submit}
          disabled={!file || busy}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Validating…" : "Validate upload"}
        </button>

        <div aria-live="polite">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {result?.status === "ok" ? (
            <p className="text-sm text-emerald-500">
              Integrity verified — {result.bytes} bytes, signature: {result.chain}.
            </p>
          ) : null}
          {result?.status === "mismatch" ? (
            <div className="space-y-1 text-sm text-destructive">
              <p>
                <strong>{result.code}</strong> — {result.message}
              </p>
              {result.expected?.sha256 ? (
                <p className="font-mono text-xs">expected {result.expected.sha256}</p>
              ) : null}
              {result.actual?.sha256 ? (
                <p className="font-mono text-xs">received {result.actual.sha256}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}