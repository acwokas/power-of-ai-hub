import type { ReactNode } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useSimulation } from './SimulationProvider';
import { PrivacyNotice } from './PrivacyNotice';

interface SimulationLayoutProps {
  howItWorks: string[];
  children: ReactNode;
  // when true, tightens vertical padding around the helpers (how-it-works, privacy notice)
  // and uses a slightly larger base typography across the tool.
  compact?: boolean;
}

export function SimulationLayout({ howItWorks, children, compact }: SimulationLayoutProps) {
  const { phase, currentStep, totalSteps } = useSimulation();

  const progressPercent =
    phase === 'setup' ? 0 : phase === 'reflection' ? 100 : Math.round(((currentStep + 1) / totalSteps) * 100);

  const wrapperClass = compact ? 'space-y-5' : 'space-y-8';

  return (
    <div className={wrapperClass}>
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <span>How it works</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className={(compact ? 'mt-2 space-y-1.5' : 'mt-4 space-y-2') + ' text-sm text-muted-foreground list-none'}>
            {howItWorks.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-accent font-medium shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>

      <PrivacyNotice />

      {phase !== 'setup' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{phase === 'reflection' ? 'Complete' : `Step ${currentStep + 1} of ${totalSteps}`}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1 w-full bg-secondary/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="animate-fade-in">{children}</div>
    </div>
  );
}
