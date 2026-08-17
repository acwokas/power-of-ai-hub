import { useEffect, useState } from 'react';

// Minimal, dependency free markdown renderer tuned for EDGE tool output.
// Handles: ## h2, ### h3, **bold** as h4-style label, bullet lists ("- " or "* "),
// numbered lists ("1. "), inline **bold**, inline *italic*, paragraphs, line breaks.
// Designed to match the brand: navy serif h2, gold accent h4 labels, cream cards,
// gold left rule per audience section.

const COLOR_NAVY = '#14264C';
const COLOR_CREAM = '#F4ECD8';
const COLOR_GOLD = '#D89A55';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  // escape first
  let out = escapeHtml(text);
  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // *italic* but only when not already inside a strong
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // backtick code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

interface RenderOptions {
  // when true, lines that are wholly **Label** on their own line are treated
  // as h4-style label headers (uppercase, navy, gold underline accent)
  boldLineAsLabel?: boolean;
}

export function renderMarkdownToHtml(md: string, opts: RenderOptions = {}): string {
  const { boldLineAsLabel = true } = opts;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // blank line
    if (trimmed === '') {
      i += 1;
      continue;
    }

    // ## heading
    if (trimmed.startsWith('## ')) {
      out.push(`<h2 class="bys-h2">${renderInline(trimmed.slice(3).trim())}</h2>`);
      i += 1;
      continue;
    }

    // ### heading
    if (trimmed.startsWith('### ')) {
      out.push(`<h3 class="bys-h3">${renderInline(trimmed.slice(4).trim())}</h3>`);
      i += 1;
      continue;
    }

    // "**Label**" alone on a line acts as an h4 label
    const labelMatch = boldLineAsLabel ? trimmed.match(/^\*\*([^*]+)\*\*\s*:?\s*$/) : null;
    if (labelMatch) {
      out.push(`<h4 class="bys-label">${escapeHtml(labelMatch[1].trim())}</h4>`);
      i += 1;
      continue;
    }

    // bullet list (- or * at start)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      out.push(
        `<ul class="bys-ul">${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join('')}</ul>`,
      );
      continue;
    }

    // numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      out.push(
        `<ol class="bys-ol">${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join('')}</ol>`,
      );
      continue;
    }

    // gather a paragraph of consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (
        t === '' ||
        t.startsWith('## ') ||
        t.startsWith('### ') ||
        /^[-*]\s+/.test(t) ||
        /^\d+\.\s+/.test(t) ||
        (boldLineAsLabel && /^\*\*([^*]+)\*\*\s*:?\s*$/.test(t))
      ) {
        break;
      }
      paraLines.push(t);
      i += 1;
    }
    if (paraLines.length > 0) {
      out.push(`<p class="bys-p">${renderInline(paraLines.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

interface BrandMarkdownProps {
  // Prefer `markdown`. `text` is supported as an alias for compatibility with
  // other EDGE tools that already use this name.
  markdown?: string;
  text?: string;
  className?: string;
  // when true, top-level `## audience` headings open a cream card with gold left rule
  audienceCards?: boolean;
}

// Render a markdown blob. If audienceCards is true, we split at each H2 and wrap
// each block in a cream card with a gold left border.
export function BrandMarkdown({ markdown, text, className, audienceCards }: BrandMarkdownProps) {
  const source = markdown ?? text ?? '';
  if (!audienceCards) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(source) }}
      />
    );
  }

  // split at ## headings, preserving header text
  const parts: { title: string; body: string }[] = [];
  let preamble = '';
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let current: { title: string; body: string } | null = null;
  for (const ln of lines) {
    const m = ln.match(/^##\s+(.+)$/);
    if (m) {
      if (current) parts.push(current);
      current = { title: m[1].trim(), body: '' };
    } else if (current) {
      current.body += ln + '\n';
    } else {
      preamble += ln + '\n';
    }
  }
  if (current) parts.push(current);

  return (
    <div className={className}>
      {preamble.trim() && (
        <div
          className="bys-prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(preamble) }}
        />
      )}
      {parts.map((p, i) => (
        <section key={i} className="bys-audience-card">
          <h2 className="bys-h2">{p.title}</h2>
          <div
            className="bys-prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(p.body) }}
          />
        </section>
      ))}
    </div>
  );
}

// Streaming-safe version: parent passes incremental markdown each render.
export function StreamingBrandMarkdown({ markdown, audienceCards }: { markdown: string; audienceCards?: boolean }) {
  // small heuristic: only render audience cards once there are at least two ## headers,
  // otherwise show as a single growing block to keep the streaming feel
  const headingCount = (markdown.match(/^##\s+/gm) || []).length;
  return (
    <BrandMarkdown
      markdown={markdown}
      audienceCards={audienceCards && headingCount >= 1}
    />
  );
}

// Inject brand styling for the BrandMarkdown classes once.
export function BrandMarkdownStyles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return null;
}

// Static stylesheet string consumers can embed in a <style> tag.
export const BRAND_MARKDOWN_CSS = `
.bys-prose, .bys-prose p, .bys-prose li { line-height: 1.6; }
.bys-prose .bys-h2, .bys-audience-card .bys-h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: ${COLOR_NAVY};
  margin: 32px 0 16px;
  letter-spacing: -0.01em;
}
.bys-audience-card .bys-h2 { margin-top: 0; }
.bys-prose .bys-h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: ${COLOR_NAVY};
  margin: 24px 0 12px;
}
.bys-prose .bys-label, .bys-audience-card .bys-label {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: ${COLOR_NAVY};
  margin: 18px 0 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid ${COLOR_GOLD};
  display: inline-block;
}
.bys-prose .bys-p, .bys-audience-card .bys-p { margin: 0 0 12px; color: #14264c; font-size: 1rem; }
.bys-prose .bys-ul, .bys-audience-card .bys-ul,
.bys-prose .bys-ol, .bys-audience-card .bys-ol {
  margin: 6px 0 14px 0;
  padding-left: 1.2rem;
}
.bys-prose .bys-ul li, .bys-audience-card .bys-ul li,
.bys-prose .bys-ol li, .bys-audience-card .bys-ol li {
  margin: 4px 0;
  color: #14264c;
}
/* Cream surface plus a full border defines the card. No left rule. */
.bys-audience-card {
  background: ${COLOR_CREAM};
  border: 1px solid rgba(216, 154, 85, 0.45);
  border-radius: 6px;
  padding: 24px 28px;
  margin: 0 0 16px;
}
.bys-audience-card + .bys-audience-card { margin-top: 16px; }
.bys-prose code, .bys-audience-card code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
  background: rgba(20,38,76,0.06);
  padding: 1px 4px;
  border-radius: 3px;
}
.bys-prose strong, .bys-audience-card strong { font-weight: 700; color: ${COLOR_NAVY}; }
`;
