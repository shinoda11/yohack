'use client';

import Link from 'next/link';
import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';
import { useToast } from '@/hooks/use-toast';
import { readinessConfig } from '@/lib/v2/readinessConfig';
import { Button } from '@/components/ui/button';
import { GitBranch } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { V2ResultSection } from '@/components/v2/V2ResultSection';
import { V2InputSection } from '@/components/v2/V2InputSection';
import { V2ComparisonView } from '@/components/v2/V2ComparisonView';

export default function WorldlinePage() {
  const { profile, simResult, isLoading, scenarios, loadScenario, saveAllocationAsScenario } = useProfileStore();
  const { toast } = useToast();

  const {
    selectedComparisonIds, toggleComparisonId, clearComparisonIds, setSelectedComparisonIds,
    allocation, setAllocation, allocationDirty, resetAllocation, markAllocationSaved,
    bridges, setHousingBridge, setChildrenBridge, setActiveTab, activeTab
  } = useV2Store();

  const margins = useMargin({ profile, simResult });

  const worldLines = simResult ? [{
    id: 'baseline',
    name: '現在',
    profile,
    result: simResult
  }] : [];

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

  // Empty state: no scenarios at all
  if (scenarios.length === 0) {
    return (
      <div className="overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
            <p className="text-muted-foreground mt-1">余白で比較し、次の一手を決める</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">比較する世界線がありません</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                まず分岐ビルダーで人生の分岐を選び、世界線を生成してください。
              </p>
            </div>
            <Button asChild className="gap-2 bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90">
              <Link href="/app/branch">
                <GitBranch className="h-4 w-4" />
                分岐を描きはじめる
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
          </p>
        </div>
      </div>
    );
  }

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
    <div className="overflow-x-hidden">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
              <p className="text-muted-foreground mt-1">
                余白で比較し、次の一手を決める
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-2 bg-transparent">
              <Link href="/app/branch">
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">分岐を変更する</span>
              </Link>
            </Button>
          </div>

          {/* Overall Assessment Hero + Current World Line */}
          <V2ResultSection {...resultProps} renderMode="hero" />

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'margins' | 'allocation' | 'decision' | 'worldlines' | 'strategy')}
            className="space-y-6"
          >
            <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-1 p-1">
              <TabsTrigger value="margins" className="shrink-0 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">余白</TabsTrigger>
              <TabsTrigger value="allocation" className="shrink-0 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">使い道</TabsTrigger>
              <TabsTrigger value="decision" className="shrink-0 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">意思決定</TabsTrigger>
              <TabsTrigger value="worldlines" className="shrink-0 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">世界線</TabsTrigger>
              <TabsTrigger value="strategy" className="shrink-0 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">戦略</TabsTrigger>
            </TabsList>

            <TabsContent value="margins" className="space-y-6">
              <V2ResultSection {...resultProps} renderMode="margins" />
            </TabsContent>
            <TabsContent value="allocation" className="space-y-6">
              <V2InputSection {...inputProps} renderMode="allocation" />
            </TabsContent>
            <TabsContent value="decision" className="space-y-6">
              <V2InputSection {...inputProps} renderMode="decision" />
            </TabsContent>
            <TabsContent value="worldlines" className="space-y-6">
              <V2ComparisonView {...comparisonProps} />
            </TabsContent>
            <TabsContent value="strategy" className="space-y-6">
              <V2ResultSection {...resultProps} renderMode="strategy" />
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
