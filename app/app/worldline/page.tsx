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
import { GitBranch } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { V2ResultSection } from '@/components/v2/V2ResultSection';
import { V2ComparisonView } from '@/components/v2/V2ComparisonView';

export default function WorldlinePage() {
  const { profile, simResult, isLoading, scenarios, loadScenario, updateProfile, saveScenario } = useProfileStore();
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

    // Apply variant changes to current profile
    const variantChanges = template.createVariant(profile);
    updateProfile(variantChanges);

    // Wait for simulation to complete (debounce + run)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Save variant as new scenario
    saveScenario(template.variantName);

    setApplyingTemplate(null);
  };

  // Empty state: no scenarios at all
  if (scenarios.length === 0) {
    return (
      <div className="overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
            <p className="text-sm text-brand-bronze mt-1">余白で比較し、次の一手を決める</p>
          </div>
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
            <Button asChild className="gap-2 bg-brand-gold text-white hover:bg-brand-gold/90 h-11 px-6">
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
    onApplyTemplate: handleApplyTemplate,
    applyingTemplate,
  };

  return (
    <div className="overflow-x-hidden">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">世界線比較</h1>
              <p className="text-sm text-brand-bronze mt-1">
                余白で比較し、次の一手を決める
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-2 border-brand-gold text-brand-gold bg-transparent hover:bg-brand-gold/10">
              <Link href="/app/branch">
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">分岐を変更する</span>
              </Link>
            </Button>
          </div>

          {/* Overall Assessment Hero + Current World Line */}
          <V2ResultSection {...resultProps} renderMode="hero" />

          {/* Main Content Tabs: 3タブ */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'worldlines' | 'margins' | 'strategy')}
            className="space-y-6"
          >
            <TabsList className="flex w-full gap-1 p-1">
              <TabsTrigger value="worldlines" className="flex-1 text-xs sm:text-sm px-3 py-2">世界線比較</TabsTrigger>
              <TabsTrigger value="margins" className="flex-1 text-xs sm:text-sm px-3 py-2">余白</TabsTrigger>
              <TabsTrigger value="strategy" className="flex-1 text-xs sm:text-sm px-3 py-2">戦略</TabsTrigger>
            </TabsList>

            <TabsContent value="worldlines" className="space-y-6">
              <V2ComparisonView {...comparisonProps} />
            </TabsContent>
            <TabsContent value="margins" className="space-y-6">
              <V2ResultSection {...resultProps} renderMode="margins" />
            </TabsContent>
            <TabsContent value="strategy" className="space-y-6">
              <V2ResultSection {...resultProps} renderMode="strategy" />
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
