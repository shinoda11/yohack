'use client';

import { Receipt } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import { formatCurrency } from '@/lib/types';
import type { Profile } from '@/lib/types';

interface ExpenseCardProps {
  profile: Pick<Profile, 'livingCostAnnual' | 'housingCostAnnual'>;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideHousing?: boolean;
  completed?: boolean;
}

export function ExpenseCard({ profile, onUpdate, getFieldError, open, onOpenChange, hideHousing, completed }: ExpenseCardProps) {
  const totalExpense = hideHousing ? profile.livingCostAnnual : profile.livingCostAnnual + profile.housingCostAnnual;
  const icon = <Receipt className="h-5 w-5" />;
  const title = hideHousing ? '生活費' : '支出';

  const content = (
    <div className="space-y-6">
      {/* Living cost (monthly input, stored as annual) */}
      <div>
        <SliderInput
          label="基本生活費（住居費除く・月額）"
          description="食費、光熱費、通信費など"
          value={Math.round(profile.livingCostAnnual / 12)}
          onChange={(value) => onUpdate({ livingCostAnnual: Math.round(value * 12) })}
          min={8}
          max={100}
          step={1}
          unit="万円/月"
        />
        <FieldError message={getFieldError?.('livingCostAnnual')} />
      </div>

      {/* Housing cost (monthly input, stored as annual) */}
      {!hideHousing && (
        <div>
          <SliderInput
            label="住居費（家賃/ローン・月額）"
            description="家賃またはローン返済"
            value={Math.round(profile.housingCostAnnual / 12)}
            onChange={(value) => onUpdate({ housingCostAnnual: Math.round(value * 12) })}
            min={0}
            max={50}
            step={1}
            unit="万円/月"
          />
          <FieldError message={getFieldError?.('housingCostAnnual')} />
        </div>
      )}

      {/* Total summary */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">年間支出合計</span>
          <span className="text-lg font-semibold">
            {formatCurrency(totalExpense)}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          月額: 約{formatCurrency(Math.round(totalExpense / 12))}
        </div>
      </div>
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = hideHousing ? (
      <>
        {'生活費 '}
        <span className="font-medium text-foreground">{profile.livingCostAnnual}万</span>
      </>
    ) : (
      <>
        {'生活費 '}
        <span className="font-medium text-foreground">{profile.livingCostAnnual}万</span>
        {' / 住居 '}
        <span className="font-medium text-foreground">{profile.housingCostAnnual}万</span>
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange} completed={completed}>
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
