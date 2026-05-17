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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  Sparkles,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const examples = [
  {
    id: 'pricing',
    title: 'New Pricing Model',
    description: 'Increase enterprise tier 40%, add usage-based component.',
    values: {
      idea: 'Increase enterprise tier pricing by 40% and add a usage-based component. Currently flat-rate at £50k/year for unlimited seats. New model: £70k base + £0.10 per API call above 500k/month. Justification: usage has tripled while pricing has not changed in 3 years.',
      audience: 'Board of directors and top-20 enterprise clients. Board wants margin improvement; clients want predictability.',
      dependencies:
        'Customer retention above 85%, competitive landscape staying stable, usage data accuracy, sales team ability to communicate value.',
      constraints:
        'Annual contracts, can only implement at renewal. 3 competitors with flat-rate models. Support costs already at capacity. CFO wants 60-day implementation.',
      intensity: 'adversarial',
    },
  },
  {
    id: 'reorg',
    title: 'Org Restructure',
    description: 'Consolidate 4 regional teams into 2 functional teams.',
    values: {
      idea: 'Consolidate 4 regional teams (APAC, EMEA, Americas, ANZ) into 2 functional teams (Growth and Operations). Regional heads become functional leads. Goal: reduce duplication, improve specialisation, cut management overhead by 30%.',
      audience:
        'CEO, CHRO, and the 4 regional heads who will be directly affected. Board will review at next quarterly.',
      dependencies:
        'Regional heads accepting new roles without attrition. Client relationships surviving the transition. Operational continuity during 6-month transition. Cultural integration across previously separate teams.',
      constraints:
        'Two regional heads have been with the company 10+ years. ANZ team has a critical contract renewal in 4 months. Budget for transition is capped at £500k. No redundancies, must be achieved through redeployment.',
      intensity: 'forensic',
    },
  },
  {
    id: 'pivot',
    title: 'Market Pivot',
    description: 'Shift from SMB self-serve to enterprise sales-led.',
    values: {
      idea: 'Pivot from SMB self-serve model (5,000 accounts, £200 ACV) to enterprise sales-led (targeting 50 accounts, £80k ACV). Keep self-serve running but redirect all R&D investment to enterprise features for next 18 months.',
      audience: 'Investors (Series B board), existing enterprise pilots, engineering leadership.',
      dependencies:
        '3 current enterprise pilots converting to paid. Enterprise product achieving feature parity with competitors in 12 months. Hiring 8 enterprise AEs in 6 months. Self-serve churn staying below 5% monthly despite reduced investment.',
      constraints:
        '18 months runway. Existing SMB revenue is £1M ARR and sustaining operations. Enterprise sales cycle is 6 to 9 months. Team has no enterprise sales experience.',
      intensity: 'adversarial',
    },
  },
  {
    id: 'partnership',
    title: 'Strategic Alliance',
    description: 'Joint venture terms with a larger competitor.',
    values: {
      idea: 'Form a strategic alliance with CompetitorX (10x our size) to co-develop an API integration product. We provide the technology; they provide distribution. Revenue split: 60/40 in their favour for year 1, renegotiable at year 2. They get a 2-year exclusive on the integration.',
      audience: 'Our board, their VP of partnerships, and our engineering team who will execute.',
      dependencies:
        'Their distribution channel actually activating for our product. Technology integration completing in 6 months. Neither party launching a competing product during exclusivity. Revenue share being enough to sustain our team.',
      constraints:
        'We have no leverage if they decide to build rather than partner. 2-year exclusivity limits our ability to partner with others. Our engineering team is 12 people, so capacity for this plus core product is tight. Their legal team has a reputation for aggressive IP terms.',
      intensity: 'measured',
    },
  },
];

const fields = {
  step1: [
    {
      id: 'idea',
      label: 'What are you pressure-testing?',
      type: 'textarea' as const,
      placeholder: 'e.g., new pricing model: increase enterprise tier by 40%, add usage-based component',
      tooltip: 'Describe the idea, plan, or position you want to stress-test.',
      maxLength: 800,
      required: true,
    },
    {
      id: 'audience',
      label: "Who's the intended audience?",
      type: 'textarea' as const,
      placeholder: 'Board, investors, leadership team, customers, regulators...',
      tooltip: 'Who needs to be convinced? Whose pushback matters most?',
      maxLength: 400,
      required: true,
    },
  ],
  step2: [
    {
      id: 'dependencies',
      label: 'What does success depend on?',
      type: 'textarea' as const,
      placeholder: 'Customer retention, competitive response, internal execution, regulatory approval...',
      tooltip: 'What assumptions must hold true? What could break this?',
      maxLength: 500,
    },
    {
      id: 'constraints',
      label: 'Known constraints',
      type: 'textarea' as const,
      placeholder: 'Budget limits, timeline, existing commitments, stakeholder concerns...',
      maxLength: 500,
    },
    {
      id: 'intensity',
      label: 'Challenge intensity',
      type: 'select' as const,
      placeholder: 'Select intensity...',
      tooltip: 'Adversarial is closest to a real board challenge.',
      required: true,
      options: [
        { value: 'measured', label: 'Measured: constructive, diplomatic critique' },
        { value: 'adversarial', label: 'Adversarial: direct challenge, no softening' },
        { value: 'forensic', label: 'Forensic: systematic logic deconstruction' },
      ],
    },
  ],
};

const focusAreaOptions = [
  { id: 'financial', label: 'Financial assumptions' },
  { id: 'market', label: 'Market assumptions' },
  { id: 'execution', label: 'Execution risk' },
  { id: 'stakeholder', label: 'Stakeholder response' },
  { id: 'competitive', label: 'Competitive dynamics' },
  { id: 'regulatory', label: 'Regulatory or legal concerns' },
  { id: 'cultural', label: 'Cultural or organisational fit' },
];

const howItWorks = [
  'You describe an idea, plan, or position you want to stress-test.',
  'The AI generates three perspectives: red team (adversarial challenge), blue team (measured defence), and fault line analysis (structural vulnerabilities).',
  'The intensity level controls how aggressive the challenge is.',
  'This is designed to surface problems while you can still fix them.',
];

const API_URL = '/api/redteam-analysis';

async function streamAPI(
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal?: AbortSignal,
) {
  let resp: Response;
  try {
    resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return;
    onError('Could not reach the analysis service. Check your connection and retry.');
    return;
  }

  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({}))) as { error?: string };
    onError(err.error || `Request failed (status ${resp.status}).`);
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

function parseSections(text: string): ResultSection[] {
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

function getSectionStyle(id: string) {
  if (id.includes('red-team')) return 'border-l-2 border-l-red-500/60';
  if (id.includes('blue-team')) return 'border-l-2 border-l-accent/60';
  if (id.includes('assumption') || id.includes('fault')) return 'border-l-2 border-l-muted-foreground/30';
  return '';
}

function SectionCard({ section, defaultOpen }: { section: ResultSection; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className={cn('border border-border/30 bg-card rounded-sm overflow-hidden', getSectionStyle(section.id))}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-secondary/30 transition-colors group">
          <h3 className="text-sm font-medium">{section.title}</h3>
          <div className="flex items-center gap-2">
            <CopyBtn text={section.content} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border/20 pt-3 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {section.content}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function RedTeamContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();
  const [rawText, setRawText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [synthesisText, setSynthesisText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [mitigationTexts, setMitigationTexts] = useState<Record<string, string>>({});
  const [mitigatingId, setMitigatingId] = useState<string | null>(null);
  const [reflection, setReflection] = useState(() => {
    try {
      return localStorage.getItem('simulate-redteam-reflection') || '';
    } catch {
      return '';
    }
  });
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('simulate-redteam-focus');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const abortRef = useRef<AbortController | null>(null);

  const sections = parseSections(rawText);
  const redSection = sections.find((s) => s.id.includes('red-team'));
  const blueSection = sections.find((s) => s.id.includes('blue-team'));
  const faultSection = sections.find((s) => s.id.includes('assumption') || s.id.includes('fault'));

  const canProceedStep1 =
    (formData.idea?.trim()?.length ?? 0) >= 30 && (formData.audience?.trim()?.length ?? 0) > 0;
  const canSubmit = canProceedStep1 && !!formData.intensity;

  const toggleFocus = (id: string) => {
    setSelectedFocusAreas((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('simulate-redteam-focus', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAnalyze = useCallback(() => {
    setRawText('');
    setSynthesisText('');
    setMitigationTexts({});
    setIsStreaming(true);
    setPhase('active');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    streamAPI(
      { mode: 'analysis', ...formData, focusAreas: selectedFocusAreas },
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
  }, [formData, selectedFocusAreas, setPhase]);

  const handleSynthesis = useCallback(() => {
    setSynthesisText('');
    setIsSynthesizing(true);
    streamAPI(
      { mode: 'synthesis', analysisText: rawText },
      (delta) => setSynthesisText((prev) => prev + delta),
      () => setIsSynthesizing(false),
      (err) => {
        setIsSynthesizing(false);
        toast({ title: 'Synthesis failed', description: err, variant: 'destructive' });
      },
    );
  }, [rawText]);

  const handleMitigation = useCallback(
    (concernId: string, concernText: string) => {
      setMitigatingId(concernId);
      setMitigationTexts((prev) => ({ ...prev, [concernId]: '' }));
      streamAPI(
        { mode: 'mitigation', concern: concernText, ideaContext: formData.idea },
        (delta) => setMitigationTexts((prev) => ({ ...prev, [concernId]: (prev[concernId] || '') + delta })),
        () => setMitigatingId(null),
        (err) => {
          setMitigatingId(null);
          toast({ title: 'Mitigation failed', description: err, variant: 'destructive' });
        },
      );
    },
    [formData.idea],
  );

  const handleReflectionChange = (v: string) => {
    setReflection(v);
    try {
      localStorage.setItem('simulate-redteam-reflection', v);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    let content = `# Red Team Simulation\n\nGenerated: ${new Date().toISOString()}\nIntensity: ${formData.intensity || 'adversarial'}\n\n${rawText}`;
    if (synthesisText) content += `\n\n---\n\n## SYNTHESIS\n\n${synthesisText}`;
    const mitigations = Object.entries(mitigationTexts).filter(([, v]) => v);
    if (mitigations.length > 0) {
      content += `\n\n---\n\n## MITIGATION PLANS\n\n${mitigations.map(([k, v]) => `### ${k}\n\n${v}`).join('\n\n')}`;
    }
    if (reflection) content += `\n\n---\n\n## PERSONAL REFLECTION\n\n${reflection}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redteam-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    let text = rawText;
    if (synthesisText) text += `\n\n---\n\nSYNTHESIS:\n${synthesisText}`;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Full analysis copied to clipboard.' });
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setRawText('');
    setSynthesisText('');
    setMitigationTexts({});
    setReflection('');
    setSelectedFocusAreas([]);
    try {
      localStorage.removeItem('simulate-redteam-reflection');
      localStorage.removeItem('simulate-redteam-focus');
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
            <p className="text-xs text-muted-foreground">Step 1 of 3: the idea</p>
            {fields.step1.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <div className="pt-4">
              <Button onClick={nextStep} disabled={!canProceedStep1} variant="hero" size="default">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <p className="text-xs text-muted-foreground">Step 2 of 3: context and stakes</p>
            {fields.step2.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <PrivacyNotice className="mt-4" />
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={nextStep} disabled={!formData.intensity} variant="hero">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <p className="text-xs text-muted-foreground">Step 3 of 3: focus areas</p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select areas to emphasise (leave blank to analyse everything):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {focusAreaOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`focus-${opt.id}`}
                      checked={selectedFocusAreas.includes(opt.id)}
                      onCheckedChange={() => toggleFocus(opt.id)}
                      className="border-border/60 data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground"
                    />
                    <Label htmlFor={`focus-${opt.id}`} className="text-sm font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleAnalyze} disabled={!canSubmit} variant="hero">
                <Shield className="h-4 w-4 mr-1" /> Pressure test <ArrowRight className="h-4 w-4 ml-1" />
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
          <p className="text-sm text-muted-foreground">Running three-pass analysis...</p>
          <p className="text-xs text-muted-foreground/50">This takes 45 to 90 seconds.</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border/30 bg-card rounded-sm p-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {isStreaming && rawText.length > 0 && sections.length === 0 && (
        <div className="border border-border/30 bg-card rounded-sm p-4">
          <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {rawText}
            <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}

      {redSection && <SectionCard section={redSection} defaultOpen />}
      {blueSection && <SectionCard section={blueSection} defaultOpen />}
      {faultSection && <SectionCard section={faultSection} defaultOpen={false} />}

      {sections
        .filter((s) => s !== redSection && s !== blueSection && s !== faultSection)
        .map((s) => (
          <SectionCard key={s.id} section={s} defaultOpen={false} />
        ))}

      {isStreaming && sections.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Analysing...
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <div className="pt-2">
          {!synthesisText && !isSynthesizing && (
            <Button variant="outline" size="sm" onClick={handleSynthesis}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate synthesis
            </Button>
          )}
          {(isSynthesizing || synthesisText) && (
            <div className="border border-accent/30 bg-accent/5 rounded-sm p-4 mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-accent">Synthesis</h3>
                {synthesisText && <CopyBtn text={synthesisText} />}
              </div>
              <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                {synthesisText}
                {isSynthesizing && (
                  <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isStreaming && redSection && redSection.content && (
        <div className="pt-2 space-y-3">
          <p className="text-xs text-muted-foreground">Generate mitigation strategies for specific red team concerns:</p>
          {redSection.content
            .split('\n')
            .filter((l) => l.trim().startsWith('-'))
            .slice(0, 6)
            .map((concern, i) => {
              const cId = `concern-${i}`;
              const cleanConcern = concern.replace(/^-\s*/, '').trim();
              return (
                <div key={cId} className="border border-border/20 rounded-sm p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-foreground/80">{cleanConcern}</p>
                    {!mitigationTexts[cId] && mitigatingId !== cId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMitigation(cId, cleanConcern)}
                        className="text-xs shrink-0"
                      >
                        Mitigate
                      </Button>
                    )}
                  </div>
                  {(mitigatingId === cId || mitigationTexts[cId]) && (
                    <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed bg-secondary/30 p-2 rounded-sm">
                      {mitigationTexts[cId]}
                      {mitigatingId === cId && (
                        <span className="inline-block w-0.5 h-3 bg-accent animate-pulse ml-0.5 align-text-bottom" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/20">
          <div>
            <h3 className="text-base font-medium mb-1">Which concerns need immediate attention?</h3>
            <p className="text-xs text-muted-foreground">Private. Saved in your browser only.</p>
          </div>
          <Textarea
            value={reflection}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder="What surprised you? Which red team points are valid? What needs to change before presenting? What blue team arguments will you use?"
            className="min-h-[120px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" onClick={() => setPhase('setup')}>
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Adjust inputs and re-run
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Pressure test different idea
            </Button>
            <div className="sm:ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy all
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RedTeamSimulation() {
  return (
    <SimulationProvider roomId="redteam-simulation" totalSteps={3}>
      <SimulationLayout howItWorks={howItWorks}>
        <RedTeamContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
