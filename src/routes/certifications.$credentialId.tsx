import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { PdfDownloadButton, PdfPreviewPane } from "@/components/credential-pdf";
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
              <PdfDownloadButton
                url={credential.url}
                fileName={fileName}
                label="Download certificate (PDF)"
                expectedBytes={credential.fileSize}
                metaLine={fileMeta || undefined}
              />
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
          <PdfPreviewPane
            url={credential.url}
            title={credential.name}
            fileName={fileName}
            expectedBytes={credential.fileSize}
          />
        )}
      </article>
    </Shell>
  );
}