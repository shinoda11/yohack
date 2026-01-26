'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label"
import { GitBranch, Save, RotateCcw, Home, Users, ChevronRight } from 'lucide-react';

import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';
import { useToast } from '@/hooks/use-toast';
import type { LifeEvent } from '@/lib/types';

import { Sidebar } from '@/components/layout/sidebar';
import { MoneyMarginCard } from '@/components/v2/MoneyMarginCard';
import { DecisionHost } from '@/components/v2/DecisionHost';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { profile, simResult, isLoading, scenarios, loadScenario, saveAllocationAsScenario } = useProfileStore();
  const { toast } = useToast();
  
  // 配分保存ダイアログ用の状態
  const [isAllocationSaveDialogOpen, setIsAllocationSaveDialogOpen] = useState(false);
  const [allocationScenarioName, setAllocationScenarioName] = useState('');
  
  // UI状態（比較対象選択・配分・ブリッジ・出口ターゲット）のみv2で管理
  const { 
    selectedComparisonIds, toggleComparisonId, clearComparisonIds, setSelectedComparisonIds, 
    allocation, setAllocation, allocationDirty, resetAllocation, markAllocationSaved,
    bridges, setHousingBridge, setChildrenBridge, setActiveTab, activeTab,
    exitTarget, setExitTarget, exitTargetCompatibility, setExitTargetCompatibility,
    consensusPriorities, togglePartnerPriority
  } = useV2Store();
  
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
              <h1 className="text-3xl font-bold tracking-tight">YOHACK v2</h1>
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
          
          {/* 現在の世界線表示 */}
          {(() => {
            const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id));
            const displayName = selectedScenario?.name || 'Baseline（現在）';
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
          
          {/* Main Content Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as 'margins' | 'allocation' | 'decision' | 'worldlines' | 'strategy')}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="margins" className="text-xs sm:text-sm">余白</TabsTrigger>
              <TabsTrigger value="allocation" className="text-xs sm:text-sm">使い道</TabsTrigger>
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
            
            {/* Allocation Tab - 余白の使い道 */}
            <TabsContent value="allocation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                    余白の使い道
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    <span className="block">条件を変えたときに増える/減る余白を、人生のアウトカムに翻訳しています。</span>
                    <span className="block">数値（ExitScore等）は変えず、意思決定の読み替えだけを行います。</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 注意書き - 常時表示 */}
                  <p className="text-xs text-muted-foreground border-l-2 border-amber-400 pl-3 py-1 bg-amber-50/50 dark:bg-amber-950/20 rounded-r">
                    これは最適解ではなく目安です。前提で変わります。決めるのは利用者です。
                  </p>
                  {/* 比較対象の選択 */}
                  {scenarios.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">比較するシナリオを選択</Label>
                        <div className="flex flex-wrap gap-2">
                          {scenarios.slice(0, 3).map((scenario) => (
                            <Button
                              key={scenario.id}
                              variant={selectedComparisonIds.includes(scenario.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (selectedComparisonIds.includes(scenario.id)) {
                                  setSelectedComparisonIds(selectedComparisonIds.filter(id => id !== scenario.id));
                                } else if (selectedComparisonIds.length < 1) {
                                  setSelectedComparisonIds([scenario.id]);
                                } else {
                                  setSelectedComparisonIds([scenario.id]);
                                }
                              }}
                            >
                              {scenario.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* 余白の内訳比較 - Baseline vs Selected */}
                      {(() => {
                        const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id));
                        const baselineCF = simResult?.cashFlow;
                        const scenarioCF = selectedScenario?.result?.cashFlow;
                        
                        // 差分計算（SoT参照のみ）: selected - baseline
                        const netCFDiff = baselineCF && scenarioCF
                          ? (scenarioCF.netCashFlow ?? 0) - (baselineCF.netCashFlow ?? 0)
                          : null;
                        
                        // 差分の解釈用ヘルパー
                        const formatDiff = (diff: number | null, unit: string) => {
                          if (diff === null || Number.isNaN(diff)) return { label: '—', type: 'unknown' as const };
                          if (diff > 0) return { label: `${Math.abs(diff).toFixed(0)}${unit}`, type: 'surplus' as const };
                          if (diff < 0) return { label: `${Math.abs(diff).toFixed(0)}${unit}`, type: 'cost' as const };
                          return { label: '変化なし', type: 'neutral' as const };
                        };
                        
                        const cfResult = formatDiff(netCFDiff, '万円/年');
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">
                                {selectedScenario 
                                  ? `現在（Baseline） → ${selectedScenario.name}` 
                                  : 'シナリオを選択してください'}
                              </h4>
                            </div>
                            
                            {selectedScenario ? (
                              <div className="space-y-4">
                                {/* メイン：年間キャッシュフロー差分 */}
                                <div className={cn(
                                  "rounded-xl border-2 p-6 text-center",
                                  cfResult.type === 'surplus' && "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                                  cfResult.type === 'cost' && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                                  cfResult.type === 'neutral' && "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30",
                                  cfResult.type === 'unknown' && "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30"
                                )}>
                                  {cfResult.type === 'unknown' ? (
                                    <div className="text-muted-foreground">—</div>
                                  ) : cfResult.type === 'surplus' ? (
                                    <>
                                      <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">余白</div>
                                      <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {cfResult.label}
                                      </div>
                                      <div className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">増える</div>
                                    </>
                                  ) : cfResult.type === 'cost' ? (
                                    <>
                                      <div className="text-sm text-amber-700 dark:text-amber-400 mb-1">追加コスト</div>
                                      <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                                        {cfResult.label}
                                      </div>
                                      <div className="text-sm text-amber-600 dark:text-amber-500 mt-1">増える</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-sm text-muted-foreground mb-1">年間キャッシュフロー</div>
                                      <div className="text-2xl font-bold text-muted-foreground">変化なし</div>
                                    </>
                                  )}
                                </div>
                                
                                {/* 配分スライダーと翻訳カード（余白がある場合のみ表示） */}
                                {cfResult.type === 'surplus' && netCFDiff !== null && netCFDiff > 0 && (
                                  <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-sm">この余白をどう使う？（目安）</h5>
                                      <div className="flex items-center gap-2">
                                        {allocationDirty && (
                                          <>
                                            <span className="text-xs text-amber-600 dark:text-amber-400">未保存の変更あり</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={resetAllocation}
                                              className="h-7 px-2 text-xs"
                                            >
                                              <RotateCcw className="h-3 w-3 mr-1" />
                                              リセット
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">配分を変えても主要KPIには影響しません。考え方の整理用です。</p>
                                    
                                    {/* 配分スライダー */}
                                    <div className="space-y-4">
                                      {/* 旅・ライフスタイル */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">旅・ライフスタイル</span>
                                          <span className="text-sm font-medium tabular-nums">{allocation.travel}%</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={allocation.travel}
                                          onChange={(e) => setAllocation('travel', Number(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>
                                      
                                      {/* 投資 */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">投資</span>
                                          <span className="text-sm font-medium tabular-nums">{allocation.invest}%</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={allocation.invest}
                                          onChange={(e) => setAllocation('invest', Number(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                      </div>
                                      
                                      {/* 自由時間 */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm">自由時間</span>
                                          <span className="text-sm font-medium tabular-nums">{allocation.freeTime}%</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={allocation.freeTime}
                                          onChange={(e) => setAllocation('freeTime', Number(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* 翻訳カード */}
                                    <div className="grid gap-3 sm:grid-cols-3 pt-2">
                                      {/* 旅・ライフスタイル */}
                                      <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
                                        <div className="text-xs text-muted-foreground">追加旅行予算（年額目安）</div>
                                        <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                          {Math.round(netCFDiff * allocation.travel / 100)}万円
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          約{Math.max(0, Math.floor(netCFDiff * allocation.travel / 100 / 30))}回分
                                          <span className="text-xs ml-1">(1回30万円換算)</span>
                                        </div>
                                      </div>
                                      
                                      {/* 投資 */}
                                      <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1">
                                        <div className="text-xs text-muted-foreground">元本配分（年額目安）</div>
                                        <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                          {Math.round(netCFDiff * allocation.invest / 100)}万円
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          10年後: 約{Math.round(netCFDiff * allocation.invest / 100 * 10 * 1.63)}万円
                                          <span className="text-xs ml-1">(年5%複利)</span>
                                        </div>
                                      </div>
                                      
                                      {/* 自由時間 */}
                                      <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
                                        <div className="text-xs text-muted-foreground">余白時間（年換算目安）</div>
                                        <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                                          {(netCFDiff * allocation.freeTime / 100 / 500).toFixed(1)}年分
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          年収500万円換算での労働時間削減
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Step 3: 配分を世界線として保存 */}
                                    {allocation.travel > 0 && (
                                      <div className="pt-4 border-t rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs">Step 3</Badge>
                                          <h4 className="font-medium text-sm">世界線として保存</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">
                                          この配分を新しい世界線として保存し、比較に使えるようにします
                                        </p>
                                        <Button
                                          onClick={() => {
                                            const baseName = selectedScenario?.name || 'Baseline';
                                            setAllocationScenarioName(`${baseName} + 旅行配分`);
                                            setIsAllocationSaveDialogOpen(true);
                                          }}
                                          className="w-full"
                                        >
                                          <Save className="h-4 w-4 mr-2" />
                                          世界線として保存
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                          旅・ライフスタイル配分のみ反映（v0.1）
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* コストの場合の解釈 */}
                                {cfResult.type === 'cost' && (
                                  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
                                    <h5 className="font-medium text-sm">追加コストの使い道</h5>
                                    <p className="text-sm text-muted-foreground">
                                      このシナリオでは年間コストが増えます。ライフイベント（駐在、サバティカル、子育て等）への投資として使われています。
                                    </p>
                                  </div>
                                )}
                                
                                {/* 変化なしの場合 */}
                                {cfResult.type === 'neutral' && (
                                  <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">キャッシュフローに変化はありません。</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                上のボタンからシナリオを選択すると、現在との比較が表示されます
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    // シナリオがない場合は現在の余白（netCashFlow）を使用
                    (() => {
                      const baselineNetCF = simResult?.cashFlow?.netCashFlow;
                      const hasMargin = baselineNetCF != null && !Number.isNaN(baselineNetCF) && baselineNetCF > 0;
                      
                      return hasMargin ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-6 text-center">
                            <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">現在の年間余白</div>
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                              {baselineNetCF.toFixed(0)}万円/年
                            </div>
                          </div>
                          
                          <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm">この余白をどう使う？（目安）</h5>
                              <div className="flex items-center gap-2">
                                {allocationDirty && (
                                  <>
                                    <span className="text-xs text-amber-600 dark:text-amber-400">未保存の変更あり</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={resetAllocation}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      リセット
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">配分を変えても主要KPIには影響しません。考え方の整理用です。</p>
                            
                            {/* 配分スライダー */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">旅・ライフスタイル</span>
                                  <span className="text-sm font-medium tabular-nums">{allocation.travel}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={allocation.travel}
                                  onChange={(e) => setAllocation('travel', Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">投資</span>
                                  <span className="text-sm font-medium tabular-nums">{allocation.invest}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={allocation.invest}
                                  onChange={(e) => setAllocation('invest', Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">自由時間</span>
                                  <span className="text-sm font-medium tabular-nums">{allocation.freeTime}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={allocation.freeTime}
                                  onChange={(e) => setAllocation('freeTime', Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                />
                              </div>
                            </div>
                            
                            {/* 翻訳カード */}
                            <div className="grid gap-3 sm:grid-cols-3 pt-2">
                              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
                                <div className="text-xs text-muted-foreground">追加旅行予算（年額目安）</div>
                                <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                  {Math.round(baselineNetCF * allocation.travel / 100)}万円
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  約{Math.max(0, Math.floor(baselineNetCF * allocation.travel / 100 / 30))}回分
                                  <span className="text-xs ml-1">(1回30万円換算)</span>
                                </div>
                              </div>
                              <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1">
                                <div className="text-xs text-muted-foreground">元本配分（年額目安）</div>
                                <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                  {Math.round(baselineNetCF * allocation.invest / 100)}万円
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  10年後: 約{Math.round(baselineNetCF * allocation.invest / 100 * 10 * 1.63)}万円
                                  <span className="text-xs ml-1">(年5%複利)</span>
                                </div>
                              </div>
                              <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
                                <div className="text-xs text-muted-foreground">余白時間（年換算目安）</div>
                                <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                                  {(baselineNetCF * allocation.freeTime / 100 / 500).toFixed(1)}年分
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  年収500万円換算での労働時間削減
                                </div>
                              </div>
                            </div>
                            
                            {/* Step 3: 世界線として保存 */}
                            {allocation.travel > 0 && (
                              <div className="pt-4 border-t rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">Step 3</Badge>
                                  <h4 className="font-medium text-sm">世界線として保存</h4>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  この配分を新しい世界線として保存し、比較に使えるようにします
                                </p>
                                <Button
                                  onClick={() => {
                                    setAllocationScenarioName('Baseline + 旅行配分');
                                    setIsAllocationSaveDialogOpen(true);
                                  }}
                                  className="w-full"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  世界線として保存
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  旅・ライフスタイル配分のみ反映（v0.1）
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                            <Info className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">余白は小さめです</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              現在のキャッシュフローでは配分可能な余白がありません。タイムラインでシナリオを作成すると比較できます。
                            </p>
                          </div>
                          <a 
                            href="/timeline" 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 text-sm font-medium transition-colors"
                          >
                            タイムラインでシナリオを作成
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Decision Tab - 意思決定ブリッジ */}
            <TabsContent value="decision" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    意思決定の橋
                  </CardTitle>
                  <CardDescription>
                    大きな意思決定を選択すると、その選択による余白の変化を確認できます。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 2つのブリッジカード */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* 住まいブリッジ */}
                    <div className="rounded-xl border-2 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">住まい</h3>
                          <p className="text-xs text-muted-foreground">住居費は人生最大の支出</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'rent' as const, label: '賃貸', desc: '柔軟性重視' },
                          { value: 'buy' as const, label: '購入', desc: '資産形成' },
                          { value: 'buy_later' as const, label: '将来購入', desc: '様子見' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setHousingBridge(bridges.housing === option.value ? null : option.value)}
                            className={cn(
                              "p-3 rounded-lg border-2 text-center transition-all",
                              bridges.housing === option.value
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-transparent bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                      
                      {bridges.housing && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {bridges.housing === 'rent' && '賃貸は初期コストが低く、転居の自由度が高い。資産は別途形成が必要。'}
                            {bridges.housing === 'buy' && '購入は長期的にコストが固定され、資産として残る。初期コストと維持費に注意。'}
                            {bridges.housing === 'buy_later' && '今は賃貸で様子を見て、条件が整ったら購入を検討。柔軟な戦略。'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* 子どもブリッジ */}
                    <div className="rounded-xl border-2 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">子ども</h3>
                          <p className="text-xs text-muted-foreground">教育費は計画的に</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 0 as const, label: '0人', desc: '子なし' },
                          { value: 1 as const, label: '1人', desc: '一人っ子' },
                          { value: 2 as const, label: '2人', desc: '二人兄弟' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setChildrenBridge(bridges.children === option.value ? null : option.value)}
                            className={cn(
                              "p-3 rounded-lg border-2 text-center transition-all",
                              bridges.children === option.value
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                                : "border-transparent bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                      
                      {bridges.children !== null && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {bridges.children === 0 && '子どもがいない場合、教育費は不要。自由度が高く、早期退職に有利。'}
                            {bridges.children === 1 && '1人の場合、教育費は約1,000〜2,000万円（大学まで）。計画的な準備を。'}
                            {bridges.children === 2 && '2人の場合、教育費は約2,000〜4,000万円。余白への影響大。'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Step 1: ブリッジ選択後 → 比較へ */}
                  {(bridges.housing || bridges.children !== null) && (
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Step 1</Badge>
                            <h4 className="font-medium text-sm">世界線を比較する</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            この選択による数値の変化を比較表で確認します
                          </p>
                        </div>
                        <Button
                          onClick={() => setActiveTab('worldlines')}
                          size="sm"
                        >
                          比較へ
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* 選択なしの場合 */}
                  {!bridges.housing && bridges.children === null && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      上の選択肢を選ぶと、その意思決定による余白の変化を確認できます
                    </div>
                  )}
                </CardContent>
              </Card>
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
                  
                  {/* 出口ターゲット適合度（比較テーブル直下） */}
                  {exitTarget && (
                    <div className="mt-4 p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">出口ターゲット適合度</h4>
                          <Badge variant="outline" className="text-xs">目安</Badge>
                        </div>
                        {(() => {
                          // 簡易適合度判定（v0.1）
                          // 物件詳細（広さ/間取り/立地）が未入力のため、価格帯のみで暫定判定
                          const homeValue = profile.homeMarketValue;
                          const hasHomeData = profile.homeStatus === 'owner' || profile.homeStatus === 'planning';
                          
                          // 適合度計算（共通ロジック）
                          const priceRanges: Record<string, [number, number]> = {
                            young_single: [5000, 8000],
                            elite_single: [8000, 12000],
                            family_practical: [8000, 13000],
                            semi_investor: [12000, 20000],
                            high_end: [20000, 100000],
                          };
                          const [minPrice, maxPrice] = priceRanges[exitTarget] || [0, 0];
                          
                          // 適合度を計算してstoreに保持（将来TRI反映用）
                          let compatibility: 'high' | 'medium' | 'low' | 'hold' = 'hold';
                          if (!hasHomeData || homeValue === 0) {
                            compatibility = 'hold';
                          } else if (homeValue >= minPrice && homeValue <= maxPrice) {
                            compatibility = 'high';
                          } else if (homeValue >= minPrice * 0.8 && homeValue <= maxPrice * 1.2) {
                            compatibility = 'medium';
                          } else {
                            compatibility = 'low';
                          }
                          
                          // v0.1: storeに保持のみ、TRI計算には反映しない
                          // TODO(v0.2+): この値を基にTRI計算に重み付けを行う
                          // - 'high' → お金の余白に安心感補正
                          // - 'low' → 時間/体力コストとして売却リスク懸念を加算
                          if (exitTargetCompatibility !== compatibility) {
                            setExitTargetCompatibility(compatibility);
                          }
                          
                          // 表示
                          if (compatibility === 'hold') {
                            return <Badge variant="secondary" className="text-xs">判定保留</Badge>;
                          }
                          if (compatibility === 'high') {
                            return <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">適合: 高</Badge>;
                          }
                          if (compatibility === 'medium') {
                            return <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">適合: 中</Badge>;
                          }
                          return <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">適合: 低</Badge>;
                        })()}
                      </div>
                      
                      {/* 適合度理由 */}
                      <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                        {(() => {
                          const homeValue = profile.homeMarketValue;
                          const hasHomeData = profile.homeStatus === 'owner' || profile.homeStatus === 'planning';
                          
                          if (!hasHomeData || homeValue === 0) {
                            return (
                              <>
                                <li>物件の広さ/間取り/立地条件が未入力のため判定を保留しています</li>
                                <li>住居情報を入力すると、より正確な適合度を表示できます</li>
                                <li>現時点では出口ターゲットの一般傾向のみ参照ください</li>
                              </>
                            );
                          }
                          
                          const priceRanges: Record<string, [number, number]> = {
                            young_single: [5000, 8000],
                            elite_single: [8000, 12000],
                            family_practical: [8000, 13000],
                            semi_investor: [12000, 20000],
                            high_end: [20000, 100000],
                          };
                          const [minPrice, maxPrice] = priceRanges[exitTarget] || [0, 0];
                          const isInRange = homeValue >= minPrice && homeValue <= maxPrice;
                          const isNearRange = homeValue >= minPrice * 0.8 && homeValue <= maxPrice * 1.2;
                          
                          const targetLabels: Record<string, string> = {
                            young_single: '若手単身イケイケ層',
                            elite_single: 'エリート単身/若手カップル',
                            family_practical: '実需重視カップル',
                            semi_investor: '半住半投目線カップル',
                            high_end: 'つよつよカップル/士業/経営者',
                          };
                          
                          if (isInRange) {
                            return (
                              <>
                                <li>物件価格 {homeValue.toLocaleString()}万円 は {targetLabels[exitTarget]} の想定レンジ内にあります</li>
                                <li>この価格帯は将来の買い手候補が比較的多い傾向があります</li>
                                <li>広さ・間取り・立地の詳細が分かると、より精度が上がります（v0.1では未対応）</li>
                              </>
                            );
                          }
                          if (isNearRange) {
                            return (
                              <>
                                <li>物件価格 {homeValue.toLocaleString()}万円 は {targetLabels[exitTarget]} のレンジにやや近いです</li>
                                <li>ターゲット層の一部は検討対象にする可能性があります</li>
                                <li>立地や設備次第では適合度が変わる傾向があります</li>
                              </>
                            );
                          }
                          return (
                            <>
                              <li>物件価格 {homeValue.toLocaleString()}万円 は {targetLabels[exitTarget]} の想定レンジから離れています</li>
                              <li>この層をターゲットにする場合、価格調整や別ターゲットの検討が考えられます</li>
                              <li>ただし立地・設備によっては例外もあり得ます（目安としてご参照ください）</li>
                            </>
                          );
                        })()}
                      </ul>
                    </div>
                  )}
                  
                  {/* 出口ターゲット（将来の買い手像）- 解釈レイヤー */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">出口ターゲット（将来の買い手像）</h4>
                      <Badge variant="outline" className="text-xs">解釈のみ</Badge>
                    </div>
                    
                    {/* 誤読防止コピー - 常時表示 */}
                    <div className="mb-4 p-3 rounded-lg border-l-2 border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
                      <p className="text-xs text-foreground">これは将来の売却先を想定して「読み方」を揃えるためのレンズです。</p>
                      <p className="text-xs text-muted-foreground">シミュレーション数値は変えません。比較の観点だけを整理します。</p>
                    </div>
                    
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { value: 'young_single' as const, label: '若手単身イケイケ層', range: '5,000万〜8,000万', desc: '都心1LDK〜2LDK、駅近重視' },
                        { value: 'elite_single' as const, label: 'エリート単身/若手カップル', range: '8,000万〜1.2億', desc: '広め1LDK〜2LDK、設備重視' },
                        { value: 'family_practical' as const, label: '実需重視カップル', range: '8,000万〜1.3億', desc: '3LDK、学区・環境重視' },
                        { value: 'semi_investor' as const, label: '半住半投目線カップル', range: '1.2億〜2.0億', desc: '資産性・立地重視' },
                        { value: 'high_end' as const, label: 'つよつよカップル/士業/経営者', range: '2.0億〜', desc: 'プレミアム物件' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setExitTarget(exitTarget === option.value ? null : option.value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            exitTarget === option.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                              "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                              exitTarget === option.value ? "border-primary" : "border-muted-foreground/40"
                            )}>
                              {exitTarget === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium text-sm">{option.label}</span>
                          </div>
                          <div className="ml-5 space-y-0.5">
                            <div className="text-xs font-medium text-primary/80">{option.range}</div>
                            <div className="text-xs text-muted-foreground">{option.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* 選択状態の表示 */}
                    <div className="mt-3 text-xs text-muted-foreground">
                      {exitTarget ? (
                        <span>選択中: <span className="font-medium text-foreground">{
                          exitTarget === 'young_single' ? '若手単身イケイケ層' :
                          exitTarget === 'elite_single' ? 'エリート単身/若手カップル' :
                          exitTarget === 'family_practical' ? '実需重視カップル' :
                          exitTarget === 'semi_investor' ? '半住半投目線カップル' :
                          'つよつよカップル/士業/経営者'
                        }</span></span>
                      ) : (
                        <span>未指定（タップして選択）</span>
                      )}
                    </div>
                    
                    {/* 重視軸と理由コメント */}
                    {exitTarget && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/30 border space-y-3">
                        {/* 重視軸タグ */}
                        <div className="flex flex-wrap gap-2">
                          {exitTarget === 'young_single' && (
                            <>
                              <Badge variant="secondary" className="text-xs">立地重視</Badge>
                              <Badge variant="secondary" className="text-xs">職住近接</Badge>
                              <Badge variant="secondary" className="text-xs">築年許容</Badge>
                              <Badge variant="secondary" className="text-xs">狭さ許容</Badge>
                              <Badge variant="secondary" className="text-xs">値上がりエリア</Badge>
                            </>
                          )}
                          {exitTarget === 'elite_single' && (
                            <>
                              <Badge variant="secondary" className="text-xs">投資目線</Badge>
                              <Badge variant="secondary" className="text-xs">ブランド重視</Badge>
                              <Badge variant="secondary" className="text-xs">駅距離許容</Badge>
                              <Badge variant="secondary" className="text-xs">出口意識</Badge>
                            </>
                          )}
                          {exitTarget === 'family_practical' && (
                            <>
                              <Badge variant="secondary" className="text-xs">広さ重視</Badge>
                              <Badge variant="secondary" className="text-xs">採光・生活導線</Badge>
                              <Badge variant="secondary" className="text-xs">周辺施設</Badge>
                              <Badge variant="secondary" className="text-xs">学区</Badge>
                              <Badge variant="secondary" className="text-xs">2人で意思決定</Badge>
                            </>
                          )}
                          {exitTarget === 'semi_investor' && (
                            <>
                              <Badge variant="secondary" className="text-xs">年収倍率高め</Badge>
                              <Badge variant="secondary" className="text-xs">タワマン比率</Badge>
                              <Badge variant="secondary" className="text-xs">間取り重視</Badge>
                              <Badge variant="secondary" className="text-xs">与信限界</Badge>
                            </>
                          )}
                          {exitTarget === 'high_end' && (
                            <>
                              <Badge variant="secondary" className="text-xs">眺望重視</Badge>
                              <Badge variant="secondary" className="text-xs">駅徒歩</Badge>
                              <Badge variant="secondary" className="text-xs">共用施設</Badge>
                              <Badge variant="secondary" className="text-xs">プレミアム立地</Badge>
                            </>
                          )}
                        </div>
                        
                        {/* 理由コメント */}
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                          {exitTarget === 'young_single' && (
                            <>
                              <li>通勤時間を削減したい傾向が強く、駅近・都心立地に価値を感じやすい</li>
                              <li>広さより立地優先のため、コンパクトな間取りでも検討対象になりやすい</li>
                              <li>将来の値上がりを期待するエリアを好む傾向がある</li>
                            </>
                          )}
                          {exitTarget === 'elite_single' && (
                            <>
                              <li>資産形成の一環として不動産を捉え、売却時の流動性を重視する傾向</li>
                              <li>ブランドマンションや大手デベロッパー物件を好みやすい</li>
                              <li>多少駅から離れても、設備グレードを優先することがある</li>
                            </>
                          )}
                          {exitTarget === 'family_practical' && (
                            <>
                              <li>子育て環境や生活利便性を最優先し、広さ・採光・収納を重視する傾向</li>
                              <li>学区や公園・病院へのアクセスが意思決定に大きく影響しやすい</li>
                              <li>夫婦での合意形成が必要なため、検討期間が長くなることがある</li>
                            </>
                          )}
                          {exitTarget === 'semi_investor' && (
                            <>
                              <li>住みながら資産を増やす発想で、年収倍率を高めに設定する傾向</li>
                              <li>タワーマンションや再開発エリアを好みやすい</li>
                              <li>与信の限界まで借りる場合、金利上昇リスクへの備えが重要になりやすい</li>
                            </>
                          )}
                          {exitTarget === 'high_end' && (
                            <>
                              <li>多忙なため内見・検討に時間が取りにくく、意思決定が進みにくいことがある</li>
                              <li>眺望・共用施設・セキュリティなど、生活の質を重視する傾向</li>
                              <li>価格よりも希少性やステータスを優先することがある</li>
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* 合意形成の型（③④選択時のみ） */}
                    {(exitTarget === 'family_practical' || exitTarget === 'semi_investor') && (
                      <div className="mt-4 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <h5 className="font-medium text-sm">合意形成の型</h5>
                          <Badge variant="outline" className="text-xs">2人で意思決定</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          各自が重視する観点を3つ選び、一致点と相違点を確認します。数値には影響しません。
                        </p>
                        
                        {/* 優先順位チェック */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {(['partner1', 'partner2'] as const).map((partner, idx) => (
                            <div key={partner} className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                {idx === 0 ? 'パートナー1' : 'パートナー2'}（{consensusPriorities[partner].length}/3）
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { id: 'location', label: '立地' },
                                  { id: 'space', label: '広さ' },
                                  { id: 'sunlight', label: '採光' },
                                  { id: 'resale', label: '将来売却' },
                                  { id: 'education', label: '教育環境' },
                                  { id: 'commute', label: '通勤' },
                                ].map((item) => {
                                  const isSelected = consensusPriorities[partner].includes(item.id);
                                  const isDisabled = !isSelected && consensusPriorities[partner].length >= 3;
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => togglePartnerPriority(partner, item.id)}
                                      disabled={isDisabled}
                                      className={cn(
                                        "px-2 py-1.5 rounded text-xs border transition-all",
                                        isSelected
                                          ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-200"
                                          : isDisabled
                                          ? "bg-muted/30 border-transparent text-muted-foreground/50 cursor-not-allowed"
                                          : "bg-background border-border hover:border-amber-300"
                                      )}
                                    >
                                      {item.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 一致/不一致の表示 */}
                        {(consensusPriorities.partner1.length > 0 || consensusPriorities.partner2.length > 0) && (
                          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
                            {(() => {
                              const matched = consensusPriorities.partner1.filter(p => 
                                consensusPriorities.partner2.includes(p)
                              );
                              const only1 = consensusPriorities.partner1.filter(p => 
                                !consensusPriorities.partner2.includes(p)
                              );
                              const only2 = consensusPriorities.partner2.filter(p => 
                                !consensusPriorities.partner1.includes(p)
                              );
                              const labels: Record<string, string> = {
                                location: '立地', space: '広さ', sunlight: '採光',
                                resale: '将来売却', education: '教育環境', commute: '通勤'
                              };
                              
                              return (
                                <div className="space-y-1.5 text-xs">
                                  {matched.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                      <span className="text-green-700 dark:text-green-300">
                                        一致: {matched.map(m => labels[m]).join('、')}
                                      </span>
                                    </div>
                                  )}
                                  {(only1.length > 0 || only2.length > 0) && (
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                      <span className="text-amber-700 dark:text-amber-300">
                                        要相談: {[...only1, ...only2].map(m => labels[m]).join('、')}
                                      </span>
                                    </div>
                                  )}
                                  {matched.length === 0 && only1.length === 0 && only2.length === 0 && (
                                    <span className="text-muted-foreground">各自3つ選ぶと一致点が表示されます</span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
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
                  
                  {/* Step 2: 比較後 → 余白の使い道へ */}
                  <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Step 2</Badge>
                          <h4 className="font-medium text-sm">余白の使い道を決める</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          差分を確認したら、その余白をどう使うか配分を検討します
                        </p>
                      </div>
                      <Button
                        onClick={() => setActiveTab('allocation')}
                        size="sm"
                      >
                        使い道へ
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
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
      
      {/* 配分を世界線として保存するダイアログ */}
      <Dialog open={isAllocationSaveDialogOpen} onOpenChange={setIsAllocationSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配分を世界線として保存</DialogTitle>
            <DialogDescription>
              旅・ライフスタイル配分を新しい世界線として保存します。
              元のBaselineや選択中の世界線は変更されません。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="allocation-scenario-name">世界線の名前</Label>
              <Input
                id="allocation-scenario-name"
                value={allocationScenarioName}
                onChange={(e) => setAllocationScenarioName(e.target.value)}
                placeholder="例: 旅行重視プラン"
              />
            </div>
            
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">反映される内容（v0.1）:</p>
              <ul className="text-muted-foreground text-xs space-y-1 ml-4 list-disc">
                <li>旅・ライフスタイル: 年間支出イベントとして追加</li>
                <li>投資: 翻訳のみ（世界線に反映されません）</li>
                <li>自由時間: 翻訳のみ（世界線に反映されません）</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocationSaveDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                // 選択中のシナリオを取得
                const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id)) || null;
                const baseNetCF = selectedScenario?.result?.cashFlow?.netCashFlow 
                  ?? simResult?.cashFlow?.netCashFlow 
                  ?? 0;
                
                // 旅・ライフスタイル配分をLifeEventに変換
                const travelAmount = Math.round(baseNetCF * allocation.travel / 100);
                const allocationEvents: LifeEvent[] = [];
                
                if (travelAmount > 0) {
                  allocationEvents.push({
                    id: `allocation-travel-${Date.now()}`,
                    type: 'expense_increase',
                    name: '旅・ライフスタイル（配分）',
                    age: profile.currentAge,
                    amount: travelAmount,
                    duration: 10, // 10年間のデフォルト
                    isRecurring: true,
                  });
                }
                
                const result = saveAllocationAsScenario(
                  allocationScenarioName,
                  selectedScenario,
                  allocationEvents
                );
                
                if (result.success) {
                  toast({
                    title: '世界線を保存しました',
                    description: `「${result.scenario?.name}」を作成しました`,
                  });
                  markAllocationSaved();
                  setIsAllocationSaveDialogOpen(false);
                  setAllocationScenarioName('');
                } else {
                  toast({
                    title: '保存に失敗しました',
                    description: result.error,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!allocationScenarioName.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
