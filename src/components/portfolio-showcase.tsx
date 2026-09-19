/**
 * Resume-grade showcase surfaces: filterable project grid, case-study dialog,
 * interactive career timeline and a live-demo rail.
 *
 * Accessibility notes (WCAG 2.1 AA):
 *  - Filters are a real radiogroup-style toolbar with `aria-pressed` buttons.
 *  - The case-study dialog is a modal `role="dialog"` with `aria-modal`, a
 *    labelled title, Escape-to-close, focus moved in on open and restored to
 *    the invoking card on close, and a Tab loop that cannot escape the dialog.
 *  - The timeline is a semantic ordered list; the year selector is a toolbar of
 *    toggle buttons, not a decorative chip row.
 *  - Every motion effect respects `prefers-reduced-motion` via Framer Motion's
 *    `useReducedMotion`.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Binary,
  BrainCircuit,
  Cpu,
  ExternalLink,
  FileCode2,
  FlaskConical,
  GraduationCap,
  Microchip,
  PlayCircle,
  Radio,
  Trophy,
  X,
  Briefcase,
} from "lucide-react";
import { PROJECTS, TIMELINE, type ProjectCategory } from "@/lib/resume-data";

const projectIconMap = { Cpu, Radio, Binary, Microchip, FileCode2, BrainCircuit };

const FILTERS: Array<{ id: "All" | ProjectCategory; label: string }> = [
  { id: "All", label: "All work" },
  { id: "RTL", label: "RTL" },
  { id: "FPGA", label: "FPGA" },
  { id: "Analog", label: "Analog" },
  { id: "Software", label: "Software" },
  { id: "ML", label: "ML" },
];

type Project = (typeof PROJECTS)[number];

/* ------------------------------------------------------------------ */
/* Filterable project grid + case-study dialog                         */
/* ------------------------------------------------------------------ */

export function ProjectsShowcase() {
  const [filter, setFilter] = useState<"All" | ProjectCategory>("All");
  const [active, setActive] = useState<Project | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();

  const visible = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  );

  const open = (project: Project, node: HTMLButtonElement | null) => {
    openerRef.current = node;
    setActive(project);
  };

  const close = useCallback(() => {
    setActive(null);
    openerRef.current?.focus();
  }, []);

  return (
    <>
      <div
        role="toolbar"
        aria-label="Filter projects by discipline"
        aria-controls="project-grid"
        className="mb-8 flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const count = f.id === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.category === f.id).length;
          const selected = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="font-mono text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} project{visible.length === 1 ? "" : "s"} shown
        {filter === "All" ? "" : ` in ${filter}`}.
      </p>

      <div id="project-grid" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, idx) => {
            const ProjectIcon = projectIconMap[p.icon as keyof typeof projectIconMap] ?? Cpu;
            return (
              <motion.article
                key={p.title}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : Math.min(idx * 0.04, 0.2) }}
                className="glass group relative flex flex-col overflow-hidden rounded-3xl p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-[var(--surface-1)]">
                  <div className="absolute inset-0 grid-bg opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[oklch(0.65_0.22_280)]/15" />
                  <div className="absolute inset-0 grid place-items-center">
                    <ProjectIcon
                      className="h-16 w-16 text-primary/80 transition-transform duration-500 group-hover:scale-110"
                      strokeWidth={1.2}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-primary backdrop-blur">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                <ul className="mt-3 space-y-1">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
                  <button
                    type="button"
                    onClick={(event) => open(p, event.currentTarget)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Read case study
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    GitHub <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <CaseStudyDialog project={active} onClose={close} />
    </>
  );
}

function CaseStudyDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!project) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog so screen readers announce it immediately.
    const frame = requestAnimationFrame(() => panelRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-end overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 20 }}
            transition={{ duration: 0.28 }}
            className="glass relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-6 focus:outline-none sm:rounded-3xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close case study</span>
            </button>

            <div className="text-xs font-mono uppercase tracking-[0.18em] text-primary">
              {project.tag}
            </div>
            <h3
              id={titleId}
              className="mt-2 pr-10 font-[family-name:'Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight"
            >
              {project.title}
            </h3>

            <Block label="The problem">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.caseStudy.problem}
              </p>
            </Block>
            <Block label="Approach">
              <ol className="space-y-2">
                {project.caseStudy.approach.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-[10px] text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Block>
            <Block label="Results">
              <ul className="space-y-2">
                {project.caseStudy.results.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </Block>
            <Block label="What it taught me">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.caseStudy.learnings}
              </p>
            </Block>

            <div className="mt-7 flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>

            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Open repository <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
        {label}
      </h4>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive timeline                                                */
/* ------------------------------------------------------------------ */

const timelineIcon = {
  education: GraduationCap,
  internship: Briefcase,
  research: FlaskConical,
  project: Cpu,
  award: Trophy,
} as const;

export function InteractiveTimeline() {
  const years = useMemo(() => ["All", ...Array.from(new Set(TIMELINE.map((m) => m.year)))], []);
  const [year, setYear] = useState<string>("All");
  const reduce = useReducedMotion();
  const entries = year === "All" ? TIMELINE : TIMELINE.filter((m) => m.year === year);

  return (
    <div>
      <div role="toolbar" aria-label="Filter timeline by year" className="mb-8 flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            aria-pressed={year === y}
            onClick={() => setYear(y)}
            className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              year === y
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <ol className="relative space-y-4 border-l border-white/10 pl-6">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map((m, idx) => {
            const Icon = timelineIcon[m.kind];
            return (
              <motion.li
                key={`${m.title}-${m.date}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(idx * 0.05, 0.25) }}
                className="glass relative rounded-2xl p-5"
              >
                <span
                  className="absolute -left-[31px] top-6 grid h-5 w-5 place-items-center rounded-full border border-primary/50 bg-background"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {m.kind}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{m.date}</span>
                </div>
                <h3 className="mt-2 font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">
                  {m.title}
                </h3>
                <div className="text-sm text-primary/80">{m.org}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.detail}</p>
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Verify credential <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live demo rail                                                      */
/* ------------------------------------------------------------------ */

const demoKindLabel = {
  waveform: "Simulation waveform",
  repo: "Source repository",
  notebook: "Analysis notebook",
  app: "Running application",
} as const;

export function LiveDemos() {
  const demos = PROJECTS.filter((p) => p.caseStudy.demo);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {demos.map((p) => {
        const demo = p.caseStudy.demo!;
        return (
          <a
            key={p.title}
            href={demo.url}
            target="_blank"
            rel="noreferrer"
            className="glass group flex items-start gap-4 rounded-2xl p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{p.title}</span>
              <span className="mt-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                {demoKindLabel[demo.kind]}
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all group-hover:gap-2.5">
                {demo.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
