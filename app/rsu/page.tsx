'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProfileStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { SectionCard } from '@/components/section-card';
import { SliderInput } from '@/components/slider-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface RSUGrant {
  id: string;
  grantDate: string;
  totalShares: number;
  vestingPeriod: number; // years
  vestingSchedule: 'cliff' | 'monthly' | 'quarterly' | 'annual';
  grantPrice: number; // USD
}

interface VestingEvent {
  date: string;
  shares: number;
  grantId: string;
  value: number;
}

export default function RSUPage() {
  const { profile, updateProfile, runSimulationAsync, isLoading } = useProfileStore();
  const [stockPrice, setStockPrice] = useState(150); // Current stock price
  const [exchangeRate, setExchangeRate] = useState(150); // USD/JPY
  const [grants, setGrants] = useState<RSUGrant[]>([
    {
      id: 'grant-1',
      grantDate: '2023-04-01',
      totalShares: 400,
      vestingPeriod: 4,
      vestingSchedule: 'quarterly',
      grantPrice: 120,
    },
  ]);
  const [newGrant, setNewGrant] = useState<Partial<RSUGrant>>({
    grantDate: new Date().toISOString().split('T')[0],
    totalShares: 100,
    vestingPeriod: 4,
    vestingSchedule: 'quarterly',
    grantPrice: stockPrice,
  });
  
  // 同期状態の追跡
  const [lastSyncedValue, setLastSyncedValue] = useState<number | null>(null);
  const [justSynced, setJustSynced] = useState(false);

  // Calculate vesting schedule
  const calculateVestingEvents = (): VestingEvent[] => {
    const events: VestingEvent[] = [];

    grants.forEach((grant) => {
      const startDate = new Date(grant.grantDate);
      const sharesPerVest =
        grant.vestingSchedule === 'cliff'
          ? grant.totalShares
          : grant.vestingSchedule === 'annual'
          ? grant.totalShares / grant.vestingPeriod
          : grant.vestingSchedule === 'quarterly'
          ? grant.totalShares / (grant.vestingPeriod * 4)
          : grant.totalShares / (grant.vestingPeriod * 12);

      const vestCount =
        grant.vestingSchedule === 'cliff'
          ? 1
          : grant.vestingSchedule === 'annual'
          ? grant.vestingPeriod
          : grant.vestingSchedule === 'quarterly'
          ? grant.vestingPeriod * 4
          : grant.vestingPeriod * 12;

      const monthsPerVest =
        grant.vestingSchedule === 'cliff'
          ? grant.vestingPeriod * 12
          : grant.vestingSchedule === 'annual'
          ? 12
          : grant.vestingSchedule === 'quarterly'
          ? 3
          : 1;

      for (let i = 1; i <= vestCount; i++) {
        const vestDate = new Date(startDate);
        vestDate.setMonth(vestDate.getMonth() + monthsPerVest * i);

        events.push({
          date: vestDate.toISOString().split('T')[0],
          shares: Math.round(sharesPerVest),
          grantId: grant.id,
          value: Math.round(sharesPerVest) * stockPrice,
        });
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const vestingEvents = calculateVestingEvents();

  // Group by year for chart
  const yearlyVesting = vestingEvents.reduce((acc, event) => {
    const year = event.date.slice(0, 4);
    if (!acc[year]) {
      acc[year] = { year, shares: 0, valueUSD: 0, valueJPY: 0 };
    }
    acc[year].shares += event.shares;
    acc[year].valueUSD += event.value;
    acc[year].valueJPY += event.value * exchangeRate;
    return acc;
  }, {} as Record<string, { year: string; shares: number; valueUSD: number; valueJPY: number }>);

  const chartData = Object.values(yearlyVesting);

  // Calculate totals
  const totalUnvestedShares = grants.reduce((sum, g) => sum + g.totalShares, 0);
  const totalUnvestedValueUSD = totalUnvestedShares * stockPrice;
  const totalUnvestedValueJPY = totalUnvestedValueUSD * exchangeRate;

  // Calculate annual RSU income in 万円
  const currentYear = new Date().getFullYear();
  const annualRSU = yearlyVesting[currentYear.toString()]?.valueJPY / 10000 || 0;
  const calculatedRSUValue = Math.round(annualRSU);
  
  // 同期状態の判定
  const isSynced = useMemo(() => {
    return profile.rsuAnnual === calculatedRSUValue;
  }, [profile.rsuAnnual, calculatedRSUValue]);
  
  // 初回マウント時にlastSyncedValueを設定
  useEffect(() => {
    if (lastSyncedValue === null) {
      setLastSyncedValue(profile.rsuAnnual);
    }
  }, [profile.rsuAnnual, lastSyncedValue]);

  // Update profile with calculated RSU
  const syncRSUToProfile = async () => {
    updateProfile({ rsuAnnual: calculatedRSUValue });
    // シミュレーションを明示的に再実行
    await runSimulationAsync();
    setLastSyncedValue(calculatedRSUValue);
    setJustSynced(true);
    // 3秒後にフィードバックを消す
    setTimeout(() => setJustSynced(false), 3000);
  };

  // Add new grant
  const addGrant = () => {
    if (!newGrant.grantDate || !newGrant.totalShares) return;

    const grant: RSUGrant = {
      id: `grant-${Date.now()}`,
      grantDate: newGrant.grantDate,
      totalShares: newGrant.totalShares,
      vestingPeriod: newGrant.vestingPeriod || 4,
      vestingSchedule: newGrant.vestingSchedule || 'quarterly',
      grantPrice: newGrant.grantPrice || stockPrice,
    };

    setGrants([...grants, grant]);
    setNewGrant({
      grantDate: new Date().toISOString().split('T')[0],
      totalShares: 100,
      vestingPeriod: 4,
      vestingSchedule: 'quarterly',
      grantPrice: stockPrice,
    });
  };

  // Remove grant
  const removeGrant = (id: string) => {
    setGrants(grants.filter((g) => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content - responsive margin for sidebar */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">RSU Manager</h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                RSU (制限付き株式ユニット) のベスティングスケジュールと価値を管理
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 同期状態バッジ */}
              {justSynced ? (
                <Badge variant="outline" className="text-[#8A7A62] border-[#C8B89A]/40 bg-[#C8B89A]/10 dark:text-[#C8B89A] dark:border-[#C8B89A]/30 dark:bg-[#C8B89A]/5">
                  <Check className="h-3 w-3 mr-1" />
                  反映完了
                </Badge>
              ) : !isSynced ? (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  未反映
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  同期済み
                </Badge>
              )}
              
              <Button 
                onClick={syncRSUToProfile}
                disabled={isLoading || isSynced}
                className={!isSynced ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                プロファイルに反映
              </Button>
            </div>
          </div>
          
          {/* 反映完了メッセージ */}
          {justSynced && (
            <div className="mb-6 rounded-lg border-2 border-[#C8B89A]/40 bg-[#C8B89A]/10 p-4 dark:border-[#C8B89A]/30 dark:bg-[#C8B89A]/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8B89A]/20 dark:bg-[#C8B89A]/10">
                  <Check className="h-4 w-4 text-[#C8B89A]" />
                </div>
                <div>
                  <p className="font-medium text-[#8A7A62] dark:text-[#C8B89A]">
                    RSU収入をプロファイルに反映しました
                  </p>
                  <p className="text-sm text-[#8A7A62]/80 dark:text-[#C8B89A]/80">
                    ダッシュボードのシミュレーション結果が更新されました
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Settings Panel */}
            <div className="space-y-6">
              <SectionCard title="市場設定" icon={<DollarSign className="h-5 w-5" />}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>現在の株価 (USD)</Label>
                    <Input
                      type="number"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>為替レート (USD/JPY)</Label>
                    <Input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Summary Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">総価値</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ${totalUnvestedValueUSD.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ¥{Math.round(totalUnvestedValueJPY).toLocaleString()} ({totalUnvestedShares.toLocaleString()} shares)
                  </p>
                </CardContent>
              </Card>

              <Card className={!isSynced ? 'border-amber-300 dark:border-amber-700' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{currentYear}年のRSU収入</span>
                    {!isSynced && (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/30">
                        未反映
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{calculatedRSUValue}万円</p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>現在のプロファイル: {profile.rsuAnnual}万円</span>
                    {!isSynced && (
                      <span className={`ml-2 font-medium ${calculatedRSUValue > profile.rsuAnnual ? 'text-[#8A7A62] dark:text-[#C8B89A]' : 'text-muted-foreground'}`}>
                        ({calculatedRSUValue > profile.rsuAnnual ? '+' : ''}{calculatedRSUValue - profile.rsuAnnual}万円)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Vesting Chart */}
              <SectionCard title="年間ベスティング予測" icon={<BarChart3 className="h-5 w-5" />}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`¥${value.toLocaleString()}`]}
                      />
                      <Legend />
                      <Bar
                        dataKey="valueJPY"
                        name="価値 (JPY)"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Grant Management */}
              <SectionCard title="RSUグラント管理" icon={<Calendar className="h-5 w-5" />}>
                {/* Add New Grant Form */}
                <div className="mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-5">
                  <div className="space-y-2">
                    <Label>付与日</Label>
                    <Input
                      type="date"
                      value={newGrant.grantDate}
                      onChange={(e) =>
                        setNewGrant({ ...newGrant, grantDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>株数</Label>
                    <Input
                      type="number"
                      value={newGrant.totalShares}
                      onChange={(e) =>
                        setNewGrant({ ...newGrant, totalShares: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>期間 (年)</Label>
                    <Input
                      type="number"
                      value={newGrant.vestingPeriod}
                      onChange={(e) =>
                        setNewGrant({ ...newGrant, vestingPeriod: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>付与時株価</Label>
                    <Input
                      type="number"
                      value={newGrant.grantPrice}
                      onChange={(e) =>
                        setNewGrant({ ...newGrant, grantPrice: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addGrant} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      追加
                    </Button>
                  </div>
                </div>

                {/* Grants Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>付与日</TableHead>
                      <TableHead className="text-right">株数</TableHead>
                      <TableHead className="text-right">付与価格</TableHead>
                      <TableHead className="text-right">現在価値</TableHead>
                      <TableHead className="text-right">含み益</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grants.map((grant) => {
                      const currentValue = grant.totalShares * stockPrice;
                      const grantValue = grant.totalShares * grant.grantPrice;
                      const gain = currentValue - grantValue;
                      const gainPercent = ((gain / grantValue) * 100).toFixed(1);

                      return (
                        <TableRow key={grant.id}>
                          <TableCell>{grant.grantDate}</TableCell>
                          <TableCell className="text-right">
                            {grant.totalShares.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${grant.grantPrice}
                          </TableCell>
                          <TableCell className="text-right">
                            ${currentValue.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              gain >= 0 ? 'text-gray-700' : 'text-gray-600'
                            }`}
                          >
                            {gain >= 0 ? '+' : ''}
                            {gainPercent}%
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGrant(grant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </SectionCard>

              {/* Upcoming Vesting Events */}
              <SectionCard title="直近のベスティングイベント" icon={<Calendar className="h-5 w-5" />}>
                <div className="space-y-3">
                  {vestingEvents.slice(0, 8).map((event, index) => {
                    const isPast = new Date(event.date) < new Date();
                    return (
                      <div
                        key={`${event.grantId}-${index}`}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          isPast ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              isPast ? 'bg-[#C8B89A]/10' : 'bg-[#5A5550]/10'
                            }`}
                          >
                            <Calendar className={`h-5 w-5 ${isPast ? 'text-[#C8B89A]' : 'text-[#5A5550] dark:text-[#DDD0B8]'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{event.date}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.shares.toLocaleString()} shares
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${event.value.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ¥{Math.round(event.value * exchangeRate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
