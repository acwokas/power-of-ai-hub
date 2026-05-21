/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface Audience {
  name?: string;
  perspective?: string;
}

interface RewriteBody {
  message?: string;
  messageType?: string;
  intent?: string;
  audiences?: Audience[];
  analysis?: string;
}

const SYSTEM_PROMPT = `You are an expert communications editor. You write in British English.

Given an original message, the author's intent, a list of audiences, and a perception analysis showing how each audience might interpret the message, produce:

1. A per audience rewrite for EACH audience. Maximum 80 words. Optimised for that audience. Address their primary perception risk. Keep the core information. Tone shifts to match the audience (for example, direct reports get reassurance about job security; peer managers get cross departmental collaboration commitments; senior leadership gets specific metrics and timelines).

2. ONE overall rewrite that threads the needle across ALL audiences without bloat. Maximum 120 words.

3. A short list of 2 or 3 bullets explaining what changed and why in the overall rewrite.

Constraints:
- No jargon.
- No em dashes or en dashes. Use commas, semicolons, or full stops.
- British English throughout.
- Do not include placeholders like [name] or [date]; keep the same level of specificity as the original.
- Do not include any preamble or commentary outside the structured output below.

Output format, exactly:

## Per audience rewrites

### {AUDIENCE_NAME_1}
{rewrite for audience 1}

### {AUDIENCE_NAME_2}
{rewrite for audience 2}

(repeat for each audience)

## Overall rewrite

{the single overall rewrite}

## What changed and why

- {bullet 1}
- {bullet 2}
- {bullet 3 if needed}
`;

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function streamFromOpenAI(
  env: Env,
  messages: { role: string; content: string }[],
  temperature: number,
): Promise<Response> {
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, stream: true, temperature, messages }),
    });
  } catch {
    return jsonError(502, 'Could not reach the rewrite provider.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Rewrite provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`,
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>): Promise<Response> => {
  if (!env.OPENAI_API_KEY) {
    return jsonError(
      503,
      'Before You Send rewrites are not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: RewriteBody;
  try {
    body = (await request.json()) as RewriteBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const message = (body.message || '').trim();
  const intent = (body.intent || '').trim();
  const analysis = (body.analysis || '').trim();
  const audiences = (body.audiences || []).filter((a) => a && (a.name || '').trim().length > 0);

  if (message.length < 50) return jsonError(400, 'Message must be at least 50 characters.');
  if (!intent) return jsonError(400, 'Intent is required.');
  if (audiences.length < 2) return jsonError(400, 'Provide at least two audiences.');
  if (!analysis) return jsonError(400, 'Analysis output is required for rewrites.');

  const audienceList = audiences
    .map((a, i) => `${i + 1}. ${a.name}: ${a.perspective || 'No perspective provided'}`)
    .join('\n');

  const userPrompt = `Author intent: ${intent}

Message type: ${body.messageType || 'Not specified'}

Original message:
${message}

Audiences:
${audienceList}

Audience perception analysis (from a previous step):
${analysis}

Produce the per audience rewrites, the overall rewrite, and the change rationale, following the exact format in the system prompt. Keep each per audience rewrite at or below 80 words. Keep the overall rewrite at or below 120 words.`;

  return streamFromOpenAI(
    env,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    0.6,
  );
};
