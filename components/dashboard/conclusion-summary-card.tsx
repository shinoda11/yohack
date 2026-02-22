'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, GitBranch } from 'lucide-react';
import type { ExitScoreDetail, KeyMetrics, Profile } from '@/lib/types';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { cn } from '@/lib/utils';
import { useScoreAnimation, useAnimatedValue } from '@/hooks/useScoreAnimation';

type Status = 'GREEN' | 'YELLOW' | 'RED' | 'CALCULATING';

interface ConclusionSummaryCardProps {
  score: ExitScoreDetail | null;
  metrics: KeyMetrics | null;
  isLoading: boolean;
  targetRetireAge: number;
  previousScore?: ExitScoreDetail | null;
  previousMetrics?: KeyMetrics | null;
  // Goal Lens前提
  workStyle?: string;
  legacyGoal?: string;
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

type ActionType = 'Income' | 'Cost' | 'Timing';

function estimateEffect(
  actionType: ActionType,
  metrics: KeyMetrics,
  gap: number | null
): string {
  const disclaimer = '（前提で変わります）';

  if (actionType === 'Income') {
    const yearsEffect = gap && gap > 0 ? Math.min(Math.ceil(gap / 3), 3) : 1;
    return `手取り+200万/年で目標が${yearsEffect}〜${yearsEffect + 1}年早まる目安${disclaimer}`;
  }

  if (actionType === 'Cost') {
    const survivalGap = 90 - metrics.survivalRate;
    if (survivalGap <= 0) {
      return `支出見直しで余裕がさらに広がる目安${disclaimer}`;
    }
    const rateEffect = Math.min(Math.ceil(survivalGap / 2), 10);
    return `支出-10%で安心度が${rateEffect}〜${rateEffect + 5}pt改善する目安${disclaimer}`;
  }

  if (actionType === 'Timing') {
    if (gap && gap > 0) {
      return `目標を2年延ばすと達成確度が上がる目安${disclaimer}`;
    }
    return `変化は小さめ。現状維持で問題なし${disclaimer}`;
  }

  return `効果は前提により異なります`;
}

function generateConclusion(
  status: Status,
  score: ExitScoreDetail | null,
  metrics: KeyMetrics | null,
  targetRetireAge: number
): {
  stateLine: string;
  actionLine: string;
  actionType: ActionType;
  effectEstimate: string;
  detailText: string;
} {
  if (!score || !metrics) {
    return {
      stateLine: 'シミュレーション中です',
      actionLine: '',
      actionType: 'Timing',
      effectEstimate: '',
      detailText: '',
    };
  }

  const fireAge = metrics.fireAge;
  const gap = fireAge ? fireAge - targetRetireAge : null;

  const scores = {
    survival: score.survival,
    lifestyle: score.lifestyle,
    risk: score.risk,
    liquidity: score.liquidity,
  };
  const weakest = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b);
  const bottleneck = weakest[0];

  if (status === 'GREEN') {
    const actionType: ActionType = 'Timing';
    return {
      stateLine: gap && gap < 0
        ? `目標より${Math.abs(gap)}年の余裕がありそうです`
        : `現在のペースで目標達成が見えています`,
      actionLine: '今のまま続けてみましょう',
      actionType,
      effectEstimate: estimateEffect(actionType, metrics, gap),
      detailText: '想定外の出費にも対応できる余白があります。支出を増やすか、目標を前倒しする選択肢もあります。',
    };
  }

  if (status === 'YELLOW') {
    let actionLine = '';
    let actionType: ActionType = 'Cost';
    let detailText = '';
    let stateLine = '目標に近づいています';

    if (bottleneck === 'survival') {
      stateLine = 'もう少しで安心ラインに届きそうです';
      actionLine = 'まずは貯蓄率を少し上げてみる';
      actionType = gap && gap > 0 ? 'Timing' : 'Income';
      detailText = '毎月の貯蓄額を増やすか、働く期間を延ばすことで改善できます。どちらを選ぶかはあなた次第です。';
    } else if (bottleneck === 'lifestyle') {
      stateLine = '支出バランスを整えると安心度が上がりそうです';
      actionLine = '退職後の支出を一度見直してみる';
      actionType = 'Cost';
      detailText = '退職後の生活費を見直すことで、安心ラインが上がります。';
    } else if (bottleneck === 'risk') {
      stateLine = '資産配分を調整すると安定感が増しそうです';
      actionLine = '安定資産の比率を検討してみる';
      actionType = 'Cost';
      detailText = '株式100%から債券や現金を混ぜることで、悲観シナリオが改善します。';
    } else {
      stateLine = '手元資金を増やすと安心感が高まりそうです';
      actionLine = '生活費6ヶ月分を目安に確保してみる';
      actionType = 'Cost';
      detailText = '緊急時に備えて、すぐ使える資金を確保しましょう。';
    }

    return {
      stateLine,
      actionLine,
      actionType,
      effectEstimate: estimateEffect(actionType, metrics, gap),
      detailText
    };
  }

  const actionType: ActionType = 'Income';
  return {
    stateLine: '調整すれば改善の余地があります',
    actionLine: gap && gap > 0
      ? 'まずは収入か目標時期を見直してみる'
      : '貯蓄ペースを上げる方法を探ってみる',
    actionType,
    effectEstimate: estimateEffect(actionType, metrics, gap),
    detailText: 'いくつかの選択肢があります。どの手を打つかは、あなたの価値観と状況で決めてください。',
  };
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
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity duration-500',
        isImprovement
          ? 'bg-safe/10 text-safe'
          : 'bg-danger/10 text-danger',
        fadingOut && 'opacity-0'
      )}
    >
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
  workStyle = '会社員',
  legacyGoal = '使い切り',
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
  // Smooth counter animation for the score number
  const animatedScore = useAnimatedValue(score?.overall ?? 0, 600);

  const { stateLine, actionLine, actionType, effectEstimate, detailText } = useMemo(
    () => generateConclusion(displayStatus, score, metrics, targetRetireAge),
    [displayStatus, score, metrics, targetRetireAge]
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

  const actionTypeLabel = {
    Income: '収入',
    Cost: '支出',
    Timing: '時期',
  }[actionType];

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
      <CardContent className="p-6">
        {/* Goal Lens前提（1行） */}
        <p className="text-xs text-brand-bronze/60 mb-4">
          前提: {workStyle} / {legacyGoal} / {targetRetireAge}歳目標
        </p>

        {/* 2行固定フォーマット */}
        <div className="space-y-4">
          {/* 1行目: 現状の評価 + 変化バッジ */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base text-foreground leading-snug">
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
            {score && (
              <span className={cn(
                "text-xl font-bold tabular-nums px-2.5 py-0.5 rounded-lg shrink-0 self-start sm:self-auto transition-all duration-[600ms] ease-out",
                score.overall >= 70 ? "bg-brand-gold/20 text-brand-bronze dark:bg-brand-gold/10" :
                score.overall >= 40 ? "bg-brand-stone/15 text-brand-stone dark:bg-brand-stone/15" :
                "bg-danger/10 text-danger",
                isLoading && "opacity-50",
                scoreDirection === 'up' && "scale-110",
                scoreDirection === 'down' && "scale-95",
              )}>
                {animatedScore}
              </span>
            )}
          </div>

          {/* 2行目: 次にやること（Top1） */}
          {actionLine && (
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                {actionLine}
              </p>
            </div>
          )}
        </div>

        {/* 詳細は折りたたみ */}
        {(detailText || effectEstimate) && (
          <details className="mt-4 pt-4 border-t border-border">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              詳しく見る
            </summary>
            <div className="mt-2 space-y-1">
              {effectEstimate && (
                <p className="text-xs text-muted-foreground">
                  {effectEstimate}
                </p>
              )}
              {detailText && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {detailText}
                </p>
              )}
            </div>
          </details>
        )}

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
                          <span className="text-base leading-none">{t.icon}</span>
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold hover:text-brand-bronze transition-colors"
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
