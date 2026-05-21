// Shared branded PDF builder for democratising.ai EDGE tools.
//
// Brand palette: navy #14264C, cream #F4ECD8, gold #D89A55.
// Serif headlines (Times), clean sans body (Helvetica).
// No em dashes, no en dashes. Use commas, semicolons, and middle dot.
//
// Two public APIs are supported on the same class:
//
// 1. Constructor with options object (preferred for new tools). Renders a
//    cover page on construction and exposes streaming primitives:
//      newPage(), h1(), h2(), h3(), paragraph(), bullets(),
//      calloutCream(), calloutNavy(), ctaCard(), twoColumn(), spacer(),
//      brandFooter(), save()
//
// 2. Constructor that takes a jsPDF ctor and exposes higher level builders:
//      buildCover(), buildSectionPage(), buildCtaPage().
//    Used by the Before You Send tool. Internally uses the same primitives.

export const BRAND_COLORS = {
  navy: '#14264C',
  cream: '#F4ECD8',
  gold: '#D89A55',
  navyRgb: [20, 38, 76] as [number, number, number],
  creamRgb: [244, 236, 216] as [number, number, number],
  goldRgb: [216, 154, 85] as [number, number, number],
};

// ColumnBlock supports two shapes:
//   { kind: 'label' | 'body', text: string, italic?: boolean, tint?: boolean }
// used by twoColumn() for streamed flexible content; or
//   { leftLabel, leftBody, rightLabel, rightBody }
// used by the higher level column callout helper.
export type ColumnBlock =
  | { kind: 'label'; text: string; italic?: boolean; tint?: boolean }
  | { kind: 'body'; text: string; italic?: boolean; tint?: boolean }
  | {
      leftLabel: string;
      leftBody: string;
      rightLabel: string;
      rightBody: string;
    };

export interface CTA {
  title: string;
  url: string;
  blurb: string;
}

export interface BrandPdfOpts {
  toolTitle: string;
  subtitle?: string;
  completedDate?: string;
  userContext?: string;
  filename?: string;
  footerNote?: string;
}

export interface CoverOpts {
  toolName: string;
  subtitle?: string;
  meta?: string;
  excerpt?: string;
  excerptItalic?: boolean;
}

export interface SectionOpts {
  title: string;
  bodyParagraphs?: string[];
  bullets?: string[];
  calloutLabel?: string;
  calloutBody?: string;
  columns?: { leftLabel: string; leftBody: string; rightLabel: string; rightBody: string };
  subSections?: { label: string; body?: string; bullets?: string[] }[];
}

function formatDateLong(d: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// jsPDF is lazy-loaded. Callers can either pass a constructor or use
// makeBrandPdf() / BrandPdf.create() helpers below.
let _jsPDFCtor: any = null;

async function loadJsPdf(): Promise<any> {
  if (_jsPDFCtor) return _jsPDFCtor;
  const mod: any = await import('jspdf');
  _jsPDFCtor = mod.jsPDF || mod.default;
  return _jsPDFCtor;
}

export class BrandPdf {
  private doc: any;
  private pageW: number;
  private pageH: number;
  private margin = 60;
  private cursor = 60;
  private filename = 'report.pdf';

  // Two constructor modes:
  //   new BrandPdf(jsPDFCtor)  -> low level, no cover, user calls build* helpers
  //   new BrandPdf(opts)       -> options object, auto renders cover page
  constructor(arg: any) {
    if (arg && typeof arg === 'function') {
      // jsPDF ctor passed directly
      this.doc = new arg({ unit: 'pt', format: 'a4' });
      this.pageW = this.doc.internal.pageSize.getWidth();
      this.pageH = this.doc.internal.pageSize.getHeight();
      this.cursor = 60;
      return;
    }

    // Options-object mode: jsPDF must be pre-loaded.
    if (!_jsPDFCtor) {
      throw new Error('BrandPdf: jsPDF not loaded. Use BrandPdf.create() or makeBrandPdf().');
    }
    this.doc = new _jsPDFCtor({ unit: 'pt', format: 'a4' });
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.cursor = 60;

    const opts = arg as BrandPdfOpts;
    this.filename = opts.filename || 'report.pdf';
    this.renderCoverPage(opts);
  }

  // Async factory: loads jsPDF and constructs.
  static async create(opts: BrandPdfOpts): Promise<BrandPdf> {
    await loadJsPdf();
    return new BrandPdf(opts);
  }

  private renderCoverPage(opts: BrandPdfOpts) {
    this.paintBackground();
    this.setFont('times', 'bold', 13);
    this.setNavy();
    this.doc.text('democratising.ai', this.margin, 56);

    this.setFont('times', 'bold', 30);
    this.setNavy();
    let y = 200;
    const titleLines = this.doc.splitTextToSize(opts.toolTitle, this.pageW - this.margin * 2) as string[];
    for (const ln of titleLines) {
      this.doc.text(ln, this.pageW / 2, y, { align: 'center' });
      y += 36;
    }

    if (opts.subtitle) {
      this.setFont('times', 'italic', 14);
      this.setNavy();
      const subLines = this.doc.splitTextToSize(opts.subtitle, this.pageW - this.margin * 2 - 40) as string[];
      for (const ln of subLines.slice(0, 4)) {
        this.doc.text(ln, this.pageW / 2, y + 4, { align: 'center' });
        y += 22;
      }
    }

    this.goldRule(y + 8, this.pageW / 2 - 70, this.pageW / 2 - 70);
    y += 28;

    if (opts.completedDate) {
      this.setFont('helvetica', 'normal', 11);
      this.setNavy();
      this.doc.text('Completed ' + opts.completedDate, this.pageW / 2, y, { align: 'center' });
      y += 24;
    }

    if (opts.userContext) {
      this.setFont('times', 'italic', 11);
      this.setNavy();
      const lines = this.doc.splitTextToSize(opts.userContext, this.pageW - this.margin * 2 - 40) as string[];
      for (const ln of lines.slice(0, 6)) {
        this.doc.text(ln, this.pageW / 2, y, { align: 'center' });
        y += 16;
      }
    }

    this.setFont('helvetica', 'italic', 10);
    this.setNavy();
    this.doc.text(
      'Democratising AI for the people who actually run things.',
      this.pageW / 2,
      this.pageH - 60,
      { align: 'center' },
    );
    this.brandFooter();
  }

  // ---- shared primitives ----

  get pageWidth() { return this.pageW; }
  get pageHeight() { return this.pageH; }
  get contentWidth() { return this.pageW - this.margin * 2; }

  paintBackground() {
    this.doc.setFillColor(BRAND_COLORS.cream);
    this.doc.rect(0, 0, this.pageW, this.pageH, 'F');
    this.doc.setTextColor(BRAND_COLORS.navy);
  }

  goldRule(y: number, leftPad?: number, rightPad?: number) {
    const lp = leftPad ?? this.margin;
    const rp = rightPad ?? this.margin;
    this.doc.setDrawColor(BRAND_COLORS.gold);
    this.doc.setLineWidth(1);
    this.doc.line(lp, y, this.pageW - rp, y);
  }

  brandFooter(pageNumber?: number) {
    const y = this.pageH - 36;
    const segW = this.pageW / 3;
    this.doc.setFillColor(BRAND_COLORS.navy);
    this.doc.rect(0, y, segW, 4, 'F');
    this.doc.setFillColor(BRAND_COLORS.cream);
    this.doc.rect(segW, y, segW, 4, 'F');
    this.doc.setFillColor(BRAND_COLORS.gold);
    this.doc.rect(segW * 2, y, segW, 4, 'F');
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(BRAND_COLORS.navy);
    const label = pageNumber !== undefined ? `democratising.ai  ` + String(pageNumber) : 'democratising.ai';
    this.doc.text(label, this.pageW / 2, y + 22, { align: 'center' });
  }

  // alias for older callers
  drawFooter(pageNumber?: number) { this.brandFooter(pageNumber); }

  newPage() {
    this.doc.addPage();
    this.paintBackground();
    this.cursor = 80;
  }

  addPage(withBackground = true) {
    this.doc.addPage();
    if (withBackground) this.paintBackground();
    this.cursor = 80;
  }

  setFont(font: 'times' | 'helvetica' | 'courier', style: 'normal' | 'bold' | 'italic' | 'bolditalic', size: number) {
    this.doc.setFont(font, style);
    this.doc.setFontSize(size);
  }

  setNavy() { this.doc.setTextColor(BRAND_COLORS.navy); }
  setGold() { this.doc.setTextColor(BRAND_COLORS.gold); }

  private ensureSpace(needed: number) {
    if (this.cursor + needed > this.pageH - 60) {
      this.brandFooter();
      this.newPage();
    }
  }

  spacer(h: number) { this.cursor += h; }

  h1(text: string) {
    this.ensureSpace(60);
    this.setFont('times', 'bold', 22);
    this.setNavy();
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const ln of lines) {
      this.doc.text(ln, this.margin, this.cursor);
      this.cursor += 28;
    }
    this.goldRule(this.cursor - 8);
    this.cursor += 18;
  }

  h2(text: string) {
    this.ensureSpace(40);
    this.setFont('times', 'bold', 16);
    this.setNavy();
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const ln of lines) {
      this.doc.text(ln, this.margin, this.cursor);
      this.cursor += 22;
    }
    this.cursor += 6;
  }

  h3(text: string) {
    this.ensureSpace(30);
    this.setFont('helvetica', 'bold', 11);
    this.setGold();
    const upper = text.toUpperCase();
    this.doc.text(upper, this.margin, this.cursor);
    const w = this.doc.getTextWidth(upper);
    this.doc.setDrawColor(BRAND_COLORS.gold);
    this.doc.setLineWidth(1.1);
    this.doc.line(this.margin, this.cursor + 3, this.margin + w, this.cursor + 3);
    this.cursor += 18;
  }

  paragraph(text: string, opts?: { italic?: boolean }) {
    if (!text || !text.trim()) return;
    this.setFont('helvetica', opts?.italic ? 'italic' : 'normal', 11);
    this.setNavy();
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const ln of lines) {
      this.ensureSpace(16);
      this.doc.text(ln, this.margin, this.cursor);
      this.cursor += 15;
    }
    this.cursor += 6;
  }

  bullets(items: string[]) {
    this.setFont('helvetica', 'normal', 11);
    this.setNavy();
    for (const it of items) {
      const lines = this.doc.splitTextToSize('• ' + it, this.contentWidth - 12) as string[];
      for (let i = 0; i < lines.length; i++) {
        this.ensureSpace(16);
        this.doc.text(lines[i], this.margin + (i === 0 ? 0 : 12), this.cursor);
        this.cursor += 15;
      }
      this.cursor += 2;
    }
    this.cursor += 4;
  }

  // cream filled callout box with gold left border
  calloutCream(title: string, body: string) {
    this.setFont('helvetica', 'normal', 11);
    const bodyLines = body ? (this.doc.splitTextToSize(body, this.contentWidth - 28) as string[]) : [];
    const h = Math.max(36, 18 + bodyLines.length * 15 + 24);
    this.ensureSpace(h + 12);
    this.doc.setFillColor(BRAND_COLORS.creamRgb[0], BRAND_COLORS.creamRgb[1], BRAND_COLORS.creamRgb[2]);
    this.doc.rect(this.margin, this.cursor, this.contentWidth, h, 'F');
    this.doc.setFillColor(BRAND_COLORS.goldRgb[0], BRAND_COLORS.goldRgb[1], BRAND_COLORS.goldRgb[2]);
    this.doc.rect(this.margin, this.cursor, 6, h, 'F');
    let y = this.cursor + 18;
    this.setFont('helvetica', 'bold', 10);
    this.setNavy();
    if (title) {
      this.doc.text(title.toUpperCase(), this.margin + 16, y);
      y += 16;
    }
    this.setFont('helvetica', 'normal', 11);
    this.setNavy();
    for (const ln of bodyLines) {
      this.doc.text(ln, this.margin + 16, y);
      y += 15;
    }
    this.cursor += h + 8;
  }

  // navy-filled callout with cream text
  calloutNavy(title: string, body: string) {
    this.setFont('helvetica', 'normal', 11);
    const bodyLines = body ? (this.doc.splitTextToSize(body, this.contentWidth - 28) as string[]) : [];
    const h = Math.max(36, 18 + bodyLines.length * 15 + 24);
    this.ensureSpace(h + 12);
    this.doc.setFillColor(BRAND_COLORS.navyRgb[0], BRAND_COLORS.navyRgb[1], BRAND_COLORS.navyRgb[2]);
    this.doc.rect(this.margin, this.cursor, this.contentWidth, h, 'F');
    this.doc.setFillColor(BRAND_COLORS.goldRgb[0], BRAND_COLORS.goldRgb[1], BRAND_COLORS.goldRgb[2]);
    this.doc.rect(this.margin, this.cursor, 6, h, 'F');
    let y = this.cursor + 18;
    this.setFont('helvetica', 'bold', 10);
    this.doc.setTextColor(BRAND_COLORS.goldRgb[0], BRAND_COLORS.goldRgb[1], BRAND_COLORS.goldRgb[2]);
    if (title) {
      this.doc.text(title.toUpperCase(), this.margin + 16, y);
      y += 16;
    }
    this.setFont('helvetica', 'normal', 11);
    this.doc.setTextColor(BRAND_COLORS.creamRgb[0], BRAND_COLORS.creamRgb[1], BRAND_COLORS.creamRgb[2]);
    for (const ln of bodyLines) {
      this.doc.text(ln, this.margin + 16, y);
      y += 15;
    }
    this.setNavy();
    this.cursor += h + 8;
  }

  // CTA card with title, blurb, URL.
  ctaCard(title: string, blurb: string, url: string) {
    const h = 86;
    this.ensureSpace(h + 12);
    this.doc.setDrawColor(BRAND_COLORS.gold);
    this.doc.setLineWidth(1);
    this.doc.setFillColor(244, 236, 216);
    this.doc.roundedRect(this.margin, this.cursor, this.contentWidth, h, 6, 6, 'FD');
    this.setFont('times', 'bold', 14);
    this.setNavy();
    this.doc.text(title, this.margin + 16, this.cursor + 24);
    this.setFont('helvetica', 'normal', 10);
    this.setNavy();
    const blurbLines = this.doc.splitTextToSize(blurb, this.contentWidth - 32) as string[];
    let by = this.cursor + 42;
    for (const ln of blurbLines) { this.doc.text(ln, this.margin + 16, by); by += 13; }
    const urlY = this.cursor + h - 12;
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    this.doc.textWithLink(url, this.margin + 16, urlY, { url: fullUrl });
    const urlW = this.doc.getTextWidth(url);
    this.doc.setDrawColor(BRAND_COLORS.navy);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin + 16, urlY + 1.5, this.margin + 16 + urlW, urlY + 1.5);
    this.cursor += h + 14;
  }

  // Two column flow: each column is a list of ColumnBlock entries.
  // Adds a new page for the spread, paints title above each column.
  twoColumn(
    blocksA: ColumnBlock[],
    blocksB: ColumnBlock[],
    titleA: string,
    titleB: string,
  ) {
    this.newPage();
    const colW = (this.contentWidth - 24) / 2;
    const xA = this.margin;
    const xB = this.margin + colW + 24;
    const headerY = 90;

    this.setFont('times', 'bold', 16);
    this.setNavy();
    const aLines = this.doc.splitTextToSize(titleA, colW) as string[];
    const bLines = this.doc.splitTextToSize(titleB, colW) as string[];
    let y = headerY;
    for (const ln of aLines) { this.doc.text(ln, xA, y); y += 20; }
    y = headerY;
    for (const ln of bLines) { this.doc.text(ln, xB, y); y += 20; }
    const headerEnd = headerY + Math.max(aLines.length, bLines.length) * 20 + 6;
    this.goldRule(headerEnd, xA, this.pageW - (xA + colW));
    this.goldRule(headerEnd, xB, this.pageW - (xB + colW));

    let yA = headerEnd + 16;
    let yB = headerEnd + 16;

    const drawBlock = (block: ColumnBlock, x: number, y: number, w: number): number => {
      if (!('kind' in block)) return y; // not the streaming kind
      if (block.kind === 'label') {
        this.setFont('helvetica', 'bold', 9);
        this.setGold();
        const upper = block.text.toUpperCase();
        this.doc.text(upper, x, y);
        const tw = this.doc.getTextWidth(upper);
        this.doc.setDrawColor(BRAND_COLORS.gold);
        this.doc.setLineWidth(0.8);
        this.doc.line(x, y + 3, x + tw, y + 3);
        return y + 16;
      }
      // body
      this.setFont('helvetica', block.italic ? 'italic' : 'normal', 11);
      this.setNavy();
      const lines = this.doc.splitTextToSize(block.text, w) as string[];
      if (block.tint) {
        const totalH = lines.length * 15 + 12;
        this.doc.setFillColor(244, 236, 216);
        this.doc.rect(x - 6, y - 10, w + 12, totalH, 'F');
      }
      for (const ln of lines) {
        this.doc.text(ln, x, y);
        y += 15;
      }
      return y + 8;
    };

    for (const b of blocksA) {
      if (yA > this.pageH - 80) break;
      yA = drawBlock(b, xA, yA, colW);
    }
    for (const b of blocksB) {
      if (yB > this.pageH - 80) break;
      yB = drawBlock(b, xB, yB, colW);
    }
    this.cursor = Math.max(yA, yB) + 8;
    this.brandFooter();
  }

  // ---- High-level builders used by Before You Send ----

  buildCover(opts: CoverOpts) {
    this.paintBackground();
    this.setFont('times', 'bold', 13);
    this.setNavy();
    this.doc.text('democratising.ai', this.margin, 56);

    this.setFont('times', 'bold', 30);
    this.setNavy();
    const titleLines = this.doc.splitTextToSize(opts.toolName, this.pageW - this.margin * 2) as string[];
    let y = 200;
    for (const ln of titleLines) {
      this.doc.text(ln, this.pageW / 2, y, { align: 'center' });
      y += 36;
    }
    if (opts.subtitle) {
      this.setFont('times', 'italic', 16);
      this.setNavy();
      this.doc.text(opts.subtitle, this.pageW / 2, y + 4, { align: 'center' });
      y += 28;
    }
    this.goldRule(y + 8, this.pageW / 2 - 60, this.pageW / 2 - 60);
    y += 28;
    if (opts.meta) {
      this.setFont('helvetica', 'normal', 11);
      this.setNavy();
      this.doc.text(opts.meta, this.pageW / 2, y, { align: 'center' });
      y += 28;
    }
    if (opts.excerpt) {
      this.setFont('times', opts.excerptItalic === false ? 'normal' : 'italic', 12);
      this.setNavy();
      y += 16;
      const lines = this.doc.splitTextToSize(opts.excerpt, this.pageW - this.margin * 2 - 40) as string[];
      for (const ln of lines.slice(0, 6)) {
        this.doc.text(ln, this.pageW / 2, y, { align: 'center' });
        y += 16;
      }
    }
    this.setFont('helvetica', 'italic', 10);
    this.setNavy();
    this.doc.text(
      'Democratising AI for the people who actually run things.',
      this.pageW / 2,
      this.pageH - 60,
      { align: 'center' },
    );
    this.brandFooter();
  }

  buildSectionPage(opts: SectionOpts) {
    this.newPage();
    let y = 90;
    this.setFont('times', 'bold', 22);
    this.setNavy();
    const titleLines = this.doc.splitTextToSize(opts.title, this.contentWidth) as string[];
    for (const ln of titleLines) {
      this.doc.text(ln, this.margin, y);
      y += 28;
    }
    this.goldRule(y);
    y += 22;
    this.cursor = y;

    if (opts.calloutLabel || opts.calloutBody) {
      this.calloutCream(opts.calloutLabel || '', opts.calloutBody || '');
    }

    if (opts.bodyParagraphs) {
      for (const p of opts.bodyParagraphs) {
        this.paragraph(p);
      }
    }

    if (opts.columns) {
      const c = opts.columns;
      const colW = (this.contentWidth - 12) / 2;
      this.setFont('helvetica', 'normal', 11);
      const leftLines = this.doc.splitTextToSize(c.leftBody, colW - 24) as string[];
      const rightLines = this.doc.splitTextToSize(c.rightBody, colW - 24) as string[];
      const h = Math.max(60, Math.max(leftLines.length, rightLines.length) * 15 + 40);
      this.ensureSpace(h + 12);
      const yc = this.cursor;
      // left
      this.doc.setFillColor(244, 236, 216);
      this.doc.rect(this.margin, yc, colW, h, 'F');
      this.doc.setFillColor(BRAND_COLORS.goldRgb[0], BRAND_COLORS.goldRgb[1], BRAND_COLORS.goldRgb[2]);
      this.doc.rect(this.margin, yc, 4, h, 'F');
      this.setFont('helvetica', 'bold', 9);
      this.setGold();
      this.doc.text(c.leftLabel.toUpperCase(), this.margin + 14, yc + 16);
      this.setFont('helvetica', 'normal', 11);
      this.setNavy();
      let yl = yc + 32;
      for (const ln of leftLines) { this.doc.text(ln, this.margin + 14, yl); yl += 15; }
      // right
      const rx = this.margin + colW + 12;
      this.doc.setFillColor(244, 236, 216);
      this.doc.rect(rx, yc, colW, h, 'F');
      this.doc.setFillColor(BRAND_COLORS.navyRgb[0], BRAND_COLORS.navyRgb[1], BRAND_COLORS.navyRgb[2]);
      this.doc.rect(rx, yc, 4, h, 'F');
      this.setFont('helvetica', 'bold', 9);
      this.setNavy();
      this.doc.text(c.rightLabel.toUpperCase(), rx + 14, yc + 16);
      this.setFont('helvetica', 'normal', 11);
      this.setNavy();
      let yr = yc + 32;
      for (const ln of rightLines) { this.doc.text(ln, rx + 14, yr); yr += 15; }
      this.cursor = yc + h + 12;
    }

    if (opts.subSections) {
      for (const sub of opts.subSections) {
        this.h3(sub.label);
        if (sub.body) this.paragraph(sub.body);
        if (sub.bullets) this.bullets(sub.bullets);
      }
    }

    if (opts.bullets) this.bullets(opts.bullets);

    this.brandFooter();
  }

  buildCtaPage(headline: string, ctas: CTA[], footerLine?: string) {
    this.newPage();
    this.setFont('times', 'bold', 22);
    this.setNavy();
    const headLines = this.doc.splitTextToSize(headline, this.contentWidth) as string[];
    let y = 110;
    for (const ln of headLines) {
      this.doc.text(ln, this.pageW / 2, y, { align: 'center' });
      y += 28;
    }
    this.goldRule(y + 4);
    y += 24;
    this.cursor = y;
    for (const cta of ctas) {
      this.ctaCard(cta.title, cta.blurb, cta.url);
    }
    if (footerLine) {
      this.setFont('helvetica', 'italic', 10);
      this.setNavy();
      this.doc.text(footerLine, this.pageW / 2, this.pageH - 60, { align: 'center' });
    }
    this.brandFooter();
  }

  save(filename?: string) {
    this.doc.save(filename || this.filename);
  }

  raw() { return this.doc; }
}

// Convenience helper preserved for callers using the older signature.
export async function makeBrandPdf(): Promise<BrandPdf> {
  const Ctor = await loadJsPdf();
  return new BrandPdf(Ctor);
}

export { formatDateLong, loadJsPdf };

// ---------- Legacy function-based API for Brand Profile Generator ----------
// BrandProfileGenerator imports { downloadBrandPdf, BrandPdfFieldGroup } from this module.
// Keep this block intact even if you refactor the class above.


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
