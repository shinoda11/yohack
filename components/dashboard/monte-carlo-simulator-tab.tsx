'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { TermTooltip } from '@/components/ui/term-tooltip';
import { glossary } from '@/lib/glossary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { Profile, SimulationPath } from '@/lib/types';
import { cn, CHART_COLORS } from '@/lib/utils';

interface MonteCarloSimulatorTabProps {
  profile: Profile;
  paths: SimulationPath | null;
  isLoading?: boolean;
  onVolatilityChange: (volatility: number) => void;
}

// Generate chart data from simulation paths
function generateChartData(paths: SimulationPath, profile: Profile) {
  const data = [];
  const startAge = profile.currentAge;
  const endAge = 100;

  for (let age = startAge; age <= endAge; age++) {
    const index = age - startAge;
    if (index >= paths.median.length) break;

    data.push({
      age,
      pessimistic: paths.pessimistic[index] / 10000, // Convert to 億円
      median: paths.median[index] / 10000,
      optimistic: paths.optimistic[index] / 10000,
      // For area fill between pessimistic and optimistic
      range: [paths.pessimistic[index] / 10000, paths.optimistic[index] / 10000],
    });
  }

  return data;
}

// Custom tooltip component - clean, minimal styling
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  // Find values by dataKey instead of relying on array order
  const optimisticEntry = payload.find((p: any) => p.dataKey === 'optimistic');
  const medianEntry = payload.find((p: any) => p.dataKey === 'median');
  const pessimisticEntry = payload.find((p: any) => p.dataKey === 'pessimistic');

  // Format value with appropriate precision and unit
  const formatValue = (value: any) => {
    if (typeof value !== 'number') return '---';
    // Value is in 億円
    if (Math.abs(value) < 0.01) {
      return `${(value * 10000).toFixed(0)}万`;
    }
    if (Math.abs(value) < 1) {
      return `${(value * 10000).toFixed(0)}万`;
    }
    return `${value.toFixed(2)}億`;
  };

  return (
    <div className="rounded-lg border border-brand-sand bg-brand-canvas px-3 py-2 shadow-sm dark:border-brand-bronze dark:bg-brand-night">
      <p className="text-xs font-normal text-brand-night dark:text-brand-linen">{label}歳</p>
      <div className="mt-1 space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-brand-bronze">楽観</span>
          <span className="tabular-nums text-brand-stone dark:text-brand-gold/40">
            {formatValue(optimisticEntry?.value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-brand-bronze">中央</span>
          <span className="tabular-nums font-normal text-brand-night dark:text-brand-linen">
            {formatValue(medianEntry?.value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-brand-bronze">悲観</span>
          <span className="tabular-nums text-brand-stone dark:text-brand-gold/40">
            {formatValue(pessimisticEntry?.value)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MonteCarloSimulatorTab({
  profile,
  paths,
  isLoading,
  onVolatilityChange,
}: MonteCarloSimulatorTabProps) {
  // volatility is stored as decimal (0.15 = 15%), but displayed as percentage
  const [localVolatility, setLocalVolatility] = useState(profile.volatility * 100);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with profile changes
  useEffect(() => {
    if (!isDragging) {
      setLocalVolatility(profile.volatility * 100);
    }
  }, [profile.volatility, isDragging]);

  // Handle volatility slider change
  const handleVolatilityChange = (value: number[]) => {
    setLocalVolatility(value[0]);
  };

  // Commit volatility change on drag end (convert back to decimal)
  const handleVolatilityCommit = (value: number[]) => {
    setIsDragging(false);
    onVolatilityChange(value[0] / 100);
  };

  // Generate chart data
  const chartData = useMemo(() => {
    if (!paths) return [];
    return generateChartData(paths, profile);
  }, [paths, profile]);

  // Calculate dynamic Y-axis domain with proper headroom for "leisurely viewing"
  const { yAxisDomain, yAxisTickFormatter, yAxisLabel } = useMemo(() => {
    if (!chartData.length) {
      return {
        yAxisDomain: [0, 2],
        yAxisTickFormatter: (v: number) => v.toFixed(1),
        yAxisLabel: '億円',
      };
    }
    
    // Find actual max/min from all lines (optimistic top, pessimistic bottom)
    const allValues = chartData.flatMap(d => [d.optimistic, d.median, d.pessimistic]);
    const dataMax = Math.max(...allValues);
    const dataMin = Math.min(...allValues, 0);
    
    // Calculate range and add 15% headroom top and bottom
    const range = dataMax - dataMin;
    const headroom = range * 0.15;
    
    let maxY = dataMax + headroom;
    let minY = Math.min(dataMin - headroom, 0); // Don't go below 0 unless data is negative
    
    // Round to nice numbers for cleaner axis
    const niceRound = (val: number, direction: 'up' | 'down') => {
      const absVal = Math.abs(val);
      let step: number;
      if (absVal < 0.5) step = 0.1;
      else if (absVal < 2) step = 0.25;
      else if (absVal < 5) step = 0.5;
      else step = 1;
      
      if (direction === 'up') {
        return Math.ceil(val / step) * step;
      }
      return Math.floor(val / step) * step;
    };
    
    maxY = niceRound(maxY, 'up');
    minY = niceRound(minY, 'down');
    
    // Determine best unit display based on magnitude
    // Data is already in 億円 (divided by 10000 from 万円)
    const maxAbs = Math.max(Math.abs(maxY), Math.abs(minY));
    
    let formatter: (v: number) => string;
    let label: string;
    
    if (maxAbs < 0.1) {
      // Very small: show as 万円 (multiply back)
      formatter = (v: number) => `${(v * 10000).toFixed(0)}`;
      label = '万円';
    } else if (maxAbs < 1) {
      // Small: show with 2 decimal places
      formatter = (v: number) => v.toFixed(2);
      label = '億円';
    } else if (maxAbs < 10) {
      // Medium: show with 1 decimal place
      formatter = (v: number) => v.toFixed(1);
      label = '億円';
    } else {
      // Large: show whole numbers
      formatter = (v: number) => v.toFixed(0);
      label = '億円';
    }
    
    return {
      yAxisDomain: [minY, maxY],
      yAxisTickFormatter: formatter,
      yAxisLabel: label,
    };
  }, [chartData]);

  // Calculate spread at retirement age
  const spreadAtRetirement = useMemo(() => {
    if (!paths) return null;
    const retireIndex = profile.targetRetireAge - profile.currentAge;
    if (retireIndex < 0 || retireIndex >= paths.median.length) return null;

    return {
      optimistic: paths.optimistic[retireIndex] / 10000,
      median: paths.median[retireIndex] / 10000,
      pessimistic: paths.pessimistic[retireIndex] / 10000,
      spread: (paths.optimistic[retireIndex] - paths.pessimistic[retireIndex]) / 10000,
    };
  }, [paths, profile]);

  if (!paths) {
    return (
      <div className="space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[300px] w-full sm:h-[400px]" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-lg border sm:h-[400px]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground/30">
              <line x1="20" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="32" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="4" r="3" fill="currentColor" opacity="0.5" />
            </svg>
            <p className="text-sm text-muted-foreground">
              プロファイルを入力すると、ここに確率分布が表示されます
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volatility Control */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base"><TermTooltip term="ボラティリティ" description={glossary['ボラティリティ']} />（標準偏差）</CardTitle>
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button className="rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm">
                  ボラティリティは資産のリターンの変動幅を示します。
                  高いボラティリティは楽観・悲観シナリオの差を広げ、
                  将来の不確実性が高まることを意味します。
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  一般的な株式インデックスは15-20%程度です。
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
          <CardDescription>
            市場リスクの前提を調整
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Slider
                value={[localVolatility]}
                onValueChange={handleVolatilityChange}
                onValueCommit={handleVolatilityCommit}
                onPointerDown={() => setIsDragging(true)}
                min={5}
                max={35}
                step={1}
                className="flex-1"
              />
              <div className="w-20 text-right">
                <span className="text-2xl font-bold">{localVolatility}</span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>低リスク (5%)</span>
              <span>標準 (15-20%)</span>
              <span>高リスク (35%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monte Carlo Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <TermTooltip term="モンテカルロ" description={glossary['モンテカルロ']} />確率分布
          </CardTitle>
          <CardDescription>
            1,000回のシミュレーションによる予測範囲
          </CardDescription>
        </CardHeader>
        {/* Graph interpretation guide - テキストのみ、背景なし */}
        <p className="mx-6 mb-4 text-xs text-brand-bronze/60">
          実線が最もありそうな推移。帯が広いほど不確実性が高い。下限が0を下回らなければ資産枯渇リスクは低い。
        </p>
        <CardContent>
          <div className="relative h-[300px] w-full sm:h-[400px] overflow-x-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/40">
                <Skeleton className="h-4 w-16" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="age"
                  label={{ value: '年齢', position: 'bottom', offset: 0 }}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  domain={yAxisDomain}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: 11, fill: CHART_COLORS.secondary }
                  }}
                  tick={{ fill: CHART_COLORS.secondary, fontSize: 11 }}
                  tickFormatter={yAxisTickFormatter}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      pessimistic: '悲観 (10%ile)',
                      median: '中央値 (50%ile)',
                      optimistic: '楽観 (90%ile)',
                    };
                    return labels[value] || value;
                  }}
                />

                {/* Confidence interval area - 淡いグレーで落ち着いた印象 */}
                <Area
                  type="monotone"
                  dataKey="range"
                  fill="#e5e7eb"
                  fillOpacity={0.4}
                  stroke="none"
                />

                {/* Lines - 彩度を下げた落ち着いた色 */}
                <Line
                  type="monotone"
                  dataKey="pessimistic"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke={CHART_COLORS.median}
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="optimistic"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                />

                {/* Retirement age reference line - グレーで控えめに */}
                <ReferenceLine
                  x={profile.targetRetireAge}
                  stroke={CHART_COLORS.tertiary}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `目標 ${profile.targetRetireAge}歳`,
                    position: 'top',
                    fill: CHART_COLORS.tertiary,
                    fontSize: 11,
                  }}
                />

                {/* Zero line */}
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {spreadAtRetirement && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">退職時資産（楽観）</p>
                <p className="mt-1 text-2xl font-bold text-brand-stone sm:text-3xl">
                  {spreadAtRetirement.optimistic.toFixed(2)}億円
                </p>
                <Badge variant="secondary" className="mt-2">
                  90パーセンタイル
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-linen">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">退職時資産（中央値）</p>
                <p className="mt-1 text-2xl font-bold text-brand-stone sm:text-3xl">
                  {spreadAtRetirement.median.toFixed(2)}億円
                </p>
                <Badge className="mt-2 bg-brand-stone">
                  最も可能性の高い結果
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">退職時資産（悲観）</p>
                <p className="mt-1 text-2xl font-bold text-brand-bronze sm:text-3xl">
                  {spreadAtRetirement.pessimistic.toFixed(2)}億円
                </p>
                <Badge variant="secondary" className="mt-2">
                  10パーセンタイル
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Warning */}
      {spreadAtRetirement && spreadAtRetirement.spread > 1 && (
        <Card className="border-brand-linen bg-brand-canvas/50 dark:border-brand-bronze dark:bg-brand-night/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertTriangle className="h-5 w-5 shrink-0 text-brand-bronze" />
            <div>
              <p className="font-normal text-brand-stone dark:text-brand-gold/40">
                シナリオ間の差が大きい
              </p>
              <p className="mt-1 text-sm text-brand-bronze dark:text-brand-bronze/60">
                楽観と悲観の差が{spreadAtRetirement.spread.toFixed(2)}億円あります。
                ボラティリティを下げるか、より保守的な資産配分を検討することで
                将来の不確実性を減らせる可能性があります。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
