'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProfileStore } from '@/lib/store';
import { SectionCard } from '@/components/section-card';
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
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
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
  vestingPeriod: number;
  vestingSchedule: 'cliff' | 'monthly' | 'quarterly' | 'annual';
  grantPrice: number;
}

interface VestingEvent {
  date: string;
  shares: number;
  grantId: string;
  value: number;
}

export function RSUContent() {
  const { profile, updateProfile, runSimulationAsync, isLoading } = useProfileStore();
  const [stockPrice, setStockPrice] = useState(150);
  const [exchangeRate, setExchangeRate] = useState(150);
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

  const [lastSyncedValue, setLastSyncedValue] = useState<number | null>(null);
  const [justSynced, setJustSynced] = useState(false);

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

  const totalUnvestedShares = grants.reduce((sum, g) => sum + g.totalShares, 0);
  const totalUnvestedValueUSD = totalUnvestedShares * stockPrice;
  const totalUnvestedValueJPY = totalUnvestedValueUSD * exchangeRate;

  const currentYear = new Date().getFullYear();
  const annualRSU = yearlyVesting[currentYear.toString()]?.valueJPY / 10000 || 0;
  const calculatedRSUValue = Math.round(annualRSU);

  const isSynced = useMemo(() => {
    return profile.rsuAnnual === calculatedRSUValue;
  }, [profile.rsuAnnual, calculatedRSUValue]);

  useEffect(() => {
    if (lastSyncedValue === null) {
      setLastSyncedValue(profile.rsuAnnual);
    }
  }, [profile.rsuAnnual, lastSyncedValue]);

  const syncRSUToProfile = async () => {
    updateProfile({ rsuAnnual: calculatedRSUValue });
    await runSimulationAsync();
    setLastSyncedValue(calculatedRSUValue);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 3000);
  };

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

  const removeGrant = (id: string) => {
    setGrants(grants.filter((g) => g.id !== id));
  };

  return (
    <>
      {/* Header actions */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">RSU・株式報酬</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            RSU (制限付き株式ユニット) のベスティングスケジュールと価値を管理
          </p>
        </div>
        <div className="flex items-center gap-3">
          {justSynced ? (
            <Badge variant="outline" className="text-brand-bronze border-brand-gold/40 bg-brand-gold/10 dark:border-brand-gold/30 dark:bg-brand-gold/5">
              <Check className="h-3 w-3 mr-1" />
              反映完了
            </Badge>
          ) : !isSynced ? (
            <Badge variant="outline" className="text-brand-bronze border-brand-gold/30 bg-brand-gold/10 dark:text-brand-gold dark:border-brand-gold/30 dark:bg-brand-gold/10">
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
            className=""
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
        <div className="mb-6 rounded-lg border-2 border-brand-gold/40 bg-brand-gold/10 p-4 dark:border-brand-gold/30 dark:bg-brand-gold/5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 dark:bg-brand-gold/10">
              <Check className="h-4 w-4 text-brand-gold" />
            </div>
            <div>
              <p className="font-normal text-brand-bronze">
                RSU収入をプロファイルに反映しました
              </p>
              <p className="text-sm text-brand-bronze/80">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">総価値</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${totalUnvestedValueUSD.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                ¥{Math.round(totalUnvestedValueJPY).toLocaleString()} ({totalUnvestedShares.toLocaleString()}株)
              </p>
            </CardContent>
          </Card>

          <Card className={!isSynced ? 'border-brand-gold/30 dark:border-brand-gold/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal flex items-center justify-between">
                <span>{currentYear}年のRSU収入</span>
                {!isSynced && (
                  <Badge variant="outline" className="text-xs text-brand-bronze border-brand-gold/30 bg-brand-gold/10 dark:text-brand-gold dark:border-brand-gold/30 dark:bg-brand-gold/10">
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
                  <span className={`ml-2 font-normal ${calculatedRSUValue > profile.rsuAnnual ? 'text-brand-bronze' : 'text-muted-foreground'}`}>
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
            <div className="h-64 overflow-x-hidden">
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
                    fill="var(--brand-gold)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Grant Management */}
          <SectionCard title="RSUグラント管理" icon={<Calendar className="h-5 w-5" />}>
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
                        className={`text-right font-normal ${
                          gain >= 0 ? 'text-brand-stone' : 'text-brand-bronze'
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
                          isPast ? 'bg-brand-gold/10' : 'bg-brand-stone/10'
                        }`}
                      >
                        <Calendar className={`h-5 w-5 ${isPast ? 'text-brand-gold' : 'text-brand-stone'}`} />
                      </div>
                      <div>
                        <p className="font-normal">{event.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.shares.toLocaleString()}株
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-normal">
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
    </>
  );
}
