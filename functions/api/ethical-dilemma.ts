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
  return `You are facilitating an ethical dilemma simulation about AI deployment. You write in natural contemporary British English. Do not use em dashes. This is a fictional learning exercise. Label invented details, stakeholder reactions and outcomes as simulated. Do not present regulatory claims as verified law or infer real-world permission to deploy.

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
- Clearly labels any invented data as fictional scenario assumptions, not observed evidence
- Identifies questions about obligations to verify separately, without inventing legal requirements; labels simulated business pressures

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
  return `You are facilitating an ethical dilemma simulation about AI deployment. You write in natural contemporary British English. Do not use em dashes. This is a fictional learning exercise. Label invented details, stakeholder reactions and outcomes as simulated. Do not present regulatory claims as verified law or infer real-world permission to deploy.

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

const REFLECTION_SYSTEM = `You are a senior ethics advisor analysing an ethical dilemma simulation about AI deployment. You write in British English. Do not use em dashes. This report concerns a fictional exercise, not observed organisational performance or a policy approval.

Keep recommendations proportionate to the stated setting. A small student or community trial usually needs a named organiser and a simple review, not a new committee. Do not introduce business leadership, regulators or formal approval bodies unless their relevance is established by the scenario. Do not label an absent corporate perspective a blind spot in a non-corporate setting.

Output an H2-sectioned report in this exact order. Each H2 heading must start with "## " on its own line.

## Your ethical framework
What values did the user consistently prioritise? What trade-offs did they make? Identify their decision-making pattern. Describe perspectives used in this exercise only. Do not infer a stable personality or ethical identity. Use specific examples from their decisions.

## Consistency analysis
Describe consistency supported by the transcript. Only describe wavering or contradiction if you can quote TWO actual conflicting user statements verbatim. Otherwise explicitly say no contradiction is established from the supplied statements. An ordinary trade-off is not a contradiction.

## Blind spots
Identify any perspectives not addressed in the transcript. Do not manufacture omissions. If the transcript does not support a concern, say so. Ask useful questions for further reflection.

## Stakeholder impact
Explain possible effects within the fictional scenario, preserving uncertainty. Distinguish simulated reactions from observed real-world outcomes.

## Risk exposure checklist
For this type of AI use case, generate a practical markdown checklist organised under these subheadings (use "- [ ] ..." items):
- Data risks
- Compliance risks
- Brand risks
- Ethical risks
- Operational risks
Frame items as discussion prompts for the fictional use case, not a complete risk or compliance assessment. Do not name legislation unless the user supplied the jurisdiction and law. Ask which obligations apply instead.

## Decision escalation matrix
A draft discussion table exploring who might need to be involved. It grants no decision authority and is not an approved organisational matrix:

| Proposed situation | Open question | Who should confirm? |
|--------------------|---------------|---------------------|

Include only rows supported by the scenario. Mark authority, permissions and ownership as needing confirmation. Do not derive permitted autonomy from how bold the user was in the exercise.

## Experimentation policy
Three subsections with bullet lists:
- Proposals to discuss
- Questions requiring more context
- Actions to defer until conditions are clarified

Keep the heading "## Experimentation policy" for compatibility, then begin the section body "Discussion draft for the fictional exercise, not an approved policy." Treat each zone as a proposal requiring evidence and organisational review. Do not authorise deployment, prohibit actual activities or claim legal compliance from simulated choices. End with questions to take to accountable people before applying any learning. British English throughout.`;

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
  const model = 'gpt-4o-mini';
  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, max_tokens: 6000, stream: true, temperature, messages }),
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
