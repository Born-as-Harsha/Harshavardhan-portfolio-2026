import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CERTIFICATIONS, CERT_SOURCES } from "@/lib/resume-data";

const indexSource = readFileSync("src/routes/index.tsx", "utf8");

describe("navigation", () => {
  const expected = [
    "About",
    "Coursework",
    "Skills",
    "Projects",
    "Research",
    "Experience",
    "Certifications",
    "Platforms",
    "Contact",
  ];

  it("renders the nav labels in the intended order", () => {
    const block = indexSource.slice(indexSource.indexOf("function Nav()"));
    const labels = [...block.slice(0, block.indexOf("];")).matchAll(/\["([^"]+)",\s*"#/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual(expected);
  });

  it("points every nav entry at an existing section id", () => {
    const block = indexSource.slice(indexSource.indexOf("function Nav()"));
    const hrefs = [...block.slice(0, block.indexOf("];")).matchAll(/"#([a-z]+)"/g)].map(
      (m) => m[1],
    );
    for (const id of hrefs) {
      expect(indexSource).toContain(`id="${id}"`);
    }
  });
});

describe("certifications", () => {
  it("includes the AMDOX web development internship with full metadata", () => {
    const amdox = CERTIFICATIONS.find((c) => c.issuer === "AMDOX");
    expect(amdox).toBeDefined();
    const cert = amdox!.items[0];
    expect(cert.name).toBe("Certificate of Internship — Web Development");
    expect(cert.credentialId).toBe("adx/MDWS3tAsmv");
    expect(cert.issueDate).toBe("2026-07-30");
    expect(cert.url).toBe(CERT_SOURCES.amdox);
    expect(cert.issuerUrl).toBe("https://www.amdox.in");
  });

  it("gives every certification a verification URL", () => {
    for (const group of CERTIFICATIONS) {
      for (const item of group.items) {
        expect(item.url, `${group.issuer} / ${item.name}`).toBeTruthy();
      }
    }
  });

  it("emits schema.org credential markup on the home route", () => {
    expect(indexSource).toContain('type="application/ld+json"');
    expect(indexSource).toContain("EducationalOccupationalCredential");
    expect(indexSource).toContain("hasCredential");
  });
});