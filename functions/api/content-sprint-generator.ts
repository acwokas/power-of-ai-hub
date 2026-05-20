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
  return `You are a content strategist. Improve this ${o.platform || 'social'} post. Make it more engaging, specific, and actionable. Keep the core message but sharpen execution. Follow the brand voice. British English throughout.

Brand voice: ${o.tones || 'Professional, Direct'}

Original post:
${o.content || ''}

Return only the improved post text. No explanations.`;
}

function buildSprintPrompt(profileData: ProfileData, sprintConfig: SprintConfig): string {
  const formData = profileData.formData || {};
  const profile = profileData.profile || '';
  const duration = sprintConfig.duration || 7;
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

  const platformsBlock = platforms
    .map(
      (p) => `### ${p}

**Post**:
{Write the actual post copy, platform-optimised}

**Why this works**:
{1 to 2 sentences explaining the positioning or angle}

**Hashtags**: {Platform-appropriate tags}

**Best time to post**: {Suggest timing based on platform and audience}

**CTA**: {Include a clear call-to-action}

**Notes**: {Any platform-specific formatting guidance}`,
    )
    .join('\n\n');

  return `You are a senior content strategist creating a ${duration}-day content calendar. You write in natural contemporary British English.

Based on the brand profile, generate daily content for these platforms: ${platforms.join(', ')}.

For EACH DAY, follow this exact format. Every H2 must start with "## " on its own line:

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
- Mix educational, engaging, and promotional in roughly a 70/20/10 ratio
${events ? `- Weave in these events: ${events}` : ''}

Brand context:
${context}

${profile ? `Full brand profile for reference:\n${profile}` : ''}

Be specific, actionable, and copy-ready. This should be ready to paste and post. British English throughout.`;
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

  if (body.optimizePost) {
    const o = body.optimizePost;
    if (!o.content || o.content.trim().length < 10) return jsonError(400, 'Post content is required.');
    return streamFromOpenAI(env, buildOptimisePrompt(o), 'Improve this post.', 0.6);
  }

  const sprintConfig = body.sprintConfig || {};
  const platforms = sprintConfig.platforms || [];
  if (platforms.length < 1) return jsonError(400, 'At least one platform is required.');
  const duration = sprintConfig.duration || 7;
  if (![7, 14].includes(duration)) return jsonError(400, 'Duration must be 7 or 14 days.');

  const systemPrompt = buildSprintPrompt(body.profileData || {}, sprintConfig);
  return streamFromOpenAI(env, systemPrompt, `Generate the ${duration}-day content sprint.`, 0.75);
};
