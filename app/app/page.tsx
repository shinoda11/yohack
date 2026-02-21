'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { getBranchDerivedLifeEvents } from '@/lib/branch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Save, Check, Share2, Loader2, GitBranch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Dashboard input cards
import { ProfileSummaryCard } from '@/components/dashboard/profile-summary-card';
import { IncomeCard } from '@/components/dashboard/income-card';
import { RetirementCard } from '@/components/dashboard/retirement-card';
import { ExpenseCard } from '@/components/dashboard/expense-card';
import { InvestmentCard } from '@/components/dashboard/investment-card';
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

// Onboarding
import { WelcomeDialog } from '@/components/dashboard/welcome-dialog';
import { OnboardingSteps } from '@/components/dashboard/onboarding-steps';

// FitGate preset
import { loadFitGateAnswers, fitGateToProfile, clearFitGateAnswers } from '@/lib/fitgate';

// Types
import type { KeyMetrics, ExitScoreDetail } from '@/lib/types';

// Validation
import { useValidation } from '@/hooks/useValidation';

// Profile completeness
import { ProfileCompleteness } from '@/components/dashboard/profile-completeness';

type CardKey = 'income' | 'retirement' | 'expense' | 'investment' | 'housing';

export default function DashboardPage() {
  const {
    profile,
    simResult,
    isLoading,
    updateProfile,
    runSimulationAsync,
    customBranches,
    hiddenDefaultBranchIds,
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState('summary');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFirstVisitBanner, setShowFirstVisitBanner] = useState(false);

  // Mobile tab state (入力 vs 結果)
  const isProfileDefault = profile.grossIncome === 1200 && profile.currentAge === 35;
  const [mobileTab, setMobileTab] = useState<'input' | 'result'>(isProfileDefault ? 'input' : 'result');

  // Summary tab save scenario state
  const [savingFromSummary, setSavingFromSummary] = useState(false);
  const [summaryScenarioName, setSummaryScenarioName] = useState('');
  const [savedFromSummary, setSavedFromSummary] = useState(false);
  const { saveScenario, scenarios } = useProfileStore();

  // Worldline template flow
  const router = useRouter();
  const [creatingWorldline, setCreatingWorldline] = useState<string | null>(null);

  // Share / capture state
  const captureRef = useRef<HTMLDivElement>(null);
  const captureRefMobile = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  // Check for first-time visit + FitGate preset
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // FitGate → profile preset (skip wizard if data exists)
    const fitGateAnswers = loadFitGateAnswers();
    if (fitGateAnswers) {
      const preset = fitGateToProfile(fitGateAnswers);
      updateProfile(preset);
      clearFitGateAnswers();
      // Mark onboarding as complete since FitGate already collected key data
      localStorage.setItem('yohack-onboarding-complete', 'fitgate');
      localStorage.setItem('yohack-profile-edited', '1');
      return;
    }

    const status = localStorage.getItem('yohack-onboarding-complete');
    if (!status) {
      setShowWelcome(true);
    }
    if (!localStorage.getItem('yohack-profile-edited')) {
      setShowFirstVisitBanner(true);
    }
  }, []);

  const { getFieldError } = useValidation(profile);

  // Chart markers: 常に分岐ビルダーのブランチから生成（profile.lifeEvents は無視）
  const chartLifeEvents = useMemo(
    () => getBranchDerivedLifeEvents(profile, customBranches, hiddenDefaultBranchIds),
    [profile, customBranches, hiddenDefaultBranchIds]
  );

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
  // Initialize to null so delta badges don't show on first load / welcome completion
  const previousMetrics = useRef<KeyMetrics | null>(null);
  const previousScore = useRef<ExitScoreDetail | null>(null);
  const [prevMetricsSnapshot, setPrevMetricsSnapshot] = useState<KeyMetrics | null>(null);
  const [prevScoreSnapshot, setPrevScoreSnapshot] = useState<ExitScoreDetail | null>(null);

  useEffect(() => {
    if (!simResult) return;
    // Only create snapshot when a meaningful previous value exists
    // (skip the very first simResult transition to avoid false deltas)
    if (previousMetrics.current) {
      setPrevMetricsSnapshot(previousMetrics.current);
      setPrevScoreSnapshot(previousScore.current);
    }
    previousMetrics.current = simResult.metrics;
    previousScore.current = simResult.score;
  }, [simResult]);

  // --- Collapsible card state ---
  const [openCards, setOpenCards] = useState<Record<CardKey, boolean>>({
    income: true,
    retirement: false,
    expense: false,
    investment: false,
    housing: false,
  });

  // Track which cards the user has manually toggled
  const manualToggles = useRef<Set<CardKey>>(new Set());

  // Completion checks
  const cardComplete = useMemo<Record<CardKey, boolean>>(() => ({
    income: profile.grossIncome !== 800,
    retirement: profile.targetRetireAge !== 55,
    expense: profile.livingCostAnnual !== 300,
    investment: profile.expectedReturn !== 5,
    housing: false,
  }), [profile.grossIncome, profile.targetRetireAge, profile.livingCostAnnual, profile.expectedReturn]);

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
    income: useRef<HTMLDivElement>(null),
    retirement: useRef<HTMLDivElement>(null),
    expense: useRef<HTMLDivElement>(null),
    investment: useRef<HTMLDivElement>(null),
    housing: useRef<HTMLDivElement>(null),
  };

  const handleOpenCard = useCallback((cardId: string) => {
    const key = cardId as CardKey;
    if (!(key in cardRefs)) return;
    setMobileTab('input');
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

  const handleWelcomeComplete = (profileData: Partial<typeof profile>) => {
    updateProfile(profileData);
    setShowWelcome(false);
    setShowFirstVisitBanner(false);
    // Reset previous metrics to prevent showing delta badges from welcome changes
    previousMetrics.current = null;
    previousScore.current = null;
    setPrevMetricsSnapshot(null);
    setPrevScoreSnapshot(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yohack-onboarding-complete', 'complete');
      localStorage.setItem('yohack-profile-edited', '1');
      localStorage.setItem('yohack-brand-story-seen', '1');
    }
  };

  // Handle applying recommended actions
  const handleApplyAction = (updates: Partial<typeof profile>) => {
    updateProfile(updates);
  };

  // Handle worldline template selection
  const handleStartWorldlineComparison = async (templateId: string) => {
    const template = worldlineTemplates.find(t => t.id === templateId);
    if (!template) return;

    setCreatingWorldline(templateId);

    // 1. Save current profile as baseline
    saveScenario(template.baselineName);

    // 2. Apply variant changes
    const variantChanges = template.createVariant(profile);
    updateProfile(variantChanges);

    // 3. Wait for simulation to complete (debounce + run)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Save variant
    saveScenario(template.variantName);

    // 5. Navigate to /v2
    router.push('/app/v2');
  };

  // Handle share / capture
  const handleShareCapture = async () => {
    // Pick the visible capture target (mobile vs desktop)
    const mobileEl = captureRefMobile.current;
    const desktopEl = captureRef.current;
    const target = (mobileEl && mobileEl.offsetParent !== null) ? mobileEl : desktopEl;
    if (!target || isCapturing) return;
    setIsCapturing(true);

    try {
      const { toCanvas } = await import('html-to-image');
      const sourceCanvas = await toCanvas(target, {
        backgroundColor: '#FAF9F7',
        pixelRatio: 2,
      });

      // Add footer with logo + date + disclaimer
      const footerHeight = 60;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = sourceCanvas.width;
      finalCanvas.height = sourceCanvas.height + footerHeight * 2; // pixelRatio=2
      const ctx = finalCanvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#FAF9F7';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw captured content
      ctx.drawImage(sourceCanvas, 0, 0);

      // Footer
      const footerY = sourceCanvas.height + 20;
      ctx.fillStyle = '#8A7A62';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('YOHACK', 32, footerY + 10);

      ctx.fillStyle = '#5A5550';
      ctx.font = '20px sans-serif';
      const dateStr = new Date().toLocaleDateString('ja-JP');
      ctx.fillText(`${dateStr}  ※シミュレーション結果です。金融アドバイスではありません。`, 180, footerY + 10);

      const blob = await new Promise<Blob | null>((resolve) =>
        finalCanvas.toBlob(resolve, 'image/png')
      );
      if (!blob) {
        toast({ description: '画像の生成に失敗しました', variant: 'destructive' });
        setIsCapturing(false);
        return;
      }

      const file = new File([blob], `yohack-${dateStr}.png`, { type: 'image/png' });

      // Try Web Share API (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'YOHACK シミュレーション結果' });
          toast({ description: '共有しました' });
          setIsCapturing(false);
          return;
        } catch {
          // User cancelled or share failed — fall through to download
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yohack-${dateStr}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ description: '画像を保存しました' });
    } catch (err) {
      console.error('Share capture failed:', err);
      toast({ description: '画像の生成に失敗しました', variant: 'destructive' });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-14 items-center px-4 sm:px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1A1916]">ダッシュボード</h1>
              <p className="text-sm text-[#8A7A62]">プロファイルとシミュレーション結果</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="px-4 py-6 sm:px-6">
          {/* Onboarding Steps */}
          <OnboardingSteps profile={profile} />

          {/* Profile Completeness - shown after onboarding */}
          <ProfileCompleteness profile={profile} onOpenCard={handleOpenCard} />

          {/* Worldline guidance - shown when profile edited but no scenarios yet */}
          {!showFirstVisitBanner && !isProfileDefault && scenarios.length === 0 && (
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-[#C8B89A]/20 bg-[#C8B89A]/5 p-4">
              <div className="flex-shrink-0 rounded-full bg-[#C8B89A]/10 p-2.5">
                <GitBranch className="h-5 w-5 text-[#C8B89A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#5A5550]">
                  まず、あなたの家の選択肢を世界線として並べてみましょう
                </p>
              </div>
              <Button asChild size="sm" className="flex-shrink-0 gap-1 bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90">
                <Link href="/app/branch">
                  最初の世界線を作る →
                </Link>
              </Button>
            </div>
          )}

          {/* First-visit banner */}
          {showFirstVisitBanner && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border-l-4 border-l-[#C8B89A] bg-[#C8B89A]/10 p-4 dark:bg-[#C8B89A]/5">
              <div className="flex-1 text-sm text-[#8A7A62] dark:text-[#C8B89A]">
                <p className="font-medium">現在はサンプルデータでシミュレーションしています。</p>
                <p className="mt-1 text-[#8A7A62]/80 dark:text-[#C8B89A]/80">あなたの条件を入力すると、結果が自動で更新されます。</p>
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

          {/* Conclusion Summary - visible on result tab (mobile) or always (desktop) */}
          <div className={cn("mb-6", mobileTab === 'input' && 'hidden md:block')}>
            <ConclusionSummaryCard
              score={simResult?.score ?? null}
              metrics={simResult?.metrics ?? null}
              previousScore={prevScoreSnapshot}
              previousMetrics={prevMetricsSnapshot}
              isLoading={isLoading && !simResult}
              targetRetireAge={profile.targetRetireAge}
              workStyle={profile.grossIncome > 1000 ? '高収入' : '会社員'}
              legacyGoal="使い切り"
              profile={profile}
              onStartWorldlineComparison={handleStartWorldlineComparison}
              scenarioCount={scenarios.length}
              scenarioNames={scenarios.map(s => s.name)}
              creatingWorldline={creatingWorldline}
            />
          </div>

          {/* Mobile: 入力/結果 Tab Bar */}
          <div className="md:hidden sticky top-16 z-20 -mx-4 bg-[#FAF9F7] border-b border-[#F0ECE4]">
            <div className="flex">
              <button
                onClick={() => setMobileTab('input')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium text-center transition-colors',
                  mobileTab === 'input'
                    ? 'text-[#1A1916] border-b-2 border-[#C8B89A]'
                    : 'text-[#8A7A62]'
                )}
              >
                入力
              </button>
              <button
                onClick={() => setMobileTab('result')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium text-center transition-colors',
                  mobileTab === 'result'
                    ? 'text-[#1A1916] border-b-2 border-[#C8B89A]'
                    : 'text-[#8A7A62]'
                )}
              >
                結果
              </button>
            </div>
          </div>

          <div className="mt-4 md:mt-0 grid gap-6 lg:grid-cols-3">
            {/* Left column: Input cards — hidden on mobile when result tab active */}
            <div className={cn("space-y-4 lg:col-span-1 min-w-0 overflow-x-hidden", mobileTab === 'result' && 'hidden md:block')}>
              {/* Profile Summary - Read-only */}
              <ProfileSummaryCard profile={profile} onUpdate={updateProfile} />

              <div ref={cardRefs.income}>
                <IncomeCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.income}
                  onOpenChange={(o) => handleCardToggle('income', o)}
                />
              </div>
              <div ref={cardRefs.retirement}>
                <RetirementCard
                  profile={profile}
                  onUpdate={updateProfile}
                  open={openCards.retirement}
                  onOpenChange={(o) => handleCardToggle('retirement', o)}
                />
              </div>
              <div ref={cardRefs.expense}>
                <ExpenseCard
                  profile={profile}
                  onUpdate={updateProfile}
                  getFieldError={getFieldError}
                  open={openCards.expense}
                  onOpenChange={(o) => handleCardToggle('expense', o)}
                  hideHousing
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

              {/* 住宅プラン - 賃貸 vs 複数購入プラン比較 */}
              <div ref={cardRefs.housing}>
                <HousingPlanCard
                  profile={profile}
                  onUpdate={updateProfile}
                  open={openCards.housing}
                  onOpenChange={(o) => handleCardToggle('housing', o)}
                />
              </div>
            </div>

            {/* Right column: Result cards */}
            <div className={cn("lg:col-span-2 min-w-0 overflow-x-hidden", mobileTab === 'input' && 'hidden md:block')}>
              {/* Mobile: flat result list (no sub-tabs) */}
              <div className="md:hidden space-y-6">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1.5"
                    onClick={handleShareCapture}
                    disabled={isCapturing || !simResult}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Share2 className="h-3 w-3" />
                    )}
                    共有
                  </Button>
                </div>
                <div ref={captureRefMobile} className="space-y-6">
                  <div className="grid gap-4">
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
                  <AssetProjectionChart
                    data={simResult?.paths ?? null}
                    targetRetireAge={profile.targetRetireAge}
                    lifeEvents={chartLifeEvents}
                    isLoading={isLoading}
                  />
                </div>
                <NextBestActionsCard
                  metrics={simResult?.metrics ?? null}
                  score={simResult?.score ?? null}
                  profile={profile}
                  isLoading={isLoading && !simResult}
                  onApplyAction={handleApplyAction}
                />
                <CashFlowCard
                  cashFlow={simResult?.cashFlow ?? null}
                  paths={simResult?.paths ?? null}
                  metrics={simResult?.metrics ?? null}
                  targetRetireAge={profile.targetRetireAge}
                  isLoading={isLoading}
                />
                <MonteCarloSimulatorTab
                  profile={profile}
                  paths={simResult?.paths ?? null}
                  isLoading={isLoading}
                  onVolatilityChange={(volatility) => updateProfile({ volatility })}
                />
                <ScenarioComparisonCard currentResult={simResult} />
              </div>

              {/* Desktop: result tabs */}
              <div className="hidden md:block space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
  <TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="summary" className="text-xs sm:text-sm">サマリー</TabsTrigger>
  <TabsTrigger value="simulator" className="text-xs sm:text-sm">確率分布</TabsTrigger>
  <TabsTrigger value="scenarios" className="text-xs sm:text-sm">世界線</TabsTrigger>
  </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="mt-6 space-y-6">
                  {/* Save + Share buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1.5"
                      onClick={handleShareCapture}
                      disabled={isCapturing || !simResult}
                    >
                      {isCapturing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                      共有
                    </Button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {savedFromSummary ? (
                      <>
                        <span className="text-sm text-muted-foreground">保存しました</span>
                        <Button size="sm" variant="link" onClick={() => setActiveTab('scenarios')}>
                          世界線比較へ →
                        </Button>
                      </>
                    ) : savingFromSummary ? (
                      <>
                        <Input
                          placeholder="シナリオ名"
                          value={summaryScenarioName}
                          onChange={(e) => setSummaryScenarioName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && summaryScenarioName.trim()) {
                              saveScenario(summaryScenarioName.trim());
                              setSummaryScenarioName('');
                              setSavingFromSummary(false);
                              setSavedFromSummary(true);
                              setTimeout(() => setSavedFromSummary(false), 3000);
                            }
                          }}
                          className="h-8 text-sm max-w-[200px]"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!summaryScenarioName.trim()}
                          onClick={() => {
                            saveScenario(summaryScenarioName.trim());
                            setSummaryScenarioName('');
                            setSavingFromSummary(false);
                            setSavedFromSummary(true);
                            setTimeout(() => setSavedFromSummary(false), 3000);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSavingFromSummary(false); setSummaryScenarioName(''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs bg-transparent" onClick={() => setSavingFromSummary(true)}>
                        <Save className="h-3 w-3 mr-1" />
                        この結果を保存
                      </Button>
                    )}
                  </div>

                  {/* Capture target for share */}
                  <div ref={captureRef} className="space-y-6">
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
                      lifeEvents={chartLifeEvents}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Next Best Actions - With quantified impact */}
                  <NextBestActionsCard
                    metrics={simResult?.metrics ?? null}
                    score={simResult?.score ?? null}
                    profile={profile}
                    isLoading={isLoading && !simResult}
                    onApplyAction={handleApplyAction}
                  />

                  {/* Cash flow + withdrawal simulation */}
                  <CashFlowCard
                    cashFlow={simResult?.cashFlow ?? null}
                    paths={simResult?.paths ?? null}
                    metrics={simResult?.metrics ?? null}
                    targetRetireAge={profile.targetRetireAge}
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
        </div>
      {/* Welcome Dialog for first-time visitors */}
      <WelcomeDialog
        open={showWelcome}
        onComplete={handleWelcomeComplete}
        onSkip={dismissWelcome}
      />
    </>
  );
}
