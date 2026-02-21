'use client';

import { Briefcase } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { CurrencyInput } from '@/components/currency-input';
import { FieldError } from '@/components/ui/field-error';
import { formatCurrency } from '@/lib/types';
import type { Profile } from '@/lib/types';

interface IncomeCardProps {
  profile: Pick<
    Profile,
    | 'grossIncome'
    | 'sideIncomeNet'
  >;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  completed?: boolean;
}

export function IncomeCard({ profile, onUpdate, getFieldError, open, onOpenChange, completed }: IncomeCardProps) {
  const icon = <Briefcase className="h-5 w-5" />;
  const title = '収入';

  const content = (
    <div className="space-y-4">
      {/* Gross income */}
      <div>
        <CurrencyInput
          label="年収"
          description="額面"
          value={profile.grossIncome}
          onChange={(value) => onUpdate({ grossIncome: value })}
        />
        <FieldError message={getFieldError?.('grossIncome')} />
      </div>

      {/* Side income */}
      <CurrencyInput
        label="副業収入"
        description="手取り"
        value={profile.sideIncomeNet}
        onChange={(value) => onUpdate({ sideIncomeNet: value })}
      />
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = (
      <>
        <span className="font-medium text-foreground">年収 {formatCurrency(profile.grossIncome)}</span>
        {profile.sideIncomeNet > 0 && ` / 副業 ${formatCurrency(profile.sideIncomeNet)}`}
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange} completed={completed}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="年間の収入を入力してください">
      {content}
    </SectionCard>
  );
}
