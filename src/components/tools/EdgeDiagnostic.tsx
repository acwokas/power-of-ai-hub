import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Choice = { value: string; label: string; score?: number };

type Question =
  | {
      id: string;
      section: string;
      dimension?: Dimension;
      type: 'choice';
      text: string;
      choices: Choice[];
      required?: boolean;
    }
  | {
      id: string;
      section: string;
      dimension?: Dimension;
      type: 'likert';
      text: string;
      anchorLow: string;
      anchorHigh: string;
      required?: boolean;
    }
  | {
      id: string;
      section: string;
      dimension?: Dimension;
      type: 'text';
      text: string;
      placeholder?: string;
      maxWords?: number;
      required?: boolean;
    };

type Dimension =
  | 'Decision ownership'
  | 'Risk management'
  | 'Performance oversight'
  | 'Ethical boundaries'
  | 'Accountability structures';

const DIMENSIONS: Dimension[] = [
  'Decision ownership',
  'Risk management',
  'Performance oversight',
  'Ethical boundaries',
  'Accountability structures',
];

const QUESTIONS: Question[] = [
  // Context (5)
  {
    id: 'org_size',
    section: 'Context',
    type: 'choice',
    text: 'Organisation size',
    required: true,
    choices: [
      { value: 'under_50', label: 'Under 50' },
      { value: '50_500', label: '50 to 500' },
      { value: '500_5000', label: '500 to 5,000' },
      { value: '5000_plus', label: '5,000+' },
      { value: 'public_ngo', label: 'Public sector or NGO' },
    ],
  },
  {
    id: 'sector',
    section: 'Context',
    type: 'text',
    text: 'Sector',
    placeholder: 'For example: regional bank, B2B SaaS, healthcare provider',
    maxWords: 5,
    required: true,
  },
  {
    id: 'role',
    section: 'Context',
    type: 'choice',
    text: 'Your role',
    required: true,
    choices: [
      { value: 'founder_ceo', label: 'Founder or CEO' },
      { value: 'c_suite', label: 'C-suite executive' },
      { value: 'board_ned', label: 'Board director or NED' },
      { value: 'senior_leadership', label: 'Senior leadership' },
      { value: 'operating_product', label: 'Operating or product lead' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'current_adoption',
    section: 'Context',
    type: 'choice',
    text: 'Current AI adoption',
    required: true,
    choices: [
      { value: 'experimental', label: 'Experimental only', score: 1 },
      { value: 'some_embedded', label: 'Some embedded use cases', score: 2 },
      { value: 'multiple_production', label: 'Multiple production systems', score: 4 },
      { value: 'core_operations', label: 'Core to operations', score: 5 },
      { value: 'unknown_adoption', label: "Don't know", score: 1 },
    ],
  },
  {
    id: 'biggest_question',
    section: 'Context',
    type: 'text',
    text: 'The single biggest AI question keeping you awake at night',
    placeholder: 'One or two sentences. Be specific.',
    required: true,
  },

  // Decision Ownership (3)
  {
    id: 'ai_strategy_owner',
    section: 'Decision ownership',
    dimension: 'Decision ownership',
    type: 'choice',
    text: 'Who owns AI strategy today in your organisation?',
    required: true,
    choices: [
      { value: 'ceo', label: 'CEO', score: 4 },
      { value: 'cto_cio', label: 'CTO or CIO', score: 4 },
      { value: 'coo', label: 'COO', score: 4 },
      { value: 'innovation_lead', label: 'Innovation lead', score: 3 },
      { value: 'working_group', label: 'A working group or committee', score: 3 },
      { value: 'nobody', label: 'Nobody clearly', score: 1 },
      { value: 'unknown', label: "Don't know", score: 1 },
    ],
  },
  {
    id: 'approval_path',
    section: 'Decision ownership',
    dimension: 'Decision ownership',
    type: 'likert',
    text: 'When an AI-related decision needs sign-off (deploying a new model in a customer-facing flow, for example), how clearly is the approval path defined?',
    anchorLow: 'Ad-hoc',
    anchorHigh: 'Documented, named owners, escalation paths',
    required: true,
  },
  {
    id: 'accountable_party',
    section: 'Decision ownership',
    dimension: 'Decision ownership',
    type: 'text',
    text: 'If an AI system made a decision today that materially harmed a customer, who in your organisation would be accountable?',
    placeholder: 'One sentence.',
    required: true,
  },

  // Risk Management (3)
  {
    id: 'risk_tracking',
    section: 'Risk management',
    dimension: 'Risk management',
    type: 'likert',
    text: 'How are AI-related risks (model drift, data leakage, regulatory exposure) currently identified and tracked?',
    anchorLow: 'Not at all',
    anchorHigh: 'Embedded in the enterprise risk framework',
    required: true,
  },
  {
    id: 'board_reviewed',
    section: 'Risk management',
    dimension: 'Risk management',
    type: 'choice',
    text: 'Has your board or risk committee reviewed your AI exposure in the last 12 months?',
    required: true,
    choices: [
      { value: 'yes', label: 'Yes', score: 5 },
      { value: 'no', label: 'No', score: 1 },
      { value: 'unknown', label: "Don't know", score: 1 },
    ],
  },
  {
    id: 'underprepared_risk',
    section: 'Risk management',
    dimension: 'Risk management',
    type: 'text',
    text: 'Name one AI-specific risk your organisation is currently under-prepared for.',
    placeholder: 'One or two sentences.',
    required: true,
  },

  // Performance Oversight (3)
  {
    id: 'output_review',
    section: 'Performance oversight',
    dimension: 'Performance oversight',
    type: 'likert',
    text: 'How are AI outputs (model predictions, generated content, automated decisions) currently reviewed for quality and accuracy?',
    anchorLow: 'Not reviewed',
    anchorHigh: 'Continuous monitoring with thresholds and escalation',
    required: true,
  },
  {
    id: 'business_outcomes',
    section: 'Performance oversight',
    dimension: 'Performance oversight',
    type: 'text',
    text: 'What measurable business outcomes have you attributed to AI in the last 12 months?',
    placeholder: 'List up to three. Use commas or new lines.',
    required: false,
  },
  {
    id: 'reporting_cadence',
    section: 'Performance oversight',
    dimension: 'Performance oversight',
    type: 'choice',
    text: 'How often is AI performance reported to leadership?',
    required: true,
    choices: [
      { value: 'never', label: 'Never', score: 1 },
      { value: 'ad_hoc', label: 'Ad-hoc', score: 2 },
      { value: 'quarterly', label: 'Quarterly', score: 3 },
      { value: 'monthly', label: 'Monthly', score: 4 },
      { value: 'realtime', label: 'Real-time dashboard', score: 5 },
    ],
  },

  // Ethical Boundaries (3)
  {
    id: 'not_allowed_policy',
    section: 'Ethical boundaries',
    dimension: 'Ethical boundaries',
    type: 'choice',
    text: 'Has your organisation defined what AI is NOT allowed to do?',
    required: true,
    choices: [
      { value: 'documented', label: 'Yes, documented policy', score: 5 },
      { value: 'informal', label: 'Informal understanding', score: 3 },
      { value: 'no', label: 'No', score: 1 },
      { value: 'unknown', label: "Don't know", score: 1 },
    ],
  },
  {
    id: 'ethics_channel',
    section: 'Ethical boundaries',
    dimension: 'Ethical boundaries',
    type: 'likert',
    text: 'How are ethical concerns about AI raised and resolved internally?',
    anchorLow: 'No path',
    anchorHigh: 'Defined channel with named owner and review cadence',
    required: true,
  },
  {
    id: 'ethical_line',
    section: 'Ethical boundaries',
    dimension: 'Ethical boundaries',
    type: 'text',
    text: 'The single ethical line your organisation would not cross with AI is...',
    placeholder: 'One sentence.',
    required: true,
  },

  // Accountability Structures (2)
  {
    id: 'on_failure',
    section: 'Accountability structures',
    dimension: 'Accountability structures',
    type: 'choice',
    text: 'If an AI initiative fails, what happens?',
    required: true,
    choices: [
      { value: 'quiet_shutdown', label: 'Quiet shutdown', score: 1 },
      { value: 'post_mortem', label: 'Documented post-mortem', score: 3 },
      { value: 'exec_review', label: 'Formal review with executive committee', score: 4 },
      { value: 'board_reported', label: 'Reported to board', score: 5 },
      { value: 'unknown', label: "Don't know", score: 1 },
    ],
  },
  {
    id: 'in_job_desc',
    section: 'Accountability structures',
    dimension: 'Accountability structures',
    type: 'choice',
    text: 'Is responsibility for AI outcomes written into anyone’s job description or performance objectives?',
    required: true,
    choices: [
      { value: 'yes', label: 'Yes', score: 5 },
      { value: 'no', label: 'No', score: 1 },
      { value: 'unknown', label: "Don't know", score: 1 },
    ],
  },

  // Close (1)
  {
    id: 'success_signal',
    section: 'Close',
    type: 'text',
    text: 'What would success look like from this diagnostic in one sentence? (Optional)',
    placeholder: 'Optional.',
    required: false,
  },
];

type Answers = Record<string, string | number>;

type LeadCapture = {
  name: string;
  email: string;
  contactEmail: string;
  phone: string;
  consent: boolean;
};

type Phase = 'intro' | 'questions' | 'lead' | 'submitting' | 'done' | 'error';

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export default function EdgeDiagnostic() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [lead, setLead] = useState<LeadCapture>({
    name: '',
    email: '',
    contactEmail: '',
    phone: '',
    consent: false,
  });
  const [errorMsg, setErrorMsg] = useState<string>('');

  const q = QUESTIONS[currentQ];

  const isAnswered = (qid: string): boolean => {
    const v = answers[qid];
    const def = QUESTIONS.find((x) => x.id === qid);
    if (!def?.required) return true;
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  };

  const canAdvance = isAnswered(q.id);

  const allRequiredAnswered = useMemo(
    () => QUESTIONS.every((x) => isAnswered(x.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers],
  );

  function setAnswer(qid: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function submit() {
    if (!lead.email || !lead.consent) {
      setErrorMsg('Email and consent are required.');
      return;
    }
    setErrorMsg('');
    setPhase('submitting');
    void (async () => {
      try {
        const res = await fetch('/api/edge-diagnostic/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, lead }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(detail.slice(0, 300) || `Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { memoUrl?: string; id?: string };
        if (data.memoUrl) {
          window.location.assign(data.memoUrl);
          return;
        }
        if (data.id) {
          window.location.assign(`/tools/edge-diagnostic/memo/${data.id}`);
          return;
        }
        throw new Error('Submission succeeded but no memo URL was returned.');
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        setPhase('error');
      }
    })();
  }

  if (phase === 'intro') {
    return (
      <div className="space-y-6">
        <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Twenty questions, roughly eight minutes. You answer for the organisation you lead or advise. At the end we generate a one-page board-ready memo on your AI governance maturity across the five EDGE dimensions, and email it to you.
          </p>
          <ul className="space-y-2 pl-1">
            {DIMENSIONS.map((d) => (
              <li key={d} className="text-sm text-muted-foreground flex items-start gap-3">
                <span className="text-accent/70 font-medium shrink-0">&middot;</span>
                <span className="text-foreground/80">{d}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2 text-sm text-muted-foreground/70 pt-2 border-t border-border/30">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-accent/60" />
            <span>We use your answers only to generate the memo and to follow up if you ask. Stored on Adrian Watkins' systems. Not shared with third parties.</span>
          </div>
        </div>
        <Button variant="hero" size="default" onClick={() => setPhase('questions')}>
          Start the diagnostic <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  if (phase === 'questions') {
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
    const currentValue = answers[q.id];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentQ + 1} of {QUESTIONS.length}
          </span>
          <span className="text-accent/70">{q.section}</span>
        </div>
        <div className="w-full h-1 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center text-[10px] tracking-wide uppercase font-normal text-muted-foreground border border-border/40 rounded-sm px-2 py-1">
              {q.section}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-medium leading-relaxed text-foreground/95">{q.text}</h2>

          {q.type === 'choice' && (
            <div className="space-y-2">
              {q.choices.map((opt) => {
                const selected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(q.id, opt.value)}
                    className={cn(
                      'w-full text-left p-3.5 text-sm border rounded-sm transition-all',
                      selected
                        ? 'bg-accent/10 border-accent/40 text-foreground'
                        : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'likert' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const selected = currentValue === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setAnswer(q.id, n)}
                      className={cn(
                        'p-3 text-sm border rounded-sm transition-all font-medium',
                        selected
                          ? 'bg-accent/10 border-accent/40 text-foreground'
                          : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground',
                      )}
                      aria-label={`Select ${n}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                <span>1 - {q.anchorLow}</span>
                <span>5 - {q.anchorHigh}</span>
              </div>
            </div>
          )}

          {q.type === 'text' && (
            <div className="space-y-2">
              {q.maxWords && q.maxWords < 8 ? (
                <Input
                  value={(currentValue as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder ?? ''}
                  className="bg-background"
                  maxLength={120}
                />
              ) : (
                <Textarea
                  value={(currentValue as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder ?? ''}
                  className="bg-background min-h-[110px]"
                  rows={4}
                  maxLength={600}
                />
              )}
              {q.maxWords && (
                <p className="text-xs text-muted-foreground/60">
                  {wordCount(((currentValue as string) ?? '').toString())} / {q.maxWords} words
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous
          </Button>
          <div className="flex gap-2">
            {currentQ < QUESTIONS.length - 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQ((p) => p + 1)}
                disabled={!canAdvance}
              >
                Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="hero"
                size="sm"
                onClick={() => setPhase('lead')}
                disabled={!allRequiredAnswered}
              >
                Continue to memo <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'lead') {
    return (
      <div className="space-y-6">
        <div className="p-6 md:p-8 bg-card border border-border/30 space-y-5">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Where should we send your memo?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your one-page EDGE diagnostic memo will be generated and emailed to you. You can also share the memo URL.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground/90">
                Your name
              </label>
              <Input
                id="name"
                value={lead.name}
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
                placeholder="First and last name"
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                Email (required)
              </label>
              <Input
                id="email"
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                placeholder="you@company.com"
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="text-sm font-medium text-foreground/90">
                Best email to reach you if you'd like to discuss (optional)
              </label>
              <Input
                id="contactEmail"
                type="email"
                value={lead.contactEmail}
                onChange={(e) => setLead({ ...lead, contactEmail: e.target.value })}
                placeholder="Leave blank to use the email above"
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-foreground/90">
                Phone for advisory enquiries (optional)
              </label>
              <Input
                id="phone"
                type="tel"
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                placeholder="International format, e.g. +44 20 ..."
                className="bg-background"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={lead.consent}
                onChange={(e) => setLead({ ...lead, consent: e.target.checked })}
                className="mt-1 accent-accent"
              />
              <span>
                I agree that my answers will be used to generate this memo and that Adrian Watkins may follow up if I ask. My data is stored on Adrian Watkins' systems and not shared with third parties.
              </span>
            </label>
          </div>

          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setPhase('questions')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
          </Button>
          <Button variant="hero" size="default" onClick={submit} disabled={!lead.email || !lead.consent}>
            Generate my memo <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="p-8 md:p-12 bg-card border border-border/30 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-base text-foreground/85">Generating your one-page memo...</p>
        <p className="text-xs text-muted-foreground/70">This usually takes 20 to 40 seconds. Please do not close this tab.</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="space-y-4">
        <div className="p-6 md:p-8 bg-card border border-destructive/30 space-y-3">
          <h2 className="text-lg font-medium text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{errorMsg || 'Please try again.'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPhase('lead')}>
          Try again
        </Button>
      </div>
    );
  }

  return null;
}
