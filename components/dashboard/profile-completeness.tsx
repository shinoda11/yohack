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
}

export function ProfileCompleteness({ profile }: ProfileCompletenessProps) {
  const { percentage, isComplete, incompleteFields } = useProfileCompleteness(profile);
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
        'mb-4 rounded-lg border border-border p-3 transition-opacity duration-500',
        fadingOut && 'opacity-0'
      )}
    >
      {isComplete ? (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#C8B89A]">
          <Check className="h-4 w-4" />
          入力完了！
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">プロファイル完成度</span>
            <span className="font-medium tabular-nums">{percentage}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#C8B89A] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {displayFields.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              未入力: {displayFields.join('、')}
              {remaining > 0 && `、他${remaining}件`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
