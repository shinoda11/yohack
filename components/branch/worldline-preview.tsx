'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import type { WorldlineCandidate } from '@/lib/branch';
import { findMostImpactfulBranch } from '@/lib/branch';
import { cn } from '@/lib/utils';

interface WorldlinePreviewProps {
  candidates: WorldlineCandidate[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onCompare: () => void;
  onBack: () => void;
}

export function WorldlinePreview({
  candidates,
  selectedIds,
  onToggle,
  onCompare,
  onBack,
}: WorldlinePreviewProps) {
  const baseline = candidates.find((c) => c.id === 'baseline');
  const baselineScore = baseline?.score ?? 0;
  const impact = findMostImpactfulBranch(candidates);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">世界線候補</h2>
        <span className="text-xs text-muted-foreground">{candidates.length}本生成</span>
      </div>

      <div className="space-y-2">
        {candidates.map((c) => {
          const isSelected = selectedIds.has(c.id);
          const diff = c.score != null && baselineScore > 0 ? c.score - baselineScore : null;
          const diffLabel =
            diff != null && c.id !== 'baseline'
              ? diff >= 0
                ? `+${diff}`
                : `${diff}`
              : null;

          return (
            <label
              key={c.id}
              className={cn(
                'flex items-center gap-4 min-h-[44px] px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                isSelected ? 'border-brand-gold bg-accent/30' : 'border-border hover:bg-accent/50'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(c.id)}
                className="shrink-0"
              />
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-foreground">{c.label}</span>
                  {diffLabel && (
                    <span
                      className={cn(
                        'text-xs font-normal px-1.5 py-0.5 rounded-lg',
                        diff! >= 0
                          ? 'bg-safe/10 text-safe'
                          : 'bg-red-50 text-red-700'
                      )}
                    >
                      {diffLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
              </div>
              {c.score != null && (
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold tabular-nums" style={{ color: c.color }}>
                    {c.score}
                  </div>
                  <div className="text-[10px] text-muted-foreground">スコア</div>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* Discovery card */}
      {impact && (
        <div className="flex items-start gap-4 rounded-lg border border-brand-gold/30 bg-brand-gold/5 p-4">
          <Lightbulb className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-normal text-foreground">発見</p>
            <p className="text-xs text-muted-foreground">
              「{impact.branch.label}」がスコアに最も影響（{impact.scoreDiff > 0 ? '-' : '+'}{Math.abs(impact.scoreDiff)}点）
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          分岐を編集
        </Button>
        <Button
          size="sm"
          onClick={onCompare}
          disabled={selectedIds.size < 2}
          className="flex-1 gap-1 bg-brand-gold text-white hover:bg-brand-gold/90"
        >
          選んだ世界線を比較する
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
