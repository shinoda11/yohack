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
    // 値が有効な範囲に入っているかで判定（デフォルト値との比較はしない）
    // Number.isFinite() で undefined/NaN を安全にガード
    const fin = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const checks: FieldCheck[] = [
      { field: 'currentAge', label: '現在の年齢', cardId: 'basicInfo', isComplete: fin(profile.currentAge) > 0 },
      { field: 'targetRetireAge', label: '目標年齢', cardId: 'basicInfo', isComplete: fin(profile.targetRetireAge) > fin(profile.currentAge) },
      { field: 'mode', label: '世帯構成', cardId: 'basicInfo', isComplete: true },
      { field: 'grossIncome', label: '年収', cardId: 'income', isComplete: fin(profile.grossIncome) > 0 },
      { field: 'livingCostAnnual', label: '基本生活費', cardId: 'expense', isComplete: fin(profile.livingCostAnnual) > 0 },
      { field: 'housingCostAnnual', label: '住居費', cardId: 'expense', isComplete: fin(profile.housingCostAnnual) >= 0 },
      { field: 'assetCash', label: '現預金', cardId: 'asset', isComplete: fin(profile.assetCash) >= 0 },
      { field: 'assetInvest', label: '投資資産', cardId: 'asset', isComplete: fin(profile.assetInvest) >= 0 },
      { field: 'expectedReturn', label: '期待リターン', cardId: 'investment', isComplete: fin(profile.expectedReturn) > 0 },
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
