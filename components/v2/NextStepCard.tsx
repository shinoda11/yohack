'use client';

/**
 * Exit Readiness OS v2 - NextStepCard
 * 次の一手を提示するカード
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { StrategyLever, StrategyLeverType } from '@/lib/v2/strategy';
import { cn } from '@/lib/utils';

interface NextStepCardProps {
  levers: StrategyLever[];
  isLoading?: boolean;
  onApplyStrategy?: (lever: StrategyLever) => void;
}

// 統一カラーパレット - グレー系で落ち着いたトーン
const leverTypeConfig: Record<StrategyLeverType, {
  icon: typeof TrendingUp;
  label: string;
  color: string;
  bgColor: string;
}> = {
  income: {
    icon: TrendingUp,
    label: '収入',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  cost: {
    icon: TrendingDown,
    label: '支出',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  timing: {
    icon: Clock,
    label: 'タイミング',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: '簡単', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '普通', color: 'bg-gray-200 text-gray-700' },
  hard: { label: '難しい', color: 'bg-gray-300 text-gray-800' },
};

export function NextStepCard({ levers, isLoading, onApplyStrategy }: NextStepCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">3. 次の一手</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // 上位3つの戦略を表示
  const topLevers = levers.slice(0, 5);
  
  // レバータイプでグループ化
  const groupedLevers = topLevers.reduce((acc, lever) => {
    if (!acc[lever.type]) acc[lever.type] = [];
    acc[lever.type].push(lever);
    return acc;
  }, {} as Record<StrategyLeverType, StrategyLever[]>);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5" />
          3. 次の一手
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topLevers.length === 0 ? (
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              分析結果がありません。シミュレーションを実行してください。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* トップ推奨 */}
            {topLevers[0] && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">最も効果的</span>
                      <Badge variant="outline" className={difficultyConfig[topLevers[0].difficulty].color}>
                        {difficultyConfig[topLevers[0].difficulty].label}
                      </Badge>
                    </div>
                    <h4 className="mt-1 font-semibold">{topLevers[0].title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {topLevers[0].description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-gray-800">
                        安心ライン {topLevers[0].impact.fireAgeChange > 0 ? '+' : ''}{topLevers[0].impact.fireAgeChange}年
                      </span>
                      <span className="font-medium text-gray-700">
                        生存率 +{topLevers[0].impact.survivalRateChange.toFixed(0)}%
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 bg-transparent"
                      onClick={() => onApplyStrategy?.(topLevers[0])}
                    >
                      試してみる
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* その他の戦略 */}
            {topLevers.slice(1).map((lever) => {
              const config = leverTypeConfig[lever.type];
              return (
                <div
                  key={lever.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-full p-2', config.bgColor)}>
                      <config.icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-medium', config.color)}>
                          {config.label}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', difficultyConfig[lever.difficulty].color)}>
                          {difficultyConfig[lever.difficulty].label}
                        </Badge>
                      </div>
                      <p className="font-medium">{lever.title}</p>
                      <p className="text-xs text-muted-foreground">
                        安心ライン {lever.impact.fireAgeChange > 0 ? '+' : ''}{lever.impact.fireAgeChange}年
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onApplyStrategy?.(lever)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
