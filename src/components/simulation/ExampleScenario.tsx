import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulation } from './SimulationProvider';
import type { ExampleScenarioData } from './types';

interface ExampleScenarioProps {
  examples: ExampleScenarioData[];
}

export function ExampleScenario({ examples }: ExampleScenarioProps) {
  const { setFormData, formData } = useSimulation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (examples.length === 0) return null;

  const current = examples[currentIndex];

  const handleLoad = () => {
    setFormData(current.values);
    setLoadedId(current.id);
  };

  const handleClear = () => {
    setFormData({});
    setLoadedId(null);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % examples.length);
    setLoadedId(null);
  };

  const handlePrev = () => {
    setCurrentIndex((i) => (i - 1 + examples.length) % examples.length);
    setLoadedId(null);
  };

  const hasData = Object.values(formData).some((v) => v && v.trim().length > 0);

  return (
    <div className="border border-border/30 bg-secondary/20 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-accent" />
          <span>Try an example scenario</span>
        </div>
        {examples.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous example"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{examples.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next example"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium">{current.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
      </div>

      <div className="flex items-center gap-2">
        {loadedId === current.id ? (
          <span className="text-xs text-accent">Example loaded</span>
        ) : (
          <Button variant="outline" size="sm" onClick={handleLoad} className="text-xs">
            <Lightbulb className="h-3 w-3 mr-1" />
            Load example
          </Button>
        )}
        {hasData && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
