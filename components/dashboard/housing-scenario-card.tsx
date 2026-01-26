'use client';

import { useState, useMemo } from 'react';
import { Home, Building2, Calculator, Loader2, Info, ArrowRightLeft } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { SliderInput } from '@/components/slider-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import type { Profile, HomeStatus } from '@/lib/types';
import { useHousingScenarios } from '@/hooks/useHousingScenarios';
import { computeMonthlyPaymentManYen, type BuyNowParams, type RelocateParams } from '@/lib/housing-sim';
import { cn } from '@/lib/utils';

interface HousingScenarioCardProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => void;
}

export function HousingScenarioCard({
  profile,
  onUpdate,
}: HousingScenarioCardProps) {
  // Local state for buy parameters
  const [propertyPrice, setPropertyPrice] = useState(6000);
  const [downPayment, setDownPayment] = useState(1000);
  const [purchaseCostRate, setPurchaseCostRate] = useState(5.0);
  const [mortgageYears, setMortgageYears] = useState(35);
  const [interestRate, setInterestRate] = useState(1.0);
  const [ownerAnnualCost, setOwnerAnnualCost] = useState(30);
  const [buyAfterYears, setBuyAfterYears] = useState<0 | 3 | 10>(0);

  // Local state for relocate parameters (for existing homeowners)
  const [currentPropertyValue, setCurrentPropertyValue] = useState(profile.homeMarketValue || 5000);
  const [currentMortgageRemaining, setCurrentMortgageRemaining] = useState(profile.mortgagePrincipal || 3000);
  const [sellingCostRate, setSellingCostRate] = useState(3.5);
  const [relocateAfterYears, setRelocateAfterYears] = useState<0 | 3 | 5>(0);
  const [newPropertyPrice, setNewPropertyPrice] = useState(7000);
  const [newDownPayment, setNewDownPayment] = useState(0);
  const [newPurchaseCostRate, setNewPurchaseCostRate] = useState(5.0);
  const [newMortgageYears, setNewMortgageYears] = useState(30);
  const [newInterestRate, setNewInterestRate] = useState(1.2);
  const [newOwnerAnnualCost, setNewOwnerAnnualCost] = useState(35);

  const { results, isRunning, error, runComparison } = useHousingScenarios(profile);

  // Calculate derived values
  const loanPrincipal = propertyPrice - downPayment;
  const monthlyPayment = useMemo(() => {
    return computeMonthlyPaymentManYen(loanPrincipal, interestRate, mortgageYears);
  }, [loanPrincipal, interestRate, mortgageYears]);

  const purchaseCosts = propertyPrice * (purchaseCostRate / 100);
  const totalUpfront = downPayment + purchaseCosts;

  // Calculate relocate derived values
  const sellingCosts = currentPropertyValue * (sellingCostRate / 100);
  const saleProceeds = currentPropertyValue - currentMortgageRemaining - sellingCosts;
  const newLoanPrincipal = newPropertyPrice - newDownPayment;
  const newMonthlyPayment = useMemo(() => {
    return computeMonthlyPaymentManYen(newLoanPrincipal, newInterestRate, newMortgageYears);
  }, [newLoanPrincipal, newInterestRate, newMortgageYears]);
  const newPurchaseCosts = newPropertyPrice * (newPurchaseCostRate / 100);
  const netTransactionCash = saleProceeds - newDownPayment - newPurchaseCosts;

  // Handle comparison
  const handleCompare = () => {
    const params: BuyNowParams = {
      propertyPrice,
      downPayment,
      purchaseCostRate,
      mortgageYears,
      interestRate,
      ownerAnnualCost,
      buyAfterYears,
    };
    runComparison(params, null);
  };

  // Handle relocate comparison
  const handleRelocateCompare = () => {
    const relocateParams: RelocateParams = {
      currentPropertyValue,
      currentMortgageRemaining,
      sellingCostRate,
      relocateAfterYears,
      newPropertyPrice,
      newDownPayment,
      newPurchaseCostRate,
      newMortgageYears,
      newInterestRate,
      newOwnerAnnualCost,
    };
    runComparison(null, relocateParams);
  };

  // Extract results for display
  const rentResult = results?.find(r => r.type === 'RENT_BASELINE');
  const buyResult = results?.find(r => r.type === 'BUY_NOW');

  return (
    <SectionCard
      icon={<Home className="h-5 w-5" />}
      title="住宅シナリオ"
      description="賃貸継続と住宅購入の比較シミュレーション"
    >
      <div className="space-y-6">
        {/* Home status selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">現在の住居状況</Label>
          <RadioGroup
            value={profile.homeStatus}
            onValueChange={(value: HomeStatus) => onUpdate({ homeStatus: value })}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="renter" id="status-renter" />
              <Label htmlFor="status-renter" className="cursor-pointer font-normal">
                賃貸
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="owner" id="status-owner" />
              <Label htmlFor="status-owner" className="cursor-pointer font-normal">
                持ち家（ローンあり）
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="planning" id="status-planning" />
              <Label htmlFor="status-planning" className="cursor-pointer font-normal">
                購入検討中
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Tabs defaultValue="rent">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rent" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              賃貸継続
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              住宅購入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rent" className="mt-4 space-y-4">
            <SliderInput
              label="年間住居費"
              value={profile.housingCostAnnual}
              onChange={(value) => onUpdate({ housingCostAnnual: value })}
              min={36}
              max={600}
              step={12}
              unit="万円"
            />
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                月額家賃: <span className="font-semibold text-foreground">{(profile.housingCostAnnual / 12).toFixed(1)}万円</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                40年間の総支出: <span className="font-semibold text-foreground">{(profile.housingCostAnnual * 40).toLocaleString()}万円</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="buy" className="mt-4 space-y-4">
            <SliderInput
              label="物件価格"
              value={propertyPrice}
              onChange={setPropertyPrice}
              min={1000}
              max={20000}
              step={100}
              unit="万円"
            />
            <SliderInput
              label="頭金"
              value={downPayment}
              onChange={setDownPayment}
              min={0}
              max={propertyPrice}
              step={100}
              unit="万円"
            />
            <div className="grid grid-cols-2 gap-4">
              <SliderInput
                label="諸費用率"
                value={purchaseCostRate}
                onChange={setPurchaseCostRate}
                min={0}
                max={10}
                step={0.5}
                unit="%"
              />
              <SliderInput
                label="ローン年数"
                value={mortgageYears}
                onChange={setMortgageYears}
                min={5}
                max={50}
                step={1}
                unit="年"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SliderInput
                label="金利"
                value={interestRate}
                onChange={setInterestRate}
                min={0}
                max={5}
                step={0.1}
                unit="%"
              />
              <SliderInput
                label="管理費・固定資産税"
                value={ownerAnnualCost}
                onChange={setOwnerAnnualCost}
                min={0}
                max={200}
                step={5}
                unit="万円/年"
              />
            </div>

            {/* Purchase Timing */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">購入タイミング</Label>
              <RadioGroup
                value={String(buyAfterYears)}
                onValueChange={(v) => setBuyAfterYears(Number(v) as 0 | 3 | 10)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="timing-now" />
                  <Label htmlFor="timing-now" className="cursor-pointer font-normal">今すぐ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="timing-3" />
                  <Label htmlFor="timing-3" className="cursor-pointer font-normal">3年後</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="timing-10" />
                  <Label htmlFor="timing-10" className="cursor-pointer font-normal">10年後</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Calculated values */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ローン元本</span>
                <span className="font-semibold">{loanPrincipal.toLocaleString()}万円</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">月々の返済額</span>
                <span className="font-semibold">{monthlyPayment.toFixed(2)}万円</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">諸費用</span>
                <span className="font-semibold">{purchaseCosts.toLocaleString()}万円</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">購入時の必要資金</span>
                <span className="font-semibold text-primary">{totalUpfront.toLocaleString()}万円</span>
              </div>
            </div>

            {/* Compare Button */}
            <Button 
              onClick={handleCompare} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  シミュレーション実行中...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  賃貸 vs 購入を比較
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Comparison Results */}
        {results && rentResult && buyResult && (
          <div className="space-y-6">
            {/* Cost Projection Charts - Two views */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">40年間のコスト比較</Label>
              </div>
              
              {/* Generate chart data once */}
              {(() => {
                const rentAnnual = profile.housingCostAnnual;
                const buyMonthly = computeMonthlyPaymentManYen(
                  propertyPrice - downPayment,
                  interestRate,
                  mortgageYears
                );
                const buyAnnual = buyMonthly * 12 + ownerAnnualCost;
                const purchaseCostsTotal = downPayment + propertyPrice * (purchaseCostRate / 100);
                
                // Calculate data
                const data = [];
                let rentCumulative = 0;
                let buyCumulative = purchaseCostsTotal; // Start with upfront costs
                let breakEvenYear: number | null = null;
                const mortgageEndAge = profile.currentAge + buyAfterYears + mortgageYears;
                
                for (let year = 0; year <= 40; year++) {
                  const age = profile.currentAge + year;
                  const yearsFromPurchase = year - buyAfterYears;
                  
                  // Rent cost (constant)
                  const rentCost = rentAnnual;
                  rentCumulative += rentCost;
                  
                  // Buy cost (varies based on mortgage period)
                  let buyCost = 0;
                  if (year < buyAfterYears) {
                    buyCost = rentAnnual;
                  } else if (yearsFromPurchase < mortgageYears) {
                    buyCost = buyAnnual;
                  } else {
                    buyCost = ownerAnnualCost;
                  }
                  buyCumulative += buyCost;
                  
                  // Check for break-even point
                  if (breakEvenYear === null && buyCumulative < rentCumulative) {
                    breakEvenYear = year;
                  }
                  
                  data.push({
                    year,
                    age,
                    rentCost,
                    buyCost,
                    rentCumulative,
                    buyCumulative,
                    diff: rentCumulative - buyCumulative,
                  });
                }
                
                const breakEvenAge = breakEvenYear !== null 
                  ? profile.currentAge + breakEvenYear 
                  : null;

                return (
                  <>
                    {/* Cumulative Cost Chart (Primary) */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">累積支出の推移</p>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                            <defs>
                              <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6b7280" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#374151" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#374151" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="age"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => `${value}歳`}
                            />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => `${(value / 10000).toFixed(0)}億`}
                              width={45}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const rentVal = payload.find(p => p.dataKey === 'rentCumulative')?.value as number;
                                  const buyVal = payload.find(p => p.dataKey === 'buyCumulative')?.value as number;
                                  const diff = rentVal - buyVal;
                                  return (
                                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                                      <p className="font-medium mb-2">{label}歳時点</p>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-gray-500" />
                                          <span>賃貸継続: {rentVal.toLocaleString()}万円</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-gray-700" />
                                          <span>住宅購入: {buyVal.toLocaleString()}万円</span>
                                        </div>
                                        <div className="pt-1 border-t mt-1 font-semibold text-gray-800">
                                          差額: {diff > 0 ? '購入が' : '賃貸が'}{Math.abs(diff).toLocaleString()}万円お得
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              align="left"
                              wrapperStyle={{ paddingBottom: 10 }}
                              formatter={(value) => value === 'rentCumulative' ? '賃貸継続（累積）' : '住宅購入（累積）'}
                            />
                            {/* Mortgage end reference line */}
                            {mortgageEndAge <= profile.currentAge + 40 && (
                              <ReferenceLine
                                x={mortgageEndAge}
                                stroke="#9ca3af"
                                strokeDasharray="5 5"
                                label={{
                                  value: 'ローン完済',
                                  position: 'top',
                                  fill: '#6b7280',
                                  fontSize: 10,
                                }}
                              />
                            )}
                            {/* Break-even reference line */}
                            {breakEvenAge && (
                              <ReferenceLine
                                x={breakEvenAge}
                                stroke="#4b5563"
                                strokeDasharray="3 3"
                                label={{
                                  value: '損益分岐',
                                  position: 'insideTopRight',
                                  fill: '#4b5563',
                                  fontSize: 10,
                                }}
                              />
                            )}
                            <Area
                              type="monotone"
                              dataKey="rentCumulative"
                              stroke="#6b7280"
                              strokeWidth={2}
                              fill="url(#rentGradient)"
                              name="rentCumulative"
                            />
                            <Area
                              type="monotone"
                              dataKey="buyCumulative"
                              stroke="#374151"
                              strokeWidth={2}
                              fill="url(#buyGradient)"
                              name="buyCumulative"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Annual Cost Chart (Secondary) */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">年間支出の推移</p>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="age"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => `${value}歳`}
                            />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => `${value}万`}
                              width={40}
                            />
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                `${value.toFixed(0)}万円/年`,
                                name === 'rentCost' ? '賃貸' : '購入'
                              ]}
                              labelFormatter={(label) => `${label}歳`}
                            />
                            <Legend
                              verticalAlign="top"
                              align="left"
                              wrapperStyle={{ paddingBottom: 5 }}
                              formatter={(value) => value === 'rentCost' ? '賃貸（年間）' : '購入（年間）'}
                            />
                            {/* Mortgage end marker */}
                            {mortgageEndAge <= profile.currentAge + 40 && (
                              <ReferenceLine
                                x={mortgageEndAge}
                                stroke="#9ca3af"
                                strokeDasharray="5 5"
                              />
                            )}
                            <Line
                              type="stepAfter"
                              dataKey="rentCost"
                              stroke="#6b7280"
                              strokeWidth={2}
                              dot={false}
                              name="rentCost"
                            />
                            <Line
                              type="stepAfter"
                              dataKey="buyCost"
                              stroke="#374151"
                              strokeWidth={2}
                              dot={false}
                              name="buyCost"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Key insights */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">損益分岐点</p>
                        <p className="text-lg font-bold text-gray-800">
                          {breakEvenAge ? `${breakEvenAge}歳` : '40年以上'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {breakEvenYear ? `(${breakEvenYear}年後)` : ''}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">ローン完済</p>
                        <p className="text-lg font-bold text-gray-800">{mortgageEndAge}歳</p>
                        <p className="text-xs text-muted-foreground">
                          ({buyAfterYears + mortgageYears}年後)
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">40年後の差額</p>
                        <p className="text-lg font-bold text-gray-800">
                          {Math.abs(Math.round(data[40].diff)).toLocaleString()}万円
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data[40].diff > 0 ? '購入が有利' : '賃貸が有利'}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              {/* Summary highlight */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "rounded-lg p-3 border",
                  rentResult.totalCost40Years <= buyResult.totalCost40Years
                    ? "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                    : "bg-muted/50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium">賃貸継続</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    rentResult.totalCost40Years <= buyResult.totalCost40Years && "text-gray-800 dark:text-gray-200"
                  )}>
                    {Math.round(rentResult.totalCost40Years).toLocaleString()}万円
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">40年間の総支出</p>
                </div>
                <div className={cn(
                  "rounded-lg p-3 border",
                  buyResult.totalCost40Years < rentResult.totalCost40Years
                    ? "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                    : "bg-muted/50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-gray-700" />
                    <span className="text-sm font-medium">住宅購入</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    buyResult.totalCost40Years < rentResult.totalCost40Years && "text-gray-800 dark:text-gray-200"
                  )}>
                    {Math.round(buyResult.totalCost40Years).toLocaleString()}万円
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">40年間の総支出</p>
                </div>
              </div>
              
              {/* Reading guide */}
              <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>累積支出グラフの見方:</strong> 線が下にあるほど総支出が少ない選択肢です。紫の「損益分岐」線を超えると購入が有利に転じます。</p>
                  <p><strong>年間支出グラフの見方:</strong> ローン完済後（緑線）は購入の年間支出が大幅に下がります。</p>
                </div>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <Label className="text-sm font-medium">詳細比較</Label>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40%]">指標</TableHead>
                    <TableHead className="text-center">賃貸継続</TableHead>
                    <TableHead className="text-center">住宅購入</TableHead>
                    <TableHead className="text-center">差分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">安心ライン到達年齢（90%確率）</TableCell>
                    <TableCell className="text-center">
                      {rentResult.safeFireAge ? `${rentResult.safeFireAge}歳` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {buyResult.safeFireAge ? `${buyResult.safeFireAge}歳` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {rentResult.safeFireAge && buyResult.safeFireAge ? (
                        <span className="font-medium text-gray-700">
                          {buyResult.safeFireAge - rentResult.safeFireAge > 0 ? '+' : ''}
                          {buyResult.safeFireAge - rentResult.safeFireAge}年
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">余白スコア</TableCell>
                    <TableCell className="text-center">
                      {rentResult.simulation.score.overall.toFixed(0)}点
                    </TableCell>
                    <TableCell className="text-center">
                      {buyResult.simulation.score.overall.toFixed(0)}点
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const rentScore = rentResult.simulation.score.overall;
                        const buyScore = buyResult.simulation.score.overall;
                        const diff = buyScore - rentScore;
                        return (
                          <span className="font-medium text-gray-700">
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}点
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">60歳時点の資産</TableCell>
                    <TableCell className="text-center">
                      {Math.round(rentResult.assetsAt60).toLocaleString()}万円
                    </TableCell>
                    <TableCell className="text-center">
                      {Math.round(buyResult.assetsAt60).toLocaleString()}万円
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const diff = buyResult.assetsAt60 - rentResult.assetsAt60;
                        return (
                          <span className="font-medium text-gray-700">
                            {diff >= 0 ? '+' : ''}{Math.round(diff).toLocaleString()}万円
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">40年間の総支出</TableCell>
                    <TableCell className="text-center">
                      {Math.round(rentResult.totalCost40Years).toLocaleString()}万円
                    </TableCell>
                    <TableCell className="text-center">
                      {Math.round(buyResult.totalCost40Years).toLocaleString()}万円
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const diff = buyResult.totalCost40Years - rentResult.totalCost40Years;
                        return (
                          <span className="font-medium text-gray-700">
                            {diff >= 0 ? '+' : ''}{Math.round(diff).toLocaleString()}万円
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">賃貸継続</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {rentResult.safeFireAge ?? '-'}歳
                  </p>
                  <p className="text-xs text-muted-foreground">安心ライン到達年齢</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium">住宅購入</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {buyResult.safeFireAge ?? '-'}歳
                  </p>
                  <p className="text-xs text-muted-foreground">安心ライン到達年齢</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground">
              ※ CRN（共通乱数法）を使用し、同一の市場条件で比較しています。
              実際の判断は税制優遇、維持費、ライフプラン等を総合的に検討してください。
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
