'use client';

/**
 * Exit Readiness OS v2 - MoneyMarginCard
 * お金の余白を表示するカード
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  PiggyBank, 
  Shield, 
  TrendingUp,
  Info
} from 'lucide-react';
import type { MoneyMargin } from '@/lib/v2/margin';
import { getHealthColor, getHealthBgColor, getHealthLabel } from '@/hooks/useMargin';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface MoneyMarginCardProps {
  moneyMargin: MoneyMargin | null;
  health: 'excellent' | 'good' | 'fair' | 'poor' | null;
  isLoading?: boolean;
}

// Safe display helper - NaN/undefined guard
const safeDisplayNumber = (value: number | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '—';
  }
  if (decimals === 0) {
    return Math.round(value).toLocaleString();
  }
  return value.toFixed(decimals);
};

export function MoneyMarginCard({ moneyMargin, health, isLoading }: MoneyMarginCardProps) {
  // データの有無を厳密にチェック（NaNも欠損として扱う）
  const hasValidData = moneyMargin !== null && 
    !isLoading && 
    !isNaN(moneyMargin.monthlyNetSavings) && 
    !isNaN(moneyMargin.annualDisposableIncome) &&
    isFinite(moneyMargin.monthlyNetSavings) &&
    isFinite(moneyMargin.annualDisposableIncome);
  
  // 欠損理由を明確に表示（0埋め禁止）
  const missingReason = isLoading
    ? null // ローディング中は理由を表示しない
    : !moneyMargin
      ? 'プロファイルの入力が必要です'
      : (isNaN(moneyMargin.monthlyNetSavings) || !isFinite(moneyMargin.monthlyNetSavings))
        ? 'ダッシュボードでシミュレーションを実行してください'
        : null;

  // 値に応じた文脈メッセージを生成
  const getSavingsContext = (): string => {
    if (!hasValidData) return '';
    const val = moneyMargin?.monthlyNetSavings ?? 0;
    if (val > 0) return '毎月の余剰資金。住宅購入後のローン返済余力の目安になります';
    if (val === 0) return '収支がちょうどトントンの状態。固定費の見直しで余白を作れます';
    return '支出が収入を上回っています。住宅購入前に収支の改善が必要です';
  };

  const getEmergencyContext = (): string => {
    if (!hasValidData) return '';
    const val = moneyMargin?.emergencyFundCoverage ?? 0;
    if (val >= 12) return '十分な備えがあります。想定外の収入減にも対応できます';
    if (val >= 6) return '一般的な安全ラインを確保。余裕を持つなら12ヶ月分が理想です';
    return '目安の6ヶ月分に不足しています。現金比率の見直しを検討してください';
  };

  const getIncomeContext = (): string => {
    if (!hasValidData) return '';
    return '税・社保控除後の手取り総額。ローン返済比率の基準になります';
  };

  const metrics = [
    {
      icon: PiggyBank,
      label: '月々の純貯蓄額',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.monthlyNetSavings)}万円` : '—',
      description: '手取り収入から支出を引いた月々の余剰額',
      context: getSavingsContext(),
      highlight: hasValidData && (moneyMargin?.monthlyNetSavings ?? 0) > 0,
    },
    {
      icon: Shield,
      label: '緊急資金カバー月数',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.emergencyFundCoverage, 1)}ヶ月分` : '—',
      description: '収入が途絶えた場合に現在の貯蓄で生活できる月数。6ヶ月以上が目安',
      context: getEmergencyContext(),
      highlight: hasValidData && (moneyMargin?.emergencyFundCoverage ?? 0) >= 6,
    },
    {
      icon: TrendingUp,
      label: '年間可処分所得',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.annualDisposableIncome)}万円` : '—',
      description: '税・社会保険料控除後の年間手取り総額',
      context: getIncomeContext(),
      highlight: hasValidData,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-2 ${hasValidData ? getHealthBgColor(health) : 'bg-brand-canvas'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5" />
            お金の余白
          </CardTitle>
          <span className={`text-sm font-normal ${hasValidData ? getHealthColor(health) : 'text-brand-bronze'}`}>
            {hasValidData ? getHealthLabel(health) : '未計算'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          月々の収支と緊急資金の状況
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Missing data hint */}
        {missingReason && (
          <div className="mb-4 rounded-lg border border-brand-linen bg-brand-canvas p-2 text-xs text-brand-bronze">
            {missingReason}
          </div>
        )}
        <div className="divide-y divide-border">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-start gap-4 px-4 py-4 first:pt-0"
            >
              <div className={`mt-0.5 rounded-full p-2 ${metric.highlight ? 'bg-safe/10 text-safe' : 'bg-muted text-muted-foreground'}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Info className="h-4 w-4" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72">
                      <p className="text-sm">{metric.description}</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <p className={`text-xl font-bold font-[family-name:var(--font-dm-sans)] tabular-nums ${metric.highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {metric.value}
                </p>
                {metric.context && (
                  <p className="text-xs text-brand-bronze mt-1">
                    {metric.context}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* サマリーメッセージ */}
        <div className={`mt-4 rounded-lg p-4 ${hasValidData ? getHealthBgColor(health) : 'bg-brand-canvas'}`}>
          <p className={`text-sm ${hasValidData ? getHealthColor(health) : 'text-brand-bronze'}`}>
            {!hasValidData && 'シミュレーション実行後に表示されます'}
            {hasValidData && health === 'excellent' && '余裕のある収支バランスです'}
            {hasValidData && health === 'good' && '安定した収支バランスです'}
            {hasValidData && health === 'fair' && '収支の改善余地があります'}
            {hasValidData && health === 'poor' && '収支バランスの見直しが有効です'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
