'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

const COMPLETENESS_KEY = 'yohack-profile-completeness-dismissed';
const ONBOARDING_KEY = 'yohack-onboarding-complete';

interface ProfileCompletenessProps {
  profile: Profile;
  onOpenCard?: (cardId: string) => void;
}

export function ProfileCompleteness({ profile, onOpenCard }: ProfileCompletenessProps) {
  const { percentage, isComplete, incompleteFields, incompleteFieldDetails } = useProfileCompleteness(profile);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Show only after onboarding is complete and not previously dismissed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onboardingStatus = localStorage.getItem(ONBOARDING_KEY);
    const dismissed = localStorage.getItem(COMPLETENESS_KEY);
    if (onboardingStatus === 'complete' && dismissed !== 'true') {
      setVisible(true);
    }
  }, []);

  // When 100%, fade out after 5 seconds and persist
  useEffect(() => {
    if (!visible || !isComplete) return;
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(COMPLETENESS_KEY, 'true');
        }
        setVisible(false);
      }, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible, isComplete]);

  if (!visible) return null;

  // Show up to 3 incomplete fields
  const displayFields = incompleteFields.slice(0, 3);
  const remaining = incompleteFields.length - displayFields.length;

  return (
    <div
      className={cn(
        'mb-4 rounded-lg border border-border p-4 transition-opacity duration-500',
        fadingOut && 'opacity-0'
      )}
    >
      {isComplete ? (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-brand-gold">
          <Check className="h-4 w-4" />
          入力完了
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">プロファイル完成度</span>
            <span className="font-medium tabular-nums">{percentage}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-gold transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {incompleteFieldDetails.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              未入力:{' '}
              {incompleteFieldDetails.slice(0, 3).map((f, i) => (
                <span key={f.label}>
                  {i > 0 && '、'}
                  {onOpenCard ? (
                    <button
                      type="button"
                      className="underline cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => onOpenCard(f.cardId)}
                    >
                      {f.label}
                    </button>
                  ) : (
                    f.label
                  )}
                </span>
              ))}
              {incompleteFieldDetails.length > 3 && `、他${incompleteFieldDetails.length - 3}件`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
