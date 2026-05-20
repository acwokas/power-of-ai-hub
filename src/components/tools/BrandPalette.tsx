import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Copy, Download, FileJson, Image as ImageIcon, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'define-brand-palette-latest';
const FONT = 'Outfit, sans-serif';
const SWATCH_SIZE = 120;
const PADDING = 60;
const GAP = 20;
const COLS = 5;

interface Swatch {
  id: string;
  name: string;
  hex: string;
}

interface PaletteSet {
  light: Swatch[];
  dark: Swatch[];
}

interface StoredPalette {
  brandName: string;
  includeDark: boolean;
  palette: PaletteSet;
}

const defaultLight: Swatch[] = [
  { id: 'l-background', name: 'Background', hex: '#FAF9F7' },
  { id: 'l-foreground', name: 'Foreground', hex: '#2B2723' },
  { id: 'l-card', name: 'Card', hex: '#F6F4F1' },
  { id: 'l-secondary', name: 'Secondary', hex: '#EDECEA' },
  { id: 'l-muted', name: 'Muted', hex: '#E8E7E4' },
  { id: 'l-muted-foreground', name: 'Muted foreground', hex: '#7E756B' },
  { id: 'l-accent', name: 'Accent', hex: '#428C87' },
  { id: 'l-border', name: 'Border', hex: '#DBD9D6' },
  { id: 'l-destructive', name: 'Destructive', hex: '#CE3131' },
];

const defaultDark: Swatch[] = [
  { id: 'd-background', name: 'Background', hex: '#141414' },
  { id: 'd-foreground', name: 'Foreground', hex: '#EDE8E1' },
  { id: 'd-card', name: 'Card', hex: '#1C1C1C' },
  { id: 'd-secondary', name: 'Secondary', hex: '#242424' },
  { id: 'd-muted', name: 'Muted', hex: '#2E2E2E' },
  { id: 'd-muted-foreground', name: 'Muted foreground', hex: '#B0A595' },
  { id: 'd-accent', name: 'Accent', hex: '#508F8A' },
  { id: 'd-border', name: 'Border', hex: '#333333' },
];

function isValidHex(s: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

function expandHex(s: string): string {
  const trimmed = s.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

function hexToHsl(hex: string): string {
  if (!isValidHex(hex)) return 'invalid';
  const expanded = expandHex(hex);
  const r = parseInt(expanded.slice(1, 3), 16) / 255;
  const g = parseInt(expanded.slice(3, 5), 16) / 255;
  const b = parseInt(expanded.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function loadStored(): StoredPalette | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as StoredPalette;
    if (parsed.palette && Array.isArray(parsed.palette.light)) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function drawPaletteSection(
  ctx: CanvasRenderingContext2D,
  title: string,
  colors: Swatch[],
  startY: number,
  canvasWidth: number,
): number {
  ctx.fillStyle = '#2B2723';
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(title, PADDING, startY);

  const rows = Math.ceil(colors.length / COLS);
  const totalSwatchWidth = (canvasWidth - PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const swatchSize = Math.min(SWATCH_SIZE, totalSwatchWidth);

  colors.forEach((color, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PADDING + col * (swatchSize + GAP);
    const y = startY + 20 + row * (swatchSize + 60);

    const hex = isValidHex(color.hex) ? expandHex(color.hex) : '#CCCCCC';
    ctx.fillStyle = hex;
    ctx.strokeStyle = '#DBD9D6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, swatchSize, swatchSize, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2B2723';
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(color.name || 'Unnamed', x, y + swatchSize + 18);

    ctx.fillStyle = '#7E756B';
    ctx.font = `400 12px ${FONT}`;
    ctx.fillText(hex, x, y + swatchSize + 34);

    ctx.fillText(`hsl(${hexToHsl(hex)})`, x, y + swatchSize + 48);
  });

  return startY + 20 + rows * (swatchSize + 60) + 30;
}

export default function BrandPalette() {
  const [brandName, setBrandName] = useState('Your brand');
  const [includeDark, setIncludeDark] = useState(true);
  const [palette, setPalette] = useState<PaletteSet>({ light: defaultLight, dark: defaultDark });

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setBrandName(stored.brandName || 'Your brand');
      setIncludeDark(stored.includeDark);
      setPalette(stored.palette);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ brandName, includeDark, palette } satisfies StoredPalette),
      );
    } catch {
      // ignore
    }
  }, [brandName, includeDark, palette]);

  const updateSwatch = (mode: 'light' | 'dark', id: string, field: 'name' | 'hex', value: string) => {
    setPalette((prev) => ({
      ...prev,
      [mode]: prev[mode].map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const addSwatch = (mode: 'light' | 'dark') => {
    setPalette((prev) => ({
      ...prev,
      [mode]: [...prev[mode], { id: newId(mode === 'light' ? 'l' : 'd'), name: '', hex: '#888888' }],
    }));
  };

  const removeSwatch = (mode: 'light' | 'dark', id: string) => {
    setPalette((prev) => ({ ...prev, [mode]: prev[mode].filter((s) => s.id !== id) }));
  };

  const handleReset = () => {
    if (!window.confirm('Reset to the starter palette? Your current colours will be cleared.')) return;
    setBrandName('Your brand');
    setIncludeDark(true);
    setPalette({ light: defaultLight, dark: defaultDark });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const downloadPNG = useCallback(() => {
    const canvas = document.createElement('canvas');
    const lightRows = Math.ceil(palette.light.length / COLS);
    const darkRows = includeDark ? Math.ceil(palette.dark.length / COLS) : 0;
    const totalRows = lightRows + darkRows;
    const baseHeight = 160 + totalRows * (SWATCH_SIZE + 60) + 60 + (includeDark ? 40 : 0);
    const width = 860;
    const height = baseHeight;
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: 'Canvas not supported', variant: 'destructive' });
      return;
    }
    ctx.scale(2, 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#2B2723';
    ctx.font = `700 36px ${FONT}`;
    ctx.fillText(`${brandName} colour palette`, PADDING, 55);

    ctx.fillStyle = '#7E756B';
    ctx.font = `400 14px ${FONT}`;
    ctx.fillText('Generated with EDGE Define', PADDING, 80);

    const nextY = drawPaletteSection(ctx, 'Light mode', palette.light, 120, width);
    if (includeDark) {
      drawPaletteSection(ctx, 'Dark mode', palette.dark, nextY + 10, width);
    }

    const link = document.createElement('a');
    link.download = `${slugify(brandName) || 'brand'}-colour-palette.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast({ title: 'PNG downloaded' });
  }, [brandName, includeDark, palette]);

  const buildJson = () => ({
    brandName,
    generatedAt: new Date().toISOString(),
    palettes: {
      light: palette.light.map((s) => ({ name: s.name, hex: isValidHex(s.hex) ? expandHex(s.hex) : s.hex })),
      ...(includeDark
        ? { dark: palette.dark.map((s) => ({ name: s.name, hex: isValidHex(s.hex) ? expandHex(s.hex) : s.hex })) }
        : {}),
    },
  });

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(buildJson(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(brandName) || 'brand'}-colour-palette.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'JSON downloaded' });
  };

  const buildCssVariables = () => {
    const sectionFor = (label: string, swatches: Swatch[]) => {
      const lines = swatches
        .filter((s) => s.name.trim() && isValidHex(s.hex))
        .map((s) => `  --${slugify(s.name)}: ${hexToHsl(s.hex)};`);
      return `/* ${label} */\n:root${label === 'Dark mode' ? '.dark' : ''} {\n${lines.join('\n')}\n}`;
    };
    const blocks = [sectionFor('Light mode', palette.light)];
    if (includeDark) blocks.push(sectionFor('Dark mode', palette.dark));
    return blocks.join('\n\n');
  };

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(buildCssVariables());
      toast({ title: 'CSS variables copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const copyHexList = async () => {
    const lines: string[] = [`# ${brandName} colour palette`, '', '## Light mode'];
    palette.light.forEach((s) => {
      lines.push(`- ${s.name || 'Unnamed'}: ${isValidHex(s.hex) ? expandHex(s.hex) : s.hex}`);
    });
    if (includeDark) {
      lines.push('', '## Dark mode');
      palette.dark.forEach((s) => {
        lines.push(`- ${s.name || 'Unnamed'}: ${isValidHex(s.hex) ? expandHex(s.hex) : s.hex}`);
      });
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Hex list copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const SwatchRow = ({
    mode,
    swatch,
    canRemove,
  }: {
    mode: 'light' | 'dark';
    swatch: Swatch;
    canRemove: boolean;
  }) => {
    const valid = isValidHex(swatch.hex);
    return (
      <div className="border border-border/30 bg-card rounded-sm p-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <div
            className="w-12 h-12 rounded-sm border border-border/40"
            style={{ backgroundColor: valid ? expandHex(swatch.hex) : '#cccccc' }}
          />
          <input
            type="color"
            value={valid ? expandHex(swatch.hex) : '#cccccc'}
            onChange={(e) => updateSwatch(mode, swatch.id, 'hex', e.target.value.toUpperCase())}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Pick colour"
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          <Input
            value={swatch.name}
            onChange={(e) => updateSwatch(mode, swatch.id, 'name', e.target.value)}
            placeholder="Role (e.g., Background)"
            maxLength={40}
            className="h-9 text-sm bg-secondary/30 border-border/40 focus-visible:ring-accent"
          />
          <Input
            value={swatch.hex}
            onChange={(e) => updateSwatch(mode, swatch.id, 'hex', e.target.value)}
            placeholder="#RRGGBB"
            maxLength={7}
            className={cn(
              'h-9 text-sm font-mono uppercase bg-secondary/30 border-border/40 focus-visible:ring-accent',
              !valid && swatch.hex.length > 0 && 'border-destructive/60',
            )}
          />
        </div>
        {canRemove && (
          <button
            onClick={() => removeSwatch(mode, swatch.id)}
            className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
            aria-label="Remove swatch"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="text-sm font-medium" htmlFor="brand-name">
          Brand name
        </label>
        <Input
          id="brand-name"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="e.g., Acme Analytics"
          maxLength={80}
          className="bg-secondary/30 border-border/40 focus-visible:ring-accent"
        />
        <p className="text-xs text-muted-foreground/60">
          The brand name shows up on the downloaded swatch sheet, the JSON, and the CSS variable file.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border border-border/30 bg-card rounded-sm p-4">
        <div>
          <p className="text-sm font-medium">Include a dark mode pair</p>
          <p className="text-xs text-muted-foreground/60">
            Disable if you only want a single light palette.
          </p>
        </div>
        <button
          onClick={() => setIncludeDark((v) => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            includeDark ? 'bg-accent' : 'bg-secondary/60',
          )}
          role="switch"
          aria-checked={includeDark}
          aria-label="Toggle dark mode palette"
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow',
              includeDark ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h2 className="text-lg font-semibold">Light mode</h2>
          <span className="text-xs text-muted-foreground/60">
            {palette.light.length} swatch{palette.light.length === 1 ? '' : 'es'}
          </span>
        </div>
        <div className="space-y-2">
          {palette.light.map((s) => (
            <SwatchRow key={s.id} mode="light" swatch={s} canRemove={palette.light.length > 1} />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addSwatch('light')}
          disabled={palette.light.length >= 16}
          className="text-xs text-muted-foreground"
        >
          <Plus className="h-3 w-3 mr-1" /> Add a light-mode swatch
        </Button>
      </section>

      {includeDark && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h2 className="text-lg font-semibold">Dark mode</h2>
            <span className="text-xs text-muted-foreground/60">
              {palette.dark.length} swatch{palette.dark.length === 1 ? '' : 'es'}
            </span>
          </div>
          <div className="space-y-2">
            {palette.dark.map((s) => (
              <SwatchRow key={s.id} mode="dark" swatch={s} canRemove={palette.dark.length > 1} />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addSwatch('dark')}
            disabled={palette.dark.length >= 16}
            className="text-xs text-muted-foreground"
          >
            <Plus className="h-3 w-3 mr-1" /> Add a dark-mode swatch
          </Button>
        </section>
      )}

      <section className="space-y-4 border-t border-border/30 pt-6">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3">Light mode</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {palette.light.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div
                    className="w-full aspect-square rounded-sm border border-border/40"
                    style={{ backgroundColor: isValidHex(s.hex) ? expandHex(s.hex) : '#cccccc' }}
                  />
                  <p className="text-xs font-medium text-foreground truncate">{s.name || 'Unnamed'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {isValidHex(s.hex) ? expandHex(s.hex) : 'invalid'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {includeDark && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3">Dark mode</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {palette.dark.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div
                      className="w-full aspect-square rounded-sm border border-border/40"
                      style={{ backgroundColor: isValidHex(s.hex) ? expandHex(s.hex) : '#cccccc' }}
                    />
                    <p className="text-xs font-medium text-foreground truncate">{s.name || 'Unnamed'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {isValidHex(s.hex) ? expandHex(s.hex) : 'invalid'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/30 pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Export</h2>
        <p className="text-sm text-muted-foreground">
          A PNG swatch sheet for sharing, a JSON file for design tools, and CSS variables for the codebase.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" size="sm" onClick={downloadPNG}>
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Download PNG sheet
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <FileJson className="h-3.5 w-3.5 mr-1.5" /> Download JSON
          </Button>
          <Button variant="outline" size="sm" onClick={copyCss}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy CSS variables
          </Button>
          <Button variant="outline" size="sm" onClick={copyHexList}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy hex list
          </Button>
        </div>
        <details className="border border-border/30 bg-card rounded-sm p-3 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Preview the CSS variables</summary>
          <pre className="mt-3 whitespace-pre-wrap text-foreground/90 font-mono">{buildCssVariables()}</pre>
        </details>
      </section>

      <section className="border-t border-border/30 pt-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset to starter palette
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/tools/brand-profile-generator">
            Pair with Brand Profile Generator <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </a>
        </Button>
      </section>

      <p className="text-xs text-muted-foreground/60 flex items-start gap-2">
        <X className="h-3 w-3 mt-0.5 shrink-0" />
        Your palette lives in your browser only. Refreshing keeps it. Clearing site data resets it.
      </p>
    </div>
  );
}
