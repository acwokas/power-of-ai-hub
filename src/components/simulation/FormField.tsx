import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormFieldConfig } from './types';

interface FormFieldProps {
  config: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
}

export function FormField({ config, value, onChange }: FormFieldProps) {
  const [showExample, setShowExample] = useState(false);
  const charCount = value?.length || 0;
  const fieldId = `field-${config.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {config.label}
            {config.required && <span className="text-accent ml-0.5">*</span>}
          </label>
          {config.tooltip && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Help for ${config.label}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  {config.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {config.example && (
          <button
            type="button"
            onClick={() => setShowExample(!showExample)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
            aria-label={showExample ? 'Hide example' : 'Show example'}
          >
            {showExample ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{showExample ? 'Hide' : 'Example'}</span>
          </button>
        )}
      </div>

      {showExample && config.example && (
        <div className="text-xs text-muted-foreground bg-secondary/50 border border-border/30 p-3 rounded-sm italic">
          {config.example}
        </div>
      )}

      {config.type === 'textarea' ? (
        <div className="relative">
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            maxLength={config.maxLength}
            className={cn(
              'min-h-[100px] bg-secondary/30 border-border/40 resize-y',
              'focus-visible:ring-accent focus-visible:border-accent/50',
              'transition-colors',
            )}
            aria-required={config.required}
          />
          {config.maxLength && (
            <span
              className={cn(
                'absolute bottom-2 right-3 text-xs',
                charCount > config.maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {charCount}/{config.maxLength}
            </span>
          )}
        </div>
      ) : config.type === 'select' && config.options ? (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger
            id={fieldId}
            className="bg-secondary/30 border-border/40 focus:ring-accent"
            aria-required={config.required}
          >
            <SelectValue placeholder={config.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {config.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
