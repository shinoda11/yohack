'use client';

import React, { useState } from 'react';
import { User, Wallet, PiggyBank } from 'lucide-react';
import type { HouseholdMode, Profile } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Simple Y-branch symbol (no animation) */
function YSymbol() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-foreground"
    >
      <line x1="90" y1="94" x2="42" y2="34" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <circle cx="90" cy="94" r="9" fill="var(--brand-gold)" />
      <circle cx="42" cy="34" r="6" fill="currentColor" />
      <circle cx="138" cy="34" r="6" fill="currentColor" />
    </svg>
  );
}

const introSteps = [
  {
    icon: <User className="h-5 w-5" />,
    label: '基本情報',
    description: '年齢・世帯・退職目標',
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    label: '収入と住居',
    description: '年収・家賃',
  },
  {
    icon: <PiggyBank className="h-5 w-5" />,
    label: '資産',
    description: '概算で十分',
  },
];

interface WelcomeDialogProps {
  open: boolean;
  onComplete: (profileData: Partial<Profile>) => void;
  onSkip: () => void;
}

interface FormData {
  currentAge: number;
  mode: HouseholdMode;
  targetRetireAge: number;
  grossIncome: number;
  partnerGrossIncome: number;
  housingCostMonthly: number;
  totalAssets: number;
}

const defaultFormData: FormData = {
  currentAge: 30,
  mode: 'couple',
  targetRetireAge: 50,
  grossIncome: 800,
  partnerGrossIncome: 400,
  housingCostMonthly: 15,
  totalAssets: 800,
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i + 1 <= current ? 'bg-brand-gold' : 'bg-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function WelcomeDialog({ open, onComplete, onSkip }: WelcomeDialogProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const handleComplete = () => {
    onComplete({
      currentAge: formData.currentAge,
      mode: formData.mode,
      targetRetireAge: formData.targetRetireAge,
      grossIncome: formData.grossIncome,
      partnerGrossIncome: formData.mode === 'couple' ? formData.partnerGrossIncome : 0,
      housingCostAnnual: formData.housingCostMonthly * 12,
      assetCash: Math.round(formData.totalAssets * 0.3),
      assetInvest: Math.round(formData.totalAssets * 0.7),
    });
  };

  const update = (field: keyof FormData, value: number | HouseholdMode) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const numChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    update(field, isNaN(parsed) ? 0 : parsed);
  };

  const selectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onSkip(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
        <div className="p-6 sm:p-8 space-y-6">
          {/* Step 0: Welcome intro */}
          {step === 0 && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <YSymbol />
                <DialogTitle className="text-xl font-bold">
                  YOHACK へようこそ
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground tracking-[0.25em]">
                  人生に、余白を。
                </DialogDescription>
              </div>

              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                3つのステップで、あなたの余白が見えてきます。<br />
                まずは基本情報から。
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {introSteps.map((s, i) => (
                  <div
                    key={s.label}
                    className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 rounded-lg border p-4 sm:p-4 sm:text-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
                      {s.icon}
                    </div>
                    <div className="sm:space-y-1">
                      <p className="text-sm font-normal">
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {s.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  className="w-full sm:w-auto px-8 bg-brand-gold text-white"
                  onClick={() => setStep(1)}
                >
                  はじめる
                </Button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={onSkip}
                >
                  スキップ
                </button>
              </div>
            </>
          )}

          {/* Steps 1-3: Form wizard */}
          {step >= 1 && (
            <>
              <DialogTitle className="sr-only">プロフィール入力</DialogTitle>
              <DialogDescription className="sr-only">ステップ {step} / 3</DialogDescription>
              <StepIndicator current={step} total={3} />
            </>
          )}

          {/* Step 1: Basic info */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-center">基本情報</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="onb-age">現在の年齢</Label>
                  <Input
                    id="onb-age"
                    type="number"
                    value={formData.currentAge}
                    onChange={numChange('currentAge')}
                    onFocus={selectAll}
                    min={18}
                    max={80}
                    className="mt-1 min-h-[44px]"
                  />
                </div>
                <div>
                  <Label>世帯タイプ</Label>
                  <div className="flex gap-2 mt-1">
                    {(['solo', 'couple'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`flex-1 rounded-lg border px-4 py-2.5 text-sm min-h-[44px] transition-colors ${
                          formData.mode === m
                            ? 'border-brand-gold bg-brand-gold/15 text-foreground font-normal'
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}
                        onClick={() => update('mode', m)}
                      >
                        {m === 'solo' ? '個人' : 'カップル / 夫婦'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="onb-retire">目標リタイア年齢</Label>
                  <Input
                    id="onb-retire"
                    type="number"
                    value={formData.targetRetireAge}
                    onChange={numChange('targetRetireAge')}
                    onFocus={selectAll}
                    min={formData.currentAge + 1}
                    max={80}
                    className="mt-1 min-h-[44px]"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(0)}>戻る</Button>
                <Button
                  className="bg-brand-gold text-white"
                  onClick={() => setStep(2)}
                >
                  次へ
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Income & Housing */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-center">収入・住居</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="onb-income">年収（税込）</Label>
                  <div className="relative mt-1">
                    <Input
                      id="onb-income"
                      type="number"
                      value={formData.grossIncome}
                      onChange={numChange('grossIncome')}
                      onFocus={selectAll}
                      min={0}
                      className="pr-12 min-h-[44px]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">万円</span>
                  </div>
                </div>
                {formData.mode === 'couple' && (
                  <div>
                    <Label htmlFor="onb-partner-income">パートナー年収（税込）</Label>
                    <div className="relative mt-1">
                      <Input
                        id="onb-partner-income"
                        type="number"
                        value={formData.partnerGrossIncome}
                        onChange={numChange('partnerGrossIncome')}
                        onFocus={selectAll}
                        min={0}
                        className="pr-12 min-h-[44px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">万円</span>
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="onb-rent">月額家賃</Label>
                  <div className="relative mt-1">
                    <Input
                      id="onb-rent"
                      type="number"
                      value={formData.housingCostMonthly}
                      onChange={numChange('housingCostMonthly')}
                      onFocus={selectAll}
                      min={0}
                      className="pr-12 min-h-[44px]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">万円</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>戻る</Button>
                <Button
                  className="bg-brand-gold text-white"
                  onClick={() => setStep(3)}
                >
                  次へ
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Assets */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-bold text-center">資産</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="onb-assets">総資産（現金 + 投資）</Label>
                  <div className="relative mt-1">
                    <Input
                      id="onb-assets"
                      type="number"
                      value={formData.totalAssets}
                      onChange={numChange('totalAssets')}
                      onFocus={selectAll}
                      min={0}
                      className="pr-12 min-h-[44px]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">万円</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    現金30% / 投資70% で自動配分されます（後から変更可）
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">現金</span>
                    <span>{Math.round(formData.totalAssets * 0.3).toLocaleString()} 万円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">投資</span>
                    <span>{Math.round(formData.totalAssets * 0.7).toLocaleString()} 万円</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>戻る</Button>
                <Button
                  className="bg-brand-gold text-white"
                  onClick={handleComplete}
                >
                  結果を見る
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
