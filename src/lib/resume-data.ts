import type { ResumeData } from "./generate-resume-pdf";

export const PROFILE = {
  name: "Yelleti Harshavardhan",
  title: "B.Tech ECE • VLSI / RTL / FPGA / ASIC Enthusiast",
  university: "Koneru Lakshmaiah Education Foundation (KLEF University)",
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

export const SKILLS: { group: string; items: string[] }[] = [
  { group: "VLSI & Hardware", items: ["Digital VLSI Design", "RTL Design (Verilog)", "FPGA Prototyping", "ASIC Design Flow", "Computer Architecture", "Digital Electronics", "MOSFET / CMOS Fundamentals"] },
  { group: "Programming", items: ["C", "Python", "Verilog HDL", "Data Structures & Algorithms"] },
  { group: "EDA & Simulation", items: ["Xilinx Vivado", "ModelSim / QuestaSim", "NI Multisim", "LTspice", "EasyEDA", "Cisco Packet Tracer"] },
  { group: "ML & Python", items: ["NumPy", "Pandas", "Matplotlib", "Linear / Logistic Regression", "K-Means Clustering"] },
  { group: "Communication & Networks", items: ["Digital Communication", "EM Waves & Transmission Lines", "Network Protocols & Security", "Signals & Communication Systems"] },
];

export const PROJECTS = [
  { title: "DC Analysis & Short Channel Effects in MOSFETs", tag: "Analog VLSI", tech: ["NI Multisim", "LTspice"], description: "Analyzed NMOS and PMOS transistor characteristics including short-channel effects and channel length modulation across operating regions.", highlights: ["I_D-V_GS / I_D-V_DS plots", "Short-channel analysis", "Device-level insight"] },
  { title: "ML for Weather Data Analysis", tag: "Python · ML", tech: ["Python", "scikit-learn", "Pandas"], description: "End-to-end weather data pipeline using regression and clustering algorithms with standard evaluation metrics.", highlights: ["EDA pipeline", "Regression + K-Means", "Model evaluation"] },
  { title: "Activity & Achievement Tracker", tag: "Full Stack", tech: ["Python", "Web"], description: "Web-based system to manage student extracurricular activities and achievements built with full-stack Python concepts.", highlights: ["CRUD workflows", "Activity tracking", "Data management"] },
];

export const EXPERIENCE = [
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
];

export const RESEARCH = [
  {
    title: "Research in Digital VLSI & FPGA-based Systems",
    venue: "Manuscript / Conference Submission",
    year: "2025",
    abstract: "Exploration of RTL-level optimizations and FPGA implementation strategies for energy-efficient digital systems.",
    keywords: ["VLSI", "RTL", "FPGA", "Low Power"],
  },
  {
    title: "AI-Assisted Hardware Design Concepts",
    venue: "Working Paper",
    year: "2025",
    abstract: "Investigating the role of machine learning in EDA flows, with focus on RTL generation aids and verification assistance.",
    keywords: ["ML for EDA", "RTL", "Verification"],
  },
];

export const CERTIFICATIONS: { issuer: string; items: string[] }[] = [
  { issuer: "Taras", items: ["AI & Machine Learning with Python Programming"] },
  { issuer: "Coursera", items: ["Python for Everybody", "Python Data Structures", "Computing: Bits and Bytes"] },
  { issuer: "Linux Foundation", items: ["Introduction to Hands-On Linux"] },
  { issuer: "Cisco Networking Academy", items: ["Getting Started with Cisco Packet Tracer"] },
];

export const CODING = [
  { name: "LeetCode", handle: "kl2400040454", url: PROFILE.leetcode },
  { name: "CodeChef", handle: "klu2400040454 · 3★", url: PROFILE.codechef },
  { name: "HackerRank", handle: "kl2400040454", url: PROFILE.hackerrank },
  { name: "Codeforces", handle: "2400040454", url: PROFILE.codeforces },
];

export const INTERESTS = [
  "VLSI and Semiconductor Devices",
  "GATE Preparation",
  "Competitive Programming",
  "Open Source",
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
          { kind: "kv" as const, left: r.title, right: r.year, sub: `${r.venue} • ${r.keywords.join(", ")}` },
          { kind: "para" as const, text: r.abstract },
        ]),
      },
      {
        heading: "Certifications",
        blocks: CERTIFICATIONS.map((c) => ({
          kind: "label-list" as const,
          label: c.issuer,
          items: c.items,
        })),
      },
      {
        heading: "Competitive Programming",
        blocks: [
          { kind: "label-list", label: "Profiles", items: CODING.map((c) => `${c.name} (${c.handle})`) },
          { kind: "para", text: "Active problem-solver on CodeChef (3★) and LeetCode. Strong analytical, logical reasoning and debugging skills. Working knowledge of data structures and core algorithms." },
        ],
      },
      {
        heading: "Interests",
        blocks: [{ kind: "label-list", label: "Areas", items: INTERESTS }],
      },
    ],
  };
}