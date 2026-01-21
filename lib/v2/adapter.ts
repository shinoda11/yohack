/**
 * Exit Readiness OS v2 - アダプター層
 * v1のProfileをv2のWorldLineに変換
 */

import type { Profile, SimulationResult } from '@/lib/types';
import type { WorldLine, KeyPerformanceIndicators } from './worldline';
import type { Margin, MoneyMargin, TimeMargin, EnergyMargin } from './margin';
import { createWorldLine } from './worldline';
import { createDefaultMargin } from './margin';

/**
 * v1のProfileをv2のWorldLineに変換
 */
export function adaptV1ProfileToV2WorldLine(
  profile: Profile,
  name: string = '現状維持',
  description: string = '現在の状況を維持した場合'
): WorldLine {
  return createWorldLine(name, description, profile, [], true);
}

/**
 * v1のSimulationResultからv2のKPIを抽出
 */
export function extractKpisFromSimulation(
  result: SimulationResult,
  profile: Profile
): KeyPerformanceIndicators {
  const { score, paths, metrics } = result;
  
  // 90%サバイバル率でのFIRE年齢を計算
  // (paths.pessimistic が90パーセンタイルで資産0を下回る年齢)
  let safeFireAge: number | null = null;
  if (paths.pessimistic) {
    for (let i = 0; i < paths.pessimistic.length; i++) {
      const point = paths.pessimistic[i];
      if (point.assets <= 0) {
        safeFireAge = point.age - 1;
        break;
      }
    }
    if (safeFireAge === null && paths.pessimistic.length > 0) {
      // 100歳まで資産が持つ場合
      safeFireAge = profile.targetRetireAge;
    }
  }
  
  // 60歳時点の中央値資産
  const assetsAt60 = paths.median?.find(p => p.age === 60)?.assets ?? 0;
  
  // 100歳時点の中央値資産
  const assetsAt100 = paths.median?.[paths.median.length - 1]?.assets ?? 0;
  
  // 40-50代の年間余裕額を計算
  const midlifePoints = paths.median?.filter(p => p.age >= 40 && p.age < 60) ?? [];
  let midlifeSurplus = 0;
  if (midlifePoints.length >= 2) {
    const assetGrowth = midlifePoints.reduce((sum, p, i) => {
      if (i === 0) return 0;
      return sum + (p.assets - midlifePoints[i - 1].assets);
    }, 0);
    midlifeSurplus = assetGrowth / (midlifePoints.length - 1);
  }
  
  return {
    safeFireAge,
    assetsAt60,
    assetsAt100,
    midlifeSurplus,
    survivalRate: score.survival,
    fireAge: metrics.fireAge,
  };
}

/**
 * v1のProfileとSimulationResultからv2のMoneyMarginを計算
 * ダッシュボードのSoT（simResult.cashFlow）から参照する
 * 
 * 重要: NaNは「未計算」を意味する。0埋めは禁止。
 * UI側でNaNをチェックし「—」表示 + 理由を表示すること。
 */
export function calculateMoneyMargin(
  profile: Profile,
  result: SimulationResult | null
): MoneyMargin {
  // SoTがない場合は未計算を明示（0埋め禁止）
  if (!result) {
    return {
      monthlyDisposableIncome: NaN,
      monthlyNetSavings: NaN,
      emergencyFundCoverage: NaN,
      annualDisposableIncome: NaN,
    };
  }
  
  // cashFlowがない場合も未計算
  if (!result.cashFlow) {
    return {
      monthlyDisposableIncome: NaN,
      monthlyNetSavings: NaN,
      emergencyFundCoverage: NaN,
      annualDisposableIncome: NaN,
    };
  }
  
  const { cashFlow } = result;
  
  // SoTから年間可処分所得を取得（収入合計）
  const annualIncome = (cashFlow.income ?? 0) + (cashFlow.pension ?? 0) + (cashFlow.dividends ?? 0);
  
  // SoTから年間支出を取得
  const annualExpense = cashFlow.expenses ?? 0;
  
  // 年間純収支（SoTのnetCashFlow）
  const annualNetCashFlow = cashFlow.netCashFlow ?? (annualIncome - annualExpense);
  
  // 月次換算（万円単位、端数は切り捨て）
  const monthlyDisposableIncome = Math.floor(annualIncome / 12);
  const monthlyNetSavings = Math.floor(annualNetCashFlow / 12);
  
  // 月次支出
  const monthlyExpense = annualExpense / 12;
  
  // 緊急資金カバー月数（現金資産 / 月次支出）
  // 支出が0の場合は無限大ではなく、現金資産を表示（12ヶ月分と仮定）
  const emergencyFundCoverage = monthlyExpense > 0 
    ? profile.assetCash / monthlyExpense 
    : (profile.assetCash > 0 ? 12 : 0);
  
  return {
    monthlyDisposableIncome,
    monthlyNetSavings,
    emergencyFundCoverage,
    annualDisposableIncome: annualIncome,
  };
}

/**
 * v1のProfileからv2のTimeMarginを計算（デフォルト値ベース）
 */
export function calculateTimeMargin(profile: Profile): TimeMargin {
  // 働いている場合のデフォルト値
  const baseWeeklyFreeHours = 40; // 週40時間の自由時間
  
  // 世帯人数による調整
  const householdAdjustment = profile.householdMode === 'couple' ? -5 : 0;
  
  // キャリア柔軟性スコア（年齢とスキルで概算）
  const ageFactor = profile.currentAge < 40 ? 70 : profile.currentAge < 50 ? 60 : 50;
  const careerFlexibilityScore = ageFactor;
  
  return {
    weeklyFreeHours: baseWeeklyFreeHours + householdAdjustment,
    annualVacationDays: 20, // 標準的な有給
    careerFlexibilityScore,
  };
}

/**
 * v1のProfileからv2のEnergyMarginを計算（デフォルト値ベース）
 */
export function calculateEnergyMargin(profile: Profile): EnergyMargin {
  // 年齢による健康スコアの調整
  const ageHealthFactor = Math.max(100 - (profile.currentAge - 30) * 1.5, 50);
  
  // ストレスレベルの概算（貯蓄率が低いとストレス高）
  const grossAnnual = profile.grossIncome + (profile.rsuAnnual ?? 0);
  const expenseAnnual = profile.livingExpenseAnnual + profile.housingCostAnnual;
  const savingsRate = grossAnnual > 0 ? (grossAnnual - expenseAnnual) / grossAnnual : 0;
  const stressLevel = Math.max(20, Math.min(80, 60 - savingsRate * 100));
  
  return {
    stressLevel,
    physicalHealthScore: ageHealthFactor,
    mentalHealthScore: Math.max(50, 80 - stressLevel / 2),
  };
}

/**
 * v1のProfileとSimulationResultからv2のMarginを計算
 */
export function calculateMargin(
  profile: Profile,
  result: SimulationResult | null
): Margin {
  return {
    money: calculateMoneyMargin(profile, result),
    time: calculateTimeMargin(profile),
    energy: calculateEnergyMargin(profile),
  };
}

/**
 * WorldLineの計算結果を更新
 */
export function updateWorldLineWithResults(
  worldLine: WorldLine,
  simulation: SimulationResult
): WorldLine {
  const margin = calculateMargin(worldLine.baseProfile, simulation);
  const kpis = extractKpisFromSimulation(simulation, worldLine.baseProfile);
  
  return {
    ...worldLine,
    result: {
      simulation,
      margin,
      kpis,
      isCalculating: false,
      lastCalculatedAt: new Date(),
      error: null,
    },
    updatedAt: new Date(),
  };
}
