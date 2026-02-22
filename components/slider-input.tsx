'use client';

import React from "react"

import { useCallback, useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SliderInputProps {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  description,
  className,
  disabled = false,
}: SliderInputProps) {
  // Local string state for the text input to allow intermediate values during typing
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const focusRef = useRef(false);

  // Sync local value from prop when not focused (e.g. slider changes, external updates)
  useEffect(() => {
    if (!focusRef.current) {
      setLocalValue(String(value));
    }
  }, [value]);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange]
  );

  const commitValue = useCallback(
    (raw: string) => {
      const parsed = Number.parseFloat(raw);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        onChange(clamped);
        setLocalValue(String(clamped));
      } else {
        // Reset to current prop value if invalid
        setLocalValue(String(value));
      }
    },
    [onChange, min, max, value]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    []
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    focusRef.current = true;
    requestAnimationFrame(() => e.target.select());
  }, []);

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

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="min-w-0 shrink text-sm font-normal text-foreground">
          {label}
          {description && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({description})
            </span>
          )}
        </Label>
        <div className="flex shrink-0 items-center gap-1.5">
          <Input
            type="number"
            value={isFocused ? localValue : value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-8 w-20 text-right text-sm sm:w-24"
          />
          <span className="w-8 text-sm text-muted-foreground sm:w-10">{unit}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="cursor-pointer min-h-[44px]"
      />
    </div>
  );
}
