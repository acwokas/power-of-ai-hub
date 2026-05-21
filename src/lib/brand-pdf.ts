import jsPDF from 'jspdf';

// Tool-agnostic branded PDF exporter for EDGE tools.
//
// Generates a styled, multi-page PDF using the EDGE Framework brand:
//   navy background hsl(222 47% 8%), foreground white, amber accent hsl(36 95% 62%).
// Renders a cover, then one section per block of content. Markdown-lite parsing:
//   ## section headers, ### sub-headers, **bold** spans, bullet lines starting with - or *.

export interface BrandPdfSection {
  title: string;
  content: string;
}

export interface BrandPdfFieldGroup {
  label: string;
  items: { label: string; value: string }[];
}

export interface BrandPdfInput {
  toolName: string;
  documentTitle: string;
  subtitle?: string;
  generatedAt?: string | Date;
  sections: BrandPdfSection[];
  inputs?: BrandPdfFieldGroup[];
  footerNote?: string;
  fileName?: string;
}

const PAGE = { w: 210, h: 297 }; // A4 mm
const MARGIN = { left: 18, right: 18, top: 22, bottom: 22 };
const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right;

// EDGE brand colors
const NAVY: [number, number, number] = [12, 16, 31];      // background
const NAVY_DEEP: [number, number, number] = [8, 11, 22];  // cover
const TEXT: [number, number, number] = [240, 242, 248];   // body on navy
const MUTED: [number, number, number] = [180, 186, 204];  // labels on navy
const ACCENT: [number, number, number] = [243, 169, 41];  // amber

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setStroke(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function paintBackground(doc: jsPDF, deep = false) {
  setFill(doc, deep ? NAVY_DEEP : NAVY);
  doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
}

function drawAccentBar(doc: jsPDF, x: number, y: number, w = 24) {
  setFill(doc, ACCENT);
  doc.rect(x, y, w, 1.4, 'F');
}

function pageFooter(doc: jsPDF, brand: string, pageNum: number, total: number) {
  setText(doc, MUTED);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(brand, MARGIN.left, PAGE.h - 10);
  doc.text(`${pageNum} of ${total}`, PAGE.w - MARGIN.right, PAGE.h - 10, { align: 'right' });
}

function safeText(s: string): string {
  return s.replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function stripBold(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, '$1');
}

function isHeader(line: string): { level: number; text: string } | null {
  const m = /^(#{1,3})\s+(.*)$/.exec(line);
  if (!m) return null;
  return { level: m[1].length, text: m[2].trim() };
}

function isBullet(line: string): { text: string } | null {
  const m = /^[\-*]\s+(.*)$/.exec(line);
  if (!m) return null;
  return { text: m[1].trim() };
}

interface RenderState {
  doc: jsPDF;
  y: number;
  pageNum: number;
  brand: string;
}

function newPage(state: RenderState) {
  state.doc.addPage();
  state.pageNum += 1;
  paintBackground(state.doc);
  state.y = MARGIN.top;
}

function ensureRoom(state: RenderState, needed: number) {
  if (state.y + needed > PAGE.h - MARGIN.bottom - 10) {
    newPage(state);
  }
}

function writeWrapped(state: RenderState, text: string, opts: { size: number; bold?: boolean; color?: [number, number, number]; leading?: number }) {
  const { doc } = state;
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size);
  setText(doc, opts.color || TEXT);
  const leading = opts.leading || opts.size * 0.45 + 1;
  const cleaned = safeText(stripBold(text));
  const lines = doc.splitTextToSize(cleaned, CONTENT_W) as string[];
  for (const line of lines) {
    ensureRoom(state, leading);
    doc.text(line, MARGIN.left, state.y);
    state.y += leading;
  }
}

function writeBullet(state: RenderState, text: string) {
  const { doc } = state;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setText(doc, TEXT);
  const leading = 5.4;
  const cleaned = safeText(stripBold(text));
  const indent = 6;
  const lines = doc.splitTextToSize(cleaned, CONTENT_W - indent) as string[];
  lines.forEach((line, i) => {
    ensureRoom(state, leading);
    if (i === 0) {
      setFill(doc, ACCENT);
      doc.circle(MARGIN.left + 1.6, state.y - 1.4, 0.8, 'F');
    }
    doc.text(line, MARGIN.left + indent, state.y);
    state.y += leading;
  });
}

function writeSectionHeader(state: RenderState, title: string) {
  ensureRoom(state, 18);
  state.y += 2;
  drawAccentBar(state.doc, MARGIN.left, state.y);
  state.y += 5;
  writeWrapped(state, title.toUpperCase(), { size: 13, bold: true, color: ACCENT, leading: 6 });
  state.y += 1.5;
}

function writeSubHeader(state: RenderState, title: string) {
  state.y += 1.5;
  writeWrapped(state, title, { size: 11, bold: true, color: TEXT, leading: 5.8 });
}

function renderMarkdownLite(state: RenderState, body: string) {
  const lines = body.split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) {
      writeWrapped(state, text, { size: 10.5, color: TEXT, leading: 5.2 });
      state.y += 1.5;
    }
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); state.y += 1.5; continue; }
    const h = isHeader(line);
    if (h) {
      flushParagraph();
      if (h.level <= 2) writeSectionHeader(state, h.text);
      else writeSubHeader(state, h.text);
      continue;
    }
    const b = isBullet(line);
    if (b) {
      flushParagraph();
      writeBullet(state, b.text);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
}

function renderCover(state: RenderState, input: BrandPdfInput) {
  const { doc } = state;
  paintBackground(doc, true);

  // Tool tag
  setText(doc, ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const tag = `EDGE Framework / ${input.toolName.toUpperCase()}`;
  doc.text(safeText(tag), MARGIN.left, 38);

  // Accent bar
  setFill(doc, ACCENT);
  doc.rect(MARGIN.left, 44, 28, 1.6, 'F');

  // Title
  setText(doc, TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  const titleLines = doc.splitTextToSize(safeText(input.documentTitle), CONTENT_W) as string[];
  let titleY = 64;
  titleLines.forEach((l) => { doc.text(l, MARGIN.left, titleY); titleY += 12; });

  // Subtitle
  if (input.subtitle) {
    setText(doc, MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    const subLines = doc.splitTextToSize(safeText(input.subtitle), CONTENT_W) as string[];
    subLines.forEach((l) => { doc.text(l, MARGIN.left, titleY); titleY += 7; });
  }

  // Generated stamp
  setText(doc, MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const when = input.generatedAt
    ? (typeof input.generatedAt === 'string' ? new Date(input.generatedAt) : input.generatedAt).toLocaleString('en-GB', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generated ${when}`, MARGIN.left, PAGE.h - 36);

  // Brand mark line
  setFill(doc, ACCENT);
  doc.rect(MARGIN.left, PAGE.h - 28, 6, 6, 'F');
  setText(doc, TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EDGE Framework', MARGIN.left + 10, PAGE.h - 23);
  setText(doc, MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('adrianwatkins.com / edge', MARGIN.left + 10, PAGE.h - 17);
}

export function generateBrandPdf(input: BrandPdfInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  const brand = `EDGE Framework / ${input.toolName} / adrianwatkins.com`;
  const state: RenderState = { doc, y: MARGIN.top, pageNum: 1, brand };

  renderCover(state, input);

  // Content pages
  if (input.sections.length) {
    newPage(state);
    for (const section of input.sections) {
      writeSectionHeader(state, section.title);
      renderMarkdownLite(state, section.content || '');
      state.y += 4;
    }
  }

  // Inputs appendix
  if (input.inputs && input.inputs.length) {
    newPage(state);
    writeSectionHeader(state, 'Your inputs');
    for (const group of input.inputs) {
      writeSubHeader(state, group.label);
      for (const item of group.items) {
        if (!item.value) continue;
        writeWrapped(state, item.label, { size: 9, bold: true, color: MUTED, leading: 4.2 });
        writeWrapped(state, item.value, { size: 10.5, color: TEXT, leading: 5 });
        state.y += 1.5;
      }
      state.y += 2;
    }
  }

  if (input.footerNote) {
    state.y += 4;
    writeWrapped(state, input.footerNote, { size: 9, color: MUTED, leading: 4.4 });
  }

  // Paginate footers
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    pageFooter(doc, brand, p, total);
  }

  return doc;
}

export function downloadBrandPdf(input: BrandPdfInput) {
  const doc = generateBrandPdf(input);
  const file = input.fileName || `${input.documentTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(file);
}
