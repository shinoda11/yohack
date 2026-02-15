import { useMemo } from 'react';
import type { Profile } from '@/lib/types';

interface FieldCheck {
  field: string;
  label: string;
  isComplete: boolean;
}

interface ProfileCompleteness {
  percentage: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  incompleteFields: string[];
}

export function useProfileCompleteness(profile: Profile): ProfileCompleteness {
  return useMemo(() => {
    const checks: FieldCheck[] = [
      { field: 'currentAge', label: '現在の年齢', isComplete: profile.currentAge !== 30 },
      { field: 'targetRetireAge', label: '目標年齢', isComplete: profile.targetRetireAge !== 50 },
      { field: 'mode', label: '世帯構成', isComplete: true },
      { field: 'grossIncome', label: '年収', isComplete: profile.grossIncome !== 800 },
      { field: 'livingCostAnnual', label: '基本生活費', isComplete: profile.livingCostAnnual !== 300 },
      { field: 'housingCostAnnual', label: '住居費', isComplete: profile.housingCostAnnual !== 120 },
      { field: 'assetCash', label: '現預金', isComplete: profile.assetCash !== 500 },
      { field: 'assetInvest', label: '投資資産', isComplete: profile.assetInvest !== 300 },
      { field: 'expectedReturn', label: '期待リターン', isComplete: profile.expectedReturn !== 5 },
      { field: 'effectiveTaxRate', label: '実効税率', isComplete: profile.effectiveTaxRate !== 20 },
    ];

    const completedCount = checks.filter((c) => c.isComplete).length;
    const totalCount = checks.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const incompleteFields = checks.filter((c) => !c.isComplete).map((c) => c.label);

    return {
      percentage,
      completedCount,
      totalCount,
      isComplete: completedCount === totalCount,
      incompleteFields,
    };
  }, [profile]);
}
