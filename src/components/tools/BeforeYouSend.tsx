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
import { Input } from '@/components/ui/input';
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
  Download,
  Plus,
  X,
  Table2,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const examples = [
  {
    id: 'restructure',
    title: 'Team Restructure Announcement',
    description: 'Announcing org changes to mixed audiences.',
    values: {
      message:
        "Hi team,\n\nI wanted to share some upcoming changes to how we are structured. Starting next month, we will be consolidating the product and engineering teams under a single leadership structure. This will help us move faster and reduce coordination overhead.\n\nI know change can feel unsettling, but I believe this puts us in a much stronger position for Q3 and beyond. More details will follow in the coming weeks.\n\nLet me know if you have questions.",
      messageType: 'announcement',
      intent:
        'Communicate the restructure clearly while maintaining confidence and stability. I want people to feel informed, not alarmed.',
      audience_0_name: 'Direct reports whose roles may change',
      audience_0_perspective:
        'Worried about job security, reading every word for signals about their future, likely to share concerns privately with peers.',
      audience_1_name: 'Peer managers in other departments',
      audience_1_perspective:
        'Watching for political implications, wondering how this affects their own team resources and priorities.',
      audience_2_name: 'Senior leadership or board',
      audience_2_perspective:
        'Focused on execution risk and timeline, wanting to see decisiveness and clear rationale.',
    },
  },
  {
    id: 'client-decline',
    title: 'Declining a Client Request',
    description: 'Turning down a scope expansion without damaging the relationship.',
    values: {
      message:
        "Hi Sarah,\n\nThanks for the note. I have given the additional scope some thought and I do not think we can take it on inside the current engagement. The team is already running close to capacity and adding it now would put the existing deliverables at risk.\n\nIf this work is a priority for you, I would happily put together a small follow-on proposal with realistic timings and pricing. Otherwise we can revisit it once the current phase wraps.\n\nLet me know which you would prefer.",
      messageType: 'client',
      intent:
        'Decline the request without sounding rigid. Keep the relationship warm and offer a clear next step that protects the existing work.',
      audience_0_name: 'Sarah (the client requesting the work)',
      audience_0_perspective:
        'Under pressure from her own stakeholders, likely to read any pushback as a signal we are not invested in her success.',
      audience_1_name: 'Sarah forwarded internally to her CFO',
      audience_1_perspective:
        'Sees only the cost framing. Will read the response as a sales upsell rather than a delivery decision.',
    },
  },
];

const messageTypeOptions = [
  { value: 'email-team', label: 'Email to team' },
  { value: 'slack', label: 'Slack or chat message' },
  { value: 'client', label: 'Client communication' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'feedback', label: 'Feedback or performance review' },
  { value: 'request', label: 'Request or ask' },
  { value: 'decline', label: 'Decline or rejection' },
  { value: 'other', label: 'Other' },
];

const howItWorks = [
  "Paste a message you are planning to send and describe your intended outcome.",
  'Add 2 to 4 audiences who might interpret it differently.',
  'The AI analyses how each audience might read it, surfacing perception risks, assumptions, and ambiguities.',
  "It does not rewrite your message. It shows interpretation gaps so you can decide what to change.",
];

interface AudienceEntry {
  name: string;
  perspective: string;
}

const API_URL = '/api/before-you-send';

async function streamAnalysis(
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
    onError('Could not reach the analyser. Check your connection and retry.');
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

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn('text-muted-foreground hover:text-foreground transition-colors p-1', className)}
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
          <div className="px-4 pb-4 border-t border-border/20 pt-3 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {section.content}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function BeforeYouSendContent() {
  const { phase, formData, setFormValue, setPhase, currentStep, nextStep, prevStep, reset } = useSimulation();

  const [audiences, setAudiences] = useState<AudienceEntry[]>(() => {
    const restored: AudienceEntry[] = [];
    for (let i = 0; i < 4; i++) {
      const name = formData[`audience_${i}_name`];
      const perspective = formData[`audience_${i}_perspective`];
      if (name) restored.push({ name, perspective: perspective || '' });
    }
    return restored.length >= 2
      ? restored
      : [
          { name: '', perspective: '' },
          { name: '', perspective: '' },
        ];
  });

  const [rawText, setRawText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [isRevising, setIsRevising] = useState(false);
  const [revisedMessage, setRevisedMessage] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const sections = parseSections(rawText);

  const syncAudiencesFromFormData = () => {
    const synced: AudienceEntry[] = [];
    for (let i = 0; i < 4; i++) {
      const name = formData[`audience_${i}_name`];
      const perspective = formData[`audience_${i}_perspective`];
      if (name) synced.push({ name, perspective: perspective || '' });
    }
    if (synced.length >= 2) setAudiences(synced);
  };

  const lastFormDataRef = useRef(formData);
  if (formData !== lastFormDataRef.current) {
    lastFormDataRef.current = formData;
    syncAudiencesFromFormData();
  }

  const updateAudience = (index: number, field: keyof AudienceEntry, value: string) => {
    setAudiences((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addAudience = () => {
    if (audiences.length < 4) setAudiences((prev) => [...prev, { name: '', perspective: '' }]);
  };

  const removeAudience = (index: number) => {
    if (audiences.length > 2) setAudiences((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedStep1 =
    (formData.message?.trim()?.length ?? 0) >= 50 && (formData.intent?.trim()?.length ?? 0) > 0;
  const canSubmit = audiences.filter((a) => a.name.trim()).length >= 2;

  const runAnalysis = useCallback(
    (messageText: string) => {
      setRawText('');
      setIsStreaming(true);
      setPhase('active');
      setIsRevising(false);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const validAudiences = audiences.filter((a) => a.name.trim());

      streamAnalysis(
        {
          message: messageText,
          messageType: formData.messageType,
          intent: formData.intent,
          audiences: validAudiences,
        },
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
    },
    [audiences, formData, setPhase],
  );

  const handleAnalyse = useCallback(() => {
    runAnalysis(formData.message || '');
  }, [formData.message, runAnalysis]);

  const handleReanalyse = useCallback(() => {
    if (revisedMessage.trim().length < 50) return;
    setFormValue('message', revisedMessage);
    runAnalysis(revisedMessage);
  }, [revisedMessage, runAnalysis, setFormValue]);

  const handleDownload = () => {
    const content = `# Before You Send: Analysis\n\nGenerated: ${new Date().toISOString()}\n\n## YOUR MESSAGE\n\n${formData.message}\n\n## INTENT\n\n${formData.intent}\n\n## ANALYSIS\n\n${rawText}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `before-you-send-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    abortRef.current?.abort();
    setRawText('');
    setIsRevising(false);
    setRevisedMessage('');
    reset();
    setAudiences([
      { name: '', perspective: '' },
      { name: '', perspective: '' },
    ]);
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <ExampleScenario examples={examples} />

        {currentStep === 0 && (
          <>
            <p className="text-xs text-muted-foreground">Step 1 of 2: your message</p>

            <FormField
              config={{
                id: 'message',
                label: 'Message content',
                type: 'textarea',
                placeholder: "Paste the email, message, or announcement you're planning to send",
                required: true,
              }}
              value={formData.message || ''}
              onChange={(v) => setFormValue('message', v)}
            />

            {(formData.message?.length ?? 0) > 0 && (formData.message?.length ?? 0) < 50 && (
              <p className="text-xs text-destructive">
                Minimum 50 characters ({formData.message?.length ?? 0}/50)
              </p>
            )}

            <FormField
              config={{
                id: 'messageType',
                label: 'Message type',
                type: 'select',
                placeholder: 'Select type...',
                options: messageTypeOptions,
              }}
              value={formData.messageType || ''}
              onChange={(v) => setFormValue('messageType', v)}
            />

            <FormField
              config={{
                id: 'intent',
                label: 'Your intent',
                type: 'textarea',
                placeholder: 'What are you trying to communicate? What response do you want?',
                tooltip: 'Your intended message versus how it might be received',
                required: true,
                maxLength: 500,
              }}
              value={formData.intent || ''}
              onChange={(v) => setFormValue('intent', v)}
            />

            <div className="pt-4">
              <Button onClick={nextStep} disabled={!canProceedStep1} variant="hero" size="default">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <p className="text-xs text-muted-foreground">Step 2 of 2: your audiences</p>
            <p className="text-sm text-muted-foreground mb-2">
              Add 2 to 4 audiences who might interpret this differently.
            </p>

            <div className="space-y-4">
              {audiences.map((aud, i) => (
                <div key={i} className="border border-border/30 bg-card rounded-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Audience {i + 1}</span>
                    {audiences.length > 2 && (
                      <button
                        onClick={() => removeAudience(i)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                        aria-label="Remove audience"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={aud.name}
                    onChange={(e) => updateAudience(i, 'name', e.target.value)}
                    placeholder="e.g., Direct reports, Leadership team, Client stakeholders"
                    className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
                  />
                  <Textarea
                    value={aud.perspective}
                    onChange={(e) => updateAudience(i, 'perspective', e.target.value)}
                    placeholder="e.g., Worried about job security, focused on quarterly targets, sceptical of new initiatives"
                    className="min-h-[60px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
                  />
                </div>
              ))}

              {audiences.length < 4 && (
                <button
                  onClick={addAudience}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another audience
                </button>
              )}
            </div>

            <PrivacyNotice className="mt-4" />

            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleAnalyse} disabled={!canSubmit} variant="hero">
                Analyse interpretations <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-accent/20 bg-accent/5 rounded-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-accent">Your message</span>
          <CopyBtn text={formData.message || ''} />
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{formData.message}</p>
      </div>

      {isStreaming && rawText.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Analysing interpretations...</p>
          <p className="text-xs text-muted-foreground/50">
            Considering each audience perspective, usually 30 to 45 seconds.
          </p>
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
          <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {rawText}
            <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}

      {sections.length > 1 && !isStreaming && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}
            className="text-xs text-muted-foreground"
          >
            {viewMode === 'list' ? <Table2 className="h-3.5 w-3.5 mr-1" /> : <List className="h-3.5 w-3.5 mr-1" />}
            {viewMode === 'list' ? 'Compare across audiences' : 'List view'}
          </Button>
        </div>
      )}

      {viewMode === 'list' &&
        sections.map((s, i) => <SectionCard key={s.id} section={s} defaultOpen={i < 4} />)}

      {viewMode === 'table' && sections.length > 0 && (
        <div className="border border-border/30 bg-card rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground w-[140px]">Perception</th>
                {sections.map((s) => (
                  <th key={s.id} className="p-3 text-left text-xs font-medium text-foreground">
                    {s.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Primary Perception Risk',
                'Likely Interpretation',
                'Assumptions They Might Make',
                'Secondary Ambiguities',
              ].map((label) => (
                <tr key={label} className="border-b border-border/10">
                  <td className="p-3 text-xs font-medium text-muted-foreground align-top">{label}</td>
                  {sections.map((s) => {
                    const regex = new RegExp(
                      `\\*\\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`,
                      'i',
                    );
                    const match = s.content.match(regex);
                    const excerpt = match ? match[1].trim().slice(0, 200) : '...';
                    return (
                      <td key={s.id} className="p-3 text-xs text-foreground/80 align-top whitespace-pre-wrap">
                        {excerpt}
                        {excerpt.length >= 200 ? '...' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isStreaming && sections.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Analysing...
        </div>
      )}

      {isRevising && (
        <div className="border border-accent/30 bg-card rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Revise your message</span>
            <button
              onClick={() => setIsRevising(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            value={revisedMessage}
            onChange={(e) => setRevisedMessage(e.target.value)}
            className="min-h-[120px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
          />
          {revisedMessage.trim().length > 0 && revisedMessage.trim().length < 50 && (
            <p className="text-xs text-destructive">
              Minimum 50 characters ({revisedMessage.trim().length}/50)
            </p>
          )}
          <Button
            onClick={handleReanalyse}
            disabled={revisedMessage.trim().length < 50}
            variant="hero"
            size="sm"
          >
            Analyse revised version <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {!isStreaming && sections.length > 0 && !isRevising && (
        <div className="space-y-3 pt-4 border-t border-border/20">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRevisedMessage(formData.message || '');
                setIsRevising(true);
              }}
            >
              Revise message
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download report
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Analyse different message
            </Button>
          </div>
          <div className="flex">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(rawText);
                toast({ title: 'Copied', description: 'Full analysis copied to clipboard.' });
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Copy full analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BeforeYouSend() {
  return (
    <SimulationProvider roomId="before-you-send" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks}>
        <BeforeYouSendContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
