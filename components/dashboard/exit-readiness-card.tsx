'use client';

import React, { useState } from "react"

import { Target, ShieldCheck, Heart, Activity, Droplets, ChevronDown } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExitScoreDetail } from '@/lib/types';
import { cn } from '@/lib/utils';
import { findSimilarCases } from '@/lib/benchmarks';
import { useProfileStore } from '@/lib/store';
import { MetricCard } from '@/components/dashboard/metric-card';

interface ExitReadinessCardProps {
  score: ExitScoreDetail | null;
  isLoading?: boolean;
}

interface ScoreAxis {
  key: 'survival' | 'lifestyle' | 'risk' | 'liquidity';
  label: string;
  weight: number;
  icon: React.ReactNode;
}

const SCORE_AXES: ScoreAxis[] = [
  { key: 'survival', label: 'サバイバル', weight: 55, icon: <ShieldCheck className="h-4 w-4" /> },
  { key: 'lifestyle', label: '生活水準', weight: 20, icon: <Heart className="h-4 w-4" /> },
  { key: 'risk', label: 'リスク', weight: 15, icon: <Activity className="h-4 w-4" /> },
  { key: 'liquidity', label: '流動性', weight: 10, icon: <Droplets className="h-4 w-4" /> },
];

function getBarColor(value: number): string {
  if (value >= 80) return 'bg-brand-gold';
  if (value >= 50) return 'bg-brand-gold';
  return 'bg-brand-bronze';
}

function ScoreBreakdown({ score }: { score: ExitScoreDetail }) {
  return (
    <div className="w-full space-y-4 border-t pt-4">
      <div className="space-y-4">
        {SCORE_AXES.map(axis => {
          const value = score[axis.key];
          const weighted = Math.round(value * axis.weight / 100);
          return (
            <div key={axis.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {axis.icon}
                  <span>{axis.label}</span>
                  <span className="text-xs text-muted-foreground/60">({axis.weight}%)</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-bold">{value}</span>
                  <span className="text-xs text-muted-foreground">
                    (+{weighted}pt)
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/50">
                <div
                  className={cn('h-full rounded-full transition-all duration-[600ms]', getBarColor(value))}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ExitReadinessCard({ score, isLoading }: ExitReadinessCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading || !score) {
    return (
      <SectionCard
        icon={<Target className="h-5 w-5" />}
        title="スコア詳細"
      >
        <div className="flex flex-col items-center py-8">
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<Target className="h-5 w-5" />}
      title="スコア詳細"
    >
      <div className="flex flex-col items-center">
        {/* Sub-scores grid */}
        <div className="grid w-full grid-cols-2 gap-4">
          <MetricCard variant="compact" label="サバイバル" value={String(score.survival)} suffix="/100" />
          <MetricCard variant="compact" label="生活水準" value={String(score.lifestyle)} suffix="/100" />
          <MetricCard variant="compact" label="リスク" value={String(score.risk)} suffix="/100" />
          <MetricCard variant="compact" label="流動性" value={String(score.liquidity)} suffix="/100" />
        </div>

        {/* Breakdown toggle */}
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', showBreakdown && 'rotate-180')} />
          {showBreakdown ? '閉じる' : '詳しく見る'}
        </button>

        {/* Score breakdown */}
        {showBreakdown && <ScoreBreakdown score={score} />}

        {/* Benchmark */}
        <BenchmarkSection userScore={score.overall} />
      </div>
    </SectionCard>
  );
}

function BenchmarkSection({ userScore }: { userScore: number }) {
  const [open, setOpen] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const userGrossIncome = profile.grossIncome + (profile.mode === 'couple' ? profile.partnerGrossIncome : 0);
  const cases = findSimilarCases(userScore, profile.mode, userGrossIncome);

  return (
    <div className="w-full border-t pt-4 mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        ベンチマーク（似た条件のケース）
      </button>
      {open && (
        <div className="mt-4 space-y-1.5">
          {cases.map((c) => {
            const diff = c.score - userScore;
            const color = diff > 0 ? '#C8B89A' : diff < 0 ? '#8A7A62' : '#5A5550';
            return (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {c.id} {c.label}
                </span>
                <span className="font-bold tabular-nums" style={{ color }}>
                  {c.score}点
                  {diff !== 0 && (
                    <span className="text-xs ml-1">({diff > 0 ? '+' : ''}{diff})</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
