/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface AnalysisInput {
  mode?: 'analysis' | 'synthesis' | 'mitigation';
  idea?: string;
  audience?: string;
  dependencies?: string;
  constraints?: string;
  intensity?: 'measured' | 'adversarial' | 'forensic';
  focusAreas?: string[];
  analysisText?: string;
  concern?: string;
  ideaContext?: string;
}

const INTENSITY_GUIDANCE: Record<string, string> = {
  measured: 'Tone: constructive and diplomatic. Surface concerns without antagonism. Acknowledge what works before challenging.',
  adversarial:
    'Tone: direct, sharp, no softening. Argue against the idea like you are paid to kill it. Do not concede strengths until forced to.',
  forensic:
    'Tone: cold, systematic, logical. Deconstruct each claim like a debugger. Name every unstated assumption.',
};

const ANALYSIS_SYSTEM = (intensity: string, focusAreas: string[]) => {
  const focusLine = focusAreas.length > 0 ? `\nEmphasise these areas: ${focusAreas.join(', ')}.` : '';
  return `You are a senior strategy advisor running a red team / blue team pressure test in British English.

Output three H2 sections in this exact order. Each H2 heading must start with "## " on its own line.

## Red Team: adversarial challenge
- Use bullet points starting with "- "
- Each bullet attacks a specific, named weakness in the idea
- Be concrete: reference the actual numbers, audience, constraints they gave you
- Surface the strongest objections an unfriendly board member or competitor would raise
- 6 to 10 bullets

## Blue Team: measured defence
- Use bullet points starting with "- "
- Each bullet defends the idea on substance, not vibes
- Steelman the proposal by identifying its genuine strengths and how to communicate them
- 5 to 8 bullets

## Fault line analysis: structural assumptions
- Use bullet points starting with "- "
- Name the load-bearing assumptions whose failure would collapse the whole plan
- Distinguish assumptions about market, execution, people, and financials
- 4 to 7 bullets

${INTENSITY_GUIDANCE[intensity] || INTENSITY_GUIDANCE.adversarial}${focusLine}

Stay specific. Reference their actual words and numbers. No generic boilerplate.`;
};

const SYNTHESIS_SYSTEM = `You are a senior strategy advisor. The user has just run a red team / blue team pressure test on an idea. Below is the full analysis. Produce a single, decisive synthesis in British English: 4 to 6 short paragraphs that answer "given all of this, what should the person actually do?" Be opinionated. Lead with the biggest unresolved risk and the single most important change to make before presenting. End with a one-sentence verdict.`;

const MITIGATION_SYSTEM = `You are a senior strategy advisor in British English. The user has identified a specific concern from a red team pressure test. Produce a concrete mitigation plan: 3 to 5 short bullets covering what to change, how to communicate the change, and how to monitor whether the mitigation is working. Be specific and operational.`;

function buildAnalysisUserPrompt(input: AnalysisInput): string {
  const lines: string[] = [];
  if (input.idea) lines.push(`Idea: ${input.idea}`);
  if (input.audience) lines.push(`\nAudience: ${input.audience}`);
  if (input.dependencies) lines.push(`\nDependencies: ${input.dependencies}`);
  if (input.constraints) lines.push(`\nConstraints: ${input.constraints}`);
  return lines.join('\n');
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function streamFromOpenAI(env: Env, system: string, user: string): Promise<Response> {
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
        temperature: 0.65,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
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
      'Red team simulation is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: AnalysisInput;
  try {
    body = (await request.json()) as AnalysisInput;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const mode = body.mode || 'analysis';

  if (mode === 'analysis') {
    if (!body.idea || body.idea.trim().length < 30) {
      return jsonError(400, 'Idea must be at least 30 characters.');
    }
    if (!body.audience || body.audience.trim().length === 0) {
      return jsonError(400, 'Audience must not be empty.');
    }
    if (!body.intensity) {
      return jsonError(400, 'Intensity is required.');
    }
    return streamFromOpenAI(
      env,
      ANALYSIS_SYSTEM(body.intensity, body.focusAreas || []),
      buildAnalysisUserPrompt(body),
    );
  }

  if (mode === 'synthesis') {
    if (!body.analysisText || body.analysisText.trim().length < 50) {
      return jsonError(400, 'Analysis text required for synthesis.');
    }
    return streamFromOpenAI(env, SYNTHESIS_SYSTEM, body.analysisText);
  }

  if (mode === 'mitigation') {
    if (!body.concern || body.concern.trim().length === 0) {
      return jsonError(400, 'Concern required for mitigation.');
    }
    const user = `Concern: ${body.concern}\n\nOriginal idea context: ${body.ideaContext || '(not provided)'}`;
    return streamFromOpenAI(env, MITIGATION_SYSTEM, user);
  }

  return jsonError(400, `Unknown mode: ${mode}`);
};
