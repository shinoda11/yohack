'use client';

import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';

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
  const { profile, simResult, isLoading, scenarios, loadScenario } = useProfileStore();
  
  // UI状態（比較対象選択）のみv2で管理
  const { selectedComparisonIds, toggleComparisonId, clearComparisonIds } = useV2Store();
  
  // Calculate margins
  const margins = useMargin({ profile, simResult });
  
  // 互換性のための変換（既存コンポーネント用）
  const worldLines = simResult ? [{ 
    id: 'baseline', 
    name: '現在', 
    profile, 
    result: simResult 
  }] : [];
  
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
                      <span>生存率: {simResult?.metrics.survivalRate != null ? `${simResult.metrics.survivalRate.toFixed(0)}%` : '—'}</span>
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
          <Tabs defaultValue="worldlines" className="space-y-6">
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
            
            {/* World Lines Tab - 表形式で並列比較 */}
            <TabsContent value="worldlines" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    世界線比較
                  </CardTitle>
                  <CardDescription>
                    現在の状態と保存済みシナリオを並列比較します（最大2つまで選択可能）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 比較表 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground w-40">指標</th>
                          <th className="text-center py-3 px-2 font-medium min-w-32">
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="default" className="bg-primary">現在</Badge>
                              <span className="text-xs text-muted-foreground">Baseline</span>
                            </div>
                          </th>
                          {scenarios.slice(0, 2).map((scenario) => (
                            <th key={scenario.id} className="text-center py-3 px-2 font-medium min-w-32">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleComparisonId(scenario.id)}
                                  className={cn(
                                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                                    selectedComparisonIds.includes(scenario.id)
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                  )}
                                >
                                  {scenario.name}
                                </button>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(scenario.createdAt).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                            </th>
                          ))}
                          {scenarios.length === 0 && (
                            <th className="text-center py-3 px-2 font-medium min-w-32">
                              <span className="text-muted-foreground text-xs">シナリオなし</span>
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Safe Exit Age */}
                        <tr className="border-b hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">Safe Exit Age</td>
                          <td className="text-center py-3 px-2 tabular-nums font-semibold">
                            {(() => {
                              if (!simResult) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                              const age = simResult.metrics.safeWithdrawalAge;
                              if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                              return `${age}歳`;
                            })()}
                          </td>
                          {scenarios.slice(0, 2).map((scenario) => (
                            <td key={scenario.id} className={cn(
                              "text-center py-3 px-2 tabular-nums font-semibold",
                              selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                            )}>
                              {(() => {
                                if (!scenario.result) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                                const age = scenario.result.metrics.safeWithdrawalAge;
                                if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                                return `${age}歳`;
                              })()}
                            </td>
                          ))}
                          {scenarios.length === 0 && (
                            <td className="text-center py-3 px-2 text-muted-foreground text-xs">—</td>
                          )}
                        </tr>
                        
                        {/* 60歳時点の資産 */}
                        <tr className="border-b hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">60歳時点資産</td>
                          <td className="text-center py-3 px-2 tabular-nums font-semibold">
                            {(() => {
                              if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                              if (profile.currentAge > 60) return <span className="text-muted-foreground text-xs">なし</span>;
                              const idx = Math.min(60 - profile.currentAge, simResult.paths.yearlyData.length - 1);
                              const assets = simResult.paths.yearlyData[idx]?.assets;
                              if (assets == null || Number.isNaN(assets)) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                              return `${(assets / 10000).toFixed(1)}億`;
                            })()}
                          </td>
                          {scenarios.slice(0, 2).map((scenario) => {
                            const data = scenario.result?.paths.yearlyData;
                            if (!data) {
                              return (
                                <td key={scenario.id} className={cn(
                                  "text-center py-3 px-2 text-muted-foreground text-xs",
                                  selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                                )}>—（未計算）</td>
                              );
                            }
                            if (scenario.profile.currentAge > 60) {
                              return (
                                <td key={scenario.id} className={cn(
                                  "text-center py-3 px-2 text-muted-foreground text-xs",
                                  selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                                )}>なし</td>
                              );
                            }
                            const idx = Math.min(60 - scenario.profile.currentAge, data.length - 1);
                            const assets = data[idx]?.assets;
                            if (assets == null || Number.isNaN(assets)) {
                              return (
                                <td key={scenario.id} className={cn(
                                  "text-center py-3 px-2 text-muted-foreground text-xs",
                                  selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                                )}>—（未計算）</td>
                              );
                            }
                            return (
                              <td key={scenario.id} className={cn(
                                "text-center py-3 px-2 tabular-nums font-semibold",
                                selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                              )}>
                                {`${(assets / 10000).toFixed(1)}億`}
                              </td>
                            );
                          })}
                          {scenarios.length === 0 && (
                            <td className="text-center py-3 px-2 text-muted-foreground text-xs">—</td>
                          )}
                        </tr>
                        
                        {/* 40-50代平均月次CFマージン - SoTのcashFlow.netCashFlowを参照 */}
                        <tr className="border-b hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">現在の月次CF</td>
                          <td className="text-center py-3 px-2 tabular-nums font-semibold">
                            {(() => {
                              // SoTのcashFlow.netCashFlowを参照（年間値を月次に変換）
                              const netCF = simResult?.cashFlow?.netCashFlow;
                              if (netCF == null || Number.isNaN(netCF)) {
                                return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                              }
                              const monthlyCF = netCF / 12;
                              return `${monthlyCF.toFixed(0)}万/月`;
                            })()}
                          </td>
                          {scenarios.slice(0, 2).map((scenario) => {
                            const netCF = scenario.result?.cashFlow?.netCashFlow;
                            if (netCF == null || Number.isNaN(netCF)) {
                              return (
                                <td key={scenario.id} className={cn(
                                  "text-center py-3 px-2 text-muted-foreground text-xs",
                                  selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                                )}>—（未計算）</td>
                              );
                            }
                            const monthlyCF = netCF / 12;
                            return (
                              <td key={scenario.id} className={cn(
                                "text-center py-3 px-2 tabular-nums font-semibold",
                                selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                              )}>
                                {`${monthlyCF.toFixed(0)}万/月`}
                              </td>
                            );
                          })}
                          {scenarios.length === 0 && (
                            <td className="text-center py-3 px-2 text-muted-foreground text-xs">—</td>
                          )}
                        </tr>
                        
                        {/* Drawdown開始年齢 */}
                        <tr className="hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">Drawdown開始</td>
                          <td className="text-center py-3 px-2 tabular-nums font-semibold">
                            {(() => {
                              if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                              const ddIdx = simResult.paths.yearlyData.findIndex((y, i) => 
                                i > 0 && y.assets < simResult.paths.yearlyData[i - 1].assets
                              );
                              // Drawdownがない = 資産が常に増加している
                              return ddIdx > 0 
                                ? `${profile.currentAge + ddIdx}歳` 
                                : <span className="text-muted-foreground text-xs">なし</span>;
                            })()}
                          </td>
                          {scenarios.slice(0, 2).map((scenario) => {
                            const data = scenario.result?.paths.yearlyData;
                            if (!data) {
                              return (
                                <td key={scenario.id} className={cn(
                                  "text-center py-3 px-2 text-muted-foreground text-xs",
                                  selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                                )}>—（未計算）</td>
                              );
                            }
                            const ddIdx = data.findIndex((y, i) => i > 0 && y.assets < data[i - 1].assets);
                            return (
                              <td key={scenario.id} className={cn(
                                "text-center py-3 px-2",
                                ddIdx > 0 ? "tabular-nums font-semibold" : "text-muted-foreground text-xs",
                                selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                              )}>
                                {ddIdx > 0 ? `${scenario.profile.currentAge + ddIdx}歳` : 'なし'}
                              </td>
                            );
                          })}
                          {scenarios.length === 0 && (
                            <td className="text-center py-3 px-2 text-muted-foreground text-xs">—</td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* アクション行 */}
                  {scenarios.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedComparisonIds.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearComparisonIds}
                            className="bg-transparent"
                          >
                            選択解除
                          </Button>
                        )}
                        {scenarios.slice(0, 2).map((scenario) => (
                          <Button
                            key={scenario.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => loadScenario(scenario.id)}
                          >
                            「{scenario.name}」を読み込む
                          </Button>
                        ))}
                      </div>
                      <a 
                        href="/timeline" 
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <span>新しいシナリオを作成</span>
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  
                  {/* シナリオがない場合 */}
                  {scenarios.length === 0 && (
                    <div className="mt-4 pt-4 border-t text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        タイムラインでライフイベントを追加し、シナリオを保存すると比較できます
                      </p>
                      <a 
                        href="/timeline" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 text-sm font-medium transition-colors"
                      >
                        タイムラインでシナリオを作成
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
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
