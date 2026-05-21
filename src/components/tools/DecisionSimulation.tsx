import { useState, useCallback, useRef } from 'react';
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

function SectionCard({ section, defaultOpen }: { section: ResultSection; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="border border-border/30 bg-card rounded-sm overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-secondary/30 transition-colors group">
          <h3 className="text-sm font-medium">{section.title}</h3>
          <div className="flex items-center gap-2">
            <CopyBtn text={section.content} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border/20 pt-3 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {section.content}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function DecisionContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();
  const [rawText, setRawText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);
  const [reflection, setReflection] = useState(() => {
    try {
      return localStorage.getItem('simulate-decision-reflection') || '';
    } catch {
      return '';
    }
  });
  const abortRef = useRef<AbortController | null>(null);

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
    const content = `# Decision Simulation

Generated: ${new Date().toISOString()}

${rawText}

---

## Personal Reflection

${reflection || '(No reflection recorded)'}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="border border-border/30 bg-card rounded-sm p-4">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {rawText}
            <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
          </div>
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
        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard section={pathA} defaultOpen />
          <SectionCard section={pathB} defaultOpen />
        </div>
      ) : (
        <>
          {pathA && <SectionCard section={pathA} defaultOpen />}
          {pathB && <SectionCard section={pathB} defaultOpen />}
        </>
      )}

      {otherSections.map((s) => (
        <SectionCard key={s.id} section={s} defaultOpen={false} />
      ))}

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
            className="min-h-[100px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
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
                Download
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
