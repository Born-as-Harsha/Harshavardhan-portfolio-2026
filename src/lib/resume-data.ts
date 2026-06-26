import type { ResumeData } from "./generate-resume-pdf";
import ssitCert from "@/assets/certs/ssit-fpga-vlsi.jpg.asset.json";
import ijirtCert from "@/assets/certs/ijirt-reviewer.jpg.asset.json";
import siemensCert from "@/assets/certs/eduskills-siemens.jpg.asset.json";
import tarasCert from "@/assets/certs/taras-ai-ml.pdf.asset.json";
import linuxCert from "@/assets/certs/linux-foundation.pdf.asset.json";
import ciscoCert from "@/assets/certs/cisco-packet-tracer.pdf.asset.json";

/** Absolute URL helper — PDFs are read offline so links must be fully-qualified. */
const SITE_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "https://yelleti-harshavardhan.lovable.app";
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_ORIGIN}${path}`);

export const CERT_SOURCES = {
  ssit: abs(ssitCert.url),
  ijirt: abs(ijirtCert.url),
  siemens: abs(siemensCert.url),
  taras: abs(tarasCert.url),
  linux: abs(linuxCert.url),
  cisco: abs(ciscoCert.url),
  coursera: "https://www.coursera.org/learner/harshavardhan-yelleti",
} as const;

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
  { group: "VLSI & Semiconductor", items: ["Digital VLSI Design", "RTL Design (Verilog HDL)", "FPGA Design", "CMOS Fundamentals", "MOSFET Analysis"] },
  { group: "Electronics", items: ["Digital Electronics", "Analog Electronics"] },
  { group: "Computer Organization & Architecture", items: ["Computer Organization", "Computer Architecture"] },
  { group: "Embedded Systems", items: ["Embedded Systems (Learning)"] },
  { group: "Programming", items: ["C", "Python", "Verilog HDL", "Problem Solving"] },
  { group: "Machine Learning", items: ["Machine Learning Fundamentals", "NumPy", "Pandas"] },
  { group: "EDA & Simulation Tools", items: ["Xilinx Vivado", "ModelSim", "NI Multisim", "LTspice", "Cisco Packet Tracer", "Git & GitHub"] },
];

export const PROJECTS = [
  { title: "FPGA-Based 8-Bit ALU Using Verilog HDL", tag: "RTL · FPGA", tech: ["Verilog HDL", "Xilinx Vivado", "FPGA"], description: "Designed and verified an 8-bit Arithmetic Logic Unit in Verilog HDL targeting an FPGA, with testbench-driven simulation and synthesis.", highlights: ["8-bit ALU operations", "Testbench verification", "FPGA synthesis flow"], github: PROFILE.github + "/FPGA-8bit-ALU-Verilog" },
  { title: "DC Analysis and Short Channel Effects in MOSFETs", tag: "Analog VLSI", tech: ["NI Multisim", "LTspice"], description: "Analyzed NMOS and PMOS transistor characteristics including short-channel effects and channel length modulation across operating regions.", highlights: ["I_D-V_GS / I_D-V_DS plots", "Short-channel analysis", "Device-level insight"], github: PROFILE.github + "/MOSFET-DC-Analysis" },
  { title: "Student Activity & Achievement Management System", tag: "Python Full Stack", tech: ["Python", "Full Stack", "Web"], description: "Web-based system to manage student extracurricular activities and achievements, built with full-stack Python.", highlights: ["CRUD workflows", "Activity tracking", "Data management"], github: PROFILE.github + "/Student-Activity-Tracker" },
  { title: "Machine Learning for Weather Data Analysis", tag: "Python · ML", tech: ["Python", "scikit-learn", "Pandas"], description: "End-to-end weather data pipeline using regression and clustering algorithms with standard evaluation metrics.", highlights: ["EDA pipeline", "Regression + K-Means", "Model evaluation"], github: PROFILE.github + "/ML-Weather-Analysis" },
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
  },
];

export const RESEARCH = [
  {
    title: "Evaluation of Ripple Carry and Carry Look-Ahead Adder-Based 8-Bit ALU Architectures Using Verilog HDL",
    venue: "Conference Paper • 2026",
    year: "2026",
    abstract: "Evaluation of Ripple Carry and Carry Look-Ahead adder-based 8-bit ALU architectures implemented using Verilog HDL for FPGA-based digital design. This is my first research publication, marking the beginning of my work in VLSI research.",
    keywords: ["VLSI", "Verilog HDL", "8-bit ALU", "Ripple Carry", "Carry Look-Ahead"],
  },
];

export type CertItem = { name: string; url?: string };
export const CERTIFICATIONS: { issuer: string; items: CertItem[] }[] = [
  { issuer: "TARAS", items: [{ name: "AI & Machine Learning with Python Programming", url: CERT_SOURCES.taras }] },
  { issuer: "Linux Foundation", items: [{ name: "Introduction to Hands-on Linux", url: CERT_SOURCES.linux }] },
  { issuer: "Cisco Networking Academy", items: [{ name: "Getting Started with Cisco Packet Tracer", url: CERT_SOURCES.cisco }] },
  { issuer: "Coursera", items: [{ name: "Python for Everybody", url: "https://www.coursera.org/learn/python" }] },
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
          kind: "linked-list" as const,
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