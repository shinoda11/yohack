/**
 * Exit Readiness OS v2 - 世界線 (WorldLine)
 * ユーザーの一つの「選択肢」を表現する単位
 */

import type { Profile, SimulationResult } from '@/lib/types';
import type { Margin } from './margin';
import type { ScenarioEvent } from './events';

/**
 * 主要KPI
 */
export type KeyPerformanceIndicators = {
  safeFireAge: number | null;   // 90%の確率でリタイア可能な年齢
  assetsAt60: number;           // 60歳時点の中央値資産（万円）
  assetsAt100: number;          // 100歳時点の中央値資産（万円）
  midlifeSurplus: number;       // 40-50代の年間余裕額（万円）
  survivalRate: number;         // 100歳まで資産が持つ確率（%）
  fireAge: number | null;       // 50%確率でのFIRE年齢
};

/**
 * 世界線：ユーザーの一つの選択肢
 */
export type WorldLine = {
  id: string;                    // UUID
  name: string;                  // 例: "現状維持", "3年後に家を買う"
  description: string;           // 世界線の説明
  baseProfile: Profile;          // この世界線の基礎となるプロファイル
  events: ScenarioEvent[];       // この世界線で発生するイベントのリスト
  isBaseline: boolean;           // ベースライン（現状維持）かどうか
  createdAt: Date;
  updatedAt: Date;
  result: WorldLineResult;
};

/**
 * 世界線の計算結果
 */
export type WorldLineResult = {
  simulation: SimulationResult | null;  // 金融シミュレーション結果
  margin: Margin | null;                // この世界線における余白
  kpis: KeyPerformanceIndicators | null; // 主要KPI
  isCalculating: boolean;               // 計算中フラグ
  lastCalculatedAt: Date | null;        // 最終計算日時
  error: string | null;                 // エラーメッセージ
};

/**
 * 世界線比較結果
 */
export type WorldLineComparison = {
  worldLineA: WorldLine;
  worldLineB: WorldLine;
  differences: {
    safeFireAge: number | null;      // 年齢差（B - A）
    assetsAt60: number;              // 資産差（B - A）
    survivalRate: number;            // 確率差（B - A）
    monthlyNetSavings: number;       // 月次貯蓄差（B - A）
    emergencyFundCoverage: number;   // 緊急資金差（B - A）
  };
  recommendation: 'A' | 'B' | 'neutral';  // 推奨する世界線
  recommendationReason: string;           // 推奨理由
};

/**
 * 新しい世界線を作成
 */
export function createWorldLine(
  name: string,
  description: string,
  baseProfile: Profile,
  events: ScenarioEvent[] = [],
  isBaseline: boolean = false
): WorldLine {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name,
    description,
    baseProfile,
    events,
    isBaseline,
    createdAt: now,
    updatedAt: now,
    result: {
      simulation: null,
      margin: null,
      kpis: null,
      isCalculating: false,
      lastCalculatedAt: null,
      error: null,
    },
  };
}

/**
 * 世界線をクローン（新しい選択肢として複製）
 */
export function cloneWorldLine(
  worldLine: WorldLine,
  newName: string,
  newDescription?: string
): WorldLine {
  const now = new Date();
  return {
    ...worldLine,
    id: crypto.randomUUID(),
    name: newName,
    description: newDescription ?? worldLine.description,
    isBaseline: false,
    createdAt: now,
    updatedAt: now,
    result: {
      simulation: null,
      margin: null,
      kpis: null,
      isCalculating: false,
      lastCalculatedAt: null,
      error: null,
    },
  };
}

/**
 * 世界線にイベントを追加
 */
export function addEventToWorldLine(
  worldLine: WorldLine,
  event: ScenarioEvent
): WorldLine {
  return {
    ...worldLine,
    events: [...worldLine.events, event],
    updatedAt: new Date(),
    result: {
      ...worldLine.result,
      simulation: null,
      margin: null,
      kpis: null,
      lastCalculatedAt: null,
    },
  };
}

/**
 * 世界線からイベントを削除
 */
export function removeEventFromWorldLine(
  worldLine: WorldLine,
  eventId: string
): WorldLine {
  return {
    ...worldLine,
    events: worldLine.events.filter(e => e.id !== eventId),
    updatedAt: new Date(),
    result: {
      ...worldLine.result,
      simulation: null,
      margin: null,
      kpis: null,
      lastCalculatedAt: null,
    },
  };
}

/**
 * KPIの健全性を評価
 */
export function evaluateKpiHealth(kpis: KeyPerformanceIndicators): 'excellent' | 'good' | 'fair' | 'poor' {
  if (kpis.survivalRate >= 90 && kpis.safeFireAge !== null && kpis.assetsAt60 > 5000) {
    return 'excellent';
  }
  if (kpis.survivalRate >= 70 && kpis.assetsAt60 > 3000) {
    return 'good';
  }
  if (kpis.survivalRate >= 50) {
    return 'fair';
  }
  return 'poor';
}

/**
 * 安全な数値取得（NaN/undefined対応）
 */
function safeNumber(value: number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
}

/**
 * 2つの世界線を比較
 * NaN/undefined値は安全にフォールバック
 */
export function compareWorldLines(
  worldLineA: WorldLine,
  worldLineB: WorldLine
): WorldLineComparison | null {
  const kpisA = worldLineA.result.kpis;
  const kpisB = worldLineB.result.kpis;
  const marginA = worldLineA.result.margin;
  const marginB = worldLineB.result.margin;
  
  // KPIまたはマージンがない場合はnullを返す
  if (!kpisA || !kpisB || !marginA || !marginB) {
    return null;
  }
  
  // 差分を計算（NaN安全）
  const differences = {
    safeFireAge: safeNumber(kpisB.safeFireAge, 100) - safeNumber(kpisA.safeFireAge, 100),
    assetsAt60: safeNumber(kpisB.assetsAt60) - safeNumber(kpisA.assetsAt60),
    survivalRate: safeNumber(kpisB.survivalRate) - safeNumber(kpisA.survivalRate),
    monthlyNetSavings: safeNumber(marginB.money.monthlyNetSavings) - safeNumber(marginA.money.monthlyNetSavings),
    emergencyFundCoverage: safeNumber(marginB.money.emergencyFundCoverage) - safeNumber(marginA.money.emergencyFundCoverage),
  };
  
  // 推奨判定
  let recommendation: 'A' | 'B' | 'neutral' = 'neutral';
  let recommendationReason = '両方の選択肢に一長一短があります。';
  
  // FIRE年齢が早く、生存率も高いほうを推奨
  const scoreA = (kpisA.safeFireAge ? 100 - kpisA.safeFireAge : 0) + safeNumber(kpisA.survivalRate);
  const scoreB = (kpisB.safeFireAge ? 100 - kpisB.safeFireAge : 0) + safeNumber(kpisB.survivalRate);
  
  if (scoreB > scoreA + 10) {
    recommendation = 'B';
    recommendationReason = `${worldLineB.name}の方がFIRE達成と資産維持の両面で優れています。`;
  } else if (scoreA > scoreB + 10) {
    recommendation = 'A';
    recommendationReason = `${worldLineA.name}の方がFIRE達成と資産維持の両面で優れています。`;
  }
  
  return {
    worldLineA,
    worldLineB,
    differences,
    recommendation,
    recommendationReason,
  };
}
