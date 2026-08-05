import type { ResumeData } from "./generate-resume-pdf";
import ssitCert from "@/assets/certs/ssit-fpga-vlsi.jpg.asset.json";
import ijirtCert from "@/assets/certs/ijirt-reviewer.jpg.asset.json";
import siemensCert from "@/assets/certs/eduskills-siemens.jpg.asset.json";
import tarasCert from "@/assets/certs/taras-ai-ml.pdf.asset.json";
import linuxCert from "@/assets/certs/linux-foundation.pdf.asset.json";
import ciscoCert from "@/assets/certs/cisco-packet-tracer.pdf.asset.json";
import amdoxCert from "@/assets/certs/amdox-internship.pdf.asset.json";

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
  coursera: "https://www.coursera.org/learner/harshavardhan-yelleti",
} as const;

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
  year: "Second Year",
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
    period: "2024 – 2026 (Second Year)",
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

export const PROJECTS = [
  {
    title: "Pipelined RISC-V (RV32I) Processor Core",
    tag: "RTL · Computer Architecture",
    icon: "Cpu",
    tech: ["Verilog HDL", "Xilinx Vivado", "ModelSim", "GTKWave"],
    description:
      "Designed and verified a 5-stage pipelined RISC-V (RV32I) processor core in Verilog HDL, featuring hazard detection, forwarding units, and instruction/data cache simulation.",
    highlights: [
      "5-stage pipelined execution path",
      "Hazard detection & forwarding logic",
      "Instruction & Data cache integration",
    ],
    github: PROFILE.github + "/RISCV-Pipelined-Core",
  },
  {
    title: "FPGA-Based 8-Point Fast Fourier Transform (FFT) Processor",
    tag: "RTL · DSP Architecture",
    icon: "Radio",
    tech: ["Verilog HDL", "Xilinx Vivado", "MATLAB"],
    description:
      "Implemented a butterfly-architecture-based 8-point FFT processor in Verilog for high-speed digital signal processing on FPGA, verifying accuracy against MATLAB models.",
    highlights: [
      "Butterfly computing unit optimization",
      "Fixed-point arithmetic scaling",
      "Validation with MATLAB test signals",
    ],
    github: PROFILE.github + "/FPGA-FFT-Processor",
  },
  {
    title: "FPGA-Based 8-Bit ALU Using Verilog HDL",
    tag: "RTL · FPGA",
    icon: "Binary",
    tech: ["Verilog HDL", "Xilinx Vivado", "FPGA"],
    description:
      "Designed and verified an 8-bit Arithmetic Logic Unit in Verilog HDL targeting an FPGA, with testbench-driven simulation and synthesis.",
    highlights: ["8-bit ALU operations", "Testbench verification", "FPGA synthesis flow"],
    github: PROFILE.github + "/FPGA-8bit-ALU-Verilog",
  },
  {
    title: "DC Analysis and Short Channel Effects in MOSFETs",
    tag: "Analog VLSI",
    icon: "Microchip",
    tech: ["NI Multisim", "LTspice"],
    description:
      "Analyzed NMOS and PMOS transistor characteristics including short-channel effects and channel length modulation across operating regions.",
    highlights: ["I_D-V_GS / I_D-V_DS plots", "Short-channel analysis", "Device-level insight"],
    github: PROFILE.github + "/MOSFET-DC-Analysis",
  },
  {
    title: "Student Activity & Achievement Management System",
    tag: "Python Full Stack",
    icon: "FileCode2",
    tech: ["Python", "Full Stack", "Web"],
    description:
      "Web-based system to manage student extracurricular activities and achievements, built with full-stack Python.",
    highlights: ["CRUD workflows", "Activity tracking", "Data management"],
    github: PROFILE.github + "/Student-Activity-Tracker",
  },
  {
    title: "Machine Learning for Weather Data Analysis",
    tag: "Python · ML",
    icon: "BrainCircuit",
    tech: ["Python", "scikit-learn", "Pandas"],
    description:
      "End-to-end weather data pipeline using regression and clustering algorithms with standard evaluation metrics.",
    highlights: ["EDA pipeline", "Regression + K-Means", "Model evaluation"],
    github: PROFILE.github + "/ML-Weather-Analysis",
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

export const ACHIEVEMENTS = [
  { icon: "Trophy", title: "CGPA 9.68 / 10", note: "Top of class, second-year ECE" },
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
