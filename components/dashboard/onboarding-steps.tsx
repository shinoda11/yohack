'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'yohack-onboarding-complete';

/** Step completion checks based on user-specified defaults */
function isStep1Complete(profile: Profile): boolean {
  return profile.currentAge !== 30 && profile.targetRetireAge !== 50;
}

function isStep2Complete(profile: Profile): boolean {
  return profile.grossIncome !== 800 && profile.livingCostAnnual !== 300;
}

function isStep3Complete(profile: Profile): boolean {
  return profile.assetCash + profile.assetInvest > 0;
}

const stepLabels = ['基本情報', '収入・支出', '資産'];

interface OnboardingStepsProps {
  profile: Profile;
}

export function OnboardingSteps({ profile }: OnboardingStepsProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const completed = [
    isStep1Complete(profile),
    isStep2Complete(profile),
    isStep3Complete(profile),
  ];
  const allComplete = completed.every(Boolean);

  // Show only if welcome was shown but onboarding not yet complete
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const status = localStorage.getItem(ONBOARDING_KEY);
    if (status === 'welcome-shown') {
      setVisible(true);
    }
  }, []);

  // When all steps complete, save and fade out
  useEffect(() => {
    if (!visible || !allComplete) return;
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(ONBOARDING_KEY, 'complete');
        }
        setVisible(false);
      }, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [visible, allComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'mb-4 rounded-xl border bg-card p-4 transition-opacity duration-500',
        fadingOut && 'opacity-0'
      )}
    >
      {allComplete ? (
        <p className="text-sm text-center text-brand-gold font-normal">
          入力完了。結果が表示されています
        </p>
      ) : (
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {completed[i] ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold">
                  <Check className="h-3.5 w-3.5 text-brand-night" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground text-xs font-normal">
                  {i + 1}
                </div>
              )}
              <span className={cn(
                'text-sm',
                completed[i] ? 'text-foreground font-normal' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
