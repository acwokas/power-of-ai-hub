import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  SimulationProvider,
  SimulationLayout,
  FormField,
  ExampleScenario,
  useSimulation,
} from '@/components/simulation';
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
  AlertTriangle,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { BrandMarkdown, BRAND_MARKDOWN_CSS } from '@/lib/render-markdown';
import { makeBrandPdf, formatDateLong, isoDate } from '@/lib/brand-pdf';

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
  'Paste a message you are planning to send and describe your intended outcome.',
  'Add 2 to 4 audiences who might interpret it differently.',
  'The AI analyses how each audience might read it, surfacing perception risks, assumptions, and ambiguities.',
  'You can then generate per audience rewrites and one overall rewrite that threads the needle.',
];

interface AudienceEntry {
  name: string;
  perspective: string;
}

const ANALYSE_URL = '/api/before-you-send';
const REWRITE_URL = '/api/before-you-send-rewrite';

async function streamSse(
  url: string,
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal?: AbortSignal,
) {
  let resp: Response;
  try {
    resp = await fetch(url, {
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

// Validate audience name. Returns warning text or null.
function validateAudienceName(name: string): string | null {
  const v = (name || '').trim();
  if (v.length === 0) return null;
  if (v.length <= 4) {
    return "That doesn't look like a real audience. Use phrases like 'Direct reports' or 'Senior leadership'.";
  }
  if (!/\s/.test(v) && v.length > 0) {
    // single token, check for keyboard mash patterns
    const lower = v.toLowerCase();
    // looks like a real word if it has vowels and consonants in normal mix
    const vowels = (lower.match(/[aeiouy]/g) || []).length;
    const letters = (lower.match(/[a-z]/g) || []).length;
    // ratio: real words usually 20%-60% vowels
    const ratio = letters > 0 ? vowels / letters : 0;
    if (letters > 0 && (ratio < 0.18 || ratio > 0.75)) {
      return "That doesn't look like a real audience. Use phrases like 'Direct reports' or 'Senior leadership'.";
    }
    // common keyboard-mash motifs
    if (/(jk|kj|gh|fgh|jkl|hjk|asdf|qwer|zxcv|hkj|lkj)/.test(lower) && letters <= 8) {
      return "That doesn't look like a real audience. Use phrases like 'Direct reports' or 'Senior leadership'.";
    }
    if (letters <= 6 && !/^(team|hr|ceo|cfo|cto|coo|legal|sales|ops|pr|exec|board|peers|users)$/.test(lower)) {
      return "That doesn't look like a real audience. Use phrases like 'Direct reports' or 'Senior leadership'.";
    }
  }
  return null;
}

function CopyBtn({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/30',
        className,
      )}
      aria-label={label || 'Copy'}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

// Parse rewrite output (markdown) into structured sections
interface ParsedRewrites {
  perAudience: { name: string; text: string }[];
  overall: string;
  rationale: string[];
}

function parseRewrites(md: string): ParsedRewrites {
  const result: ParsedRewrites = { perAudience: [], overall: '', rationale: [] };
  if (!md) return result;

  const norm = md.replace(/\r\n/g, '\n');
  // section: "## Per audience rewrites"
  const perMatch = norm.match(/##\s+Per audience rewrites([\s\S]*?)(?=##\s+|$)/i);
  if (perMatch) {
    const body = perMatch[1];
    // split on ###
    const subs = body.split(/^###\s+/m).slice(1);
    for (const s of subs) {
      const nl = s.indexOf('\n');
      const name = (nl > -1 ? s.slice(0, nl) : s).trim();
      const text = (nl > -1 ? s.slice(nl + 1) : '').trim();
      if (name) result.perAudience.push({ name, text });
    }
  }
  const overallMatch = norm.match(/##\s+Overall rewrite([\s\S]*?)(?=##\s+|$)/i);
  if (overallMatch) result.overall = overallMatch[1].trim();
  const ratMatch = norm.match(/##\s+What changed and why([\s\S]*?)(?=##\s+|$)/i);
  if (ratMatch) {
    const lines = ratMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
    for (const ln of lines) {
      const m = ln.match(/^[-*]\s+(.+)$/);
      if (m) result.rationale.push(m[1]);
    }
  }
  return result;
}

// Parse the analysis markdown into per-audience blocks
interface AudienceAnalysis {
  name: string;
  primaryRisk?: string;
  likelyInterpretation?: string;
  youMeant?: string;
  theyMightHear?: string;
  assumptions: string[];
  secondary?: string;
  rawBody: string;
}

function parseAnalysis(md: string): AudienceAnalysis[] {
  const out: AudienceAnalysis[] = [];
  if (!md) return out;
  const parts = md.replace(/\r\n/g, '\n').split(/^##\s+/m).filter((p) => p.trim().length > 0);
  for (const p of parts) {
    const nl = p.indexOf('\n');
    const name = (nl > -1 ? p.slice(0, nl) : p).trim();
    const body = nl > -1 ? p.slice(nl + 1).trim() : '';
    const item: AudienceAnalysis = { name, assumptions: [], rawBody: body };

    const sect = (label: string): string | undefined => {
      const re = new RegExp(`\\*\\*${label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\*\\*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
      const m = body.match(re);
      return m ? m[1].trim() : undefined;
    };

    item.primaryRisk = sect('Primary Perception Risk');
    item.likelyInterpretation = sect('Likely Interpretation');
    item.secondary = sect('Secondary Ambiguities');

    if (item.likelyInterpretation) {
      const m = item.likelyInterpretation.match(/you\s+meant\s*:?\s*([\s\S]+?)\s*they\s+might\s+hear\s*:?\s*([\s\S]+)/i);
      if (m) {
        item.youMeant = m[1].replace(/^[*"\s]+|[*"\s]+$/g, '').trim();
        item.theyMightHear = m[2].replace(/^[*"\s]+|[*"\s]+$/g, '').trim();
      }
    }
    const assumptionsBlock = sect('Assumptions They Might Make');
    if (assumptionsBlock) {
      const lines = assumptionsBlock.split('\n').map((l) => l.trim());
      for (const ln of lines) {
        const m = ln.match(/^[-*]\s+(.+)$/);
        if (m) item.assumptions.push(m[1]);
      }
    }
    out.push(item);
  }
  return out;
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
  const [isRevising, setIsRevising] = useState(false);
  const [revisedMessage, setRevisedMessage] = useState('');

  const [rewriteText, setRewriteText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritesRequested, setRewritesRequested] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const rewriteAbortRef = useRef<AbortController | null>(null);

  // Auto-grow handlers for message textarea
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const intentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (messageRef.current) {
      const el = messageRef.current;
      el.style.height = 'auto';
      const target = Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.6));
      el.style.height = target + 'px';
    }
  }, [formData.message]);

  useEffect(() => {
    if (intentRef.current) {
      const el = intentRef.current;
      el.style.height = 'auto';
      const target = Math.min(el.scrollHeight, 280);
      el.style.height = target + 'px';
    }
  }, [formData.intent]);

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

  const audienceWarnings = useMemo(() => audiences.map((a) => validateAudienceName(a.name)), [audiences]);

  const runAnalysis = useCallback(
    (messageText: string) => {
      setRawText('');
      setRewriteText('');
      setRewritesRequested(false);
      setIsStreaming(true);
      setPhase('active');
      setIsRevising(false);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const validAudiences = audiences.filter((a) => a.name.trim());

      streamSse(
        ANALYSE_URL,
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

  const runRewrites = useCallback(() => {
    if (!rawText.trim()) return;
    setRewriteText('');
    setIsRewriting(true);
    setRewritesRequested(true);
    const ctrl = new AbortController();
    rewriteAbortRef.current = ctrl;
    const validAudiences = audiences.filter((a) => a.name.trim());
    streamSse(
      REWRITE_URL,
      {
        message: formData.message || '',
        messageType: formData.messageType,
        intent: formData.intent,
        audiences: validAudiences,
        analysis: rawText,
      },
      (delta) => setRewriteText((prev) => prev + delta),
      () => setIsRewriting(false),
      (err) => {
        setIsRewriting(false);
        toast({ title: 'Rewrite failed', description: err, variant: 'destructive' });
      },
      ctrl.signal,
    );
  }, [audiences, formData, rawText]);

  const handleStartOver = () => {
    abortRef.current?.abort();
    rewriteAbortRef.current?.abort();
    setRawText('');
    setRewriteText('');
    setRewritesRequested(false);
    setIsRevising(false);
    setRevisedMessage('');
    reset();
    setAudiences([
      { name: '', perspective: '' },
      { name: '', perspective: '' },
    ]);
  };

  const rewrites = useMemo(() => parseRewrites(rewriteText), [rewriteText]);
  const analysisItems = useMemo(() => parseAnalysis(rawText), [rawText]);

  const handlePdfDownload = useCallback(async () => {
    try {
      const pdf = await makeBrandPdf();
      const today = new Date();
      const messageTypeLabel =
        messageTypeOptions.find((o) => o.value === formData.messageType)?.label || 'Message';

      // Cover page
      const msg = formData.message || '';
      const lines = msg.split('\n').filter((l) => l.trim().length > 0);
      const excerpt = lines.slice(0, 3).join(' ');
      const ellipsis = lines.length > 3 || excerpt.length > 240 ? '...' : '';
      const excerptText = excerpt.slice(0, 240) + ellipsis;

      pdf.buildCover({
        toolName: 'Before You Send',
        subtitle: 'Analysis',
        meta: messageTypeLabel + ' · Completed ' + formatDateLong(today),
        excerpt: excerptText ? '“' + excerptText + '”' : undefined,
        excerptItalic: true,
      });

      // Page 2: Your message + Your intent
      pdf.buildSectionPage({
        title: 'Your message',
        bodyParagraphs: (formData.message || '').split('\n\n').filter((p) => p.trim().length > 0),
        subSections: [
          {
            label: 'Your intent',
            body: formData.intent || '',
          },
        ],
      });

      // Pages 3 to N: one page per audience
      const validAudiences = audiences.filter((a) => a.name.trim());
      for (let i = 0; i < validAudiences.length; i++) {
        const aud = validAudiences[i];
        const anal = analysisItems.find((a) => a.name.toLowerCase().includes(aud.name.toLowerCase().slice(0, 12))) ||
                     analysisItems[i] ||
                     ({} as AudienceAnalysis);
        pdf.buildSectionPage({
          title: aud.name,
          calloutLabel: 'Primary Perception Risk',
          calloutBody: anal.primaryRisk || 'No analysis produced for this audience.',
          columns: anal.youMeant || anal.theyMightHear ? {
            leftLabel: 'You meant',
            leftBody: anal.youMeant || (anal.likelyInterpretation || '').slice(0, 280),
            rightLabel: 'They might hear',
            rightBody: anal.theyMightHear || '',
          } : undefined,
          subSections: [
            ...(anal.assumptions && anal.assumptions.length > 0
              ? [{ label: 'Assumptions they might make', bullets: anal.assumptions }]
              : []),
            ...(anal.secondary
              ? [{ label: 'Secondary ambiguities', body: anal.secondary }]
              : []),
          ],
        });
      }

      // Rewrites page
      if (rewrites.perAudience.length > 0 || rewrites.overall) {
        pdf.buildSectionPage({
          title: 'Rewrites',
          subSections: [
            ...rewrites.perAudience.map((r) => ({
              label: r.name,
              body: r.text,
            })),
            ...(rewrites.overall
              ? [{ label: 'Overall rewrite', body: rewrites.overall }]
              : []),
            ...(rewrites.rationale.length > 0
              ? [{ label: 'What changed and why', bullets: rewrites.rationale }]
              : []),
          ],
        });
      }

      // Final page: Next steps + CTAs
      pdf.buildSectionPage({
        title: 'Before you hit send',
        calloutLabel: 'Three questions to ask yourself',
        calloutBody:
          '1. If only one audience read this, which one would worry me most, and have I addressed them?\n2. What is the single phrase a sceptical reader could quote back at me, and is it the phrase I want quoted?\n3. What is the next conversation this message should make easier; does it set that up?',
        subSections: [
          {
            label: 'Continue with EDGE',
            body:
              'Before You Send is one of the Evaluate tools in the EDGE Framework. The same approach can pressure test a decision or a governance practice.',
          },
        ],
      });
      // Add CTA page (appended)
      pdf.buildCtaPage('Continue your EDGE work', [
        {
          title: 'AI Governance Maturity Assessment',
          url: 'https://democratising.ai/tools/maturity-assessment',
          blurb: 'Diagnose where your organisation sits on the AI maturity curve in fifteen minutes.',
        },
        {
          title: 'Decision Simulation',
          url: 'https://democratising.ai/tools/decision-simulation',
          blurb: 'Pressure test a decision through three structured lenses before you commit.',
        },
        {
          title: 'The EDGE Framework',
          url: 'https://democratising.ai/edge',
          blurb: 'Evaluate, Define, Govern, Elevate. The framework behind every tool on this site.',
        },
      ], 'Democratising AI for the people who actually run things.');

      const filename = 'before-you-send-' + isoDate(today) + '.pdf';
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed', err);
      toast({
        title: 'PDF generation failed',
        description: 'Sorry, the PDF could not be generated. Please try again.',
        variant: 'destructive',
      });
    }
  }, [formData, audiences, analysisItems, rewrites]);

  if (phase === 'setup') {
    return (
      <div className="space-y-6 bys-form">
        <style>{BRAND_MARKDOWN_CSS}</style>
        <style>{BYS_FORM_CSS}</style>
        <ExampleScenario examples={examples} />

        {currentStep === 0 && (
          <>
            <p className="bys-step-indicator">Step 1 of 2: your message</p>

            <div className="space-y-2">
              <label htmlFor="bys-message" className="text-sm font-medium text-foreground block">
                Message content
                <span className="text-accent ml-0.5">*</span>
              </label>
              <Textarea
                id="bys-message"
                ref={messageRef as any}
                value={formData.message || ''}
                onChange={(e) => setFormValue('message', e.target.value)}
                placeholder="Paste the email, message, or announcement you're planning to send"
                rows={12}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y bys-textarea bys-textarea-grow"
                style={{ minHeight: '18rem', maxHeight: '60vh' }}
              />
            </div>

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

            <div className="space-y-2">
              <label htmlFor="bys-intent" className="text-sm font-medium text-foreground block">
                Your intent
                <span className="text-accent ml-0.5">*</span>
              </label>
              <Textarea
                id="bys-intent"
                ref={intentRef as any}
                value={formData.intent || ''}
                onChange={(e) => setFormValue('intent', e.target.value)}
                placeholder="What are you trying to communicate? What response do you want?"
                rows={4}
                maxLength={500}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y bys-textarea"
                style={{ minHeight: '6.5rem' }}
              />
              <p className="text-xs text-muted-foreground/70 text-right">
                {(formData.intent?.length ?? 0)}/500
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={nextStep} disabled={!canProceedStep1} variant="hero" size="default">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <p className="bys-step-indicator">Step 2 of 2: your audiences</p>
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
                    className="bg-secondary/30 border-border/40 focus-visible:ring-accent bys-input"
                  />
                  {audienceWarnings[i] && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{audienceWarnings[i]}</span>
                    </div>
                  )}
                  <Textarea
                    value={aud.perspective}
                    onChange={(e) => updateAudience(i, 'perspective', e.target.value)}
                    placeholder="e.g., Worried about job security, focused on quarterly targets, sceptical of new initiatives"
                    className="min-h-[72px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y bys-textarea"
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
    <div className="space-y-6 bys-form">
      <style>{BRAND_MARKDOWN_CSS}</style>
      <style>{BYS_FORM_CSS}</style>
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

      {rawText.length > 0 && (
        <div>
          <BrandMarkdown markdown={rawText} audienceCards />
        </div>
      )}

      {isStreaming && rawText.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Analysing...
        </div>
      )}

      {/* Rewrites section */}
      {!isStreaming && rawText.length > 0 && (
        <div className="bys-rewrites-section">
          <div className="flex items-center justify-between mb-3 mt-6">
            <h2 className="text-xl font-serif font-bold" style={{ color: '#14264C' }}>Rewrites</h2>
            {!rewritesRequested && (
              <Button onClick={runRewrites} variant="hero" size="sm">
                Generate rewrites <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>

          {rewritesRequested && !rewrites.overall && isRewriting && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Drafting rewrites...</p>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          )}

          {rewrites.perAudience.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#D89A55' }}>
                Per audience rewrites
              </h3>
              {rewrites.perAudience.map((r, i) => {
                const orig = audiences[i]?.perspective || '';
                return (
                  <Collapsible key={r.name + i} defaultOpen={i === 0}>
                    <div className="border border-border/30 rounded-sm overflow-hidden" style={{ background: '#FAF6EC' }}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-secondary/20 transition-colors group">
                        <h4 className="text-sm font-medium" style={{ color: '#14264C' }}>{r.name}</h4>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                          {orig && (
                            <div>
                              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#D89A55' }}>
                                Their perspective
                              </div>
                              <p className="text-sm text-foreground/80 italic">{orig}</p>
                            </div>
                          )}
                          <div>
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#D89A55' }}>
                              Optimised rewrite
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#14264C' }}>
                              {r.text}
                            </p>
                          </div>
                          <CopyBtn text={r.text} label="Copy rewrite" />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {rewrites.overall && (
            <div className="mt-6 rounded-sm p-5" style={{ background: '#F4ECD8', borderLeft: '8px solid #D89A55' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: '#D89A55' }}>
                Overall rewrite
              </h3>
              <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3" style={{ color: '#14264C', fontSize: '15px' }}>
                {rewrites.overall}
              </p>
              <CopyBtn text={rewrites.overall} label="Copy this" />
              {rewrites.rationale.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(20,38,76,0.15)' }}>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#D89A55' }}>
                    What changed and why
                  </div>
                  <ul className="text-sm space-y-1.5 list-disc pl-5" style={{ color: '#14264C' }}>
                    {rewrites.rationale.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
            className="min-h-[140px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
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

      {!isStreaming && rawText.length > 0 && !isRevising && (
        <div className="space-y-3 pt-6 border-t border-border/20">
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
            <Button variant="hero" size="sm" onClick={handlePdfDownload}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Download branded PDF
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

const BYS_FORM_CSS = `
.bys-form { font-size: 17px; line-height: 1.6; }
.bys-form label, .bys-form .text-sm { line-height: 1.6; }
.bys-form .bys-textarea {
  font-size: 16px;
  line-height: 1.55;
  padding: 14px 14px;
}
.bys-form .bys-textarea-grow { overflow: auto; }
.bys-form .bys-input {
  font-size: 16px;
  line-height: 1.5;
}
.bys-form .bys-step-indicator {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #14264C;
  margin-bottom: 12px;
}
.bys-form [data-state] .bys-step-indicator { margin-top: 0; }
.bys-form details summary { padding: 8px 12px; }

/* tighten the existing how-it-works / privacy notices */
.bys-form > div:first-child > * { padding-top: 0; padding-bottom: 0; }
`;

export default function BeforeYouSend() {
  return (
    <SimulationProvider roomId="before-you-send" totalSteps={2}>
      <SimulationLayout howItWorks={howItWorks} compact>
        <BeforeYouSendContent />
      </SimulationLayout>
    </SimulationProvider>
  );
}
