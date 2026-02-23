'use client';

import type { SimulationResult, Profile } from '@/lib/types';
import type { SavedScenario } from '@/lib/store';
import type { OverallAssessment } from '@/hooks/useStrategy';
import type { MoneyMargin } from '@/lib/v2/margin';

import { MoneyMarginCard } from '@/components/v2/MoneyMarginCard';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  Shield,
  ArrowRight,
  SlidersHorizontal,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateMoneyMargin } from '@/lib/v2/adapter';

interface V2ResultSectionProps {
  renderMode: 'hero' | 'margins' | 'strategy';
  simResult: SimulationResult | null;
  profile: Profile;
  isLoading: boolean;
  // hero
  readiness: { color: string; textColor: string; label: string };
  overallAssessment: OverallAssessment;
  scenarios: SavedScenario[];
  selectedComparisonIds: string[];
  onViewStrategy?: () => void;
  // margins
  moneyMargin: MoneyMargin | null;
  moneyHealth: 'excellent' | 'good' | 'fair' | 'poor' | null;
}

export function V2ResultSection(props: V2ResultSectionProps) {
  const {
    renderMode,
    simResult,
    profile,
    isLoading,
    readiness,
    overallAssessment,
    scenarios,
    selectedComparisonIds,
    onViewStrategy,
    moneyMargin,
    moneyHealth,
  } = props;

  if (renderMode === 'hero') {
    return (
      <>
        {/* Overall Assessment Hero */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="var(--brand-gold)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(simResult?.score.overall ?? 0) * 3.52} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">
                      {simResult?.score.overall != null ? simResult.score.overall.toFixed(0) : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Assessment Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={cn(readiness.color, 'text-white')}>
                    {readiness.label}
                  </Badge>
                  {overallAssessment.timeToGoal && (
                    <Badge variant="outline">
                      目標まで {overallAssessment.timeToGoal} 年
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-normal">
                  {overallAssessment.keyMessage}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>目標: {profile.targetRetireAge}歳</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>生存率: {simResult?.metrics.survivalRate != null ? `${simResult.metrics.survivalRate.toFixed(0)}%` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>信頼度: {overallAssessment.confidenceScore.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex-shrink-0">
                <Button className="gap-2" onClick={onViewStrategy}>
                  変数を見る
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 現在の世界線表示 */}
        {(() => {
          const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id));
          const displayName = selectedScenario?.name || '現在';
          const displayDate = selectedScenario
            ? new Date(selectedScenario.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
            : '';
          return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">表示中:</span>
              <span className="font-normal">{displayName}</span>
              {displayDate && <span className="text-muted-foreground text-xs">({displayDate})</span>}
            </div>
          );
        })()}
      </>
    );
  }

  if (renderMode === 'margins') {
    // 世界線間の余白比較用データ
    const comparisonScenarios = scenarios.filter(s => selectedComparisonIds.includes(s.id));
    const hasComparison = comparisonScenarios.length > 0;

    return (
      <div className="space-y-6">
        {/* MoneyMargin カード */}
        <MoneyMarginCard
          moneyMargin={moneyMargin}
          health={moneyHealth}
          isLoading={isLoading}
        />

        {/* 世界線間の余白比較（2つ以上ある場合） */}
        {hasComparison && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="h-5 w-5 text-brand-bronze" />
                世界線間の余白比較
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-normal text-muted-foreground">指標</th>
                      <th className="text-right py-2 px-4 font-normal">現在</th>
                      {comparisonScenarios.map(s => (
                        <th key={s.id} className="text-right py-2 px-4 font-normal">{s.name}</th>
                      ))}
                      {comparisonScenarios.length === 1 && (
                        <th className="text-right py-2 pl-4 font-normal text-muted-foreground">差分</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const baseMargin = moneyMargin;
                      const scenarioMargins = comparisonScenarios.map(s =>
                        s.result ? calculateMoneyMargin(profile, s.result) : null
                      );

                      const rows = [
                        {
                          label: '月次貯蓄',
                          unit: '万円',
                          base: baseMargin?.monthlyNetSavings,
                          scenarios: scenarioMargins.map(m => m?.monthlyNetSavings),
                        },
                        {
                          label: '緊急資金',
                          unit: 'ヶ月',
                          base: baseMargin?.emergencyFundCoverage,
                          scenarios: scenarioMargins.map(m => m?.emergencyFundCoverage),
                        },
                        {
                          label: '年間可処分所得',
                          unit: '万円',
                          base: baseMargin?.annualDisposableIncome,
                          scenarios: scenarioMargins.map(m => m?.annualDisposableIncome),
                        },
                      ];

                      return rows.map(row => (
                        <tr key={row.label} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                          <td className="py-2 px-4 text-right tabular-nums">
                            {formatValue(row.base, row.unit)}
                          </td>
                          {row.scenarios.map((val, i) => (
                            <td key={i} className="py-2 px-4 text-right tabular-nums">
                              {formatValue(val, row.unit)}
                            </td>
                          ))}
                          {comparisonScenarios.length === 1 && (
                            <td className="py-2 pl-4 text-right tabular-nums">
                              {formatDiff(row.base, row.scenarios[0], row.unit)}
                            </td>
                          )}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // renderMode === 'strategy'
  const householdIncome = profile.grossIncome + (profile.partnerGrossIncome ?? 0);
  const monthlySpending = profile.livingCostAnnual / 12;
  const emergencyMonths = monthlySpending > 0
    ? profile.assetCash / monthlySpending
    : 0;
  const housingEvent = profile.lifeEvents?.find(
    (e) => e.type === 'housing_purchase' && e.purchaseDetails
  );
  const propertyPrice = housingEvent?.purchaseDetails?.propertyPrice ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-5 w-5 text-brand-bronze" />
          スコアに影響する変数
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            variant="default"
            label="世帯年収"
            value={`${householdIncome.toLocaleString()}`}
            suffix="万円"
          />
          <MetricCard
            variant="default"
            label="年間支出"
            value={`${profile.livingCostAnnual.toLocaleString()}`}
            suffix="万円"
          />
          <MetricCard
            variant="default"
            label="投資リターン"
            value={`${profile.expectedReturn}`}
            suffix="%"
          />
          <MetricCard
            variant="default"
            label="緊急資金"
            value={`${emergencyMonths.toFixed(1)}`}
            suffix="ヶ月"
          />
          {propertyPrice > 0 && (
            <MetricCard
              variant="default"
              label="物件価格"
              value={`${propertyPrice.toLocaleString()}`}
              suffix="万円"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          これらの変数を変更すると、スコアが変動します。ダッシュボードで値を変えてお試しください。
        </p>
      </CardContent>
    </Card>
  );
}

function formatValue(val: number | undefined | null, unit: string): string {
  if (val == null || Number.isNaN(val)) return '—';
  if (unit === 'ヶ月') return `${Math.floor(val)}${unit}`;
  return `${Math.floor(val)}${unit}`;
}

function formatDiff(base: number | undefined | null, target: number | undefined | null, unit: string): string {
  if (base == null || target == null || Number.isNaN(base) || Number.isNaN(target)) return '—';
  const diff = Math.floor(target) - Math.floor(base);
  if (diff === 0) return '±0';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff}${unit}`;
}
