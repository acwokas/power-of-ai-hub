import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { PrivacyNotice } from '@/components/simulation/PrivacyNotice';
import {
  CalendarDays,
  ArrowRight,
  ChevronDown,
  Copy,
  RefreshCw,
  Download,
  FileJson,
  Loader2,
  Check,
  Sparkles,
  LayoutGrid,
  List,
  Columns,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const PROFILE_STORAGE_KEY = 'define-brand-profile-latest';
const SPRINT_STORAGE_KEY = 'define-content-sprint-latest';

type Phase = 'config' | 'no-profile' | 'loading' | 'results';
type ViewMode = 'day' | 'week' | 'platform';

interface ProfileData {
  formData: Record<string, string>;
  profile: string;
  generatedAt: string;
}

interface InlineProfileFields {
  productName: string;
  productDescription: string;
  audienceRole: string;
  tones: string;
}

function loadProfile(): ProfileData | null {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.formData && parsed.profile) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function extractPillars(profileText: string): string[] {
  const pillarsSection = profileText.match(/## CONTENT PILLARS\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!pillarsSection) return [];
  const pillarNames = pillarsSection[1].match(/\*\*(.+?)\*\*/g);
  if (!pillarNames) return [];
  return pillarNames
    .slice(0, 8)
    .map((p) =>
      p
        .replace(/\*\*/g, '')
        .replace(/^Pillar(?: name)?:\s*/i, '')
        .trim(),
    )
    .filter((p) => p.length > 2 && p.length < 60);
}

function extractPlatformsFromProfile(formData: Record<string, string>): string[] {
  return (formData.platforms || '').split(',').filter(Boolean);
}

const allPlatforms = ['LinkedIn', 'X (Twitter)', 'Reddit', 'Company blog', 'Newsletter'];

const loadingPhases = [
  'Analysing your brand profile...',
  'Planning content across platforms...',
  'Writing Day 1...',
  'Writing Day 2...',
  'Writing Day 3...',
  'Polishing content...',
];

function copyToClipboard(text: string, label?: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast({ title: label ? `${label} copied` : 'Copied' }))
    .catch(() => toast({ title: 'Copy failed', variant: 'destructive' }));
}

interface DayContent {
  dayNumber: number;
  theme: string;
  platforms: {
    name: string;
    content: string;
    whyItWorks: string;
    hashtags: string;
    bestTime: string;
    cta: string;
    notes: string;
  }[];
  raw: string;
}

function parseSprintDays(text: string): DayContent[] {
  const dayRegex = /## Day (\d+)/gi;
  const matches = [...text.matchAll(dayRegex)];
  if (matches.length === 0) return [];

  const days: DayContent[] = [];
  matches.forEach((match, i) => {
    const dayNum = parseInt(match[1]);
    const startIdx = match.index!;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const dayText = text.slice(startIdx, endIdx).trim();

    const themeMatch = dayText.match(/\*\*Theme\*\*:\s*(.+)/i);
    const theme = themeMatch ? themeMatch[1].trim() : '';

    const platformRegex = /### (.+)\n/gi;
    const platMatches = [...dayText.matchAll(platformRegex)];
    const platforms: DayContent['platforms'] = [];

    platMatches.forEach((pm, pi) => {
      const platStart = pm.index! + pm[0].length;
      const platEnd = pi + 1 < platMatches.length ? platMatches[pi + 1].index! : dayText.length;
      const platText = dayText.slice(platStart, platEnd).trim();

      const postMatch = platText.match(/\*\*Post\*\*:\s*\n?([\s\S]*?)(?=\n\*\*Why|$)/i);
      const whyMatch = platText.match(/\*\*Why this works\*\*:\s*\n?([\s\S]*?)(?=\n\*\*Hashtags|$)/i);
      const hashMatch = platText.match(/\*\*Hashtags(?:\/Keywords)?\*\*:\s*(.+)/i);
      const timeMatch = platText.match(/\*\*Best time to post\*\*:\s*(.+)/i);
      const ctaMatch = platText.match(/\*\*CTA\*\*:\s*(.+)/i);
      const notesMatch = platText.match(/\*\*Notes\*\*:\s*\n?([\s\S]*?)$/i);

      platforms.push({
        name: pm[1].trim(),
        content: postMatch ? postMatch[1].trim() : '',
        whyItWorks: whyMatch ? whyMatch[1].trim() : '',
        hashtags: hashMatch ? hashMatch[1].trim() : '',
        bestTime: timeMatch ? timeMatch[1].trim() : '',
        cta: ctaMatch ? ctaMatch[1].trim() : '',
        notes: notesMatch ? notesMatch[1].trim() : '',
      });
    });

    days.push({ dayNumber: dayNum, theme, platforms, raw: dayText });
  });

  return days;
}

const platformColors: Record<string, string> = {
  LinkedIn: 'border-blue-500/30 bg-blue-500/5',
  'X (Twitter)': 'border-foreground/20 bg-foreground/5',
  Reddit: 'border-orange-500/30 bg-orange-500/5',
  'Company blog': 'border-accent/30 bg-accent/5',
  Newsletter: 'border-purple-500/30 bg-purple-500/5',
};

const API_URL = '/api/content-sprint-generator';

function PlatformPost({
  platform,
  onOptimise,
  isOptimising,
}: {
  platform: DayContent['platforms'][0];
  onOptimise: () => void;
  isOptimising: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(platform.content, `${platform.name} post`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'border rounded-sm overflow-hidden',
          platformColors[platform.name] || 'border-border/30 bg-card',
        )}
      >
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between text-left group">
          <span className="text-sm font-medium">{platform.name}</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            <div className="bg-background/50 border border-border/20 rounded-sm p-3">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{platform.content}</p>
            </div>

            {platform.hashtags && (
              <div className="flex flex-wrap gap-1.5">
                {platform.hashtags
                  .split(/[,\s]+/)
                  .filter((h) => h.startsWith('#') || h.length > 1)
                  .map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`, 'Hashtag')}
                      className="text-xs px-2 py-0.5 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </button>
                  ))}
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {platform.bestTime && <span>Post at: {platform.bestTime}</span>}
              {platform.cta && <span>CTA: {platform.cta}</span>}
            </div>

            {platform.whyItWorks && (
              <Collapsible>
                <CollapsibleTrigger className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" /> Why this works
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-xs text-muted-foreground mt-1 pl-4">{platform.whyItWorks}</p>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy post
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onOptimise}
                disabled={isOptimising}
              >
                {isOptimising ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Optimise
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ContentSprintGenerator() {
  const [phase, setPhase] = useState<Phase>('config');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [useProfile, setUseProfile] = useState(true);

  const [inlineProfile, setInlineProfile] = useState<InlineProfileFields>({
    productName: '',
    productDescription: '',
    audienceRole: '',
    tones: 'Professional, Direct',
  });

  const [duration, setDuration] = useState<7 | 14>(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [events, setEvents] = useState('');
  const [toneSlider, setToneSlider] = useState(50);

  const [sprintText, setSprintText] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isOptimising, setIsOptimising] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const abortRef = useRef<AbortController | null>(null);

  const [pillars, setPillars] = useState<string[]>([]);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      setProfileData(profile);
      const profilePlatforms = extractPlatformsFromProfile(profile.formData);
      setSelectedPlatforms(profilePlatforms.filter((p) => allPlatforms.includes(p)));
      setPillars(extractPillars(profile.profile));
    } else {
      setPhase('no-profile');
    }

    try {
      const saved = localStorage.getItem(SPRINT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sprintText && parsed.generatedAt) {
          setSprintText(parsed.sprintText);
          setGeneratedAt(parsed.generatedAt);
          setPhase('results');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleTheme = (t: string) => {
    setSelectedThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const isConfigValid = selectedPlatforms.length >= 1;

  const buildRequestProfileData = (): { formData: Record<string, string>; profile: string } => {
    if (useProfile && profileData) {
      return { formData: profileData.formData, profile: profileData.profile };
    }
    return {
      formData: {
        productName: inlineProfile.productName,
        productDescription: inlineProfile.productDescription,
        audienceRole: inlineProfile.audienceRole,
        tones: inlineProfile.tones,
      },
      profile: '',
    };
  };

  const streamGenerate = async () => {
    setPhase('loading');
    setLoadingPhaseIdx(0);
    setLoadingProgress(0);
    setSprintText('');

    const controller = new AbortController();
    abortRef.current = controller;

    const phaseInterval = setInterval(() => {
      setLoadingPhaseIdx((prev) => Math.min(prev + 1, loadingPhases.length - 1));
    }, 10000);
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => Math.min(prev + 0.5, 95));
    }, 500);

    let accumulated = '';

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: buildRequestProfileData(),
          sprintConfig: {
            duration,
            platforms: selectedPlatforms,
            themes: selectedThemes,
            events,
            toneSlider,
          },
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = (await resp.json().catch(() => ({ error: 'Generation failed' }))) as { error?: string };
        throw new Error(errData.error || `Error ${resp.status}`);
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
              setSprintText(accumulated);
              const dayCount = (accumulated.match(/## Day \d+/gi) || []).length;
              if (dayCount > 0) {
                setLoadingPhaseIdx(Math.min(2 + dayCount, loadingPhases.length - 1));
              }
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }

      const now = new Date().toISOString();
      setSprintText(accumulated);
      setGeneratedAt(now);
      try {
        localStorage.setItem(SPRINT_STORAGE_KEY, JSON.stringify({ sprintText: accumulated, generatedAt: now }));
      } catch {
        // ignore
      }
      setPhase('results');
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Generation failed', description: message, variant: 'destructive' });
      setPhase('config');
    } finally {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);
    }
  };

  const handleOptimise = async (platformName: string, content: string, dayNum: number) => {
    const key = `${dayNum}-${platformName}`;
    setIsOptimising(key);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizePost: {
            platform: platformName,
            content,
            tones: profileData?.formData?.tones || inlineProfile.tones || 'Professional, Direct',
          },
        }),
      });

      if (!resp.ok) throw new Error('Optimisation failed');
      if (!resp.body) throw new Error('No response');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let optimised = '';
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
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) optimised += c;
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }

      if (optimised) {
        const updated = sprintText.replace(content, optimised.trim());
        setSprintText(updated);
        try {
          localStorage.setItem(SPRINT_STORAGE_KEY, JSON.stringify({ sprintText: updated, generatedAt }));
        } catch {
          // ignore
        }
        toast({ title: `${platformName} post optimised` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimisation failed';
      toast({ title: 'Optimisation failed', description: message, variant: 'destructive' });
    } finally {
      setIsOptimising(null);
    }
  };

  const handleStartOver = () => {
    if (window.confirm('This will clear your sprint. Are you sure?')) {
      setSprintText('');
      setGeneratedAt('');
      try {
        localStorage.removeItem(SPRINT_STORAGE_KEY);
      } catch {
        // ignore
      }
      setPhase('config');
    }
  };

  const handleExportCsv = () => {
    const days = parseSprintDays(sprintText);
    const rows = [['Day', 'Theme', 'Platform', 'Post', 'Hashtags', 'Best Time', 'CTA']];
    days.forEach((day) => {
      day.platforms.forEach((p) => {
        rows.push([
          `Day ${day.dayNumber}`,
          day.theme,
          p.name,
          `"${p.content.replace(/"/g, '""')}"`,
          p.hashtags,
          p.bestTime,
          p.cta,
        ]);
      });
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-sprint.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveJson = () => {
    const blob = new Blob([JSON.stringify({ sprintText, generatedAt, duration }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-sprint.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPlatformPosts = (platformName: string) => {
    const days = parseSprintDays(sprintText);
    const posts = days
      .flatMap((d) => d.platforms.filter((p) => p.name === platformName).map((p) => `Day ${d.dayNumber}:\n${p.content}`))
      .join('\n\n---\n\n');
    copyToClipboard(posts, `All ${platformName} posts`);
  };

  const handleDownloadMarkdown = () => {
    const productName = profileData?.formData?.productName || inlineProfile.productName || 'Content';
    const body = `# ${productName}: ${duration}-day content sprint\n\nGenerated ${
      generatedAt ? new Date(generatedAt).toISOString() : new Date().toISOString()
    }\n\n${sprintText}`;
    const blob = new Blob([body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-sprint-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const days = phase === 'results' ? parseSprintDays(sprintText) : [];

  if (phase === 'no-profile') {
    return (
      <div className="space-y-6">
        <div className="border border-border/30 rounded-sm p-8 text-center space-y-4">
          <CalendarDays className="h-10 w-10 text-accent mx-auto" />
          <h2 className="text-xl font-semibold">Content sprints work best with a brand profile.</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A brand profile gives the generator your positioning, audience, voice, and content pillars so the
            calendar comes out targeted instead of generic.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild variant="hero">
              <a href="/tools/brand-profile-generator">
                Create brand profile first <ArrowRight className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUseProfile(false);
                setPhase('config');
              }}
            >
              Continue without a profile
            </Button>
          </div>
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  if (phase === 'config') {
    return (
      <div className="space-y-6">
        {profileData && useProfile ? (
          <div className="border border-accent/20 bg-accent/5 rounded-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Using profile for:{' '}
                <span className="text-accent">{profileData.formData.productName || 'unnamed product'}</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Generated {new Date(profileData.generatedAt).toLocaleDateString('en-GB')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setUseProfile(false);
                setProfileData(null);
                setPillars([]);
              }}
            >
              Use different profile
            </Button>
          </div>
        ) : (
          <div className="border border-border/30 bg-card rounded-sm p-4 space-y-3">
            <p className="text-sm font-medium">Quick brand context</p>
            <p className="text-xs text-muted-foreground/60">
              Without a saved brand profile, give the generator a few essentials to keep the content on-message.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" htmlFor="csg-product">
                  Product or company name
                </label>
                <Input
                  id="csg-product"
                  value={inlineProfile.productName}
                  onChange={(e) =>
                    setInlineProfile((p) => ({ ...p, productName: e.target.value }))
                  }
                  placeholder="e.g., Acme Insights"
                  className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" htmlFor="csg-audience">
                  Audience role
                </label>
                <Input
                  id="csg-audience"
                  value={inlineProfile.audienceRole}
                  onChange={(e) =>
                    setInlineProfile((p) => ({ ...p, audienceRole: e.target.value }))
                  }
                  placeholder="e.g., Heads of Marketing at mid-market SaaS"
                  className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="csg-product-desc">
                What does it do?
              </label>
              <Textarea
                id="csg-product-desc"
                value={inlineProfile.productDescription}
                onChange={(e) =>
                  setInlineProfile((p) => ({ ...p, productDescription: e.target.value }))
                }
                placeholder="One paragraph on the product and what it solves"
                className="min-h-[80px] bg-secondary/30 border-border/40 focus-visible:ring-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="csg-tones">
                Brand tones (comma-separated)
              </label>
              <Input
                id="csg-tones"
                value={inlineProfile.tones}
                onChange={(e) => setInlineProfile((p) => ({ ...p, tones: e.target.value }))}
                placeholder="e.g., Professional, Direct, Warm"
                className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium">Sprint duration</label>
          <div className="flex gap-3">
            {([7, 14] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 border rounded-sm p-4 text-left transition-colors',
                  duration === d ? 'border-accent bg-accent/5' : 'border-border/30 hover:border-border/60',
                )}
              >
                <span className="text-sm font-medium">{d} days</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d === 7 ? 'Week-long content sprint' : 'Two-week content sprint'}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            Longer sprints give more variety but take longer to generate.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Platform focus</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allPlatforms.map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={selectedPlatforms.includes(p)}
                  onCheckedChange={() => togglePlatform(p)}
                />
                {p}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            Content will be optimised for each platform&apos;s format and audience.
          </p>
        </div>

        {pillars.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Content themes to emphasise</label>
            <div className="grid grid-cols-2 gap-2">
              {pillars.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox checked={selectedThemes.includes(p)} onCheckedChange={() => toggleTheme(p)} />
                  {p}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60">Leave blank to balance all pillars equally.</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Special events or launches?</label>
          <Textarea
            value={events}
            onChange={(e) => setEvents(e.target.value)}
            placeholder="e.g., Product launch on Day 5, conference attendance Day 10 to 12"
            className="min-h-[80px] bg-secondary/30 border-border/40 focus-visible:ring-accent resize-y"
          />
          <p className="text-xs text-muted-foreground/60">The generator will weave these into the calendar.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Tone adjustment</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={toneSlider}
            onChange={(e) => setToneSlider(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
            aria-label="Tone slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60">
            <span>More professional</span>
            <span>More conversational</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground/60 bg-card border border-border/20 rounded-sm p-3">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-accent/60" />
          <span>
            Your brand context is used to generate the sprint and is not stored on a server. The result is cached
            in your browser only.
          </span>
        </div>

        <Button
          onClick={streamGenerate}
          disabled={!isConfigValid}
          className="w-full sm:w-auto"
          size="lg"
          variant="hero"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate {duration}-day sprint
        </Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="space-y-6">
        <div className="border border-border/30 rounded-sm p-8 space-y-6 text-center">
          <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground transition-opacity duration-300">
            {loadingPhases[loadingPhaseIdx]}
          </p>
          <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-secondary/40 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/40">
            Estimated: {duration === 7 ? '60 to 90' : '90 to 120'} seconds
          </p>
        </div>

        {sprintText && (
          <div className="border border-border/20 rounded-sm p-4 max-h-60 overflow-y-auto">
            <p className="text-xs text-muted-foreground/40 mb-2">Live preview:</p>
            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {sprintText.slice(-500)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {profileData?.formData?.productName || inlineProfile.productName || 'Content'} sprint
          </h2>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Generated {generatedAt ? new Date(generatedAt).toLocaleString('en-GB') : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 border border-border/20 rounded-sm p-0.5">
          {[
            { mode: 'day' as ViewMode, icon: List, label: 'Day view' },
            { mode: 'week' as ViewMode, icon: LayoutGrid, label: 'Week view' },
            { mode: 'platform' as ViewMode, icon: Columns, label: 'Platform view' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors',
                viewMode === mode ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground',
              )}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'day' && (
        <div className="space-y-4">
          {days.map((day) => (
            <Collapsible key={day.dayNumber} defaultOpen={day.dayNumber <= 3}>
              <div className="border border-border/30 rounded-sm overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left group hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent">Day {day.dayNumber}</span>
                    {day.theme && (
                      <span className="text-xs px-2 py-0.5 rounded-sm bg-accent/10 text-accent">{day.theme}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/40">
                      {day.platforms.length} platform{day.platforms.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {day.platforms.map((platform) => (
                      <PlatformPost
                        key={platform.name}
                        platform={platform}
                        onOptimise={() => handleOptimise(platform.name, platform.content, day.dayNumber)}
                        isOptimising={isOptimising === `${day.dayNumber}-${platform.name}`}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day.dayNumber} className="border border-border/30 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent">Day {day.dayNumber}</span>
              </div>
              {day.theme && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent block truncate">
                  {day.theme}
                </span>
              )}
              <div className="space-y-1">
                {day.platforms.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      copyToClipboard(p.content, `Day ${day.dayNumber} ${p.name}`);
                    }}
                    className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground truncate transition-colors"
                    title={p.content.slice(0, 100)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'platform' && (
        <div className="space-y-6">
          {selectedPlatforms.map((platformName) => {
            const platformPosts = days.flatMap((d) =>
              d.platforms
                .filter((p) => p.name === platformName)
                .map((p) => ({ ...p, dayNumber: d.dayNumber, theme: d.theme })),
            );
            if (platformPosts.length === 0) return null;
            return (
              <div key={platformName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{platformName}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopyPlatformPosts(platformName)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy all
                  </Button>
                </div>
                <div className="space-y-2">
                  {platformPosts.map((post) => (
                    <div
                      key={post.dayNumber}
                      className={cn(
                        'border rounded-sm p-3 space-y-2',
                        platformColors[platformName] || 'border-border/30',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-accent">Day {post.dayNumber}</span>
                        {post.theme && <span className="text-[10px] text-muted-foreground/60">{post.theme}</span>}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => copyToClipboard(post.content, `Day ${post.dayNumber}`)}
                        >
                          <Copy className="h-2.5 w-2.5 mr-1" /> Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => handleOptimise(platformName, post.content, post.dayNumber)}
                          disabled={isOptimising === `${post.dayNumber}-${platformName}`}
                        >
                          {isOptimising === `${post.dayNumber}-${platformName}` ? (
                            <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-2.5 w-2.5 mr-1" />
                          )}
                          Optimise
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-border/20 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveJson}>
            <FileJson className="h-3.5 w-3.5 mr-1.5" /> Save JSON
          </Button>
          {selectedPlatforms.map((p) => (
            <Button key={p} variant="outline" size="sm" onClick={() => handleCopyPlatformPosts(p)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy all {p}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase('config')}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Adjust settings
          </Button>
          <Button variant="ghost" size="sm" onClick={streamGenerate} className="text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate a new sprint
          </Button>
          <Button variant="ghost" size="sm" onClick={handleStartOver} className="text-muted-foreground">
            Start over
          </Button>
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/tools/prompt-engineer">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Optimise with Prompt Engineer
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
