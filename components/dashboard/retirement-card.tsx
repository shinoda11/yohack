'use client';

import { Clock } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { CurrencyInput } from '@/components/currency-input';
import { formatCurrency } from '@/lib/types';
import type { Profile } from '@/lib/types';

interface RetirementCardProps {
  profile: Pick<
    Profile,
    | 'targetRetireAge'
    | 'currentAge'
    | 'postRetireIncome'
    | 'postRetireIncomeEndAge'
  >;
  onUpdate: (updates: Partial<Profile>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  completed?: boolean;
}

export function RetirementCard({ profile, onUpdate, open, onOpenChange, completed }: RetirementCardProps) {
  const icon = <Clock className="h-5 w-5" />;
  const title = 'リタイア設計';
  const postRetireIncome = profile.postRetireIncome ?? 0;
  const postRetireIncomeEndAge = profile.postRetireIncomeEndAge ?? 75;

  const content = (
    <div className="space-y-6">
      {/* Target retirement age */}
      <SliderInput
        label="リタイア目標年齢"
        value={profile.targetRetireAge}
        onChange={(value) => onUpdate({ targetRetireAge: value })}
        min={Math.max(profile.currentAge + 1, 40)}
        max={70}
        step={1}
        unit="歳"
      />

      {/* Post-retirement business income */}
      <CurrencyInput
        label="退職後の事業収入"
        description="顧問・コンサル等"
        value={postRetireIncome}
        onChange={(value) => onUpdate({ postRetireIncome: value })}
        unit="万円/年"
      />

      {/* End age for post-retirement income (only shown when income > 0) */}
      {postRetireIncome > 0 && (
        <SliderInput
          label="事業収入の終了年齢"
          value={postRetireIncomeEndAge}
          onChange={(value) => onUpdate({ postRetireIncomeEndAge: value })}
          min={profile.targetRetireAge}
          max={85}
          step={1}
          unit="歳"
        />
      )}
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = (
      <>
        {'リタイア '}
        <span className="font-medium text-foreground">{profile.targetRetireAge}歳</span>
        {postRetireIncome > 0 && (
          <>
            {' / 退職後収入 '}
            <span className="font-medium text-foreground">{formatCurrency(postRetireIncome)}</span>
            {'（〜' + postRetireIncomeEndAge + '歳）'}
          </>
        )}
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange} completed={completed}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="リタイア時期と退職後収入">
      {content}
    </SectionCard>
  );
}
