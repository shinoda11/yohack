'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2, TrendingUp, Home, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SliderInput } from '@/components/slider-input';
import { SectionCard } from '@/components/section-card';
import { cn } from '@/lib/utils';
import type { Profile, LifeEvent } from '@/lib/types';

// Types
type IncomeTrajectory = 'flat' | 'stair_up' | 'peak_then_flat';
type WorkStyleGoal = 'full_fire' | 'coast_fire' | 'barista_fire';
type LegacyStance = 'spend_all' | 'leave_some' | 'maximize_legacy';

interface AdvancedSettings {
  incomeTrajectory: IncomeTrajectory;
  realEstateValue: number;
  cryptoValue: number;
  otherAssets: number;
  workStyleGoal: WorkStyleGoal;
  legacyStance: LegacyStance;
}

interface AdvancedInputPanelProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
  advancedSettings: AdvancedSettings;
  onAdvancedUpdate: (updates: Partial<AdvancedSettings>) => void;
}

const incomeTrajectoryOptions = [
  { value: 'flat', label: 'フラット', description: '収入は現状維持' },
  { value: 'stair_up', label: '段階的上昇', description: '昇進・昇給を見込む' },
  { value: 'peak_then_flat', label: 'ピーク後横ばい', description: '一定年齢でピークに達する' },
];

const workStyleOptions = [
  { value: 'full_fire', label: '完全な余白', description: '働かなくても余白を維持' },
  { value: 'coast_fire', label: '維持モード', description: '資産を増やさず余白を保つ' },
  { value: 'barista_fire', label: '半分ワーク', description: 'パートタイムで余白を補填' },
];

const legacyOptions = [
  { value: 'spend_all', label: '使い切る', description: '自分の人生を最大限楽しむ' },
  { value: 'leave_some', label: '少し残す', description: '適度な遺産を残す' },
  { value: 'maximize_legacy', label: '最大化', description: '次世代への資産移転を重視' },
];

export function AdvancedInputPanel({
  profile,
  onUpdate,
  advancedSettings,
  onAdvancedUpdate,
}: AdvancedInputPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">詳細設定</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="advanced-toggle" className="text-sm text-muted-foreground">
              高度な設定を表示
            </Label>
            <Switch
              id="advanced-toggle"
              checked={isExpanded}
              onCheckedChange={setIsExpanded}
            />
          </div>
        </div>
      </CardHeader>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="space-y-6 pt-0">
            {/* Income Trajectory */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">収入推移予測</Label>
              </div>
              <RadioGroup
                value={advancedSettings.incomeTrajectory}
                onValueChange={(value) => 
                  onAdvancedUpdate({ incomeTrajectory: value as IncomeTrajectory })
                }
                className="grid grid-cols-1 gap-2"
              >
                {incomeTrajectoryOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={`income-${option.value}`} />
                    <Label
                      htmlFor={`income-${option.value}`}
                      className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Detailed Asset Allocation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">詳細資産配分</Label>
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <SliderInput
                  label="不動産評価額"
                  value={advancedSettings.realEstateValue}
                  onChange={(value) => onAdvancedUpdate({ realEstateValue: value })}
                  min={0}
                  max={10000}
                  step={100}
                  unit="万円"
                />
                <SliderInput
                  label="暗号資産"
                  value={advancedSettings.cryptoValue}
                  onChange={(value) => onAdvancedUpdate({ cryptoValue: value })}
                  min={0}
                  max={3000}
                  step={50}
                  unit="万円"
                />
                <SliderInput
                  label="その他資産"
                  value={advancedSettings.otherAssets}
                  onChange={(value) => onAdvancedUpdate({ otherAssets: value })}
                  min={0}
                  max={5000}
                  step={100}
                  unit="万円"
                />
              </div>
            </div>

            {/* Goal Lens */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">ゴールレンズ</Label>
              </div>
              
              <div className="space-y-4">
                {/* Work Style Goal */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">働き方の目標</Label>
                  <RadioGroup
                    value={advancedSettings.workStyleGoal}
                    onValueChange={(value) => 
                      onAdvancedUpdate({ workStyleGoal: value as WorkStyleGoal })
                    }
                    className="grid grid-cols-3 gap-2"
                  >
                    {workStyleOptions.map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`work-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`work-${option.value}`}
                          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-muted p-3 text-center hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                          <span className="text-[10px] text-muted-foreground">{option.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Legacy Stance */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">遺産に対するスタンス</Label>
                  <RadioGroup
                    value={advancedSettings.legacyStance}
                    onValueChange={(value) => 
                      onAdvancedUpdate({ legacyStance: value as LegacyStance })
                    }
                    className="grid grid-cols-3 gap-2"
                  >
                    {legacyOptions.map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`legacy-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`legacy-${option.value}`}
                          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-muted p-3 text-center hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                          <span className="text-[10px] text-muted-foreground">{option.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Expand/Collapse hint when collapsed */}
      {!isExpanded && (
        <CardContent className="pt-0">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <ChevronDown className="h-4 w-4" />
            収入推移・詳細資産・ゴール設定を表示
          </button>
        </CardContent>
      )}
    </Card>
  );
}

// Export types for use in parent components
export type { AdvancedSettings, IncomeTrajectory, WorkStyleGoal, LegacyStance };
