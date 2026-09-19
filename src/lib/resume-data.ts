import type { ResumeData } from "./generate-resume-pdf";
import ssitCert from "@/assets/certs/ssit-fpga-vlsi.pdf.asset.json";
import ijirtCert from "@/assets/certs/ijirt-reviewer.pdf.asset.json";
import siemensCert from "@/assets/certs/eduskills-siemens.pdf.asset.json";
import courseraCert from "@/assets/certs/coursera-python-for-everybody.pdf.asset.json";
import tarasCert from "@/assets/certs/taras-ai-ml.pdf.asset.json";
import linuxCert from "@/assets/certs/linux-foundation.pdf.asset.json";
import ciscoCert from "@/assets/certs/cisco-packet-tracer.pdf.asset.json";
import amdoxCert from "@/assets/certs/amdox-internship.pdf.asset.json";
import "./cert-manifest";

/** Relative paths render identically on SSR and client (no hydration mismatch).
 *  PDF generation absolutizes them at click-time via `buildResumeData()`. */
export const CERT_SOURCES = {
  ssit: ssitCert.url,
  ijirt: ijirtCert.url,
  siemens: siemensCert.url,
  taras: tarasCert.url,
  linux: linuxCert.url,
  cisco: ciscoCert.url,
  amdox: amdoxCert.url,
  coursera: courseraCert.url,
} as const;

/** url -> file metadata from the CDN asset pointers (size in bytes, upload date). */
const CERT_FILE_META: Record<string, { size: number; updatedAt: string }> = Object.fromEntries(
  [ssitCert, ijirtCert, siemensCert, courseraCert, tarasCert, linuxCert, ciscoCert, amdoxCert].map((a) => [
    a.url,
    { size: a.size, updatedAt: a.created_at },
  ]),
);

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const absolutize = (url?: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin + url;
  }
  return url;
};

export const PROFILE = {
  name: "Yelleti Harshavardhan",
  title: "VLSI & Semiconductor Engineer in the making",
  university: "Koneru Lakshmaiah Education Foundation (KLEF University)",
  degree: "B.Tech — Electronics & Communication Engineering",
  year: "Third Year",
  cgpa: "9.68 / 10",
  email: "abhiharsha021@gmail.com",
  phone: "+91 79014 46220",
  location: "Narsipatnam, Andhra Pradesh, India",
  github: "https://github.com/Born-as-Harsha",
  linkedin: "https://www.linkedin.com/in/harshaabhi",
  orcid: "https://orcid.org/0009-0009-9355-7011",
  scholar: "https://scholar.google.com/citations?user=TaqPmwcAAAAJ&hl=en",
  leetcode: "https://leetcode.com/u/kl2400040454/",
  codechef: "https://www.codechef.com/users/klu2400040454",
  hackerrank: "https://www.hackerrank.com/profile/kl2400040454",
  codeforces: "https://codeforces.com/profile/2400040454",
};

export const ROLES = [
  "VLSI Engineer",
  "RTL Designer",
  "FPGA Developer",
  "ASIC Design Enthusiast",
  "Semiconductor Researcher",
  "Open Source Contributor",
  "ML Practitioner",
];

export const EDUCATION = [
  {
    degree: "B.Tech — Electronics & Communication Engineering",
    period: "2024 – 2028 (Third Year)",
    org: PROFILE.university,
    detail: `CGPA ${PROFILE.cgpa}`,
  },
  {
    degree: "Intermediate (Class XII)",
    period: "2022 – 2024",
    org: "Narayana Junior College, Visakhapatnam",
    detail: "Percentage: 93.1%",
  },
  {
    degree: "Secondary School (Class X)",
    period: "2021 – 2022",
    org: "Narayana School, Narsipatnam",
    detail: "Percentage: 83.66%",
  },
];

export const SKILL_GROUPS = [
  {
    title: "VLSI & Semiconductor",
    icon: "Microchip",
    items: [
      { name: "Digital VLSI Design", level: 80 },
      { name: "RTL Design (Verilog HDL)", level: 78 },
      { name: "FPGA Design", level: 75 },
      { name: "CMOS Fundamentals", level: 78 },
      { name: "MOSFET Analysis", level: 80 },
    ],
  },
  {
    title: "Electronics",
    icon: "CircuitBoard",
    items: [
      { name: "Digital Electronics", level: 88 },
      { name: "Analog Electronics", level: 80 },
    ],
  },
  {
    title: "Computer Organization & Architecture",
    icon: "Cpu",
    items: [
      { name: "Computer Organization", level: 82 },
      { name: "Computer Architecture", level: 80 },
    ],
  },
  {
    title: "Embedded Systems",
    icon: "Layers",
    items: [{ name: "Embedded Systems (Learning)", level: 55 }],
  },
  {
    title: "Programming",
    icon: "Terminal",
    items: [
      { name: "C", level: 80 },
      { name: "Python", level: 82 },
      { name: "Verilog HDL", level: 78 },
      { name: "Problem Solving", level: 80 },
    ],
  },
  {
    title: "Machine Learning",
    icon: "BrainCircuit",
    items: [
      { name: "Machine Learning Fundamentals", level: 65 },
      { name: "NumPy / Pandas", level: 75 },
    ],
  },
  {
    title: "EDA & Simulation Tools",
    icon: "FileCode2",
    items: [
      { name: "Xilinx Vivado", level: 72 },
      { name: "ModelSim", level: 70 },
      { name: "NI Multisim", level: 78 },
      { name: "LTspice", level: 75 },
      { name: "Cisco Packet Tracer", level: 80 },
      { name: "Git & GitHub", level: 82 },
    ],
  },
];

export const SKILLS = SKILL_GROUPS.map((g) => ({
  group: g.title,
  items: g.items.map((it) => it.name),
}));

export type ProjectCategory = "RTL" | "FPGA" | "Analog" | "Software" | "ML";

export type CaseStudy = {
  /** One-line framing of the engineering problem. */
  problem: string;
  /** The approach taken, in 2–4 concrete steps. */
  approach: string[];
  /** Measurable or verifiable outcomes. */
  results: string[];
  /** What the work taught, honestly stated. */
  learnings: string;
  /** Optional live/interactive artifact for the demo rail. */
  demo?: { label: string; url: string; kind: "waveform" | "repo" | "notebook" | "app" };
};

export const PROJECTS: Array<{
  title: string;
  tag: string;
  icon: string;
  category: ProjectCategory;
  tech: string[];
  description: string;
  highlights: string[];
  github: string;
  caseStudy: CaseStudy;
}> = [
  {
    title: "Pipelined RISC-V (RV32I) Processor Core",
    tag: "RTL · Computer Architecture",
    icon: "Cpu",
    category: "RTL",
    tech: ["Verilog HDL", "Xilinx Vivado", "ModelSim", "GTKWave"],
    description:
      "Designed and verified a 5-stage pipelined RISC-V (RV32I) processor core in Verilog HDL, featuring hazard detection, forwarding units, and instruction/data cache simulation.",
    highlights: [
      "5-stage pipelined execution path",
      "Hazard detection & forwarding logic",
      "Instruction & Data cache integration",
    ],
    github: PROFILE.github + "/RISCV-Pipelined-Core",
    caseStudy: {
      problem:
        "A single-cycle RV32I core wastes the critical path: every instruction pays for the slowest stage. The goal was a pipelined core that keeps correctness under data and control hazards.",
      approach: [
        "Split the datapath into IF / ID / EX / MEM / WB stages with pipeline registers between each.",
        "Added a hazard-detection unit that stalls on load-use and a forwarding unit that bypasses EX/MEM and MEM/WB results.",
        "Simulated instruction and data cache behaviour to study memory stalls separately from pipeline stalls.",
        "Verified each stage with directed testbenches in ModelSim and inspected waveforms in GTKWave.",
      ],
      results: [
        "Correct execution of the RV32I integer instruction set across directed test programs.",
        "Load-use hazards resolved with a single stall cycle instead of a full flush.",
        "Clean synthesis in Vivado with no inferred latches.",
      ],
      learnings:
        "Pipelining is mostly a hazard-management problem, not a datapath problem — most of the debugging time went into forwarding corner cases, not arithmetic.",
      demo: { label: "Browse the RTL", url: PROFILE.github + "/RISCV-Pipelined-Core", kind: "repo" },
    },
  },
  {
    title: "FPGA-Based 8-Point Fast Fourier Transform (FFT) Processor",
    tag: "RTL · DSP Architecture",
    icon: "Radio",
    category: "FPGA",
    tech: ["Verilog HDL", "Xilinx Vivado", "MATLAB"],
    description:
      "Implemented a butterfly-architecture-based 8-point FFT processor in Verilog for high-speed digital signal processing on FPGA, verifying accuracy against MATLAB models.",
    highlights: [
      "Butterfly computing unit optimization",
      "Fixed-point arithmetic scaling",
      "Validation with MATLAB test signals",
    ],
    github: PROFILE.github + "/FPGA-FFT-Processor",
    caseStudy: {
      problem:
        "Software FFTs are too slow for streaming signal paths. The task was a hardware 8-point FFT that stays numerically faithful in fixed point.",
      approach: [
        "Built a radix-2 butterfly unit and reused it across three computation stages.",
        "Chose a fixed-point word length and scaling schedule to avoid overflow at each stage.",
        "Generated reference vectors in MATLAB and compared the RTL output bit-for-bit.",
      ],
      results: [
        "Output matched the MATLAB double-precision reference within the expected fixed-point error bound.",
        "Single reusable butterfly unit kept LUT usage low compared with a fully unrolled design.",
      ],
      learnings:
        "In fixed-point DSP hardware, the scaling plan matters more than the arithmetic — most accuracy loss came from where I truncated, not how I multiplied.",
      demo: { label: "Browse the RTL", url: PROFILE.github + "/FPGA-FFT-Processor", kind: "repo" },
    },
  },
  {
    title: "FPGA-Based 8-Bit ALU Using Verilog HDL",
    tag: "RTL · FPGA",
    icon: "Binary",
    category: "FPGA",
    tech: ["Verilog HDL", "Xilinx Vivado", "FPGA"],
    description:
      "Designed and verified an 8-bit Arithmetic Logic Unit in Verilog HDL targeting an FPGA, with testbench-driven simulation and synthesis.",
    highlights: ["8-bit ALU operations", "Testbench verification", "FPGA synthesis flow"],
    github: PROFILE.github + "/FPGA-8bit-ALU-Verilog",
    caseStudy: {
      problem:
        "An ALU's adder choice sets the critical path of a whole datapath. I wanted a measured comparison rather than a textbook assumption.",
      approach: [
        "Implemented the 8-bit ALU twice: once with a ripple-carry adder, once with carry look-ahead.",
        "Wrote an exhaustive testbench across operand pairs and opcodes.",
        "Synthesised both variants in Vivado and compared delay and resource usage.",
      ],
      results: [
        "Carry look-ahead reduced worst-case carry propagation delay at a measurable area cost.",
        "Findings became my first published paper (IJIRT-track conference, 2026).",
      ],
      learnings:
        "The architecture trade-off only becomes real after synthesis — pre-synthesis simulation hides the timing story entirely.",
      demo: { label: "Browse the RTL", url: PROFILE.github + "/FPGA-8bit-ALU-Verilog", kind: "repo" },
    },
  },
  {
    title: "DC Analysis and Short Channel Effects in MOSFETs",
    tag: "Analog VLSI",
    icon: "Microchip",
    category: "Analog",
    tech: ["NI Multisim", "LTspice"],
    description:
      "Analyzed NMOS and PMOS transistor characteristics including short-channel effects and channel length modulation across operating regions.",
    highlights: ["I_D-V_GS / I_D-V_DS plots", "Short-channel analysis", "Device-level insight"],
    github: PROFILE.github + "/MOSFET-DC-Analysis",
    caseStudy: {
      problem:
        "Long-channel square-law models stop predicting real device current once channels shrink. I wanted to see where the model breaks.",
      approach: [
        "Swept I_D-V_GS and I_D-V_DS for NMOS and PMOS devices in Multisim and LTspice.",
        "Extracted threshold voltage and observed channel-length modulation in saturation.",
        "Compared short-channel device behaviour against the long-channel prediction.",
      ],
      results: [
        "Documented the divergence between square-law prediction and simulated short-channel current.",
        "Produced a reusable set of characterisation plots for coursework and design reference.",
      ],
      learnings:
        "Device physics sets the ceiling on every digital design decision above it — output resistance in saturation is never actually infinite.",
      demo: { label: "View the analysis", url: PROFILE.github + "/MOSFET-DC-Analysis", kind: "repo" },
    },
  },
  {
    title: "Student Activity & Achievement Management System",
    tag: "Python Full Stack",
    icon: "FileCode2",
    category: "Software",
    tech: ["Python", "Full Stack", "Web"],
    description:
      "Web-based system to manage student extracurricular activities and achievements, built with full-stack Python.",
    highlights: ["CRUD workflows", "Activity tracking", "Data management"],
    github: PROFILE.github + "/Student-Activity-Tracker",
    caseStudy: {
      problem:
        "Student activity records lived in scattered spreadsheets, so nobody could produce a reliable achievement history on demand.",
      approach: [
        "Modelled students, activities and achievements as related records with validated input.",
        "Built create / read / update / delete flows over a Python web stack.",
        "Added filtered views so a record can be retrieved by student or by activity type.",
      ],
      results: [
        "Single source of truth replacing ad-hoc spreadsheets.",
        "Achievement history retrievable in seconds instead of manual collation.",
      ],
      learnings:
        "Most of the value came from getting the data model right first; the interface was the easy half.",
      demo: { label: "Browse the code", url: PROFILE.github + "/Student-Activity-Tracker", kind: "app" },
    },
  },
  {
    title: "Machine Learning for Weather Data Analysis",
    tag: "Python · ML",
    icon: "BrainCircuit",
    category: "ML",
    tech: ["Python", "scikit-learn", "Pandas"],
    description:
      "End-to-end weather data pipeline using regression and clustering algorithms with standard evaluation metrics.",
    highlights: ["EDA pipeline", "Regression + K-Means", "Model evaluation"],
    github: PROFILE.github + "/ML-Weather-Analysis",
    caseStudy: {
      problem:
        "Raw weather station data is noisy and incomplete, which makes naive models look better than they are.",
      approach: [
        "Cleaned and explored the dataset in Pandas, handling missing readings explicitly.",
        "Fitted regression models for continuous prediction and K-Means for regime clustering.",
        "Evaluated with held-out data and standard error metrics rather than training-set scores.",
      ],
      results: [
        "A reproducible end-to-end pipeline from raw CSV to evaluated model.",
        "Clustering surfaced distinct seasonal regimes in the data.",
      ],
      learnings:
        "Evaluation discipline matters more than model choice — the first 'good' result was leakage from the training split.",
      demo: { label: "Open the notebook", url: PROFILE.github + "/ML-Weather-Analysis", kind: "notebook" },
    },
  },
];

/** Chronological milestones for the interactive timeline. */
export const TIMELINE: Array<{
  year: string;
  date: string;
  title: string;
  org: string;
  kind: "education" | "internship" | "research" | "project" | "award";
  detail: string;
  link?: string;
}> = [
  {
    year: "2024",
    date: "Aug 2024",
    title: "Started B.Tech ECE",
    org: "KLEF University",
    kind: "education",
    detail: "Began the Electronics & Communication Engineering programme, currently holding a 9.68 / 10 CGPA.",
  },
  {
    year: "2025",
    date: "2025",
    title: "First RTL designs on FPGA",
    org: "Self-directed",
    kind: "project",
    detail: "Moved from gate-level coursework to full Verilog modules: 8-bit ALU, then an 8-point FFT datapath.",
  },
  {
    year: "2026",
    date: "Apr – Jun 2026",
    title: "Siemens Conceptual CAE Virtual Internship",
    org: "AICTE – EduSkills",
    kind: "internship",
    detail: "Eight weeks of structured design and simulation modules, weekly assessments and a final assessment test.",
    link: CERT_SOURCES.siemens,
  },
  {
    year: "2026",
    date: "May – Jun 2026",
    title: "FPGA & VLSI Summer Internship",
    org: "Sense Semiconductor & IT Solutions (SSIT)",
    kind: "internship",
    detail: "Foundation course in FPGA & VLSI with hands-on RTL workflows and FPGA prototyping (Cert. SSIT-2026-1196).",
    link: CERT_SOURCES.ssit,
  },
  {
    year: "2026",
    date: "2026",
    title: "Reviewer appointment",
    org: "IJIRT (ISSN 2349-6002)",
    kind: "award",
    detail: "Invited to review submissions for the International Journal of Innovative Research in Technology.",
    link: CERT_SOURCES.ijirt,
  },
  {
    year: "2026",
    date: "2026",
    title: "First research publication",
    org: "Conference Paper",
    kind: "research",
    detail:
      "Evaluation of Ripple Carry and Carry Look-Ahead adder-based 8-bit ALU architectures in Verilog HDL.",
  },
];

export const EXPERIENCE = [
  {
    role: "Summer Internship — FPGA & VLSI Design",
    org: "Sense Semiconductor & IT Solutions Pvt. Ltd. (SSIT)",
    period: "01 May 2026 – 15 June 2026",
    points: [
      "Completed the Foundation Course in FPGA & VLSI as part of SSIT's Summer Internship Program 2026 (Cert. No. SSIT-2026-1196).",
      "Hands-on training in digital design, RTL workflows and FPGA-based prototyping.",
      "Built industry-oriented mini-projects demonstrating problem-solving, debugging and communication skills.",
    ],
    certUrl: CERT_SOURCES.ssit,
  },
  {
    role: "Virtual Internship — Siemens Conceptual CAE Design & Simulation",
    org: "AICTE – EduSkills (Supported by Siemens)",
    period: "April 2026 – June 2026 (8 weeks)",
    points: [
      "Selected for the 8-week AICTE–EduSkills Virtual Internship Program in Siemens Conceptual CAE Design & Simulation.",
      "Worked through structured weekly modules on Polyaxofluxe Foaming with Inspire, Additive Manufacturing and Structural Analysis certification.",
      "Completed weekly assessments, project documentation and a Final Assessment Test to earn the Virtual Internship Certificate.",
    ],
    certUrl: CERT_SOURCES.siemens,
  },
  {
    role: "Research & Project Work — VLSI / RTL",
    org: "KLEF University",
    period: "2024 — Present",
    points: [
      "Designed and verified multiple RTL modules in Verilog on FPGA boards.",
      "Worked on pipelined processor and DSP datapath projects.",
      "Serving as a Reviewer for the International Journal of Innovative Research in Technology (IJIRT, ISSN 2349-6002).",
    ],
    certUrl: CERT_SOURCES.ijirt,
  },
];

export const RESEARCH = [
  {
    title:
      "Evaluation of Ripple Carry and Carry Look-Ahead Adder-Based 8-Bit ALU Architectures Using Verilog HDL",
    venue: "Conference Paper • 2026",
    year: "2026",
    abstract:
      "Evaluation of Ripple Carry and Carry Look-Ahead adder-based 8-bit ALU architectures implemented using Verilog HDL for FPGA-based digital design. This is my first research publication, marking the beginning of my work in VLSI research.",
    keywords: ["VLSI", "Verilog HDL", "8-bit ALU", "Ripple Carry", "Carry Look-Ahead"],
  },
];

export type CertItem = {
  name: string;
  url?: string;
  issueDate?: string;
  credentialId?: string;
  issuerUrl?: string;
};
export const CERTIFICATIONS: { issuer: string; items: CertItem[] }[] = [
  {
    issuer: "AMDOX",
    items: [
      {
        name: "Certificate of Internship — Web Development",
        url: CERT_SOURCES.amdox,
        issueDate: "2026-07-30",
        credentialId: "adx/MDWS3tAsmv",
        issuerUrl: "https://www.amdox.in",
      },
    ],
  },
  {
    issuer: "Sense Semiconductor (SSIT)",
    items: [{ name: "FPGA & VLSI Design Internship Certificate", url: CERT_SOURCES.ssit }],
  },
  {
    issuer: "AICTE – EduSkills (Siemens)",
    items: [{ name: "Siemens Conceptual CAE Design & Simulation", url: CERT_SOURCES.siemens }],
  },
  {
    issuer: "IJIRT Reviewer Board",
    items: [{ name: "Journal Reviewer Appointment Certificate", url: CERT_SOURCES.ijirt }],
  },
  {
    issuer: "TARAS",
    items: [{ name: "AI & Machine Learning with Python Programming", url: CERT_SOURCES.taras }],
  },
  {
    issuer: "Linux Foundation",
    items: [{ name: "Introduction to Hands-on Linux", url: CERT_SOURCES.linux }],
  },
  {
    issuer: "Cisco Networking Academy",
    items: [{ name: "Getting Started with Cisco Packet Tracer", url: CERT_SOURCES.cisco }],
  },
  {
    issuer: "Coursera",
    items: [{ name: "Python for Everybody Specialization", url: CERT_SOURCES.coursera }],
  },
];

export const CODING = [
  { name: "LeetCode", handle: "kl2400040454", url: PROFILE.leetcode },
  { name: "CodeChef", handle: "klu2400040454 · 3-Star", url: PROFILE.codechef },
  { name: "HackerRank", handle: "kl2400040454", url: PROFILE.hackerrank },
  { name: "Codeforces", handle: "2400040454", url: PROFILE.codeforces },
];

/** Flattened, URL-addressable credential records for /certifications/$credentialId */
export type CredentialRecord = CertItem & {
  issuer: string;
  slug: string;
  isPdf: boolean;
  fileSize?: number;
  fileUpdatedAt?: string;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const CREDENTIALS: CredentialRecord[] = CERTIFICATIONS.flatMap((c) =>
  c.items.map((i) => ({
    ...i,
    issuer: c.issuer,
    slug: slugify(i.credentialId ?? `${c.issuer}-${i.name}`),
    isPdf: !!i.url && /\.pdf($|\?)/i.test(i.url),
    fileSize: i.url ? CERT_FILE_META[i.url]?.size : undefined,
    fileUpdatedAt: i.url ? CERT_FILE_META[i.url]?.updatedAt : undefined,
  })),
);

export const getCredential = (slug: string) =>
  CREDENTIALS.find((c) => c.slug === slug.toLowerCase());

export const ACHIEVEMENTS = [
  { icon: "Trophy", title: "CGPA 9.68 / 10", note: "Top of class, ECE" },
  { icon: "Award", title: "Smart India Hackathon", note: "Participant" },
  { icon: "Star", title: "CodeChef 3-Star", note: "Active competitive programmer" },
  { icon: "BookOpen", title: "ORCID Researcher", note: "Active research profile" },
  { icon: "Sparkles", title: "Multi-platform Coder", note: "LeetCode · CF · HR · GFG" },
  { icon: "Zap", title: "Open Source Contributor", note: "GitHub @Born-as-Harsha" },
];

export const INTERESTS = [
  "VLSI and Semiconductor Devices",
  "GATE Preparation",
  "Competitive Programming",
  "Open Source",
];

export const CORE_COURSES = [
  { name: "Digital VLSI Design", code: "ECE 3102" },
  { name: "RTL Design with Verilog", code: "ECE 3105" },
  { name: "Digital Electronics", code: "ECE 2101" },
  { name: "Analog Electronics", code: "ECE 2202" },
  { name: "Computer Organization & Architecture", code: "ECE 3201" },
  { name: "Signals & Systems", code: "ECE 2103" },
  { name: "Embedded Systems", code: "ECE 3204" },
  { name: "Microprocessors & Microcontrollers", code: "ECE 3104" },
];

export function buildResumeData(): ResumeData {
  return {
    name: PROFILE.name,
    title: PROFILE.title,
    contact: [PROFILE.location, PROFILE.phone, PROFILE.email],
    links: [
      { label: "GitHub", url: PROFILE.github },
      { label: "LinkedIn", url: PROFILE.linkedin },
      { label: "ORCID", url: PROFILE.orcid },
      { label: "Scholar", url: PROFILE.scholar },
    ],
    sections: [
      {
        heading: "Education",
        blocks: EDUCATION.map((e) => ({
          kind: "kv" as const,
          left: e.degree,
          right: e.period,
          sub: `${e.org} • ${e.detail}`,
        })),
      },
      {
        heading: "Technical Skills",
        blocks: SKILLS.map((s) => ({
          kind: "label-list" as const,
          label: s.group,
          items: s.items,
        })),
      },
      {
        heading: "Projects",
        blocks: PROJECTS.flatMap((p) => [
          { kind: "kv" as const, left: p.title, right: p.tag, sub: `Tech: ${p.tech.join(", ")}` },
          { kind: "para" as const, text: p.description },
          { kind: "bullets" as const, items: p.highlights },
        ]),
      },
      {
        heading: "Experience",
        blocks: EXPERIENCE.flatMap((e) => [
          { kind: "kv" as const, left: e.role, right: e.period, sub: e.org },
          { kind: "bullets" as const, items: e.points },
        ]),
      },
      {
        heading: "Research",
        blocks: RESEARCH.flatMap((r) => [
          {
            kind: "kv" as const,
            left: r.title,
            right: r.year,
            sub: `${r.venue} • ${r.keywords.join(", ")}`,
          },
          { kind: "para" as const, text: r.abstract },
        ]),
      },
      {
        heading: "Certifications",
        blocks: CERTIFICATIONS.map((c) => ({
          kind: "linked-list" as const,
          label: c.issuer,
          items: c.items.map((it) => ({ name: it.name, url: absolutize(it.url) })),
        })),
      },
      {
        heading: "Competitive Programming",
        blocks: [
          {
            kind: "label-list",
            label: "Profiles",
            items: CODING.map((c) => `${c.name} (${c.handle})`),
          },
          {
            kind: "para",
            text: "Active problem-solver on CodeChef (3-Star) and LeetCode. Strong analytical, logical reasoning and debugging skills. Working knowledge of data structures and core algorithms.",
          },
        ],
      },
      {
        heading: "Interests",
        blocks: [{ kind: "label-list", label: "Areas", items: INTERESTS }],
      },
    ],
  };
}
