'use client';

import Link from 'next/link';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import type { Profile, LifeEventType } from '@/lib/types';

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

function formatAmount(type: LifeEventType, amount: number): string {
  if (type === 'asset_gain') {
    return `+${amount}万円`;
  }
  if (type === 'housing_purchase') {
    return `${amount.toLocaleString()}万円`;
  }
  const isPositiveExpense =
    type === 'expense_increase' ||
    type === 'asset_purchase' ||
    type === 'child_birth' ||
    type === 'education';
  const isIncome = type === 'income_increase' || type === 'rental_income';
  const sign = isPositiveExpense ? '+' : isIncome ? '+' : '-';
  return `${sign}${amount}万円/年`;
}

interface LifeEventsSummaryCardProps {
  profile: Profile;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LifeEventsSummaryCard({ profile, open, onOpenChange }: LifeEventsSummaryCardProps) {
  const events = profile.lifeEvents;
  const count = events.length;

  // 年間影響額の合計（支出増=プラス、収入増=マイナスで見る）
  const annualImpact = events.reduce((sum, e) => {
    if (e.type === 'income_increase' || e.type === 'rental_income') return sum + e.amount;
    if (e.type === 'income_decrease') return sum - e.amount;
    if (e.type === 'expense_decrease') return sum - e.amount;
    return sum + e.amount;
  }, 0);

  const icon = <CalendarDays className="h-5 w-5" />;
  const title = 'ライフイベント';

  const summaryNode = count === 0
    ? '未設定'
    : events.map(e => `${e.name}（${e.age}歳）`).join('、');

  const content = (
    <>
      {count === 0 ? (
        <Link href="/app/plan" className="block">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ライフプランで将来の計画を追加しましょう
            <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </p>
        </Link>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {count}件のイベントが登録されています
          </p>

          {/* 概要リスト（最大3件） */}
          <div className="space-y-1">
            {events.slice(0, 3).map(e => (
              <div
                key={e.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span>{EVENT_ICONS[e.type] ?? '📋'}</span>
                <span className="truncate">{e.name}{e.target === 'partner' ? ' (パートナー)' : ''}</span>
                <span className="tabular-nums flex-shrink-0">{e.age}歳</span>
                <span className="tabular-nums flex-shrink-0 ml-auto">
                  {formatAmount(e.type, e.amount)}
                </span>
              </div>
            ))}
            {count > 3 && (
              <p className="text-xs text-muted-foreground pl-6">
                他{count - 3}件
              </p>
            )}
          </div>

          {/* 年間影響額 */}
          {annualImpact !== 0 && (
            <p className="text-xs text-muted-foreground pt-1 border-t">
              年間影響: {annualImpact > 0 ? '+' : ''}{annualImpact}万円
            </p>
          )}

          {/* リンク */}
          <Link href="/app/plan" className="block">
            <p className="text-sm text-[#C8B89A] hover:underline pt-1">
              ライフプランで編集する
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
    <Link href="/app/plan" className="block">
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
