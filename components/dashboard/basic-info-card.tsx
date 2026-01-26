'use client';

import { User } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { SliderInput } from '@/components/slider-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Profile, HouseholdMode } from '@/lib/types';

interface BasicInfoCardProps {
  profile: Pick<Profile, 'currentAge' | 'targetRetireAge' | 'mode'>;
  onUpdate: (updates: Partial<Profile>) => void;
}

export function BasicInfoCard({ profile, onUpdate }: BasicInfoCardProps) {
  return (
    <SectionCard
      icon={<User className="h-5 w-5" />}
      title="基本情報"
      description="あなたの基本的な情報を入力してください"
    >
      <div className="space-y-6">
        {/* Household mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">世帯構成</Label>
          <RadioGroup
            value={profile.mode}
            onValueChange={(value: HouseholdMode) => onUpdate({ mode: value })}
            className="flex gap-4"
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
        <SliderInput
          label="現在の年齢"
          value={profile.currentAge}
          onChange={(value) => onUpdate({ currentAge: value })}
          min={20}
          max={80}
          step={1}
          unit="歳"
        />

        {/* Target retirement age */}
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
      </div>
    </SectionCard>
  );
}
