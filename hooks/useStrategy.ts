'use client';

import { useMemo } from 'react';
import type { Profile, SimulationResult } from '@/lib/types';
import type { MoneyMargin } from '@/lib/v2/margin';
import type { WorldLine } from '@/lib/v2/worldline';
import type { MoneyMarginV2, TimeMarginV2, RiskMarginV2 } from '@/hooks/useMargin';

// Types used by this hook (not exported from strategy.ts)
export type ImpactLevel = 'high' | 'medium' | 'low';
export type TimeHorizon = 'short' | 'medium' | 'long';

export interface StrategyRecommendation {
  id: string;
  name: string;
  description: string;
  confidence: number;
  expectedOutcome: {
    scoreImprovement: number;
    timeToFire: number | null;
    riskReduction: number;
  };
  requiredActions: string[];
  assumptions: string[];
}

export interface ActionPriority {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: string;
  timeHorizon: TimeHorizon;
  category: string;
  estimatedBenefit: string;
}

// Strategy evaluation result
export interface StrategyEvaluation {
  primaryStrategy: StrategyRecommendation;
  alternativeStrategies: StrategyRecommendation[];
  urgentActions: ActionPriority[];
  strategicInsights: StrategicInsight[];
  overallAssessment: OverallAssessment;
}

export interface StrategicInsight {
  id: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  relevance: number; // 0-100
}

export interface OverallAssessment {
  readinessLevel: 'not_ready' | 'needs_work' | 'on_track' | 'ready' | 'excellent';
  confidenceScore: number; // 0-100
  keyMessage: string;
  timeToGoal: number | null; // years, null if not achievable
}

interface UseStrategyProps {
  profile: Profile;
  simResult: SimulationResult | null;
  margins: {
    money: MoneyMarginV2 | null;
    time: TimeMarginV2 | null;
    risk: RiskMarginV2 | null;
  };
  worldLines: WorldLine[] | { id: string; name: string; profile: Profile; result: SimulationResult }[];
}

// Determine readiness level from score
function getReadinessLevel(score: number): OverallAssessment['readinessLevel'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'ready';
  if (score >= 60) return 'on_track';
  if (score >= 40) return 'needs_work';
  return 'not_ready';
}

// Generate strategic insights based on margins and simulation
function generateInsights(
  profile: Profile,
  simResult: SimulationResult | null,
  margins: UseStrategyProps['margins']
): StrategicInsight[] {
  const insights: StrategicInsight[] = [];
  
  if (!simResult) return insights;
  
  const { score, metrics } = simResult;
  
  // Strengths
  if (score.survival >= 80) {
    insights.push({
      id: 'strength-survival',
      category: 'strength',
      title: '高い生存確率',
      description: `${metrics.survivalRate.toFixed(0)}%の確率で資産が枯渇しません。`,
      relevance: 95,
    });
  }
  
  if (margins.money && margins.money.monthlyNetSavings > 20) {
    insights.push({
      id: 'strength-cashflow',
      category: 'strength',
      title: '健全なキャッシュフロー',
      description: `月${margins.money.monthlyNetSavings.toFixed(0)}万円の余裕があります。`,
      relevance: 90,
    });
  }
  
  // Weaknesses
  if (score.liquidity < 50) {
    insights.push({
      id: 'weakness-liquidity',
      category: 'weakness',
      title: '流動性リスク',
      description: '緊急時の資金確保に課題があります。',
      relevance: 85,
    });
  }
  
  if (score.risk < 50) {
    insights.push({
      id: 'weakness-risk',
      category: 'weakness',
      title: '高いリスク露出',
      description: '市場変動への耐性が低い状態です。',
      relevance: 80,
    });
  }
  
  // Opportunities
  if (profile.currentAge < 40 && margins.time && margins.time.yearsToTarget > 10) {
    insights.push({
      id: 'opportunity-time',
      category: 'opportunity',
      title: '時間の優位性',
      description: '複利効果を最大限活用できる時間があります。',
      relevance: 90,
    });
  }
  
  if (profile.rsuAnnual > 0) {
    insights.push({
      id: 'opportunity-rsu',
      category: 'opportunity',
      title: 'RSU収入の活用',
      description: 'RSU収入を戦略的に活用する余地があります。',
      relevance: 75,
    });
  }
  
  // Threats
  if (profile.inflationRate > 2.5) {
    insights.push({
      id: 'threat-inflation',
      category: 'threat',
      title: 'インフレリスク',
      description: '高インフレが資産価値を侵食する可能性があります。',
      relevance: 70,
    });
  }
  
  return insights.sort((a, b) => b.relevance - a.relevance);
}

// Generate action priorities
function generateActions(
  profile: Profile,
  simResult: SimulationResult | null,
  margins: UseStrategyProps['margins']
): ActionPriority[] {
  const actions: ActionPriority[] = [];
  
  if (!simResult) return actions;
  
  const { score } = simResult;
  
  // Emergency fund action
  if (score.liquidity < 60) {
    actions.push({
      id: 'action-emergency-fund',
      title: '緊急資金の確保',
      description: '生活費6ヶ月分の流動性資金を確保してください。',
      impact: 'high' as ImpactLevel,
      effort: 'medium',
      timeHorizon: 'short' as TimeHorizon,
      category: 'liquidity',
      estimatedBenefit: '+15点のスコア改善',
    });
  }
  
  // Scenario exploration
  if (score.overall < 80) {
    actions.push({
      id: 'action-explore-scenarios',
      title: '年収ダウンシナリオの検証',
      description: '分岐ビルダーで年収-20%の世界線を追加し、耐性を確認しましょう。',
      impact: 'high' as ImpactLevel,
      effort: 'low',
      timeHorizon: 'medium' as TimeHorizon,
      category: 'scenario',
      estimatedBenefit: 'リスク耐性の可視化',
    });
  }
  
  // Worldline comparison
  if (profile.livingCostAnnual > profile.grossIncome * 0.4) {
    actions.push({
      id: 'action-compare-worldlines',
      title: '世界線比較で余白を確認',
      description: '支出が高い状態での世界線を比較し、余白の違いを可視化しましょう。',
      impact: 'medium' as ImpactLevel,
      effort: 'low',
      timeHorizon: 'short' as TimeHorizon,
      category: 'scenario',
      estimatedBenefit: '意思決定の判断材料',
    });
  }

  // Pace-down scenario
  if (profile.currentAge < 50) {
    actions.push({
      id: 'action-pacedown',
      title: 'ペースダウン世界線を試す',
      description: '分岐ビルダーで年収半減シナリオを追加し、選択の余白を探りましょう。',
      impact: 'high' as ImpactLevel,
      effort: 'low',
      timeHorizon: 'medium' as TimeHorizon,
      category: 'scenario',
      estimatedBenefit: '将来の選択肢の可視化',
    });
  }

  // Housing scenario for renters
  if (profile.homeStatus === 'renter') {
    actions.push({
      id: 'action-housing-scenario',
      title: '住宅購入シナリオの追加',
      description: '分岐ビルダーで購入世界線を追加し、賃貸継続との違いを比較しましょう。',
      impact: 'medium' as ImpactLevel,
      effort: 'low',
      timeHorizon: 'short' as TimeHorizon,
      category: 'scenario',
      estimatedBenefit: '住宅判断の材料',
    });
  }
  
  return actions;
}

// Generate primary strategy recommendation
function generatePrimaryStrategy(
  profile: Profile,
  simResult: SimulationResult | null,
  margins: UseStrategyProps['margins'],
  _worldLines: unknown[]
): StrategyRecommendation {
  if (!simResult) {
    return {
      id: 'strategy-default',
      name: '基本戦略',
      description: 'シミュレーション結果を待っています...',
      confidence: 0,
      expectedOutcome: {
        scoreImprovement: 0,
        timeToFire: null,
        riskReduction: 0,
      },
      requiredActions: [],
      assumptions: [],
    };
  }
  
  const { score, metrics } = simResult;
  const yearsToFire = metrics.fireAge ? metrics.fireAge - profile.currentAge : null;
  
  // Determine strategy based on current state
  let strategyType: 'aggressive' | 'balanced' | 'conservative' | 'defensive';
  
  if (score.overall >= 75 && margins.time && margins.time.yearsToTarget > 5) {
    strategyType = 'aggressive';
  } else if (score.overall >= 60) {
    strategyType = 'balanced';
  } else if (score.overall >= 40) {
    strategyType = 'conservative';
  } else {
    strategyType = 'defensive';
  }
  
  const strategies: Record<typeof strategyType, StrategyRecommendation> = {
    aggressive: {
      id: 'strategy-aggressive',
      name: '積極成長戦略',
      description: '余裕を活かして資産成長を加速させ、より早いFIRE達成を目指します。',
      confidence: Math.min(95, score.overall + 10),
      expectedOutcome: {
        scoreImprovement: 10,
        timeToFire: yearsToFire ? Math.max(1, yearsToFire - 2) : null,
        riskReduction: -5,
      },
      requiredActions: ['分岐ビルダーで攻めの世界線を追加', '世界線比較で余白を確認'],
      assumptions: ['市場が平均的に推移', '収入が維持される'],
    },
    balanced: {
      id: 'strategy-balanced',
      name: 'バランス戦略',
      description: 'リスクとリターンのバランスを取りながら、着実にゴールを目指します。',
      confidence: Math.min(90, score.overall + 15),
      expectedOutcome: {
        scoreImprovement: 15,
        timeToFire: yearsToFire,
        riskReduction: 10,
      },
      requiredActions: ['年収ダウンシナリオを分岐ビルダーで検証', '世界線比較で余白バランスを確認'],
      assumptions: ['計画通りの貯蓄', 'インフレ率が想定内'],
    },
    conservative: {
      id: 'strategy-conservative',
      name: '安定優先戦略',
      description: 'まずは基盤を固め、リスクを抑えながら確実性を高めます。',
      confidence: Math.min(85, score.overall + 20),
      expectedOutcome: {
        scoreImprovement: 20,
        timeToFire: yearsToFire ? yearsToFire + 2 : null,
        riskReduction: 25,
      },
      requiredActions: ['分岐ビルダーでペースダウン世界線を試す', '住宅購入タイミングを世界線比較で検討'],
      assumptions: ['支出削減が可能', '収入が安定'],
    },
    defensive: {
      id: 'strategy-defensive',
      name: '立て直し戦略',
      description: '現状の課題を解決し、FIRE計画の再構築を図ります。',
      confidence: Math.min(75, score.overall + 25),
      expectedOutcome: {
        scoreImprovement: 30,
        timeToFire: null,
        riskReduction: 40,
      },
      requiredActions: ['分岐ビルダーで前提条件を見直す', 'リタイア年齢を変えた世界線を比較'],
      assumptions: ['大きな支出削減が可能', '追加収入の確保が可能'],
    },
  };
  
  return strategies[strategyType];
}

export function useStrategy({
  profile,
  simResult,
  margins,
  worldLines,
}: UseStrategyProps): StrategyEvaluation {
  return useMemo(() => {
    const primaryStrategy = generatePrimaryStrategy(profile, simResult, margins, worldLines);
    const urgentActions = generateActions(profile, simResult, margins);
    const strategicInsights = generateInsights(profile, simResult, margins);
    
    // Overall assessment
    const overallScore = simResult?.score.overall ?? 0;
    const readinessLevel = getReadinessLevel(overallScore);
    
    const keyMessages: Record<OverallAssessment['readinessLevel'], string> = {
      excellent: 'FIRE達成の準備は万全です。計画を維持しながら、より高い目標も検討できます。',
      ready: 'FIRE達成に向けて順調です。現在の計画を継続すれば目標達成が見えています。',
      on_track: '基本的な軌道に乗っています。いくつかの改善で確実性が大きく向上します。',
      needs_work: '課題がありますが、改善の余地は十分あります。優先度の高いアクションから始めましょう。',
      not_ready: '現状では厳しい状況ですが、計画を見直すことで道は開けます。',
    };
    
    const overallAssessment: OverallAssessment = {
      readinessLevel,
      confidenceScore: primaryStrategy.confidence,
      keyMessage: keyMessages[readinessLevel],
      timeToGoal: simResult?.metrics.fireAge 
        ? simResult.metrics.fireAge - profile.currentAge 
        : null,
    };
    
    return {
      primaryStrategy,
      alternativeStrategies: [], // Could add more strategies here
      urgentActions,
      strategicInsights,
      overallAssessment,
    };
  }, [profile, simResult, margins, worldLines]);
}
