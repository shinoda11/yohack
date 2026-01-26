'use client';

import { ArrowDownUp, ArrowUp, ArrowDown } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { CashFlowBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CashFlowCardProps {
  cashFlow: CashFlowBreakdown | null;
  isLoading?: boolean;
}

interface FlowItemProps {
  label: string;
  amount: number;
  type: 'income' | 'expense';
  percentage?: number;
}

function FlowItem({ label, amount, type, percentage }: FlowItemProps) {
  const isIncome = type === 'income';

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            isIncome ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'
          )}
        >
          {isIncome ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {percentage !== undefined && (
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        )}
        <span
          className={cn(
            'font-semibold tabular-nums',
            isIncome ? 'text-gray-700' : 'text-gray-700'
          )}
        >
          {isIncome ? '+' : '-'}
          {Math.abs(amount).toLocaleString()}万円
        </span>
      </div>
    </div>
  );
}

export function CashFlowCard({ cashFlow, isLoading }: CashFlowCardProps) {
  if (isLoading || !cashFlow) {
    return (
      <SectionCard
        icon={<ArrowDownUp className="h-5 w-5" />}
        title="退職後キャッシュフロー"
        description="Exit後の年間収支内訳"
      >
        <Skeleton className="h-48 w-full" />
      </SectionCard>
    );
  }

  const totalIncome = cashFlow.income + cashFlow.pension + cashFlow.dividends;
  const incomePercentage = (amount: number) =>
    totalIncome > 0 ? (amount / totalIncome) * 100 : 0;

  const netCashFlowPositive = cashFlow.netCashFlow >= 0;

  return (
    <SectionCard
      icon={<ArrowDownUp className="h-5 w-5" />}
      title="退職後キャッシュフロー"
      description="Exit後の年間収支内訳"
    >
      <div className="space-y-4">
        {/* Income section */}
        <div>
          <p className="mb-2 text-sm font-medium">収入</p>
          <div className="divide-y">
            {cashFlow.income > 0 && (
              <FlowItem
                label="パッシブ収入"
                amount={cashFlow.income}
                type="income"
                percentage={incomePercentage(cashFlow.income)}
              />
            )}
            {cashFlow.pension > 0 && (
              <FlowItem
                label="年金"
                amount={cashFlow.pension}
                type="income"
                percentage={incomePercentage(cashFlow.pension)}
              />
            )}
            {cashFlow.dividends > 0 && (
              <FlowItem
                label="配当収入"
                amount={cashFlow.dividends}
                type="income"
                percentage={incomePercentage(cashFlow.dividends)}
              />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="text-sm font-medium">収入合計</span>
            <span className="font-bold text-gray-800 tabular-nums">
              +{totalIncome.toLocaleString()}万円
            </span>
          </div>
        </div>

        {/* Expense section */}
        <div>
          <p className="mb-2 text-sm font-medium">支出</p>
          <FlowItem
            label="年間支出"
            amount={cashFlow.expenses}
            type="expense"
          />
        </div>

        {/* Net cash flow */}
        <div
          className={cn(
            'rounded-lg p-4 border',
            netCashFlowPositive ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">年間収支</span>
            <div className="flex items-center gap-2">
              {netCashFlowPositive ? (
                <ArrowUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-xl font-bold text-gray-800 tabular-nums">
                {cashFlow.netCashFlow >= 0 ? '+' : ''}
                {cashFlow.netCashFlow.toLocaleString()}万円
              </span>
            </div>
          </div>
          {!netCashFlowPositive && (
            <p className="mt-2 text-sm text-gray-600">
              年間{Math.abs(cashFlow.netCashFlow).toLocaleString()}万円の
              余白を使う必要があります
            </p>
          )}
        </div>

        {/* Income coverage bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>収入カバー率</span>
            <span>
              {cashFlow.expenses > 0
                ? ((totalIncome / cashFlow.expenses) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={Math.min(
              100,
              cashFlow.expenses > 0 ? (totalIncome / cashFlow.expenses) * 100 : 0
            )}
            className="h-2"
          />
        </div>
      </div>
    </SectionCard>
  );
}
