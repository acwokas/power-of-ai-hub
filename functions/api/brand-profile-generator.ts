/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface RequestBody {
  mode?: 'generate' | 'refine';
  formData?: Record<string, string>;
  regenerateSection?: string;
  type?: 'problem' | 'differentiators';
  text?: string;
}

const COMPANY_SIZE_MAP: Record<string, string> = {
  startup: 'Startups (1 to 20 people)',
  small: 'Small teams (21 to 100 people)',
  mid: 'Mid-market (101 to 1,000 people)',
  enterprise: 'Enterprise (1,000 plus people)',
  'not-specific': 'Not company-specific',
};

function buildContext(formData: Record<string, string>): string {
  const size = COMPANY_SIZE_MAP[formData.companySize] || formData.companySize || 'not specified';
  const tones = (formData.tones || '').replace(/,/g, ', ');
  const platforms = (formData.platforms || '').replace(/,/g, ', ');
  return `- Product: ${formData.productName || 'not specified'} - ${formData.productDescription || 'not specified'}
- Audience: ${formData.audienceRole || 'not specified'}, ${size}, cares about ${formData.audienceCares || 'not specified'}
- Markets: ${formData.primaryMarkets || 'not specified'}${formData.marketNotes ? `. Considerations: ${formData.marketNotes}` : ''}
- Problem: ${formData.coreProblem || 'not specified'}
- Differentiators: ${formData.differentiators || 'not specified'}
- Direct competitors: ${formData.directCompetitors || 'Not specified'}
- Indirect alternatives: ${formData.indirectAlternatives || 'Not specified'}
- Tone: ${tones || 'not specified'}${formData.toneNotes ? `. Notes: ${formData.toneNotes}` : ''}
- Platforms: ${platforms || 'not specified'}`;
}

function fullProfilePrompt(context: string): string {
  return `You are a senior brand positioning strategist. You write in natural contemporary British English.

Generate a comprehensive brand profile with exactly four sections in this exact order. Each H2 heading must start with "## " on its own line and use the exact heading text shown.

## POSITIONING SUMMARY

A clear, concise statement of:
- What the product is
- Who it is for (role, company size)
- What problem it solves
- Why it is different from alternatives
- Primary value proposition

Write this as 2 to 3 paragraphs that could be shared with a team, used in pitches, or referenced when creating content. Be specific. Avoid jargon. Focus on clarity.

## AUDIENCE PERSONAS

Create 2 to 3 detailed personas based on the audience information provided.

For each persona include:
- **Name and title** (realistic)
- **Day-to-day responsibilities**
- **Core challenges**
- **What they care about when evaluating solutions**
- **How they prefer to consume information**
- **What language resonates with them**

## BRAND VOICE GUIDE

Based on selected tone attributes and context, define:
- **Voice characteristics** (expand on the selected tones)
- **Language to use** versus **Language to avoid**
- **Sentence structure preferences** (short or long, active or passive)
- **Degree of formality**
- **How to handle technical complexity**
- **Example phrases that work** versus **Example phrases that do not work**

Make this actionable for someone writing content.

## CONTENT PILLARS

Identify 4 to 6 core themes this brand should talk about consistently.

For each pillar:
- **Pillar name**
- **Why it matters** to the audience
- **Example topics and angles** within this pillar
- **How it connects** to the product value

Use all provided context. Be specific to their actual situation. Avoid generic advice. The profile should feel custom-built for this exact brand.

Brand context:
${context}`;
}

function regenerateSectionPrompt(section: string, context: string): string {
  const normalised = section.replace(/\s+/g, ' ').trim();
  return `You are a senior brand positioning strategist. You write in natural contemporary British English.

Regenerate only the ${normalised} section of a brand profile with more depth, clarity, and specificity. Use the same format as the original. Be specific to this brand's actual context. Avoid generic advice.

Brand context:
${context}

Generate only the ${normalised} section. Start with the section heading "## ${normalised.toUpperCase()}".`;
}

function refinePrompt(type: 'problem' | 'differentiators'): string {
  if (type === 'problem') {
    return 'You are a positioning expert. Refine this problem statement to be clearer, more specific, and more compelling. Keep the core meaning but sharpen the language. Quantify where possible. Use British English. Return only the refined statement, nothing else. No preamble. No explanation.';
  }
  return 'You are a positioning expert. Make these differentiators more specific, concrete, and compelling. Remove vagueness. Keep the core meaning. Use British English. Return only the refined differentiators, nothing else. No preamble. No explanation.';
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function streamFromOpenAI(
  env: Env,
  systemPrompt: string,
  userPrompt: string,
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
      body: JSON.stringify({
        model,
        stream: true,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
  } catch {
    return jsonError(502, 'Could not reach the generator provider.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Generator provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`,
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

async function refineFromOpenAI(env: Env, systemPrompt: string, text: string): Promise<Response> {
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
        stream: false,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch {
    return jsonError(502, 'Could not reach the refinement provider.');
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Refinement provider returned an error.${detail ? ` ${detail.slice(0, 200)}` : ''}`,
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
  };
  const refined = data.choices?.[0]?.message?.content?.trim() || '';
  return new Response(JSON.stringify({ refined }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>): Promise<Response> => {
  if (!env.OPENAI_API_KEY) {
    return jsonError(
      503,
      'Brand Profile Generator is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const mode = body.mode || 'generate';

  if (mode === 'refine') {
    const type = body.type;
    const text = (body.text || '').trim();
    if (type !== 'problem' && type !== 'differentiators') {
      return jsonError(400, 'Refine type must be "problem" or "differentiators".');
    }
    if (text.length < 10) return jsonError(400, 'Refine text is too short.');
    return refineFromOpenAI(env, refinePrompt(type), text);
  }

  const formData = body.formData || {};
  if (!formData.productName || !formData.productDescription) {
    return jsonError(400, 'Product name and description are required.');
  }

  const context = buildContext(formData);
  const systemPrompt = body.regenerateSection
    ? regenerateSectionPrompt(body.regenerateSection, context)
    : fullProfilePrompt(context);
  const userPrompt = body.regenerateSection
    ? `Regenerate only the ${body.regenerateSection} section.`
    : 'Generate the brand profile based on the context provided.';

  return streamFromOpenAI(env, systemPrompt, userPrompt, 0.6);
};
