/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface ProfileData {
  formData?: Record<string, string>;
  profile?: string;
  generatedAt?: string;
}

interface SprintConfig {
  duration?: number;
  ideaCount?: number;
  objective?: string;
  evidence?: string;
  platforms?: string[];
  themes?: string[];
  events?: string;
  toneSlider?: number;
}

interface OptimizePost {
  platform?: string;
  content?: string;
  tones?: string;
}

interface RequestBody {
  profileData?: ProfileData;
  sprintConfig?: SprintConfig;
  optimizePost?: OptimizePost;
}

const COMPANY_SIZE_MAP: Record<string, string> = {
  startup: 'Startups (1 to 20 people)',
  small: 'Small teams (21 to 100 people)',
  mid: 'Mid-market (101 to 1,000 people)',
  enterprise: 'Enterprise (1,000 plus people)',
  'not-specific': 'Not company-specific',
};

function buildOptimisePrompt(o: OptimizePost): string {
  return `You are a content strategist. Improve this ${o.platform || 'social'} post. Improve clarity only where useful. Preserve names, figures, uncertainty, dates and commitments. Do not invent evidence, anecdotes, quotations, results or urgency. Do not use em dashes. Keep the core message but sharpen execution. Follow the brand voice. British English throughout.

Brand voice: ${o.tones || 'Professional, Direct'}

Original post:
${o.content || ''}

Return only the improved post text. No explanations.`;
}

function buildSprintPrompt(profileData: ProfileData, sprintConfig: SprintConfig): string {
  const formData = profileData.formData || {};
  const profile = profileData.profile || '';
  const duration = sprintConfig.duration || 7;
  const ideaCount = sprintConfig.ideaCount ?? 3;
  const platforms = sprintConfig.platforms || [];
  const themes = sprintConfig.themes || [];
  const events = sprintConfig.events || '';
  const toneSlider = sprintConfig.toneSlider ?? 50;

  const toneDirection =
    toneSlider < 30
      ? 'Lean more professional and formal.'
      : toneSlider > 70
        ? 'Lean more conversational and casual.'
        : 'Balance professional and conversational.';

  const productName = formData.productName || 'the product';
  const productDescription = formData.productDescription || 'not specified';
  const audienceRole = formData.audienceRole || 'the target audience';
  const companySize = COMPANY_SIZE_MAP[formData.companySize] || formData.companySize || 'not specified';
  const audienceCares = formData.audienceCares || 'not specified';
  const primaryMarkets = formData.primaryMarkets || 'Global';
  const coreProblem = formData.coreProblem || 'not specified';
  const differentiators = formData.differentiators || 'not specified';
  const tones = (formData.tones || 'Professional, Direct').replace(/,/g, ', ');
  const toneNotes = formData.toneNotes ? `. Notes: ${formData.toneNotes}` : '';

  const context = `- Product: ${productName} - ${productDescription}
- Audience: ${audienceRole}, ${companySize}, cares about ${audienceCares}
- Markets: ${primaryMarkets}
- Problem: ${coreProblem}
- Differentiators: ${differentiators}
- Tone: ${tones}${toneNotes}
- Tone adjustment: ${toneDirection}
- Content pillars: ${themes.length > 0 ? themes.join(', ') : 'Balance all pillars equally'}
${events ? `- Special events: ${events}` : ''}`;

  const days = Array.from({length: ideaCount}, (_,i) => ideaCount === 1 ? 1 : 1 + Math.round(i * (duration - 1) / (ideaCount - 1)));
  const platformsBlock = platforms
    .map(
      (p) => `### ${p}

**Post**:
{Write the actual post copy, platform-optimised}

**Why this works**:
{1 to 2 sentences explaining the positioning or angle}

**Hashtags**: {Platform-appropriate tags}

**Best time to post**: {If the author supplied audience timing evidence, use it. Otherwise write "Timing to test: choose using your audience analytics." Never imply a universally best time.}

**CTA**: {Include a clear call-to-action}

**Notes**: {Any platform-specific formatting guidance}`,
    )
    .join('\n\n');

  return `You are a senior content strategist creating a ${duration}-day content calendar. You write in natural contemporary British English.

Create exactly ${ideaCount} distinct editorial ideas spread across the ${duration}-day planning window. Adapt each idea for the chosen platforms; these are alternatives for review, not an instruction to publish everywhere daily.

Desired outcome: ${sprintConfig.objective || "Not supplied. Ask the author to choose an outcome; do not assume reach is the goal."}
Evidence supplied by the author (not independently verified): ${sprintConfig.evidence || "None. Use questions, explanations or clearly labelled proposed ideas. Do not invent case studies or personal experience."}

Based on the brand profile, draft for these platforms: ${platforms.join(', ')}.

Use exactly these day headings, once each, and no other day headings: ${days.map(d => "## Day " + d).join(", ")}.

For each selected publication day, follow this exact format. Use distinct day numbers within the planning window, in increasing order. Skip other days entirely. Every H2 must start with "## " on its own line:

## Day {N}

**Theme**: {Which content pillar this post reinforces}

${platformsBlock}

Content strategy guidelines:
- Use the brand positioning to stay on-message
- Write for ${audienceRole}
- Follow the brand voice: ${tones}
- ${toneDirection}
- Platform-specific optimisation:
  - LinkedIn: professional thought leadership, 1,500 character max, 3 to 5 hashtags
  - X (Twitter): concise, conversational, 280 character max, 2 to 3 hashtags, thread if complex
  - Reddit: community-focused, helpful not promotional, subreddit-aware
  - Company blog: long-form, SEO-optimised, comprehensive
  - Newsletter: personal, value-first, segmented by interest
- Vary post types: questions, insights, case studies, tips, stories
- Build a narrative arc across the sprint (do not repeat themes back-to-back)
- Choose the mix to serve the stated outcome, without a fixed promotional ratio
- Treat personas and generated brand claims as hypotheses, not evidence
- The publication schedule is a plan, not a chronology of events. A later post must not imply earlier proposed activities happened.
- Never write first-person claims about launches, customers, interviews, workshops or results unless the supplied evidence expressly establishes them.
- If an activity is only being explored, use questions or conditional wording throughout every post. Do not turn "exploring" into "preparing to launch".
- Do not invent quotes or survey findings. A useful post can explain a question, a trade-off or how the author intends to learn.
- Never invent customer results, personal stories, quotations, statistics, source links or events
- Mark missing substantiation as [Evidence needed] within the relevant draft
- Do not use em dashes
- Include an observable response to review in Notes, tied to the stated outcome. Do not invent numerical targets.
${events ? `- Weave in these events: ${events}` : ''}

Brand context:
${context}

${profile ? `Full brand profile for reference:\n${profile}` : ''}

Produce editable drafts for human review. Preserve supplied facts and uncertainty. Source URLs supplied by the author have not been fetched or verified. Do not call these publication-ready. British English throughout.`;
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
  expectedIdeas?: number,
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
      body: JSON.stringify({
        model,
        max_tokens: 6000,
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

  if (expectedIdeas !== undefined) {
    const raw = await upstream.text();
    let output = ''; let complete = false;
    try {
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const item = line.slice(6).trim();
        if (item === '[DONE]') { complete = true; continue; }
        const event = JSON.parse(item);
        if (event.error) throw new Error('Incomplete output');
        output += event.choices?.[0]?.delta?.content || '';
      }
    } catch { return jsonError(502, 'The draft did not complete. Please retry.'); }
    const headings = output.match(/^## Day \d+\s*$/gm) || [];
    if (!complete || headings.length !== expectedIdeas || new Set(headings.map(h=>h.trim())).size !== expectedIdeas) {
      return jsonError(502, 'The generator did not return the number of ideas you chose. Your context is unchanged. Please retry.');
    }
    return new Response(raw, {headers: {'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store'}});
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
      'Content Sprint Generator is not yet configured. Set OPENAI_API_KEY in Cloudflare Pages environment variables.',
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError(400, "Invalid request body.");

  if (body.optimizePost) {
    const o = body.optimizePost;
    if (!o.content || o.content.trim().length < 10) return jsonError(400, 'Post content is required.');
    return streamFromOpenAI(env, buildOptimisePrompt(o), 'Improve this post.', 0.6);
  }

  const sprintConfig = body.sprintConfig || {};
  for (const key of ["objective", "evidence"] as const) {
    if (sprintConfig[key] !== undefined && (typeof sprintConfig[key] !== "string" || sprintConfig[key]!.length > 6000)) return jsonError(400, "Outcome and evidence must be text of up to 6,000 characters.");
  }
  const platforms = sprintConfig.platforms || [];
  if (!Array.isArray(platforms) || platforms.some(p => typeof p !== "string")) return jsonError(400, "Invalid platforms.");
  if (platforms.length < 1) return jsonError(400, 'At least one platform is required.');
  const duration = sprintConfig.duration || 7;
  if (![7, 14].includes(duration)) return jsonError(400, 'Duration must be 7 or 14 days.');

  const ideaCount = sprintConfig.ideaCount ?? 3;
  if (!Number.isInteger(ideaCount) || ideaCount < 1 || ideaCount > duration) return jsonError(400, "Choose between one idea and one per day in the planning window.");

  const systemPrompt = buildSprintPrompt(body.profileData || {}, sprintConfig);
  return streamFromOpenAI(env, systemPrompt, `Write exactly ${ideaCount} idea(s), using only the specified day headings within the ${duration}-day window. Preserve tentative plans and do not announce a launch unless confirmed.`, 0.5, ideaCount);
};
