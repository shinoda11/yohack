'use client';

import { Receipt } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import type { Profile } from '@/lib/types';

interface ExpenseCardProps {
  profile: Pick<Profile, 'livingCostAnnual' | 'housingCostAnnual'>;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExpenseCard({ profile, onUpdate, getFieldError, open, onOpenChange }: ExpenseCardProps) {
  const totalExpense = profile.livingCostAnnual + profile.housingCostAnnual;
  const icon = <Receipt className="h-5 w-5" />;
  const title = '支出';

  const content = (
    <div className="space-y-6">
      {/* Living cost */}
      <div>
        <SliderInput
          label="基本生活費"
          description="食費、光熱費、通信費など"
          value={profile.livingCostAnnual}
          onChange={(value) => onUpdate({ livingCostAnnual: value })}
          min={100}
          max={1200}
          step={10}
          unit="万円"
        />
        <FieldError message={getFieldError?.('livingCostAnnual')} />
      </div>

      {/* Housing cost */}
      <div>
        <SliderInput
          label="住居費"
          description="家賃またはローン返済"
          value={profile.housingCostAnnual}
          onChange={(value) => onUpdate({ housingCostAnnual: value })}
          min={0}
          max={600}
          step={10}
          unit="万円"
        />
        <FieldError message={getFieldError?.('housingCostAnnual')} />
      </div>

      {/* Total summary */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">年間支出合計</span>
          <span className="text-lg font-semibold">
            {totalExpense.toLocaleString()}万円
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          月額: 約{Math.round(totalExpense / 12).toLocaleString()}万円
        </div>
      </div>
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = (
      <>
        {'生活費 '}
        <span className="font-medium text-foreground">{profile.livingCostAnnual}万</span>
        {' / 住居 '}
        <span className="font-medium text-foreground">{profile.housingCostAnnual}万</span>
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="年間の支出を入力してください">
      {content}
    </SectionCard>
  );
}
