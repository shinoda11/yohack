'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  ArrowRight,
  GitBranch,
  TrendingDown,
  Home,
  Users,
  BarChart3,
} from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeyMetrics, Profile, ExitScoreDetail } from '@/lib/types';
import { useProfileStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NextAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

interface NextBestActionsCardProps {
  metrics: KeyMetrics | null;
  score: ExitScoreDetail | null;
  profile: Profile;
  isLoading?: boolean;
  onApplyAction: (updates: Partial<Profile>) => void;
}

function generateActions(
  profile: Profile,
  score: ExitScoreDetail,
  hasBranches: boolean,
  hasWorldlines: boolean,
): NextAction[] {
  const actions: NextAction[] = [];

  // If user hasn't used branch builder yet → top priority
  if (!hasBranches) {
    actions.push({
      id: 'try-branch-builder',
      title: '分岐ビルダーで世界線を設計する',
      description: 'ライフイベントを組み合わせて、あなただけの世界線候補を自動生成します',
      href: '/app/branch',
      icon: <GitBranch className="h-4 w-4" />,
    });
  }

  // Income-down scenario → always relevant for high earners
  if (score.survival < 95) {
    actions.push({
      id: 'income-down-scenario',
      title: '年収が20%下がるシナリオを試す',
      description: '分岐ビルダーで年収ダウンを追加し、耐性を確認します',
      href: '/app/branch',
      icon: <TrendingDown className="h-4 w-4" />,
    });
  }

  // Housing scenario for renters
  if (profile.homeStatus === 'renter') {
    actions.push({
      id: 'housing-purchase-scenario',
      title: '住宅購入シナリオを比較する',
      description: '賃貸継続と購入後の世界線を並べて余白の違いを確認します',
      href: '/app/branch',
      icon: <Home className="h-4 w-4" />,
    });
  }

  // Partner-related scenario for couples
  if (profile.mode === 'couple') {
    actions.push({
      id: 'partner-scenario',
      title: 'パートナー退職シナリオを試す',
      description: '片働きになった場合の世界線を分岐ビルダーで確認します',
      href: '/app/branch',
      icon: <Users className="h-4 w-4" />,
    });
  }

  // If user has branches but hasn't compared worldlines
  if (hasBranches && !hasWorldlines) {
    actions.push({
      id: 'compare-worldlines',
      title: '世界線を比較して余白を確認する',
      description: '生成した世界線候補を並べて、生存率やスコアの違いを見比べます',
      href: '/app/worldline',
      icon: <BarChart3 className="h-4 w-4" />,
    });
  }

  // If user already has worldlines → deeper comparison
  if (hasWorldlines) {
    actions.push({
      id: 'review-worldlines',
      title: '世界線比較で戦略を見直す',
      description: '条件を変えた世界線を追加し、選択肢の余白を再確認します',
      href: '/app/worldline',
      icon: <BarChart3 className="h-4 w-4" />,
    });
  }

  // Generic fallback: always suggest branch builder for scenario exploration
  if (actions.length < 2) {
    actions.push({
      id: 'explore-scenarios',
      title: 'ペースダウンした世界線を試す',
      description: '年収半減・早期リタイアなど、分岐ビルダーでもしもの未来を探ります',
      href: '/app/branch',
      icon: <GitBranch className="h-4 w-4" />,
    });
  }

  return actions.slice(0, 3);
}

export function NextBestActionsCard({
  metrics,
  score,
  profile,
  isLoading: parentLoading,
}: NextBestActionsCardProps) {
  const selectedBranchIds = useProfileStore((s) => s.selectedBranchIds);
  const scenarios = useProfileStore((s) => s.scenarios);

  const hasBranches = selectedBranchIds.length > 0;
  const hasWorldlines = scenarios.length > 0;

  const actions = useMemo(() => {
    if (!score) return [];
    return generateActions(profile, score, hasBranches, hasWorldlines);
  }, [profile, score, hasBranches, hasWorldlines]);

  if (parentLoading || !metrics || !score) {
    return (
      <SectionCard
        icon={<Lightbulb className="h-5 w-5" />}
        title="次の一手"
        description="シナリオ比較で検討できること"
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<Lightbulb className="h-5 w-5" />}
      title="次の一手"
      description="シナリオ比較で検討できること"
    >
      <div className="space-y-4">
        {actions.map((action, index) => (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              'block rounded-lg border-l-4 p-4 transition-all hover:shadow-sm',
              index === 0
                ? 'border-l-brand-gold bg-brand-canvas/50 dark:bg-brand-night/20'
                : 'border-l-brand-bronze/60 bg-brand-canvas/30 dark:bg-brand-night/10'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-md bg-background p-2 text-muted-foreground shadow-sm">
                {action.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-normal text-foreground">{action.title}</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {action.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-gold">
                  試してみる
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
