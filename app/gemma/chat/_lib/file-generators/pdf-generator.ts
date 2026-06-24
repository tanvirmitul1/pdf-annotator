import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PdfStructure } from "../types";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10.5;
const HEADING_SIZE = 13;
const TITLE_SIZE = 22;
const LINE_HEIGHT = BODY_SIZE * 1.7;
const HEADING_LINE_HEIGHT = HEADING_SIZE * 1.5;
const FOOTER_ZONE = 50; // reserved for footer

// Color palette — each section heading cycles through these
const SECTION_COLORS = [
  { accent: rgb(0.16, 0.5, 0.73), bg: rgb(0.93, 0.96, 0.99) }, // blue
  { accent: rgb(0.13, 0.59, 0.46), bg: rgb(0.93, 0.98, 0.96) }, // teal
  { accent: rgb(0.61, 0.35, 0.71), bg: rgb(0.96, 0.94, 0.99) }, // purple
  { accent: rgb(0.85, 0.47, 0.15), bg: rgb(0.99, 0.96, 0.93) }, // orange
  { accent: rgb(0.76, 0.24, 0.35), bg: rgb(0.99, 0.94, 0.95) }, // rose
  { accent: rgb(0.2, 0.6, 0.27), bg: rgb(0.94, 0.98, 0.94) }, // green
];

const TITLE_BAR_COLOR = rgb(0.14, 0.33, 0.53);
const TITLE_TEXT_COLOR = rgb(1, 1, 1);
const META_COLOR = rgb(0.45, 0.45, 0.45);
const BODY_COLOR = rgb(0.18, 0.18, 0.18);
const DIVIDER_COLOR = rgb(0.85, 0.85, 0.85);

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

export async function generatePdf(content: string): Promise<Uint8Array> {
  let pdfData: PdfStructure;
  try {
    pdfData = JSON.parse(content) as PdfStructure;
  } catch {
    pdfData = { title: "Document", sections: [{ body: content }] };
  }

  const doc = await PDFDocument.create();
  if (pdfData.title) doc.setTitle(pdfData.title);
  if (pdfData.author) doc.setAuthor(pdfData.author);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < FOOTER_ZONE) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  // ── Title bar (full-width colored banner) ──────────────────
  if (pdfData.title) {
    const titleLines = wrapText(
      pdfData.title,
      boldFont,
      TITLE_SIZE,
      CONTENT_WIDTH - 30
    );
    const barHeight = titleLines.length * (TITLE_SIZE * 1.4) + 30;

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - barHeight,
      width: PAGE_WIDTH,
      height: barHeight,
      color: TITLE_BAR_COLOR,
    });

    y = PAGE_HEIGHT - 24;
    for (const line of titleLines) {
      page.drawText(line, {
        x: MARGIN + 4,
        y,
        size: TITLE_SIZE,
        font: boldFont,
        color: TITLE_TEXT_COLOR,
      });
      y -= TITLE_SIZE * 1.4;
    }

    y = PAGE_HEIGHT - barHeight - 16;
  }

  // ── Metadata ───────────────────────────────────────────────
  if (pdfData.author || pdfData.createdAt) {
    const meta = [pdfData.author, pdfData.createdAt]
      .filter(Boolean)
      .join("  \u2022  ");
    ensureSpace(LINE_HEIGHT + 16);
    page.drawText(meta, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: META_COLOR,
    });
    y -= LINE_HEIGHT;

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: DIVIDER_COLOR,
    });
    y -= 16;
  }

  // ── Sections ───────────────────────────────────────────────
  const sections = pdfData.sections ?? [];
  let colorIdx = 0;

  for (const section of sections) {
    const palette = SECTION_COLORS[colorIdx % SECTION_COLORS.length];

    if (section.heading) {
      const headingLines = wrapText(
        section.heading,
        boldFont,
        HEADING_SIZE,
        CONTENT_WIDTH - 22
      );
      const blockH = headingLines.length * HEADING_LINE_HEIGHT + 14;

      ensureSpace(blockH + LINE_HEIGHT);
      y -= 8;

      const bgTop = y + HEADING_SIZE + 5;

      // Light background rectangle
      page.drawRectangle({
        x: MARGIN,
        y: bgTop - blockH,
        width: CONTENT_WIDTH,
        height: blockH,
        color: palette.bg,
      });

      // Colored left accent bar
      page.drawRectangle({
        x: MARGIN,
        y: bgTop - blockH,
        width: 4,
        height: blockH,
        color: palette.accent,
      });

      // Heading text in accent color
      for (const line of headingLines) {
        page.drawText(line, {
          x: MARGIN + 14,
          y,
          size: HEADING_SIZE,
          font: boldFont,
          color: palette.accent,
        });
        y -= HEADING_LINE_HEIGHT;
      }
      y -= 8;
      colorIdx++;
    }

    if (section.body) {
      const bodyLines = wrapText(section.body, font, BODY_SIZE, CONTENT_WIDTH);
      for (const line of bodyLines) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, {
          x: MARGIN,
          y,
          size: BODY_SIZE,
          font,
          color: BODY_COLOR,
        });
        y -= LINE_HEIGHT;
      }
      y -= 10;
    }
  }

  // ── Page footers ───────────────────────────────────────────
  const pages = doc.getPages();
  const pageCount = pages.length;
  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const footerText = `Page ${i + 1} of ${pageCount}`;
    const fw = font.widthOfTextAtSize(footerText, 8);

    p.drawLine({
      start: { x: MARGIN, y: 40 },
      end: { x: PAGE_WIDTH - MARGIN, y: 40 },
      thickness: 0.4,
      color: DIVIDER_COLOR,
    });
    p.drawText(footerText, {
      x: (PAGE_WIDTH - fw) / 2,
      y: 26,
      size: 8,
      font,
      color: META_COLOR,
    });
  }

  return doc.save();
}
