'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, GitBranch, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/types';
import type { ExitScoreDetail, KeyMetrics, Profile } from '@/lib/types';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { EventIcon } from '@/components/branch/event-icon';
import { cn } from '@/lib/utils';
import { useScoreAnimation, useAnimatedValue } from '@/hooks/useScoreAnimation';
import { MetricCard } from '@/components/dashboard/metric-card';

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

function getStatusConfig(_status: Status) {
  // Tier 1: fixed Linen background for all states
  return {
    bgColor: 'bg-[#F0ECE4] dark:bg-brand-stone/10',
    borderColor: 'border-transparent',
  };
}

function generateConclusion(
  metrics: KeyMetrics | null,
  targetRetireAge: number
): { headline: string; subMetrics: Array<{ label: string; value: string }> } {
  if (!metrics) return { headline: '計算中…', subMetrics: [] };

  const fireAge = metrics.fireAge;
  const gap = fireAge ? targetRetireAge - fireAge : null;

  let headline: string;
  if (!fireAge) {
    headline = '現在の条件では安心ラインに届いていません。';
  } else if (gap !== null && gap > 2) {
    headline = `${fireAge}歳で安心ライン到達。目標より${gap}年の余白。`;
  } else if (gap !== null && gap >= 0) {
    headline = `${fireAge}歳で到達。余白は${gap}年。`;
  } else {
    headline = `安心ラインは${fireAge}歳の見通し。目標の${targetRetireAge}歳まで${Math.abs(gap!)}年の差。`;
  }

  const subMetrics = [
    { label: '生存率', value: `${Math.round(metrics.survivalRate)}%` },
    { label: '安心ライン到達', value: fireAge ? `${fireAge}歳` : '—' },
    { label: '100歳時点 中央値', value: formatCurrency(metrics.assetAt100) },
  ];

  return { headline, subMetrics };
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
          : 'bg-brand-bronze/10 text-brand-bronze',
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
  const animatedScore = useAnimatedValue(score?.overall ?? 0, 800);

  const conclusion = useMemo(
    () => generateConclusion(metrics, targetRetireAge),
    [metrics, targetRetireAge]
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
      'relative transition-all duration-[800ms] ease-out shadow-md rounded-2xl border-0',
      config.bgColor,
      config.borderColor,
      scoreDirection === 'up' && 'shadow-[var(--shadow-gold)]',
      scoreDirection === 'down' && 'border-brand-bronze border !duration-150',
    )}>
      {/* 計算中オーバーレイ（初回ロード時） */}
      {isLoading && !score && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60">
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
      <CardContent className="p-6 md:p-8">
        <p className="text-xs text-brand-bronze/60 mb-4 text-center">
          {targetRetireAge}歳を目標に試算
        </p>

        {/* Score Ring — hero treatment */}
        <div className="flex flex-col items-center">
          {score && (() => {
            const vb = 160;
            const center = vb / 2;
            const radius = 64;
            const strokeWidth = 5;
            const circumference = 2 * Math.PI * radius;
            const progress = Math.min(Math.max(animatedScore, 0), 100);
            const offset = circumference - (progress / 100) * circumference;
            return (
              <div className="flex-shrink-0 w-[120px] h-[120px] sm:w-[160px] sm:h-[160px]">
                <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" height="100%">
                  <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={strokeWidth} />
                  <circle
                    cx={center} cy={center} r={radius} fill="none"
                    stroke="hsl(var(--brand-gold))"
                    strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-[stroke-dashoffset] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: `${center}px ${center}px` }}
                  />
                  <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--brand-gold))" fontSize="48" fontWeight="300">
                    {animatedScore}
                  </text>
                  <text x={center} y={center + 24} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground" fontSize="14">
                    /100
                  </text>
                </svg>
              </div>
            );
          })()}

          {/* Headline */}
          <p className="text-sm sm:text-base font-bold text-foreground leading-snug text-center mt-4">
            {conclusion.headline}
          </p>

          {/* Change badges */}
          {changes && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <ChangeBadge value={changes.score} unit="pt" />
              <ChangeBadge value={changes.fireAge} unit="年" invertColor />
              <ChangeBadge value={changes.survival} unit="%" />
            </div>
          )}

          {/* subMetrics */}
          {conclusion.subMetrics.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-gold/20 w-full">
              {conclusion.subMetrics.map((m, i) => (
                <MetricCard key={i} variant="emphasized" label={m.label} value={m.value} />
              ))}
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
