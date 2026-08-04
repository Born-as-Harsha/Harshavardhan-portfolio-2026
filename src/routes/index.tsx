import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Cpu,
  Github,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  FileText,
  GraduationCap,
  Award,
  BookOpen,
  Code2,
  Sparkles,
  ArrowUpRight,
  Briefcase,
  Trophy,
  Zap,
  Layers,
  Terminal,
  BrainCircuit,
  Binary,
  CircuitBoard,
  Microchip,
  Radio,
  FileCode2,
  Star,
  Download,
} from "lucide-react";
import portrait from "@/assets/harsha-id.jpg.asset.json";
import resumePdf from "@/assets/harsha-resume.pdf.asset.json";
import {
  PROFILE,
  ROLES,
  SKILL_GROUPS,
  PROJECTS,
  EXPERIENCE,
  RESEARCH,
  CERTIFICATIONS,
  CODING,
  ACHIEVEMENTS,
  CORE_COURSES,
} from "@/lib/resume-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yelleti Harshavardhan — VLSI & Semiconductor Engineer" },
      {
        name: "description",
        content:
          "B.Tech ECE undergraduate at KLEF (CGPA 9.68) specializing in VLSI Design, RTL, FPGA and ASIC. Projects, research, and publications.",
      },
      { property: "og:title", content: "Yelleti Harshavardhan — VLSI & Semiconductor Engineer" },
      {
        property: "og:description",
        content: "Aspiring VLSI engineer · RTL · FPGA · ASIC · Open source · Research.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      <CredentialJsonLd />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <About />
        <Coursework />
        <Skills />
        <Projects />
        <Experience />
        <Research />
        <Certifications />
        <CodingProfiles />
        <Achievements />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

const iconMap = { Trophy, Award, Star, BookOpen, Sparkles, Zap };

function CredentialJsonLd() {
  const credentials = CERTIFICATIONS.flatMap((c) =>
    c.items.map((i) => ({
      "@type": "EducationalOccupationalCredential",
      name: i.name,
      ...(i.credentialId ? { identifier: i.credentialId } : {}),
      ...(i.issueDate ? { dateCreated: i.issueDate } : {}),
      ...(i.url ? { url: i.url } : {}),
      recognizedBy: {
        "@type": "Organization",
        name: c.issuer,
        ...(i.issuerUrl ? { url: i.issuerUrl } : {}),
      },
      credentialCategory: "certificate",
    })),
  );
  const json = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    jobTitle: PROFILE.title,
    email: `mailto:${PROFILE.email}`,
    alumniOf: { "@type": "CollegeOrUniversity", name: PROFILE.university },
    sameAs: [PROFILE.github, PROFILE.linkedin, PROFILE.orcid, PROFILE.scholar],
    hasCredential: credentials,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

const skillIconMap = { Microchip, CircuitBoard, Cpu, Layers, Terminal, BrainCircuit, FileCode2 };
const projectIconMap = { Cpu, Radio, Binary, Microchip, FileCode2, BrainCircuit };

/* ----------------------------- COMPONENTS ----------------------------- */

function ResumeDownloadButton() {
  return (
    <a
      href={resumePdf.url}
      download="Yelleti-Harshavardhan-Resume.pdf"
      className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:shadow-[var(--shadow-glow)]"
    >
      <Download className="h-4 w-4" />
      Download Resume
    </a>
  );
}

function Nav() {
  const items = [
    ["About", "#about"],
    ["Coursework", "#coursework"],
    ["Skills", "#skills"],
    ["Projects", "#projects"],
    ["Research", "#research"],
    ["Experience", "#experience"],
    ["Certifications", "#certs"],
    ["Platforms", "#coding"],
    ["Contact", "#contact"],
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5">
        <a href="#top" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
            <Cpu className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">
            Harsha<span className="text-primary">.</span>
          </span>
        </a>
        <ul className="hidden items-center gap-1 lg:flex">
          {items.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
        >
          GitHub
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </nav>
    </header>
  );
}

function RoleSwitcher() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ROLES.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex h-8 overflow-hidden align-bottom">
      <motion.span
        key={ROLES[i]}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -24, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-gradient font-semibold"
      >
        {ROLES[i]}
      </motion.span>
    </span>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate flex min-h-[100svh] items-center px-6 pt-32 pb-20"
    >
      <div className="absolute inset-0 -z-10 grid-bg" />
      <motion.div style={{ y }} className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[20%] h-[280px] w-[280px] rounded-full bg-[oklch(0.65_0.22_280)]/20 blur-[100px]" />
      </motion.div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Open to VLSI / Semiconductor internships — Summer 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-[family-name:'Space_Grotesk',sans-serif] text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Hi, I'm <span className="text-gradient">Yelleti Harshavardhan</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-xl text-lg text-muted-foreground"
          >
            {PROFILE.year} {PROFILE.degree} @ KLEF · CGPA{" "}
            <span className="text-foreground font-semibold">{PROFILE.cgpa}</span>. Building&nbsp;
            <RoleSwitcher />
            &nbsp;projects in Verilog, FPGA and ASIC flows — preparing for a career in the
            semiconductor industry.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
            >
              View Projects{" "}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <Mail className="h-4 w-4" /> Get in touch
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a
              href={PROFILE.scholar}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4" /> Research
            </a>
            <Link
              to="/resume"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <FileText className="h-4 w-4" /> View Resume
            </Link>
            <ResumeDownloadButton />
          </motion.div>

          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {PROFILE.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> KLEF · ECE
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -6, rotateY: 3, rotateX: -3 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
          className="relative mx-auto w-full max-w-sm perspective-1000"
        >
          <div className="relative aspect-square">
            {/* Silicon wafer-like outer neon glow */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/30 to-[oklch(0.65_0.22_280)]/30 opacity-40 blur-2xl transition-opacity group-hover:opacity-60" />
            <div className="glass relative h-full w-full overflow-hidden rounded-[2.5rem] p-1 border border-white/10 hover:border-primary/30 transition-colors">
              <div className="relative h-full w-full overflow-hidden rounded-[2.3rem] bg-[var(--surface-1)]">
                <div className="absolute inset-0 grid-bg opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[oklch(0.65_0.22_280)]/5" />
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-primary border border-white/5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                      SYSTEM: ONLINE
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                      DEV: RV32I_CORE
                    </span>
                  </div>

                  {/* Photo Container with HUD Corner Markers */}
                  <div className="grid place-items-center my-2">
                    <div className="relative">
                      {/* Tech Target Corner Indicators */}
                      <div className="absolute -left-2 -top-2 h-3.5 w-3.5 border-l border-t border-primary" />
                      <div className="absolute -right-2 -top-2 h-3.5 w-3.5 border-r border-t border-primary" />
                      <div className="absolute -left-2 -bottom-2 h-3.5 w-3.5 border-l border-b border-primary" />
                      <div className="absolute -right-2 -bottom-2 h-3.5 w-3.5 border-r border-b border-primary" />

                      <div className="h-28 w-28 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)] shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]">
                        <img
                          src={portrait.url}
                          alt="Yelleti Harshavardhan"
                          className="h-full w-full object-cover object-center"
                          loading="eager"
                          width={400}
                          height={400}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name and Designation */}
                  <div className="text-center">
                    <div className="font-[family-name:'Space_Grotesk',sans-serif] text-base font-bold tracking-tight text-foreground">
                      Y. Harshavardhan
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80 mt-0.5">
                      RTL & FPGA Developer
                    </div>
                  </div>

                  {/* High-tech Specs Terminal */}
                  <div className="space-y-1 font-mono text-[9px] text-muted-foreground bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between">
                      <span className="text-primary/60">$ domain</span>
                      <span className="text-foreground font-semibold">VLSI & RTL Design</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">$ target</span>
                      <span className="text-foreground font-semibold">FPGA & ASIC Flows</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">$ toolchain</span>
                      <span className="text-foreground font-semibold">Vivado · ModelSim · DC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">$ research</span>
                      <span className="text-foreground font-semibold">
                        GDI Logic & Device Phys.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/60">$ education</span>
                      <span className="text-foreground font-semibold">
                        CGPA {PROFILE.cgpa} · 3rd Year
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const start = 0;
          const dur = 1200;
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            setN(Math.floor(start + (value - start) * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

function Stats() {
  const items = [
    { v: 9.68, s: "", label: "Current CGPA", fixed: true },
    { v: 15, s: "+", label: "Projects & Repos" },
    { v: 12, s: "+", label: "Certifications" },
    { v: 4, s: "", label: "Coding Platforms" },
    { v: 2, s: "+", label: "Research Drafts" },
  ];
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it, idx) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="glass rounded-2xl p-5 text-center"
          >
            <div className="text-gradient font-[family-name:'Space_Grotesk',sans-serif] text-3xl font-bold">
              {it.fixed ? <>9.68</> : <AnimatedNumber value={it.v} suffix={it.s} />}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {it.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" />
            {eyebrow}
          </div>
          <h2 className="mt-4 font-[family-name:'Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h2>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="Engineering future silicon, one RTL block at a time."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 lg:col-span-2"
        >
          <p className="text-lg leading-relaxed text-foreground/90">
            I'm a motivated second-year B.Tech ECE student at{" "}
            <span className="text-primary">{PROFILE.university}</span> with a CGPA of{" "}
            <span className="text-primary font-semibold">{PROFILE.cgpa}</span>, preparing for a
            career in <span className="font-semibold">VLSI and Semiconductor Engineering</span>.
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            My core interests are Digital VLSI Design, RTL Design in Verilog HDL, FPGA Design,
            Digital and Analog Electronics, CMOS fundamentals, MOSFET analysis, and Computer
            Organization & Architecture. I'm also actively learning Embedded Systems.
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Alongside hardware, I work with Python and Machine Learning fundamentals, use Git &
            GitHub for every project, and keep sharpening my problem-solving on
            competitive-programming platforms.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              "Digital VLSI Design",
              "RTL Design (Verilog HDL)",
              "FPGA Design",
              "Digital Electronics",
              "Analog Electronics",
              "CMOS Fundamentals",
              "MOSFET Analysis",
              "Computer Organization & Architecture",
              "Embedded Systems (Learning)",
              "Python",
              "Machine Learning Fundamentals",
              "Git & GitHub",
              "Problem Solving",
            ].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="space-y-3">
          {[
            { icon: GraduationCap, label: "Education", value: "B.Tech ECE · KLEF" },
            { icon: Trophy, label: "CGPA", value: PROFILE.cgpa },
            { icon: MapPin, label: "Based in", value: PROFILE.location.split(",")[0] + ", India" },
            { icon: Briefcase, label: "Seeking", value: "VLSI / RTL Intern" },
          ].map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass flex items-center gap-4 rounded-2xl p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {it.label}
                </div>
                <div className="text-sm font-semibold">{it.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Coursework() {
  return (
    <Section
      id="coursework"
      eyebrow="Education"
      title="Academic Excellence & ECE Coursework"
      subtitle="Strong theoretical foundation coupled with practical laboratory verification."
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {CORE_COURSES.map((course, idx) => (
          <motion.div
            key={course.code}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="glass group relative overflow-hidden rounded-2xl p-5 hover:border-primary/40 hover:shadow-[var(--shadow-glow)] transition-all"
          >
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
              {course.code}
            </span>
            <h4 className="mt-1 font-semibold text-sm group-hover:text-primary transition-colors">
              {course.name}
            </h4>
            <div className="absolute right-3 bottom-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section id="skills" eyebrow="Skills" title="A stack built for silicon.">
      <div className="grid gap-5 md:grid-cols-2">
        {SKILL_GROUPS.map((g, idx) => {
          const SkillIcon = skillIconMap[g.icon as keyof typeof skillIconMap] || Cpu;
          return (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.06 }}
              className="glass group relative overflow-hidden rounded-3xl p-6"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
                  <SkillIcon className="h-5 w-5" />
                </div>
                <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-xl font-semibold">
                  {g.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it, sIdx) => {
                  const isAdvanced = it.level >= 90;
                  const isProficient = it.level >= 80 && it.level < 90;
                  const levelText = isAdvanced
                    ? "Advanced"
                    : isProficient
                      ? "Proficient"
                      : "Familiar";
                  const badgeColor = isAdvanced
                    ? "bg-primary/10 border-primary/20 text-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.05)]"
                    : isProficient
                      ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

                  return (
                    <motion.div
                      key={it.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.05 + sIdx * 0.03 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    >
                      <span className="text-foreground/90">{it.name}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-medium tracking-wider uppercase ${badgeColor}`}
                      >
                        {levelText}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Shipping hardware ideas."
      subtitle="Selected RTL, FPGA, embedded and ML projects."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, idx) => {
          const ProjectIcon = projectIconMap[p.icon as keyof typeof projectIconMap] || Cpu;
          return (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.05 }}
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
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <a
                href={p.github ?? PROFILE.github}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary transition-all hover:gap-2.5"
              >
                View on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}

function Experience() {
  return (
    <Section id="experience" eyebrow="Experience" title="Trainings, research & projects.">
      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-white/10 to-transparent md:left-1/2" />
        <div className="space-y-8">
          {EXPERIENCE.map((e, idx) => (
            <motion.div
              key={e.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`relative pl-10 md:grid md:grid-cols-2 md:gap-12 md:pl-0 ${idx % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full border border-primary/40 bg-background md:left-1/2 md:-translate-x-1/2">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-primary">
                  {e.period}
                </div>
                <h3 className="mt-1 font-[family-name:'Space_Grotesk',sans-serif] text-xl font-semibold">
                  {e.role}
                </h3>
                <div className="text-sm text-muted-foreground">{e.org}</div>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {e.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {pt}
                    </li>
                  ))}
                </ul>
                {e.certUrl && (
                  <div className="mt-5">
                    <a
                      href={e.certUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Verify Internship Certificate <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              <div />
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Research() {
  return (
    <Section
      id="research"
      eyebrow="Research"
      title="Publications & ongoing research."
      subtitle="Hardware design, FPGA systems and ML for EDA."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {RESEARCH.map((r, idx) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: idx * 0.06 }}
            className="glass group rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{r.year}</span>
            </div>
            <h3 className="mt-4 font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">
              {r.title}
            </h3>
            <div className="mt-1 text-xs text-primary">{r.venue}</div>
            <p className="mt-3 text-sm text-muted-foreground">{r.abstract}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {k}
                </span>
              ))}
            </div>
            <div className="mt-5 flex gap-3 text-xs">
              <a
                href={PROFILE.scholar}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                Google Scholar <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={PROFILE.orcid}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground"
              >
                ORCID <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Certifications() {
  return (
    <Section
      id="certs"
      eyebrow="Certifications"
      title="Credentials & Certifications"
      subtitle="Professional and technical validations from industry leaders."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CERTIFICATIONS.map((c, idx) => (
          <motion.div
            key={c.issuer}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="glass flex flex-col justify-between rounded-3xl p-6 hover:border-primary/30 transition-all hover:shadow-[var(--shadow-glow)]"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                {c.issuer}
              </div>
              <div className="mt-3 space-y-2">
                {c.items.map((i) => (
                  <div key={i.name}>
                    <div className="text-sm font-semibold text-foreground/90">{i.name}</div>
                    {(i.credentialId || i.issueDate) && (
                      <dl className="mt-1.5 space-y-0.5 font-mono text-[10px] text-muted-foreground">
                        {i.credentialId && (
                          <div className="flex gap-1.5">
                            <dt>ID:</dt>
                            <dd className="break-all">{i.credentialId}</dd>
                          </div>
                        )}
                        {i.issueDate && (
                          <div className="flex gap-1.5">
                            <dt>Issued:</dt>
                            <dd>
                              <time dateTime={i.issueDate}>{i.issueDate}</time>
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              {c.items[0]?.url && (
                <a
                  href={c.items[0].url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Verify credential: ${c.items[0].name} from ${c.issuer}`}
                  className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Verify Credential <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function CodingProfiles() {
  const codingAccents = {
    LeetCode: "from-amber-400 to-orange-500",
    CodeChef: "from-rose-400 to-red-500",
    HackerRank: "from-emerald-400 to-teal-500",
    Codeforces: "from-sky-400 to-blue-500",
  };
  return (
    <Section id="coding" eyebrow="Coding" title="Active on every platform that matters.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CODING.map((c, idx) => {
          const accent =
            codingAccents[c.name as keyof typeof codingAccents] || "from-primary/20 to-primary/40";
          return (
            <motion.a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass group relative block overflow-hidden rounded-3xl p-6"
            >
              <div
                className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
              />
              <div className="flex items-center gap-3">
                <FileCode2 className="h-5 w-5 text-primary" />
                <span className="font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">
                  {c.name}
                </span>
              </div>
              <div className="mt-3 font-mono text-xs text-muted-foreground">{c.handle}</div>
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all group-hover:gap-2.5">
                Open profile <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </motion.a>
          );
        })}
      </div>
    </Section>
  );
}

function Achievements() {
  return (
    <Section id="achievements" eyebrow="Achievements" title="Recognition & milestones.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, idx) => {
          const IconComponent = iconMap[a.icon as keyof typeof iconMap] || Star;
          return (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="glass flex items-center gap-4 rounded-2xl p-5 hover:border-primary/20 hover:shadow-[var(--shadow-glow)] transition-all"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.note}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let's build something silicon-grade."
      subtitle="Open to internships, research collaborations and open-source projects."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="glass relative overflow-hidden rounded-3xl p-8"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-3xl font-semibold">
            Reach out — I usually reply within 24 hours.
          </h3>
          <p className="mt-3 text-muted-foreground">
            For internship opportunities, research, or open-source collabs.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}` },
              {
                icon: Phone,
                label: "Phone",
                value: PROFILE.phone,
                href: `tel:${PROFILE.phone.replace(/\s/g, "")}`,
              },
              { icon: MapPin, label: "Location", value: PROFILE.location },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="truncate text-sm font-semibold">{c.value}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
            >
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </a>
            <a
              href={PROFILE.scholar}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
            >
              <BookOpen className="h-3.5 w-3.5" /> Scholar
            </a>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `mailto:${PROFILE.email}`;
          }}
          className="glass rounded-3xl p-8"
        >
          <div className="space-y-4">
            <Field label="Name">
              <input required type="text" className="field" placeholder="Your name" />
            </Field>
            <Field label="Email">
              <input required type="email" className="field" placeholder="you@company.com" />
            </Field>
            <Field label="Message">
              <textarea
                required
                rows={5}
                className="field resize-none"
                placeholder="Tell me about the role or project..."
              />
            </Field>
            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
            >
              Send message{" "}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.form>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
            <Cpu className="h-3.5 w-3.5" />
          </span>
          <span>
            © {new Date().getFullYear()} {PROFILE.name}. Crafted with precision.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a href={`mailto:${PROFILE.email}`} className="hover:text-foreground">
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
      <style>{`
        .field {
          width: 100%;
          background: oklch(0.18 0.025 250 / 0.6);
          border: 1px solid oklch(0.32 0.03 250 / 0.5);
          color: var(--foreground);
          padding: 0.7rem 0.9rem;
          border-radius: 0.9rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .field:focus { border-color: var(--primary); box-shadow: 0 0 0 4px oklch(0.82 0.16 210 / 0.18); }
        .field::placeholder { color: oklch(0.6 0.02 250); }
      `}</style>
    </footer>
  );
}
