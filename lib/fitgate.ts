// FitGate judgment logic + profile conversion + localStorage persistence
// Ported from docs/fitgate-reference/judgment-logic.ts and FitGate.tsx

import type { Profile } from './types';

// --- Types ---

export type FitGateAnswers = {
  email: string;
  q1DecisionDeadline: string;
  q2HousingStatus: string;
  q3PriceRange: string;
  q4IncomeRange: string;
  q5AssetRange: string;
  q6NumberInputTolerance: string;
  q7CareerChange: string;
  q8LifeEvent: string;
  q9CurrentQuestion: string;
  q10PreferredApproach: string;
  q11PrivacyConsent: boolean;
  q12BudgetSense: string;
  invitationToken?: string;
};

export type FitGateResult = {
  judgment: 'ready' | 'prep';
  prepBucket?: 'near' | 'notyet';
};

// --- Judgment ---

export function judgeFitGate(answers: FitGateAnswers): FitGateResult {
  // 4 criteria (matched to FitGate.tsx radio values)
  const incomeOk = ['1,500万〜2,499万', '2,500万以上'].includes(answers.q4IncomeRange);
  const assetOk = ['2,000万〜4,999万', '5,000万以上'].includes(answers.q5AssetRange);
  const numberInputOk = answers.q6NumberInputTolerance === '年収/資産/支出/物件価格を入力できる';
  const budgetOk = ['3万〜4.9万なら検討', '5万円以上でも意思決定が進むなら払う'].includes(answers.q12BudgetSense);

  // 4/4 → ready
  if (incomeOk && assetOk && numberInputOk && budgetOk) {
    return { judgment: 'ready' };
  }

  // prep: classify near vs notyet
  const decisionUrgent = ['1か月以内', '3か月以内', '6か月以内'].includes(answers.q1DecisionDeadline);
  const housingActive = ['物件/エリア/価格帯が具体', '価格帯だけ具体'].includes(answers.q2HousingStatus);
  const numberInputWilling = answers.q6NumberInputTolerance !== '入力したくない';

  // notyet: 期限未定 + まだ漠然 + 入力したくない
  if (!decisionUrgent && !housingActive && !numberInputWilling) {
    return { judgment: 'prep', prepBucket: 'notyet' };
  }

  return { judgment: 'prep', prepBucket: 'near' };
}

// --- Profile conversion ---

const INCOME_MAP: Record<string, number> = {
  '1,000万未満': 750,
  '1,000万〜1,499万': 1250,
  '1,500万〜2,499万': 2000,
  '2,500万以上': 3000,
};

const ASSET_MAP: Record<string, number> = {
  '500万未満': 250,
  '500万〜1,999万': 1250,
  '2,000万〜4,999万': 3500,
  '5,000万以上': 7500,
};

export function fitGateToProfile(answers: FitGateAnswers): Partial<Profile> {
  const preset: Partial<Profile> = {};

  // grossIncome from q4
  const income = INCOME_MAP[answers.q4IncomeRange];
  if (income !== undefined) {
    preset.grossIncome = income;
  }

  // assetCash + assetInvest from q5 (30:70 split)
  const totalAsset = ASSET_MAP[answers.q5AssetRange];
  if (totalAsset !== undefined) {
    preset.assetCash = Math.round(totalAsset * 0.3);
    preset.assetInvest = Math.round(totalAsset * 0.7);
  }

  return preset;
}

// --- localStorage persistence ---

const STORAGE_KEY = 'fitgate-answers';

export function saveFitGateAnswers(answers: FitGateAnswers): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadFitGateAnswers(): FitGateAnswers | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FitGateAnswers;
  } catch {
    return null;
  }
}

export function clearFitGateAnswers(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}
