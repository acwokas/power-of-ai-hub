/// <reference types="@cloudflare/workers-types" />

interface Env {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  ADRIAN_EMAIL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SITE_URL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

type Answers = Record<string, string | number>;

interface LeadCapture {
  name?: string;
  email: string;
  contactEmail?: string;
  phone?: string;
  consent: boolean;
}

interface SubmitBody {
  answers: Answers;
  lead: LeadCapture;
}

interface QuestionMeta {
  id: string;
  section: string;
  dimension?: Dimension;
  text: string;
  type: 'choice' | 'likert' | 'text';
}

type Dimension =
  | 'Decision ownership'
  | 'Risk management'
  | 'Performance oversight'
  | 'Ethical boundaries'
  | 'Accountability structures';

const DIMENSIONS: Dimension[] = [
  'Decision ownership',
  'Risk management',
  'Performance oversight',
  'Ethical boundaries',
  'Accountability structures',
];

const QUESTIONS: QuestionMeta[] = [
  { id: 'org_size', section: 'Context', text: 'Organisation size', type: 'choice' },
  { id: 'sector', section: 'Context', text: 'Sector', type: 'text' },
  { id: 'role', section: 'Context', text: 'Your role', type: 'choice' },
  { id: 'current_adoption', section: 'Context', text: 'Current AI adoption', type: 'choice' },
  { id: 'biggest_question', section: 'Context', text: 'Biggest AI question keeping you awake at night', type: 'text' },

  { id: 'ai_strategy_owner', section: 'Decision ownership', dimension: 'Decision ownership', text: 'Who owns AI strategy today?', type: 'choice' },
  { id: 'approval_path', section: 'Decision ownership', dimension: 'Decision ownership', text: 'Clarity of AI approval path', type: 'likert' },
  { id: 'accountable_party', section: 'Decision ownership', dimension: 'Decision ownership', text: 'Who would be accountable if AI materially harmed a customer?', type: 'text' },

  { id: 'risk_tracking', section: 'Risk management', dimension: 'Risk management', text: 'How AI risks are identified and tracked', type: 'likert' },
  { id: 'board_reviewed', section: 'Risk management', dimension: 'Risk management', text: 'Board reviewed AI exposure in last 12 months?', type: 'choice' },
  { id: 'underprepared_risk', section: 'Risk management', dimension: 'Risk management', text: 'AI-specific risk under-prepared for', type: 'text' },

  { id: 'output_review', section: 'Performance oversight', dimension: 'Performance oversight', text: 'How AI outputs are reviewed for quality and accuracy', type: 'likert' },
  { id: 'business_outcomes', section: 'Performance oversight', dimension: 'Performance oversight', text: 'Measurable business outcomes attributed to AI in last 12 months', type: 'text' },
  { id: 'reporting_cadence', section: 'Performance oversight', dimension: 'Performance oversight', text: 'How often AI performance is reported to leadership', type: 'choice' },

  { id: 'not_allowed_policy', section: 'Ethical boundaries', dimension: 'Ethical boundaries', text: 'Defined what AI is NOT allowed to do?', type: 'choice' },
  { id: 'ethics_channel', section: 'Ethical boundaries', dimension: 'Ethical boundaries', text: 'How ethical concerns about AI are raised and resolved', type: 'likert' },
  { id: 'ethical_line', section: 'Ethical boundaries', dimension: 'Ethical boundaries', text: 'Single ethical line we would not cross', type: 'text' },

  { id: 'on_failure', section: 'Accountability structures', dimension: 'Accountability structures', text: 'What happens if an AI initiative fails', type: 'choice' },
  { id: 'in_job_desc', section: 'Accountability structures', dimension: 'Accountability structures', text: 'Is AI responsibility in any job description or performance objective?', type: 'choice' },

  { id: 'success_signal', section: 'Close', text: 'What would success look like from this diagnostic', type: 'text' },
];

const CHOICE_SCORES: Record<string, Record<string, number>> = {
  current_adoption: {
    experimental: 1,
    some_embedded: 2,
    multiple_production: 4,
    core_operations: 5,
    unknown_adoption: 1,
  },
  ai_strategy_owner: {
    ceo: 4,
    cto_cio: 4,
    coo: 4,
    innovation_lead: 3,
    working_group: 3,
    nobody: 1,
    unknown: 1,
  },
  board_reviewed: { yes: 5, no: 1, unknown: 1 },
  reporting_cadence: { never: 1, ad_hoc: 2, quarterly: 3, monthly: 4, realtime: 5 },
  not_allowed_policy: { documented: 5, informal: 3, no: 1, unknown: 1 },
  on_failure: { quiet_shutdown: 1, post_mortem: 3, exec_review: 4, board_reported: 5, unknown: 1 },
  in_job_desc: { yes: 5, no: 1, unknown: 1 },
};

const CHOICE_LABELS: Record<string, Record<string, string>> = {
  org_size: {
    under_50: 'Under 50',
    '50_500': '50 to 500',
    '500_5000': '500 to 5,000',
    '5000_plus': '5,000+',
    public_ngo: 'Public sector or NGO',
  },
  role: {
    founder_ceo: 'Founder or CEO',
    c_suite: 'C-suite executive',
    board_ned: 'Board director or NED',
    senior_leadership: 'Senior leadership',
    operating_product: 'Operating or product lead',
    other: 'Other',
  },
  current_adoption: {
    experimental: 'Experimental only',
    some_embedded: 'Some embedded use cases',
    multiple_production: 'Multiple production systems',
    core_operations: 'Core to operations',
    unknown_adoption: "Don't know",
  },
  ai_strategy_owner: {
    ceo: 'CEO',
    cto_cio: 'CTO or CIO',
    coo: 'COO',
    innovation_lead: 'Innovation lead',
    working_group: 'A working group or committee',
    nobody: 'Nobody clearly',
    unknown: "Don't know",
  },
  board_reviewed: { yes: 'Yes', no: 'No', unknown: "Don't know" },
  reporting_cadence: {
    never: 'Never',
    ad_hoc: 'Ad-hoc',
    quarterly: 'Quarterly',
    monthly: 'Monthly',
    realtime: 'Real-time dashboard',
  },
  not_allowed_policy: {
    documented: 'Yes, documented policy',
    informal: 'Informal understanding',
    no: 'No',
    unknown: "Don't know",
  },
  on_failure: {
    quiet_shutdown: 'Quiet shutdown',
    post_mortem: 'Documented post-mortem',
    exec_review: 'Formal review with executive committee',
    board_reported: 'Reported to board',
    unknown: "Don't know",
  },
  in_job_desc: { yes: 'Yes', no: 'No', unknown: "Don't know" },
};

function scoreAnswers(answers: Answers): {
  dimensionScores: Record<Dimension, number>;
  overall: number;
} {
  const buckets: Record<Dimension, number[]> = {
    'Decision ownership': [],
    'Risk management': [],
    'Performance oversight': [],
    'Ethical boundaries': [],
    'Accountability structures': [],
  };

  for (const q of QUESTIONS) {
    if (!q.dimension) continue;
    const v = answers[q.id];
    if (v === undefined || v === null) continue;
    let s: number | null = null;
    if (q.type === 'likert' && typeof v === 'number') {
      s = Math.max(1, Math.min(5, Math.round(v)));
    } else if (q.type === 'choice' && typeof v === 'string') {
      const map = CHOICE_SCORES[q.id];
      if (map && map[v] !== undefined) s = map[v];
    }
    if (s !== null) buckets[q.dimension].push(s);
  }

  const dimensionScores = {} as Record<Dimension, number>;
  for (const d of DIMENSIONS) {
    const arr = buckets[d];
    if (arr.length === 0) {
      dimensionScores[d] = 0;
    } else {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      dimensionScores[d] = Math.round(avg * 10) / 10;
    }
  }

  const valid = DIMENSIONS.map((d) => dimensionScores[d]).filter((s) => s > 0);
  const overall = valid.length
    ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
    : 0;

  return { dimensionScores, overall };
}

function maturityLabel(score: number): string {
  if (score >= 4.5) return 'Optimised';
  if (score >= 3.5) return 'Managed';
  if (score >= 2.5) return 'Defined';
  if (score >= 1.5) return 'Aware';
  return 'Reactive';
}

function labelChoice(qid: string, value: string): string {
  return CHOICE_LABELS[qid]?.[value] ?? value;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function buildMemoPrompt(payload: {
  answers: Answers;
  dimensionScores: Record<Dimension, number>;
  overall: number;
  lead: LeadCapture;
}): { system: string; user: string } {
  const { answers, dimensionScores, overall, lead } = payload;

  const orgSize = labelChoice('org_size', String(answers.org_size ?? ''));
  const sector = String(answers.sector ?? '');
  const role = labelChoice('role', String(answers.role ?? ''));
  const adoption = labelChoice('current_adoption', String(answers.current_adoption ?? ''));

  const dimensionLines = DIMENSIONS.map((d) => `- ${d}: ${dimensionScores[d].toFixed(1)} / 5.0`).join('\n');

  const freeText = [
    ['Biggest question keeping you awake at night', answers.biggest_question],
    ['Who would be accountable if AI harmed a customer', answers.accountable_party],
    ['AI-specific risk under-prepared for', answers.underprepared_risk],
    ['Measurable business outcomes attributed to AI', answers.business_outcomes],
    ['Single ethical line we would not cross', answers.ethical_line],
    ['What success looks like from this diagnostic', answers.success_signal],
  ]
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k, v]) => `- ${k}: ${String(v).trim()}`)
    .join('\n');

  const structuredAnswers = QUESTIONS.map((q) => {
    const raw = answers[q.id];
    if (raw === undefined || raw === null || raw === '') return null;
    let display: string;
    if (q.type === 'choice' && typeof raw === 'string') display = labelChoice(q.id, raw);
    else display = String(raw);
    return `${q.section} | ${q.text}: ${display}`;
  })
    .filter(Boolean)
    .join('\n');

  const system = `You are Adrian Watkins, creator of the EDGE Framework for Applied Intelligence.
You are writing a one-page diagnostic memo for the person who has just completed the EDGE Diagnostic v2.

Your voice is direct, specific, architectural. Not consultant-speak.
British English. Zero em-dashes or en-dashes. Use hyphens only.
Sentence-cased headings. No headline hyperbole.

Reference the user's actual free-text answers explicitly so the memo feels personal. If a dimension scored low, say so plainly. If the user named a risk they are under-prepared for, address it head-on.

The memo must be honest. If the overall maturity is below 2.5, do not soft-pedal. If above 4.0, name what gets in the way of 5.0.

Conclude with the single highest-leverage move, in bold, in one sentence.

Output strictly as markdown using exactly this structure and headings. Do not add or remove sections. Do not include any preamble or trailing remarks outside the structure.

## ${'{org sketch sentence}'}

## Overall maturity
Your EDGE governance maturity is ${overall.toFixed(1)} / 5.0 - ${maturityLabel(overall)}.
{One paragraph, 2 to 3 sentences, on what that level means for an organisation like theirs.}

## Dimension breakdown
- Decision ownership ${dimensionScores['Decision ownership'].toFixed(1)} / 5.0 - {one line state}
- Risk management ${dimensionScores['Risk management'].toFixed(1)} / 5.0 - {one line state}
- Performance oversight ${dimensionScores['Performance oversight'].toFixed(1)} / 5.0 - {one line state}
- Ethical boundaries ${dimensionScores['Ethical boundaries'].toFixed(1)} / 5.0 - {one line state}
- Accountability structures ${dimensionScores['Accountability structures'].toFixed(1)} / 5.0 - {one line state}

## What surfaced
{Three to five short bullet observations that explicitly draw on their free-text answers. Quote phrases back to them. Be specific. Each bullet 1 to 2 sentences.}

## 30-day priority moves
1. {concrete action doable inside a month}
2. {concrete action doable inside a month}
3. {concrete action doable inside a month}

## 60-day priority moves
1. {medium-cycle move}
2. {medium-cycle move}

## 90-day priority moves
1. {longer-cycle structural move}

## What a level 4 organisation in your context would do
{Single paragraph exemplar, 3 to 5 sentences, helps the reader see the gap.}

## The single highest-leverage move
**{One sentence, bold, no preamble. The most important single thing they should do.}**`;

  const user = `Reader context:
- Name: ${lead.name || '(not provided)'}
- Organisation size: ${orgSize || '(not provided)'}
- Sector: ${sector || '(not provided)'}
- Role: ${role || '(not provided)'}
- Current AI adoption: ${adoption || '(not provided)'}

Dimension scores (auto-calculated from their structured answers):
${dimensionLines}
Overall: ${overall.toFixed(1)} / 5.0 - ${maturityLabel(overall)}

Their free-text answers (use these directly in the memo, quote phrases back to them):
${freeText || '(none provided)'}

All structured answers for reference:
${structuredAnswers}

Now write the memo. Follow the exact markdown structure given in the system prompt. Reference the user's specific phrasing in "What surfaced". Do not invent facts. Sentence-cased headings. British English. Hyphens only.`;

  return { system, user };
}

async function callClaude(env: Env, system: string, user: string): Promise<string> {
  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2400,
      temperature: 0.4,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Claude error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('\n')
    .trim();
  if (!text) throw new Error('Claude returned empty content.');
  return text;
}

async function callOpenAI(env: Env, system: string, user: string): Promise<string> {
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = (data.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error('OpenAI returned empty content.');
  return text;
}

async function generateMemo(env: Env, system: string, user: string): Promise<string> {
  if (env.ANTHROPIC_API_KEY) {
    try {
      return await callClaude(env, system, user);
    } catch (e) {
      if (!env.OPENAI_API_KEY) throw e;
    }
  }
  if (env.OPENAI_API_KEY) return callOpenAI(env, system, user);
  throw new Error('No LLM provider configured.');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMd(line: string): string {
  const escaped = escapeHtml(line);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${paraBuf.map(inlineMd).join(' ')}</p>`);
      paraBuf = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    const h2 = /^##\s+(.*)$/.exec(line);
    const h1 = /^#\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);

    if (h1 || h2 || h3) {
      flushPara();
      closeList();
      const level = h1 ? 1 : h2 ? 2 : 3;
      const text = (h1 ?? h2 ?? h3)![1];
      out.push(`<h${level}>${inlineMd(text)}</h${level}>`);
      continue;
    }
    if (ul) {
      flushPara();
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inlineMd(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      flushPara();
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inlineMd(ol[1])}</li>`);
      continue;
    }
    paraBuf.push(line);
  }
  flushPara();
  closeList();
  return out.join('\n');
}

async function saveToSupabase(
  env: Env,
  row: {
    email: string;
    name: string;
    role: string;
    org_size: string;
    sector: string;
    answers: Answers;
    dimension_scores: Record<Dimension, number>;
    overall_score: number;
    memo_markdown: string;
    memo_html: string;
  },
): Promise<string> {
  const url = `${env.SUPABASE_URL}/rest/v1/edge_diagnostics`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase insert failed ${res.status}: ${detail.slice(0, 300)}`);
  }
  const rows = (await res.json()) as { id: string }[];
  if (!rows[0]?.id) throw new Error('Supabase insert returned no id.');
  return rows[0].id;
}

async function sendEmail(
  env: Env,
  args: { to: string; subject: string; html: string; replyTo?: string },
): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const from = env.RESEND_FROM || 'EDGE Diagnostic <bulletin@aiinasia.com>';
  const body: Record<string, unknown> = {
    from,
    to: [args.to],
    subject: args.subject,
    html: args.html,
  };
  if (args.replyTo) body.reply_to = args.replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`Resend send failed ${res.status}: ${detail.slice(0, 300)}`);
  }
}

function userEmailHtml(args: {
  name: string;
  memoUrl: string;
  memoHtml: string;
  bookUrl: string;
}): string {
  const greeting = args.name ? `Hi ${escapeHtml(args.name.split(' ')[0])},` : 'Hi,';
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #14264C; max-width: 640px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px 0;">${greeting}</p>
  <p style="margin: 0 0 16px 0;">Your EDGE Diagnostic memo is below. You can also share the full version at any time:</p>
  <p style="margin: 0 0 24px 0;"><a href="${args.memoUrl}" style="color: #D89A55; font-weight: 600;">${args.memoUrl}</a></p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <div style="font-size: 15px; line-height: 1.55;">${args.memoHtml}</div>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0;" />
  <p style="margin: 0 0 12px 0;">If any of this lands and you'd like to talk it through, book a 30-minute call with me:</p>
  <p style="margin: 0 0 24px 0;"><a href="${args.bookUrl}" style="display: inline-block; background: #14264C; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 4px; font-weight: 600;">Book a 30-minute call</a></p>
  <p style="margin: 0; font-size: 13px; color: #64748b;">Adrian Watkins<br/>Creator of the EDGE Framework</p>
</body></html>`;
}

function adrianEmailHtml(args: {
  lead: LeadCapture;
  answers: Answers;
  dimensionScores: Record<Dimension, number>;
  overall: number;
  memoHtml: string;
  memoUrl: string;
}): string {
  const respRows = QUESTIONS.map((q) => {
    const raw = args.answers[q.id];
    if (raw === undefined || raw === null || raw === '') return '';
    let display: string;
    if (q.type === 'choice' && typeof raw === 'string') display = labelChoice(q.id, raw);
    else display = String(raw);
    return `<tr><td style="padding: 6px 12px 6px 0; vertical-align: top; color: #64748b; font-size: 13px; width: 30%;">${escapeHtml(q.section)} - ${escapeHtml(q.text)}</td><td style="padding: 6px 0; vertical-align: top; font-size: 14px;">${escapeHtml(display)}</td></tr>`;
  }).join('');

  const dims = DIMENSIONS.map(
    (d) => `<li>${escapeHtml(d)}: ${args.dimensionScores[d].toFixed(1)} / 5.0</li>`,
  ).join('');

  const firstName = (args.lead.name || args.lead.email.split('@')[0]).split(' ')[0];
  const replyTemplate = `Hi ${escapeHtml(firstName)},

Thanks for completing the EDGE Diagnostic. Your memo flagged ${escapeHtml(args.lead.name ? 'a couple of things' : 'some specific things')} I'd like to talk through with you - particularly around ${escapeHtml(String(args.answers.biggest_question || 'the area you raised').slice(0, 120))}.

I have a 30-minute slot open next week. Would Tuesday or Thursday work?

Adrian`;

  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #14264C; max-width: 720px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 8px 0;">New EDGE Diagnostic completion</h2>
  <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px;">${new Date().toUTCString()}</p>

  <h3 style="margin: 16px 0 6px 0;">Lead</h3>
  <ul style="margin: 0 0 12px 0; padding-left: 20px;">
    <li>Name: ${escapeHtml(args.lead.name || '(none)')}</li>
    <li>Email: ${escapeHtml(args.lead.email)}</li>
    <li>Contact email: ${escapeHtml(args.lead.contactEmail || '(same as above)')}</li>
    <li>Phone: ${escapeHtml(args.lead.phone || '(none)')}</li>
  </ul>

  <h3 style="margin: 16px 0 6px 0;">Scores</h3>
  <p style="margin: 0 0 4px 0;"><strong>Overall: ${args.overall.toFixed(1)} / 5.0 - ${maturityLabel(args.overall)}</strong></p>
  <ul style="margin: 0 0 12px 0; padding-left: 20px;">${dims}</ul>

  <h3 style="margin: 16px 0 6px 0;">Memo</h3>
  <p style="margin: 0 0 8px 0;"><a href="${args.memoUrl}" style="color: #D89A55;">${args.memoUrl}</a></p>
  <div style="font-size: 14px; line-height: 1.5; border-left: 3px solid #D89A55; padding-left: 16px;">${args.memoHtml}</div>

  <h3 style="margin: 24px 0 6px 0;">All responses</h3>
  <table style="border-collapse: collapse; width: 100%;">${respRows}</table>

  <h3 style="margin: 24px 0 6px 0;">Draft reply</h3>
  <pre style="white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 4px; font-family: inherit; font-size: 14px;">${replyTemplate}</pre>
</body></html>`;
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>): Promise<Response> => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(503, { error: 'Persistence is not configured.' });
  }
  if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY) {
    return jsonResponse(503, { error: 'LLM provider is not configured.' });
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON.' });
  }

  if (!body || typeof body !== 'object' || !body.answers || !body.lead) {
    return jsonResponse(400, { error: 'Missing answers or lead.' });
  }
  if (!body.lead.email || !isValidEmail(body.lead.email)) {
    return jsonResponse(400, { error: 'A valid email is required.' });
  }
  if (!body.lead.consent) {
    return jsonResponse(400, { error: 'Consent is required.' });
  }

  const { dimensionScores, overall } = scoreAnswers(body.answers);
  const { system, user } = buildMemoPrompt({
    answers: body.answers,
    dimensionScores,
    overall,
    lead: body.lead,
  });

  let memoMarkdown: string;
  try {
    memoMarkdown = await generateMemo(env, system, user);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'LLM generation failed.';
    return jsonResponse(502, { error: msg });
  }

  const memoHtml = markdownToHtml(memoMarkdown);

  let id: string;
  try {
    id = await saveToSupabase(env, {
      email: body.lead.email.trim(),
      name: (body.lead.name || '').trim(),
      role: labelChoice('role', String(body.answers.role ?? '')),
      org_size: labelChoice('org_size', String(body.answers.org_size ?? '')),
      sector: String(body.answers.sector ?? '').trim(),
      answers: body.answers,
      dimension_scores: dimensionScores,
      overall_score: overall,
      memo_markdown: memoMarkdown,
      memo_html: memoHtml,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Persistence failed.';
    return jsonResponse(502, { error: msg });
  }

  const siteUrl = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const memoUrl = `${siteUrl}/tools/edge-diagnostic/memo/${id}`;
  const bookUrl = 'mailto:me@adrianwatkins.com?subject=EDGE%20Diagnostic%20follow-up';
  const adrianTo = env.ADRIAN_EMAIL || 'me@adrianwatkins.com';

  const userHtml = userEmailHtml({
    name: body.lead.name || '',
    memoUrl,
    memoHtml,
    bookUrl,
  });
  const adrianHtml = adrianEmailHtml({
    lead: body.lead,
    answers: body.answers,
    dimensionScores,
    overall,
    memoHtml,
    memoUrl,
  });

  await Promise.all([
    sendEmail(env, {
      to: body.lead.email,
      subject: 'Your EDGE Diagnostic memo, ready for review',
      html: userHtml,
      replyTo: adrianTo,
    }),
    sendEmail(env, {
      to: adrianTo,
      subject: `EDGE Diagnostic: ${(body.lead.name || body.lead.email).split('@')[0]} from ${String(body.answers.sector || 'unknown sector')}, maturity ${overall.toFixed(1)}`,
      html: adrianHtml,
      replyTo: body.lead.email,
    }),
  ]);

  return jsonResponse(200, { id, memoUrl });
};
