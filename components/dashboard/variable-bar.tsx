'use client';

import { useCallback } from 'react';
import { InlineVariable } from './inline-variable';
import type { Profile } from '@/lib/types';

interface VariableBarProps {
  profile: Profile;
  onUpdate: (patch: Partial<Profile>) => void;
}

export function VariableBar({ profile, onUpdate }: VariableBarProps) {
  const handleIncomeChange = useCallback(
    (v: number) => onUpdate({ grossIncome: v }),
    [onUpdate]
  );

  const handleExpenseChange = useCallback(
    (v: number) => onUpdate({ livingCostAnnual: v }),
    [onUpdate]
  );

  const handleTargetAgeChange = useCallback(
    (v: number) => onUpdate({ targetRetireAge: v }),
    [onUpdate]
  );

  return (
    <div className="flex justify-center flex-wrap gap-x-8 gap-y-1 py-3 border-y border-border">
      <InlineVariable
        label="年収"
        value={profile.grossIncome}
        onChange={handleIncomeChange}
        step={50}
        min={300}
        max={5000}
      />
      <InlineVariable
        label="生活費"
        value={profile.livingCostAnnual}
        onChange={handleExpenseChange}
        step={10}
        min={100}
        max={2000}
      />
      <InlineVariable
        label="目標年齢"
        value={profile.targetRetireAge}
        onChange={handleTargetAgeChange}
        unit="歳"
        step={1}
        min={35}
        max={70}
        format={(v) => String(v)}
      />
    </div>
  );
}
