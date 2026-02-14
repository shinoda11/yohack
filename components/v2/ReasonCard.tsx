'use client';

/**
 * Exit Readiness OS v2 - ReasonCard
 * 結論の根拠となる指標を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Wallet, 
  TrendingUp,
  Shield,
  Info
} from 'lucide-react';
import type { KeyPerformanceIndicators } from '@/lib/v2/worldline';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

interface ReasonCardProps {
  kpis: KeyPerformanceIndicators | null;
  isLoading?: boolean;
}

export function ReasonCard({ kpis, isLoading }: ReasonCardProps) {
  if (isLoading || !kpis) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">2. 理由</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Calendar,
      label: '安心ラインに届く年齢',
      value: kpis.safeFireAge ? `${kpis.safeFireAge}歳` : 'N/A',
      description: '90%の確率で100歳まで余白を維持できる年齢です。',
      progress: kpis.safeFireAge ? Math.max(0, 100 - (kpis.safeFireAge - 40) * 2) : 0,
      color: 'primary',
    },
    {
      icon: Wallet,
      label: '60歳時点の資産額',
      value: `${(kpis.assetsAt60 / 10000).toFixed(2)}億円`,
      description: '60歳時点での予想資産額（中央値）です。',
      progress: Math.min(100, kpis.assetsAt60 / 100),
      color: 'secondary',
    },
    {
      icon: TrendingUp,
      label: '40-50代の年間余裕額',
      value: `${kpis.midlifeSurplus.toLocaleString()}万円`,
      description: '40-50代における毎年の資産増加額（中央値）です。',
      progress: Math.min(100, Math.max(0, kpis.midlifeSurplus / 5)),
      color: 'tertiary',
    },
  ];

  // 統一カラーパレット - グレー系で落ち着いたトーン
  const colorClasses = {
    primary: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      progress: 'bg-gray-600',
    },
    secondary: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      progress: 'bg-gray-500',
    },
    tertiary: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      progress: 'bg-gray-500',
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          2. 理由
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const colors = colorClasses[metric.color as keyof typeof colorClasses];
            return (
              <div
                key={metric.label}
                className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className={cn('rounded-full p-2', colors.bg)}>
                    <metric.icon className={cn('h-4 w-4', colors.text)} />
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72">
                      <p className="text-sm">{metric.description}</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                </div>
                
                <div className="mt-3">
                  <Progress 
                    value={metric.progress} 
                    className="h-1.5" 
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 追加の説明 */}
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            これらの指標は、1,000回のモンテカルロシミュレーションに基づいて計算されています。
            市場の変動を考慮した、統計的に信頼性の高い予測です。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
