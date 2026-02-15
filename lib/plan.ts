export type PlanType = 'free' | 'pro';

const PLAN_KEY = 'yohack-plan';

export function getCurrentPlan(): PlanType {
  if (typeof window === 'undefined') return 'free';
  return (localStorage.getItem(PLAN_KEY) as PlanType) || 'free';
}

export function setPlan(plan: PlanType): void {
  localStorage.setItem(PLAN_KEY, plan);
}

export function isPro(): boolean {
  return getCurrentPlan() === 'pro';
}
