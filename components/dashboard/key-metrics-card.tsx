'use client';

import React from "react"

import { Gauge, Calendar, PiggyBank, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TermTooltip } from '@/components/ui/term-tooltip';
import { glossary } from '@/lib/glossary';
import { formatCurrency, formatPercent } from '@/lib/types';
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
  label: React.ReactNode;
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
        icon: 'text-[#8A7A62]',
        value: 'text-[#8A7A62]',
        bg: '',
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
  const isDanger = highlight === 'danger';
  const isWarning = highlight === 'warning';
  const showAlert = isDanger || isWarning;

  return (
    <div className={cn(
      "flex items-center gap-4 py-4 px-2 rounded-lg transition-all duration-[600ms] ease-out",
      styles.bg,
      isDanger && "border-2 border-danger/40 dark:border-danger/30",
      isWarning && "border border-amber-400/40 dark:border-amber-500/30",
    )}>
      <div className={cn("flex h-8 w-8 items-center justify-center", styles.icon)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-brand-bronze dark:text-brand-bronze/60">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className={cn("text-xl font-bold font-[family-name:var(--font-dm-sans)] tabular-nums transition-colors duration-[600ms]", styles.value)}>
            {value}
          </p>
          {showAlert && (
            <AlertTriangle className={cn(
              "h-4 w-4 flex-shrink-0",
              "text-[#8A7A62]",
            )} />
          )}
        </div>
        {subValue && (
          <p className="text-xs text-brand-bronze/60 dark:text-brand-bronze">{subValue}</p>
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
  // 初回ロード中はスケルトン、データなし時は空状態
  if (!metrics) {
    return (
      <SectionCard
        icon={<Gauge className="h-5 w-5" />}
        title="余白の見通し"
        description="主要な数値の概要"
      >
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            プロファイルを入力すると、ここに見通しが表示されます
          </p>
        )}
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
      ? formatCurrency(metrics.assetAt100)
      : `${formatCurrency(Math.abs(metrics.assetAt100))}の不足`;
  const assetHighlight = metrics.assetAt100 >= 0 ? 'success' : 'danger';

  // Years until target retirement
  const yearsUntilTarget = targetRetireAge - currentAge;

  return (
    <SectionCard
      icon={<Gauge className="h-5 w-5" />}
      title="余白の見通し"
      description="主要な数値の概要"
      action={isLoading && <Skeleton className="h-3 w-12" />}
    >
      <div className={cn("grid gap-2 sm:grid-cols-2", isLoading && "opacity-60")}>
        <MetricItem
          icon={<Calendar className="h-5 w-5" />}
          label={<><TermTooltip term="安心ライン" description={glossary['安心ライン']} />到達年齢</>}
          value={goalAgeText}
          subValue={yearsToGoalText}
          highlight={goalHighlight}
        />
        <MetricItem
          icon={<ShieldCheck className="h-5 w-5" />}
          label={<TermTooltip term="余白維持率" description={glossary['余白維持率']} />}
          value={formatPercent(metrics.survivalRate)}
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
