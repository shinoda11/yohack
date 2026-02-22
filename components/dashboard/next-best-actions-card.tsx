'use client';

import React, { useMemo, useState } from 'react';
import {
  Lightbulb,
  ArrowRight,
  Check,
  Clock,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calendar,
  Wallet,
  Target,
  Loader2,
} from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { KeyMetrics, Profile, ExitScoreDetail, SimulationResult } from '@/lib/types';
import { runSimulation } from '@/lib/engine';
import { cn } from '@/lib/utils';

interface ActionImpact {
  fireAge: number; // Change in FIRE age (negative = earlier)
  survivalRate: number; // Change in survival rate (positive = better)
  score: number; // Change in overall score
}

interface NextAction {
  id: string;
  title: string;
  description: string;
  impact: ActionImpact;
  priority: 'high' | 'medium' | 'low';
  category: 'income' | 'expense' | 'savings' | 'timeline';
  icon: React.ReactNode;
  profileChange: Partial<Profile>;
}

interface NextBestActionsCardProps {
  metrics: KeyMetrics | null;
  score: ExitScoreDetail | null;
  profile: Profile;
  isLoading?: boolean;
  onApplyAction: (updates: Partial<Profile>) => void;
}

// Calculate the impact of an action by running a simulation
async function calculateActionImpact(
  baseProfile: Profile,
  baseResult: SimulationResult,
  change: Partial<Profile>
): Promise<ActionImpact> {
  const modifiedProfile = { ...baseProfile, ...change };
  const newResult = await runSimulation(modifiedProfile);
  
  return {
    fireAge: (newResult.metrics.fireAge ?? 0) - (baseResult.metrics.fireAge ?? 0),
    survivalRate: newResult.metrics.survivalRate - baseResult.metrics.survivalRate,
    score: newResult.score.overall - baseResult.score.overall,
  };
}

// Generate potential actions based on current state
function generatePotentialActions(
  profile: Profile,
  score: ExitScoreDetail
): Omit<NextAction, 'impact'>[] {
  const actions: Omit<NextAction, 'impact'>[] = [];

  // Action 1: Delay retirement by 3 years (if survival is low)
  if (score.survival < 85) {
    actions.push({
      id: 'delay-retirement-3',
      title: '目標を3年延長',
      description: `目標を${profile.targetRetireAge}歳から${profile.targetRetireAge + 3}歳に延長`,
      priority: 'high',
      category: 'timeline',
      icon: <Calendar className="h-4 w-4" />,
      profileChange: { targetRetireAge: profile.targetRetireAge + 3 },
    });
  }

  // Action 2: Reduce living expenses by 10%
  if (score.lifestyle < 80) {
    const reduction = Math.round(profile.livingCostAnnual * 0.1);
    actions.push({
      id: 'reduce-expense-10',
      title: '生活費を10%削減',
      description: `年間生活費を${profile.livingCostAnnual}万円から${profile.livingCostAnnual - reduction}万円に`,
      priority: 'high',
      category: 'expense',
      icon: <TrendingDown className="h-4 w-4" />,
      profileChange: { livingCostAnnual: profile.livingCostAnnual - reduction },
    });
  }

  // Action 3: Increase investment by 100万円/year
  actions.push({
    id: 'increase-investment-100',
    title: '年間投資額を100万円増加',
    description: '毎月約8.3万円の追加投資で資産形成を加速',
    priority: 'medium',
    category: 'savings',
    icon: <TrendingUp className="h-4 w-4" />,
    profileChange: { 
      assetInvest: profile.assetInvest + 100,
    },
  });

  // Action 4: Add side income
  if (profile.sideIncomeNet < 50) {
    actions.push({
      id: 'add-side-income-50',
      title: '副業収入を追加（年50万円）',
      description: 'スキルを活かした副業で収入源を多様化',
      priority: 'medium',
      category: 'income',
      icon: <Wallet className="h-4 w-4" />,
      profileChange: { sideIncomeNet: profile.sideIncomeNet + 50 },
    });
  }

  // Action 5: Maximize DC contribution
  if (profile.dcContributionAnnual < 66) {
    actions.push({
      id: 'max-dc-contribution',
      title: 'iDeCo/DC拠出を最大化',
      description: `年間拠出額を${profile.dcContributionAnnual}万円から66万円に増加`,
      priority: 'medium',
      category: 'savings',
      icon: <PiggyBank className="h-4 w-4" />,
      profileChange: { dcContributionAnnual: 66 },
    });
  }

  // Action 6: Delay retirement by 1 year (lighter option)
  if (score.survival >= 85 && score.survival < 95) {
    actions.push({
      id: 'delay-retirement-1',
      title: '目標を1年延長',
      description: `目標を${profile.targetRetireAge}歳から${profile.targetRetireAge + 1}歳に`,
      priority: 'low',
      category: 'timeline',
      icon: <Clock className="h-4 w-4" />,
      profileChange: { targetRetireAge: profile.targetRetireAge + 1 },
    });
  }

  return actions.slice(0, 5); // Return top 5 potential actions
}

// 統一カラーパレット - グレー系で落ち着いたトーン
const priorityColors = {
  high: 'border-l-brand-bronze bg-brand-canvas/50 dark:bg-brand-night/20',
  medium: 'border-l-brand-bronze/60 bg-brand-canvas/30 dark:bg-brand-night/10',
  low: 'border-l-brand-linen bg-brand-canvas/20 dark:bg-brand-night/5',
};

function ImpactBadge({ value, label, unit, isPositive }: { 
  value: number; 
  label: string; 
  unit: string;
  isPositive: boolean;
}) {
  const formatted = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  const isGood = isPositive ? value > 0 : value < 0;
  
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
      isGood
        ? 'bg-brand-canvas text-brand-stone dark:bg-brand-night dark:text-brand-linen'
        : 'bg-brand-canvas text-brand-bronze dark:bg-brand-night dark:text-brand-bronze'
    )}>
      <span>{label}:</span>
      <span className={isGood ? 'font-semibold' : ''}>{formatted}{unit}</span>
    </div>
  );
}

export function NextBestActionsCard({
  metrics,
  score,
  profile,
  isLoading: parentLoading,
  onApplyAction,
}: NextBestActionsCardProps) {
  const [calculatingActions, setCalculatingActions] = useState<Set<string>>(new Set());
  const [calculatedImpacts, setCalculatedImpacts] = useState<Map<string, ActionImpact>>(new Map());
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  // Generate potential actions
  const potentialActions = useMemo(() => {
    if (!score) return [];
    return generatePotentialActions(profile, score);
  }, [profile, score]);

  // Calculate impact for an action
  const handleCalculateImpact = async (action: Omit<NextAction, 'impact'>) => {
    if (calculatedImpacts.has(action.id) || !metrics) return;
    
    setCalculatingActions(prev => new Set(prev).add(action.id));
    
    try {
      // We need the base result to compare
      const baseResult = await runSimulation(profile);
      const impact = await calculateActionImpact(profile, baseResult, action.profileChange);
      
      setCalculatedImpacts(prev => new Map(prev).set(action.id, impact));
    } catch (error) {
      console.error('Failed to calculate impact:', error);
    } finally {
      setCalculatingActions(prev => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }
  };

  // Apply an action
  const handleApplyAction = (action: Omit<NextAction, 'impact'>) => {
    onApplyAction(action.profileChange);
    setAppliedActions(prev => new Set(prev).add(action.id));
    
    // Reset after a short delay to allow re-applying
    setTimeout(() => {
      setAppliedActions(prev => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }, 2000);
  };

  if (parentLoading || !metrics || !score) {
    return (
      <SectionCard
        icon={<Lightbulb className="h-5 w-5" />}
        title="次の一手"
        description="次に検討できること"
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<Lightbulb className="h-5 w-5" />}
      title="次の一手"
      description="次に検討できること（効果をプレビュー）"
    >
      <div className="space-y-4">
        {potentialActions.map((action) => {
          const impact = calculatedImpacts.get(action.id);
          const isCalculating = calculatingActions.has(action.id);
          const isApplied = appliedActions.has(action.id);

          const isFirst = potentialActions.indexOf(action) === 0;
          return (
            <div
              key={action.id}
              className={cn(
                'rounded-lg border-l-4 p-4 transition-all',
                isFirst ? 'border-l-brand-gold bg-brand-canvas/50 dark:bg-brand-night/20' : priorityColors[action.priority]
              )}
            >
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 rounded-md bg-background p-2 text-muted-foreground shadow-sm">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{action.title}</h4>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impact Display */}
                {impact && (
                  <div className="flex flex-wrap gap-2 pl-11">
                    <ImpactBadge 
                      value={impact.fireAge} 
                      label="安心ライン" 
                      unit="年" 
                      isPositive={false}
                    />
                    <ImpactBadge 
                      value={impact.survivalRate} 
                      label="生存率" 
                      unit="%" 
                      isPositive={true}
                    />
                    <ImpactBadge 
                      value={impact.score} 
                      label="スコア" 
                      unit="点" 
                      isPositive={true}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pl-11">
                  {isApplied ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3" />
                      適用済み
                    </span>
                  ) : !impact ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] gap-1.5 bg-transparent text-xs px-4 py-2"
                      onClick={() => handleCalculateImpact(action)}
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Target className="h-3 w-3" />
                          効果を見る
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="min-h-[44px] gap-1.5 text-xs px-4 py-2 bg-brand-gold text-brand-night hover:bg-brand-gold/90"
                      onClick={() => handleApplyAction(action)}
                    >
                      <ArrowRight className="h-3 w-3" />
                      この条件を適用
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
