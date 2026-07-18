import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import {
  PROFILE,
  EDUCATION,
  SKILLS,
  PROJECTS,
  EXPERIENCE,
  RESEARCH,
  CERTIFICATIONS,
  CODING,
  INTERESTS,
  buildResumeData,
} from "@/lib/resume-data";
import { buildResumePdf, downloadResumePdf } from "@/lib/generate-resume-pdf";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Resume — Yelleti Harshavardhan" },
      {
        name: "description",
        content: "Print-friendly resume of Yelleti Harshavardhan — B.Tech ECE, VLSI / RTL / FPGA.",
      },
      { property: "og:title", content: "Resume — Yelleti Harshavardhan" },
      {
        property: "og:description",
        content: "Print-friendly resume of Yelleti Harshavardhan — B.Tech ECE, VLSI / RTL / FPGA.",
      },
    ],
    links: [{ rel: "canonical", href: "/resume" }],
  }),
  component: ResumePage,
});

function ResumePage() {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const bytes = await buildResumePdf(buildResumeData());
      downloadResumePdf(bytes, "Yelleti-Harshavardhan-Resume.pdf");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-page min-h-screen bg-[#f4f5f7] py-8 print:bg-white print:py-0">
      {/* Floating toolbar — hidden in print */}
      <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {loading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      <article className="sheet mx-auto max-w-[820px] bg-white px-12 py-12 text-[13px] leading-relaxed text-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.08)] print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <header className="border-b-2 border-[var(--ink)] pb-4">
          <h1 className="font-[family-name:'Space_Grotesk',sans-serif] text-[30px] font-bold tracking-tight text-slate-900">
            {PROFILE.name}
          </h1>
          <p className="mt-1 text-[13px] italic text-[var(--ink)]">{PROFILE.title}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-slate-600">
            <span>{PROFILE.location}</span>
            <span>{PROFILE.phone}</span>
            <a
              href={`mailto:${PROFILE.email}`}
              className="text-slate-700 underline-offset-2 hover:underline"
            >
              {PROFILE.email}
            </a>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-slate-600">
            <a href={PROFILE.github} target="_blank" rel="noreferrer" className="hover:underline">
              GitHub: Born-as-Harsha
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
              LinkedIn: harshaabhi
            </a>
            <a href={PROFILE.orcid} target="_blank" rel="noreferrer" className="hover:underline">
              ORCID
            </a>
            <a href={PROFILE.scholar} target="_blank" rel="noreferrer" className="hover:underline">
              Google Scholar
            </a>
          </div>
        </header>

        <Section title="Education">
          {EDUCATION.map((e) => (
            <Item key={e.degree} left={e.degree} right={e.period} sub={`${e.org} • ${e.detail}`} />
          ))}
        </Section>

        <Section title="Technical Skills">
          <ul className="space-y-1.5">
            {SKILLS.map((s) => (
              <li key={s.group}>
                <span className="font-semibold text-slate-900">{s.group}:</span>{" "}
                <span className="text-slate-700">{s.items.join(", ")}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Projects">
          {PROJECTS.map((p) => (
            <div key={p.title} className="mb-3 break-inside-avoid">
              <Item left={p.title} right={p.tag} sub={`Tech: ${p.tech.join(", ")}`} />
              <p className="mt-1 text-slate-700">{p.description}</p>
              <ul className="mt-1 list-disc pl-5 text-slate-700 marker:text-[var(--ink)]">
                {p.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Experience">
          {EXPERIENCE.map((e) => (
            <div key={e.role} className="mb-3 break-inside-avoid">
              <Item left={e.role} right={e.period} sub={e.org} />
              <ul className="mt-1 list-disc pl-5 text-slate-700 marker:text-[var(--ink)]">
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {e.certUrl && (
                <div className="no-print mt-1.5 pl-5 text-[11.5px]">
                  <a
                    href={e.certUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ink)] hover:underline"
                  >
                    → verify certificate
                  </a>
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section title="Research">
          {RESEARCH.map((r) => (
            <div key={r.title} className="mb-3 break-inside-avoid">
              <Item left={r.title} right={r.year} sub={`${r.venue} • ${r.keywords.join(", ")}`} />
              <p className="mt-1 text-slate-700">{r.abstract}</p>
            </div>
          ))}
        </Section>

        <Section title="Certifications">
          <ul className="space-y-2">
            {CERTIFICATIONS.map((c) => (
              <li key={c.issuer}>
                <div className="font-semibold text-slate-900">{c.issuer}</div>
                <ul className="ml-4 list-disc text-slate-700 marker:text-[var(--ink)]">
                  {c.items.map((it) => (
                    <li key={it.name} className="break-inside-avoid">
                      <span>{it.name}</span>
                      {it.url && (
                        <>
                          {" "}
                          <a
                            href={it.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--ink)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
                          >
                            → verify source
                          </a>
                          <span className="hidden text-[10.5px] text-slate-500 print:inline">
                            {" "}
                            — {it.url}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Competitive Programming">
          <p>
            <span className="font-semibold text-slate-900">Profiles:</span>{" "}
            {CODING.map((c, i) => (
              <span key={c.name} className="text-slate-700">
                <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {c.name}
                </a>{" "}
                ({c.handle}){i < CODING.length - 1 ? "  •  " : ""}
              </span>
            ))}
          </p>
          <p className="mt-1 text-slate-700">
            Active problem-solver on CodeChef (3★) and LeetCode. Strong analytical, logical
            reasoning and debugging skills. Working knowledge of data structures and core
            algorithms.
          </p>
        </Section>

        <Section title="Interests">
          <p className="text-slate-700">{INTERESTS.join("  •  ")}</p>
        </Section>
      </article>

      <style>{`
        .resume-page { --ink: #0a6e8c; }
        .sheet { font-family: 'Inter', system-ui, sans-serif; }
        @page { size: A4; margin: 14mm; }
        @media print {
          .no-print { display: none !important; }
          .resume-page { padding: 0 !important; background: white !important; }
          .sheet { box-shadow: none !important; padding: 0 !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-300 pb-1 font-[family-name:'Space_Grotesk',sans-serif] text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ left, right, sub }: { left: string; right?: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold text-slate-900">{left}</span>
        {right && <span className="shrink-0 text-[11.5px] text-slate-500">{right}</span>}
      </div>
      {sub && <div className="text-[12px] italic text-slate-600">{sub}</div>}
    </div>
  );
}
