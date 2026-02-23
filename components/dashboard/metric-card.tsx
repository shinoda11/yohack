'use client';

import { cn } from '@/lib/utils';

type MetricCardVariant = 'default' | 'emphasized' | 'compact';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  variant?: MetricCardVariant;
  className?: string;
}

/**
 * 統一メトリクスカード
 *
 * - default:    bg-muted/50 カード。資産推移・モンテカルロ・取り崩しの独立メトリクス
 * - emphasized: 背景なし。ConclusionSummaryCard (Linen) 内の subMetrics
 * - compact:    最小。ExitReadinessCard のサブスコア等
 */
export function MetricCard({
  label,
  value,
  suffix,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        variant === 'default' && 'rounded-lg bg-muted/50 p-4',
        variant === 'emphasized' && '',
        variant === 'compact' && 'py-2',
        className
      )}
    >
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <span className="text-xl font-medium tabular-nums text-foreground">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
