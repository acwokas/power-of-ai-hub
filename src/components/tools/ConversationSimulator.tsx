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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  MessageCircle,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const examples = [
  {
    id: 'performance',
    title: 'Performance Feedback',
    description: 'Giving feedback to a resistant direct report.',
    values: {
      yourRole: 'Engineering Manager',
      theirRole: 'Senior Developer (direct report)',
      relationship:
        "They've been with the company 3 years, recently struggling with deadlines and code quality. Previously a top performer. Resistant to feedback, tends to deflect.",
      stakes:
        "Team morale is suffering. Other team members are picking up slack. If this continues, you'll lose your best people. But this person has deep domain knowledge that's hard to replace.",
      objective:
        'Get them to acknowledge the performance issues and commit to a concrete improvement plan with weekly check-ins.',
      tone: 'defensive',
    },
  },
  {
    id: 'client',
    title: 'Client Scope Change',
    description: 'Negotiating scope change with a demanding client.',
    values: {
      yourRole: 'Account Director',
      theirRole: 'VP of Marketing (client)',
      relationship:
        '18-month relationship. They have expanded scope 3 times without budget adjustment. Generally friendly but expects everything included. Contract renewal in 2 months.',
      stakes:
        "The project is now 40% over scope but the client doesn't see it that way. Team is burning out. But losing this client would mean losing 30% of revenue.",
      objective:
        'Get the client to agree to a revised scope and pricing structure, or formally agree to descope certain deliverables.',
      tone: 'difficult-professional',
    },
  },
  {
    id: 'cofounder',
    title: 'Co-founder Disagreement',
    description: 'Addressing strategic disagreement about company direction.',
    values: {
      yourRole: 'CEO / Co-founder',
      theirRole: 'CTO / Co-founder',
      relationship:
        'Co-founded the company 4 years ago. Equal equity split. They want to focus on technical excellence and R&D. You believe the company needs to prioritise sales and GTM. Tension has been building for months.',
      stakes:
        "Company direction for the next 2 years. If you can't align, one of you may need to step back. The team is sensing the tension and it's affecting morale.",
      objective:
        'Reach agreement on a balanced roadmap that allocates resources 60/40 toward GTM while preserving core R&D investment, without damaging the relationship.',
      tone: 'emotionally-charged',
    },
  },
];

const fields = {
  step1: [
    {
      id: 'yourRole',
      label: 'Your role',
      type: 'textarea' as const,
      placeholder: 'e.g., Product Manager, Team Lead, Founder',
      maxLength: 200,
      required: true,
    },
    {
      id: 'theirRole',
      label: 'Their role',
      type: 'textarea' as const,
      placeholder: 'e.g., direct report, stakeholder, co-founder, client',
      maxLength: 200,
      required: true,
    },
    {
      id: 'relationship',
      label: 'Relationship context',
      type: 'textarea' as const,
      placeholder:
        "e.g., they've been with the company 3 years, recently struggling with performance, resistant to feedback",
      tooltip: "What's the history and dynamics between you?",
      maxLength: 500,
    },
  ],
  step2: [
    {
      id: 'stakes',
      label: "What's at stake?",
      type: 'textarea' as const,
      placeholder: 'e.g., team morale, project timeline, business relationship, trust',
      tooltip: 'Why does this conversation matter?',
      maxLength: 500,
      required: true,
    },
    {
      id: 'objective',
      label: 'What are you trying to achieve?',
      type: 'textarea' as const,
      placeholder: 'e.g., get them to acknowledge performance issues and commit to improvement plan',
      tooltip: "What's your specific goal for this conversation?",
      maxLength: 500,
      required: true,
    },
    {
      id: 'tone',
      label: 'Conversation tone',
      type: 'select' as const,
      placeholder: 'Select tone...',
      tooltip: 'How might they respond to this conversation?',
      required: true,
      options: [
        { value: 'difficult-professional', label: 'Difficult but professional' },
        { value: 'emotionally-charged', label: 'Emotionally charged' },
        { value: 'passive-aggressive', label: 'Passive-aggressive' },
        { value: 'defensive', label: 'Defensive' },
        { value: 'collaborative-cautious', label: 'Collaborative but cautious' },
      ],
    },
  ],
};

const howItWorks = [
  "You set up a scenario: who you are, who they are, what's at stake, what you're trying to achieve.",
  'The AI plays the other person in character and responds realistically, including resistance and pushback.',
  'This is not a friendly chatbot. Resolution must be earned through sustained clarity, empathy, or firmness.',
  "When you're done, end the conversation to get a structured reflection on what worked and what didn't.",
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SetupData {
  yourRole: string;
  theirRole: string;
  relationship: string;
  stakes: string;
  objective: string;
  tone: string;
}

const API_URL = '/api/conversation-simulator';

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
  const borderColor = section.id.includes('worked')
    ? 'border-l-emerald-500/60'
    : section.id.includes('didn')
      ? 'border-l-orange-500/60'
      : section.id.includes('missed')
        ? 'border-l-amber-500/60'
        : section.id.includes('emotional')
          ? 'border-l-blue-500/60'
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

function ConversationContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [reflectionRaw, setReflectionRaw] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try {
      return localStorage.getItem('simulate-conversation-notes') || '';
    } catch {
      return '';
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const turnCount = messages.filter((m) => m.role === 'user').length;
  const reflectionSections = parseSections(reflectionRaw);

  const canProceedStep1 =
    (formData.yourRole?.trim()?.length ?? 0) > 0 && (formData.theirRole?.trim()?.length ?? 0) > 0;
  const canSubmit =
    canProceedStep1 && !!formData.stakes?.trim() && !!formData.objective?.trim() && !!formData.tone;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (phase === 'active') inputRef.current?.focus();
  }, [phase]);

  const handleStartConversation = useCallback(() => {
    const s: SetupData = {
      yourRole: formData.yourRole || '',
      theirRole: formData.theirRole || '',
      relationship: formData.relationship || '',
      stakes: formData.stakes || '',
      objective: formData.objective || '',
      tone: formData.tone || 'difficult-professional',
    };
    setSetup(s);
    setMessages([]);
    setReflectionRaw('');
    setPhase('active');
  }, [formData, setPhase]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || !setup) return;
    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let assistantContent = '';

    setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

    await streamChat(
      { mode: 'chat', setup, messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })) },
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

  const handleEndReflect = useCallback(() => {
    if (!setup || messages.length === 0) return;
    setPhase('reflection');
    setIsReflecting(true);
    setReflectionRaw('');
    const transcript = messages
      .map((m) => `${m.role === 'user' ? setup.yourRole : setup.theirRole}: ${m.content}`)
      .join('\n\n');
    streamChat(
      { mode: 'reflection', setup, conversationTranscript: transcript },
      (delta) => setReflectionRaw((prev) => prev + delta),
      () => setIsReflecting(false),
      (err) => {
        setIsReflecting(false);
        toast({ title: 'Reflection failed', description: err, variant: 'destructive' });
      },
    );
  }, [setup, messages, setPhase]);

  const handleNotesChange = (v: string) => {
    setPersonalNotes(v);
    try {
      localStorage.setItem('simulate-conversation-notes', v);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!setup) return;
    const transcript = messages
      .map((m) => `[${m.role === 'user' ? setup.yourRole : setup.theirRole}]: ${m.content}`)
      .join('\n\n');
    let content = `# Conversation Simulator\n\nGenerated: ${new Date().toISOString()}\n\n## SCENARIO\n\nYour role: ${setup.yourRole}\nTheir role: ${setup.theirRole}\nRelationship: ${setup.relationship || 'Not specified'}\nStakes: ${setup.stakes}\nObjective: ${setup.objective}\nTone: ${setup.tone}\n\n## TRANSCRIPT\n\n${transcript}`;
    if (reflectionRaw) content += `\n\n---\n\n${reflectionRaw}`;
    if (personalNotes) content += `\n\n---\n\n## PERSONAL NOTES\n\n${personalNotes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-sim-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setMessages([]);
    setSetup(null);
    setReflectionRaw('');
    setPersonalNotes('');
    try {
      localStorage.removeItem('simulate-conversation-notes');
    } catch {
      // ignore
    }
    reset();
  };

  const handleRestart = () => {
    abortRef.current?.abort();
    setMessages([]);
    setReflectionRaw('');
    setIsStreaming(false);
    setPhase('active');
    inputRef.current?.focus();
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <ExampleScenario examples={examples} />

        {currentStep === 0 && (
          <>
            <p className="text-xs text-muted-foreground">Step 1 of 2: the scenario</p>
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
            <p className="text-xs text-muted-foreground">Step 2 of 2: stakes and objective</p>
            {fields.step2.map((f) => (
              <FormField key={f.id} config={f} value={formData[f.id] || ''} onChange={(v) => setFormValue(f.id, v)} />
            ))}
            <PrivacyNotice className="mt-4" />
            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleStartConversation} disabled={!canSubmit} variant="hero">
                Start conversation <ArrowRight className="h-4 w-4 ml-1" />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Turn {turnCount}</span>
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              {showContext ? 'Hide context' : 'Show context'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRestart} className="text-xs text-muted-foreground h-7">
              <RotateCcw className="h-3 w-3 mr-1" /> Restart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndReflect}
              disabled={messages.length === 0}
              className="text-xs h-7"
            >
              End and reflect
            </Button>
          </div>
        </div>

        {showContext && (
          <div className="border border-border/30 bg-secondary/20 rounded-sm p-4 text-xs text-muted-foreground space-y-1.5">
            <p>
              <span className="text-foreground font-medium">You:</span> {setup.yourRole}
            </p>
            <p>
              <span className="text-foreground font-medium">Them:</span> {setup.theirRole}
            </p>
            <p>
              <span className="text-foreground font-medium">Objective:</span> {setup.objective}
            </p>
            <p>
              <span className="text-foreground font-medium">Stakes:</span> {setup.stakes}
            </p>
          </div>
        )}

        <ScrollArea className="h-[400px] border border-border/30 bg-card rounded-sm">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p>Start the conversation. You speak first.</p>
                <p className="text-xs mt-1">Remember: they will not make this easy.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed',
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

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isStreaming}
            variant="hero"
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Press Enter to send. Click "End and reflect" when you are ready for coaching feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isReflecting && reflectionSections.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Analysing conversation...</p>
          <p className="text-xs text-muted-foreground">Reviewing {turnCount} turns</p>
          {[1, 2, 3].map((i) => (
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
        <SectionCard key={s.id} section={s} defaultOpen={i < 2} />
      ))}

      {isReflecting && reflectionSections.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Analysing...
        </div>
      )}

      {!isReflecting && reflectionSections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/20">
          <div>
            <h3 className="text-base font-medium mb-1">Your reflection</h3>
            <p className="text-xs text-muted-foreground">Private. Saved in your browser only, never sent anywhere.</p>
          </div>
          <Textarea
            value={personalNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="What did you learn? What would you do differently?"
            className="min-h-[100px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
        </div>
      )}

      {!isReflecting && reflectionSections.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Try different approach
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> New scenario
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download transcript
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConversationSimulator() {
  return (
    <SimulationProvider roomId="conversation" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks}>
        <ConversationContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
