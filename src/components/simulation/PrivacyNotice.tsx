import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'simulate-privacy-dismissed';

interface PrivacyNoticeProps {
  className?: string;
}

export function PrivacyNotice({ className }: PrivacyNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground/50', className)}>
        <ShieldCheck className="h-3 w-3" />
        <span>Private by design. Nothing stored on servers.</span>
      </div>
    );
  }

  return (
    <div className={cn('border border-accent/20 bg-accent/5 rounded-sm p-4 space-y-2', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
          <span>Private by design</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          aria-label="Dismiss privacy notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground pl-6">
        <p>Don't paste confidential information. Use general descriptions instead.</p>
        <p>Analysis runs via AI and is never stored on servers. Form inputs are saved locally in your browser only.</p>
      </div>
    </div>
  );
}
