'use client';

import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';
import { useToast } from '@/hooks/use-toast';
import { readinessConfig } from '@/lib/v2/readinessConfig';

import { Sidebar } from '@/components/layout/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { V2ResultSection } from '@/components/v2/V2ResultSection';
import { V2InputSection } from '@/components/v2/V2InputSection';
import { V2ComparisonView } from '@/components/v2/V2ComparisonView';

export default function V2DashboardPage() {
  // v2タブはダッシュボードのSoT（profile/simResult）を参照するだけ
  // 独自のrunSimulationは呼ばない（ストア二重化防止）
  const { profile, simResult, isLoading, scenarios, loadScenario, saveAllocationAsScenario } = useProfileStore();
  const { toast } = useToast();

  // UI状態（比較対象選択・配分・ブリッジ）のみv2で管理
  const {
    selectedComparisonIds, toggleComparisonId, clearComparisonIds, setSelectedComparisonIds,
    allocation, setAllocation, allocationDirty, resetAllocation, markAllocationSaved,
    bridges, setHousingBridge, setChildrenBridge, setActiveTab, activeTab
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

  const readiness = readinessConfig[strategy.overallAssessment.readinessLevel];

  // Shared props for V2ResultSection
  const resultProps = {
    simResult,
    profile,
    isLoading,
    readiness,
    overallAssessment: strategy.overallAssessment,
    scenarios,
    selectedComparisonIds,
    moneyMargin: margins.moneyMargin,
    moneyHealth: margins.moneyHealth,
    timeMargin: margins.time,
    riskMargin: margins.risk,
    primaryStrategy: strategy.primaryStrategy,
    strategicInsights: strategy.strategicInsights,
  };

  // Shared props for V2InputSection
  const inputProps = {
    scenarios,
    selectedComparisonIds,
    setSelectedComparisonIds,
    simResult,
    profile,
    allocation,
    setAllocation,
    allocationDirty,
    resetAllocation,
    markAllocationSaved,
    saveAllocationAsScenario,
    toast,
    bridges,
    setHousingBridge,
    setChildrenBridge,
    setActiveTab,
  };

  // Shared props for V2ComparisonView
  const comparisonProps = {
    simResult,
    profile,
    scenarios,
    selectedComparisonIds,
    toggleComparisonId,
    clearComparisonIds,
    loadScenario,
    setActiveTab,
  };

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
                余白で比較し、次の一手を決める
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Beta
            </Badge>
          </div>

          {/* Overall Assessment Hero + Current World Line */}
          <V2ResultSection {...resultProps} renderMode="hero" />

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
              <V2ResultSection {...resultProps} renderMode="margins" />
            </TabsContent>

            {/* Allocation Tab - 余白の使い道 */}
            <TabsContent value="allocation" className="space-y-6">
              <V2InputSection {...inputProps} renderMode="allocation" />
            </TabsContent>

            {/* Decision Tab - 意思決定ブリッジ */}
            <TabsContent value="decision" className="space-y-6">
              <V2InputSection {...inputProps} renderMode="decision" />
            </TabsContent>

            {/* World Lines Tab - 表形式で並列比較 */}
            <TabsContent value="worldlines" className="space-y-6">
              <V2ComparisonView {...comparisonProps} />
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6">
              <V2ResultSection {...resultProps} renderMode="strategy" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
