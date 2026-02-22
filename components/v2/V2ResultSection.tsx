'use client';

import type { SimulationResult, Profile } from '@/lib/types';
import type { SavedScenario } from '@/lib/store';
import type { OverallAssessment, StrategyRecommendation, StrategicInsight } from '@/hooks/useStrategy';
import type { MoneyMargin } from '@/lib/v2/margin';

import { MoneyMarginCard } from '@/components/v2/MoneyMarginCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Info,
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
  // strategy
  primaryStrategy: StrategyRecommendation;
  strategicInsights: StrategicInsight[];
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
    primaryStrategy,
    strategicInsights,
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
                      stroke={(simResult?.score.overall ?? 0) >= 80 ? '#4A7C59' : (simResult?.score.overall ?? 0) >= 50 ? '#C8B89A' : '#CC3333'}
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
                  戦略を見る
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
              <CardTitle className="flex items-center gap-2 text-base">
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
  return (
    <>
      {/* Primary Strategy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-bronze" />
                推奨戦略: {primaryStrategy.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {primaryStrategy.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">
              信頼度 {primaryStrategy.confidence.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expected Outcomes */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-brand-stone">
                +{primaryStrategy.expectedOutcome.scoreImprovement}
              </div>
              <div className="text-sm text-muted-foreground">予測スコア改善</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-brand-stone">
                {primaryStrategy.expectedOutcome.timeToFire ?? '--'}年
              </div>
              <div className="text-sm text-muted-foreground">安心ラインまで</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-brand-stone">
                {primaryStrategy.expectedOutcome.riskReduction > 0 ? '-' : '+'}
                {Math.abs(primaryStrategy.expectedOutcome.riskReduction)}%
              </div>
              <div className="text-sm text-muted-foreground">リスク変化</div>
            </div>
          </div>

          {/* Required Actions */}
          <div>
            <h4 className="font-normal mb-4">必要なアクション</h4>
            <div className="space-y-2">
              {primaryStrategy.requiredActions.map((action: string, index: number) => (
                <div key={index} className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div>
            <h4 className="font-normal mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" />
              前提条件
            </h4>
            <div className="flex flex-wrap gap-2">
              {primaryStrategy.assumptions.map((assumption: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {assumption}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle>戦略的インサイト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {strategicInsights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-brand-linen bg-brand-canvas/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      insight.category === 'strength' && 'bg-[#E8F5E8] text-safe border-safe/30',
                      insight.category === 'weakness' && 'bg-[#FDE8E8] text-danger border-danger/30',
                      insight.category === 'opportunity' && 'bg-[#E8EFF5] text-[#4A6FA5] border-[#4A6FA5]/30',
                      insight.category === 'threat' && 'border-brand-bronze/60 text-brand-stone',
                    )}
                  >
                    {insight.category === 'strength' && '強み'}
                    {insight.category === 'weakness' && '弱み'}
                    {insight.category === 'opportunity' && '機会'}
                    {insight.category === 'threat' && '脅威'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    関連度 {insight.relevance}%
                  </span>
                </div>
                <h4 className="font-normal">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
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
