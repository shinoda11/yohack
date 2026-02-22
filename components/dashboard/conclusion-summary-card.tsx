'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, GitBranch, TrendingUp, TrendingDown } from 'lucide-react';
import type { ExitScoreDetail, KeyMetrics, Profile } from '@/lib/types';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { EventIcon } from '@/components/branch/event-icon';
import { cn } from '@/lib/utils';
import { useScoreAnimation } from '@/hooks/useScoreAnimation';

type Status = 'GREEN' | 'YELLOW' | 'RED' | 'CALCULATING';

interface ConclusionSummaryCardProps {
  score: ExitScoreDetail | null;
  metrics: KeyMetrics | null;
  isLoading: boolean;
  targetRetireAge: number;
  previousScore?: ExitScoreDetail | null;
  previousMetrics?: KeyMetrics | null;
  // 世界線導線
  profile?: Profile;
  onStartWorldlineComparison?: (templateId: string) => void;
  scenarioCount?: number;
  scenarioNames?: string[];
  creatingWorldline?: string | null;
}

function getStatus(score: ExitScoreDetail | null): Status {
  if (!score) return 'CALCULATING';
  if (score.overall >= 70) return 'GREEN';
  if (score.overall >= 40) return 'YELLOW';
  return 'RED';
}

function getStatusConfig(status: Status) {
  switch (status) {
    case 'GREEN':
      return {
        bgColor: 'bg-brand-gold/10 dark:bg-brand-gold/5',
        borderColor: 'border-brand-gold/30 dark:border-brand-gold/20',
        iconColor: 'text-brand-gold',
        textColor: 'text-brand-bronze',
        icon: CheckCircle2,
      };
    case 'YELLOW':
      return {
        bgColor: 'bg-brand-stone/10 dark:bg-brand-stone/10',
        borderColor: 'border-brand-stone/30 dark:border-brand-stone/20',
        iconColor: 'text-brand-stone',
        textColor: 'text-brand-stone',
        icon: AlertTriangle,
      };
    case 'RED':
      return {
        bgColor: 'bg-danger/10',
        borderColor: 'border-danger/40',
        iconColor: 'text-danger',
        textColor: 'text-danger',
        icon: XCircle,
      };
    case 'CALCULATING':
    default:
      return {
        bgColor: 'bg-secondary',
        borderColor: 'border-border',
        iconColor: 'text-muted-foreground',
        textColor: 'text-muted-foreground',
        icon: Loader2,
      };
  }
}

function generateConclusion(
  status: Status,
  metrics: KeyMetrics | null,
  targetRetireAge: number
): string {
  if (!metrics) return 'シミュレーション中です';

  const fireAge = metrics.fireAge;
  const gap = fireAge ? fireAge - targetRetireAge : null;

  if (status === 'GREEN') {
    return gap && gap < 0
      ? `目標より${Math.abs(gap)}年の余裕がありそうです`
      : '現在のペースで目標達成が見えています';
  }

  if (status === 'YELLOW') {
    return fireAge
      ? `安心ラインは${fireAge}歳の見通し（目標${targetRetireAge}歳）`
      : 'もう少しで安心ラインに届きそうです';
  }

  return gap && gap > 0
    ? `安心ラインまであと${gap}年の差があります`
    : '現在の条件では安心ラインへの到達が難しそうです';
}

// --- Change badge with auto-fade ---
function ChangeBadge({ value, unit, invertColor = false }: {
  value: number | null;
  unit: string;
  invertColor?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // Only show when value actually changes (not on first render)
    if (value === null || value === prevValue.current) return;
    prevValue.current = value;
    setVisible(true);
    setFadingOut(false);

    const fadeTimer = setTimeout(() => setFadingOut(true), 3000);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [value]);

  if (!visible || value === null) return null;

  // invertColor: for fireAge, negative = improvement
  const isImprovement = invertColor ? value < 0 : value > 0;
  const sign = value > 0 ? '+' : '';
  const displayValue = Math.round(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-normal transition-opacity duration-500',
        isImprovement
          ? 'bg-safe/10 text-safe'
          : 'bg-danger/10 text-danger',
        fadingOut && 'opacity-0'
      )}
    >
      {isImprovement ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {sign}{displayValue}{unit}
    </span>
  );
}

export function ConclusionSummaryCard({
  score,
  metrics,
  isLoading,
  targetRetireAge,
  previousScore,
  previousMetrics,
  profile,
  onStartWorldlineComparison,
  scenarioCount = 0,
  scenarioNames = [],
  creatingWorldline = null,
}: ConclusionSummaryCardProps) {
  const displayStatus = useMemo(() => {
    if (!score) return 'CALCULATING';
    return getStatus(score);
  }, [score]);

  const config = getStatusConfig(displayStatus);

  // Track score direction: up resets after 600ms, down (flash) after 300ms
  const scoreDirection = useScoreAnimation(score?.overall ?? null);

  const stateLine = useMemo(
    () => generateConclusion(displayStatus, metrics, targetRetireAge),
    [displayStatus, metrics, targetRetireAge]
  );

  // Compute changes from previous result
  const changes = useMemo(() => {
    if (!metrics || !previousMetrics) return null;

    const fireAgeDiff = previousMetrics.fireAge && metrics.fireAge
      ? metrics.fireAge - previousMetrics.fireAge
      : null;
    const survivalDiff = metrics.survivalRate - previousMetrics.survivalRate;
    const scoreDiff = score && previousScore
      ? score.overall - previousScore.overall
      : null;

    return {
      fireAge: fireAgeDiff && Math.abs(fireAgeDiff) >= 1 ? fireAgeDiff : null,
      survival: Math.abs(survivalDiff) >= 1 ? Math.round(survivalDiff * 10) / 10 : null,
      score: scoreDiff && Math.abs(scoreDiff) >= 1 ? scoreDiff : null,
    };
  }, [metrics, previousMetrics, score, previousScore]);

  return (
    <Card className={cn(
      'border relative transition-all duration-[600ms] ease-out',
      config.bgColor,
      config.borderColor,
      scoreDirection === 'up' && 'shadow-[var(--shadow-gold)]',
      scoreDirection === 'down' && 'border-danger !duration-150',
    )}>
      {/* 計算中オーバーレイ（初回ロード時） */}
      {isLoading && !score && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      )}
      {/* 計算中インジケータ（再計算時） */}
      {isLoading && score && (
        <div className="absolute top-3 right-3">
          <Loader2 className="h-3 w-3 animate-spin text-brand-bronze/40" />
        </div>
      )}
      <CardContent className="p-8">
        <p className="text-xs text-brand-bronze/60 mb-4">
          {targetRetireAge}歳を目標に試算
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-bold text-foreground leading-snug">
            {stateLine}
          </p>
          {changes && (
            <div className="flex items-center gap-1">
              <ChangeBadge value={changes.score} unit="pt" />
              <ChangeBadge value={changes.fireAge} unit="年" invertColor />
              <ChangeBadge value={changes.survival} unit="%" />
            </div>
          )}
        </div>

        {/* 世界線比較への導線 */}
        {score && profile && onStartWorldlineComparison && (() => {
          const usedNameSet = new Set(scenarioNames);
          const availableTemplates = worldlineTemplates
            .filter((t) => t.isRelevant(profile) && !usedNameSet.has(t.baselineName) && !usedNameSet.has(t.variantName))
            .slice(0, 3);

          return (
            <div className="mt-4 pt-4 border-t border-border space-y-2.5">
              {/* 世界線比較リンク（1本以上あるとき） */}
              {scenarioCount >= 1 && (
                <Link href="/app/v2" className="flex items-center gap-2 text-sm text-brand-bronze hover:text-brand-gold dark:text-brand-gold dark:hover:text-brand-gold/80 transition-colors">
                  <GitBranch className="h-4 w-4" />
                  世界線比較を見る
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}

              {/* テンプレートセクション（3本未満のとき） */}
              {scenarioCount < 3 && availableTemplates.length > 0 && (
                <>
                  <div>
                    {scenarioCount === 0 ? (
                      <>
                        <p className="text-sm text-foreground">別の選択をしたら、この結果はどう変わるか。</p>
                        <p className="text-xs text-muted-foreground mt-0.5">比較パターンを選ぶと、2つの世界線が自動で作成されます。</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">さらに世界線を追加する</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {availableTemplates.map((t) => {
                      const isCreating = creatingWorldline === t.id;
                      const isDisabled = creatingWorldline !== null;
                      return (
                        <button
                          key={t.id}
                          onClick={() => onStartWorldlineComparison(t.id)}
                          disabled={isDisabled}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                            'bg-transparent border-brand-gold/30 text-brand-bronze dark:text-brand-gold dark:border-brand-gold/20',
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-brand-gold/10 hover:border-brand-gold/50',
                          )}
                        >
                          <span className="leading-none">
                            <EventIcon iconName={t.icon} className="h-4 w-4 text-brand-bronze/60 stroke-[1.5]" />
                          </span>
                          <span className="flex-1 truncate">{t.label}</span>
                          {isCreating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  もっと詳しく分岐を設計したい場合
                </p>
                <a
                  href="/app/branch"
                  className="inline-flex items-center gap-1.5 text-sm font-normal text-brand-gold hover:text-brand-bronze transition-colors"
                >
                  分岐ビルダーを使う
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
