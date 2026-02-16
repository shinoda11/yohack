'use client';

/**
 * YOHACK v2 - DecisionHost
 * 意思決定の主画面（結論→理由→次の一手）
 */

import { useEffect } from 'react';
import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { ConclusionCard } from './ConclusionCard';
import { ReasonCard } from './ReasonCard';
import { NextStepCard } from './NextStepCard';
import { MoneyMarginCard } from './MoneyMarginCard';
import { Skeleton } from '@/components/ui/skeleton';
import { extractKpisFromSimulation, calculateMargin } from '@/lib/v2/adapter';
import { generateStrategyLevers } from '@/lib/v2/strategy';
import type { KeyPerformanceIndicators } from '@/lib/v2/worldline';
import type { StrategyLever } from '@/lib/v2/strategy';

export function DecisionHost() {
  const { profile, simResult, isLoading } = useProfileStore();
  const { goalLens } = useV2Store();
  
  // 余白の計算
  const { moneyMargin, moneyHealth } = useMargin(profile, simResult);
  
  // KPIの抽出
  const kpis: KeyPerformanceIndicators | null = simResult 
    ? extractKpisFromSimulation(simResult, profile)
    : null;
  
  // 戦略レバーの生成
  const levers: StrategyLever[] = kpis && simResult
    ? generateStrategyLevers({
        id: 'current',
        name: '現状',
        description: '',
        baseProfile: profile,
        events: [],
        isBaseline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        result: {
          simulation: simResult,
          margin: calculateMargin(profile, simResult),
          kpis,
          isCalculating: false,
          lastCalculatedAt: new Date(),
          error: null,
        },
      })
    : [];
  
  // 戦略を適用するハンドラー
  const handleApplyStrategy = (_lever: StrategyLever) => {
    // 世界線テンプレートでの比較はダッシュボードから実行
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. 結論 */}
      <ConclusionCard 
        kpis={kpis} 
        goalLens={goalLens}
        isLoading={isLoading && !simResult}
      />
      
      {/* 2. 理由 */}
      <ReasonCard 
        kpis={kpis}
        isLoading={isLoading && !simResult}
      />
      
      {/* お金の余白 */}
      <MoneyMarginCard
        moneyMargin={moneyMargin}
        health={moneyHealth}
        isLoading={isLoading && !simResult}
      />
      
      {/* 3. 次の一手 */}
      <NextStepCard
        levers={levers}
        isLoading={isLoading && !simResult}
        onApplyStrategy={handleApplyStrategy}
      />
    </div>
  );
}
