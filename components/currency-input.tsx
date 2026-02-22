'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

function formatWithCommas(n: number): string {
  return n.toLocaleString();
}

export function CurrencyInput({
  label,
  description,
  value,
  onChange,
  unit = '万円',
  className,
}: CurrencyInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const focusRef = useRef(false);

  // Sync from prop when not focused
  useEffect(() => {
    if (!focusRef.current) {
      setLocalValue(String(value));
    }
  }, [value]);

  const commitValue = useCallback(
    (raw: string) => {
      // Remove commas user may have typed
      const cleaned = raw.replace(/,/g, '');
      const parsed = Number.parseInt(cleaned, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onChange(parsed);
        setLocalValue(String(parsed));
      } else if (cleaned === '' || cleaned === '0') {
        onChange(0);
        setLocalValue('0');
      } else {
        setLocalValue(String(value));
      }
    },
    [onChange, value]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits and commas only
    const v = e.target.value.replace(/[^0-9,]/g, '');
    setLocalValue(v);
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    focusRef.current = true;
    // Show raw number without commas on focus
    setLocalValue(value === 0 ? '' : String(value));
    // Select all text for easy overwrite
    requestAnimationFrame(() => e.target.select());
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusRef.current = false;
    commitValue(localValue);
  }, [commitValue, localValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitValue(localValue);
        (e.target as HTMLInputElement).blur();
      }
    },
    [commitValue, localValue]
  );

  const displayValue = isFocused ? localValue : formatWithCommas(value);

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <Label className="min-w-0 shrink text-sm font-normal text-foreground">
        {label}
        {description && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({description})
          </span>
        )}
      </Label>
      <div className="flex shrink-0 items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-10 w-24 text-right text-sm font-[family-name:var(--font-dm-sans)] tabular-nums sm:w-28"
        />
        <span className="w-8 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
