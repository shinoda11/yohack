'use client';

import { useProfileStore } from '@/lib/store';

/**
 * 小型スコアウィジェット — プロファイルページ上部に固定表示
 * simResult がない場合は非表示
 */
export function ScoreWidget() {
  const simResult = useProfileStore((s) => s.simResult);

  if (!simResult) return null;

  const score = simResult.score.overall;
  const survivalRate = simResult.metrics.survivalRate;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-light tabular-nums text-brand-night">
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="h-6 w-px bg-border" />
      <div className="text-xs text-muted-foreground tabular-nums">
        生存率 {Math.round(survivalRate)}%
      </div>
    </div>
  );
}
