'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { getBranchDerivedLifeEvents } from '@/lib/branch';
import { Button } from '@/components/ui/button';
import { X, Share2, Loader2, GitBranch, UserPen, ChevronDown } from 'lucide-react';
import { CHART_COLORS } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Dashboard input cards
import { ProfileSummaryCard } from '@/components/dashboard/profile-summary-card';
import { IncomeCard } from '@/components/dashboard/income-card';
import { RetirementCard } from '@/components/dashboard/retirement-card';
import { ExpenseCard } from '@/components/dashboard/expense-card';
import { InvestmentCard } from '@/components/dashboard/investment-card';
import { HousingPlanCard } from '@/components/dashboard/housing-plan-card';
import { VariableBar } from '@/components/dashboard/variable-bar';

// Dashboard result cards
import { ConclusionSummaryCard } from '@/components/dashboard/conclusion-summary-card';
import { ExitReadinessCard } from '@/components/dashboard/exit-readiness-card';
import { AssetProjectionChart } from '@/components/dashboard/asset-projection-chart';
import { CashFlowCard } from '@/components/dashboard/cash-flow-card';
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

  const [showWelcome, setShowWelcome] = useState(false);
  const [showFirstVisitBanner, setShowFirstVisitBanner] = useState(false);

  const isProfileDefault = profile.grossIncome === 1200 && profile.currentAge === 35;

  const { saveScenario, scenarios } = useProfileStore();

  // Worldline template flow
  const router = useRouter();
  const [creatingWorldline, setCreatingWorldline] = useState<string | null>(null);

  // Share / capture state
  const captureRef = useRef<HTMLDivElement>(null);
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
    income: false,
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
    const target = captureRef.current;
    if (!target || isCapturing) return;
    setIsCapturing(true);

    try {
      const { toCanvas } = await import('html-to-image');
      const sourceCanvas = await toCanvas(target, {
        backgroundColor: CHART_COLORS.canvas,
        pixelRatio: 2,
      });

      // Add footer with logo + date + disclaimer
      const footerHeight = 60;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = sourceCanvas.width;
      finalCanvas.height = sourceCanvas.height + footerHeight * 2; // pixelRatio=2
      const ctx = finalCanvas.getContext('2d')!;

      // Background
      ctx.fillStyle = CHART_COLORS.canvas;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw captured content
      ctx.drawImage(sourceCanvas, 0, 0);

      // Footer
      const footerY = sourceCanvas.height + 20;
      ctx.fillStyle = CHART_COLORS.bronze;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('YOHACK', 32, footerY + 10);

      ctx.fillStyle = CHART_COLORS.stone;
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
              <h1 className="text-xl font-bold tracking-tight text-brand-night">ダッシュボード</h1>
              <p className="text-sm text-brand-bronze">あなたの前提と将来の見通し</p>
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
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
              <div className="flex-shrink-0 rounded-full bg-brand-gold/10 p-2.5">
                <GitBranch className="h-5 w-5 text-brand-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-stone">
                  選択肢を世界線として並べると、比較が始まります
                </p>
              </div>
              <Button asChild size="sm" className="flex-shrink-0 gap-1">
                <Link href="/app/branch">
                  世界線を作る
                </Link>
              </Button>
            </div>
          )}

          {/* First-visit banner */}
          {showFirstVisitBanner && (
            <div className="mb-6 flex items-start gap-4 rounded-lg border-l-4 border-l-brand-gold bg-brand-gold/10 p-4 dark:bg-brand-gold/5">
              <div className="flex-1 text-sm text-brand-bronze">
                <p className="font-normal">現在はサンプルデータで表示しています</p>
                <p className="mt-1 text-brand-bronze/80">あなたの条件に変更すると、結果が即時に反映されます</p>
              </div>
              <button
                onClick={() => {
                  setShowFirstVisitBanner(false);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('yohack-profile-edited', '1');
                  }
                }}
                className="flex-shrink-0 rounded-md p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-bronze/60 hover:text-brand-bronze transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Conclusion Summary - HERO */}
          <div className="mb-12 animate-card-in">
            <ConclusionSummaryCard
              score={simResult?.score ?? null}
              metrics={simResult?.metrics ?? null}
              previousScore={prevScoreSnapshot}
              previousMetrics={prevMetricsSnapshot}
              isLoading={isLoading && !simResult}
              targetRetireAge={profile.targetRetireAge}
              profile={profile}
              onStartWorldlineComparison={handleStartWorldlineComparison}
              scenarioCount={scenarios.length}
              scenarioNames={scenarios.map(s => s.name)}
              creatingWorldline={creatingWorldline}
            />
          </div>

          <div className="space-y-6">
            {/* Input cards — collapsible */}
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-brand-bronze hover:text-brand-night transition-colors list-none [&::-webkit-details-marker]:hidden">
                <UserPen className="h-4 w-4" />
                前提を編集する
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-6">
                {/* Profile Summary - Read-only */}
                <ProfileSummaryCard profile={profile} onUpdate={updateProfile} />

                <div ref={cardRefs.income}>
                  <IncomeCard
                    profile={profile}
                    onUpdate={updateProfile}
                    getFieldError={getFieldError}
                    open={openCards.income}
                    onOpenChange={(o) => handleCardToggle('income', o)}
                    completed={cardComplete.income}
                  />
                </div>
                <div ref={cardRefs.retirement}>
                  <RetirementCard
                    profile={profile}
                    onUpdate={updateProfile}
                    open={openCards.retirement}
                    onOpenChange={(o) => handleCardToggle('retirement', o)}
                    completed={cardComplete.retirement}
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
                    completed={cardComplete.expense}
                  />
                </div>
                <div ref={cardRefs.investment}>
                  <InvestmentCard
                    profile={profile}
                    onUpdate={updateProfile}
                    getFieldError={getFieldError}
                    open={openCards.investment}
                    onOpenChange={(o) => handleCardToggle('investment', o)}
                    completed={cardComplete.investment}
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
            </details>

            {/* 第2層: 根拠 — スコアの根拠を示す */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center justify-end">
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

              {/* Capture target for share */}
              <div ref={captureRef} className="space-y-6 animate-card-in" style={{ animationDelay: '50ms' }}>
                <VariableBar profile={profile} onUpdate={updateProfile} />
                <AssetProjectionChart
                  data={simResult?.paths ?? null}
                  targetRetireAge={profile.targetRetireAge}
                  lifeEvents={chartLifeEvents}
                  isLoading={isLoading}
                />
              </div>

              <div className="animate-card-in" style={{ animationDelay: '100ms' }}>
                <ExitReadinessCard
                  score={simResult?.score ?? null}
                  isLoading={isLoading && !simResult}
                />
              </div>

              <div className="animate-card-in" style={{ animationDelay: '150ms' }}>
                <CashFlowCard
                  cashFlow={simResult?.cashFlow ?? null}
                  paths={simResult?.paths ?? null}
                  metrics={simResult?.metrics ?? null}
                  targetRetireAge={profile.targetRetireAge}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* 第3層: 詳細 — 必要な人だけが掘り下げる */}
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-brand-bronze hover:text-brand-night transition-colors list-none [&::-webkit-details-marker]:hidden py-3">
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                詳細データ
              </summary>
              <div className="space-y-6 pt-4">
                <ScenarioComparisonCard
                  currentResult={simResult}
                />
                <MonteCarloSimulatorTab
                  profile={profile}
                  paths={simResult?.paths ?? null}
                  isLoading={isLoading}
                  onVolatilityChange={(volatility) => updateProfile({ volatility })}
                />
              </div>
            </details>
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
