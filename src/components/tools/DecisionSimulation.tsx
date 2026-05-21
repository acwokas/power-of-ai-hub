import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SimulationProvider,
  SimulationLayout,
  FormField,
  ExampleScenario,
  useSimulation,
} from '@/components/simulation';
import type { ResultSection } from '@/components/simulation';
import { PrivacyNotice } from '@/components/simulation/PrivacyNotice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Download,
  Columns2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BrandMarkdown } from '@/lib/render-markdown';
import { BrandPdf, type ColumnBlock } from '@/lib/brand-pdf';

const examples = [
  {
    id: 'career',
    title: 'Career Change',
    description: 'VP role at a startup vs staying at a stable corporate.',
    values: {
      decision:
        "Accept a VP Product role at a Series B startup (80 people, fintech) vs stay as Senior Director at a large bank where I've been for 6 years.",
      stakes:
        "Career trajectory: the startup offers a title jump and equity, but the bank offers stability and a clear path to SVP. My identity as a 'builder' vs a 'steward' is at stake. Financial stability matters, I have a mortgage and two kids under 5.",
      constraints:
        'Partner works part-time. Mortgage requires stable income. The startup is pre-profitability. My current employer would not take me back easily. Visa is employer-sponsored.',
      timeHorizon: '3-5years',
      riskTolerance:
        'Moderate. I can absorb 6 months of reduced income but not a total wipeout. The uncertainty of startup culture concerns me more than the financial risk.',
    },
  },
  {
    id: 'pivot',
    title: 'Business Model Pivot',
    description: 'Shift from B2B enterprise to B2C product-led growth.',
    values: {
      decision:
        'Pivot our SaaS platform from B2B enterprise sales (£2M ARR, 30 clients) to a B2C product-led growth model targeting individual professionals.',
      stakes:
        'Company survival and growth trajectory. B2B is stable but slow-growing. B2C has a larger TAM but requires completely different GTM, product, and support infrastructure. Team of 25 would need to be restructured.',
      constraints:
        '18 months runway. Existing B2B contracts have 12-month terms. Core team has enterprise DNA, not consumer product experience. Board is split on direction.',
      timeHorizon: '1-2years',
      riskTolerance:
        "High tolerance for strategic risk, low tolerance for existential risk. We can experiment but can't bet the company on an unvalidated assumption.",
    },
  },
  {
    id: 'boundary',
    title: 'End Toxic Partnership',
    description: 'Exit a high-revenue but damaging business partnership.',
    values: {
      decision:
        'End a 4-year business partnership with a co-founder who controls key client relationships but whose management style is driving talent away and creating legal exposure.',
      stakes:
        'The partnership generates 60% of current revenue. Ending it risks client loss and short-term revenue decline. Continuing risks losing the remaining strong team members and increasing personal liability. My reputation in the industry is tied to this venture.',
      constraints:
        "Partnership agreement has a 6-month buyout clause. Three key clients have personal relationships with the partner. Two senior team members have said they'll leave if the situation doesn't change within 3 months.",
      timeHorizon: '6months',
      riskTolerance:
        "I'm willing to take a significant short-term revenue hit to protect the team and reduce legal exposure. What keeps me up is the reputational risk of a messy split.",
    },
  },
];

const fields = {
  step1: [
    {
      id: 'decision',
      label: "What's the decision?",
      type: 'textarea' as const,
      placeholder: 'e.g., Accept VP role at startup vs stay at current company',
      tooltip: "Describe the choice you're facing. Two clear paths work best.",
      maxLength: 600,
      required: true,
    },
    {
      id: 'stakes',
      label: 'Why does it matter?',
      type: 'textarea' as const,
      placeholder: "What's at stake? Career trajectory, financial stability, relationships, identity...",
      tooltip: 'Think beyond immediate outcomes. What ripple effects matter to you?',
      example:
        'Career trajectory is at stake: this choice determines whether I optimise for growth or stability over the next decade. It also affects my family\'s financial security and my professional identity.',
      maxLength: 600,
      required: true,
    },
  ],
  step2: [
    {
      id: 'constraints',
      label: 'Key constraints',
      type: 'textarea' as const,
      placeholder: 'Family considerations, financial commitments, visa status, health, timing...',
      tooltip: 'What factors limit your options or create pressure?',
      maxLength: 500,
    },
    {
      id: 'timeHorizon',
      label: 'Time horizon',
      type: 'select' as const,
      placeholder: 'Select time horizon...',
      tooltip: 'Outcomes change drastically based on timeframe',
      required: true,
      options: [
        { value: '6months', label: 'Next 6 months (short-term survival)' },
        { value: '1-2years', label: 'Next 1 to 2 years (near-term positioning)' },
        { value: '3-5years', label: 'Next 3 to 5 years (medium-term strategy)' },
        { value: '10plus', label: 'Next 10+ years (long-term identity)' },
      ],
    },
    {
      id: 'riskTolerance',
      label: 'Risk tolerance',
      type: 'textarea' as const,
      placeholder: 'What level of uncertainty is acceptable? What keeps you up at night?',
      tooltip: 'This calibrates how the analysis frames uncertainty',
      maxLength: 400,
    },
  ],
};

const howItWorks = [
  'You provide context about a decision you are facing.',
  'The AI analyses both paths, identifies second-order effects, surfaces blind spots, and explores how each choice might shape your identity.',
  'One path may feel more compelling. This reflects real biases. The analysis includes uncomfortable insights because real decisions have real trade-offs.',
];

const ANALYSIS_URL = '/api/decision-analysis';

async function streamAnalysis(
  formData: Record<string, string>,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal?: AbortSignal,
) {
  let resp: Response;
  try {
    resp = await fetch(ANALYSIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      signal,
    });
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return;
    onError('Could not reach the analysis service. Check your connection and retry.');
    return;
  }

  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({}))) as { error?: string };
    onError(err.error || `Analysis failed (status ${resp.status}).`);
    return;
  }

  if (!resp.body) {
    onError('No response stream.');
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

function parseIntoSections(text: string): ResultSection[] {
  const sections: ResultSection[] = [];
  const parts = text.split(/^## /m).filter(Boolean);

  for (const part of parts) {
    const nlIdx = part.indexOf('\n');
    const title = (nlIdx > -1 ? part.slice(0, nlIdx) : part).trim();
    const content = nlIdx > -1 ? part.slice(nlIdx + 1).trim() : '';
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '');
    sections.push({ id, title, content });
  }
  return sections;
}

// Heuristics to classify sections so we can style them
function classify(id: string): 'pathA' | 'pathB' | 'blind' | 'second' | 'insight' | 'question' | 'other' {
  if (id.startsWith('path-a')) return 'pathA';
  if (id.startsWith('path-b')) return 'pathB';
  if (id.includes('blind')) return 'blind';
  if (id.includes('second-order') || id.includes('second-order-effects')) return 'second';
  if (id.includes('uncomfortable')) return 'insight';
  if (id.includes('question')) return 'question';
  return 'other';
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-muted-foreground hover:text-foreground transition-colors p-1"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function SectionCard({
  section,
  defaultOpen,
  variant,
}: {
  section: ResultSection;
  defaultOpen?: boolean;
  variant?: 'default' | 'insight' | 'question' | 'tight';
}) {
  if (variant === 'insight') {
    return (
      <div className="brand-md-callout-cream rounded-sm overflow-hidden border border-border/20">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#D89A55]/30 bg-[#F4ECD8]">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#14264C]">
            {section.title}
          </h3>
          <CopyBtn text={section.content} />
        </div>
        <BrandMarkdown text={section.content} />
      </div>
    );
  }

  if (variant === 'question') {
    return (
      <div className="brand-md-callout-navy border border-border/20">
        <h3>{section.title}</h3>
        <BrandMarkdown text={section.content} />
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="border border-border/30 rounded-sm overflow-hidden bg-[#F4ECD8]">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-[#EBE0C6] transition-colors group">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#14264C]">
            {section.title}
          </h3>
          <div className="flex items-center gap-2">
            <CopyBtn text={section.content} />
            <ChevronDown className="h-3.5 w-3.5 text-[#14264C] transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={variant === 'tight' ? 'brand-md-tight' : ''}>
            <BrandMarkdown text={section.content} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Helper - strip markdown decorations for PDF column blocks
function stripMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^- /gm, '')
    .replace(/`/g, '')
    .trim();
}

// Extract "field: value" patterns from a path section. The LLM emits
// **Best-case outcome:** value, **Most likely outcome:** value, etc.
function extractFields(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /\*\*([^*]+?):\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?:\*\*|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const key = m[1].trim().toLowerCase();
    const val = stripMd(m[2]).replace(/\s+\n/g, '\n').trim();
    out[key] = val;
  }
  return out;
}

function buildPdf(args: {
  rawText: string;
  formData: Record<string, string>;
  reflection: string;
}): void {
  const { rawText, formData, reflection } = args;
  const sections = parseIntoSections(rawText);
  const pathA = sections.find((s) => s.id.startsWith('path-a'));
  const pathB = sections.find((s) => s.id.startsWith('path-b'));
  const blind = sections.find((s) => s.id.includes('blind'));
  const second = sections.find((s) => s.id.includes('second-order'));
  const insight = sections.find((s) => s.id.includes('uncomfortable'));
  const question = sections.find((s) => s.id.includes('question'));

  const decisionLine = (formData.decision || 'Your decision')
    .replace(/\s+/g, ' ')
    .slice(0, 140);
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const humanDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pdf = new BrandPdf({
    toolTitle: 'Decision Simulation',
    subtitle: decisionLine,
    completedDate: humanDate,
    userContext: formData.stakes,
    filename: 'decision-simulation-' + dateStr + '.pdf',
    footerNote: 'democratising.ai',
  });

  // ---- Page 2: side-by-side path comparison ----
  const labels: Array<{ key: string; label: string; italic?: boolean; tint?: boolean }> = [
    { key: 'best-case outcome', label: 'Best-case outcome' },
    { key: 'most likely outcome', label: 'Most likely outcome' },
    { key: 'worst-case outcome', label: 'Worst-case outcome' },
    { key: '1-3 year second-order effects', label: '1-3 year second-order effects' },
    { key: 'second-order effects', label: '1-3 year second-order effects' },
    { key: 'identity implication', label: 'Identity implication', italic: true, tint: true },
  ];

  const buildPathBlocks = (sectionContent: string): ColumnBlock[] => {
    const fields = extractFields(sectionContent);
    const blocks: ColumnBlock[] = [];
    const seenLabels = new Set<string>();
    for (const def of labels) {
      const text = fields[def.key];
      if (!text) continue;
      if (seenLabels.has(def.label)) continue;
      seenLabels.add(def.label);
      blocks.push({ kind: 'label', text: def.label });
      blocks.push({
        kind: 'body',
        text: stripMd(text),
        italic: def.italic,
        tint: def.tint,
      });
    }
    if (blocks.length === 0) {
      // Fallback: dump whole content as body
      blocks.push({ kind: 'body', text: stripMd(sectionContent) });
    }
    return blocks;
  };

  const pathATitle = pathA ? pathA.title.replace(/^Path A:?\s*/i, 'Path A: ') : 'Path A';
  const pathBTitle = pathB ? pathB.title.replace(/^Path B:?\s*/i, 'Path B: ') : 'Path B';

  if (pathA || pathB) {
    pdf.twoColumn(
      pathA ? buildPathBlocks(pathA.content) : [{ kind: 'body', text: 'No content' }],
      pathB ? buildPathBlocks(pathB.content) : [{ kind: 'body', text: 'No content' }],
      pathATitle,
      pathBTitle,
    );
  }

  // ---- Page: Blind spots ----
  if (blind) {
    pdf.newPage();
    pdf.h1('What you might be missing');
    const subs = blind.content.split(/^### /m).filter(Boolean);
    if (subs.length > 1) {
      for (const sub of subs) {
        const nl = sub.indexOf('\n');
        const t = (nl > -1 ? sub.slice(0, nl) : sub).trim();
        const body = nl > -1 ? sub.slice(nl + 1).trim() : '';
        pdf.h3(t);
        // Bullet detection
        if (/^[-*]\s/m.test(body)) {
          const items = body
            .split(/\n/)
            .filter((l) => /^[-*]\s/.test(l))
            .map((l) => stripMd(l.replace(/^[-*]\s/, '')));
          pdf.bullets(items);
          // any prose
          const prose = body.replace(/^[-*]\s.*$/gm, '').trim();
          if (prose) pdf.paragraph(stripMd(prose));
        } else {
          pdf.paragraph(stripMd(body));
        }
      }
    } else {
      pdf.paragraph(stripMd(blind.content));
    }
  }

  // ---- Page: Second-order effects ----
  if (second) {
    pdf.newPage();
    pdf.h1('Second-order effects');
    const subs = second.content.split(/^### /m).filter(Boolean);
    if (subs.length > 1) {
      for (const sub of subs) {
        const nl = sub.indexOf('\n');
        const t = (nl > -1 ? sub.slice(0, nl) : sub).trim();
        const body = nl > -1 ? sub.slice(nl + 1).trim() : '';
        pdf.h3(t);
        pdf.paragraph(stripMd(body));
      }
    } else {
      pdf.paragraph(stripMd(second.content));
    }
  }

  // ---- Page: insight + question ----
  if (insight || question) {
    pdf.newPage();
    if (insight) {
      pdf.calloutCream('The uncomfortable insight', stripMd(insight.content));
    }
    pdf.spacer(12);
    if (question) {
      pdf.calloutNavy('A question worth sitting with', stripMd(question.content));
    }
  }

  // ---- Page: reflection + CTAs ----
  pdf.newPage();
  if (reflection && reflection.trim()) {
    pdf.h1('Your reflection');
    pdf.paragraph(reflection.trim(), { italic: false });
    pdf.spacer(10);
  }

  pdf.h2('Where to next');
  pdf.ctaCard(
    'Run another decision through the simulator',
    'Test a different choice or rerun this one with adjusted constraints.',
    'democratising.ai/tools/decision-simulation',
  );
  pdf.ctaCard(
    'Apply the EDGE framework to your career',
    'A practical, repeatable approach to using AI well in your daily work.',
    'democratising.ai/edge',
  );
  pdf.ctaCard(
    'Subscribe to the daily AI briefing',
    'Three things worth knowing about AI, in your inbox before nine.',
    'withthepowerof.ai',
  );

  pdf.brandFooter();
  pdf.save();
}

function DecisionContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();
  const [rawText, setRawText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sideBySide, setSideBySide] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 900;
  });
  const [reflection, setReflection] = useState(() => {
    try {
      return localStorage.getItem('simulate-decision-reflection') || '';
    } catch {
      return '';
    }
  });
  const abortRef = useRef<AbortController | null>(null);

  // Auto-toggle side-by-side at the 900px breakpoint
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 900px)');
    const apply = () => setSideBySide(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const sections = parseIntoSections(rawText);
  const pathA = sections.find((s) => s.id.startsWith('path-a'));
  const pathB = sections.find((s) => s.id.startsWith('path-b'));
  const otherSections = sections.filter((s) => !s.id.startsWith('path-a') && !s.id.startsWith('path-b'));

  const canProceedStep1 =
    (formData.decision?.trim()?.length ?? 0) >= 20 && (formData.stakes?.trim()?.length ?? 0) > 0;
  const canSubmit = canProceedStep1 && !!formData.timeHorizon;

  const handleAnalyze = useCallback(() => {
    setRawText('');
    setIsStreaming(true);
    setPhase('active');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    streamAnalysis(
      formData,
      (delta) => setRawText((prev) => prev + delta),
      () => {
        setIsStreaming(false);
        setPhase('reflection');
      },
      (err) => {
        setIsStreaming(false);
        setPhase('setup');
        toast({ title: 'Analysis failed', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, [formData, setPhase]);

  const handleReflectionChange = (v: string) => {
    setReflection(v);
    try {
      localStorage.setItem('simulate-decision-reflection', v);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    try {
      buildPdf({ rawText, formData, reflection });
    } catch (e) {
      toast({
        title: 'Could not build PDF',
        description: 'Your browser blocked the download. Try the Copy all button instead.',
        variant: 'destructive',
      });
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(rawText);
    toast({ title: 'Copied', description: 'Full analysis copied to clipboard.' });
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setRawText('');
    setReflection('');
    try {
      localStorage.removeItem('simulate-decision-reflection');
    } catch {
      // ignore
    }
    reset();
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <ExampleScenario examples={examples} />

        {currentStep === 0 && (
          <>
            <div className="space-y-1 mb-4">
              <p className="text-xs text-muted-foreground">Step 1 of 2: the decision</p>
            </div>
            {fields.step1.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <div className="pt-4">
              <Button onClick={nextStep} disabled={!canProceedStep1} variant="hero" size="default">
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="space-y-1 mb-4">
              <p className="text-xs text-muted-foreground">Step 2 of 2: constraints and context</p>
            </div>
            {fields.step2.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <PrivacyNotice className="mt-4" />
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline" size="default">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleAnalyze} disabled={!canSubmit} variant="hero" size="default">
                Analyse decision
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isStreaming && rawText.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Analysing decision...</p>
          <p className="text-xs text-muted-foreground">This takes 30 to 60 seconds.</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border/30 bg-card rounded-sm p-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {isStreaming && rawText.length > 0 && sections.length === 0 && (
        <div className="brand-md">
          <BrandMarkdown text={rawText} />
        </div>
      )}

      {pathA && pathB && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSideBySide(!sideBySide)}
            className="text-xs text-muted-foreground"
          >
            <Columns2 className="h-3.5 w-3.5 mr-1" />
            {sideBySide ? 'Stack view' : 'Side-by-side'}
          </Button>
        </div>
      )}

      {sideBySide && pathA && pathB ? (
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
          <SectionCard section={pathA} defaultOpen />
          <SectionCard section={pathB} defaultOpen />
        </div>
      ) : (
        <>
          {pathA && <SectionCard section={pathA} defaultOpen />}
          {pathB && <SectionCard section={pathB} defaultOpen />}
        </>
      )}

      {otherSections.map((s) => {
        const cls = classify(s.id);
        if (cls === 'insight') {
          return <SectionCard key={s.id} section={s} variant="insight" />;
        }
        if (cls === 'question') {
          return <SectionCard key={s.id} section={s} variant="question" />;
        }
        if (cls === 'blind' || cls === 'second') {
          return <SectionCard key={s.id} section={s} defaultOpen variant="tight" />;
        }
        return <SectionCard key={s.id} section={s} defaultOpen={false} />;
      })}

      {isStreaming && sections.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Analysing...
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/20">
          <div>
            <h3 className="text-base font-medium mb-1">Take a moment to reflect</h3>
            <p className="text-xs text-muted-foreground">
              Private. Saved in your browser only, never sent anywhere.
            </p>
          </div>
          <Textarea
            value={reflection}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder="What stands out? What feels surprising? What needs more thought?"
            className="min-h-[120px] brand-reflection-textarea"
          />
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPhase('setup');
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Adjust inputs
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Analyse different decision
            </Button>
            <div className="sm:ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy all
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionSimulation() {
  return (
    <SimulationProvider roomId="decision-simulation" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks}>
        <DecisionContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
