'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';

// Dashboard input cards
import { BasicInfoCard } from '@/components/dashboard/basic-info-card';
import { IncomeCard } from '@/components/dashboard/income-card';
import { ExpenseCard } from '@/components/dashboard/expense-card';
import { AssetCard } from '@/components/dashboard/asset-card';
import { InvestmentCard } from '@/components/dashboard/investment-card';
import { LifeEventsSummaryCard } from '@/components/dashboard/life-events-summary-card';
import { AdvancedInputPanel, type AdvancedSettings } from '@/components/dashboard/advanced-input-panel';
import { HousingPlanCard } from '@/components/dashboard/housing-plan-card';

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

type CardKey = 'basicInfo' | 'income' | 'expense' | 'asset' | 'investment' | 'lifeEvents' | 'housing';

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
  const [showFirstVisitBanner, setShowFirstVisitBanner] = useState(false);

  // Check for first-time visit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const status = localStorage.getItem('yohack-onboarding-complete');
    if (!status) {
      setShowWelcome(true);
    }
    if (!localStorage.getItem('yohack-profile-edited')) {
      setShowFirstVisitBanner(true);
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

  // Dismiss first-visit banner when profile is edited
  const profileFingerprint = `${profile.currentAge}-${profile.targetRetireAge}-${profile.grossIncome}-${profile.livingCostAnnual}-${profile.assetCash}-${profile.assetInvest}`;
  const initialFingerprint = useRef(profileFingerprint);
  useEffect(() => {
    if (profileFingerprint !== initialFingerprint.current && showFirstVisitBanner) {
      setShowFirstVisitBanner(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('yohack-profile-edited', '1');
      }
    }
  }, [profileFingerprint, showFirstVisitBanner]);

  // 旧版の強み「即座のフィードバックループ」を実現
  // パラメータ変更後3秒以内に結果が更新される
  useMainSimulation();

  // --- Previous metrics for change feedback ---
  const previousMetrics = useRef(simResult?.metrics ?? null);
  const previousScore = useRef(simResult?.score ?? null);
  const [prevMetricsSnapshot, setPrevMetricsSnapshot] = useState(simResult?.metrics ?? null);
  const [prevScoreSnapshot, setPrevScoreSnapshot] = useState(simResult?.score ?? null);

  useEffect(() => {
    if (!simResult) return;
    // Save old values before updating to new ones
    setPrevMetricsSnapshot(previousMetrics.current);
    setPrevScoreSnapshot(previousScore.current);
    previousMetrics.current = simResult.metrics;
    previousScore.current = simResult.score;
  }, [simResult]);

  // --- Collapsible card state ---
  const [openCards, setOpenCards] = useState<Record<CardKey, boolean>>({
    basicInfo: true,
    income: true,
    expense: false,
    asset: false,
    investment: false,
    lifeEvents: false,
    housing: false,
  });

  // Track which cards the user has manually toggled
  const manualToggles = useRef<Set<CardKey>>(new Set());

  // Completion checks
  const cardComplete = useMemo<Record<CardKey, boolean>>(() => ({
    basicInfo: profile.currentAge !== 30 && profile.targetRetireAge !== 50,
    income: profile.grossIncome !== 800,
    expense: profile.livingCostAnnual !== 300,
    asset: profile.assetCash !== 500 || profile.assetInvest !== 300,
    investment: profile.expectedReturn !== 5,
    lifeEvents: false,
    housing: false,
  }), [profile.currentAge, profile.targetRetireAge, profile.grossIncome, profile.livingCostAnnual, profile.assetCash, profile.assetInvest, profile.expectedReturn]);

  // Auto-close completed cards (only for non-manually-toggled cards)
  useEffect(() => {
    setOpenCards(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(cardComplete) as CardKey[]) {
        if (!manualToggles.current.has(key) && cardComplete[key] && prev[key]) {
          next[key] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cardComplete]);

  const handleCardToggle = useCallback((key: CardKey, open: boolean) => {
    manualToggles.current.add(key);
    setOpenCards(prev => ({ ...prev, [key]: open }));
  }, []);

  // Card refs for scroll-into-view
  const cardRefs = {
    basicInfo: useRef<HTMLDivElement>(null),
    income: useRef<HTMLDivElement>(null),
    expense: useRef<HTMLDivElement>(null),
    asset: useRef<HTMLDivElement>(null),
    investment: useRef<HTMLDivElement>(null),
    lifeEvents: useRef<HTMLDivElement>(null),
    housing: useRef<HTMLDivElement>(null),
  };

  const handleOpenCard = useCallback((cardId: string) => {
    const key = cardId as CardKey;
    if (!(key in cardRefs)) return;
    manualToggles.current.add(key);
    setOpenCards(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      cardRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

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
                シミュレーション
              </h1>
              <p className="text-sm text-muted-foreground">
                現在の条件でのシミュレーション結果
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#5A5550]" />
                    計算中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-[#C8B89A]" />
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
          <ProfileCompleteness profile={profile} onOpenCard={handleOpenCard} />

          {/* First-visit banner */}
          {showFirstVisitBanner && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border-l-4 border-l-[#C8B89A] bg-[#C8B89A]/10 p-4 dark:bg-[#C8B89A]/5">
              <div className="flex-1 text-sm text-[#8A7A62] dark:text-[#C8B89A]">
                <p className="font-medium">現在はサンプルデータでシミュレーションしています。</p>
                <p className="mt-1 text-[#8A7A62]/80 dark:text-[#C8B89A]/80">左のパネルからあなたの条件を入力すると、結果が自動で更新されます。</p>
              </div>
              <button
                onClick={() => {
                  setShowFirstVisitBanner(false);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('yohack-profile-edited', '1');
                  }
                }}
                className="flex-shrink-0 rounded p-1 text-[#8A7A62]/60 hover:text-[#8A7A62] dark:text-[#C8B89A]/60 dark:hover:text-[#C8B89A] transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Conclusion Summary - Always visible at top */}
          <div className="mb-6">
            <ConclusionSummaryCard
              score={simResult?.score ?? null}
              metrics={simResult?.metrics ?? null}
              previousScore={prevScoreSnapshot}
              previousMetrics={prevMetricsSnapshot}
              isLoading={isLoading && !simResult}
              targetRetireAge={profile.targetRetireAge}
              workStyle={profile.grossIncome > 1000 ? '高収入' : '会社員'}
              legacyGoal="使い切り"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: Input cards with Progressive Disclosure */}
            <div className="space-y-4 lg:col-span-1">
              {/* Basic Inputs - Collapsible */}
              <div ref={cardRefs.basicInfo}>
                <BasicInfoCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.basicInfo}
                  onOpenChange={(o) => handleCardToggle('basicInfo', o)}
                />
              </div>
              <div ref={cardRefs.income}>
                <IncomeCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.income}
                  onOpenChange={(o) => handleCardToggle('income', o)}
                />
              </div>
              <div ref={cardRefs.expense}>
                <ExpenseCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.expense}
                  onOpenChange={(o) => handleCardToggle('expense', o)}
                />
              </div>
              <div ref={cardRefs.asset}>
                <AssetCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.asset}
                  onOpenChange={(o) => handleCardToggle('asset', o)}
                />
              </div>
              <div ref={cardRefs.investment}>
                <InvestmentCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.investment}
                  onOpenChange={(o) => handleCardToggle('investment', o)}
                />
              </div>

              {/* Advanced Settings - Progressive Disclosure (has its own toggle) */}
              <AdvancedInputPanel
                profile={profile}
                onUpdate={updateProfile}
                advancedSettings={advancedSettings}
                onAdvancedUpdate={handleAdvancedUpdate}
              />

              {/* Life Events - サマリー + ライフプランへのリンク */}
              <div ref={cardRefs.lifeEvents}>
                <LifeEventsSummaryCard
                  profile={profile}
                  open={openCards.lifeEvents}
                  onOpenChange={(o) => handleCardToggle('lifeEvents', o)}
                />
              </div>

              {/* 住宅プラン - 賃貸 vs 複数購入プラン比較 */}
              <div ref={cardRefs.housing}>
                <HousingPlanCard
                  profile={profile}
                  open={openCards.housing}
                  onOpenChange={(o) => handleCardToggle('housing', o)}
                />
              </div>
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
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Chart */}
                  <AssetProjectionChart
                    data={simResult?.paths ?? null}
                    targetRetireAge={profile.targetRetireAge}
                    lifeEvents={profile.lifeEvents}
                    isLoading={isLoading}
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
                    isLoading={isLoading}
                  />
                </TabsContent>

                {/* Simulator Tab - Detailed Monte Carlo */}
                <TabsContent value="simulator" className="mt-6">
                  <MonteCarloSimulatorTab
                    profile={profile}
                    paths={simResult?.paths ?? null}
                    isLoading={isLoading}
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
                      isLoading={isLoading}
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
