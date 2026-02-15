'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

// Dashboard input cards
import { BasicInfoCard } from '@/components/dashboard/basic-info-card';
import { IncomeCard } from '@/components/dashboard/income-card';
import { ExpenseCard } from '@/components/dashboard/expense-card';
import { AssetCard } from '@/components/dashboard/asset-card';
import { InvestmentCard } from '@/components/dashboard/investment-card';
import { LifeEventsCard } from '@/components/dashboard/life-events-card';
import { AdvancedInputPanel, type AdvancedSettings } from '@/components/dashboard/advanced-input-panel';
import { HousingScenarioCard } from '@/components/dashboard/housing-scenario-card';
import { HousingMultiScenarioCard } from '@/components/dashboard/housing-multi-scenario-card';

// Dashboard result cards
import { ConclusionSummaryCard } from '@/components/dashboard/conclusion-summary-card';
import { ExitReadinessCard } from '@/components/dashboard/exit-readiness-card';
import { AssetProjectionChart } from '@/components/dashboard/asset-projection-chart';
import { KeyMetricsCard } from '@/components/dashboard/key-metrics-card';
import { CashFlowCard } from '@/components/dashboard/cash-flow-card';
import { NextBestActionsCard } from '@/components/dashboard/next-best-actions-card';
import { ScenarioComparisonCard } from '@/components/dashboard/scenario-comparison-card';
import { MonteCarloSimulatorTab } from '@/components/dashboard/monte-carlo-simulator-tab';

// Layout
import { Sidebar } from '@/components/layout/sidebar';

// Onboarding
import { WelcomeDialog } from '@/components/dashboard/welcome-dialog';
import { OnboardingSteps } from '@/components/dashboard/onboarding-steps';

// Validation
import { useValidation } from '@/hooks/useValidation';

// Profile completeness
import { ProfileCompleteness } from '@/components/dashboard/profile-completeness';

export default function DashboardPage() {
  const {
    profile,
    simResult,
    isLoading,
    updateProfile,
    resetProfile,
    runSimulationAsync,
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState('summary');
  const [showWelcome, setShowWelcome] = useState(false);

  // Check for first-time visit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const status = localStorage.getItem('yohack-onboarding-complete');
    if (!status) {
      setShowWelcome(true);
    }
  }, []);
  
  // Advanced settings state (separate from main profile for UI purposes)
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    incomeTrajectory: 'flat',
    realEstateValue: 0,
    cryptoValue: 0,
    otherAssets: 0,
    workStyleGoal: 'full_fire',
    legacyStance: 'spend_all',
  });

  const { getFieldError } = useValidation(profile);

  // 旧版の強み「即座のフィードバックループ」を実現
  // パラメータ変更後3秒以内に結果が更新される
  useMainSimulation();

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yohack-onboarding-complete', 'welcome-shown');
    }
  };

  // Handle applying recommended actions
  const handleApplyAction = (updates: Partial<typeof profile>) => {
    updateProfile(updates);
  };

  // Handle advanced settings update
  const handleAdvancedUpdate = (updates: Partial<AdvancedSettings>) => {
    setAdvancedSettings(prev => ({ ...prev, ...updates }));
    
    // Optionally sync some settings to profile
    // For now, advanced settings are stored separately
    // In a real app, you'd want to integrate these with the simulation
  };



  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content - responsive margin for sidebar */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                YOHACK
              </h1>
              <p className="text-sm text-muted-foreground">
                人生に、余白を。
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                    計算中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    最新
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetProfile}
                className="gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                リセット
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="px-4 py-6 sm:px-6">
          {/* Onboarding Steps */}
          <OnboardingSteps profile={profile} />

          {/* Profile Completeness - shown after onboarding */}
          <ProfileCompleteness profile={profile} />

          {/* Conclusion Summary - Always visible at top */}
          <div className="mb-6">
            <ConclusionSummaryCard
              score={simResult?.score ?? null}
              metrics={simResult?.metrics ?? null}
              isLoading={isLoading && !simResult}
              targetRetireAge={profile.targetRetireAge}
              workStyle={profile.grossIncome > 1000 ? '高収入' : '会社員'}
              legacyGoal="使い切り"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: Input cards with Progressive Disclosure */}
            <div className="space-y-6 lg:col-span-1">
              {/* Basic Inputs - Always visible */}
              <BasicInfoCard profile={profile} onUpdate={updateProfile} getFieldError={getFieldError} />
              <IncomeCard profile={profile} onUpdate={updateProfile} getFieldError={getFieldError} />
              <ExpenseCard profile={profile} onUpdate={updateProfile} getFieldError={getFieldError} />
              <AssetCard profile={profile} onUpdate={updateProfile} getFieldError={getFieldError} />
              <InvestmentCard profile={profile} onUpdate={updateProfile} getFieldError={getFieldError} />
              
              {/* Advanced Settings - Progressive Disclosure */}
              <AdvancedInputPanel
                profile={profile}
                onUpdate={updateProfile}
                advancedSettings={advancedSettings}
                onAdvancedUpdate={handleAdvancedUpdate}
              />
              
              {/* Life Events */}
              <LifeEventsCard profile={profile} onUpdate={updateProfile} />
              
              {/* Housing Scenario - 賃貸 vs 購入比較 */}
              <HousingScenarioCard profile={profile} onUpdate={updateProfile} />
              
              {/* Housing Multi-Scenario - 複数プラン同時比較 */}
              <HousingMultiScenarioCard profile={profile} onUpdate={updateProfile} />
            </div>

            {/* Right column: Result cards with tabs */}
            <div className="space-y-6 lg:col-span-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
  <TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="summary" className="text-xs sm:text-sm">サマリー</TabsTrigger>
  <TabsTrigger value="simulator" className="text-xs sm:text-sm">確率分布</TabsTrigger>
  <TabsTrigger value="scenarios" className="text-xs sm:text-sm">シナリオ</TabsTrigger>
  </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="mt-6 space-y-6">
                  {/* Top row: Score and metrics */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ExitReadinessCard
                      score={simResult?.score ?? null}
                      isLoading={isLoading && !simResult}
                    />
                    <KeyMetricsCard
                      metrics={simResult?.metrics ?? null}
                      currentAge={profile.currentAge}
                      targetRetireAge={profile.targetRetireAge}
                      isLoading={isLoading && !simResult}
                    />
                  </div>

                  {/* Chart */}
                  <AssetProjectionChart
                    data={simResult?.paths ?? null}
                    targetRetireAge={profile.targetRetireAge}
                    lifeEvents={profile.lifeEvents}
                    isLoading={isLoading && !simResult}
                  />

                  {/* Next Best Actions - With quantified impact */}
                  <NextBestActionsCard
                    metrics={simResult?.metrics ?? null}
                    score={simResult?.score ?? null}
                    profile={profile}
                    isLoading={isLoading && !simResult}
                    onApplyAction={handleApplyAction}
                  />

                  {/* Cash flow */}
                  <CashFlowCard
                    cashFlow={simResult?.cashFlow ?? null}
                    isLoading={isLoading && !simResult}
                  />
                </TabsContent>

                {/* Simulator Tab - Detailed Monte Carlo */}
                <TabsContent value="simulator" className="mt-6">
                  <MonteCarloSimulatorTab
                    profile={profile}
                    paths={simResult?.paths ?? null}
                    isLoading={isLoading && !simResult}
                    onVolatilityChange={(volatility) => updateProfile({ volatility })}
                  />
                </TabsContent>

                {/* Scenarios Tab */}
                <TabsContent value="scenarios" className="mt-6 space-y-6">
                  <ScenarioComparisonCard
                    currentResult={simResult}
                  />

                  {/* Still show the current score for reference */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ExitReadinessCard
                      score={simResult?.score ?? null}
                      isLoading={isLoading && !simResult}
                    />
                    <KeyMetricsCard
                      metrics={simResult?.metrics ?? null}
                      currentAge={profile.currentAge}
                      targetRetireAge={profile.targetRetireAge}
                      isLoading={isLoading && !simResult}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Welcome Dialog for first-time visitors */}
      <WelcomeDialog
        open={showWelcome}
        onStart={dismissWelcome}
        onSkip={dismissWelcome}
      />
    </div>
  );
}
