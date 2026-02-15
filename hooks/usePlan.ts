'use client';

import { useState, useEffect } from 'react';
import { type PlanType, getCurrentPlan, setPlan } from '@/lib/plan';

export function usePlan() {
  const [plan, setPlanState] = useState<PlanType>('free');

  useEffect(() => {
    setPlanState(getCurrentPlan());
  }, []);

  const upgrade = () => {
    setPlan('pro');
    setPlanState('pro');
  };

  const downgrade = () => {
    setPlan('free');
    setPlanState('free');
  };

  return { plan, isPro: plan === 'pro', upgrade, downgrade };
}
