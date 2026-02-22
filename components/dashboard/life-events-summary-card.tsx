'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useProfileStore } from '@/lib/store';
import {
  createDefaultBranches,
  branchToLifeEvents,
  type Branch,
  type BranchCertainty,
} from '@/lib/branch';
import type { Profile, LifeEvent, LifeEventType } from '@/lib/types';

// ============================================================
// Helpers
// ============================================================

const EVENT_ICONS: Record<LifeEventType, string> = {
  income_increase: '📈',
  income_decrease: '📉',
  expense_increase: '💸',
  expense_decrease: '✂️',
  asset_gain: '🎁',
  housing_purchase: '🏠',
  asset_purchase: '🏠',
  child_birth: '👶',
  education: '🎓',
  retirement_partial: '🌴',
  rental_income: '🏠',
};

function formatEventAmount(e: LifeEvent): string {
  if (e.type === 'housing_purchase' && e.purchaseDetails) {
    return `${e.purchaseDetails.propertyPrice.toLocaleString()}万円`;
  }
  if (e.type === 'asset_gain') return `+${e.amount}万円`;
  const isExpense = e.type === 'expense_increase' || e.type === 'asset_purchase';
  const isIncome = e.type === 'income_increase' || e.type === 'rental_income';
  const sign = isExpense ? '+' : isIncome ? '+' : '-';
  const suffix = e.isRecurring || e.duration ? '万円/年' : '万円';
  return `${sign}${e.amount}${suffix}`;
}

interface BranchGroup {
  certainty: BranchCertainty;
  label: string;
  marker: string;
  branches: Branch[];
  events: LifeEvent[];
}

function buildGroups(profile: Profile, customBranches: Branch[], hiddenDefaultBranchIds: string[]): BranchGroup[] {
  const defaults = createDefaultBranches(profile);
  const overriddenIds = new Set(
    customBranches.map(b => b.overridesDefaultId).filter((id): id is string => id != null)
  );
  const hiddenIds = new Set(hiddenDefaultBranchIds);

  const visibleDefaults = defaults.filter(
    b => !b.auto && !hiddenIds.has(b.id) && !overriddenIds.has(b.id)
  );
  const allBranches = [...visibleDefaults, ...customBranches];

  const planned = allBranches.filter(b => b.certainty === 'planned');
  const uncertain = allBranches.filter(b => b.certainty === 'uncertain');

  const groups: BranchGroup[] = [];

  if (planned.length > 0) {
    const events = planned.flatMap(b => branchToLifeEvents(b, profile));
    groups.push({ certainty: 'planned', label: '計画', marker: '●', branches: planned, events });
  }
  if (uncertain.length > 0) {
    const events = uncertain.flatMap(b => branchToLifeEvents(b, profile));
    groups.push({ certainty: 'uncertain', label: '不確定', marker: '○', branches: uncertain, events });
  }

  return groups;
}

// ============================================================
// Component
// ============================================================

interface LifeEventsSummaryCardProps {
  profile: Profile;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LifeEventsSummaryCard({ profile, open, onOpenChange }: LifeEventsSummaryCardProps) {
  const { customBranches, hiddenDefaultBranchIds } = useProfileStore();

  const groups = useMemo(
    () => buildGroups(profile, customBranches, hiddenDefaultBranchIds),
    [profile, customBranches, hiddenDefaultBranchIds]
  );

  const totalBranches = groups.reduce((sum, g) => sum + g.branches.length, 0);

  const icon = <CalendarDays className="h-5 w-5" />;
  const title = 'ライフイベント';

  const summaryNode = totalBranches === 0
    ? '未設定'
    : groups.map(g => `${g.label}: ${g.branches.length}件`).join(' / ');

  const content = (
    <>
      {totalBranches === 0 ? (
        <Link href="/app/branch" className="block">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            分岐ビルダーで将来の計画を追加しましょう
            <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </p>
        </Link>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.certainty}>
              <p className="text-xs font-medium text-brand-stone mb-1">
                {g.marker} {g.label}: {g.branches.length}件
              </p>
              <div className="space-y-1 pl-4">
                {g.events.map(e => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="flex-shrink-0">{EVENT_ICONS[e.type] ?? '📋'}</span>
                    <span className="truncate">
                      {e.name}
                      {e.target === 'partner' ? ' (パートナー)' : ''}
                    </span>
                    <span className="tabular-nums flex-shrink-0 ml-auto whitespace-nowrap">
                      {e.age}歳 / {formatEventAmount(e)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Link href="/app/branch" className="block">
            <p className="text-sm text-brand-gold hover:underline pt-1">
              分岐ビルダーで編集する
              <ArrowRight className="inline h-3.5 w-3.5 ml-0.5" />
            </p>
          </Link>
        </div>
      )}
    </>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <CollapsibleCard icon={icon} title={title} summary={summaryNode} open={open} onOpenChange={onOpenChange}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <Link href="/app/branch" className="block">
      <SectionCard
        icon={icon}
        title={title}
        className="border-dashed cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {content}
      </SectionCard>
    </Link>
  );
}
