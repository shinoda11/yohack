'use client';

import { User } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Profile, HouseholdMode } from '@/lib/types';

interface BasicInfoCardProps {
  profile: Pick<Profile, 'currentAge' | 'targetRetireAge' | 'mode'>;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BasicInfoCard({ profile, onUpdate, getFieldError, open, onOpenChange }: BasicInfoCardProps) {
  const icon = <User className="h-5 w-5" />;
  const title = '基本情報';

  const content = (
    <div className="space-y-6">
      {/* Household mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">世帯構成</Label>
        <RadioGroup
          value={profile.mode}
          onValueChange={(value: HouseholdMode) => onUpdate({ mode: value })}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="solo" id="mode-solo" />
            <Label htmlFor="mode-solo" className="cursor-pointer font-normal">
              個人
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="couple" id="mode-couple" />
            <Label htmlFor="mode-couple" className="cursor-pointer font-normal">
              夫婦
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Current age */}
      <div>
        <SliderInput
          label="現在の年齢"
          value={profile.currentAge}
          onChange={(value) => onUpdate({ currentAge: value })}
          min={20}
          max={80}
          step={1}
          unit="歳"
        />
        <FieldError message={getFieldError?.('currentAge')} />
      </div>

      {/* Target retirement age */}
      <div>
        <SliderInput
          label="目標年齢"
          description="安心ラインに届きたい年齢"
          value={profile.targetRetireAge}
          onChange={(value) => onUpdate({ targetRetireAge: value })}
          min={Math.max(profile.currentAge + 1, 30)}
          max={80}
          step={1}
          unit="歳"
        />
        <FieldError message={getFieldError?.('targetRetireAge')} />
      </div>
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const modeLabel = profile.mode === 'couple' ? '夫婦' : '個人';
    const summary = (
      <>
        <span className="font-medium text-foreground">{profile.currentAge}歳</span>
        {' / 目標 '}
        <span className="font-medium text-foreground">{profile.targetRetireAge}歳</span>
        {' / '}
        {modeLabel}
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="あなたの基本的な情報を入力してください">
      {content}
    </SectionCard>
  );
}
