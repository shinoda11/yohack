/**
 * Exit Readiness OS v2 - アダプター層
 * v1のProfileをv2のWorldLineに変換
 */

import type { Profile, SimulationResult } from '@/lib/types';
import type { WorldLine, KeyPerformanceIndicators } from './worldline';
import type { MoneyMargin } from './margin';
import { createWorldLine } from './worldline';

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
  // (paths.lowerPath が10パーセンタイルで資産0を下回る年齢)
  let safeFireAge: number | null = null;
  if (paths.lowerPath) {
    for (let i = 0; i < paths.lowerPath.length; i++) {
      const point = paths.lowerPath[i];
      if (point.assets <= 0) {
        safeFireAge = point.age - 1;
        break;
      }
    }
    if (safeFireAge === null && paths.lowerPath.length > 0) {
      // 100歳まで資産が持つ場合
      safeFireAge = profile.targetRetireAge;
    }
  }

  // 60歳時点の中央値資産
  const assetsAt60 = paths.yearlyData?.find(p => p.age === 60)?.assets ?? 0;

  // 100歳時点の中央値資産
  const assetsAt100 = paths.yearlyData?.[paths.yearlyData.length - 1]?.assets ?? 0;

  // 40-50代の年間余裕額を計算
  const midlifePoints = paths.yearlyData?.filter(p => p.age >= 40 && p.age < 60) ?? [];
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
 * WorldLineの計算結果を更新
 */
export function updateWorldLineWithResults(
  worldLine: WorldLine,
  simulation: SimulationResult
): WorldLine {
  const margin = calculateMoneyMargin(worldLine.baseProfile, simulation);
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
