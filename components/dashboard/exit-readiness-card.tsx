'use client';

import React from "react"

import { Target, ShieldCheck, Heart, Activity, Droplets } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { ExitScoreDetail } from '@/lib/types';
import { getScoreBgColor, getScoreColor } from '@/lib/types';
import { cn } from '@/lib/utils';

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
        <div className="flex cursor-help flex-col items-center rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
          <div className="mb-1 text-muted-foreground">{icon}</div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-start gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <h4 className="font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function ExitReadinessCard({ score, isLoading }: ExitReadinessCardProps) {
  if (isLoading || !score) {
    return (
      <SectionCard
        icon={<Target className="h-5 w-5" />}
        title="余白スコア"
        description="目標達成度の総合評価"
      >
        <div className="flex flex-col items-center py-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="mt-4 h-4 w-24" />
          <div className="mt-6 grid w-full grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  const levelText = {
    GREEN: '十分',
    YELLOW: '良好',
    ORANGE: '要改善',
    RED: '要見直し',
  };

  return (
    <SectionCard
      icon={<Target className="h-5 w-5" />}
      title="余白スコア"
      description="目標達成度の総合評価"
    >
      <div className="flex flex-col items-center">
        {/* Main score - Semantic colors using Tailwind */}
        <div className="relative">
          <div
            className={cn(
              "flex h-36 w-36 flex-col items-center justify-center rounded-full border-2",
              score.level === 'GREEN' && "border-[#C8B89A]/40 bg-[#C8B89A]/10 dark:border-[#C8B89A]/20 dark:bg-[#C8B89A]/5",
              score.level === 'YELLOW' && "border-[#5A5550]/30 bg-[#5A5550]/10 dark:border-[#5A5550]/20 dark:bg-[#5A5550]/10",
              score.level === 'ORANGE' && "border-[#5A5550]/40 bg-[#5A5550]/15 dark:border-[#5A5550]/25 dark:bg-[#5A5550]/10",
              score.level === 'RED' && "border-red-300/60 bg-red-50/80 dark:border-red-800/40 dark:bg-red-950/20",
            )}
          >
            <span className={cn(
              "text-5xl font-bold tabular-nums",
              score.level === 'GREEN' && "text-[#8A7A62] dark:text-[#C8B89A]",
              score.level === 'YELLOW' && "text-[#5A5550] dark:text-[#DDD0B8]",
              score.level === 'ORANGE' && "text-[#5A5550] dark:text-[#DDD0B8]",
              score.level === 'RED' && "text-red-600 dark:text-red-400",
            )}>{score.overall}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold border",
              score.level === 'GREEN' && "bg-[#C8B89A] text-[#1A1916] border-[#C8B89A]",
              score.level === 'YELLOW' && "bg-[#5A5550] text-white border-[#5A5550]",
              score.level === 'ORANGE' && "bg-[#5A5550] text-white border-[#5A5550]",
              score.level === 'RED' && "bg-red-600 text-white border-red-600",
            )}
          >
            {levelText[score.level]}
          </div>
        </div>

        {/* Level description */}
        <p className={cn(
          "mt-6 text-sm font-medium",
          score.level === 'GREEN' && "text-[#8A7A62] dark:text-[#C8B89A]",
          score.level === 'YELLOW' && "text-[#5A5550] dark:text-[#DDD0B8]",
          score.level === 'ORANGE' && "text-[#5A5550] dark:text-[#DDD0B8]",
          score.level === 'RED' && "text-red-600 dark:text-red-400",
        )}>
          {score.level === 'GREEN' && '目標達成の可能性が非常に高いです'}
          {score.level === 'YELLOW' && '目標達成の見込みは良好です'}
          {score.level === 'ORANGE' && '改善の余地があります'}
          {score.level === 'RED' && '計画の見直しをおすすめします'}
        </p>

        {/* Sub-scores grid */}
        <div className="mt-6 grid w-full grid-cols-4 gap-3">
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
      </div>
    </SectionCard>
  );
}
