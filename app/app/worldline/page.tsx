'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/lib/store';
import { useV2Store } from '@/lib/v2/store';
import { useMargin } from '@/hooks/useMargin';
import { useStrategy } from '@/hooks/useStrategy';
import { readinessConfig } from '@/lib/v2/readinessConfig';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { Button } from '@/components/ui/button';
import { GitBranch, ArrowRight } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { V2ResultSection } from '@/components/v2/V2ResultSection';
import { V2ComparisonView } from '@/components/v2/V2ComparisonView';

export default function WorldlinePage() {
  const { profile, simResult, isLoading, scenarios, visibleScenarioIds, toggleScenarioVisibility, loadScenario, deleteScenario, updateProfile, saveScenario } = useProfileStore();
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  const {
    selectedComparisonIds, toggleComparisonId, clearComparisonIds, setSelectedComparisonIds,
    setActiveTab, activeTab
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

  // Handle template application (add a single variant scenario)
  const handleApplyTemplate = async (templateId: string) => {
    const template = worldlineTemplates.find(t => t.id === templateId);
    if (!template) return;

    setApplyingTemplate(templateId);

    // Snapshot current profile so we can restore after saving variant
    const originalProfile = { ...profile };

    // Apply variant changes to current profile
    const variantChanges = template.createVariant(profile);
    updateProfile(variantChanges);

    // Wait for simulation to complete (debounce + run)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Save variant as new scenario
    saveScenario(template.variantName);

    // Restore original profile so "現在" baseline remains stable
    updateProfile(originalProfile);

    setApplyingTemplate(null);
  };

  // Empty state: no scenarios at all
  if (scenarios.length === 0) {
    return (
      <div className="overflow-x-hidden">
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-14 items-center px-4 sm:px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
              <p className="text-sm text-brand-bronze">余白で比較し、次の一手を決める</p>
            </div>
          </div>
        </header>
        <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-gold/30 bg-brand-canvas p-16 text-center space-y-6">
            <div className="rounded-full bg-brand-gold/10 p-6">
              <GitBranch className="h-10 w-10 text-brand-gold/30" />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-stone">世界線がまだありません</h2>
              <p className="text-sm text-brand-bronze max-w-md leading-relaxed">
                分岐ビルダーで「住宅購入」「年収変化」などの選択肢を組み合わせると、<br className="hidden sm:inline" />
                世界線が自動生成され、ここで比較できます
              </p>
            </div>
            <Button asChild className="gap-2 h-11 px-6">
              <Link href="/app/branch">
                分岐ビルダーで世界線を作る
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
    onViewStrategy: () => setActiveTab('strategy'),
  };

  const comparisonProps = {
    simResult,
    profile,
    scenarios,
    visibleScenarioIds,
    toggleScenarioVisibility,
    selectedComparisonIds,
    toggleComparisonId,
    clearComparisonIds,
    loadScenario,
    deleteScenario,
    setActiveTab,
    onApplyTemplate: handleApplyTemplate,
    applyingTemplate,
  };

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
            <p className="text-sm text-brand-bronze">余白で比較し、次の一手を決める</p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/app/branch">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">分岐を変更する</span>
            </Link>
          </Button>
        </div>
      </header>
      <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">

          {/* Overall Assessment Hero + Current World Line */}
          <div className="animate-card-in">
            <V2ResultSection {...resultProps} renderMode="hero" />
          </div>

          {/* Main Content Tabs: 3タブ */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'worldlines' | 'margins' | 'strategy')}
            className="space-y-6"
          >
            <TabsList className="flex w-full gap-1 p-1">
              <TabsTrigger value="worldlines" className="flex-1 text-xs sm:text-sm px-3 py-2">世界線比較</TabsTrigger>
              <TabsTrigger value="margins" className="flex-1 text-xs sm:text-sm px-3 py-2">余白</TabsTrigger>
              <TabsTrigger value="strategy" className="flex-1 text-xs sm:text-sm px-3 py-2">変数</TabsTrigger>
            </TabsList>

            <TabsContent value="worldlines" className="space-y-6">
              <div className="animate-card-in">
                <V2ComparisonView {...comparisonProps} />
              </div>
            </TabsContent>
            <TabsContent value="margins" className="space-y-6">
              <div className="animate-card-in">
                <V2ResultSection {...resultProps} renderMode="margins" />
              </div>
            </TabsContent>
            <TabsContent value="strategy" className="space-y-6">
              <div className="animate-card-in">
                <V2ResultSection {...resultProps} renderMode="strategy" />
              </div>
            </TabsContent>
          </Tabs>

          {/* 循環導線 */}
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">
              条件を変えて試す
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ダッシュボードで前提条件を変更すると、スコアが再計算されます。
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-1 text-sm text-brand-bronze hover:underline underline-offset-4 min-h-[44px]"
            >
              ダッシュボードへ
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
      </div>
    </div>
  );
}
