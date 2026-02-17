/**
 * Exit Readiness OS v2 - 世界線 (WorldLine)
 * ユーザーの一つの「選択肢」を表現する単位
 */

import type { Profile, SimulationResult } from '@/lib/types';
import type { Margin } from './margin';

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
  events: unknown[];             // この世界線で発生するイベントのリスト
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
 * 新しい世界線を作成
 */
export function createWorldLine(
  name: string,
  description: string,
  baseProfile: Profile,
  events: unknown[] = [],
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
