'use client';

/**
 * Exit Readiness OS v2 - useWorldLines フック
 * 世界線のUI状態を管理（計算はダッシュボードのSoTを参照）
 * 
 * 重要: v2タブは独自計算を行わない。
 * すべての数値はダッシュボード（useProfileStore）のsimResultを参照する。
 * 
 * v0.1: タイムラインで保存したシナリオ（scenarios）をベースラインと比較
 */

import { useCallback, useMemo } from 'react';
import { useProfileStore, type SavedScenario } from '@/lib/store';
import { 
  extractKpisFromSimulation, 
  calculateMargin,
} from '@/lib/v2/adapter';
import { type WorldLine, type WorldLineComparison } from '@/lib/v2/worldline';
import type { Profile } from '@/lib/types';

interface UseWorldLinesResult {
  // 状態（ダッシュボードSoTを参照）
  baselineWorldLine: WorldLine | null;  // 現在のプロファイル
  comparisonWorldLine: WorldLine | null; // 選択されたシナリオ
  savedScenarios: SavedScenario[];      // 保存済みシナリオ一覧
  selectedScenarioId: string | null;    // 比較対象のシナリオID
  isCalculating: boolean;
  
  // シナリオ操作
  selectScenario: (id: string | null) => void;
  deleteScenario: (id: string) => void;
  loadScenario: (id: string) => void;
  
  // 比較結果
  comparison: WorldLineComparison | null;
}

/**
 * 世界線を管理するカスタムフック
 * v0.1: baseline（現状プロファイル）+ 保存済みシナリオの2本比較
 * 計算は行わず、ダッシュボードのsimResultを参照するだけ
 */
export function useWorldLines(): UseWorldLinesResult {
  const { 
    profile, 
    simResult, 
    isLoading,
    scenarios,
    comparisonIds,
    toggleComparison,
    deleteScenario: storeDeleteScenario,
    loadScenario: storeLoadScenario,
  } = useProfileStore();
  
  // 選択中のシナリオID（v0.1では1つまで）
  const selectedScenarioId = comparisonIds.length > 0 ? comparisonIds[0] : null;
  
  // ベースライン世界線: 現在のプロファイルとsimResult
  const baselineWorldLine = useMemo<WorldLine | null>(() => {
    if (!profile) return null;
    
    const margin = simResult ? calculateMargin(profile, simResult) : null;
    const kpis = simResult ? extractKpisFromSimulation(simResult, profile) : null;
    
    return {
      id: 'baseline',
      name: '現状',
      description: '現在のプロファイル設定',
      baseProfile: profile,
      events: [],
      isBaseline: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      result: {
        simulation: simResult,
        margin,
        kpis,
        isCalculating: isLoading,
        lastCalculatedAt: simResult ? new Date() : null,
        error: null,
      },
    };
  }, [profile, simResult, isLoading]);
  
  // 比較用世界線: 選択されたシナリオ
  const comparisonWorldLine = useMemo<WorldLine | null>(() => {
    if (!selectedScenarioId) return null;
    
    const scenario = scenarios.find(s => s.id === selectedScenarioId);
    if (!scenario) return null;
    
    const scenarioProfile = scenario.profile;
    const scenarioResult = scenario.result;
    
    const margin = scenarioResult ? calculateMargin(scenarioProfile, scenarioResult) : null;
    const kpis = scenarioResult ? extractKpisFromSimulation(scenarioResult, scenarioProfile) : null;
    
    return {
      id: scenario.id,
      name: scenario.name,
      description: `保存日時: ${new Date(scenario.createdAt).toLocaleString('ja-JP')}`,
      baseProfile: scenarioProfile,
      events: [],
      isBaseline: false,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.createdAt),
      result: {
        simulation: scenarioResult,
        margin,
        kpis,
        isCalculating: false,
        lastCalculatedAt: scenarioResult ? new Date(scenario.createdAt) : null,
        error: null,
      },
    };
  }, [selectedScenarioId, scenarios]);
  
  // シナリオの選択/解除
  const selectScenario = useCallback((id: string | null) => {
    // 既存の選択をクリアしてから新しいものを選択
    if (selectedScenarioId) {
      toggleComparison(selectedScenarioId);
    }
    if (id) {
      toggleComparison(id);
    }
  }, [selectedScenarioId, toggleComparison]);
  
  // シナリオの削除
  const deleteScenario = useCallback((id: string) => {
    storeDeleteScenario(id);
  }, [storeDeleteScenario]);
  
  // シナリオのロード（プロファイルを置き換え）
  const loadScenario = useCallback((id: string) => {
    storeLoadScenario(id);
  }, [storeLoadScenario]);
  
  // 比較結果
  const comparison = useMemo<WorldLineComparison | null>(() => {
    if (!baselineWorldLine || !comparisonWorldLine) return null;
    
    const baseKpis = baselineWorldLine.result.kpis;
    const compKpis = comparisonWorldLine.result.kpis;
    
    if (!baseKpis || !compKpis) return null;
    
    // 安全な数値取得
    const safeNum = (v: number | null | undefined) => 
      (v !== null && v !== undefined && !isNaN(v) && isFinite(v)) ? v : 0;
    
    return {
      fireAgeDiff: safeNum(compKpis.safeFireAge) - safeNum(baseKpis.safeFireAge),
      assetsAt60Diff: safeNum(compKpis.assetsAt60) - safeNum(baseKpis.assetsAt60),
      survivalRateDiff: safeNum(compKpis.survivalRate) - safeNum(baseKpis.survivalRate),
      midlifeSurplusDiff: safeNum(compKpis.midlifeSurplus) - safeNum(baseKpis.midlifeSurplus),
      recommendation: generateRecommendation(baseKpis, compKpis, comparisonWorldLine.name),
    };
  }, [baselineWorldLine, comparisonWorldLine]);
  
  return {
    baselineWorldLine,
    comparisonWorldLine,
    savedScenarios: scenarios,
    selectedScenarioId,
    isCalculating: isLoading,
    selectScenario,
    deleteScenario,
    loadScenario,
    comparison,
  };
}

/**
 * 比較結果から推奨を生成
 */
function generateRecommendation(
  baseKpis: NonNullable<WorldLine['result']['kpis']>,
  compKpis: NonNullable<WorldLine['result']['kpis']>,
  scenarioName: string
): string {
  const safeNum = (v: number | null | undefined) => 
    (v !== null && v !== undefined && !isNaN(v) && isFinite(v)) ? v : 0;
  
  const fireAgeDiff = safeNum(compKpis.safeFireAge) - safeNum(baseKpis.safeFireAge);
  const survivalDiff = safeNum(compKpis.survivalRate) - safeNum(baseKpis.survivalRate);
  
  if (fireAgeDiff < 0 && survivalDiff >= 0) {
    return `「${scenarioName}」の方がFIRE達成が${Math.abs(fireAgeDiff)}年早くなります`;
  }
  if (fireAgeDiff > 0 && survivalDiff <= 0) {
    return `現状の方がFIRE達成が${fireAgeDiff}年早くなります`;
  }
  if (survivalDiff > 5) {
    return `「${scenarioName}」の方が資産維持の確率が${survivalDiff.toFixed(0)}%高くなります`;
  }
  if (survivalDiff < -5) {
    return `現状の方が資産維持の確率が${Math.abs(survivalDiff).toFixed(0)}%高くなります`;
  }
  
  return '両シナリオに大きな差はありません';
}
