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
  capability?: string;
  businessImpact?: string;
  stage?: string;
  reviewers?: string[];
  concerns?: string;
  gaps?: string;
}

interface ChatBody {
  mode?: 'chat' | 'reflection';
  setup?: SetupData;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  reviewTranscript?: string;
}

const STAGE_CONTEXT: Record<string, string> = {
  planning: 'They are still in planning. Focus on whether they have thought ahead about governance structures.',
  pilot: 'They are piloting. Ask about what they have learned, how they are measuring, and what happens after pilot.',
  limited: 'Limited deployment. Ask about scaling plans, monitoring gaps, and edge cases encountered.',
  production: 'Full production. Ask about ongoing oversight, performance tracking, and incident response.',
  scaling:
    'Scaling and expanding. Ask about governance that scales, automation of oversight, and organisational accountability.',
};

function chatSystemPrompt(setup: SetupData): string {
  const reviewerTypes = (setup.reviewers || []).join(', ') || 'Board of Directors';
  const stage = STAGE_CONTEXT[setup.stage || 'planning'] || '';
  return `You are a senior member of the ${reviewerTypes} reviewing an AI implementation proposal. You write in natural contemporary British English.

AI capability: ${setup.capability || 'not specified'}
Business impact: ${setup.businessImpact || 'not specified'}
Deployment stage: ${setup.stage || 'planning'}
${stage}
Concerns you should probe: ${setup.concerns || 'general governance'}
Known gaps to probe: ${setup.gaps || 'unknown, discover through questioning'}

Your role is to ask rigorous questions about governance. You want to ensure proper oversight exists. You are not trying to block progress. You want good governance.

Cover these question categories across the conversation:
1. Business case and ROI. Start here with something like "Walk me through the business case."
2. Risk and mitigation. "What could go wrong?"
3. Oversight and accountability. "Who owns this decision?"
4. Performance measurement. "How do we know it is working?"
5. Ethics and responsibility. "Have we considered bias?"

Behaviour:
- Ask one question at a time.
- After their response, briefly acknowledge (1 to 2 sentences), note gaps, then either follow up or move to the next category.
- Be firm but fair. Reference specific details from their answers.
- If they are vague, push for specifics: "Can you be more concrete about that?"
- If they are strong, acknowledge it briefly.
- Track which areas you have covered and move through all five.

Do not make it easy, but do not be adversarial. This is oversight, not interrogation. Keep responses to 2 to 4 sentences: brief acknowledgement plus the next question. Never break character. Never reveal that you are an AI.`;
}

function reflectionSystemPrompt(setup: SetupData): string {
  return `You are a senior governance advisor analysing a practice governance review simulation in British English. The user defended an AI implementation; an AI played a reviewer in character.

Output an H2-sectioned report in this exact order. Each H2 heading must start with "## " on its own line.

## Review summary
A short paragraph naming where governance is strong and where it needs work. Be specific about what the user demonstrated well and where they struggled.

## Identified gaps
Bullet list. For each gap include: what is missing, why it matters, priority (Critical, Important, or Nice-to-have). Quote from their answers where relevant.

## AI decision ownership map
A practical framework table in this exact markdown shape:

| Decision Type | Owner | Approver | When Required | Documentation |
|---------------|-------|----------|---------------|---------------|
| Deploy to production | [Role] | [Role] | Before any production release | Deployment checklist, risk assessment |
| Pause or rollback | [Role] | [Role] | Performance below threshold | Incident report |
| Override AI output | [Role] | [Role] | Edge cases, complaints | Override log with justification |
| Escalate concerns | [Role] | [Role] | Safety, bias, or compliance issues | Escalation form |
| Terminate or sunset | [Role] | [Role] | Strategic review, performance failure | Sunset plan, migration strategy |

Customise the role names for this capability: ${setup.capability || 'the AI system under review'}.

## Performance accountability template
Framework for ongoing monitoring with these subsections:
- Metrics to track (specific to the capability)
- Review cadence (daily, weekly, monthly, quarterly)
- Escalation triggers (specific thresholds)

## Governance review checklist
A checklist for the user to take into the real review. Use markdown checkboxes ("- [ ] ..."). Cover business case, risk assessment, oversight structure, performance data, incident log, ethical review, compliance, stakeholder feedback. Customise the items to the user's capability and gaps.

Be specific to their context. Make every template immediately usable. British English throughout.`;
}

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
      'Governance Review is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
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
    if (body.messages.length > 60) return jsonError(400, 'Review too long. Please start over.');

    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: chatSystemPrompt(body.setup) },
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      0.8,
    );
  }

  if (mode === 'reflection') {
    if (!body.reviewTranscript || body.reviewTranscript.trim().length < 50) {
      return jsonError(400, 'Review transcript is required for reflection.');
    }
    if (!body.setup) return jsonError(400, 'Setup is required.');
    const reviewerTypes = (body.setup.reviewers || []).join(', ') || 'Board of Directors';
    const userPrompt = `AI capability: ${body.setup.capability}
Business impact: ${body.setup.businessImpact}
Deployment stage: ${body.setup.stage}
Reviewers: ${reviewerTypes}
Their concerns: ${body.setup.concerns || 'Not specified'}
Known gaps: ${body.setup.gaps || 'Not specified'}

Review transcript:
${body.reviewTranscript}

Analyse this governance review simulation and produce the four section report.`;

    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: reflectionSystemPrompt(body.setup) },
        { role: 'user', content: userPrompt },
      ],
      0.4,
    );
  }

  return jsonError(400, `Unknown mode: ${mode}`);
};
