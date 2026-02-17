'use client';

/**
 * Exit Readiness OS v2 - useMargin フック
 * Profileとシミュレーション結果から余白を計算
 */

import { useMemo } from 'react';
import type { Profile, SimulationResult } from '@/lib/types';
import type { MoneyMargin } from '@/lib/v2/margin';
import { calculateMoneyMargin } from '@/lib/v2/adapter';
import { evaluateMoneyMarginHealth } from '@/lib/v2/margin';

// v2ページで使用する余白の型定義
export interface TimeMarginV2 {
  yearsToTarget: number;
  progressPercent: number;
  workingYearsLeft: number;
  bufferYears: number;
}

export interface RiskMarginV2 {
  drawdownCapacity: number;
  volatilityTolerance: number;
  emergencyFundCoverage: number;
  sequenceRisk: number;
}

export interface MoneyMarginV2 {
  monthlyNetSavings: number;
  emergencyFundCoverage: number;
  annualDisposableIncome: number;
}

interface UseMarginResult {
  moneyMargin: MoneyMargin | null;
  moneyHealth: 'excellent' | 'good' | 'fair' | 'poor' | null;
  // v2ページ向けの追加フィールド
  money: MoneyMarginV2 | null;
  time: TimeMarginV2 | null;
  risk: RiskMarginV2 | null;
}

// 入力パラメータの型（オブジェクト形式対応）
interface UseMarginParams {
  profile: Profile | null;
  simResult: SimulationResult | null;
}

/**
 * 余白を計算するカスタムフック
 * オブジェクト形式と引数2つ形式の両方をサポート
 */
export function useMargin(
  profileOrParams: Profile | UseMarginParams | null,
  simulation?: SimulationResult | null
): UseMarginResult {
  const result = useMemo(() => {
    // パラメータの正規化（オブジェクト形式と引数形式の両方をサポート）
    let profile: Profile | null;
    let simResult: SimulationResult | null;

    if (profileOrParams && typeof profileOrParams === 'object' && 'profile' in profileOrParams) {
      // オブジェクト形式: { profile, simResult }
      profile = profileOrParams.profile;
      simResult = profileOrParams.simResult;
    } else {
      // 引数形式: (profile, simulation)
      profile = profileOrParams as Profile | null;
      simResult = simulation ?? null;
    }

    if (!profile) {
      return {
        moneyMargin: null,
        moneyHealth: null,
        money: null,
        time: null,
        risk: null,
      };
    }

    const moneyMargin = calculateMoneyMargin(profile, simResult);
    const moneyHealth = evaluateMoneyMarginHealth(moneyMargin);

    // v2ページ向けのデータ構造を生成（既存のsimResultから派生）
    const targetAge = profile.targetRetireAge;
    const currentAge = profile.currentAge;
    const fireAge = simResult?.metrics?.fireAge ?? null;
    const survivalRate = simResult?.metrics?.survivalRate ?? 0;

    // 時間の余白を計算（既存データから派生、新規計算なし）
    const yearsToTarget = targetAge - currentAge;
    const workingYearsLeft = Math.max(0, 65 - currentAge); // 65歳を標準退職年齢と仮定
    const bufferYears = fireAge !== null ? Math.max(0, targetAge - fireAge) : 0;
    const progressPercent = fireAge !== null && fireAge <= targetAge
      ? Math.min(100, ((currentAge - 20) / (fireAge - 20)) * 100) // 20歳を開始点と仮定
      : Math.min(100, ((currentAge - 20) / (targetAge - 20)) * 100);

    const timeMarginV2: TimeMarginV2 = {
      yearsToTarget: Math.max(0, yearsToTarget),
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
      workingYearsLeft,
      bufferYears,
    };

    // リスクの余白を計算（既存データから派生、新規計算なし）
    const totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;
    const stockRatio = totalAssets > 0 ? (profile.assetInvest / totalAssets) * 100 : 70;
    const volatilityTolerance = Math.max(5, 30 - (stockRatio / 5)); // 株式比率が高いほど許容度が下がる
    const drawdownCapacity = survivalRate >= 90 ? 30 : survivalRate >= 70 ? 20 : 10; // 生存率から許容下落を推定
    const sequenceRisk = survivalRate < 70 ? 0.7 : survivalRate < 85 ? 0.4 : 0.2; // 生存率から逆算

    const riskMarginV2: RiskMarginV2 = {
      drawdownCapacity,
      volatilityTolerance,
      emergencyFundCoverage: moneyMargin.emergencyFundCoverage,
      sequenceRisk,
    };

    // お金の余白（既存のmargin.moneyをそのまま使用）
    const moneyMarginV2: MoneyMarginV2 = {
      monthlyNetSavings: moneyMargin.monthlyNetSavings,
      emergencyFundCoverage: moneyMargin.emergencyFundCoverage,
      annualDisposableIncome: moneyMargin.annualDisposableIncome,
    };

    return {
      moneyMargin,
      moneyHealth,
      money: moneyMarginV2,
      time: timeMarginV2,
      risk: riskMarginV2,
    };
  }, [profileOrParams, simulation]);

  return result;
}

/**
 * 健全性の色を取得（Tailwind semantic colors）
 */
export function getHealthColor(health: 'excellent' | 'good' | 'fair' | 'poor' | null): string {
  switch (health) {
    case 'excellent': return 'text-emerald-700 dark:text-emerald-400';
    case 'good': return 'text-emerald-600 dark:text-emerald-500';
    case 'fair': return 'text-amber-700 dark:text-amber-400';
    case 'poor': return 'text-red-700 dark:text-red-400';
    default: return 'text-muted-foreground';
  }
}

/**
 * 健全性の背景色を取得（Tailwind semantic colors）
 */
export function getHealthBgColor(health: 'excellent' | 'good' | 'fair' | 'poor' | null): string {
  switch (health) {
    case 'excellent': return 'bg-emerald-50 dark:bg-emerald-950/20';
    case 'good': return 'bg-emerald-50/70 dark:bg-emerald-950/10';
    case 'fair': return 'bg-amber-50 dark:bg-amber-950/20';
    case 'poor': return 'bg-red-50 dark:bg-red-950/20';
    default: return 'bg-muted';
  }
}

/**
 * 健全性のラベルを取得
 */
export function getHealthLabel(health: 'excellent' | 'good' | 'fair' | 'poor' | null): string {
  switch (health) {
    case 'excellent': return '非常に良好';
    case 'good': return '良好';
    case 'fair': return '要改善';
    case 'poor': return '要注意';
    default: return '未計算';
  }
}
