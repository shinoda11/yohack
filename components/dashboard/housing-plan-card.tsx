'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, Plus, Trash2, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { SliderInput } from '@/components/slider-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/types';
import type { Profile } from '@/lib/types';
import { computeMonthlyPaymentManYen } from '@/lib/housing-sim';
import { isPro } from '@/lib/plan';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// --- 色定数 ---
const RENT_COLOR = '#2563EB';
const PLAN_COLORS = ['#C8B89A', '#16A34A', '#9333EA'] as const;
const PLAN_LETTERS = ['A', 'B', 'C'] as const;

// --- 型定義 ---
interface HousingPlan {
  id: string;
  name: string;
  price: number;
  downPayment: number;
  rate: number;
  years: number;
  maintenanceCost: number;
  purchaseCostRate: number;
}

interface ProjectionPoint {
  age: number;
  rent: number;
  [key: string]: number;
}

interface PlanSummary {
  id: string;
  name: string;
  price: number;
  assetsAt40: number;
  assetsAt60: number;
  monthlyPayment: number;
  totalPayment: number;
}

function createDefaultPlan(index: number): HousingPlan {
  return {
    id: `plan-${Date.now()}-${index}`,
    name: `プラン${PLAN_LETTERS[index]}`,
    price: 6000 + index * 2000,
    downPayment: 1000,
    rate: 0.5,
    years: 35,
    maintenanceCost: 30,
    purchaseCostRate: 5,
  };
}

// --- コンポーネント ---
interface HousingPlanCardProps {
  profile: Profile;
}

export function HousingPlanCard({ profile }: HousingPlanCardProps) {
  const [rentAnnual, setRentAnnual] = useState(profile.housingCostAnnual);
  const [plans, setPlans] = useState<HousingPlan[]>([createDefaultPlan(0)]);
  const [showProDialog, setShowProDialog] = useState(false);

  // プロファイルの家賃変更を同期
  useEffect(() => {
    setRentAnnual(profile.housingCostAnnual);
  }, [profile.housingCostAnnual]);

  // --- プラン操作 ---
  const addPlan = () => {
    if (plans.length >= 3) return;
    if (!isPro()) {
      setShowProDialog(true);
      return;
    }
    setPlans(prev => [...prev, createDefaultPlan(prev.length)]);
  };

  const removePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updatePlan = (id: string, updates: Partial<HousingPlan>) => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  // --- 決定論的資産予測 ---
  const projectionData = useMemo(() => {
    const maxAge = 100;
    const realReturn = (profile.expectedReturn - profile.inflationRate) / 100;
    const initialAssets =
      profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;

    function netIncome(age: number): number {
      if (age >= profile.targetRetireAge) {
        const pension = age >= 65 ? 200 : 0;
        return pension + profile.retirePassiveIncome;
      }
      let total =
        profile.grossIncome + profile.rsuAnnual + profile.sideIncomeNet;
      if (profile.mode === 'couple') {
        total += profile.partnerGrossIncome + profile.partnerRsuAnnual;
      }
      return total * (1 - profile.effectiveTaxRate / 100);
    }

    function baseExpenses(age: number): number {
      let expenses = profile.livingCostAnnual;
      for (const event of profile.lifeEvents) {
        if (age >= event.age) {
          const endAge = event.duration ? event.age + event.duration : maxAge + 1;
          if (age < endAge) {
            if (event.type === 'expense_increase') expenses += event.amount;
            else if (event.type === 'expense_decrease') expenses -= event.amount;
          }
        }
      }
      if (age >= profile.targetRetireAge) {
        expenses *= profile.retireSpendingMultiplier;
      }
      return Math.max(0, expenses);
    }

    // 月々返済額を事前計算
    const planPayments = plans.map(plan =>
      computeMonthlyPaymentManYen(plan.price - plan.downPayment, plan.rate, plan.years)
    );

    // 資産トラッキング
    let rentAssets = initialAssets;
    const planAssets: number[] = plans.map(plan => {
      const purchaseCosts = plan.price * (plan.purchaseCostRate / 100);
      return initialAssets - plan.downPayment - purchaseCosts;
    });

    const data: ProjectionPoint[] = [];

    for (let age = profile.currentAge; age <= maxAge; age++) {
      const point: ProjectionPoint = { age, rent: Math.round(rentAssets) };
      plans.forEach((plan, i) => {
        point[plan.id] = Math.round(planAssets[i]);
      });
      data.push(point);

      const income = netIncome(age);
      const expenses = baseExpenses(age);

      // 賃貸シナリオ
      const rentNet = income - expenses - rentAnnual;
      rentAssets = rentAssets + rentNet + rentAssets * realReturn;

      // 各購入プラン
      plans.forEach((plan, i) => {
        const yearsSincePurchase = age - profile.currentAge;
        const housingCost =
          yearsSincePurchase < plan.years
            ? planPayments[i] * 12 + plan.maintenanceCost
            : plan.maintenanceCost;
        const planNet = income - expenses - housingCost;
        planAssets[i] = planAssets[i] + planNet + planAssets[i] * realReturn;
      });
    }

    return data;
  }, [profile, rentAnnual, plans]);

  // --- サマリー指標 ---
  const summaries = useMemo((): PlanSummary[] => {
    const result: PlanSummary[] = [];
    const yearsToLive = 100 - profile.currentAge;

    // 賃貸
    const rentAt40 = projectionData.find(p => p.age === 40)?.rent ?? 0;
    const rentAt60 = projectionData.find(p => p.age === 60)?.rent ?? 0;
    result.push({
      id: 'rent',
      name: '賃貸継続',
      price: 0,
      assetsAt40: rentAt40,
      assetsAt60: rentAt60,
      monthlyPayment: rentAnnual / 12,
      totalPayment: rentAnnual * yearsToLive,
    });

    // 各プラン
    for (const plan of plans) {
      const mp = computeMonthlyPaymentManYen(
        plan.price - plan.downPayment,
        plan.rate,
        plan.years
      );
      const purchaseCosts = plan.price * (plan.purchaseCostRate / 100);
      const totalMortgage = mp * 12 * plan.years;
      const totalMaint = plan.maintenanceCost * yearsToLive;
      const totalPayment = plan.downPayment + purchaseCosts + totalMortgage + totalMaint;

      const at40 = (projectionData.find(p => p.age === 40)?.[plan.id] as number) ?? 0;
      const at60 = (projectionData.find(p => p.age === 60)?.[plan.id] as number) ?? 0;

      result.push({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        assetsAt40: at40,
        assetsAt60: at60,
        monthlyPayment: mp + plan.maintenanceCost / 12,
        totalPayment,
      });
    }

    return result;
  }, [projectionData, plans, rentAnnual, profile.currentAge]);

  // 最有利プラン（60歳時点資産が最大）
  const bestPlanId = useMemo(
    () => summaries.reduce((best, s) => (s.assetsAt60 > best.assetsAt60 ? s : best)).id,
    [summaries]
  );

  // 結論テキスト
  const conclusionText = useMemo(() => {
    const best = summaries.find(s => s.id === bestPlanId);
    const rentSummary = summaries.find(s => s.id === 'rent');
    if (!best || !rentSummary) return '';

    if (bestPlanId === 'rent') {
      const worst = summaries.filter(s => s.id !== 'rent').sort((a, b) => b.assetsAt60 - a.assetsAt60)[0];
      if (worst) {
        const diff = best.assetsAt60 - worst.assetsAt60;
        return `60歳時点では賃貸継続が${worst.name}より${formatCurrency(Math.round(Math.abs(diff)))}有利です`;
      }
      return `60歳時点では賃貸継続が最も有利です`;
    }

    const diff = best.assetsAt60 - rentSummary.assetsAt60;
    return `60歳時点では${best.name}（${formatCurrency(best.price)}）が賃貸より${formatCurrency(Math.round(Math.abs(diff)))}有利です`;
  }, [summaries, bestPlanId]);

  return (
    <SectionCard
      icon={<Home className="h-5 w-5" />}
      title="住宅プラン"
      description="賃貸継続と購入プランの資産比較"
    >
      <div className="space-y-6">
        {/* 年間家賃 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: RENT_COLOR }}
            />
            <Label className="text-sm font-medium">賃貸継続</Label>
          </div>
          <SliderInput
            label="年間家賃"
            value={rentAnnual}
            onChange={setRentAnnual}
            min={36}
            max={600}
            step={12}
            unit="万円"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            月額 {(rentAnnual / 12).toFixed(1)}万円
          </p>
        </div>

        {/* 購入プラン入力 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">購入プラン</Label>
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className="rounded-lg bg-muted/30 p-4 space-y-3"
            >
              {/* プランヘッダー */}
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAN_COLORS[index] }}
                />
                <Input
                  value={plan.name}
                  onChange={e => updatePlan(plan.id, { name: e.target.value })}
                  className="h-7 text-sm font-medium bg-transparent border-none px-1 focus-visible:ring-1 max-w-[120px]"
                  maxLength={20}
                />
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => removePlan(plan.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* スライダー */}
              <SliderInput
                label="物件価格"
                value={plan.price}
                onChange={v => updatePlan(plan.id, { price: v })}
                min={2000}
                max={20000}
                step={100}
                unit="万円"
              />
              <SliderInput
                label="頭金"
                value={plan.downPayment}
                onChange={v => updatePlan(plan.id, { downPayment: v })}
                min={0}
                max={plan.price}
                step={100}
                unit="万円"
              />
              <div className="grid grid-cols-2 gap-3">
                <SliderInput
                  label="金利"
                  value={plan.rate}
                  onChange={v => updatePlan(plan.id, { rate: v })}
                  min={0}
                  max={5}
                  step={0.1}
                  unit="%"
                />
                <SliderInput
                  label="ローン年数"
                  value={plan.years}
                  onChange={v => updatePlan(plan.id, { years: v })}
                  min={5}
                  max={50}
                  step={1}
                  unit="年"
                />
              </div>

              {/* 月々返済表示 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground rounded bg-background/50 px-2 py-1.5">
                <span>月々返済</span>
                <span className="font-medium text-foreground">
                  {computeMonthlyPaymentManYen(
                    plan.price - plan.downPayment,
                    plan.rate,
                    plan.years
                  ).toFixed(2)}
                  万円
                </span>
              </div>
            </div>
          ))}

          {plans.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-[#C8B89A] border-[#C8B89A]/30 hover:bg-[#C8B89A]/10"
              onClick={addPlan}
            >
              <Plus className="h-3.5 w-3.5" />
              プランを追加
            </Button>
          )}
        </div>

        {/* グラフ */}
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={projectionData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 10 }}
                tickFormatter={v => `${v}歳`}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={v =>
                  Math.abs(v) >= 10000
                    ? `${(v / 10000).toFixed(1)}億`
                    : `${v}万`
                }
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs">
                      <p className="font-medium mb-1.5">{label}歳時点</p>
                      <div className="space-y-1">
                        {payload.map((entry: any) => (
                          <div
                            key={entry.dataKey}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span>{entry.name}</span>
                            </div>
                            <span className="tabular-nums font-medium">
                              {formatCurrency(Math.round(entry.value as number))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={60}
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={{
                  value: '60歳',
                  position: 'top',
                  fill: '#9ca3af',
                  fontSize: 10,
                }}
              />
              {/* 賃貸ライン（破線） */}
              <Line
                type="monotone"
                dataKey="rent"
                name="賃貸継続"
                stroke={RENT_COLOR}
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
              />
              {/* 各プランライン */}
              {plans.map((plan, i) => (
                <Line
                  key={plan.id}
                  type="monotone"
                  dataKey={plan.id}
                  name={`${plan.name}（${formatCurrency(plan.price)}）`}
                  stroke={PLAN_COLORS[i]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 結論テキスト */}
        <p className="text-sm font-medium text-center">{conclusionText}</p>

        {/* 比較テーブル */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[28%]">プラン</TableHead>
                <TableHead className="text-right">
                  {profile.currentAge < 40 ? '40歳資産' : '現在資産'}
                </TableHead>
                <TableHead className="text-right">60歳資産</TableHead>
                <TableHead className="text-right">月額負担</TableHead>
                <TableHead className="text-right">総支払額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(s => (
                <TableRow
                  key={s.id}
                  className={cn(s.id === bestPlanId && 'bg-[#C8B89A]/10')}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Math.round(s.assetsAt40))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Math.round(s.assetsAt60))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.monthlyPayment.toFixed(1)}万円
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Math.round(s.totalPayment))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 注記 */}
        <p className="text-xs text-muted-foreground">
          ※ 期待リターン{profile.expectedReturn}%・インフレ{profile.inflationRate}%の決定論的予測です。
          実際の投資リターンは変動するため、目安としてご利用ください。
        </p>
      </div>

      {/* Pro ゲートダイアログ */}
      <Dialog open={showProDialog} onOpenChange={setShowProDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <Sparkles className="h-10 w-10 text-[#C8B89A]" />
            </div>
            <DialogTitle>複数プラン比較は Pro 機能です</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            最大3つの購入プランを同時に比較して、最適な住宅選択を見つけましょう。
          </p>
          <Link href="/pricing">
            <Button className="w-full bg-[#C8B89A] text-[#1A1916] hover:bg-[#C8B89A]/90">
              Pro を始める
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            月額 ¥2,980 から
          </p>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
