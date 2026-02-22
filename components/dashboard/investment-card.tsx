'use client';

import { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import { TermTooltip } from '@/components/ui/term-tooltip';
import { glossary } from '@/lib/glossary';
import { getEstimatedTaxRates } from '@/lib/engine';
import type { Profile } from '@/lib/types';

interface InvestmentCardProps {
  profile: Pick<
    Profile,
    | 'expectedReturn'
    | 'inflationRate'
    | 'volatility'
    | 'effectiveTaxRate'
    | 'useAutoTaxRate'
    | 'retireSpendingMultiplier'
    | 'grossIncome'
    | 'rsuAnnual'
    | 'sideIncomeNet'
    | 'partnerGrossIncome'
    | 'partnerRsuAnnual'
    | 'mode'
  >;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  completed?: boolean;
}

export function InvestmentCard({ profile, onUpdate, getFieldError, open, onOpenChange, completed }: InvestmentCardProps) {
  const realReturn = profile.expectedReturn - profile.inflationRate;
  const icon = <TrendingUp className="h-5 w-5" />;
  const title = '投資設定';
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-calculated tax rates
  const taxRates = getEstimatedTaxRates(profile as Profile);
  const displayRate = profile.useAutoTaxRate ? taxRates.combined : profile.effectiveTaxRate;

  const content = (
    <div className="space-y-6">
      {/* Expected return presets */}
      <div className="space-y-4">
        <div className="text-sm font-normal">
          <TermTooltip term="期待リターン" description={glossary['期待リターン']} />
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {([
            { value: 3, label: '保守的', desc: '債券中心・低リスク運用' },
            { value: 5, label: '標準', desc: 'インデックス投資の長期平均' },
            { value: 7, label: '積極的', desc: '株式中心・高リスク運用' },
          ] as const).map((preset) => {
            const isActive = profile.expectedReturn === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onUpdate({ expectedReturn: preset.value })}
                className={`rounded-lg border p-2 sm:p-2.5 text-center transition-colors ${
                  isActive
                    ? 'border-foreground bg-foreground/5 ring-1 ring-foreground/20'
                    : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                }`}
              >
                <div className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {preset.label}
                </div>
                <div className={`text-lg font-bold ${isActive ? 'text-foreground' : ''}`}>
                  {preset.value}%
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                  {preset.desc}
                </div>
              </button>
            );
          })}
        </div>
        {profile.expectedReturn !== 3 && profile.expectedReturn !== 5 && profile.expectedReturn !== 7 && (
          <div className="text-xs text-muted-foreground">
            カスタム値: {profile.expectedReturn}%（詳細設定で変更可）
          </div>
        )}
        <FieldError message={getFieldError?.('expectedReturn')} />
      </div>

      {/* Estimated effective tax rate (read-only) */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <TermTooltip term="推定実効税率" description="年収から自動計算された所得税・住民税・社会保険料の合算割合" />
          <span className="font-bold">{displayRate.toFixed(1)}%</span>
        </div>
        {profile.useAutoTaxRate && profile.mode === 'couple' && (
          <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
            <div className="flex justify-between">
              <span>本人</span>
              <span>{taxRates.main.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>配偶者</span>
              <span>{taxRates.partner.toFixed(1)}%</span>
            </div>
          </div>
        )}
        {profile.useAutoTaxRate && (
          <p className="text-xs text-muted-foreground pt-1">
            収入から自動計算（所得税+住民税+社保）
          </p>
        )}
      </div>

      {/* Advanced settings toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        詳細設定
      </button>

      {showAdvanced && (
        <div className="space-y-6 pl-3 border-l-2 border-muted">
          {/* Expected return fine-tune slider */}
          <div>
            <SliderInput
              label="期待リターン（カスタム）"
              description="名目"
              value={profile.expectedReturn}
              onChange={(value) => onUpdate({ expectedReturn: value })}
              min={0}
              max={15}
              step={0.5}
              unit="%"
            />
          </div>

          {/* Inflation rate */}
          <div>
            <SliderInput
              label={<TermTooltip term="インフレ率" description={glossary['インフレ率']} />}
              value={profile.inflationRate}
              onChange={(value) => onUpdate({ inflationRate: value })}
              min={0}
              max={5}
              step={0.1}
              unit="%"
            />
            <FieldError message={getFieldError?.('inflationRate')} />
          </div>

          {/* Real return display */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">実質リターン</span>
              <span className="font-bold">{realReturn.toFixed(1)}%</span>
            </div>
          </div>

          {/* Volatility */}
          <div>
            <SliderInput
              label={<TermTooltip term="ボラティリティ" description={glossary['ボラティリティ']} />}
              description="標準偏差"
              value={Math.round(profile.volatility * 100)}
              onChange={(value) => onUpdate({ volatility: value / 100 })}
              min={5}
              max={30}
              step={1}
              unit="%"
            />
            <FieldError message={getFieldError?.('volatility')} />
          </div>

          {/* Auto tax toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!profile.useAutoTaxRate}
              onChange={(e) => onUpdate({ useAutoTaxRate: !e.target.checked })}
              className="rounded-md border-input"
            />
            <span className="text-muted-foreground">実効税率を手動で設定する</span>
          </label>

          {/* Manual tax rate slider (only visible when override is on) */}
          {!profile.useAutoTaxRate && (
            <div>
              <SliderInput
                label={<TermTooltip term="実効税率" description={glossary['実効税率']} />}
                value={profile.effectiveTaxRate}
                onChange={(value) => onUpdate({ effectiveTaxRate: value })}
                min={10}
                max={50}
                step={1}
                unit="%"
              />
              <FieldError message={getFieldError?.('effectiveTaxRate')} />
            </div>
          )}

          {/* Retirement spending multiplier */}
          <div>
            <SliderInput
              label={<TermTooltip term="退職後支出倍率" description={glossary['退職後支出倍率']} />}
              description="現役時比"
              value={Math.round(profile.retireSpendingMultiplier * 100)}
              onChange={(value) => onUpdate({ retireSpendingMultiplier: value / 100 })}
              min={50}
              max={120}
              step={5}
              unit="%"
            />
            <FieldError message={getFieldError?.('retireSpendingMultiplier')} />
          </div>
        </div>
      )}
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const presetLabel = profile.expectedReturn === 3 ? '保守的' : profile.expectedReturn === 5 ? '標準' : profile.expectedReturn === 7 ? '積極的' : '';
    const summary = (
      <>
        {'リターン'}
        <span className="font-normal text-foreground">{profile.expectedReturn}%</span>
        {presetLabel && <span className="text-muted-foreground">({presetLabel})</span>}
        {' / 税率'}
        <span className="font-normal text-foreground">{displayRate.toFixed(1)}%</span>
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange} completed={completed}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="投資リターンとリスクの想定">
      {content}
    </SectionCard>
  );
}
