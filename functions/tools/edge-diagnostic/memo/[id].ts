/// <reference types="@cloudflare/workers-types" />

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SITE_URL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
  params: { id: string };
}

interface MemoRow {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  role: string | null;
  org_size: string | null;
  sector: string | null;
  overall_score: number | null;
  dimension_scores: Record<string, number>;
  memo_html: string | null;
  memo_markdown: string | null;
}

function notFound(message: string, siteUrl: string): Response {
  const html = pageShell({
    title: 'Memo not found - EDGE Diagnostic',
    description: 'The diagnostic memo you are looking for could not be found.',
    siteUrl,
    body: `<section class="hero"><h1>Memo not found</h1><p>${message}</p><p><a class="btn" href="/tools/edge-diagnostic">Take the EDGE Diagnostic</a></p></section>`,
  });
  return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function maturityLabel(score: number): string {
  if (score >= 4.5) return 'Optimised';
  if (score >= 3.5) return 'Managed';
  if (score >= 2.5) return 'Defined';
  if (score >= 1.5) return 'Aware';
  return 'Reactive';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pageShell(args: { title: string; description: string; siteUrl: string; body: string }): string {
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(args.title)}</title>
  <meta name="description" content="${escapeHtml(args.description)}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="icon" href="/favicon.png" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&display=swap" rel="stylesheet" />
  <meta property="og:title" content="${escapeHtml(args.title)}" />
  <meta property="og:description" content="${escapeHtml(args.description)}" />
  <meta property="og:image" content="${args.siteUrl}/og-image.png" />
  <style>
    :root {
      --navy: #14264C;
      --navy-dark: #0c1832;
      --gold: #D89A55;
      --ink: #14264C;
      --paper: #fdfcf9;
      --muted: #5b6a85;
      --rule: #e3e0d6;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--ink);
      background: var(--paper);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--gold); }
    a:hover { text-decoration: underline; }
    .page { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
    header.site {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--rule);
      margin-bottom: 32px;
    }
    header.site .mark { width: 32px; height: 32px; }
    header.site .wordmark {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.12em;
      color: var(--navy);
    }
    header.site .crumbs { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-left: auto; }
    header.site .crumbs a { color: var(--muted); text-decoration: none; }
    header.site .crumbs a:hover { color: var(--navy); }
    .meta {
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 12px;
      font-weight: 600;
    }
    h1.title {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 900;
      font-size: 36px;
      line-height: 1.1;
      margin: 0 0 8px 0;
      color: var(--navy);
    }
    .org-line {
      font-size: 14px;
      color: var(--muted);
      margin: 0 0 32px 0;
    }
    .memo h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 700;
      font-size: 22px;
      color: var(--navy);
      margin: 36px 0 12px 0;
      padding-top: 16px;
      border-top: 1px solid var(--rule);
    }
    .memo h2:first-of-type { padding-top: 0; border-top: none; margin-top: 0; }
    .memo h3 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 18px;
      color: var(--navy);
      margin: 24px 0 8px 0;
    }
    .memo p { font-size: 16px; margin: 0 0 14px 0; }
    .memo ul, .memo ol { padding-left: 22px; margin: 0 0 16px 0; }
    .memo li { margin: 6px 0; }
    .memo strong { color: var(--navy); }
    .scorecard {
      background: var(--navy);
      color: #fff;
      padding: 24px;
      border-radius: 6px;
      margin: 24px 0 32px 0;
    }
    .scorecard .score {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 900;
      font-size: 48px;
      color: var(--gold);
      line-height: 1;
    }
    .scorecard .out { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 4px; }
    .scorecard .label {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 14px;
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 2px;
      font-size: 13px;
      letter-spacing: 0.05em;
    }
    .cta {
      margin-top: 48px;
      padding: 24px;
      background: var(--navy);
      color: #fff;
      border-radius: 6px;
      text-align: center;
    }
    .cta p { font-size: 16px; margin: 0 0 16px 0; color: rgba(255,255,255,0.9); }
    .cta a.btn {
      display: inline-block;
      background: var(--gold);
      color: var(--navy);
      padding: 12px 24px;
      border-radius: 3px;
      font-weight: 600;
      text-decoration: none;
      font-size: 15px;
    }
    .cta a.btn:hover { background: #e9aa61; text-decoration: none; }
    .actions { margin-top: 24px; font-size: 14px; }
    .actions a { color: var(--muted); margin-right: 16px; }
    footer.site {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid var(--rule);
      font-size: 13px;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
    }
    footer.site .wordmark img { height: 22px; opacity: 0.85; }
    .hero { padding: 40px 0; text-align: center; }
    .hero h1 { font-family: 'Fraunces', Georgia, serif; font-size: 28px; color: var(--navy); }
    .btn { display: inline-block; background: var(--navy); color: #fff; padding: 10px 20px; border-radius: 3px; font-weight: 600; text-decoration: none; font-size: 14px; margin-top: 12px; }
    @media (max-width: 600px) {
      h1.title { font-size: 28px; }
      .memo h2 { font-size: 20px; }
      .scorecard .score { font-size: 40px; }
    }
    @media print {
      .cta, .actions, header.site .crumbs { display: none; }
      body { background: #fff; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="site">
      <img class="mark" src="/brand/edge-mark.svg" alt="EDGE mark" />
      <span class="wordmark">DEMOCRATISING.AI</span>
      <span class="crumbs"><a href="/tools">EDGE</a> / <a href="/tools/edge-diagnostic">Diagnostic</a> / Memo</span>
    </header>
    ${args.body}
    <footer class="site">
      <span class="wordmark"><img src="/brand/adrian-watkins-wordmark.svg" alt="Adrian Watkins" /></span>
      <span>EDGE Framework for Applied Intelligence</span>
    </footer>
  </div>
</body>
</html>`;
}

async function fetchMemo(env: Env, id: string): Promise<MemoRow | null> {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }
  const url = `${env.SUPABASE_URL}/rest/v1/edge_diagnostics?id=eq.${id}&select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as MemoRow[];
  return rows[0] ?? null;
}

export const onRequestGet = async ({ env, params, request }: PagesContext<Env>): Promise<Response> => {
  const siteUrl = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return notFound('Memo storage is not configured.', siteUrl);
  }

  let row: MemoRow | null;
  try {
    row = await fetchMemo(env, params.id);
  } catch {
    row = null;
  }

  if (!row) {
    return notFound('This memo does not exist or has been removed.', siteUrl);
  }

  const score = row.overall_score ?? 0;
  const level = maturityLabel(score);
  const sector = row.sector || 'your organisation';
  const role = row.role || 'a senior leader';
  const orgSize = row.org_size || '';
  const orgLine = `Prepared for ${escapeHtml(row.name || row.email)} - ${escapeHtml(role)} at a ${escapeHtml(orgSize || sector)} ${orgSize ? escapeHtml(sector) : ''}, ${new Date(row.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}.`;

  const bookUrl = 'mailto:me@adrianwatkins.com?subject=EDGE%20Diagnostic%20follow-up';

  const body = `
    <p class="meta">EDGE Diagnostic Memo</p>
    <h1 class="title">Your AI capability memo</h1>
    <p class="org-line">${orgLine}</p>

    <div class="scorecard">
      <div class="score">${score.toFixed(1)}</div>
      <div class="out">out of 5.0</div>
      <span class="label">${escapeHtml(level)}</span>
    </div>

    <article class="memo">${row.memo_html || '<p>This memo is unavailable. Please contact Adrian.</p>'}</article>

    <div class="cta">
      <p>Want to talk this through? Book a 30-minute call with Adrian.</p>
      <a class="btn" href="${bookUrl}">Book a 30-minute call</a>
    </div>

    <p class="actions">
      <a href="javascript:window.print()">Print or save as PDF</a>
      <a href="/tools/edge-diagnostic">Retake the diagnostic</a>
      <a href="/tools">Explore the EDGE Framework</a>
    </p>
  `;

  const html = pageShell({
    title: `EDGE Diagnostic memo - ${level} (${score.toFixed(1)} / 5.0)`,
    description: `EDGE Diagnostic memo, overall maturity ${score.toFixed(1)} / 5.0 - ${level}.`,
    siteUrl,
    body,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
};
