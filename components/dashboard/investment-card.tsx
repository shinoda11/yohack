'use client';

import { TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import { TermTooltip } from '@/components/ui/term-tooltip';
import { glossary } from '@/lib/glossary';
import type { Profile } from '@/lib/types';

interface InvestmentCardProps {
  profile: Pick<
    Profile,
    | 'expectedReturn'
    | 'inflationRate'
    | 'volatility'
    | 'effectiveTaxRate'
    | 'retireSpendingMultiplier'
  >;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InvestmentCard({ profile, onUpdate, getFieldError, open, onOpenChange }: InvestmentCardProps) {
  const realReturn = profile.expectedReturn - profile.inflationRate;
  const icon = <TrendingUp className="h-5 w-5" />;
  const title = '投資設定';

  const content = (
    <div className="space-y-6">
      {/* Expected return */}
      <div>
        <SliderInput
          label={<TermTooltip term="期待リターン" description={glossary['期待リターン']} />}
          description="名目"
          value={profile.expectedReturn}
          onChange={(value) => onUpdate({ expectedReturn: value })}
          min={0}
          max={15}
          step={0.5}
          unit="%"
        />
        <FieldError message={getFieldError?.('expectedReturn')} />
      </div>

      {/* Inflation rate */}
      <div>
        <SliderInput
          label={<TermTooltip term="インフレ率" description={glossary['インフレ率']} />}
          value={profile.inflationRate}
          onChange={(value) => onUpdate({ inflationRate: value })}
          min={0}
          max={5}
          step={0.1}
          unit="%"
        />
        <FieldError message={getFieldError?.('inflationRate')} />
      </div>

      {/* Real return display */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">実質リターン</span>
          <span className="font-semibold">{realReturn.toFixed(1)}%</span>
        </div>
      </div>

      {/* Volatility */}
      <div>
        <SliderInput
          label={<TermTooltip term="ボラティリティ" description={glossary['ボラティリティ']} />}
          description="標準偏差"
          value={Math.round(profile.volatility * 100)}
          onChange={(value) => onUpdate({ volatility: value / 100 })}
          min={5}
          max={30}
          step={1}
          unit="%"
        />
        <FieldError message={getFieldError?.('volatility')} />
      </div>

      {/* Effective tax rate */}
      <div>
        <SliderInput
          label={<TermTooltip term="実効税率" description={glossary['実効税率']} />}
          value={profile.effectiveTaxRate}
          onChange={(value) => onUpdate({ effectiveTaxRate: value })}
          min={10}
          max={50}
          step={1}
          unit="%"
        />
        <FieldError message={getFieldError?.('effectiveTaxRate')} />
      </div>

      {/* Retirement spending multiplier */}
      <div>
        <SliderInput
          label={<TermTooltip term="退職後支出倍率" description={glossary['退職後支出倍率']} />}
          description="現役時比"
          value={Math.round(profile.retireSpendingMultiplier * 100)}
          onChange={(value) => onUpdate({ retireSpendingMultiplier: value / 100 })}
          min={50}
          max={120}
          step={5}
          unit="%"
        />
        <FieldError message={getFieldError?.('retireSpendingMultiplier')} />
      </div>
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = (
      <>
        {'リターン'}
        <span className="font-medium text-foreground">{profile.expectedReturn}%</span>
        {' / インフレ'}
        <span className="font-medium text-foreground">{profile.inflationRate}%</span>
        {' / 税率'}
        <span className="font-medium text-foreground">{profile.effectiveTaxRate}%</span>
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="投資リターンとリスクの想定">
      {content}
    </SectionCard>
  );
}
