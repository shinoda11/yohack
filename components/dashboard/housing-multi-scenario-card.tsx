'use client';

import { useState, useMemo } from 'react';
import { Home, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { SliderInput } from '@/components/slider-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// 固定凡例色: 青=賃貸継続、グレー=購入
const RENT_COLOR = '#3b82f6';
const BUY_COLOR = '#6b7280';

interface HousingMultiScenarioCardProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export function HousingMultiScenarioCard({
  profile,
  onUpdate,
}: HousingMultiScenarioCardProps) {
  // Rent設定
  const [rentAnnualCost, setRentAnnualCost] = useState(profile.housingCostAnnual);
  
  // Buy設定
  const [buyConfig, setBuyConfig] = useState({
    propertyPrice: 6000,
    downPayment: 1000,
    mortgageYears: 35,
    interestRate: 1.0,
    ownerAnnualCost: 30,
  });
  
  const [showCumulative, setShowCumulative] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const updateBuyConfig = (updates: Partial<typeof buyConfig>) => {
    setBuyConfig(prev => ({ ...prev, ...updates }));
  };

  // チャートデータ計算
  const chartData = useMemo(() => {
    const data: any[] = [];
    const years = 50;
    
    const { propertyPrice, downPayment, mortgageYears, interestRate, ownerAnnualCost } = buyConfig;
    const loanPrincipal = propertyPrice - downPayment;
    const monthlyPayment = computeMonthlyPaymentManYen(loanPrincipal, interestRate, mortgageYears);
    const mortgageAnnual = monthlyPayment * 12 + ownerAnnualCost;
    const purchaseCosts = downPayment + propertyPrice * 0.05;
    
    for (let year = 0; year <= years; year++) {
      const age = profile.currentAge + year;
      
      // Rent累積
      const rentCumulative = rentAnnualCost * (year + 1);
      
      // Buy累積
      let buyCumulative = purchaseCosts;
      for (let y = 0; y <= year; y++) {
        if (y < mortgageYears) {
          buyCumulative += mortgageAnnual;
        } else {
          buyCumulative += ownerAnnualCost;
        }
      }
      
      // Buy年間
      const buyAnnual = year < mortgageYears ? mortgageAnnual : ownerAnnualCost;
      
      data.push({
        year,
        age,
        rent_annual: rentAnnualCost,
        rent_cumulative: rentCumulative,
        buy_annual: buyAnnual,
        buy_cumulative: buyCumulative,
      });
    }
    
    return data;
  }, [rentAnnualCost, buyConfig, profile.currentAge]);

  // 3指標の計算
  const metrics = useMemo(() => {
    const { propertyPrice, downPayment, mortgageYears, interestRate, ownerAnnualCost } = buyConfig;
    const loanPrincipal = propertyPrice - downPayment;
    const monthlyPayment = computeMonthlyPaymentManYen(loanPrincipal, interestRate, mortgageYears);
    const mortgageAnnual = monthlyPayment * 12 + ownerAnnualCost;
    
    // 60歳時点のデータ
    const ageAt60 = 60 - profile.currentAge;
    const data60 = chartData[ageAt60] || chartData[chartData.length - 1];
    
    // 40-50代の平均月次CF余裕（住宅費の差）
    let rentTotal4050 = 0;
    let buyTotal4050 = 0;
    let count4050 = 0;
    
    for (let age = 40; age <= 59; age++) {
      const yearIndex = age - profile.currentAge;
      if (yearIndex >= 0 && yearIndex < chartData.length) {
        rentTotal4050 += chartData[yearIndex].rent_annual;
        buyTotal4050 += chartData[yearIndex].buy_annual;
        count4050++;
      }
    }
    
    const rentAvgMonthly4050 = count4050 > 0 ? (rentTotal4050 / count4050) / 12 : 0;
    const buyAvgMonthly4050 = count4050 > 0 ? (buyTotal4050 / count4050) / 12 : 0;
    
    // Exit目安年齢（簡易計算: 累積支出が逆転する年齢）
    let crossoverAge = null;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].buy_cumulative < chartData[i].rent_cumulative) {
        crossoverAge = chartData[i].age;
        break;
      }
    }
    
    return {
      // 60歳時点の累積支出
      rentAt60: data60?.rent_cumulative ?? 0,
      buyAt60: data60?.buy_cumulative ?? 0,
      // 40-50代の平均月次支出
      rentMonthly4050: rentAvgMonthly4050,
      buyMonthly4050: buyAvgMonthly4050,
      // 損益分岐年齢
      crossoverAge,
      // ローン完済年齢
      mortgageEndAge: profile.currentAge + mortgageYears,
    };
  }, [chartData, buyConfig, profile.currentAge]);

  // 結論テキスト
  const conclusion = useMemo(() => {
    const diff60 = metrics.rentAt60 - metrics.buyAt60;
    if (diff60 > 0) {
      return `60歳時点で購入が${formatCurrency(Math.round(diff60))}有利`;
    } else if (diff60 < 0) {
      return `60歳時点で賃貸が${formatCurrency(Math.round(Math.abs(diff60)))}有利`;
    }
    return '60歳時点でほぼ同等';
  }, [metrics]);

  return (
    <SectionCard
      icon={<Home className="h-5 w-5" />}
      title="賃貸 vs 購入 比較"
      description="賃貸継続と購入の比較"
    >
      <div className="space-y-4">
        {/* 1. 結論（常時表示） */}
        <div className="text-center py-2">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {conclusion}
          </p>
          {metrics.crossoverAge && (
            <p className="text-xs text-gray-500 mt-1">
              {metrics.crossoverAge}歳以降は購入が累積で有利に
            </p>
          )}
        </div>

        {/* 2. 凡例（常時表示・固定） */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: RENT_COLOR }} />
            <span className="text-gray-600 dark:text-gray-400">賃貸継続</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: BUY_COLOR }} />
            <span className="text-gray-600 dark:text-gray-400">購入（この条件）</span>
          </div>
        </div>

        {/* 3. グラフ */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => `${value}`}
                label={{ value: '歳', position: 'right', offset: -5, fontSize: 10, fill: '#9ca3af' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => 
                  showCumulative 
                    ? `${(value / 10000).toFixed(1)}億` 
                    : `${value}万`
                }
                width={45}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const rentVal = payload.find((p: any) => p.dataKey.includes('rent'))?.value;
                  const buyVal = payload.find((p: any) => p.dataKey.includes('buy'))?.value;
                  return (
                    <div className="rounded border border-gray-200 bg-white px-3 py-2 shadow-sm text-xs dark:bg-gray-900 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{label}歳</p>
                      <div className="mt-1 space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span style={{ color: RENT_COLOR }}>賃貸</span>
                          <span className="tabular-nums">{Math.round(rentVal as number).toLocaleString()}万</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span style={{ color: BUY_COLOR }}>購入</span>
                          <span className="tabular-nums">{Math.round(buyVal as number).toLocaleString()}万</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={60}
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={{ value: '60歳', position: 'top', fill: '#9ca3af', fontSize: 10 }}
              />
              {metrics.mortgageEndAge <= profile.currentAge + 50 && (
                <ReferenceLine
                  x={metrics.mortgageEndAge}
                  stroke="#d1d5db"
                  strokeDasharray="2 2"
                  label={{ value: '完済', position: 'bottom', fill: '#9ca3af', fontSize: 9 }}
                />
              )}
              <Line
                type="monotone"
                dataKey={showCumulative ? 'rent_cumulative' : 'rent_annual'}
                stroke={RENT_COLOR}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={showCumulative ? 'buy_cumulative' : 'buy_annual'}
                stroke={BUY_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 4. 3指標（常時表示・賃貸/購入 2段） */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* 指標1: 損益分岐 */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500">損益分岐</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {metrics.crossoverAge ? `${metrics.crossoverAge}歳` : '50年以内なし'}
            </p>
          </div>
          
          {/* 指標2: 60歳時点累積 */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500">60歳時点累積</p>
            <div className="space-y-0.5">
              <p className="text-xs">
                <span style={{ color: RENT_COLOR }}>賃</span>
                <span className="ml-1 font-medium">{Math.round(metrics.rentAt60).toLocaleString()}万</span>
              </p>
              <p className="text-xs">
                <span style={{ color: BUY_COLOR }}>購</span>
                <span className="ml-1 font-medium">{Math.round(metrics.buyAt60).toLocaleString()}万</span>
              </p>
            </div>
          </div>
          
          {/* 指標3: 40-50代月次平均 */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500">40-50代月次</p>
            <div className="space-y-0.5">
              <p className="text-xs">
                <span style={{ color: RENT_COLOR }}>賃</span>
                <span className="ml-1 font-medium">{metrics.rentMonthly4050.toFixed(1)}万/月</span>
              </p>
              <p className="text-xs">
                <span style={{ color: BUY_COLOR }}>購</span>
                <span className="ml-1 font-medium">{metrics.buyMonthly4050.toFixed(1)}万/月</span>
              </p>
            </div>
          </div>
        </div>

        {/* 5. コントロールパネル（フォーム） */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 mb-3 text-center">
            この入力が上の比較を動かします
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 賃貸設定 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RENT_COLOR }} />
                <Label className="text-xs font-medium">賃貸継続</Label>
              </div>
              <SliderInput
                label="年間家賃"
                value={rentAnnualCost}
                onChange={setRentAnnualCost}
                min={36}
                max={600}
                step={12}
                unit="万円"
              />
            </div>
            
            {/* 購入設定 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BUY_COLOR }} />
                <Label className="text-xs font-medium">購入</Label>
              </div>
              <SliderInput
                label="物件価格"
                value={buyConfig.propertyPrice}
                onChange={(v) => updateBuyConfig({ propertyPrice: v })}
                min={2000}
                max={15000}
                step={100}
                unit="万円"
              />
            </div>
          </div>
          
          {/* 表示切替 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>年間</span>
              <button
                onClick={() => setShowCumulative(!showCumulative)}
                className={cn(
                  "relative w-8 h-4 rounded-full transition-colors",
                  showCumulative ? "bg-gray-300" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform",
                    showCumulative ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
              <span>累積</span>
            </div>
          </div>
        </div>

        {/* 6. 補足（折りたたみ） */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs text-gray-400 hover:text-gray-600">
              {showDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              詳細設定
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="頭金"
                value={buyConfig.downPayment}
                onChange={(v) => updateBuyConfig({ downPayment: v })}
                min={0}
                max={buyConfig.propertyPrice}
                step={100}
                unit="万円"
              />
              <SliderInput
                label="ローン年数"
                value={buyConfig.mortgageYears}
                onChange={(v) => updateBuyConfig({ mortgageYears: v })}
                min={10}
                max={50}
                step={1}
                unit="年"
              />
              <SliderInput
                label="金利"
                value={buyConfig.interestRate}
                onChange={(v) => updateBuyConfig({ interestRate: v })}
                min={0}
                max={5}
                step={0.1}
                unit="%"
              />
              <SliderInput
                label="維持費/年"
                value={buyConfig.ownerAnnualCost}
                onChange={(v) => updateBuyConfig({ ownerAnnualCost: v })}
                min={10}
                max={100}
                step={5}
                unit="万円"
              />
            </div>
            <p className="text-xs text-gray-400">
              - ローン完済後の支出減少に注目<br/>
              - 購入は物件が資産として残る（グラフ未反映）
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SectionCard>
  );
}
