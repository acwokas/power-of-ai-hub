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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  RotateCcw,
  Download,
  Scale,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const examples = [
  {
    id: 'resume-screening',
    title: 'Resume Screening AI with Bias Concerns',
    description: 'AI screening candidates with potential demographic bias.',
    values: {
      useCase:
        'AI-powered resume screening system that ranks job candidates based on skills, experience, and cultural fit. Initial testing shows the model has higher acceptance rates for candidates from certain universities and backgrounds, potentially disadvantaging qualified candidates from non-traditional paths.',
      tensions: '["bias","transparency","autonomy"]',
      affected:
        'Job candidates from diverse backgrounds, particularly those from non-traditional education paths, career changers, and under-represented minorities. Also affects hiring managers who rely on AI recommendations and HR teams responsible for diversity targets.',
      stakeholders:
        'CEO wants faster hiring and cost reduction. HR Director needs to meet diversity commitments. Legal team worried about discrimination lawsuits. Engineering team confident in model accuracy but aware of training data limitations.',
      competingValues:
        'Hiring speed and cost efficiency versus fair evaluation of all candidates. Model accuracy on historical data versus equitable outcomes for under-represented groups. Competitive advantage in talent acquisition versus transparency about AI use in hiring.',
    },
  },
  {
    id: 'content-moderation',
    title: 'Content Moderation AI versus Free Speech',
    description: 'Balancing safety and expression in automated moderation.',
    values: {
      useCase:
        'AI content moderation system for a social media platform that automatically flags and removes content deemed harmful, including hate speech, misinformation, and violent content. The system processes 10 million plus posts daily. False positive rate is 8 percent, meaning legitimate content is sometimes removed. Appeals process takes 48 to 72 hours.',
      tensions: '["bias","transparency","autonomy","accuracy"]',
      affected:
        'Platform users (500 million plus) whose content may be incorrectly removed, communities targeted by hate speech who need protection, content creators whose livelihoods depend on the platform, advertisers concerned about brand safety.',
      stakeholders:
        'Product team wants a seamless user experience. Trust and Safety team prioritises harm reduction. Legal team worried about liability in both directions. Policy team navigating conflicting regulatory requirements across jurisdictions.',
      competingValues:
        'User safety versus freedom of expression. Speed of moderation versus accuracy. Consistent global standards versus cultural context sensitivity. Automation efficiency versus human nuance in edge cases.',
    },
  },
  {
    id: 'workplace-monitoring',
    title: 'Workplace Productivity Monitoring',
    description: 'AI monitoring employee productivity with privacy concerns.',
    values: {
      useCase:
        'AI system that monitors employee activity (keystrokes, application usage, meeting attendance, communication patterns) to generate productivity scores and identify disengagement. Deployed for remote workers. Managers receive weekly reports with individual scores and trend analysis.',
      tensions: '["privacy","surveillance","autonomy","consent"]',
      affected:
        'Remote employees being monitored, managers receiving productivity data, HR teams using data for performance reviews. Potential impact on employee mental health, trust, and workplace culture.',
      stakeholders:
        'CEO believes monitoring is necessary for remote work accountability. HR Director concerned about employee trust and retention impact. Employee representatives oppose surveillance. IT team has technical capability but ethical reservations.',
      competingValues:
        'Business accountability versus employee privacy. Productivity measurement versus trust-based management. Data-driven decisions versus employee autonomy. Operational efficiency versus workplace culture and morale.',
    },
  },
  {
    id: 'credit-decisions',
    title: 'Automated Credit Decisions',
    description: 'AI making lending decisions with fairness implications.',
    values: {
      useCase:
        'AI system that evaluates loan applications and makes automated credit decisions for amounts up to £25,000. Uses alternative data sources (social media activity, purchase history, employment stability) beyond traditional credit scores. Approval rates are 15 percent higher overall but show disparities across demographic groups.',
      tensions: '["bias","privacy","transparency","consent"]',
      affected:
        'Loan applicants, particularly those from communities historically underserved by traditional banking. Also affects existing customers, bank employees whose roles may change, and communities affected by lending patterns.',
      stakeholders:
        'Board wants to expand market share through better credit decisioning. Risk team focused on default rates and regulatory compliance. Customer advocates want fairer access to credit. Regulators scrutinising algorithmic lending for discrimination.',
      competingValues:
        'Financial inclusion versus risk management. Innovation in credit scoring versus privacy of alternative data. Speed of automated decisions versus thoroughness of human review. Profitability versus equitable access to credit.',
    },
  },
];

const tensionOptions = [
  { id: 'bias', label: 'Bias and fairness: AI might disadvantage certain groups' },
  { id: 'privacy', label: 'Privacy: data use versus individual privacy rights' },
  { id: 'transparency', label: 'Transparency: explainability versus competitive advantage' },
  { id: 'autonomy', label: 'Autonomy: AI decisions versus human agency' },
  { id: 'displacement', label: 'Displacement: efficiency versus job loss' },
  { id: 'accuracy', label: 'Accuracy: speed versus precision' },
  { id: 'consent', label: 'Consent: opt-in versus frictionless experience' },
  { id: 'surveillance', label: 'Surveillance: insights versus monitoring concerns' },
];

const fields = {
  step1Top: [
    {
      id: 'useCase',
      label: 'What is the AI use case?',
      type: 'textarea' as const,
      placeholder:
        'e.g., Using AI to screen job candidates, Automating customer credit decisions, Personalising content recommendations, Monitoring employee productivity',
      maxLength: 600,
      required: true,
    },
  ],
  step1Bottom: [
    {
      id: 'affected',
      label: 'Who is affected?',
      type: 'textarea' as const,
      placeholder:
        'e.g., Job candidates from diverse backgrounds, Customers seeking credit, Users of the platform, Employees being monitored',
      tooltip: 'Who bears the risk or benefit?',
      maxLength: 400,
      required: true,
    },
  ],
  step2: [
    {
      id: 'stakeholders',
      label: 'Key stakeholders and their positions',
      type: 'textarea' as const,
      placeholder:
        'e.g., CEO wants efficiency gains, HR Director needs diversity targets met, Legal team worried about discrimination risk, Engineering team confident in model accuracy',
      tooltip: 'Who has a stake and what do they want?',
      maxLength: 500,
    },
    {
      id: 'competingValues',
      label: 'What competing values are at play?',
      type: 'textarea' as const,
      placeholder:
        'e.g., Business efficiency versus individual fairness, Innovation speed versus thorough vetting, Cost reduction versus employment impact',
      maxLength: 400,
    },
  ],
};

const howItWorks = [
  'You describe an AI use case with ethical tension: what is being built, who is affected, and what values compete.',
  'The simulation presents a realistic scenario with stakeholder perspectives and challenges you through 5 decision points.',
  'After each decision, stakeholders react and ethical frameworks challenge your reasoning.',
  'When complete you can download governance policies: risk checklists, escalation matrices, and experimentation boundaries.',
];

interface SetupData {
  useCase: string;
  tensions: string[];
  affected: string;
  stakeholders: string;
  competingValues: string;
}

interface Decision {
  point: number;
  topic: string;
  choice: string;
  reasoning: string;
}

const API_URL = '/api/ethical-dilemma';

async function streamChat(
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
    onError('Could not reach the simulator. Check your connection and retry.');
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
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
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
  const borderColor = section.id.includes('framework')
    ? 'border-l-emerald-500/60'
    : section.id.includes('consistency')
      ? 'border-l-blue-500/60'
      : section.id.includes('blind')
        ? 'border-l-orange-500/60'
        : section.id.includes('stakeholder')
          ? 'border-l-amber-500/60'
          : section.id.includes('risk')
            ? 'border-l-red-500/60'
            : section.id.includes('escalation')
              ? 'border-l-blue-500/60'
              : section.id.includes('experimentation') || section.id.includes('policy')
                ? 'border-l-accent/60'
                : '';
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div
        className={cn(
          'border border-border/30 bg-card rounded-sm overflow-hidden',
          borderColor && `border-l-2 ${borderColor}`,
        )}
      >
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

const DECISION_TOPICS = ['Deployment Scope', 'Transparency', 'Accountability', 'Safeguards', 'Policy Boundaries'];

function EthicalContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();

  const [selectedTensions, setSelectedTensions] = useState<string[]>([]);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const [scenarioRaw, setScenarioRaw] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [currentDecisionPoint, setCurrentDecisionPoint] = useState(1);
  const [awaitingReasoning, setAwaitingReasoning] = useState(false);
  const [responseRaw, setResponseRaw] = useState('');
  const [simulationComplete, setSimulationComplete] = useState(false);

  const [reflectionRaw, setReflectionRaw] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try {
      return localStorage.getItem('simulate-ethical-notes') || '';
    } catch {
      return '';
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reflectionSections = parseSections(reflectionRaw);

  const canProceedStep1 =
    (formData.useCase?.trim()?.length ?? 0) >= 20 &&
    selectedTensions.length >= 1 &&
    (formData.affected?.trim()?.length ?? 0) > 0;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scenarioRaw, responseRaw, isStreaming]);

  useEffect(() => {
    if (formData.tensions) {
      try {
        const parsed = JSON.parse(formData.tensions);
        if (Array.isArray(parsed)) setSelectedTensions(parsed);
      } catch {
        // ignore
      }
    }
  }, [formData.tensions]);

  const toggleTension = (id: string) => {
    setSelectedTensions((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : prev.length < 3 ? [...prev, id] : prev;
      setFormValue('tensions', JSON.stringify(next));
      return next;
    });
  };

  const handleStart = useCallback(() => {
    const s: SetupData = {
      useCase: formData.useCase || '',
      tensions: selectedTensions,
      affected: formData.affected || '',
      stakeholders: formData.stakeholders || '',
      competingValues: formData.competingValues || '',
    };
    setSetup(s);
    setDecisions([]);
    setScenarioRaw('');
    setResponseRaw('');
    setMessages([]);
    setCurrentDecisionPoint(1);
    setSimulationComplete(false);
    setPhase('active');

    setIsStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let content = '';

    streamChat(
      { mode: 'scenario', setup: s },
      (delta) => {
        content += delta;
        setScenarioRaw(content);
      },
      () => setIsStreaming(false),
      (err) => {
        setIsStreaming(false);
        toast({ title: 'Failed to generate scenario', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, [formData, selectedTensions, setPhase]);

  const handleSelectOption = (option: string) => {
    if (isStreaming || awaitingReasoning) return;
    setSelectedOption(option);
    setAwaitingReasoning(true);
  };

  const handleSubmitDecision = useCallback(() => {
    if (!selectedOption || !reasoning.trim() || !setup) return;
    const decision: Decision = {
      point: currentDecisionPoint,
      topic: DECISION_TOPICS[currentDecisionPoint - 1] || `Decision ${currentDecisionPoint}`,
      choice: selectedOption,
      reasoning: reasoning.trim(),
    };
    setDecisions((prev) => [...prev, decision]);

    const userContent = `Decision: ${selectedOption}\n\nReasoning: ${reasoning.trim()}`;
    const updatedMessages = [...messages, { role: 'user' as const, content: userContent }];
    setMessages(updatedMessages);
    setSelectedOption('');
    setReasoning('');
    setAwaitingReasoning(false);
    setResponseRaw('');
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let content = '';

    streamChat(
      { mode: 'chat', setup, messages: updatedMessages },
      (delta) => {
        content += delta;
        setResponseRaw(content);
        if (content.includes('SIMULATION COMPLETE')) {
          setSimulationComplete(true);
        }
      },
      () => {
        setIsStreaming(false);
        setMessages((prev) => [...prev, { role: 'assistant', content }]);
        setCurrentDecisionPoint((prev) => prev + 1);
      },
      (err) => {
        setIsStreaming(false);
        toast({ title: 'Response failed', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, [selectedOption, reasoning, setup, messages, currentDecisionPoint]);

  const handleEndReflect = useCallback(() => {
    if (!setup || decisions.length === 0) return;
    setPhase('reflection');
    setIsReflecting(true);
    setReflectionRaw('');
    const transcript = decisions
      .map((d) => `Decision ${d.point} (${d.topic}): ${d.choice}\nReasoning: ${d.reasoning}`)
      .join('\n\n---\n\n');
    streamChat(
      { mode: 'reflection', setup, simulationTranscript: transcript },
      (delta) => setReflectionRaw((prev) => prev + delta),
      () => setIsReflecting(false),
      (err) => {
        setIsReflecting(false);
        toast({ title: 'Analysis failed', description: err, variant: 'destructive' });
      },
    );
  }, [setup, decisions, setPhase]);

  const handleNotesChange = (v: string) => {
    setPersonalNotes(v);
    try {
      localStorage.setItem('simulate-ethical-notes', v);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!setup) return;
    const transcript = decisions
      .map((d) => `## Decision ${d.point}: ${d.topic}\nChoice: ${d.choice}\nReasoning: ${d.reasoning}`)
      .join('\n\n');
    let content = `# Ethical Dilemma Simulator\n\nGenerated: ${new Date().toISOString()}\n\n## SCENARIO\n\nUse case: ${setup.useCase}\nTensions: ${setup.tensions.join(', ')}\nAffected: ${setup.affected}\nStakeholders: ${setup.stakeholders}\n\n## DECISIONS\n\n${transcript}`;
    if (reflectionRaw) content += `\n\n---\n\n${reflectionRaw}`;
    if (personalNotes) content += `\n\n---\n\n## PERSONAL NOTES\n\n${personalNotes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethical-dilemma-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setSetup(null);
    setDecisions([]);
    setScenarioRaw('');
    setResponseRaw('');
    setMessages([]);
    setReflectionRaw('');
    setPersonalNotes('');
    setSelectedTensions([]);
    setSimulationComplete(false);
    setCurrentDecisionPoint(1);
    try {
      localStorage.removeItem('simulate-ethical-notes');
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
            <p className="text-xs text-muted-foreground">Step 1 of 2: the ethical tension</p>
            {fields.step1Top.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                What is the ethical tension? <span className="text-accent ml-0.5">*</span>
              </label>
              <p className="text-xs text-muted-foreground">Select 1 to 3. What values are in tension?</p>
              <div className="space-y-2 pt-1">
                {tensionOptions.map((opt) => (
                  <label key={opt.id} className="flex items-start gap-3 text-sm cursor-pointer group">
                    <Checkbox
                      checked={selectedTensions.includes(opt.id)}
                      onCheckedChange={() => toggleTension(opt.id)}
                      disabled={!selectedTensions.includes(opt.id) && selectedTensions.length >= 3}
                      className="mt-0.5"
                    />
                    <span
                      className={cn(
                        'transition-colors leading-relaxed',
                        selectedTensions.includes(opt.id)
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {fields.step1Bottom.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}

            <div className="pt-4">
              <Button onClick={nextStep} disabled={!canProceedStep1} variant="hero">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
        {currentStep === 1 && (
          <>
            <p className="text-xs text-muted-foreground">Step 2 of 2: stakeholder perspectives</p>
            {fields.step2.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <PrivacyNotice className="mt-4" />
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleStart} variant="hero">
                Navigate dilemma <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === 'active' && setup) {
    const latestContent = responseRaw || scenarioRaw;
    const optionRegex = /\*\*([A-E])\.\*\*\s*(.+)/g;
    const options: { letter: string; text: string }[] = [];
    let match;
    while ((match = optionRegex.exec(latestContent)) !== null) {
      options.push({ letter: match[1], text: match[2].trim() });
    }
    const dpMatch = latestContent.match(/## DECISION POINT \d+:\s*(.+)/);
    const currentTopic = dpMatch ? dpMatch[1].trim() : '';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-3 w-3" /> Decision {Math.min(currentDecisionPoint, 5)} of 5
            </span>
            {currentTopic && <span className="text-xs text-accent font-medium">{currentTopic}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs text-muted-foreground h-7"
            >
              {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndReflect}
              disabled={decisions.length === 0}
              className="text-xs h-7"
            >
              End and reflect
            </Button>
          </div>
        </div>

        {decisions.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group w-full">
              <span>Decisions made ({decisions.length})</span>
              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1.5 border border-border/20 bg-secondary/20 rounded-sm p-3">
                {decisions.map((d) => (
                  <div key={d.point} className="flex items-start gap-2 text-xs">
                    <Check className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                    <span>
                      <span className="text-foreground font-medium">{d.topic}:</span>{' '}
                      <span className="text-muted-foreground">{d.choice.slice(0, 80)}...</span>
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {isPaused && (
          <div className="border border-accent/30 bg-accent/5 rounded-sm p-4 space-y-2">
            <p className="text-sm font-medium text-accent">Paused: consider the trade-offs</p>
            <p className="text-xs text-muted-foreground">
              Tensions: {setup.tensions.join(', ')}. Affected: {setup.affected.slice(0, 100)}...
            </p>
          </div>
        )}

        <ScrollArea className="h-[400px] border border-border/30 bg-card rounded-sm">
          <div className="p-5 space-y-4">
            {scenarioRaw && (
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {scenarioRaw.replace(/\*\*[A-E]\.\*\*.+/g, '').replace(/## DECISION POINT.+/g, '').trim()}
              </div>
            )}

            {decisions.map((d, i) => (
              <div key={i} className="space-y-2 pt-3 border-t border-border/20">
                <div className="bg-accent/10 border border-accent/20 rounded-sm p-3">
                  <p className="text-xs text-accent font-medium mb-1">Your decision: {d.topic}</p>
                  <p className="text-sm text-foreground">{d.choice}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.reasoning}</p>
                </div>
              </div>
            ))}

            {responseRaw && (
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed pt-3 border-t border-border/20">
                {responseRaw.replace(/\*\*[A-E]\.\*\*.+/g, '').replace(/## DECISION POINT.+/g, '').trim()}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            )}

            {isStreaming && !responseRaw && !scenarioRaw && (
              <div className="space-y-3 py-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {!isStreaming && !awaitingReasoning && options.length > 0 && !simulationComplete && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Choose your approach:</p>
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.letter}
                  onClick={() => handleSelectOption(`${opt.letter}. ${opt.text}`)}
                  disabled={isPaused}
                  className={cn(
                    'w-full text-left p-3 border rounded-sm text-sm transition-colors',
                    'border-border/30 hover:border-accent/40 hover:bg-accent/5',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <span className="text-accent font-medium mr-2">{opt.letter}.</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {awaitingReasoning && (
          <div className="space-y-3 border border-accent/20 bg-accent/5 rounded-sm p-4">
            <div>
              <p className="text-xs text-accent font-medium mb-1">Selected: {selectedOption}</p>
              <p className="text-xs text-muted-foreground">Explain your reasoning. Why did you choose this?</p>
            </div>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="What is your reasoning? Consider the stakeholders, ethical implications, and trade-offs..."
              className="min-h-[80px] bg-background border-border/40 focus-visible:ring-accent resize-y"
              disabled={isPaused}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedOption('');
                  setAwaitingReasoning(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Change selection
              </button>
              <Button
                onClick={handleSubmitDecision}
                disabled={!reasoning.trim() || isPaused}
                variant="hero"
                size="sm"
              >
                Submit decision <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {simulationComplete && !isStreaming && (
          <div className="border border-accent/30 bg-accent/5 rounded-sm p-4 text-center space-y-3">
            <Scale className="h-8 w-8 mx-auto text-accent" />
            <p className="text-sm font-medium">Simulation complete</p>
            <p className="text-xs text-muted-foreground">
              You navigated {decisions.length} ethical decision points.
            </p>
            <Button onClick={handleEndReflect} variant="hero" size="sm">
              Generate analysis and policies <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isReflecting && reflectionSections.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Analysing ethical framework and generating policies...</p>
          <p className="text-xs text-muted-foreground">Reviewed {decisions.length} decisions</p>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border/30 bg-card rounded-sm p-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {isReflecting && reflectionRaw.length > 0 && reflectionSections.length === 0 && (
        <div className="border border-border/30 bg-card rounded-sm p-4">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {reflectionRaw}
            <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}

      {reflectionSections.map((s, i) => (
        <SectionCard key={s.id} section={s} defaultOpen={i < 3} />
      ))}

      {isReflecting && reflectionSections.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Generating policies...
        </div>
      )}

      {!isReflecting && reflectionSections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/20">
          <div>
            <h3 className="text-base font-medium mb-1">Your notes</h3>
            <p className="text-xs text-muted-foreground">Private. Saved in your browser only.</p>
          </div>
          <Textarea
            value={personalNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="What ethical tensions will you face? How will you prepare?"
            className="min-h-[100px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
        </div>
      )}

      {!isReflecting && reflectionSections.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download all policies
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Navigate a different dilemma
            </Button>
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(reflectionRaw);
              toast({ title: 'Copied', description: 'Full analysis and policies copied.' });
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Copy className="h-3 w-3" /> Copy all
          </button>
        </div>
      )}
    </div>
  );
}

export default function EthicalDilemma() {
  return (
    <SimulationProvider roomId="ethical-dilemma" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks}>
        <EthicalContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
