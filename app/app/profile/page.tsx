'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { ScoreWidget } from '@/components/dashboard/score-widget';

// Input cards
import { BasicInfoCard } from '@/components/dashboard/basic-info-card';
import { IncomeCard } from '@/components/dashboard/income-card';
import { RetirementCard } from '@/components/dashboard/retirement-card';
import { ExpenseCard } from '@/components/dashboard/expense-card';
import { AssetCard } from '@/components/dashboard/asset-card';
import { InvestmentCard } from '@/components/dashboard/investment-card';
import { LifeEventsSummaryCard } from '@/components/dashboard/life-events-summary-card';
import { HousingPlanCard } from '@/components/dashboard/housing-plan-card';

// Onboarding
import { WelcomeDialog } from '@/components/dashboard/welcome-dialog';

// FitGate preset
import { loadFitGateAnswers, fitGateToProfile, clearFitGateAnswers } from '@/lib/fitgate';

// Validation
import { useValidation } from '@/hooks/useValidation';

// Profile completeness
import { ProfileCompleteness } from '@/components/dashboard/profile-completeness';

type CardKey = 'basicInfo' | 'income' | 'retirement' | 'expense' | 'asset' | 'investment' | 'lifeEvents' | 'housing';

export default function ProfilePage() {
  const {
    profile,
    updateProfile,
    resetProfile,
  } = useProfileStore();

  const [showWelcome, setShowWelcome] = useState(false);

  // Check for first-time visit + FitGate preset
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fitGateAnswers = loadFitGateAnswers();
    if (fitGateAnswers) {
      const preset = fitGateToProfile(fitGateAnswers);
      updateProfile(preset);
      clearFitGateAnswers();
      localStorage.setItem('yohack-onboarding-complete', 'fitgate');
      localStorage.setItem('yohack-profile-edited', '1');
      return;
    }

    const status = localStorage.getItem('yohack-onboarding-complete');
    if (!status) {
      setShowWelcome(true);
    }
  }, []);

  const { getFieldError } = useValidation(profile);

  // Keep simulation running so results update live
  useMainSimulation();

  // --- Collapsible card state ---
  const [openCards, setOpenCards] = useState<Record<CardKey, boolean>>({
    basicInfo: true,
    income: true,
    retirement: false,
    expense: false,
    asset: false,
    investment: false,
    lifeEvents: false,
    housing: false,
  });

  const manualToggles = useRef<Set<CardKey>>(new Set());

  const cardComplete = useMemo<Record<CardKey, boolean>>(() => ({
    basicInfo: profile.currentAge !== 30 && profile.targetRetireAge !== 50,
    income: profile.grossIncome !== 800,
    retirement: profile.targetRetireAge !== 55,
    expense: profile.livingCostAnnual !== 300,
    asset: profile.assetCash !== 500 || profile.assetInvest !== 300,
    investment: profile.expectedReturn !== 5,
    lifeEvents: false,
    housing: false,
  }), [profile.currentAge, profile.targetRetireAge, profile.grossIncome, profile.livingCostAnnual, profile.assetCash, profile.assetInvest, profile.expectedReturn]);

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

  const cardRefs = {
    basicInfo: useRef<HTMLDivElement>(null),
    income: useRef<HTMLDivElement>(null),
    retirement: useRef<HTMLDivElement>(null),
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

  const handleWelcomeComplete = (profileData: Partial<typeof profile>) => {
    updateProfile(profileData);
    setShowWelcome(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yohack-onboarding-complete', 'complete');
      localStorage.setItem('yohack-profile-edited', '1');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          <div>
            <Link href="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-0.5 min-h-[44px]">
              <ArrowLeft className="h-3 w-3" />
              ダッシュボードに戻る
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-foreground">プロファイル</h1>
            <p className="text-sm text-brand-bronze">シミュレーションの前提条件</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreWidget />
            <Button
              variant="outline"
              size="sm"
              onClick={resetProfile}
              className="gap-2 bg-transparent min-h-[44px] min-w-[44px]"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">リセット</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 md:py-6 md:px-6 space-y-4 overflow-x-hidden">
        <ProfileCompleteness profile={profile} onOpenCard={handleOpenCard} />

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

        <div ref={cardRefs.lifeEvents}>
          <LifeEventsSummaryCard
            profile={profile}
            open={openCards.lifeEvents}
            onOpenChange={(o) => handleCardToggle('lifeEvents', o)}
          />
        </div>

        <div ref={cardRefs.housing}>
          <HousingPlanCard
            profile={profile}
            onUpdate={updateProfile}
            open={openCards.housing}
            onOpenChange={(o) => handleCardToggle('housing', o)}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
        </p>
      </div>

      <WelcomeDialog
        open={showWelcome}
        onComplete={handleWelcomeComplete}
        onSkip={dismissWelcome}
      />
    </>
  );
}
