'use client';

import { useState } from 'react';
import { LineChart, Eye, EyeOff } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from 'recharts';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CHART_COLORS } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/metric-card';
import type { SimulationPath, LifeEvent } from '@/lib/types';

interface AssetProjectionChartProps {
  data: SimulationPath | null;
  targetRetireAge: number;
  lifeEvents?: LifeEvent[];
  isLoading?: boolean;
}

interface ChartDataPoint {
  age: number;
  median: number;
  upper: number;
  lower: number;
  p25: number;
  p75: number;
  // Stacked band data for p25-p75
  p25base: number;
  p25p75band: number;
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

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: number;
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const median = payload.find((p) => p.dataKey === 'median')?.value ?? 0;
  const lower = payload.find((p) => p.dataKey === 'lower')?.value ?? 0;

  return (
    <div className="rounded-lg border border-brand-sand bg-brand-canvas p-3 shadow-sm min-w-0 w-[180px] max-w-[90vw]">
      <p className="mb-2 font-bold text-sm tabular-nums">{label}歳</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-brand-stone flex items-center gap-1 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.gold }} />
            中央値
          </span>
          <span className="font-normal tabular-nums">{formatValue(median)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-brand-bronze flex items-center gap-1 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.bronze }} />
            悲観 10%
          </span>
          <span className="font-normal tabular-nums">{formatValue(lower)}</span>
        </div>
      </div>
    </div>
  );
}

export function AssetProjectionChart({
  data,
  targetRetireAge,
  lifeEvents = [],
  isLoading,
}: AssetProjectionChartProps) {
  const [showOptimistic, setShowOptimistic] = useState(false);
  
  if (!data) {
    return (
      <SectionCard
        icon={<LineChart className="h-5 w-5" />}
        title="資産推移シミュレーション"
        description="将来の資産推移の予測範囲"
      >
        {isLoading ? (
          <Skeleton className="h-[400px] w-full sm:h-[520px]" />
        ) : (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4 sm:h-[520px]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground/30">
              <line x1="20" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="32" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="4" r="3" fill="currentColor" opacity="0.5" />
            </svg>
            <p className="text-sm text-muted-foreground">
              プロファイルを入力すると、ここに資産推移が表示されます
            </p>
          </div>
        )}
      </SectionCard>
    );
  }

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = data.yearlyData.map((point, index) => {
    const p10 = data.lowerPath[index]?.assets ?? point.assets;
    const p25 = data.p25Path?.[index]?.assets ?? point.assets;
    const p75 = data.p75Path?.[index]?.assets ?? point.assets;
    const p90 = data.upperPath[index]?.assets ?? point.assets;
    return {
      age: point.age,
      median: point.assets,
      upper: p90,
      lower: p10,
      p25,
      p75,
      // Stacked band data for p25-p75
      p25base: p25,
      p25p75band: Math.max(0, p75 - p25),
    };
  });

  // Find key metrics
  const retirementData = chartData.find(d => d.age === targetRetireAge);
  const finalData = chartData[chartData.length - 1];

  // Cap Y axis to median-based scaling so p75/p90 compound growth doesn't crush median detail
  const medianMax = Math.max(...chartData.map(d => d.median));
  const yMaxBase = Math.ceil((medianMax * 1.3) / 1000) * 1000;
  const yMax = showOptimistic
    ? Math.ceil((Math.max(...chartData.map(d => d.p75)) * 1.1) / 1000) * 1000
    : yMaxBase;

  const minValue = Math.min(...chartData.map(d => d.lower));
  const yMin = minValue < 0
    ? Math.floor(minValue / 1000) * 1000 - 500
    : 0;

  return (
    <SectionCard
      icon={<LineChart className="h-5 w-5" />}
      title="資産推移シミュレーション"
      description="将来の資産推移の予測範囲"
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="show-optimistic" className="flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground cursor-pointer">
          <Switch
            id="show-optimistic"
            checked={showOptimistic}
            onCheckedChange={setShowOptimistic}
          />
          {showOptimistic ? (
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> 楽観シナリオを表示</span>
          ) : (
            <span className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> 楽観シナリオを非表示</span>
          )}
        </Label>
      </div>

      {/* Chart */}
      <div className="relative h-[400px] sm:h-[520px] w-full overflow-x-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/40">
            <Skeleton className="h-4 w-16" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 32, right: 24, left: 0, bottom: 32 }}
          >
            <defs>
              <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE4" vertical={false} />
            <XAxis
              dataKey="age"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: CHART_COLORS.bronze }}
              tickFormatter={(value: number) => `${value}歳`}
              ticks={(() => {
                if (chartData.length === 0) return [];
                const startAge = chartData[0].age;
                const endAge = chartData[chartData.length - 1].age;
                const result: number[] = [];
                const first = Math.ceil(startAge / 5) * 5;
                for (let age = first; age <= endAge; age += 5) {
                  result.push(age);
                }
                return result;
              })()}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: CHART_COLORS.bronze }}
              tickFormatter={formatYAxis}
              domain={[yMin, yMax]}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* p25-p75 band */}
            <Area
              type="monotone"
              dataKey="p25base"
              stackId="bandInner"
              stroke="none"
              fill="transparent"
            />
            <Area
              type="monotone"
              dataKey="p25p75band"
              stackId="bandInner"
              stroke="none"
              fill="rgba(200,184,154,0.06)"
            />

            {/* Optimistic line (conditional) */}
            {showOptimistic && (
              <Area
                type="monotone"
                dataKey="upper"
                stroke={CHART_COLORS.gold}
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                fill="none"
              />
            )}

            {/* Median line — Gold, solid, most prominent */}
            <Area
              type="monotone"
              dataKey="median"
              stroke={CHART_COLORS.gold}
              strokeWidth={2}
              fill="url(#colorMedian)"
            />

            {/* Hidden p25/p75 lines for tooltip data */}
            <Area type="monotone" dataKey="p25" stroke="none" fill="none" />
            <Area type="monotone" dataKey="p75" stroke="none" fill="none" />

            {/* Pessimistic line — Bronze, dashed, subtle */}
            <Area
              type="monotone"
              dataKey="lower"
              stroke={CHART_COLORS.bronze}
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
            />
            
            {/* Zero line */}
            <ReferenceLine
              y={0}
              stroke={CHART_COLORS.bronze}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '0',
                position: 'left',
                fill: CHART_COLORS.bronze,
                fontSize: 11,
                fontWeight: 500,
              }}
            />
            
            {/* Retirement age reference line */}
            <ReferenceLine
              x={targetRetireAge}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `目標 ${targetRetireAge}歳`,
                position: 'insideTopLeft',
                fill: 'hsl(var(--primary))',
                fontSize: 11,
                fontWeight: 'bold',
                offset: 8,
              }}
            />
            
            {/* Life event markers (vertical lines only — names are in the timeline) */}
            {lifeEvents.map((event) => (
              <ReferenceLine
                key={event.id}
                x={event.age}
                stroke={CHART_COLORS.gold}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ))}
            
            {/* Key point: Retirement assets (median) */}
            {retirementData && (
              <ReferenceDot
                x={targetRetireAge}
                y={retirementData.median}
                r={5}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Life Event Timeline — aligned with chart X-axis */}
      {lifeEvents.length > 0 && chartData.length > 0 && (() => {
        const startAge = chartData[0].age;
        const endAge = chartData[chartData.length - 1].age;
        const range = endAge - startAge;
        if (range <= 0) return null;

        // Deduplicate events at the same age (keep first of each age)
        const seen = new Set<number>();
        const uniqueEvents = lifeEvents.filter(e => {
          if (e.age < startAge || e.age > endAge) return false;
          if (seen.has(e.age)) return false;
          seen.add(e.age);
          return true;
        }).sort((a, b) => a.age - b.age);

        if (uniqueEvents.length === 0) return null;

        const toPercent = (age: number) => ((age - startAge) / range) * 100;
        const truncLabel = (name: string) => name.length > 6 ? name.slice(0, 6) + '…' : name;
        const pensionAge = 65;
        const showPension = pensionAge >= startAge && pensionAge <= endAge;

        // Assign tier (0=top, 1=middle, 2=bottom) to avoid overlap on nearby events (±2 age)
        const tiers: number[] = [];
        for (let i = 0; i < uniqueEvents.length; i++) {
          const prevAge = i > 0 ? uniqueEvents[i - 1].age : -Infinity;
          const prevTier = i > 0 ? tiers[i - 1] : -1;
          const isNear = uniqueEvents[i].age - prevAge <= 2;
          if (!isNear) {
            tiers.push(0); // top — no conflict
          } else {
            // Cycle through tiers: prev was 0→next 2, prev was 2→next 1, prev was 1→next 0
            tiers.push(prevTier === 0 ? 2 : prevTier === 2 ? 1 : 0);
          }
        }

        return (
          <div
            className="relative w-full"
            style={{
              height: 48,
              paddingLeft: 55,   // YAxis width
              paddingRight: 16,  // chart margin.right
            }}
          >
            {/* Baseline axis */}
            <div className="absolute top-[23px] h-px bg-border" style={{ left: 55, right: 16 }} />

            {/* Events (positioned inside padded area) */}
            <div className="relative h-full">
              {/* Pension marker */}
              {showPension && (
                <div
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${toPercent(pensionAge)}%`,
                    top: 0,
                    bottom: 0,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div
                    className="absolute border-l border-dashed"
                    style={{ top: 4, bottom: 4, borderColor: CHART_COLORS.bronze }}
                  />
                  <span
                    className="absolute whitespace-nowrap"
                    style={{ fontSize: 12, color: CHART_COLORS.bronze, bottom: 0 }}
                  >
                    年金
                  </span>
                </div>
              )}

              {/* Event dots + labels */}
              {uniqueEvents.map((event, i) => {
                const tier = tiers[i];
                // tier 0: label top, tier 1: label beside dot (middle), tier 2: label bottom
                const labelStyle: React.CSSProperties =
                  tier === 0 ? { top: 0 }
                  : tier === 2 ? { bottom: 0 }
                  : { top: 'calc(50% + 6px)' }; // middle: just below dot

                return (
                  <div
                    key={event.id}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${toPercent(event.age)}%`,
                      top: 0,
                      bottom: 0,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Label */}
                    <span
                      className="absolute whitespace-nowrap text-center"
                      style={{
                        fontSize: 12,
                        color: CHART_COLORS.bronze,
                        lineHeight: '14px',
                        ...labelStyle,
                      }}
                    >
                      {truncLabel(event.name)}
                    </span>
                    {/* Dot */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        top: 'calc(50% - 3px)',
                        backgroundColor: CHART_COLORS.gold,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Key Metrics Summary */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
        <MetricCard
          label={`${targetRetireAge}歳時点（中央値）`}
          value={retirementData ? formatValue(retirementData.median) : '-'}
        />
        <MetricCard
          label={`${finalData?.age}歳時点（中央値）`}
          value={finalData ? formatValue(finalData.median) : '-'}
        />
        <div>
          <MetricCard
            label={`悲観シナリオ (${finalData?.age}歳)`}
            value={finalData ? formatValue(finalData.lower) : '-'}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: CHART_COLORS.gold }} />
          <span className="text-muted-foreground">中央値</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: CHART_COLORS.bronze }} />
          <span className="text-muted-foreground">悲観 10%</span>
        </div>
        {showOptimistic && (
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: CHART_COLORS.gold, opacity: 0.5 }} />
            <span className="text-muted-foreground">楽観 90%</span>
          </div>
        )}
      </div>
      
      {/* Reading guide */}
      <p className="mt-4 text-xs text-muted-foreground text-center">
        実線 = 中央値（50%ile）、点線 = 悲観（10%ile）。
      </p>
    </SectionCard>
  );
}
