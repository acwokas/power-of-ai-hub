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

interface AnalyseBody {
  message?: string;
  messageType?: string;
  intent?: string;
  audiences?: Audience[];
}

const SYSTEM_PROMPT = `You are an expert at analysing communication for interpretation gaps. You write in British English.

Given a message and multiple audiences, analyse how EACH audience might interpret it.

For each audience, output a section using this exact format. Each H2 heading must start with "## " on its own line and use the audience's name verbatim.

## {AUDIENCE_NAME}

**Primary Perception Risk**

The biggest way this could be misinterpreted by this audience. Quote the specific phrase or phrases from the message that create this risk.

**Likely Interpretation**

What they will probably take away from this message. Use the format: "You meant: [X]. They might hear: [Y]." to highlight gaps between intent and perception.

**Assumptions They Might Make**

What they will read between the lines based on their perspective. List as bullet points.

**Secondary Ambiguities**

Other potential confusion points or questions they might have.

Be probabilistic but clear. Do not hedge. Surface real interpretation gaps. Use specific examples and quote phrases from the message that might be read differently. Do not rewrite the message. Analyse it. Be direct and useful. British English throughout.`;

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
    return jsonError(502, 'Could not reach the analysis provider.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Analysis provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`,
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
      'Before You Send is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: AnalyseBody;
  try {
    body = (await request.json()) as AnalyseBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const message = (body.message || '').trim();
  const intent = (body.intent || '').trim();
  const audiences = (body.audiences || []).filter((a) => a && (a.name || '').trim().length > 0);

  if (message.length < 50) return jsonError(400, 'Message must be at least 50 characters.');
  if (!intent) return jsonError(400, 'Intent is required.');
  if (audiences.length < 2) return jsonError(400, 'Provide at least two audiences.');
  if (audiences.length > 4) return jsonError(400, 'Up to four audiences are supported.');

  const audienceList = audiences
    .map((a, i) => `${i + 1}. ${a.name}: ${a.perspective || 'No perspective provided'}`)
    .join('\n');

  const userPrompt = `Message intent: ${intent}

Message type: ${body.messageType || 'Not specified'}

Message content:
${message}

Audiences:
${audienceList}

Analyse how each audience might interpret this message.`;

  return streamFromOpenAI(
    env,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    0.5,
  );
};
