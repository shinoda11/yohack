'use client';

import React from "react"

import { Gauge, Calendar, PiggyBank, ShieldCheck } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeyMetrics } from '@/lib/types';
import { cn } from '@/lib/utils';

interface KeyMetricsCardProps {
  metrics: KeyMetrics | null;
  currentAge: number;
  targetRetireAge: number;
  isLoading?: boolean;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: 'success' | 'warning' | 'danger' | 'neutral';
}

// Semantic colors using Tailwind standard classes
function getHighlightStyles(highlight?: 'success' | 'warning' | 'danger' | 'neutral') {
  switch (highlight) {
    case 'success':
      return {
        icon: 'text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      };
    case 'warning':
      return {
        icon: 'text-amber-600 dark:text-amber-400',
        value: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
      };
    case 'danger':
      return {
        icon: 'text-red-600 dark:text-red-400',
        value: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-50 dark:bg-red-950/20',
      };
    default:
      return {
        icon: 'text-muted-foreground',
        value: 'text-foreground',
        bg: '',
      };
  }
}

function MetricItem({
  icon,
  label,
  value,
  subValue,
  highlight,
}: MetricItemProps) {
  const styles = getHighlightStyles(highlight);
  
  return (
    <div className={cn("flex items-center gap-3 py-3 px-2 rounded-lg", styles.bg)}>
      <div className={cn("flex h-8 w-8 items-center justify-center", styles.icon)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn("text-lg font-semibold tabular-nums", styles.value)}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );
}

export function KeyMetricsCard({
  metrics,
  currentAge,
  targetRetireAge,
  isLoading,
}: KeyMetricsCardProps) {
  // 初回ロード時のみスケルトン表示、以降は前の値を保持
  if (!metrics) {
    return (
      <SectionCard
        icon={<Gauge className="h-5 w-5" />}
        title="主要指標"
        description="シミュレーション結果のサマリー"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </SectionCard>
    );
  }

  // Determine goal feasibility - use fireAge (not goalAge which doesn't exist)
  const goalAgeText = metrics.fireAge
    ? `${metrics.fireAge}歳`
    : '達成困難';
  const yearsToGoalText = metrics.yearsToFire
    ? `あと${metrics.yearsToFire}年`
    : undefined;
  const goalHighlight =
    metrics.fireAge && metrics.fireAge <= targetRetireAge
      ? 'success'
      : metrics.fireAge
        ? 'warning'
        : 'danger';

  // Determine survival rate color
  const survivalHighlight =
    metrics.survivalRate >= 90
      ? 'success'
      : metrics.survivalRate >= 70
        ? 'warning'
        : 'danger';

  // Format asset at 100
  const assetAt100Text =
    metrics.assetAt100 >= 0
      ? `${metrics.assetAt100.toLocaleString()}万円`
      : `${Math.abs(metrics.assetAt100).toLocaleString()}万円の不足`;
  const assetHighlight = metrics.assetAt100 >= 0 ? 'success' : 'danger';

  // Years until target retirement
  const yearsUntilTarget = targetRetireAge - currentAge;

  return (
    <SectionCard
      icon={<Gauge className="h-5 w-5" />}
      title="主要指標"
      description="シミュレーション結果のサマリー"
      action={isLoading && <span className="text-xs text-gray-400">更新中...</span>}
    >
      <div className={cn("grid gap-2 md:grid-cols-2", isLoading && "opacity-60")}>
        <MetricItem
          icon={<Calendar className="h-5 w-5" />}
          label="安心ライン到達年齢"
          value={goalAgeText}
          subValue={yearsToGoalText}
          highlight={goalHighlight}
        />
        <MetricItem
          icon={<ShieldCheck className="h-5 w-5" />}
          label="余白維持率"
          value={`${metrics.survivalRate.toFixed(1)}%`}
          subValue="100歳まで余白が続く確率"
          highlight={survivalHighlight}
        />
        <MetricItem
          icon={<PiggyBank className="h-5 w-5" />}
          label="100歳時点の余白"
          value={assetAt100Text}
          subValue="中央値シナリオ"
          highlight={assetHighlight}
        />
        <MetricItem
          icon={<Gauge className="h-5 w-5" />}
          label="安心ラインまで"
          value={`${yearsUntilTarget}年`}
          subValue={`${targetRetireAge}歳が目標`}
          highlight="neutral"
        />
      </div>
    </SectionCard>
  );
}
