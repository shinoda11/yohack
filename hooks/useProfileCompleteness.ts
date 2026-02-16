import { useMemo } from 'react';
import type { Profile } from '@/lib/types';

type CardId = 'basicInfo' | 'income' | 'expense' | 'asset' | 'investment';

interface FieldCheck {
  field: string;
  label: string;
  cardId: CardId;
  isComplete: boolean;
}

export interface IncompleteField {
  label: string;
  cardId: CardId;
}

interface ProfileCompleteness {
  percentage: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  incompleteFields: string[];
  incompleteFieldDetails: IncompleteField[];
}

export function useProfileCompleteness(profile: Profile): ProfileCompleteness {
  return useMemo(() => {
    const checks: FieldCheck[] = [
      { field: 'currentAge', label: '現在の年齢', cardId: 'basicInfo', isComplete: profile.currentAge !== 30 },
      { field: 'targetRetireAge', label: '目標年齢', cardId: 'basicInfo', isComplete: profile.targetRetireAge !== 50 },
      { field: 'mode', label: '世帯構成', cardId: 'basicInfo', isComplete: true },
      { field: 'grossIncome', label: '年収', cardId: 'income', isComplete: profile.grossIncome !== 800 },
      { field: 'livingCostAnnual', label: '基本生活費', cardId: 'expense', isComplete: profile.livingCostAnnual !== 300 },
      { field: 'housingCostAnnual', label: '住居費', cardId: 'expense', isComplete: profile.housingCostAnnual !== 120 },
      { field: 'assetCash', label: '現預金', cardId: 'asset', isComplete: profile.assetCash !== 500 },
      { field: 'assetInvest', label: '投資資産', cardId: 'asset', isComplete: profile.assetInvest !== 300 },
      { field: 'expectedReturn', label: '期待リターン', cardId: 'investment', isComplete: profile.expectedReturn !== 5 },
    ];

    const completedCount = checks.filter((c) => c.isComplete).length;
    const totalCount = checks.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const incomplete = checks.filter((c) => !c.isComplete);
    const incompleteFields = incomplete.map((c) => c.label);
    const incompleteFieldDetails = incomplete.map((c) => ({ label: c.label, cardId: c.cardId }));

    return {
      percentage,
      completedCount,
      totalCount,
      isComplete: completedCount === totalCount,
      incompleteFields,
      incompleteFieldDetails,
    };
  }, [profile]);
}
