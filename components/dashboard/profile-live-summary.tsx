'use client';

import { useMemo } from 'react';
import type { Profile } from '@/lib/types';
import { formatCurrency } from '@/lib/types';
import { calculateNetIncomeForAge, calculateAnnualPension } from '@/lib/calc-core';

interface ProfileLiveSummaryProps {
  profile: Profile;
}

export function ProfileLiveSummary({ profile }: ProfileLiveSummaryProps) {
  const metrics = useMemo(() => {
    const totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;
    const disposableIncome = Math.round(calculateNetIncomeForAge(profile, profile.currentAge));
    const estimatedPension = calculateAnnualPension(profile);

    return {
      retireAge: profile.targetRetireAge,
      totalAssets,
      disposableIncome,
      estimatedPension,
    };
  }, [profile]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <SummaryItem label="年間可処分所得" value={formatCurrency(metrics.disposableIncome)} />
      <SummaryItem label="想定退職年齢" value={`${metrics.retireAge}歳`} />
      <SummaryItem label="総資産概算" value={formatCurrency(metrics.totalAssets)} />
      <SummaryItem label="推定年金額" value={`${formatCurrency(metrics.estimatedPension)}/年`} />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-sand bg-brand-canvas px-3 py-2.5">
      <p className="text-[11px] text-brand-bronze leading-tight">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-brand-night transition-all duration-300 ease-out">
        {value}
      </p>
    </div>
  );
}
