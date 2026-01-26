'use client';

/**
 * Exit Readiness OS v2 - ConclusionCard
 * 結論を1行で表示するカード
 */

import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { KeyPerformanceIndicators } from '@/lib/v2/worldline';
import { cn } from '@/lib/utils';

interface ConclusionCardProps {
  kpis: KeyPerformanceIndicators | null;
  goalLens?: 'stability' | 'growth' | 'balance';
  isLoading?: boolean;
}

export function ConclusionCard({ kpis, goalLens = 'balance', isLoading }: ConclusionCardProps) {
  if (isLoading || !kpis) {
    return (
      <div className="animate-pulse rounded-xl bg-muted p-6">
        <div className="h-8 w-3/4 rounded bg-muted-foreground/20" />
        <div className="mt-2 h-4 w-1/2 rounded bg-muted-foreground/10" />
      </div>
    );
  }

  const hasGoal = kpis.safeFireAge !== null;
  const isGoodResult = hasGoal && kpis.survivalRate >= 70;
  
  // 結論テキストを生成
  const conclusionText = hasGoal
    ? `現在のプランでは、${kpis.safeFireAge}歳で安心ラインに届きます。`
    : '現在のプランでは安心ラインに届きにくい状況です。次の一手を検討しましょう。';
  
  // ゴールレンズのラベル
  const lensLabels = {
    stability: '安定性重視',
    growth: '成長重視',
    balance: 'バランス重視',
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 transition-all bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800"
    >
      {/* 背景装飾 */}
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      
      {/* アイコン */}
      <div className="mb-4 flex items-center gap-3">
        {isGoodResult ? (
          <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
            <CheckCircle2 className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
        ) : (
          <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
            <AlertTriangle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          1. 結論
        </span>
      </div>
      
      {/* 結論テキスト */}
      <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-800 dark:text-gray-200">
        {conclusionText}
      </h2>
      
      {/* 前提条件 */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Target className="h-4 w-4" />
        <span>前提: {lensLabels[goalLens]}のゴールレンズ</span>
      </div>
      
      {/* 追加情報 */}
      {hasGoal && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            <p className="text-xs text-muted-foreground">100歳まで資産が持つ確率</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {kpis.survivalRate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">60歳時点の資産</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {(kpis.assetsAt60 / 10000).toFixed(1)}億円
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
