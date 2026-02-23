'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/types';
import type { Profile } from '@/lib/types';

interface ProfileSummaryCardProps {
  profile: Profile;
  onUpdate?: (updates: Partial<Profile>) => void;
}

export function ProfileSummaryCard({ profile, onUpdate }: ProfileSummaryCardProps) {
  const modeLabel = profile.mode === 'couple' ? '夫婦' : '個人';
  const monthlyRent = Math.round(profile.housingCostAnnual / 12);
  const totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;

  // Inline rent editing
  const [editingRent, setEditingRent] = useState(false);
  const [rentDraft, setRentDraft] = useState(String(monthlyRent));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRent) {
      setRentDraft(String(monthlyRent));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editingRent]);

  const commitRent = () => {
    const parsed = parseInt(rentDraft, 10);
    if (!isNaN(parsed) && parsed >= 0 && onUpdate) {
      onUpdate({ housingCostAnnual: parsed * 12 });
    }
    setEditingRent(false);
  };

  // Build asset breakdown parts
  const assetParts: string[] = [];
  if (profile.assetCash > 0) assetParts.push(`現金${profile.assetCash}`);
  if (profile.assetInvest > 0) assetParts.push(`投資${profile.assetInvest}`);
  if (profile.assetDefinedContributionJP > 0) assetParts.push(`DC${profile.assetDefinedContributionJP}`);

  return (
    <Card className="overflow-hidden border-border bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
              <User className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">プロフィール</CardTitle>
          </div>
          <Link
            href="/app/profile"
            className="text-xs text-brand-gold hover:text-brand-bronze transition-colors inline-flex items-center min-h-[44px] px-2"
          >
            編集 →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="space-y-1 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">年齢 / 世帯</dt>
            <dd className="font-normal">{profile.currentAge}歳 / {modeLabel}</dd>
          </div>

          {profile.mode === 'couple' && profile.partnerGrossIncome > 0 && (
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">パートナー年収</dt>
              <dd className="font-normal">{formatCurrency(profile.partnerGrossIncome)}</dd>
            </div>
          )}

          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">家賃</dt>
            <dd className="font-normal">
              {editingRent ? (
                <span className="inline-flex items-center gap-1">
                  <span className="text-muted-foreground">月</span>
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    value={rentDraft}
                    onChange={(e) => setRentDraft(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={commitRent}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRent();
                      if (e.key === 'Escape') setEditingRent(false);
                    }}
                    className="w-16 rounded-lg border border-brand-gold bg-transparent px-1.5 py-0.5 text-right text-sm font-normal focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    min={0}
                    max={100}
                  />
                  <span className="text-muted-foreground">万</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdate && setEditingRent(true)}
                  className="border-b border-dashed border-brand-gold hover:border-brand-bronze transition-colors cursor-pointer"
                  title="クリックして編集"
                >
                  月{monthlyRent}万
                </button>
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">金融資産</dt>
            <dd className="font-normal">{formatCurrency(totalAssets)}</dd>
          </div>
          {assetParts.length > 1 && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground">
                ({assetParts.join(' / ')})
              </span>
            </div>
          )}

          {profile.rsuAnnual > 0 && (
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">RSU</dt>
              <dd className="font-normal">{formatCurrency(profile.rsuAnnual)}/年</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
