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
  useCase?: string;
  tensions?: string[];
  affected?: string;
  stakeholders?: string;
  competingValues?: string;
}

interface ChatBody {
  mode?: 'scenario' | 'chat' | 'reflection';
  setup?: SetupData;
  messages?: { role: 'user' | 'assistant'; content: string }[];
  simulationTranscript?: string;
}

function scenarioSystemPrompt(setup: SetupData): string {
  return `You are facilitating an ethical dilemma simulation about AI deployment. You write in natural contemporary British English.

Use case: ${setup.useCase || 'not specified'}
Ethical tensions: ${(setup.tensions || []).join(', ') || 'not specified'}
Affected parties: ${setup.affected || 'not specified'}
Stakeholders: ${setup.stakeholders || 'Business leadership, affected individuals, regulators, technical team'}
Competing values: ${setup.competingValues || 'not specified'}

Generate the opening of an ethical dilemma simulation. Format your response EXACTLY as follows. Each H2 heading must start with "## " on its own line.

## SCENARIO

Write a 3 to 4 paragraph realistic scenario narrative that:
- Describes the specific situation with concrete details
- Introduces the stakeholders and their positions
- Presents data and evidence that makes the tension real
- Notes regulatory context and business pressures

## DECISION POINT 1: DEPLOYMENT SCOPE

Write a brief framing question (1 to 2 sentences), then present exactly 5 options labelled A through E:

**A.** [Option text]
**B.** [Option text]
**C.** [Option text]
**D.** [Option text]
**E.** [Option text]

Make options represent a genuine spectrum from most aggressive to most cautious. Each should be defensible from at least one ethical framework. British English throughout.`;
}

function chatSystemPrompt(setup: SetupData): string {
  return `You are facilitating an ethical dilemma simulation about AI deployment. You write in natural contemporary British English.

Use case: ${setup.useCase || 'not specified'}
Ethical tensions: ${(setup.tensions || []).join(', ') || 'not specified'}
Affected parties: ${setup.affected || 'not specified'}

The user has just made a decision and explained their reasoning. Respond with these four parts, in order:

1. Stakeholder reactions (2 to 3 sentences each):
   - Business or leadership perspective
   - Affected individuals perspective
   - Regulatory or public perspective

2. Ethical framework challenge. Challenge their reasoning from ONE relevant framework:
   - Utilitarian: does this maximise overall good?
   - Rights-based: does this respect individual dignity?
   - Justice: is this fair to all groups?
   - Care ethics: does this minimise harm?

3. New complication. Introduce a realistic complication (2 to 3 sentences) that tests their consistency.

4. Then present the NEXT decision point exactly as:

## DECISION POINT {N}: {TOPIC}

Brief framing question, then exactly 5 options:

**A.** [Option]
**B.** [Option]
**C.** [Option]
**D.** [Option]
**E.** [Option]

Decision topics progress through:
- Decision 2: TRANSPARENCY (how transparent about AI use)
- Decision 3: ACCOUNTABILITY (who is responsible for outcomes)
- Decision 4: SAFEGUARDS (what protections to implement)
- Decision 5: POLICY BOUNDARIES (what is allowed versus prohibited)

If this is decision 5 (the last), after the stakeholder reactions and challenge, instead of a new decision point write:

## SIMULATION COMPLETE

Write a brief 2 sentence closing that sets up the reflection phase.

Keep a professional, exploratory tone. Do not judge. Help them see trade-offs.`;
}

const REFLECTION_SYSTEM = `You are a senior ethics advisor analysing an ethical dilemma simulation about AI deployment. You write in British English.

Output an H2-sectioned report in this exact order. Each H2 heading must start with "## " on its own line.

## Your ethical framework
What values did the user consistently prioritise? What trade-offs did they make? Identify their decision-making pattern. Are they more utilitarian, rights-based, justice-oriented, or care-focused? Use specific examples from their decisions.

## Consistency analysis
Where were their decisions consistent? Where did they waver or contradict earlier positions? Do not judge. Explore the tensions constructively.

## Blind spots
What perspectives or stakeholder groups did they under-consider? What risks did they not address? What long-term consequences did they miss? Frame constructively.

## Stakeholder impact
How did their collective decisions affect each stakeholder group? Be specific about winners and losers.

## Risk exposure checklist
For this type of AI use case, generate a practical markdown checklist organised under these subheadings (use "- [ ] ..." items):
- Data risks
- Compliance risks
- Brand risks
- Ethical risks
- Operational risks
Customise items to the specific use case.

## Decision escalation matrix
A markdown table showing when AI should decide versus when humans should intervene:

| Scenario | AI Autonomy | Human Review | Senior Approval | Ethics Committee |
|----------|-------------|--------------|-----------------|------------------|

Include 6 to 8 rows customised to their use case and the risk tolerance they showed.

## Experimentation policy
Three subsections with bullet lists:
- Green zone (allowed without special approval)
- Yellow zone (allowed with oversight)
- Red zone (prohibited)

Customise to their decisions and stated values. Be specific. Make every framework immediately usable. British English throughout.`;

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
      'Ethical Dilemma simulator is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const mode = body.mode || 'chat';

  if (mode === 'scenario') {
    if (!body.setup) return jsonError(400, 'Setup is required.');
    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: scenarioSystemPrompt(body.setup) },
        { role: 'user', content: 'Generate the scenario and first decision point.' },
      ],
      0.7,
    );
  }

  if (mode === 'chat') {
    if (!body.setup) return jsonError(400, 'Setup is required.');
    if (!body.messages || body.messages.length === 0) return jsonError(400, 'Messages are required.');
    if (body.messages.length > 20) return jsonError(400, 'Simulation too long. Please start over.');
    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: chatSystemPrompt(body.setup) },
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      0.7,
    );
  }

  if (mode === 'reflection') {
    if (!body.simulationTranscript || body.simulationTranscript.trim().length < 30) {
      return jsonError(400, 'Simulation transcript is required for reflection.');
    }
    if (!body.setup) return jsonError(400, 'Setup is required.');
    const userPrompt = `AI use case: ${body.setup.useCase}
Ethical tensions: ${(body.setup.tensions || []).join(', ')}
Affected parties: ${body.setup.affected}
Stakeholders: ${body.setup.stakeholders || 'Business leadership, affected individuals, regulators, technical team'}
Competing values: ${body.setup.competingValues || 'Not specified'}

Simulation transcript (decisions and reasoning):
${body.simulationTranscript}

Analyse their ethical decision-making and produce the seven-section report.`;
    return streamFromOpenAI(
      env,
      [
        { role: 'system', content: REFLECTION_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      0.4,
    );
  }

  return jsonError(400, `Unknown mode: ${mode}`);
};
