import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  formatFileSize,
  getCredential,
  PROFILE,
  type CredentialRecord,
} from "@/lib/resume-data";

export const Route = createFileRoute("/certifications/$credentialId")({
  loader: ({ params }) => {
    const credential = getCredential(params.credentialId);
    if (!credential) throw notFound();
    return { credential };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Credential not found — Yelleti Harshavardhan" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { credential } = loaderData;
    const title = `${credential.name} — ${credential.issuer} | ${PROFILE.name}`;
    const description = `Verify the ${credential.name} credential issued by ${credential.issuer} to ${PROFILE.name}${
      credential.credentialId ? ` (ID ${credential.credentialId})` : ""
    }.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CredentialNotFound,
  component: CredentialPage,
});

function CredentialJsonLd({ credential }: { credential: CredentialRecord }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: credential.name,
    credentialCategory: "certificate",
    ...(credential.credentialId ? { identifier: credential.credentialId } : {}),
    ...(credential.issueDate ? { dateCreated: credential.issueDate } : {}),
    ...(credential.url ? { url: credential.url } : {}),
    recognizedBy: {
      "@type": "Organization",
      name: credential.issuer,
      ...(credential.issuerUrl ? { url: credential.issuerUrl } : {}),
    },
    about: {
      "@type": "Person",
      name: PROFILE.name,
      sameAs: [PROFILE.github, PROFILE.linkedin, PROFILE.orcid],
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-5 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/"
          hash="certs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to certifications
        </Link>
        {children}
      </div>
    </div>
  );
}

function CredentialNotFound() {
  return (
    <Shell>
      <h1 className="mt-8 text-2xl font-bold text-foreground">Credential not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This credential ID doesn’t match any certificate on record.
      </p>
    </Shell>
  );
}

function PdfPreview({ credential, fileName }: { credential: CredentialRecord; fileName: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // <object> fires no reliable error event for PDFs; treat a slow load as a failure.
    timer.current = setTimeout(() => setStatus((s) => (s === "loading" ? "error" : s)), 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Certificate preview
        </h2>
        {status === "loading" && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </span>
        )}
      </div>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-muted">
        {status === "error" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden />
            <p className="text-sm font-semibold text-foreground/90">Preview unavailable</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              This browser couldn’t display the PDF inline. Download the file or open the original
              to verify the credential.
            </p>
            <a
              href={credential.url}
              download={fileName}
              className="mt-1 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/90 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Download className="h-3.5 w-3.5" /> Download instead
            </a>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
                <p className="text-xs text-muted-foreground">Loading certificate preview…</p>
              </div>
            )}
            <object
              data={credential.url}
              type="application/pdf"
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
              className="h-[60vh] w-full"
              aria-label={`${credential.name} certificate PDF`}
            >
              <div className="p-6 text-sm text-muted-foreground">
                Your browser can’t display PDFs inline. Use the download button above.
              </div>
            </object>
          </>
        )}
      </div>
    </div>
  );
}

function CredentialPage() {
  const { credential } = Route.useLoaderData();
  const fileName = `${credential.slug}.pdf`;
  const fileMeta = [
    credential.fileSize ? formatFileSize(credential.fileSize) : null,
    credential.fileUpdatedAt
      ? `updated ${new Date(credential.fileUpdatedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Shell>
      <CredentialJsonLd credential={credential} />
      <article className="glass mt-6 rounded-3xl p-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3 w-3" /> Verified credential
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-snug text-foreground">{credential.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Issued to {PROFILE.name}</p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Issuer
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground/90">
              {credential.issuerUrl ? (
                <a
                  href={credential.issuerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {credential.issuer} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                credential.issuer
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Issue date
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground/90">
              {credential.issueDate ? (
                <time dateTime={credential.issueDate}>{credential.issueDate}</time>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Credential ID
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-foreground/90">
              {credential.credentialId ?? credential.slug}
            </dd>
          </div>
        </dl>

        {credential.url && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {credential.isPdf ? (
              <a
                href={credential.url}
                download={fileName}
                aria-label={`Download ${credential.name} certificate as PDF${
                  fileMeta ? ` (${fileMeta})` : ""
                }`}
                className="inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="text-left leading-tight">
                  Download certificate (PDF)
                  {fileMeta && (
                    <span className="block font-mono text-[10px] font-normal opacity-80">
                      {fileMeta}
                    </span>
                  )}
                </span>
              </a>
            ) : null}
            <a
              href={credential.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground/90 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              View original <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {credential.isPdf && credential.url && (
          <PdfPreview credential={credential} fileName={fileName} />
        )}
      </article>
    </Shell>
  );
}