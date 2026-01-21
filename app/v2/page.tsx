'use client';

import { useProfileStore } from '@/lib/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';
import { useWorldLines } from '@/hooks/useWorldLines';
import { Sidebar } from '@/components/layout/sidebar';
import { MoneyMarginCard } from '@/components/v2/MoneyMarginCard';
import { DecisionHost } from '@/components/v2/DecisionHost';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Readiness level colors and labels - 統一カラーパレット（落ち着いたトーン）
const readinessConfig = {
  excellent: { color: 'bg-gray-700', textColor: 'text-gray-700', label: '万全' },
  ready: { color: 'bg-gray-600', textColor: 'text-gray-600', label: '準備完了' },
  on_track: { color: 'bg-gray-500', textColor: 'text-gray-600', label: '順調' },
  needs_work: { color: 'bg-gray-500', textColor: 'text-gray-600', label: '要改善' },
  not_ready: { color: 'bg-gray-600', textColor: 'text-gray-700', label: '要対策' },
};

export default function V2DashboardPage() {
  // v2タブはダッシュボードのSoT（profile/simResult）を参照するだけ
  // 独自のrunSimulationは呼ばない（ストア二重化防止）
  const { profile, simResult, isLoading } = useProfileStore();
  
  // Calculate margins
  const margins = useMargin({ profile, simResult });
  
  // Get world lines (SoTを参照、独自計算なし)
  const { 
    baselineWorldLine,
    comparisonWorldLine,
    savedScenarios,
    selectedScenarioId,
    selectScenario,
    deleteScenario,
    loadScenario,
    comparison,
  } = useWorldLines();
  
  // 互換性のための変換（既存コンポーネント用）
  // 互換性のための変換（既存コンポーネント用）
  const worldLines = [baselineWorldLine, comparisonWorldLine].filter((w): w is NonNullable<typeof w> => w !== null);
  const activeWorldLine = baselineWorldLine;
  
  // Get strategy evaluation
  const strategy = useStrategy({
    profile,
    simResult,
    margins: {
      money: margins.money,
      time: margins.time,
      risk: margins.risk,
    },
    worldLines,
  });
  
  // v2タブは独自計算しない
  // ダッシュボードのsimResultを参照するだけ
  // runSimulationAsyncは呼ばない（ストア二重化防止）
  
  const readiness = readinessConfig[strategy.overallAssessment.readinessLevel];
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content - responsive margin for sidebar */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 overflow-auto">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Exit Readiness v2</h1>
              <p className="text-muted-foreground mt-1">
                意思決定を支援する次世代ダッシュボード
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Beta
            </Badge>
          </div>
          
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
                        {simResult?.score.overall.toFixed(0) ?? '--'}
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
                    {strategy.overallAssessment.timeToGoal && (
                      <Badge variant="outline">
                        目標まで {strategy.overallAssessment.timeToGoal} 年
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-medium">
                    {strategy.overallAssessment.keyMessage}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>目標: {profile.targetRetireAge}歳</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>生存率: {simResult?.metrics.survivalRate.toFixed(0) ?? '--'}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>信頼度: {strategy.overallAssessment.confidenceScore.toFixed(0)}%</span>
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
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="margins" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="margins" className="text-xs sm:text-sm">余白</TabsTrigger>
              <TabsTrigger value="decision" className="text-xs sm:text-sm">意思決定</TabsTrigger>
              <TabsTrigger value="worldlines" className="text-xs sm:text-sm">世界線</TabsTrigger>
              <TabsTrigger value="strategy" className="text-xs sm:text-sm">戦略</TabsTrigger>
            </TabsList>
            
            {/* Margins Tab */}
            <TabsContent value="margins" className="space-y-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <MoneyMarginCard 
                  moneyMargin={margins.moneyMargin} 
                  health={margins.moneyHealth}
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
                        {margins.time?.yearsToTarget ?? '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        目標達成まで（年）
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>進捗</span>
                        <span>{margins.time ? `${margins.time.progressPercent.toFixed(0)}%` : '—'}</span>
                      </div>
                      <Progress value={margins.time?.progressPercent ?? 0} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <div className="font-medium">{margins.time?.workingYearsLeft ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">労働可能年数</div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <div className="font-medium">{margins.time?.bufferYears ?? '—'}</div>
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
                        {margins.risk ? `${margins.risk.drawdownCapacity.toFixed(0)}%` : '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        許容下落率
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ボラティリティ耐性</span>
                        <Badge variant={margins.risk && margins.risk.volatilityTolerance > 15 ? 'default' : 'secondary'}>
                          {margins.risk ? `${margins.risk.volatilityTolerance.toFixed(0)}%` : '—'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">緊急資金カバー率</span>
                        <Badge variant={margins.risk && margins.risk.emergencyFundCoverage >= 6 ? 'default' : 'destructive'}>
                          {margins.risk ? `${margins.risk.emergencyFundCoverage.toFixed(1)}ヶ月` : '—'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">シーケンスリスク</span>
                        <Badge variant={margins.risk && margins.risk.sequenceRisk < 0.3 ? 'default' : 'destructive'}>
                          {margins.risk 
                            ? (margins.risk.sequenceRisk < 0.3 ? '低' : margins.risk.sequenceRisk < 0.6 ? '中' : '高')
                            : '—'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Decision Tab */}
            <TabsContent value="decision">
              <DecisionHost
                conclusion={{
                  type: strategy.overallAssessment.readinessLevel === 'excellent' || 
                        strategy.overallAssessment.readinessLevel === 'ready' 
                    ? 'positive' 
                    : strategy.overallAssessment.readinessLevel === 'on_track'
                    ? 'neutral'
                    : 'negative',
                  headline: strategy.primaryStrategy.name,
                  summary: strategy.primaryStrategy.description,
                  confidence: strategy.primaryStrategy.confidence,
                  keyNumber: {
                    value: strategy.overallAssessment.timeToGoal ?? 0,
                    unit: '年',
                    label: '目標達成まで',
                  },
                }}
                reasons={strategy.strategicInsights.slice(0, 4).map((insight) => ({
                  id: insight.id,
                  type: insight.category === 'strength' || insight.category === 'opportunity' 
                    ? 'positive' 
                    : 'negative',
                  title: insight.title,
                  description: insight.description,
                  impact: insight.relevance,
                }))}
                actions={strategy.urgentActions.slice(0, 3).map((action) => ({
                  id: action.id,
                  priority: action.impact === 'high' ? 'high' : action.impact === 'medium' ? 'medium' : 'low',
                  title: action.title,
                  description: action.description,
                  estimatedImpact: action.estimatedBenefit ?? '',
                  timeframe: action.timeHorizon === 'short' ? '1-3ヶ月' : action.timeHorizon === 'medium' ? '3-12ヶ月' : '1年以上',
                }))}
                isLoading={isLoading}
              />
            </TabsContent>
            
            {/* World Lines Tab */}
            <TabsContent value="worldlines" className="space-y-6">
              <div className="space-y-6">
                {/* 保存済みシナリオ選択 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      シナリオ選択
                    </CardTitle>
                    <CardDescription>
                      タイムラインで保存したシナリオを選択して現状と比較します
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {savedScenarios.length > 0 ? (
                      <div className="space-y-3">
                        {savedScenarios.map((scenario) => (
                          <div 
                            key={scenario.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedScenarioId === scenario.id
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => selectScenario(
                              selectedScenarioId === scenario.id ? null : scenario.id
                            )}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                selectScenario(selectedScenarioId === scenario.id ? null : scenario.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div>
                              <p className="font-medium">{scenario.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(scenario.createdAt).toLocaleString('ja-JP')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedScenarioId === scenario.id && (
                                <Badge variant="default" className="bg-primary">
                                  比較中
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadScenario(scenario.id);
                                }}
                              >
                                読込
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteScenario(scenario.id);
                                }}
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>保存済みシナリオがありません</p>
                        <p className="text-sm mt-1">
                          タイムラインタブでライフイベントを追加し、
                          「シナリオ保存」ボタンで保存してください
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 比較結果 */}
                {comparison && comparisonWorldLine && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">比較結果</CardTitle>
                      <CardDescription>
                        現状と「{comparisonWorldLine.name}」の比較
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-4 text-center">
                          <div className={cn(
                            "text-2xl font-bold tabular-nums",
                            comparison.fireAgeDiff < 0 ? "text-emerald-700 dark:text-emerald-400" : comparison.fireAgeDiff > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            {comparison.fireAgeDiff > 0 ? '+' : ''}{comparison.fireAgeDiff}年
                          </div>
                          <div className="text-sm text-muted-foreground">FIRE年齢差</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                          <div className={cn(
                            "text-2xl font-bold tabular-nums",
                            comparison.survivalRateDiff > 0 ? "text-emerald-700 dark:text-emerald-400" : comparison.survivalRateDiff < 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            {comparison.survivalRateDiff > 0 ? '+' : ''}{comparison.survivalRateDiff.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">生存率差</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                          <div className={cn(
                            "text-2xl font-bold tabular-nums",
                            comparison.assetsAt60Diff > 0 ? "text-emerald-700 dark:text-emerald-400" : comparison.assetsAt60Diff < 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            {comparison.assetsAt60Diff > 0 ? '+' : ''}{(comparison.assetsAt60Diff / 10000).toFixed(1)}億
                          </div>
                          <div className="text-sm text-muted-foreground">60歳資産差</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                          <div className={cn(
                            "text-2xl font-bold tabular-nums",
                            comparison.midlifeSurplusDiff > 0 ? "text-emerald-700 dark:text-emerald-400" : comparison.midlifeSurplusDiff < 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            {comparison.midlifeSurplusDiff > 0 ? '+' : ''}{comparison.midlifeSurplusDiff.toFixed(0)}万
                          </div>
                          <div className="text-sm text-muted-foreground">年間余剰差</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">{comparison.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* 比較結果がない場合のガイド */}
                {!comparison && savedScenarios.length > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>上のリストからシナリオを選択すると</p>
                      <p>現状との比較結果が表示されます</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            {/* Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6">
              {/* Primary Strategy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-gray-600" />
                        推奨戦略: {strategy.primaryStrategy.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {strategy.primaryStrategy.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      信頼度 {strategy.primaryStrategy.confidence.toFixed(0)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Expected Outcomes */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        +{strategy.primaryStrategy.expectedOutcome.scoreImprovement}
                      </div>
                      <div className="text-sm text-muted-foreground">スコア改善予測</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {strategy.primaryStrategy.expectedOutcome.timeToFire ?? '--'}年
                      </div>
                      <div className="text-sm text-muted-foreground">目標達成予測</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {strategy.primaryStrategy.expectedOutcome.riskReduction > 0 ? '-' : '+'}
                        {Math.abs(strategy.primaryStrategy.expectedOutcome.riskReduction)}%
                      </div>
                      <div className="text-sm text-muted-foreground">リスク変化</div>
                    </div>
                  </div>
                  
                  {/* Required Actions */}
                  <div>
                    <h4 className="font-medium mb-3">必要なアクション</h4>
                    <div className="space-y-2">
                      {strategy.primaryStrategy.requiredActions.map((action, index) => (
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
                      {strategy.primaryStrategy.assumptions.map((assumption, index) => (
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
                    {strategy.strategicInsights.map((insight) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
