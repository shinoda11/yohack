'use client';

import { ArrowDownUp, ArrowUp, ArrowDown, TrendingDown } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent } from '@/lib/types';
import type { CashFlowBreakdown, SimulationPath, KeyMetrics } from '@/lib/types';
import { cn, CHART_COLORS } from '@/lib/utils';

interface CashFlowCardProps {
  cashFlow: CashFlowBreakdown | null;
  paths?: SimulationPath | null;
  metrics?: KeyMetrics | null;
  targetRetireAge?: number;
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
            'bg-brand-canvas text-brand-bronze'
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
            {formatPercent(percentage)}
          </span>
        )}
        <span className="font-bold tabular-nums text-brand-stone">
          {isIncome ? '+' : '-'}
          {formatCurrency(Math.abs(amount))}
        </span>
      </div>
    </div>
  );
}

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 10000) {
    const oku = abs / 10000;
    return `${sign}${oku % 1 === 0 ? oku.toFixed(0) : oku.toFixed(1)}億`;
  }
  return `${sign}${Math.round(abs).toLocaleString()}万`;
}

function formatValue(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 10000) {
    const oku = abs / 10000;
    return `${sign}${oku % 1 === 0 ? oku.toFixed(0) : oku.toFixed(1)}億円`;
  }
  return `${sign}${Math.round(abs).toLocaleString()}万円`;
}

interface RetirementChartPoint {
  age: number;
  median: number;
  p25base: number;
  p25p75band: number;
}

export function CashFlowCard({ cashFlow, paths, metrics, targetRetireAge, isLoading }: CashFlowCardProps) {
  if (!cashFlow) {
    return (
      <SectionCard
        icon={<ArrowDownUp className="h-5 w-5" />}
        title="退職後キャッシュフロー"
        description="退職後の収支バランス"
      >
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground/30">
              <line x1="20" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="32" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="4" r="3" fill="currentColor" opacity="0.5" />
            </svg>
            <p className="text-sm text-muted-foreground">
              プロファイルを入力すると、ここに収支が表示されます
            </p>
          </div>
        )}
      </SectionCard>
    );
  }

  const totalIncome = cashFlow.income + cashFlow.pension + cashFlow.dividends;
  const incomePercentage = (amount: number) =>
    totalIncome > 0 ? (amount / totalIncome) * 100 : 0;

  const netCashFlowPositive = cashFlow.netCashFlow >= 0;

  // Withdrawal simulation data
  const retireAge = targetRetireAge ?? 55;
  const hasWithdrawalData = paths && metrics && !netCashFlowPositive;

  // Compute retirement chart data from paths
  const retirementChartData: RetirementChartPoint[] = [];
  let medianAssetAtRetire = 0;
  let depletionAge: number | null = null;

  if (paths) {
    const startIndex = paths.yearlyData.findIndex(p => p.age === retireAge);
    if (startIndex >= 0) {
      medianAssetAtRetire = paths.yearlyData[startIndex]?.assets ?? 0;
      for (let i = startIndex; i < paths.yearlyData.length; i++) {
        const age = paths.yearlyData[i].age;
        const median = paths.yearlyData[i].assets;
        const p25 = paths.p25Path?.[i]?.assets ?? median;
        const p75 = paths.p75Path?.[i]?.assets ?? median;
        retirementChartData.push({
          age,
          median,
          p25base: p25,
          p25p75band: Math.max(0, p75 - p25),
        });
        if (depletionAge === null && median <= 0) {
          depletionAge = age;
        }
      }
    }
  }

  // Cap mini chart Y axis to p75 max * 1.2
  const miniP75Max = retirementChartData.length > 0
    ? Math.max(...retirementChartData.map(d => d.p25base + d.p25p75band))
    : 0;
  const miniYMax = Math.ceil((miniP75Max * 1.2) / 1000) * 1000;
  const miniMinValue = retirementChartData.length > 0
    ? Math.min(...retirementChartData.map(d => d.median))
    : 0;
  const miniYMin = miniMinValue < 0
    ? Math.floor(miniMinValue / 1000) * 1000 - 500
    : Math.max(-500, Math.floor(miniMinValue / 500) * 500);

  const annualWithdrawal = Math.abs(cashFlow.netCashFlow);
  const withdrawalWithPension = cashFlow.pension > 0
    ? annualWithdrawal
    : Math.max(0, annualWithdrawal - (cashFlow.pension || 0));
  const depletionProb = metrics ? Math.round(100 - metrics.survivalRate) : null;

  return (
    <SectionCard
      icon={<ArrowDownUp className="h-5 w-5" />}
      title="退職後キャッシュフロー"
      description="退職後の収支バランス"
      action={isLoading && <Skeleton className="h-3 w-12" />}
    >
      <div className={cn("space-y-4", isLoading && "opacity-60")}>
        {/* Income section */}
        <div>
          <p className="mb-2 text-sm font-normal">収入</p>
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
            <span className="text-sm font-normal">収入合計</span>
            <span className="text-lg font-bold font-[family-name:var(--font-dm-sans)] text-brand-stone tabular-nums">
              +{formatCurrency(totalIncome)}
            </span>
          </div>
        </div>

        {/* Expense section */}
        <div>
          <p className="mb-2 text-sm font-normal">支出</p>
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
            'bg-brand-canvas border-brand-linen'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-normal">年間収支</span>
            <div className="flex items-center gap-2">
              {netCashFlowPositive ? (
                <ArrowUp className="h-4 w-4 text-brand-bronze" />
              ) : (
                <ArrowDown className="h-4 w-4 text-brand-bronze" />
              )}
              <span className="text-xl font-bold font-[family-name:var(--font-dm-sans)] text-brand-stone tabular-nums bg-brand-gold/10 px-2 py-0.5 rounded-md">
                {cashFlow.netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(cashFlow.netCashFlow)}
              </span>
            </div>
          </div>
          {!netCashFlowPositive && (
            <p className="mt-2 text-sm text-brand-bronze">
              年間{formatCurrency(Math.abs(cashFlow.netCashFlow))}の
              資産の取り崩しが必要です
            </p>
          )}
        </div>

        {/* Income coverage bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>収入カバー率</span>
            <span>
              {formatPercent(
                cashFlow.expenses > 0
                  ? (totalIncome / cashFlow.expenses) * 100
                  : 0
              )}
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

        {/* Withdrawal simulation section */}
        {hasWithdrawalData && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-normal">資産の取り崩しシミュレーション</p>
            </div>

            {/* Withdrawal summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">退職時の推定資産</p>
                <p className="text-lg font-bold font-[family-name:var(--font-dm-sans)] tabular-nums">{formatCurrency(Math.round(medianAssetAtRetire))}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">年間取り崩し額</p>
                <p className="text-lg font-bold font-[family-name:var(--font-dm-sans)] tabular-nums">{formatCurrency(Math.round(annualWithdrawal))}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">資産枯渇年齢</p>
                <p className="text-lg font-bold font-[family-name:var(--font-dm-sans)] tabular-nums">
                  {depletionAge ? `${depletionAge}歳` : '枯渇なし'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">枯渇確率（100歳まで）</p>
                <p className={cn(
                  "text-lg font-bold font-[family-name:var(--font-dm-sans)] tabular-nums",
                  depletionProb !== null && depletionProb > 20 && "text-red-700"
                )}>
                  {depletionProb !== null ? `${depletionProb}%` : '—'}
                </p>
              </div>
            </div>

            {/* Retirement mini chart */}
            {retirementChartData.length > 0 && (
              <div className="h-[200px] w-full overflow-x-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={retirementChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="age"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v}歳`}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatYAxis}
                      domain={[miniYMin, miniYMax]}
                      width={50}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const median = payload.find(p => p.dataKey === 'median')?.value as number ?? 0;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-lg text-xs">
                            <p className="font-normal mb-1">{label}歳</p>
                            <p className="tabular-nums">資産: {formatValue(Math.round(median))}</p>
                          </div>
                        );
                      }}
                    />

                    {/* p25-p75 band */}
                    <Area
                      type="monotone"
                      dataKey="p25base"
                      stackId="band"
                      stroke="none"
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="p25p75band"
                      stackId="band"
                      stroke="none"
                      fill="rgba(200,184,154,0.2)"
                    />

                    {/* Median line */}
                    <Area
                      type="monotone"
                      dataKey="median"
                      stroke={CHART_COLORS.median}
                      strokeWidth={2}
                      fill="none"
                    />

                    {/* Zero line */}
                    <ReferenceLine
                      y={0}
                      stroke="hsl(var(--destructive))"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />

                    {/* Pension age marker */}
                    {retireAge < 65 && (
                      <ReferenceLine
                        x={65}
                        stroke={CHART_COLORS.secondary}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        label={{
                          value: '年金開始',
                          position: 'insideTopRight',
                          fill: CHART_COLORS.secondary,
                          fontSize: 9,
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              退職後の資産推移（中央値）。ゴールドの帯は25〜75%の範囲。
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
