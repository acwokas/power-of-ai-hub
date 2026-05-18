/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface SetupData {
  yourRole?: string;
  theirRole?: string;
  relationship?: string;
  stakes?: string;
  objective?: string;
  tone?: string;
}

interface ChatBody {
  mode?: 'chat' | 'reflection';
  setup?: SetupData;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  conversationTranscript?: string;
}

const TONE_GUIDANCE: Record<string, string> = {
  'difficult-professional':
    'Tone: professional but resistant. You raise objections, ask probing questions, and do not soften your position easily.',
  'emotionally-charged':
    'Tone: emotionally charged. You feel personally involved. You may become defensive, frustrated, or vulnerable. You react before you reason.',
  'passive-aggressive':
    'Tone: passive-aggressive. You agree on the surface but undermine through implication, sarcasm, or selective compliance.',
  defensive: 'Tone: defensive. You deflect, justify, blame circumstances, and resist taking responsibility.',
  'collaborative-cautious':
    'Tone: open in principle but cautious. You ask many clarifying questions and want guarantees before committing.',
};

function chatSystemPrompt(setup: SetupData): string {
  const tone = TONE_GUIDANCE[setup.tone || 'difficult-professional'] || TONE_GUIDANCE['difficult-professional'];
  return `You are role-playing as ${setup.theirRole || 'the other person'} in a difficult conversation with ${setup.yourRole || 'the user'}.

Stay strictly in character as ${setup.theirRole}. Speak only as them. Use first-person, present tense.

Context the other person gave us:
- Relationship: ${setup.relationship || 'not specified'}
- Stakes: ${setup.stakes || 'not specified'}
- Their objective for the conversation: ${setup.objective || 'not specified'}

${tone}

Do not roll over. Do not summarise the user's points back at them. Do not give therapy. Respond in 1 to 3 short paragraphs at most. Use natural, contemporary British English. Resolution must be earned through their clarity, empathy, or firmness. If they earn a concession, give a partial one and probe further. If they are clumsy, push back. If they go silent, do not fill the silence with capitulation.

Never break character. Never reveal that you are an AI or that this is a simulation.`;
}

const REFLECTION_SYSTEM = `You are a senior coach reviewing a difficult conversation in British English. The user role-played one side; an AI played the other side in character.

Output an H2-sectioned reflection in this exact order. Each H2 heading must start with "## " on its own line.

## What worked
- Bullet points naming specific moves the user made that landed effectively. Quote short phrases from their messages.

## What did not work
- Bullet points naming specific moves that backfired, escalated tension, or missed an opening. Quote and explain.

## What you missed
- Moments where the other person opened a door (an admission, a question, a shift in tone) and the user did not walk through it.

## Emotional dynamics
- A short read on the emotional arc: where things tightened, where they softened, why.

## If you did it again
- 3 to 5 concrete moves to try next time. Specific phrasings, not generic advice.

Be honest, specific, and useful. No flattery. No hedging. British English throughout.`;

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
    return jsonError(502, 'Could not reach the simulator provider.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Simulator provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`,
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
      'Conversation simulator is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const mode = body.mode || 'chat';

  if (mode === 'chat') {
    if (!body.setup) return jsonError(400, 'Setup is required.');
    if (!body.messages || body.messages.length === 0) return jsonError(400, 'Messages are required.');
    if (body.messages.length > 60) return jsonError(400, 'Conversation too long. Please start over.');

    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: chatSystemPrompt(body.setup) },
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      0.85,
    );
  }

  if (mode === 'reflection') {
    if (!body.conversationTranscript || body.conversationTranscript.trim().length < 50) {
      return jsonError(400, 'Conversation transcript is required for reflection.');
    }
    const setupSummary = body.setup
      ? `Your role: ${body.setup.yourRole}\nTheir role: ${body.setup.theirRole}\nStakes: ${body.setup.stakes}\nObjective: ${body.setup.objective}\nTone: ${body.setup.tone}\n\n`
      : '';
    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: REFLECTION_SYSTEM },
        { role: 'user', content: `${setupSummary}Transcript:\n\n${body.conversationTranscript}` },
      ],
      0.4,
    );
  }

  return jsonError(400, `Unknown mode: ${mode}`);
};
