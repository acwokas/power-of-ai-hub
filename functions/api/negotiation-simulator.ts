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
  context?: string;
  yourRole?: string;
  theirRole?: string;
  stakes?: string;
  yourObjectives?: string;
  theirObjectives?: string;
  style?: string;
}

interface ChatBody {
  mode?: 'chat' | 'reflection';
  setup?: SetupData;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  negotiationTranscript?: string;
}

const STYLE_GUIDANCE: Record<string, string> = {
  collaborative:
    'Style: collaborative and win-win seeking. You genuinely want to find mutual benefit, but you still protect your own interests. You are open but not a pushover.',
  competitive:
    'Style: competitive and firm on positions. You hold your ground, push for advantage, and do not concede easily. You use anchoring and pressure tactics.',
  strategic:
    'Style: strategic, calculated, patient. You are methodical. You gather information before committing, use silence effectively, and make moves at the right time.',
  'time-pressured':
    'Style: time-pressured with real urgency. There is a deadline. You reference time constraints, create urgency, and push for faster resolution.',
  defensive:
    'Style: defensive and protecting the current position. You are satisfied with the status quo. Any change needs strong justification. You resist change and demand proof of value.',
};

function chatSystemPrompt(setup: SetupData): string {
  const style = STYLE_GUIDANCE[setup.style || 'collaborative'] || STYLE_GUIDANCE['collaborative'];
  return `You are role-playing as ${setup.theirRole || 'the other party'} in a negotiation with ${setup.yourRole || 'the user'}.

Stay strictly in character as ${setup.theirRole}. Speak only as them. Use first-person, present tense, and natural contemporary British English.

Context:
- What is being negotiated: ${setup.context || 'not specified'}
- Their role: ${setup.yourRole || 'not specified'}
- Stakes: ${setup.stakes || 'not specified'}
- Their objectives (which you sense but do not fully know): ${setup.yourObjectives || 'not specified'}
- Your objectives: ${setup.theirObjectives || 'Maximise your position while keeping a workable relationship.'}

${style}

Behaviour:
1. Use realistic tactics. Counter-ask, anchor, delay with phrases like "let me think about that", apply gentle pressure when appropriate, reference alternatives or constraints.
2. Hold your own objectives. Do not just react. Make demands of your own.
3. Concede strategically. Small early concessions to build momentum, bigger ones only in exchange for something valuable. Never give everything at once. Link concessions, for example "I can do X if you can do Y".
4. Be willing to walk away if pushed too far. Signal this through escalating resistance.
5. Use silence. Occasionally pause before responding with something like "let me consider that" or "that is an interesting position".
6. Reference realistic constraints, for example budget, authority, policy, or other options.
7. Do not make it easy. Real negotiations have friction. They must earn concessions through arguments, data, alternatives, or relationship building.

Keep responses to 2 to 4 sentences. Track previous offers and concessions. Never break character. Never reveal that you are an AI or that this is a simulation.`;
}

const REFLECTION_SYSTEM = `You are a senior negotiation coach reviewing a practice negotiation in British English. The user role-played one side; an AI played the other side in character.

Output an H2-sectioned coaching report in this exact order. Each H2 heading must start with "## " on its own line.

## What worked
- Bullet points naming specific tactics or moves the user made that landed effectively. Quote short phrases from their messages.

## What did not work
- Bullet points naming specific moves that backfired, lost leverage, or created unnecessary friction. Quote and explain.

## Tactical observations
- When did the other party concede and why? When did they push back hardest? What patterns emerged?

## Alternative approaches
- 3 to 5 different strategies that might have achieved a better outcome. Specific and actionable.

## Leverage analysis
- Where the user had leverage and how well they used it. What leverage they missed.

Be honest, specific, and useful. No flattery, no hedging. British English throughout.`;

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
      'Negotiation simulator is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
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
    if (body.messages.length > 60) return jsonError(400, 'Negotiation too long. Please start over.');

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
    if (!body.negotiationTranscript || body.negotiationTranscript.trim().length < 50) {
      return jsonError(400, 'Negotiation transcript is required for reflection.');
    }
    const setupSummary = body.setup
      ? `Context: ${body.setup.context}\nYour role: ${body.setup.yourRole}\nTheir role: ${body.setup.theirRole}\nStakes: ${body.setup.stakes}\nYour objectives: ${body.setup.yourObjectives}\nTheir likely objectives: ${body.setup.theirObjectives}\nStyle: ${body.setup.style}\n\n`
      : '';
    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: REFLECTION_SYSTEM },
        { role: 'user', content: `${setupSummary}Transcript:\n\n${body.negotiationTranscript}` },
      ],
      0.4,
    );
  }

  return jsonError(400, `Unknown mode: ${mode}`);
};
