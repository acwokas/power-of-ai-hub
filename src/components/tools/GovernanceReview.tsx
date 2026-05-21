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
  Send,
  User,
  ShieldCheck,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const examples = [
  {
    id: 'customer-service',
    title: 'Customer Service AI to a risk focused board',
    description: 'Defending an AI chatbot to a risk-conscious board of directors.',
    values: {
      capability:
        'AI-powered customer service chatbot handling tier 1 support queries. Uses a GPT-based model fine-tuned on our knowledge base. Handles refunds up to £50, order tracking, FAQ responses, and escalates complex issues to human agents.',
      businessImpact:
        'Expected to reduce support costs by 40 percent (£2.1m annually), decrease average response time from 4 hours to 30 seconds, and handle 65 percent of incoming queries without human intervention. Current pilot shows 87 percent customer satisfaction versus 82 percent for human agents on the same query types.',
      stage: 'pilot',
      reviewers: '["Board of Directors"]',
      concerns:
        'Data privacy compliance (GDPR), reputational risk if AI gives wrong answers, liability for automated refund decisions, customer trust impact.',
      gaps:
        'No formal decision escalation process for edge cases, performance degradation monitoring not yet automated, no documented rollback procedure.',
    },
  },
  {
    id: 'content-generation',
    title: 'Content generation AI to cost focused investors',
    description: 'Explaining AI content generation to investors focused on ROI.',
    values: {
      capability:
        'AI content generation system for the marketing team. Produces blog posts, social media content, email campaigns, and ad copy. Human editors review all outputs before publication. Trained on brand voice guidelines and past high-performing content.',
      businessImpact:
        'Increase content output 3x (from 20 to 60 pieces a month) without hiring additional writers. Expected to save £180,000 a year in freelance costs. Content engagement metrics in pilot: 15 percent higher click-through rates on AI-assisted content.',
      stage: 'limited',
      reviewers: '["Investors or Shareholders"]',
      concerns:
        'Cost overruns on AI platform licensing, quality consistency across high volume, brand voice dilution, competitor differentiation if everyone uses similar AI tools.',
      gaps:
        'ROI measurement framework still being refined, no A/B testing infrastructure for AI versus human content, content quality rubric not standardised.',
    },
  },
  {
    id: 'hiring-ai',
    title: 'Hiring AI to a compliance committee',
    description: 'Presenting AI-assisted hiring decisions to compliance reviewers.',
    values: {
      capability:
        'AI-assisted candidate screening and ranking system. Analyses CVs, cover letters, and assessment scores to rank candidates. Flags potential matches and provides reasoning. Final decisions remain with human hiring managers; AI provides recommendations only.',
      businessImpact:
        'Reduce time-to-hire by 35 percent (from 45 to 29 days average). Improve candidate quality scores by 25 percent based on 6-month performance reviews of AI-recommended hires versus traditional process. Process 3x more applications per recruiter.',
      stage: 'planning',
      reviewers: '["Regulatory or Compliance Committee"]',
      concerns:
        'Bias and fairness in candidate screening, legal compliance with employment law, transparency requirements, adverse impact on protected groups, GDPR implications of processing personal data.',
      gaps:
        'Bias audit methodology not finalised, no adverse impact analysis completed, unclear how to explain AI reasoning to rejected candidates, data retention policy for candidate data not defined.',
    },
  },
];

const fields = {
  step1: [
    {
      id: 'capability',
      label: 'What AI capability are you implementing?',
      type: 'textarea' as const,
      placeholder:
        'e.g., AI-powered customer service chatbot, Automated content generation for marketing, Predictive analytics for hiring decisions',
      maxLength: 600,
      required: true,
    },
    {
      id: 'businessImpact',
      label: 'What is the business impact?',
      type: 'textarea' as const,
      placeholder:
        'e.g., Expected to reduce support costs by 40 percent, increase content output 3x, improve candidate quality scores by 25 percent',
      tooltip: 'Quantify where possible. They will ask about ROI.',
      maxLength: 500,
      required: true,
    },
    {
      id: 'stage',
      label: 'Current deployment stage',
      type: 'select' as const,
      placeholder: 'Select stage...',
      required: true,
      options: [
        { value: 'planning', label: 'Planning or evaluation' },
        { value: 'pilot', label: 'Pilot or testing' },
        { value: 'limited', label: 'Limited deployment' },
        { value: 'production', label: 'Full production' },
        { value: 'scaling', label: 'Scaling or expansion' },
      ],
    },
  ],
  step2: [
    {
      id: 'concerns',
      label: 'Their likely concerns',
      type: 'textarea' as const,
      placeholder: 'e.g., Data privacy compliance, Cost overruns, Reputational risk, Performance accountability',
      tooltip: 'What keeps them up at night about AI?',
      maxLength: 400,
    },
    {
      id: 'gaps',
      label: 'Your governance gaps',
      type: 'textarea' as const,
      placeholder:
        'e.g., No formal decision escalation process, Performance metrics still being defined, Risk framework not documented',
      tooltip: 'Be honest. This helps target the rehearsal.',
      maxLength: 400,
    },
  ],
};

const reviewerOptions = [
  { id: 'board', label: 'Board of Directors' },
  { id: 'exec', label: 'Executive Leadership Team' },
  { id: 'investors', label: 'Investors or Shareholders' },
  { id: 'compliance', label: 'Regulatory or Compliance Committee' },
  { id: 'auditors', label: 'External Auditors' },
];

const howItWorks = [
  'You describe an AI capability you are implementing or defending: context, business case, and deployment stage.',
  'The AI plays a sceptical board member, investor, or executive asking hard questions about ROI, risk, oversight, and accountability.',
  'Answer 8 to 12 questions covering business case, risk, oversight, performance, and ethics.',
  'After the review, get downloadable governance frameworks customised to the gaps the conversation surfaced.',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SetupData {
  capability: string;
  businessImpact: string;
  stage: string;
  reviewers: string[];
  concerns: string;
  gaps: string;
}

const API_URL = '/api/governance-review';

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
  const borderColor = section.id.includes('summary')
    ? 'border-l-emerald-500/60'
    : section.id.includes('gap')
      ? 'border-l-red-500/60'
      : section.id.includes('ownership')
        ? 'border-l-blue-500/60'
        : section.id.includes('performance') || section.id.includes('accountability')
          ? 'border-l-amber-500/60'
          : section.id.includes('checklist')
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

function GovernanceContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const [reflectionRaw, setReflectionRaw] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try {
      return localStorage.getItem('simulate-governance-notes') || '';
    } catch {
      return '';
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const questionCount = messages.filter((m) => m.role === 'assistant').length;
  const answerCount = messages.filter((m) => m.role === 'user').length;
  const reflectionSections = parseSections(reflectionRaw);

  const canProceedStep1 =
    (formData.capability?.trim()?.length ?? 0) >= 30 &&
    (formData.businessImpact?.trim()?.length ?? 0) > 0 &&
    !!formData.stage;
  const canSubmit = canProceedStep1 && selectedReviewers.length > 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);
  useEffect(() => {
    if (phase === 'active' && !isPaused) inputRef.current?.focus();
  }, [phase, isPaused]);

  useEffect(() => {
    if (formData.reviewers) {
      try {
        const parsed = JSON.parse(formData.reviewers);
        if (Array.isArray(parsed)) setSelectedReviewers(parsed);
      } catch {
        // not JSON, ignore
      }
    }
  }, [formData.reviewers]);

  const toggleReviewer = (label: string) => {
    setSelectedReviewers((prev) => {
      const next = prev.includes(label)
        ? prev.filter((r) => r !== label)
        : prev.length < 2
          ? [...prev, label]
          : prev;
      setFormValue('reviewers', JSON.stringify(next));
      return next;
    });
  };

  const runFirstQuestion = useCallback((s: SetupData) => {
    setIsStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setMessages([{ role: 'assistant', content: '', timestamp: new Date() }]);
    let content = '';
    streamChat(
      {
        mode: 'chat',
        setup: s,
        messages: [
          {
            role: 'user',
            content: `I am here to present our AI implementation: ${s.capability}. I am ready for your questions.`,
          },
        ],
      },
      (delta) => {
        content += delta;
        setMessages([{ role: 'assistant', content, timestamp: new Date() }]);
      },
      () => {
        setIsStreaming(false);
        inputRef.current?.focus();
      },
      (err) => {
        setIsStreaming(false);
        toast({ title: 'Failed to start review', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, []);

  const handleStart = useCallback(() => {
    const s: SetupData = {
      capability: formData.capability || '',
      businessImpact: formData.businessImpact || '',
      stage: formData.stage || 'planning',
      reviewers: selectedReviewers,
      concerns: formData.concerns || '',
      gaps: formData.gaps || '',
    };
    setSetup(s);
    setMessages([]);
    setReflectionRaw('');
    setPhase('active');
    runFirstQuestion(s);
  }, [formData, selectedReviewers, setPhase, runFirstQuestion]);

  const sendAnswer = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || !setup) return;
    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim(), timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputValue('');
    setIsStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
    let assistantContent = '';

    await streamChat(
      { mode: 'chat', setup, messages: updated.map((m) => ({ role: m.role, content: m.content })) },
      (delta) => {
        assistantContent += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantContent };
          return copy;
        });
      },
      () => {
        setIsStreaming(false);
        inputRef.current?.focus();
      },
      (err) => {
        setIsStreaming(false);
        setMessages((prev) => prev.filter((_, i) => i < prev.length - 1));
        toast({ title: 'Response failed', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, [inputValue, isStreaming, setup, messages]);

  const handleEndReview = useCallback(() => {
    if (!setup || messages.length === 0) return;
    setPhase('reflection');
    setIsReflecting(true);
    setReflectionRaw('');
    const transcript = messages
      .map((m) => `${m.role === 'assistant' ? 'Reviewer' : 'You'}: ${m.content}`)
      .join('\n\n');
    streamChat(
      { mode: 'reflection', setup, reviewTranscript: transcript },
      (delta) => setReflectionRaw((prev) => prev + delta),
      () => setIsReflecting(false),
      (err) => {
        setIsReflecting(false);
        toast({ title: 'Analysis failed', description: err, variant: 'destructive' });
      },
    );
  }, [setup, messages, setPhase]);

  const handleNotesChange = (v: string) => {
    setPersonalNotes(v);
    try {
      localStorage.setItem('simulate-governance-notes', v);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!setup) return;
    const transcript = messages
      .map((m) => `[${m.role === 'assistant' ? 'Reviewer' : 'You'}]: ${m.content}`)
      .join('\n\n');
    let content = `# Governance Review Simulator\n\nGenerated: ${new Date().toISOString()}\n\n## SCENARIO\n\nCapability: ${setup.capability}\nBusiness Impact: ${setup.businessImpact}\nStage: ${setup.stage}\nReviewers: ${setup.reviewers.join(', ')}\nConcerns: ${setup.concerns}\nGaps: ${setup.gaps}\n\n## REVIEW TRANSCRIPT\n\n${transcript}`;
    if (reflectionRaw) content += `\n\n---\n\n${reflectionRaw}`;
    if (personalNotes) content += `\n\n---\n\n## PERSONAL NOTES\n\n${personalNotes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-review-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setMessages([]);
    setSetup(null);
    setReflectionRaw('');
    setPersonalNotes('');
    setIsPaused(false);
    setSelectedReviewers([]);
    try {
      localStorage.removeItem('simulate-governance-notes');
    } catch {
      // ignore
    }
    reset();
  };

  const handleRestart = () => {
    if (!setup) return;
    abortRef.current?.abort();
    setMessages([]);
    setReflectionRaw('');
    setIsStreaming(false);
    setIsPaused(false);
    setPhase('active');
    runFirstQuestion(setup);
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <ExampleScenario examples={examples} />
        {currentStep === 0 && (
          <>
            <p className="text-xs text-muted-foreground">Step 1 of 2: the AI capability</p>
            {fields.step1.map((f) => (
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
            <p className="text-xs text-muted-foreground">Step 2 of 2: review context</p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Who is reviewing this? <span className="text-accent ml-0.5">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Select 1 or 2. Shapes the types of question you will face.
              </p>
              <div className="space-y-2 pt-1">
                {reviewerOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-3 text-sm cursor-pointer group">
                    <Checkbox
                      checked={selectedReviewers.includes(opt.label)}
                      onCheckedChange={() => toggleReviewer(opt.label)}
                      disabled={!selectedReviewers.includes(opt.label) && selectedReviewers.length >= 2}
                    />
                    <span
                      className={cn(
                        'transition-colors',
                        selectedReviewers.includes(opt.label)
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

            {fields.step2.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <PrivacyNotice className="mt-4" />
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleStart} disabled={!canSubmit} variant="hero">
                Start governance review <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === 'active' && setup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Question {questionCount}, Answer {answerCount}
            </span>
            <span className="text-xs text-muted-foreground">{setup.reviewers.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs text-muted-foreground h-7"
            >
              {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {isPaused ? 'Resume' : 'Pause review'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndReview}
              disabled={answerCount === 0}
              className="text-xs h-7"
            >
              End review
            </Button>
          </div>
        </div>

        {isPaused && (
          <div className="border border-accent/30 bg-accent/5 rounded-sm p-4 space-y-2">
            <p className="text-sm font-medium text-accent">Review paused</p>
            <p className="text-xs text-muted-foreground">
              Take a moment to gather your thoughts. Re-read the question and prepare your answer.
            </p>
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p>
                <span className="text-foreground font-medium">Capability:</span> {setup.capability.slice(0, 100)}...
              </p>
              <p>
                <span className="text-foreground font-medium">Known gaps:</span> {setup.gaps || 'Not specified'}
              </p>
            </div>
          </div>
        )}

        <ScrollArea className="h-[420px] border border-border/30 bg-card rounded-sm">
          <div className="p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-accent/20 text-foreground border border-accent/30'
                      : 'bg-secondary/50 text-foreground border border-border/30',
                  )}
                >
                  {msg.content}
                  {msg.role === 'assistant' && msg.content === '' && isStreaming && (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
                    </span>
                  )}
                  {msg.role === 'assistant' && msg.content && isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-accent" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAnswer();
              }
            }}
            placeholder={isPaused ? 'Review paused. Click Resume to continue' : 'Type your answer...'}
            disabled={isStreaming || isPaused}
            className="min-h-[80px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press Enter to submit. 50 to 500 characters recommended.
            </p>
            <Button
              onClick={sendAnswer}
              disabled={!inputValue.trim() || isStreaming || isPaused}
              variant="hero"
              size="sm"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Submit answer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isReflecting && reflectionSections.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Generating governance analysis and frameworks...</p>
          <p className="text-xs text-muted-foreground">
            Reviewed {answerCount} answers across {questionCount} questions
          </p>
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
          Generating frameworks...
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
            placeholder="What surprised you? What will you formalise first?"
            className="min-h-[100px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
        </div>
      )}

      {!isReflecting && reflectionSections.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download all frameworks
            </Button>
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Review same capability
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> New capability
            </Button>
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(reflectionRaw);
              toast({ title: 'Copied', description: 'Full analysis and frameworks copied.' });
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

export default function GovernanceReview() {
  return (
    <SimulationProvider roomId="governance-review" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks}>
        <GovernanceContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
