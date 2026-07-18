import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFName, PDFString } from "pdf-lib";

type ResumeSection = { heading: string; blocks: ResumeBlock[] };
type ResumeBlock =
  | { kind: "kv"; left: string; right?: string; sub?: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "para"; text: string }
  | { kind: "label-list"; label: string; items: string[] }
  | { kind: "linked-list"; label: string; items: { name: string; url?: string }[] };

export type ResumeData = {
  name: string;
  title: string;
  contact: string[];
  links: { label: string; url: string }[];
  sections: ResumeSection[];
};

const MARGIN = 48;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ACCENT = rgb(0.04, 0.55, 0.75);
const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.87, 0.9);
const LINK = rgb(0.04, 0.45, 0.72);

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(trial, size) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = trial;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildResumePdf(data: ResumeData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${data.name} — Resume`);
  pdf.setAuthor(data.name);
  pdf.setCreator("Portfolio Site");
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const obli = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensure = (need: number) => {
    if (y - need < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawText = (
    text: string,
    opts: { x?: number; size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const { x = MARGIN, size = 9.5, font = reg, color = INK } = opts;
    page.drawText(text, { x, y, size, font, color });
  };

  const addLink = (url: string, x: number, yBottom: number, w: number, h: number) => {
    const annot = pdf.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, yBottom, x + w, yBottom + h],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    });
    const ref = pdf.context.register(annot);
    const existing = page.node.Annots();
    if (!existing) {
      page.node.set(PDFName.of("Annots"), pdf.context.obj([ref]));
    } else {
      (existing as unknown as { push: (r: unknown) => void }).push(ref);
    }
  };

  // Header
  drawText(data.name, { size: 22, font: bold });
  y -= 24;
  drawText(data.title, { size: 11, font: obli, color: ACCENT });
  y -= 14;
  const contactLine = data.contact.join("  •  ");
  drawText(contactLine, { size: 9, color: MUTED });
  y -= 12;
  const linksLine = data.links.map((l) => l.url).join("  •  ");
  drawText(linksLine, { size: 9, color: MUTED });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.8,
    color: ACCENT,
  });
  y -= 18;

  for (const section of data.sections) {
    ensure(40);
    drawText(section.heading.toUpperCase(), { size: 10.5, font: bold, color: ACCENT });
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.4,
      color: RULE,
    });
    y -= 14;

    for (const block of section.blocks) {
      if (block.kind === "kv") {
        ensure(28);
        drawText(block.left, { size: 10.5, font: bold });
        if (block.right) {
          const w = reg.widthOfTextAtSize(block.right, 9.5);
          drawText(block.right, { x: PAGE_W - MARGIN - w, size: 9.5, color: MUTED });
        }
        y -= 13;
        if (block.sub) {
          drawText(block.sub, { size: 9.5, font: obli, color: MUTED });
          y -= 12;
        }
        y -= 2;
      } else if (block.kind === "bullets") {
        for (const item of block.items) {
          const lines = wrap(item, reg, 9.5, CONTENT_W - 14);
          ensure(lines.length * 12 + 2);
          drawText("•", { x: MARGIN + 2, size: 10, color: ACCENT });
          for (let i = 0; i < lines.length; i++) {
            drawText(lines[i], { x: MARGIN + 14, size: 9.5 });
            y -= 12;
          }
          y -= 1;
        }
        y -= 4;
      } else if (block.kind === "para") {
        const lines = wrap(block.text, reg, 9.5, CONTENT_W);
        ensure(lines.length * 12);
        for (const line of lines) {
          drawText(line, { size: 9.5 });
          y -= 12;
        }
        y -= 4;
      } else if (block.kind === "label-list") {
        const text = `${block.label}: ${block.items.join(", ")}`;
        const labelW = bold.widthOfTextAtSize(block.label + ":", 9.5);
        const rest = " " + block.items.join(", ");
        // Render label bold then items wrapped
        const fullLines = wrap(text, reg, 9.5, CONTENT_W);
        ensure(fullLines.length * 12 + 2);
        // first line: draw label bold, then the rest
        drawText(block.label + ":", { size: 9.5, font: bold });
        const firstRest = fullLines[0].slice((block.label + ":").length);
        drawText(firstRest, { x: MARGIN + labelW, size: 9.5 });
        y -= 12;
        for (let i = 1; i < fullLines.length; i++) {
          drawText(fullLines[i], { size: 9.5 });
          y -= 12;
        }
        y -= 3;
      } else if (block.kind === "linked-list") {
        // Issuer header line
        ensure(14);
        drawText(block.label + ":", { size: 9.5, font: bold });
        y -= 12;
        for (const item of block.items) {
          const nameLines = wrap(item.name, reg, 9.5, CONTENT_W - 18);
          const urlLine = item.url ? 11 : 0;
          ensure(nameLines.length * 12 + urlLine + 2);
          drawText("•", { x: MARGIN + 4, size: 10, color: ACCENT });
          for (let i = 0; i < nameLines.length; i++) {
            drawText(nameLines[i], { x: MARGIN + 16, size: 9.5 });
            y -= 12;
          }
          if (item.url) {
            const label = "-> Verify source: " + item.url;
            const truncated = label.length > 110 ? label.slice(0, 107) + "…" : label;
            const w = obli.widthOfTextAtSize(truncated, 8.5);
            drawText(truncated, { x: MARGIN + 16, size: 8.5, font: obli, color: LINK });
            // link annotation rect uses bottom-left; y currently sits at baseline
            addLink(item.url, MARGIN + 16, y - 1, Math.min(w, CONTENT_W - 16), 10);
            y -= 11;
          }
        }
        y -= 4;
      }
    }
    y -= 6;
  }

  return pdf.save();
}

export function downloadResumePdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
