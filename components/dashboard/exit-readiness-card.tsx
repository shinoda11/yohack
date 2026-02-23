'use client';

import React, { useState } from "react"

import { Target, ShieldCheck, Heart, Activity, Droplets, ChevronDown } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { ExitScoreDetail } from '@/lib/types';
import { cn } from '@/lib/utils';
import { findSimilarCases } from '@/lib/benchmarks';
import { useProfileStore } from '@/lib/store';
import { useScoreAnimation, useAnimatedValue } from '@/hooks/useScoreAnimation';

interface ExitReadinessCardProps {
  score: ExitScoreDetail | null;
  isLoading?: boolean;
}

interface SubScoreProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

function SubScore({ label, value, icon, description }: SubScoreProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex cursor-help flex-col items-center rounded-lg bg-muted/50 p-4 transition-all duration-[600ms] hover:bg-muted">
          <div className="mb-1 text-muted-foreground">{icon}</div>
          <div className="text-xl font-bold font-[family-name:var(--font-dm-sans)] tabular-nums transition-all duration-[600ms]">
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-start gap-4">
          <div className="text-primary">{icon}</div>
          <div>
            <h4 className="font-bold">{label}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
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
  // Track score direction: up resets after 600ms, down (flash) after 300ms
  const scoreDirection = useScoreAnimation(score?.overall ?? null);
  const animatedScore = useAnimatedValue(score?.overall ?? 0, 600);

  if (isLoading || !score) {
    return (
      <SectionCard
        icon={<Target className="h-5 w-5" />}
        title="余白スコア"
        description="人生の余白を総合評価"
      >
        <div className="flex flex-col items-center py-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="mt-4 h-4 w-24" />
          <div className="mt-6 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
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
      title="余白スコア"
      description="人生の余白を総合評価"
      className={cn(
        'transition-all duration-[600ms]',
        scoreDirection === 'up' && 'shadow-[var(--shadow-gold)]',
        scoreDirection === 'down' && 'border-brand-bronze border-2 !duration-150',
      )}
    >
      <div className="flex flex-col items-center">
        {/* Main score - SVG Progress Ring */}
        {(() => {
          const radius = 58;
          const strokeWidth = 8;
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(Math.max(animatedScore, 0), 100);
          const offset = circumference - (progress / 100) * circumference;
          const strokeColor = 'hsl(var(--brand-gold))';

          return (
            <div className="relative">
              <svg width="144" height="144" viewBox="0 0 144 144">
                {/* Background ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/60"
                />
                {/* Progress ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-[600ms] ease-out"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '72px 72px' }}
                />
                {/* Center text */}
                <text
                  x="72"
                  y="66"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize="48"
                  fontWeight="bold"
                >
                  {animatedScore}
                </text>
                <text
                  x="72"
                  y="96"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-muted-foreground"
                  fontSize="14"
                >
                  /100
                </text>
              </svg>
            </div>
          );
        })()}

        {/* Sub-scores grid */}
        <div className="mt-6 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          <SubScore
            label="サバイバル"
            value={score.survival}
            icon={<ShieldCheck className="h-4 w-4" />}
            description="資産が尽きない確率。シミュレーションで資産がマイナスにならなかったシナリオの割合です。"
          />
          <SubScore
            label="生活水準"
            value={score.lifestyle}
            icon={<Heart className="h-4 w-4" />}
            description="退職後も望む生活水準を維持できる可能性。資産に対する年間支出の比率で評価します。"
          />
          <SubScore
            label="リスク"
            value={score.risk}
            icon={<Activity className="h-4 w-4" />}
            description="ポートフォリオのリスク評価（高いほど安全）。投資資産比率とボラティリティを考慮しています。"
          />
          <SubScore
            label="流動性"
            value={score.liquidity}
            icon={<Droplets className="h-4 w-4" />}
            description="緊急時に使える現金の割合。予期せぬ支出に対応できる余裕度を示します。"
          />
        </div>

        {/* Breakdown toggle */}
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
