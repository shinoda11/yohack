'use client';

import type { SimulationResult, Profile } from '@/lib/types';
import type { SavedScenario } from '@/lib/store';
import type { OverallAssessment, StrategyRecommendation, StrategicInsight } from '@/hooks/useStrategy';
import type { MoneyMargin } from '@/lib/v2/margin';
import type { TimeMarginV2, RiskMarginV2 } from '@/hooks/useMargin';

import { MoneyMarginCard } from '@/components/v2/MoneyMarginCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Target,
  TrendingUp,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Info,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // margins
  moneyMargin: MoneyMargin | null;
  moneyHealth: 'excellent' | 'good' | 'fair' | 'poor' | null;
  timeMargin: TimeMarginV2 | null;
  riskMargin: RiskMarginV2 | null;
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
    moneyMargin,
    moneyHealth,
    timeMargin,
    riskMargin,
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
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(simResult?.score.overall ?? 0) * 3.52} 352`}
                      className={readiness.textColor}
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
              <div className="flex-1 space-y-3">
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
                <p className="text-lg font-medium">
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
                <Button className="gap-2">
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
              <span className="font-medium">{displayName}</span>
              {displayDate && <span className="text-muted-foreground text-xs">({displayDate})</span>}
            </div>
          );
        })()}
      </>
    );
  }

  if (renderMode === 'margins') {
    return (
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MoneyMarginCard
          moneyMargin={moneyMargin}
          health={moneyHealth}
          isLoading={isLoading}
        />

        {/* Time Margin Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-gray-500" />
              時間の余白
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              目標達成への時間的な見通し（断定ではなく目安）
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">
                {timeMargin?.yearsToTarget ?? '—'}
              </div>
              <div className="text-sm text-muted-foreground">
                目標達成まで（年）
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>進捗</span>
                <span>{timeMargin ? `${timeMargin.progressPercent.toFixed(0)}%` : '—'}</span>
              </div>
              <Progress value={timeMargin?.progressPercent ?? 0} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="font-medium">{timeMargin?.workingYearsLeft ?? '—'}</div>
                <div className="text-xs text-muted-foreground">労働可能年数</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="font-medium">{timeMargin?.bufferYears ?? '—'}</div>
                <div className="text-xs text-muted-foreground">バッファ年数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Margin Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-gray-500" />
              リスクの余白
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              市場変動への耐性（前提で変わる目安）
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">
                {riskMargin ? `${riskMargin.drawdownCapacity.toFixed(0)}%` : '—'}
              </div>
              <div className="text-sm text-muted-foreground">
                許容下落率
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">ボラティリティ耐性</span>
                <Badge variant={riskMargin && riskMargin.volatilityTolerance > 15 ? 'default' : 'secondary'}>
                  {riskMargin ? `${riskMargin.volatilityTolerance.toFixed(0)}%` : '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">緊急資金カバー率</span>
                <Badge variant={riskMargin && riskMargin.emergencyFundCoverage >= 6 ? 'default' : 'destructive'}>
                  {riskMargin ? `${riskMargin.emergencyFundCoverage.toFixed(1)}ヶ月` : '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">シーケンスリスク</span>
                <Badge variant={riskMargin && riskMargin.sequenceRisk < 0.3 ? 'default' : 'destructive'}>
                  {riskMargin
                    ? (riskMargin.sequenceRisk < 0.3 ? '低' : riskMargin.sequenceRisk < 0.6 ? '中' : '高')
                    : '—'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <Sparkles className="h-5 w-5 text-gray-600" />
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
              <div className="text-2xl font-bold text-gray-800">
                +{primaryStrategy.expectedOutcome.scoreImprovement}
              </div>
              <div className="text-sm text-muted-foreground">スコア改善予測</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {primaryStrategy.expectedOutcome.timeToFire ?? '--'}年
              </div>
              <div className="text-sm text-muted-foreground">安心ラインまで</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {primaryStrategy.expectedOutcome.riskReduction > 0 ? '-' : '+'}
                {Math.abs(primaryStrategy.expectedOutcome.riskReduction)}%
              </div>
              <div className="text-sm text-muted-foreground">リスク変化</div>
            </div>
          </div>

          {/* Required Actions */}
          <div>
            <h4 className="font-medium mb-3">必要なアクション</h4>
            <div className="space-y-2">
              {primaryStrategy.requiredActions.map((action: string, index: number) => (
                <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
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
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-700"
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
                <h4 className="font-medium">{insight.title}</h4>
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
