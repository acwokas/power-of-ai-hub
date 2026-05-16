import { useState } from 'react';

type Platform = 'ChatGPT' | 'Claude' | 'Gemini' | 'MidJourney' | 'Perplexity';

const platforms: { id: Platform; description: string; badge: string; tip: string }[] = [
  {
    id: 'ChatGPT',
    description: 'Structured, conversational format',
    badge: 'Most popular',
    tip: 'Works best with structured objectives and clear output requirements.',
  },
  {
    id: 'Claude',
    description: 'Narrative elegance, detailed context',
    badge: 'Best for complex tasks',
    tip: 'Benefits from context and requests for detailed thinking.',
  },
  {
    id: 'Gemini',
    description: 'Analytical, bullet-point format',
    badge: 'Data-focused',
    tip: 'Excels with analytical tasks and bullet-point organisation.',
  },
  {
    id: 'MidJourney',
    description: 'Visual generation, photography terms',
    badge: 'Image creation',
    tip: 'Add aspect ratio (--ar 16:9) and version (--v 6) parameters.',
  },
  {
    id: 'Perplexity',
    description: 'Research format with citations',
    badge: 'Research & analysis',
    tip: "Include 'cite sources' for research-heavy queries.",
  },
];

const sendToAiLinks: Record<Platform, string> = {
  ChatGPT: 'https://chatgpt.com/',
  Claude: 'https://claude.ai/',
  Gemini: 'https://gemini.google.com/',
  MidJourney: 'https://discord.com/channels/@me',
  Perplexity: 'https://www.perplexity.ai/',
};

function adaptForChatGPT(prompt: string): string {
  const sentences = prompt.split(/(?<=[.!?])\s+/).filter(Boolean);
  const objective = sentences[0] || prompt;
  const rest = sentences.slice(1).join(' ').trim();
  return `Objective: ${objective}${rest ? `\n\nApproach:\n${rest}` : ''}

Expected Output:
- Provide clear, structured response
- Use examples when helpful
- Format for readability`;
}

function adaptForClaude(prompt: string): string {
  return `I need your help with the following task, and I'd like you to approach it with narrative elegance and thorough consideration:

${prompt}

Please structure your response with:
- Clear introduction to your approach
- Detailed analysis or explanation
- Concrete examples
- Summary of key takeaways

Take your time to think through this comprehensively.`;
}

function adaptForGemini(prompt: string): string {
  return `Task: ${prompt}

Please provide:
- Key concepts and definitions
- Structured analysis
- Data points or examples
- Summary in bullet format

Format your response for clarity and analytical depth.`;
}

function adaptForMidJourney(prompt: string): string {
  const cleaned = prompt
    .replace(/\b(create|generate|make|design|produce|write|explain|describe how)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return `${cleaned}, professional photography, highly detailed, cinematic lighting, vibrant colors, ultra-realistic, 8k resolution, masterpiece quality --ar 16:9 --v 6`;
}

function adaptForPerplexity(prompt: string): string {
  return `Research query: ${prompt}

Please provide a comprehensive analysis including:
- Overview with key definitions
- Current state of knowledge (cite sources)
- Multiple perspectives where relevant
- Data and statistics where available
- Conclusion with synthesis

Use British English. Cite authoritative sources throughout.`;
}

const adapters: Record<Platform, (prompt: string) => string> = {
  ChatGPT: adaptForChatGPT,
  Claude: adaptForClaude,
  Gemini: adaptForGemini,
  MidJourney: adaptForMidJourney,
  Perplexity: adaptForPerplexity,
};

const EXAMPLE_PROMPT = 'Explain blockchain to a non-technical person, using everyday analogies and avoiding jargon. Aim for a 200-word answer.';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; silently fail
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 hover:text-accent transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function PromptEngineer() {
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState<Platform>('ChatGPT');
  const [adapted, setAdapted] = useState('');
  const [adaptedOriginal, setAdaptedOriginal] = useState('');

  const canSubmit = input.trim().length >= 20;
  const hasResult = adapted.length > 0;
  const activePlatform = platforms.find((p) => p.id === platform);

  const handleAdapt = () => {
    if (!canSubmit) return;
    const result = adapters[platform](input.trim());
    setAdapted(result);
    setAdaptedOriginal(input.trim());
  };

  const handleStartOver = () => {
    setAdapted('');
    setAdaptedOriginal('');
  };

  const handleSendToAi = async () => {
    try {
      await navigator.clipboard.writeText(adapted);
    } catch {
      // ignore clipboard error
    }
    window.open(sendToAiLinks[platform], '_blank', 'noopener,noreferrer');
  };

  const handleLoadExample = () => {
    setInput(EXAMPLE_PROMPT);
  };

  return (
    <div className="space-y-8">
      {!hasResult && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="pe-input">
              Your prompt
            </label>
            <textarea
              id="pe-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste any prompt here. We'll rewrite it for the platform you pick."
              className="min-h-[160px] w-full rounded-sm border border-border bg-secondary/30 px-4 py-3 text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/50">
              <button
                type="button"
                onClick={handleLoadExample}
                className="text-accent hover:underline"
              >
                Load example
              </button>
              <span>
                {input.length} characters &middot; minimum 20
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Target platform</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((p) => {
                const isActive = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={
                      'relative flex flex-col items-start gap-2 rounded-sm border p-4 text-left transition-colors ' +
                      (isActive
                        ? 'border-accent/60 bg-accent/5 ring-1 ring-accent/30'
                        : 'border-border/40 hover:border-border bg-card/30')
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={
                          'text-sm font-semibold ' +
                          (isActive ? 'text-foreground' : 'text-foreground/80')
                        }
                      >
                        {p.id}
                      </span>
                      <span
                        className={
                          'text-[10px] uppercase tracking-[0.18em] rounded-full border px-2 py-0.5 ' +
                          (isActive
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-secondary/40 text-foreground/50 border-border/40')
                        }
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdapt}
            disabled={!canSubmit}
            className={
              'inline-flex items-center justify-center rounded-sm px-7 py-4 text-base font-semibold transition-colors ' +
              (canSubmit
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'bg-secondary/40 text-foreground/40 cursor-not-allowed')
            }
          >
            Adapt prompt &rarr;
          </button>
        </>
      )}

      {hasResult && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <p className="eyebrow mb-2">Adapted</p>
              <p className="text-sm text-foreground/70">
                Optimised for <span className="text-foreground font-semibold">{platform}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendToAi}
                className="inline-flex items-center gap-2 rounded-sm border border-foreground/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/10 transition-colors"
              >
                Send to {platform}
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
              >
                Start over
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-sm border border-border/40 bg-secondary/20 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <span className="eyebrow text-foreground/60">Original</span>
                <CopyButton text={adaptedOriginal} label="original prompt" />
              </div>
              <div className="whitespace-pre-wrap p-4 text-sm text-foreground/80 leading-relaxed max-h-[400px] overflow-y-auto">
                {adaptedOriginal}
              </div>
            </div>

            <div className="rounded-sm border border-accent/40 bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-accent/30 bg-accent/5 px-4 py-2.5">
                <span className="eyebrow text-accent">Adapted</span>
                <CopyButton text={adapted} label="adapted prompt" />
              </div>
              <div className="whitespace-pre-wrap p-4 text-sm text-foreground leading-relaxed max-h-[400px] overflow-y-auto">
                {adapted}
              </div>
            </div>
          </div>

          {activePlatform && (
            <div className="flex items-start gap-3 rounded-sm border border-border/40 bg-secondary/30 p-4">
              <span className="text-accent font-bold">{platform} tip:</span>
              <p className="text-sm text-foreground/80">{activePlatform.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
