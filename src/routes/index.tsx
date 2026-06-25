import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Cpu, Github, Linkedin, Mail, Phone, MapPin, ExternalLink, FileText,
  GraduationCap, Award, BookOpen, Code2, Sparkles, ArrowUpRight,
  Briefcase, Trophy, Zap, Layers, Terminal, BrainCircuit, Binary,
  CircuitBoard, Microchip, Radio, FileCode2, Star,
  Download, Loader2,
} from "lucide-react";
import portrait from "@/assets/harsha-portrait.png.asset.json";
import { buildResumePdf, downloadResumePdf } from "@/lib/generate-resume-pdf";
import { buildResumeData } from "@/lib/resume-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yelleti Harshavardhan — VLSI & Semiconductor Engineer" },
      { name: "description", content: "B.Tech ECE undergraduate at KLEF (CGPA 9.68) specializing in VLSI Design, RTL, FPGA and ASIC. Projects, research, and publications." },
      { property: "og:title", content: "Yelleti Harshavardhan — VLSI & Semiconductor Engineer" },
      { property: "og:description", content: "Aspiring VLSI engineer · RTL · FPGA · ASIC · Open source · Research." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <About />
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

/* ----------------------------- DATA ----------------------------- */

const PROFILE = {
  name: "Yelleti Harshavardhan",
  title: "VLSI & Semiconductor Engineer in the making",
  university: "Koneru Lakshmaiah Education Foundation (KLEF University)",
  degree: "B.Tech — Electronics & Communication Engineering",
  year: "Second Year",
  cgpa: "9.68 / 10",
  email: "abhiharsha021@gmail.com",
  phone: "+91 79014 46220",
  location: "Narsipatnam, Andhra Pradesh, India",
  github: "https://github.com/Born-as-Harsha",
  linkedin: "https://www.linkedin.com/in/harshaabhi",
  leetcode: "https://leetcode.com/u/kl2400040454/",
  codechef: "https://www.codechef.com/users/klu2400040454",
  hackerrank: "https://www.hackerrank.com/profile/kl2400040454",
  codeforces: "https://codeforces.com/profile/2400040454",
  orcid: "https://orcid.org/0009-0009-9355-7011",
  scholar: "https://scholar.google.com/citations?user=TaqPmwcAAAAJ&hl=en",
};

const ROLES = [
  "VLSI Engineer",
  "RTL Designer",
  "FPGA Developer",
  "ASIC Design Enthusiast",
  "Semiconductor Researcher",
  "Open Source Contributor",
  "ML Practitioner",
];

const SKILL_GROUPS = [
  {
    title: "VLSI & Hardware",
    icon: Microchip,
    items: [
      { name: "Digital VLSI Design", level: 88 },
      { name: "RTL Design (Verilog)", level: 85 },
      { name: "FPGA Prototyping", level: 80 },
      { name: "ASIC Design Flow", level: 72 },
      { name: "Computer Architecture", level: 82 },
      { name: "Digital Electronics", level: 92 },
    ],
  },
  {
    title: "Programming",
    icon: Terminal,
    items: [
      { name: "Python", level: 88 },
      { name: "C / C++", level: 82 },
      { name: "Verilog HDL", level: 84 },
      { name: "MATLAB", level: 70 },
      { name: "DSA", level: 78 },
    ],
  },
  {
    title: "EDA & Simulation",
    icon: CircuitBoard,
    items: [
      { name: "Xilinx Vivado", level: 78 },
      { name: "ModelSim / QuestaSim", level: 75 },
      { name: "Cadence Tools", level: 60 },
      { name: "LTspice", level: 80 },
      { name: "Cisco Packet Tracer", level: 82 },
    ],
  },
  {
    title: "AI / ML & Tools",
    icon: BrainCircuit,
    items: [
      { name: "Machine Learning", level: 75 },
      { name: "NumPy / Pandas", level: 80 },
      { name: "Git & GitHub", level: 88 },
      { name: "Linux", level: 78 },
      { name: "TensorFlow basics", level: 65 },
    ],
  },
];

const PROJECTS = [
  {
    title: "4-bit ALU in Verilog",
    tag: "RTL · FPGA",
    icon: Binary,
    description:
      "Designed and verified a 4-bit Arithmetic Logic Unit supporting arithmetic and logical operations, simulated with testbenches and synthesized on FPGA.",
    tech: ["Verilog", "ModelSim", "Vivado"],
    highlights: ["8 ALU operations", "Testbench coverage", "RTL → synthesis flow"],
  },
  {
    title: "32-bit RISC Processor (Pipelined)",
    tag: "Computer Architecture",
    icon: Cpu,
    description:
      "RTL implementation of a 5-stage pipelined RISC processor with hazard detection and forwarding, written in Verilog and verified on FPGA.",
    tech: ["Verilog", "Vivado", "FPGA"],
    highlights: ["5-stage pipeline", "Hazard handling", "Single-cycle ISA subset"],
  },
  {
    title: "UART Communication Protocol",
    tag: "Digital Design",
    icon: Radio,
    description:
      "Built a full-duplex UART transmitter and receiver in Verilog with configurable baud rate, parity and framing — synthesized and tested on FPGA.",
    tech: ["Verilog", "FPGA", "Serial I/O"],
    highlights: ["Configurable baud", "TX/RX FSMs", "Parity & framing checks"],
  },
  {
    title: "FIR Digital Filter on FPGA",
    tag: "DSP · FPGA",
    icon: Layers,
    description:
      "Parameterised FIR filter implemented in Verilog targeting Xilinx FPGA, with MATLAB-generated coefficients and waveform verification.",
    tech: ["Verilog", "MATLAB", "Vivado"],
    highlights: ["Parameterised taps", "MATLAB co-design", "On-board verification"],
  },
  {
    title: "Smart Traffic Light Controller",
    tag: "FSM · Embedded",
    icon: CircuitBoard,
    description:
      "FSM-based traffic light controller modelled in Verilog with timing logic and emergency override, prototyped on FPGA dev-board.",
    tech: ["Verilog", "FSM", "FPGA"],
    highlights: ["Mealy/Moore FSM", "Emergency mode", "Real-time waveform"],
  },
  {
    title: "ML — Predictive Analytics",
    tag: "Python · ML",
    icon: BrainCircuit,
    description:
      "End-to-end machine learning pipeline for predictive analytics using scikit-learn — data cleaning, feature engineering, model selection and evaluation.",
    tech: ["Python", "scikit-learn", "Pandas"],
    highlights: ["EDA pipeline", "Model comparison", "Cross-validation"],
  },
];

const EXPERIENCE = [
  {
    role: "Summer Internship — FPGA & VLSI Design",
    org: "SSIT Solutions Pvt. Ltd.",
    period: "Summer 2025",
    points: [
      "Industry-oriented internship focused on FPGA architecture and VLSI design fundamentals.",
      "Hands-on training in digital design concepts, RTL workflows and FPGA-based prototyping.",
      "Project-based learning sharpening problem-solving, debugging and communication skills.",
    ],
  },
  {
    role: "Research & Project Work — VLSI / RTL",
    org: "KLEF University",
    period: "2024 — Present",
    points: [
      "Designed and verified multiple RTL modules in Verilog on FPGA boards.",
      "Worked on pipelined processor and DSP datapath projects.",
      "Contributed to a research manuscript on digital system design.",
    ],
  },
  {
    role: "Technical Trainings & Workshops",
    org: "Cisco · Coursera · NPTEL · Linux Foundation",
    period: "2024 — 2025",
    points: [
      "Completed advanced courses in Networking, Cybersecurity and Python.",
      "Hands-on labs in AI/ML, Cloud Security and Open Source.",
      "Smart India Hackathon participant.",
    ],
  },
];

const RESEARCH = [
  {
    title: "Research in Digital VLSI & FPGA-based Systems",
    venue: "Manuscript / Conference Submission",
    year: "2025",
    abstract:
      "Exploration of RTL-level optimizations and FPGA implementation strategies for energy-efficient digital systems.",
    keywords: ["VLSI", "RTL", "FPGA", "Low Power"],
  },
  {
    title: "AI-Assisted Hardware Design Concepts",
    venue: "Working Paper",
    year: "2025",
    abstract:
      "Investigating the role of machine learning in EDA flows, with focus on RTL generation aids and verification assistance.",
    keywords: ["ML for EDA", "RTL", "Verification"],
  },
];

import { CERTIFICATIONS as CERTS } from "@/lib/resume-data";

const ACHIEVEMENTS = [
  { icon: Trophy, title: "CGPA 9.68 / 10", note: "Top of class, second-year ECE" },
  { icon: Award, title: "Smart India Hackathon", note: "Participant" },
  { icon: Star, title: "CodeChef 3★", note: "Active competitive programmer" },
  { icon: BookOpen, title: "ORCID Researcher", note: "Active research profile" },
  { icon: Sparkles, title: "Multi-platform Coder", note: "LeetCode · CF · HR · GFG" },
  { icon: Zap, title: "Open Source Contributor", note: "GitHub @Born-as-Harsha" },
];

const CODING = [
  { name: "LeetCode", handle: "kl2400040454", url: PROFILE.leetcode, accent: "from-amber-400 to-orange-500" },
  { name: "CodeChef", handle: "klu2400040454 · 3★", url: PROFILE.codechef, accent: "from-rose-400 to-red-500" },
  { name: "HackerRank", handle: "kl2400040454", url: PROFILE.hackerrank, accent: "from-emerald-400 to-teal-500" },
  { name: "Codeforces", handle: "2400040454", url: PROFILE.codeforces, accent: "from-sky-400 to-blue-500" },
];

/* ----------------------------- COMPONENTS ----------------------------- */

function ResumeDownloadButton() {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const bytes = await buildResumePdf(buildResumeData());
      downloadResumePdf(bytes, "Yelleti-Harshavardhan-Resume.pdf");
    } catch (err) {
      console.error("Resume generation failed", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {loading ? "Generating…" : "Download Resume"}
    </button>
  );
}

function Nav() {
  const items = [
    ["About", "#about"],
    ["Skills", "#skills"],
    ["Projects", "#projects"],
    ["Research", "#research"],
    ["Experience", "#experience"],
    ["Contact", "#contact"],
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5">
        <a href="#top" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
            <Cpu className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Harsha<span className="text-primary">.</span></span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {items.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
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
    <section id="top" ref={ref} className="relative isolate flex min-h-[100svh] items-center px-6 pt-32 pb-20">
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
            Second-year B.Tech ECE @ KLEF · CGPA <span className="text-foreground font-semibold">9.68/10</span>.
            Building&nbsp;
            <RoleSwitcher />
            &nbsp;projects in Verilog, FPGA and ASIC flows — preparing for a career in the semiconductor industry.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#projects" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]">
              View Projects <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10">
              <Mail className="h-4 w-4" /> Get in touch
            </a>
            <a href={PROFILE.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href={PROFILE.scholar} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10">
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
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Andhra Pradesh, India</span>
            <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> KLEF · ECE</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="relative aspect-square">
            <div className="absolute inset-0 rounded-[2rem] bg-[var(--gradient-primary)] opacity-30 blur-2xl" />
            <div className="glass relative h-full w-full overflow-hidden rounded-[2rem] p-1">
              <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-[var(--surface-1)]">
                <div className="absolute inset-0 grid-bg opacity-60" />
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-primary backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> harsha.sys
                    </span>
                    <Microchip className="h-5 w-5 text-primary/70" />
                  </div>

                  <div className="grid place-items-center">
                    <div className="relative">
                      <div className="absolute inset-0 -m-3 rounded-full border border-primary/30 animate-[pulse-ring_2s_ease-out_infinite]" />
                      <div className="h-36 w-36 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]">
                        <img
                          src={portrait.url}
                          alt="Yelleti Harshavardhan"
                          className="h-full w-full object-cover object-[center_20%]"
                          loading="eager"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                    <div className="flex justify-between"><span>$ status</span><span className="text-primary">online</span></div>
                    <div className="flex justify-between"><span>$ focus</span><span className="text-foreground">VLSI · RTL</span></div>
                    <div className="flex justify-between"><span>$ cgpa</span><span className="text-foreground">9.68 / 10</span></div>
                    <div className="flex justify-between"><span>$ year</span><span className="text-foreground">II — B.Tech ECE</span></div>
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
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let start = 0; const dur = 1200; const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setN(Math.floor(start + (value - start) * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{n}{suffix}</span>;
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
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{it.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Section({ id, eyebrow, title, subtitle, children }: { id: string; eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
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
            <span className="h-1 w-1 rounded-full bg-primary" />{eyebrow}
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
    <Section id="about" eyebrow="About" title="Engineering future silicon, one RTL block at a time.">
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 lg:col-span-2"
        >
          <p className="text-lg leading-relaxed text-foreground/90">
            I'm a passionate second-year B.Tech ECE student at <span className="text-primary">KLEF University</span>, holding a CGPA of <span className="text-primary font-semibold">9.68/10</span>. My focus lies in <span className="font-semibold">VLSI Design, Semiconductor Engineering, FPGA Development, ASIC Flow, RTL Design (Verilog HDL), Digital Electronics, Embedded Systems and Computer Architecture</span>.
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            I love designing hardware-oriented projects, exploring modern semiconductor technologies and prototyping ideas on FPGAs. Alongside, I sharpen my edge through Python, Machine Learning, competitive programming and open-source contributions.
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            My long-term goal is to contribute to the design of innovative, high-performance, energy-efficient digital systems at world-class semiconductor companies.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {["VLSI", "RTL", "FPGA", "ASIC", "Verilog", "Computer Arch", "Embedded", "Python", "ML", "Open Source"].map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">{t}</span>
            ))}
          </div>
        </motion.div>

        <div className="space-y-3">
          {[
            { icon: GraduationCap, label: "Education", value: "B.Tech ECE · KLEF" },
            { icon: Trophy, label: "CGPA", value: "9.68 / 10" },
            { icon: MapPin, label: "Based in", value: "Andhra Pradesh, IN" },
            { icon: Briefcase, label: "Seeking", value: "VLSI / RTL Intern" },
          ].map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass flex items-center gap-4 rounded-2xl p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{it.label}</div>
                <div className="text-sm font-semibold">{it.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section id="skills" eyebrow="Skills" title="A stack built for silicon.">
      <div className="grid gap-5 md:grid-cols-2">
        {SKILL_GROUPS.map((g, idx) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: idx * 0.06 }}
            className="glass group relative overflow-hidden rounded-3xl p-6"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
                <g.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-xl font-semibold">{g.title}</h3>
            </div>
            <div className="space-y-3">
              {g.items.map((it) => (
                <div key={it.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground/90">{it.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{it.level}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${it.level}%` }} viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-[var(--gradient-primary)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Projects() {
  return (
    <Section id="projects" eyebrow="Projects" title="Shipping hardware ideas." subtitle="Selected RTL, FPGA, embedded and ML projects.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, idx) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: idx * 0.05 }}
            className="glass group relative flex flex-col overflow-hidden rounded-3xl p-6"
          >
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-[var(--surface-1)]">
              <div className="absolute inset-0 grid-bg opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[oklch(0.65_0.22_280)]/15" />
              <div className="absolute inset-0 grid place-items-center">
                <p.icon className="h-16 w-16 text-primary/80 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-primary backdrop-blur">
                {p.tag}
              </span>
            </div>
            <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
            <ul className="mt-3 space-y-1">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-primary" />{h}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{t}</span>
              ))}
            </div>
            <a
              href={PROFILE.github}
              target="_blank" rel="noreferrer"
              className="mt-5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary transition-all hover:gap-2.5"
            >
              View on GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

function Experience() {
  return (
    <Section id="experience" eyebrow="Experience" title="Trainings, research & projects." >
      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-white/10 to-transparent md:left-1/2" />
        <div className="space-y-8">
          {EXPERIENCE.map((e, idx) => (
            <motion.div
              key={e.role}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`relative pl-10 md:grid md:grid-cols-2 md:gap-12 md:pl-0 ${idx % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full border border-primary/40 bg-background md:left-1/2 md:-translate-x-1/2">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-primary">{e.period}</div>
                <h3 className="mt-1 font-[family-name:'Space_Grotesk',sans-serif] text-xl font-semibold">{e.role}</h3>
                <div className="text-sm text-muted-foreground">{e.org}</div>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {e.points.map((pt) => (
                    <li key={pt} className="flex gap-2"><span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />{pt}</li>
                  ))}
                </ul>
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
    <Section id="research" eyebrow="Research" title="Publications & ongoing research." subtitle="Hardware design, FPGA systems and ML for EDA.">
      <div className="grid gap-5 md:grid-cols-2">
        {RESEARCH.map((r, idx) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: idx * 0.06 }}
            className="glass group rounded-3xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <span className="text-xs font-mono text-muted-foreground">{r.year}</span>
            </div>
            <h3 className="mt-4 font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">{r.title}</h3>
            <div className="mt-1 text-xs text-primary">{r.venue}</div>
            <p className="mt-3 text-sm text-muted-foreground">{r.abstract}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.keywords.map((k) => (
                <span key={k} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
              ))}
            </div>
            <div className="mt-5 flex gap-3 text-xs">
              <a href={PROFILE.scholar} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                Google Scholar <ExternalLink className="h-3 w-3" />
              </a>
              <a href={PROFILE.orcid} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
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
    <Section id="certs" eyebrow="Certifications" title="Trained by the best.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CERTS.map((c, idx) => (
          <motion.div
            key={c.issuer}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.06 }}
            className="glass rounded-3xl p-6"
          >
            <div className="text-xs font-mono uppercase tracking-wider text-primary">{c.issuer}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {c.items.map((i) => (
                <li key={i} className="flex gap-2 text-foreground/90">
                  <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{i}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function CodingProfiles() {
  return (
    <Section id="coding" eyebrow="Coding" title="Active on every platform that matters.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CODING.map((c, idx) => (
          <motion.a
            key={c.name}
            href={c.url} target="_blank" rel="noreferrer"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.06 }}
            whileHover={{ y: -4 }}
            className="glass group relative block overflow-hidden rounded-3xl p-6"
          >
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${c.accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
            <div className="flex items-center gap-3">
              <FileCode2 className="h-5 w-5 text-primary" />
              <span className="font-[family-name:'Space_Grotesk',sans-serif] text-lg font-semibold">{c.name}</span>
            </div>
            <div className="mt-3 font-mono text-xs text-muted-foreground">{c.handle}</div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all group-hover:gap-2.5">
              Open profile <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}

function Achievements() {
  return (
    <Section id="achievements" eyebrow="Achievements" title="Recognition & milestones.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, idx) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="glass flex items-center gap-4 rounded-2xl p-5"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]">
              <a.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.note}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Let's build something silicon-grade." subtitle="Open to internships, research collaborations and open-source projects.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="glass relative overflow-hidden rounded-3xl p-8"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <h3 className="font-[family-name:'Space_Grotesk',sans-serif] text-3xl font-semibold">
            Reach out — I usually reply within 24 hours.
          </h3>
          <p className="mt-3 text-muted-foreground">For internship opportunities, research, or open-source collabs.</p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}` },
              { icon: Phone, label: "Phone", value: PROFILE.phone, href: `tel:${PROFILE.phone.replace(/\s/g, "")}` },
              { icon: MapPin, label: "Location", value: PROFILE.location },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="truncate text-sm font-semibold">{c.value}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <a href={PROFILE.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"><Github className="h-3.5 w-3.5" /> GitHub</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</a>
            <a href={PROFILE.scholar} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"><BookOpen className="h-3.5 w-3.5" /> Scholar</a>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          onSubmit={(e) => { e.preventDefault(); window.location.href = `mailto:${PROFILE.email}`; }}
          className="glass rounded-3xl p-8"
        >
          <div className="space-y-4">
            <Field label="Name"><input required type="text" className="field" placeholder="Your name" /></Field>
            <Field label="Email"><input required type="email" className="field" placeholder="you@company.com" /></Field>
            <Field label="Message"><textarea required rows={5} className="field resize-none" placeholder="Tell me about the role or project..." /></Field>
            <button type="submit" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]">
              Send message <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
      <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gradient-primary)] text-[oklch(0.16_0.02_250)]"><Cpu className="h-3.5 w-3.5" /></span>
          <span>© {new Date().getFullYear()} {PROFILE.name}. Crafted with precision.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={PROFILE.github} target="_blank" rel="noreferrer" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
          <a href={`mailto:${PROFILE.email}`} className="hover:text-foreground"><Mail className="h-4 w-4" /></a>
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
