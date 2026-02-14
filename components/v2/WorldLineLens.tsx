'use client';

/**
 * Exit Readiness OS v2 - WorldLineLens
 * 2つの世界線を比較表示
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  GitCompare, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2
} from 'lucide-react';
import type { WorldLine, WorldLineComparisonDetailed } from '@/lib/v2/worldline';
import { cn } from '@/lib/utils';

interface WorldLineLensProps {
  worldLines: WorldLine[];
  activeWorldLineId: string | null;
  comparisonWorldLineId: string | null;
  comparison: WorldLineComparisonDetailed | null;
  onSelectActive: (id: string) => void;
  onSelectComparison: (id: string | null) => void;
}

// Safe display helpers - NaN/undefined guards
const safeNumber = (value: number | null | undefined, fallback: number = 0): number => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
};

const safeDisplay = (value: number | null | undefined, decimals: number = 0, suffix: string = ''): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '—';
  }
  return `${value.toFixed(decimals)}${suffix}`;
};

const safeDisplayInt = (value: number | null | undefined, suffix: string = ''): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '—';
  }
  return `${Math.round(value).toLocaleString()}${suffix}`;
};

// Check what's missing for display
const getMissingReason = (worldLine: WorldLine | undefined): string | null => {
  if (!worldLine) return 'プランを選択してください';
  if (!worldLine.result) return 'シナリオデータが未生成です';
  if (worldLine.result.error) return `エラー: ${worldLine.result.error}`;
  if (!worldLine.result.kpis) return 'KPIが計算されていません';
  return null;
};

export function WorldLineLens({
  worldLines,
  activeWorldLineId,
  comparisonWorldLineId,
  comparison,
  onSelectActive,
  onSelectComparison,
}: WorldLineLensProps) {
  const activeWorldLine = worldLines.find(w => w.id === activeWorldLineId);
  const comparisonWorldLine = worldLines.find(w => w.id === comparisonWorldLineId);
  
  // Get missing reasons for display hints
  const activeMissing = getMissingReason(activeWorldLine);
  const comparisonMissing = getMissingReason(comparisonWorldLine);

  // 差分の表示ヘルパー - 統一カラーパレット（落ち着いたトーン）
  const renderDiff = (value: number | null, unit: string, isInverted: boolean = false) => {
    if (value === null || value === 0) {
      return <span className="text-muted-foreground"><Minus className="inline h-4 w-4" /></span>;
    }
    
    const isPositive = isInverted ? value < 0 : value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    // 落ち着いたグレー系で統一し、アイコンで方向性を示す
    const colorClass = isPositive ? 'text-gray-700 font-medium' : 'text-gray-600';
    
    return (
      <span className={cn('flex items-center gap-1', colorClass)}>
        <Icon className="h-4 w-4" />
        {value > 0 ? '+' : ''}{value.toLocaleString()}{unit}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="h-5 w-5" />
          世界線比較
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          異なるプラン（世界線）を選んで、目標達成年齢・生存率・資産額などを並べて比較します
        </p>
      </CardHeader>
      <CardContent>
        {/* 世界線セレクター */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">比較元</label>
            <Select value={activeWorldLineId ?? ''} onValueChange={onSelectActive}>
              <SelectTrigger>
                <SelectValue placeholder="世界線を選択" />
              </SelectTrigger>
              <SelectContent>
                {worldLines.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                    {w.isBaseline && <Badge variant="outline" className="ml-2">ベースライン</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">比較先</label>
            <Select 
              value={comparisonWorldLineId ?? 'none'} 
              onValueChange={(v) => onSelectComparison(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="比較する世界線を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">選択なし</SelectItem>
                {worldLines
                  .filter(w => w.id !== activeWorldLineId)
                  .map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* 比較テーブル */}
        {activeWorldLine && comparisonWorldLine ? (
          // 両方の世界線が選択されている - 常に値を表示（未計算は「—」）
          <>
            {/* Missing data hints */}
            {(activeMissing || comparisonMissing) && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                {activeMissing && (
                  <p className="text-gray-600 dark:text-gray-400">
                    比較元: {activeMissing}
                  </p>
                )}
                {comparisonMissing && (
                  <p className="text-gray-600 dark:text-gray-400">
                    比較先: {comparisonMissing}
                  </p>
                )}
              </div>
            )}
            
            {/* Recommendation banner - only show when comparison is available */}
            {comparison && comparison.recommendation !== 'neutral' && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">{comparison.recommendationReason}</p>
              </div>
            )}
              
            {/* Visual Comparison Chart */}
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium">主要指標の比較</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: '目標達成年齢',
                        [activeWorldLine.name]: safeNumber(activeWorldLine.result.kpis?.safeFireAge, 0),
                        [comparisonWorldLine.name]: safeNumber(comparisonWorldLine.result.kpis?.safeFireAge, 0),
                        unit: '歳',
                        lowerIsBetter: true,
                      },
                      {
                        name: '生存率',
                        [activeWorldLine.name]: safeNumber(activeWorldLine.result.kpis?.survivalRate, 0),
                        [comparisonWorldLine.name]: safeNumber(comparisonWorldLine.result.kpis?.survivalRate, 0),
                        unit: '%',
                        lowerIsBetter: false,
                      },
                      {
                        name: '60歳時資産',
                        [activeWorldLine.name]: safeNumber(activeWorldLine.result.kpis?.assetsAt60, 0) / 100,
                        [comparisonWorldLine.name]: safeNumber(comparisonWorldLine.result.kpis?.assetsAt60, 0) / 100,
                        unit: '百万円',
                        lowerIsBetter: false,
                      },
                      {
                        name: '月次貯蓄',
                        [activeWorldLine.name]: safeNumber(activeWorldLine.result.margin?.money.monthlyNetSavings, 0),
                        [comparisonWorldLine.name]: safeNumber(comparisonWorldLine.result.margin?.money.monthlyNetSavings, 0),
                        unit: '万円',
                        lowerIsBetter: false,
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()}`,
                        name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey={activeWorldLine.name} fill="#6b7280" radius={[0, 4, 4, 0]} />
                    <Bar dataKey={comparisonWorldLine.name} fill="#9ca3af" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                濃いグレー: {activeWorldLine.name} / 薄いグレー: {comparisonWorldLine.name}
              </p>
            </div>
              
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">指標</TableHead>
                  <TableHead>{activeWorldLine.name}</TableHead>
                  <TableHead>{comparisonWorldLine.name}</TableHead>
                  <TableHead>差分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">安心ライン到達年齢</TableCell>
                  <TableCell>
                    {safeDisplay(activeWorldLine.result.kpis?.safeFireAge, 0, '歳')}
                  </TableCell>
                  <TableCell>
                    {safeDisplay(comparisonWorldLine.result.kpis?.safeFireAge, 0, '歳')}
                  </TableCell>
                  <TableCell>
                    {comparison ? renderDiff(comparison.differences.safeFireAge, '歳', true) : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">60歳時点の資産</TableCell>
                  <TableCell>
                    {safeDisplay(safeNumber(activeWorldLine.result.kpis?.assetsAt60, 0) / 10000, 2, '億円')}
                  </TableCell>
                  <TableCell>
                    {safeDisplay(safeNumber(comparisonWorldLine.result.kpis?.assetsAt60, 0) / 10000, 2, '億円')}
                  </TableCell>
                  <TableCell>
                    {comparison ? renderDiff(comparison.differences.assetsAt60, '万円') : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">生存率</TableCell>
                  <TableCell>
                    {safeDisplay(activeWorldLine.result.kpis?.survivalRate, 0, '%')}
                  </TableCell>
                  <TableCell>
                    {safeDisplay(comparisonWorldLine.result.kpis?.survivalRate, 0, '%')}
                  </TableCell>
                  <TableCell>
                    {comparison ? renderDiff(comparison.differences.survivalRate, '%') : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">月次純貯蓄</TableCell>
                  <TableCell>
                    {safeDisplayInt(activeWorldLine.result.margin?.money.monthlyNetSavings, '万円')}
                  </TableCell>
                  <TableCell>
                    {safeDisplayInt(comparisonWorldLine.result.margin?.money.monthlyNetSavings, '万円')}
                  </TableCell>
                  <TableCell>
                    {comparison ? renderDiff(comparison.differences.monthlyNetSavings, '万円') : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">緊急資金カバー</TableCell>
                  <TableCell>
                    {safeDisplay(activeWorldLine.result.margin?.money.emergencyFundCoverage, 1, 'ヶ月')}
                  </TableCell>
                  <TableCell>
                    {safeDisplay(comparisonWorldLine.result.margin?.money.emergencyFundCoverage, 1, 'ヶ月')}
                  </TableCell>
                  <TableCell>
                    {comparison ? renderDiff(comparison.differences.emergencyFundCoverage, 'ヶ月') : '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        ) : activeWorldLine ? (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <p className="text-muted-foreground">
              比較する世界線を「比較先」から選択してください。
            </p>
            <p className="text-xs text-muted-foreground">
              選択すると、目標達成年齢・生存率・資産額などの指標を横棒グラフとテーブルで比較できます。
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <p className="text-muted-foreground">
              まず「比較元」から世界線を選択してください。
            </p>
            <p className="text-xs text-muted-foreground">
              上の「世界線の追加」から新しいプランを作成することもできます。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
