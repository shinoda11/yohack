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
      ? 'プロファイルデータが不足しています' 
      : (isNaN(moneyMargin.monthlyNetSavings) || !isFinite(moneyMargin.monthlyNetSavings))
        ? 'ダッシュボードでシミュレーション結果を確認してください' 
        : null;

  const metrics = [
    {
      icon: PiggyBank,
      label: '月々の純貯蓄額',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.monthlyNetSavings)}万円` : '—',
      description: '手取り収入から月々の支出を引いた、貯蓄に回せるお金です。',
      highlight: hasValidData && (moneyMargin?.monthlyNetSavings ?? 0) > 0,
    },
    {
      icon: Shield,
      label: '緊急資金カバー月数',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.emergencyFundCoverage, 1)}ヶ月分` : '—',
      description: '現在の貯蓄で、収入が途絶えても何ヶ月間生活できるかを示します。6ヶ月以上が理想です。',
      highlight: hasValidData && (moneyMargin?.emergencyFundCoverage ?? 0) >= 6,
    },
    {
      icon: TrendingUp,
      label: '年間可処分所得',
      value: hasValidData ? `${safeDisplayNumber(moneyMargin?.annualDisposableIncome)}万円` : '—',
      description: '税金や社会保険料を引いた後の、1年間で自由に使えるお金の総額です。',
      highlight: hasValidData,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-2 ${hasValidData ? getHealthBgColor(health) : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5" />
            お金の余白
          </CardTitle>
          <span className={`text-sm font-medium ${hasValidData ? getHealthColor(health) : 'text-gray-500'}`}>
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
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
            {missingReason}
          </div>
        )}
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className={`rounded-full p-2 ${metric.highlight ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3 w-3" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72">
                      <p className="text-sm">{metric.description}</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <p className={`text-xl font-bold ${metric.highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {metric.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* サマリーメッセージ */}
        <div className={`mt-4 rounded-lg p-3 ${hasValidData ? getHealthBgColor(health) : 'bg-gray-50'}`}>
          <p className={`text-sm ${hasValidData ? getHealthColor(health) : 'text-gray-500'}`}>
            {!hasValidData && 'ダッシュボードでシミュレーションを実行すると、お金の余白が計算されます。'}
            {hasValidData && health === 'excellent' && '素晴らしい状態です。このペースで資産形成を続けましょう。'}
            {hasValidData && health === 'good' && '良好な状態です。さらなる改善の余地があります。'}
            {hasValidData && health === 'fair' && '改善の余地があります。支出の見直しを検討しましょう。'}
            {hasValidData && health === 'poor' && '注意が必要です。収支のバランスを見直しましょう。'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
