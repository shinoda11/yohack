'use client';

import { Wallet } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { SliderInput } from '@/components/slider-input';
import { FieldError } from '@/components/ui/field-error';
import type { Profile } from '@/lib/types';

interface AssetCardProps {
  profile: Pick<
    Profile,
    'assetCash' | 'assetInvest' | 'assetDefinedContributionJP' | 'dcContributionAnnual'
  >;
  onUpdate: (updates: Partial<Profile>) => void;
  getFieldError?: (field: string) => string | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssetCard({ profile, onUpdate, getFieldError, open, onOpenChange }: AssetCardProps) {
  const totalAssets =
    profile.assetCash +
    profile.assetInvest +
    profile.assetDefinedContributionJP;

  const icon = <Wallet className="h-5 w-5" />;
  const title = '資産';

  const content = (
    <div className="space-y-6">
      {/* Cash */}
      <div>
        <SliderInput
          label="現預金"
          description="普通・定期預金"
          value={profile.assetCash}
          onChange={(value) => onUpdate({ assetCash: value })}
          min={0}
          max={10000}
          step={50}
          unit="万円"
        />
        <FieldError message={getFieldError?.('assetCash')} />
      </div>

      {/* Investment assets */}
      <div>
        <SliderInput
          label="投資資産"
          description="株式、投資信託、NISA等"
          value={profile.assetInvest}
          onChange={(value) => onUpdate({ assetInvest: value })}
          min={0}
          max={30000}
          step={100}
          unit="万円"
        />
        <FieldError message={getFieldError?.('assetInvest')} />
      </div>

      {/* Defined contribution */}
      <div>
        <SliderInput
          label="確定拠出年金"
          description="iDeCo、企業型DC"
          value={profile.assetDefinedContributionJP}
          onChange={(value) => onUpdate({ assetDefinedContributionJP: value })}
          min={0}
          max={5000}
          step={50}
          unit="万円"
        />
        <FieldError message={getFieldError?.('assetDefinedContributionJP')} />
      </div>

      {/* DC annual contribution */}
      <SliderInput
        label="DC年間拠出額"
        value={profile.dcContributionAnnual}
        onChange={(value) => onUpdate({ dcContributionAnnual: value })}
        min={0}
        max={100}
        step={1}
        unit="万円"
      />

      {/* Total summary */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">資産合計</span>
          <span className="text-lg font-semibold">
            {totalAssets.toLocaleString()}万円
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-xs sm:gap-2">
          <div className="text-center">
            <div className="font-medium">{Math.round((profile.assetCash / totalAssets) * 100) || 0}%</div>
            <div className="text-muted-foreground">現預金</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{Math.round((profile.assetInvest / totalAssets) * 100) || 0}%</div>
            <div className="text-muted-foreground">投資</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{Math.round((profile.assetDefinedContributionJP / totalAssets) * 100) || 0}%</div>
            <div className="text-muted-foreground">DC年金</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (open !== undefined && onOpenChange) {
    const summary = (
      <>
        {'総資産 '}
        <span className="font-medium text-foreground">{totalAssets.toLocaleString()}万円</span>
        {`（現金${profile.assetCash.toLocaleString()} / 投資${profile.assetInvest.toLocaleString()} / DC${profile.assetDefinedContributionJP.toLocaleString()}）`}
      </>
    );
    return (
      <CollapsibleCard icon={icon} title={title} summary={summary} open={open} onOpenChange={onOpenChange}>
        {content}
      </CollapsibleCard>
    );
  }

  return (
    <SectionCard icon={icon} title={title} description="現在の資産状況を入力してください">
      {content}
    </SectionCard>
  );
}
