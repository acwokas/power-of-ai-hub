/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface DecisionInput {
  decision?: string;
  stakes?: string;
  constraints?: string;
  timeHorizon?: string;
  riskTolerance?: string;
}

const SYSTEM_PROMPT = `You are a decision analyst helping a thoughtful person pressure-test an important choice.

Write a structured analysis in British English using these H2 sections in this exact order. Each H2 heading must start with "## " on its own line.

## Path A: [name the first path]
- Best-case outcome (specific, not generic)
- Most likely outcome
- Worst-case outcome
- Second-order effects you might not see for 1 to 3 years
- What this path says about your identity if you choose it

## Path B: [name the second path]
- Same structure as Path A
- Surface trade-offs that mirror or contrast with Path A

## Blind spots
- Specific assumptions in the framing that may not hold
- Things the person has not mentioned but probably matter
- Where their stated risk tolerance and the actual risks diverge

## Second-order effects
- Effects beyond the immediate decision: on relationships, on optionality, on identity
- Effects that compound over the chosen time horizon

## The uncomfortable insight
- One thing that is true but the person may not want to hear
- Be direct, specific, and grounded in what they shared

## A question worth sitting with
- A single question that, if answered honestly, would clarify the choice

Be specific. Use the person's own language. Reference details they shared. Avoid generic advice. Do not tell them what to do; surface what they are not seeing.`;

function buildUserPrompt(input: DecisionInput): string {
  const lines: string[] = [];
  if (input.decision) lines.push(`Decision: ${input.decision}`);
  if (input.stakes) lines.push(`\nStakes: ${input.stakes}`);
  if (input.constraints) lines.push(`\nConstraints: ${input.constraints}`);
  if (input.timeHorizon) lines.push(`\nTime horizon: ${input.timeHorizon}`);
  if (input.riskTolerance) lines.push(`\nRisk tolerance: ${input.riskTolerance}`);
  return lines.join('\n');
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>): Promise<Response> => {
  if (!env.OPENAI_API_KEY) {
    return jsonError(
      503,
      'Decision analysis is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: DecisionInput;
  try {
    body = (await request.json()) as DecisionInput;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  if (!body.decision || body.decision.trim().length < 20) {
    return jsonError(400, 'Decision must be at least 20 characters.');
  }
  if (!body.stakes || body.stakes.trim().length === 0) {
    return jsonError(400, 'Stakes must not be empty.');
  }
  if (!body.timeHorizon) {
    return jsonError(400, 'Time horizon is required.');
  }

  const model = env.OPENAI_MODEL || 'gpt-4o-mini';

  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.6,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });
  } catch {
    return jsonError(502, 'Could not reach the analysis provider.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(upstream.status || 502, `Analysis provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};
