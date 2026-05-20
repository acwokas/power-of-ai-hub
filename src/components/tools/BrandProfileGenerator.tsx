import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { PrivacyNotice } from '@/components/simulation/PrivacyNotice';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  Check,
  Download,
  FileJson,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'define-brand-profile-data';
const PROFILE_STORAGE_KEY = 'define-brand-profile-latest';
const API_URL = '/api/brand-profile-generator';
const TOTAL_STEPS = 8;

const stepLabels = [
  'Your product',
  'Your audience',
  'Your markets',
  'The problem',
  'Differentiators',
  'Competitors',
  'Your tone',
  'Platforms',
];

const companySizeOptions = [
  { value: 'startup', label: 'Startups (1 to 20 people)' },
  { value: 'small', label: 'Small teams (21 to 100 people)' },
  { value: 'mid', label: 'Mid-market (101 to 1,000 people)' },
  { value: 'enterprise', label: 'Enterprise (1,000 plus people)' },
  { value: 'not-specific', label: 'Not company-specific' },
];

const toneOptions = [
  'Professional',
  'Approachable',
  'Direct',
  'Technical',
  'Conversational',
  'Authoritative',
  'Witty or humorous',
  'Educational',
];

const platformOptions = ['LinkedIn', 'X (Twitter)', 'Reddit', 'Product Hunt', 'Company blog', 'Newsletter', 'Other'];

const exampleData: Record<string, string> = {
  productName: 'Acme Analytics',
  productDescription:
    'Real-time customer behaviour analytics for B2B SaaS companies. Combines product usage data with revenue signals to help teams identify expansion opportunities and reduce churn.',
  audienceRole: 'VP Marketing, Head of Product',
  companySize: 'mid',
  audienceCares:
    'Revenue growth, reducing churn, proving ROI to leadership, understanding which features drive retention',
  primaryMarkets: 'North America, UK, Western Europe',
  marketNotes: 'GDPR compliance required for EU markets. English-language focus initially.',
  coreProblem:
    'Marketing teams waste 15 plus hours per week manually tracking campaign performance across 6 different tools, leading to delayed decisions and missed optimisation windows that cost 20 to 30 percent of ad spend.',
  differentiators:
    'Only platform that combines behavioural analytics with AI-powered recommendations. Real-time processing versus batch. Built specifically for B2B SaaS, not retrofitted from consumer analytics.',
  directCompetitors: 'Mixpanel, Amplitude, Google Analytics',
  indirectAlternatives: 'Manual spreadsheet tracking, hiring a data analyst, Looker dashboards built in-house',
  tones: 'Professional,Direct,Authoritative',
  toneNotes: 'Professional but not corporate. Confident without being arrogant. Data-informed language.',
  platforms: 'LinkedIn,Company blog,Newsletter',
};

const loadingPhases = [
  'Analysing your inputs...',
  'Generating positioning summary...',
  'Creating audience personas...',
  'Defining brand voice...',
  'Identifying content pillars...',
];

function loadData(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveData(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

type Phase = 'wizard' | 'review' | 'loading' | 'results';

interface ProfileSection {
  key: string;
  title: string;
  content: string;
}

const SECTION_MAP: Record<string, string> = {
  'POSITIONING SUMMARY': 'positioning',
  'AUDIENCE PERSONAS': 'personas',
  'BRAND VOICE GUIDE': 'voice',
  'CONTENT PILLARS': 'pillars',
};

function parseProfile(text: string): ProfileSection[] {
  const sections: ProfileSection[] = [];
  const regex = /## (POSITIONING SUMMARY|AUDIENCE PERSONAS|BRAND VOICE GUIDE|CONTENT PILLARS)\s*\n/gi;
  const matches = [...text.matchAll(regex)];

  matches.forEach((match, i) => {
    const title = match[1].toUpperCase();
    const startIdx = match.index! + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const content = text.slice(startIdx, endIdx).trim();
    const key = SECTION_MAP[title] || title.toLowerCase().replace(/\s+/g, '-');
    sections.push({ key, title, content });
  });

  return sections;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('- **') || trimmed.startsWith('* **')) {
          const text = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-2 items-start py-0.5">
              <span className="h-1 w-1 rounded-full bg-accent mt-2 shrink-0" />
              <span
                dangerouslySetInnerHTML={{
                  __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                }}
              />
            </div>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 items-start py-0.5">
              <span className="h-1 w-1 rounded-full bg-accent mt-2 shrink-0" />
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }
        const html = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
      })}
    </>
  );
}

function copyToClipboard(text: string, label?: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast({ title: label ? `${label} copied` : 'Copied' }))
    .catch(() => toast({ title: 'Copy failed', variant: 'destructive' }));
}

function SectionCard({
  section,
  accentClass,
  onRegenerate,
  isRegenerating,
}: {
  section: ProfileSection;
  accentClass: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(section.content, section.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('border rounded-sm overflow-hidden', accentClass)}>
        <div className="p-5 flex items-center justify-between gap-2">
          <CollapsibleTrigger className="flex items-center gap-2 text-left flex-1 group min-w-0">
            <ChevronDown
              className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')}
            />
            <h3 className="text-base font-semibold truncate">{section.title}</h3>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy section">
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Regenerate section"
            >
              {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
            <MarkdownContent content={section.content} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function BrandProfileGenerator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(() => loadData());
  const [isRefining, setIsRefining] = useState(false);
  const [phase, setPhase] = useState<Phase>('wizard');
  const [profileText, setProfileText] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile && parsed.generatedAt) {
          setProfileText(parsed.profile);
          setGeneratedAt(parsed.generatedAt);
          if (parsed.formData) setFormData(parsed.formData);
          setPhase('results');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (Object.keys(formData).length > 0) saveData(formData);
  }, [formData]);

  const setValue = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getVal = (key: string) => formData[key] || '';
  const getList = (key: string) => (getVal(key) ? getVal(key).split(',').filter(Boolean) : []);
  const toggleItem = (key: string, val: string) => {
    const list = getList(key);
    const updated = list.includes(val) ? list.filter((v) => v !== val) : [...list, val];
    setValue(key, updated.join(','));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return getVal('productName').length >= 2 && getVal('productDescription').length >= 30;
      case 1:
        return (
          getVal('audienceRole').length >= 2 &&
          !!getVal('companySize') &&
          getVal('audienceCares').length >= 10
        );
      case 2:
        return getVal('primaryMarkets').length >= 3;
      case 3:
        return getVal('coreProblem').length >= 40;
      case 4:
        return getVal('differentiators').length >= 10;
      case 5:
        return true;
      case 6:
        return getList('tones').length >= 2;
      case 7:
        return getList('platforms').length >= 1;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS - 1) {
      setPhase('review');
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = () => {
    if (phase === 'review') {
      setPhase('wizard');
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleGoToStep = (step: number) => {
    if (step <= currentStep || phase === 'review') {
      setPhase('wizard');
      setCurrentStep(step);
    }
  };

  const fillExample = () => {
    setFormData((prev) => ({ ...prev, ...exampleData }));
    toast({ title: 'Example data loaded' });
  };

  const handleSaveDraft = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-profile-draft.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefine = async (type: 'problem' | 'differentiators', fieldKey: string) => {
    const text = getVal(fieldKey);
    if (!text || text.length < 10) {
      toast({ title: 'Add more text before refining', variant: 'destructive' });
      return;
    }
    setIsRefining(true);
    const original = text;
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'refine', type, text }),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Refinement failed.');
      }
      const data = (await resp.json()) as { refined?: string };
      if (data.refined) {
        setValue(fieldKey, data.refined);
        toast({ title: 'Refined. The original is preserved if you reload the draft.' });
      } else {
        toast({ title: 'No refinement returned' });
        setValue(fieldKey, original);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refinement failed';
      toast({ title: 'Refinement failed', description: message, variant: 'destructive' });
    } finally {
      setIsRefining(false);
    }
  };

  const streamGenerate = async (regenerateSection?: string) => {
    const isRegen = !!regenerateSection;
    if (isRegen) {
      setIsRegenerating(true);
      setRegeneratingKey(regenerateSection || null);
    } else {
      setPhase('loading');
      setLoadingPhase(0);
      setLoadingProgress(0);
      setProfileText('');
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let phaseInterval: ReturnType<typeof setInterval> | null = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (!isRegen) {
      phaseInterval = setInterval(() => {
        setLoadingPhase((prev) => Math.min(prev + 1, loadingPhases.length - 1));
      }, 8000);
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => Math.min(prev + 1, 95));
      }, 600);
    }

    let accumulated = '';

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate', formData, regenerateSection }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error('No response stream.');

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
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              if (!isRegen) setProfileText(accumulated);
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }

      const now = new Date().toISOString();

      if (isRegen && regenerateSection) {
        const sectionHeader = `## ${regenerateSection}`;
        const existing = profileText;
        const sectionStart = existing.indexOf(sectionHeader);
        let newText: string;
        if (sectionStart !== -1) {
          const nextSection = existing.indexOf('\n## ', sectionStart + sectionHeader.length);
          const before = existing.slice(0, sectionStart);
          const after = nextSection !== -1 ? existing.slice(nextSection) : '';
          newText = (before + accumulated.trim() + '\n\n' + after).trim();
        } else {
          newText = accumulated;
        }
        setProfileText(newText);
        try {
          localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify({ formData, profile: newText, generatedAt: now }),
          );
        } catch {
          // ignore
        }
      } else {
        setProfileText(accumulated);
        setGeneratedAt(now);
        try {
          localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify({ formData, profile: accumulated, generatedAt: now }),
          );
        } catch {
          // ignore
        }
      }

      setPhase('results');
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Generation failed', description: message, variant: 'destructive' });
      if (!isRegen) setPhase('review');
    } finally {
      if (phaseInterval) clearInterval(phaseInterval);
      if (progressInterval) clearInterval(progressInterval);
      setIsRegenerating(false);
      setRegeneratingKey(null);
      setLoadingProgress(100);
    }
  };

  const handleStartOver = () => {
    if (!window.confirm('This will clear your profile and all inputs. Are you sure?')) return;
    setPhase('wizard');
    setCurrentStep(0);
    setFormData({});
    setProfileText('');
    setGeneratedAt('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSaveJson = () => {
    const sections = parseProfile(profileText);
    const payload = {
      formData,
      profile: profileText,
      generatedAt,
      sections: sections.map((s) => ({ key: s.key, title: s.title, content: s.content })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(formData.productName || 'brand').toLowerCase().replace(/\s+/g, '-')}-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const productName = formData.productName || 'Brand';
    const body = `# ${productName} brand profile\n\nGenerated ${
      generatedAt ? new Date(generatedAt).toISOString() : new Date().toISOString()
    }\n\n${profileText}`;
    const blob = new Blob([body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-profile.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviewSections = [
    {
      step: 0,
      label: 'Your product',
      items: [
        { key: 'productName', label: 'Product' },
        { key: 'productDescription', label: 'Description' },
      ],
    },
    {
      step: 1,
      label: 'Your audience',
      items: [
        { key: 'audienceRole', label: 'Role or title' },
        {
          key: 'companySize',
          label: 'Company size',
          transform: (v: string) => companySizeOptions.find((o) => o.value === v)?.label || v,
        },
        { key: 'audienceCares', label: 'Priorities' },
      ],
    },
    {
      step: 2,
      label: 'Your markets',
      items: [
        { key: 'primaryMarkets', label: 'Markets' },
        { key: 'marketNotes', label: 'Considerations' },
      ],
    },
    { step: 3, label: 'The problem', items: [{ key: 'coreProblem', label: 'Core problem' }] },
    { step: 4, label: 'Differentiators', items: [{ key: 'differentiators', label: 'Key differentiators' }] },
    {
      step: 5,
      label: 'Competitors',
      items: [
        { key: 'directCompetitors', label: 'Direct' },
        { key: 'indirectAlternatives', label: 'Indirect' },
      ],
    },
    {
      step: 6,
      label: 'Your tone',
      items: [
        { key: 'tones', label: 'Tone', transform: (v: string) => v.split(',').join(', ') },
        { key: 'toneNotes', label: 'Notes' },
      ],
    },
    {
      step: 7,
      label: 'Platforms',
      items: [{ key: 'platforms', label: 'Platforms', transform: (v: string) => v.split(',').join(', ') }],
    },
  ];

  if (phase === 'loading') {
    return (
      <div className="py-12 space-y-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-medium">{loadingPhases[loadingPhase]}</p>
          <p className="text-xs text-muted-foreground">This typically takes 45 to 60 seconds.</p>
        </div>
        <div className="max-w-xs mx-auto space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-secondary/40 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/50">{loadingProgress}%</p>
        </div>
        {profileText && (
          <div className="text-left max-w-[700px] mx-auto mt-8 p-5 bg-card border border-border/30 rounded-sm">
            <p className="text-xs text-accent font-medium mb-2">Preview</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">{profileText}</p>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'results') {
    const sections = parseProfile(profileText);
    const accentClasses: Record<string, string> = {
      positioning: 'border-accent/30 bg-accent/5',
      personas: 'border-border/30 bg-card',
      voice: 'border-border/30 bg-card',
      pillars: 'border-accent/20 bg-card',
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {formData.productName || 'Brand'} brand profile
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-GB') : ''}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              accentClass={accentClasses[section.key] || 'border-border/30 bg-card'}
              onRegenerate={() => streamGenerate(section.title)}
              isRegenerating={isRegenerating && regeneratingKey === section.title}
            />
          ))}
        </div>

        <div className="border border-accent/20 bg-accent/5 rounded-sm p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Brand profile saved. What's next?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="hero" asChild>
              <a href="/tools/content-sprint-generator">
                Generate a content sprint <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/tools/prompt-engineer">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Optimise with Prompt Engineer
              </a>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/20 pt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(profileText, 'Full profile')}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy all sections
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveJson}>
              <FileJson className="h-3.5 w-3.5 mr-1.5" /> Save as JSON
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => streamGenerate()}
              disabled={isRegenerating}
              className="text-muted-foreground"
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Regenerate entire profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleStartOver} className="text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Review your inputs</h2>
          <p className="text-sm text-muted-foreground">Check everything looks right before generating.</p>
        </div>
        <div className="space-y-4">
          {reviewSections.map((section) => {
            const hasContent = section.items.some((item) => getVal(item.key));
            if (!hasContent) return null;
            return (
              <div key={section.label} className="p-5 bg-card border border-border/30 space-y-3 rounded-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-accent font-medium">{section.label}</p>
                  <button
                    onClick={() => handleGoToStep(section.step)}
                    className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
                {section.items.map((item) => {
                  const val = getVal(item.key);
                  if (!val) return null;
                  const display = (item as { transform?: (v: string) => string }).transform
                    ? (item as { transform: (v: string) => string }).transform(val)
                    : val;
                  return (
                    <div key={item.key}>
                      <p className="text-xs text-muted-foreground/60">{item.label}</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">{display}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 p-3 border border-accent/20 bg-accent/5 rounded-sm text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
          Your inputs are sent to AI for analysis but not stored. The generated profile stays in your browser.
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
          </Button>
          <Button variant="hero" onClick={() => streamGenerate()}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Generate brand profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <span>How it works</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground list-none">
            {[
              'Complete each step with as much detail as you can.',
              'Your progress saves automatically to your browser.',
              'AI refinement is available on the problem and differentiators steps.',
              'On the final review you can tweak any answer before generating.',
            ].map((s, i) => (
              <li key={i} className="flex gap-3 pl-0">
                <span className="text-accent font-medium shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>

      <PrivacyNotice />

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {currentStep + 1} of {TOTAL_STEPS}: {stepLabels[currentStep]}
          </span>
          <span>{Math.round(((currentStep + 1) / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-1 w-full bg-secondary/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {stepLabels.map((label, i) => (
            <button
              key={label}
              onClick={() => handleGoToStep(i)}
              disabled={i > currentStep}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-sm border transition-colors',
                i === currentStep
                  ? 'border-accent text-accent bg-accent/10'
                  : i < currentStep
                    ? 'border-border/40 text-muted-foreground hover:text-foreground'
                    : 'border-border/20 text-muted-foreground/40 cursor-not-allowed',
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border/30 bg-card rounded-sm p-6 space-y-5">
        {currentStep === 0 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 1</p>
              <h2 className="text-lg font-semibold">Tell us about your product</h2>
              <p className="text-sm text-muted-foreground">What are you building? Keep it simple and focused.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="productName">
                Product name
              </label>
              <Input
                id="productName"
                placeholder="e.g., Acme Analytics"
                value={getVal('productName')}
                onChange={(e) => setValue('productName', e.target.value)}
                maxLength={50}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
              />
              <p className="text-[10px] text-muted-foreground/60 text-right">
                {getVal('productName').length}/50
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="productDescription">
                What does it do?
              </label>
              <Textarea
                id="productDescription"
                placeholder="e.g., Real-time customer behaviour analytics for B2B SaaS companies"
                value={getVal('productDescription')}
                onChange={(e) => setValue('productDescription', e.target.value)}
                maxLength={500}
                rows={4}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
              <p className="text-xs text-muted-foreground/60">
                One clear sentence. What problem does it solve? Minimum 30 characters (
                {getVal('productDescription').length}/500).
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={fillExample} className="text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 mr-1" /> Load B2B SaaS example
            </Button>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 2</p>
              <h2 className="text-lg font-semibold">Who are you trying to reach?</h2>
              <p className="text-sm text-muted-foreground">
                Who makes the decision to buy or use what you are building?
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="audienceRole">
                Primary role or title
              </label>
              <Input
                id="audienceRole"
                placeholder="e.g., VP Marketing, Product Manager, Founder"
                value={getVal('audienceRole')}
                onChange={(e) => setValue('audienceRole', e.target.value)}
                maxLength={100}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company size</label>
              <Select value={getVal('companySize')} onValueChange={(v) => setValue('companySize', v)}>
                <SelectTrigger className="bg-secondary/30 border-border/40 focus:ring-accent">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="audienceCares">
                What do they care about?
              </label>
              <Textarea
                id="audienceCares"
                placeholder="e.g., Revenue growth, reducing churn, proving ROI to leadership"
                value={getVal('audienceCares')}
                onChange={(e) => setValue('audienceCares', e.target.value)}
                maxLength={500}
                rows={3}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
              <p className="text-xs text-muted-foreground/60">
                Their priorities, pressures, what keeps them up at night.
              </p>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 3</p>
              <h2 className="text-lg font-semibold">Where do you operate?</h2>
              <p className="text-sm text-muted-foreground">Geography and market context matter for positioning.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="primaryMarkets">
                Primary markets
              </label>
              <Textarea
                id="primaryMarkets"
                placeholder="e.g., North America, Southeast Asia, UK"
                value={getVal('primaryMarkets')}
                onChange={(e) => setValue('primaryMarkets', e.target.value)}
                maxLength={300}
                rows={2}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
              <p className="text-xs text-muted-foreground/60">Where most of your customers are or will be.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="marketNotes">
                Any market-specific considerations? (optional)
              </label>
              <Textarea
                id="marketNotes"
                placeholder="e.g., Regulatory requirements in the EU, language localisation needs"
                value={getVal('marketNotes')}
                onChange={(e) => setValue('marketNotes', e.target.value)}
                maxLength={400}
                rows={2}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 4</p>
              <h2 className="text-lg font-semibold">What problem are you solving?</h2>
              <p className="text-sm text-muted-foreground">The clearer the problem, the clearer your positioning.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="coreProblem">
                Core problem
              </label>
              <Textarea
                id="coreProblem"
                placeholder="e.g., Marketing teams waste 15 plus hours per week manually tracking campaign performance across 6 different tools"
                value={getVal('coreProblem')}
                onChange={(e) => setValue('coreProblem', e.target.value)}
                maxLength={600}
                rows={4}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
              <p className="text-xs text-muted-foreground/60">
                Be specific. Quantify if possible. What pain are you removing? Minimum 40 characters (
                {getVal('coreProblem').length}/600).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isRefining || getVal('coreProblem').length < 10}
              onClick={() => handleRefine('problem', 'coreProblem')}
              className="text-xs"
            >
              {isRefining ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}{' '}
              Refine my problem statement
            </Button>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 5</p>
              <h2 className="text-lg font-semibold">What makes you different?</h2>
              <p className="text-sm text-muted-foreground">Why should someone choose you over alternatives?</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="differentiators">
                Key differentiators
              </label>
              <Textarea
                id="differentiators"
                placeholder="e.g., Only platform that combines behavioural analytics with AI-powered recommendations."
                value={getVal('differentiators')}
                onChange={(e) => setValue('differentiators', e.target.value)}
                maxLength={600}
                rows={4}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
              <p className="text-xs text-muted-foreground/60">
                What do you do that others do not? What do you do better? Minimum 10 characters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isRefining || getVal('differentiators').length < 10}
              onClick={() => handleRefine('differentiators', 'differentiators')}
              className="text-xs"
            >
              {isRefining ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}{' '}
              Clarify my differentiators
            </Button>
          </>
        )}

        {currentStep === 5 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 6</p>
              <h2 className="text-lg font-semibold">Who else solves this problem?</h2>
              <p className="text-sm text-muted-foreground">
                Understanding alternatives helps position you clearly. This step is optional.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="directCompetitors">
                Direct competitors
              </label>
              <Textarea
                id="directCompetitors"
                placeholder="e.g., Mixpanel, Amplitude, Google Analytics"
                value={getVal('directCompetitors')}
                onChange={(e) => setValue('directCompetitors', e.target.value)}
                maxLength={400}
                rows={3}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="indirectAlternatives">
                Indirect alternatives
              </label>
              <Textarea
                id="indirectAlternatives"
                placeholder="e.g., Manual spreadsheet tracking, hiring a data analyst"
                value={getVal('indirectAlternatives')}
                onChange={(e) => setValue('indirectAlternatives', e.target.value)}
                maxLength={400}
                rows={3}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
            </div>
          </>
        )}

        {currentStep === 6 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 7</p>
              <h2 className="text-lg font-semibold">How should your brand sound?</h2>
              <p className="text-sm text-muted-foreground">Tone shapes how your message lands.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred tone</label>
              <p className="text-xs text-muted-foreground/60">Select 2 to 4 that feel right for your audience.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {toneOptions.map((tone) => (
                  <label
                    key={tone}
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded-sm cursor-pointer transition-colors text-sm',
                      getList('tones').includes(tone)
                        ? 'border-accent/60 bg-accent/5'
                        : 'border-border/30 hover:border-border/60',
                    )}
                  >
                    <Checkbox
                      checked={getList('tones').includes(tone)}
                      onCheckedChange={() => toggleItem('tones', tone)}
                    />
                    {tone}
                  </label>
                ))}
              </div>
              {getList('tones').length > 0 && getList('tones').length < 2 && (
                <p className="text-xs text-destructive">Select at least 2 tones.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="toneNotes">
                Tone notes (optional)
              </label>
              <Textarea
                id="toneNotes"
                placeholder="e.g., Professional but not corporate. Confident without being arrogant."
                value={getVal('toneNotes')}
                onChange={(e) => setValue('toneNotes', e.target.value)}
                maxLength={300}
                rows={2}
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
              />
            </div>
          </>
        )}

        {currentStep === 7 && (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-accent font-medium">Step 8</p>
              <h2 className="text-lg font-semibold">Where do you communicate?</h2>
              <p className="text-sm text-muted-foreground">
                The generator will optimise content for the platforms you actually use.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary platforms</label>
              <p className="text-xs text-muted-foreground/60">Where does your audience spend time?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {platformOptions.map((p) => (
                  <label
                    key={p}
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded-sm cursor-pointer transition-colors text-sm',
                      getList('platforms').includes(p)
                        ? 'border-accent/60 bg-accent/5'
                        : 'border-border/30 hover:border-border/60',
                    )}
                  >
                    <Checkbox
                      checked={getList('platforms').includes(p)}
                      onCheckedChange={() => toggleItem('platforms', p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
              {getList('platforms').length === 0 && (
                <p className="text-xs text-destructive">Select at least one platform.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSaveDraft} className="text-muted-foreground">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Save draft
          </Button>
          <Button onClick={handleNext} disabled={!isStepValid(currentStep)} variant="hero" size="sm">
            {currentStep === TOTAL_STEPS - 1 ? 'Review' : 'Next'} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground/60">
        <UserCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent/60" />
        <span>
          Your draft is saved in your browser only. Close the tab and come back later, your progress will be here.
        </span>
      </div>
    </div>
  );
}
