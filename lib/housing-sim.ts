// Housing Simulation - Rent vs Buy Comparison with CRN (Common Random Numbers)
import type { Profile, AssetPoint, ExitScoreDetail, SimulationPath, KeyMetrics, HomeStatus } from './types';
import { getScoreLevel } from './types';
import {
  calculateNetIncomeForAge,
  calculateExpensesForAge,
  calculateAssetGainForAge,
  MAX_AGE,
} from './calc-core';

export type HousingScenarioType = 'RENT_BASELINE' | 'BUY_NOW' | 'RELOCATE';

export interface RateStep {
  year: number;       // ステップアップ開始年 (0-indexed)
  rate: number;       // 適用金利 (%)
}

export interface BuyNowParams {
  propertyPrice: number;        // 物件価格（万円）
  downPayment: number;          // 頭金（万円）
  purchaseCostRate: number;     // 諸費用率（%）
  mortgageYears: number;        // ローン年数（年）
  interestRate: number;         // 金利（%）
  ownerAnnualCost: number;      // 管理費・固定資産税（万円/年）
  buyAfterYears: 0 | 3 | 10;    // 購入タイミング
  rateSteps?: RateStep[];       // 変動金利ステップアップスケジュール
  ownerCostEscalation?: number; // 維持費逓増率 (%/年, e.g. 1.5)
}

export interface RelocateParams {
  // 現在の物件
  currentPropertyValue: number;  // 現在の物件評価額（万円）
  currentMortgageRemaining: number; // 残債（万円）
  sellingCostRate: number;       // 売却諸費用率（%）
  relocateAfterYears: 0 | 3 | 5; // 住み替えタイミング
  // 新しい物件
  newPropertyPrice: number;      // 新物件価格（万円）
  newDownPayment: number;        // 新物件頭金（万円）
  newPurchaseCostRate: number;   // 新物件諸費用率（%）
  newMortgageYears: number;      // 新ローン年数（年）
  newInterestRate: number;       // 新ローン金利（%）
  newOwnerAnnualCost: number;    // 新物件の管理費・固定資産税（万円/年）
}

export interface HousingSimulationResult {
  paths: SimulationPath;
  metrics: KeyMetrics;
  score: ExitScoreDetail;
}

export interface HousingScenarioResult {
  type: HousingScenarioType;
  scenarioProfile: Profile;
  simulation: HousingSimulationResult;
  safeFireAge: number | null;
  monthlyPayment: number;       // 月々返済額（万円）
  totalCost40Years: number;     // 40年間の総コスト（万円）
  assetsAt60: number;           // 60歳時点の資産（万円）
}

// Seeded random number generator for reproducible results
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  // Box-Muller transform for normal distribution
  nextGaussian(): number {
    const u1 = this.next();
    const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  }
}

// Calculate monthly mortgage payment in 万円
export function computeMonthlyPaymentManYen(
  loanPrincipal: number,
  interestRate: number,
  mortgageYears: number
): number {
  if (loanPrincipal <= 0 || mortgageYears <= 0) return 0;
  
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = mortgageYears * 12;
  
  if (monthlyRate === 0) {
    return loanPrincipal / numPayments;
  }
  
  const payment =
    (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return payment;
}

/**
 * 年次住宅コストスケジュールを計算する。
 * 変動金利ステップアップ + 維持費逓増を考慮。
 */
export function computeYearlyHousingCosts(
  buyParams: BuyNowParams,
  totalYears: number
): number[] {
  const {
    propertyPrice,
    downPayment,
    mortgageYears,
    interestRate,
    ownerAnnualCost,
    rateSteps,
    ownerCostEscalation,
  } = buyParams;

  const loanPrincipal = propertyPrice - downPayment;
  const escalation = (ownerCostEscalation ?? 0) / 100;

  if (loanPrincipal <= 0 || mortgageYears <= 0) {
    return Array.from({ length: totalYears }, (_, y) =>
      ownerAnnualCost * Math.pow(1 + escalation, y)
    );
  }

  const totalLoanMonths = mortgageYears * 12;

  // Build rate lookup: for a given year, what rate applies?
  const steps = rateSteps
    ? [...rateSteps].sort((a, b) => a.year - b.year)
    : [{ year: 0, rate: interestRate }];

  function getRateForYear(year: number): number {
    let rate = steps[0]?.rate ?? interestRate;
    for (const step of steps) {
      if (step.year <= year) rate = step.rate;
      else break;
    }
    return rate;
  }

  const schedule: number[] = [];
  let balance = loanPrincipal;
  let monthsPaidTotal = 0;
  let currentRate = getRateForYear(0);
  let monthlyPayment = computeMonthlyPaymentManYen(balance, currentRate, mortgageYears);

  for (let year = 0; year < totalYears; year++) {
    // Check for rate change
    const newRate = getRateForYear(year);
    if (year > 0 && newRate !== currentRate) {
      currentRate = newRate;
      const remainingMonths = totalLoanMonths - monthsPaidTotal;
      if (remainingMonths > 0 && balance > 0) {
        monthlyPayment = computeMonthlyPaymentManYen(balance, currentRate, remainingMonths / 12);
      } else {
        monthlyPayment = 0;
      }
    }

    // Months of mortgage remaining this year
    const remainingMonths = totalLoanMonths - monthsPaidTotal;
    const monthsThisYear = Math.min(12, Math.max(0, remainingMonths));

    // Mortgage cost: pay and track balance
    let mortgageCost = 0;
    if (monthsThisYear > 0 && balance > 0) {
      mortgageCost = monthlyPayment * monthsThisYear;
      const monthlyRate = currentRate / 100 / 12;
      for (let m = 0; m < monthsThisYear; m++) {
        if (balance <= 0) break;
        const interestPart = balance * monthlyRate;
        const principalPart = monthlyPayment - interestPart;
        balance = Math.max(0, balance - principalPart);
      }
      monthsPaidTotal += monthsThisYear;
    }

    // Owner costs with escalation
    const ownerCost = ownerAnnualCost * Math.pow(1 + escalation, year);

    schedule.push(mortgageCost + ownerCost);
  }

  return schedule;
}

const SIMULATION_RUNS = 500;
const BASE_SEED = 42;

// Income, expense, and asset event calculations are in calc-core.ts

/**
 * housing-sim用の支出計算ヘルパー。
 * housingCostSchedule からのオーバーライド値がある場合、
 * homeStatus='owner' として渡すことで家賃インフレを回避する。
 */
function calculateExpensesWithOverride(
  profile: Profile,
  age: number,
  inflationFactor: number,
  housingCostOverride?: number
): number {
  if (housingCostOverride !== undefined) {
    const overrides: { homeStatus: HomeStatus; housingCostAnnual: number } = {
      homeStatus: 'owner',
      housingCostAnnual: housingCostOverride,
    };
    return calculateExpensesForAge(profile, age, inflationFactor, overrides);
  }
  return calculateExpensesForAge(profile, age, inflationFactor);
}

// Run single simulation with seeded random
function runSingleSimulationSeeded(
  profile: Profile,
  rng: SeededRandom,
  housingCostSchedule?: number[]
): AssetPoint[] {
  const path: AssetPoint[] = [];

  let totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;
  const nominalReturn = profile.expectedReturn / 100;
  const inflationRate = profile.inflationRate / 100;

  // Housing purchase transition (for non-housing-comparison simulations)
  let hpHandled = profile.homeStatus === 'owner' || profile.homeStatus === 'relocating';

  for (let age = profile.currentAge; age <= MAX_AGE; age++) {
    path.push({ age, assets: Math.round(totalAssets) });

    // housing_purchase: deduct upfront costs (housing cost schedule handles ongoing costs)
    if (!hpHandled) {
      for (const event of profile.lifeEvents) {
        if (event.type === 'housing_purchase' && age === event.age && event.purchaseDetails) {
          const d = event.purchaseDetails;
          const totalUpfront = d.downPayment + d.propertyPrice * (d.purchaseCostRate / 100);
          totalAssets -= totalUpfront;
          hpHandled = true;
          break;
        }
      }
    }

    const yearsElapsed = age - profile.currentAge;
    const inflationFactor = Math.pow(1 + inflationRate, yearsElapsed);

    const income = calculateNetIncomeForAge(profile, age);
    const housingOverride = housingCostSchedule?.[yearsElapsed];
    const expenses = calculateExpensesWithOverride(profile, age, inflationFactor, housingOverride);
    const netCashFlow = income - expenses;

    const dcContrib = age < profile.targetRetireAge ? profile.dcContributionAnnual : 0;

    const yearReturn = nominalReturn + rng.nextGaussian() * profile.volatility;
    const investmentGain = totalAssets * yearReturn;

    // One-time asset events (inheritance, gifts, severance, etc.)
    const assetGain = calculateAssetGainForAge(profile.lifeEvents, age);

    totalAssets = totalAssets + netCashFlow + dcContrib + investmentGain + assetGain;

    if (totalAssets < -10000) {
      totalAssets = -10000;
    }
  }

  return path;
}

// Calculate percentile from simulation results
function getPercentilePath(allPaths: AssetPoint[][], percentile: number): AssetPoint[] {
  const result: AssetPoint[] = [];
  const numAges = allPaths[0].length;
  
  for (let i = 0; i < numAges; i++) {
    const valuesAtAge = allPaths.map(path => path[i].assets).sort((a, b) => a - b);
    const index = Math.floor(valuesAtAge.length * percentile / 100);
    result.push({
      age: allPaths[0][i].age,
      assets: valuesAtAge[Math.min(index, valuesAtAge.length - 1)]
    });
  }
  
  return result;
}

// Run simulation with CRN (Common Random Numbers)
function runSimulationWithSeed(
  profile: Profile,
  seed: number,
  housingCostSchedule?: number[]
): HousingSimulationResult {
  const allPaths: AssetPoint[][] = [];

  for (let i = 0; i < SIMULATION_RUNS; i++) {
    const rng = new SeededRandom(seed + i);
    allPaths.push(runSingleSimulationSeeded(profile, rng, housingCostSchedule));
  }

  const medianPath = getPercentilePath(allPaths, 50);
  const upperPath = getPercentilePath(allPaths, 90);
  const lowerPath = getPercentilePath(allPaths, 10);
  const p25Path = getPercentilePath(allPaths, 25);
  const p75Path = getPercentilePath(allPaths, 75);

  const paths: SimulationPath = {
    yearlyData: medianPath,
    upperPath: upperPath,
    lowerPath: lowerPath,
    p25Path,
    p75Path,
    median: medianPath.map(p => p.assets),
    optimistic: upperPath.map(p => p.assets),
    pessimistic: lowerPath.map(p => p.assets),
  };

  // Calculate survival rate
  const survivingPaths = allPaths.filter(path =>
    path.every(point => point.assets >= 0)
  );
  const survivalRate = (survivingPaths.length / allPaths.length) * 100;

  // Assets at 100
  const assetAt100 = paths.yearlyData[paths.yearlyData.length - 1]?.assets ?? 0;

  // FIRE age: use schedule-aware expenses
  let fireAge: number | null = null;
  const safeWithdrawalRate = 0.04;

  for (const point of paths.yearlyData) {
    const yearsElapsed = point.age - profile.currentAge;
    const inflationFactor = Math.pow(1 + profile.inflationRate / 100, yearsElapsed);
    const housingOverride = housingCostSchedule?.[yearsElapsed];
    const expensesAtAge = calculateExpensesWithOverride(profile, point.age, inflationFactor, housingOverride);
    if (point.assets * safeWithdrawalRate >= expensesAtAge) {
      fireAge = point.age;
      break;
    }
  }

  const metrics: KeyMetrics = {
    fireAge,
    assetAt100,
    survivalRate,
    yearsToFire: fireAge ? fireAge - profile.currentAge : null
  };

  // Calculate score
  const survival = Math.min(100, survivalRate);

  // Lifestyle: use projected assets at retirement age
  const yearsToRetire = profile.targetRetireAge - profile.currentAge;
  const retireInflationFactor = Math.pow(1 + profile.inflationRate / 100, yearsToRetire);
  const retireHousingOverride = housingCostSchedule?.[yearsToRetire];
  const targetExpenses = calculateExpensesWithOverride(profile, profile.targetRetireAge, retireInflationFactor, retireHousingOverride);
  const retireIndex = Math.max(0, Math.min(yearsToRetire, paths.yearlyData.length - 1));
  const retireAssets = paths.yearlyData[retireIndex]?.assets ?? 0;
  const yearsOfExpenses = retireAssets > 0 && targetExpenses > 0 ? retireAssets / targetExpenses : 0;
  const lifestyle = Math.min(100, yearsOfExpenses * 5);

  // Risk: include home equity as non-volatile asset
  const homeEquity = (profile.homeStatus === 'owner' || profile.homeStatus === 'relocating')
    ? Math.max(0, (profile.homeMarketValue ?? 0) - (profile.mortgagePrincipal ?? 0))
    : 0;
  const riskExposure = profile.assetInvest / (profile.assetCash + profile.assetInvest + homeEquity + 1);
  const risk = Math.max(0, 100 - riskExposure * profile.volatility * 500);

  // Liquidity: projected assets at 5 years as months of expenses
  const projIndex = Math.min(5, paths.yearlyData.length - 1);
  const projectedAssets = paths.yearlyData[projIndex]?.assets ?? 0;
  const annualExpenses = targetExpenses > 0 ? targetExpenses : 1;
  const monthsOfExpenses = projectedAssets > 0 ? (projectedAssets / (annualExpenses / 12)) : 0;
  const liquidity = Math.min(100, monthsOfExpenses * (100 / 60)); // 60 months = 100%

  const overall = Math.round(
    survival * 0.55 +
    lifestyle * 0.20 +
    risk * 0.15 +
    liquidity * 0.10
  );

  const score: ExitScoreDetail = {
    overall,
    level: getScoreLevel(overall),
    survival: Math.round(survival),
    lifestyle: Math.round(lifestyle),
    risk: Math.round(risk),
    liquidity: Math.round(liquidity)
  };

  return { paths, metrics, score };
}

// Compute safe FIRE age (90% survival probability)
function computeSafeFireAge(
  profile: Profile,
  seed: number,
  housingCostSchedule?: number[]
): number | null {
  for (let testAge = profile.currentAge; testAge <= 70; testAge++) {
    const testProfile = { ...profile, targetRetireAge: testAge };
    const result = runSimulationWithSeed(testProfile, seed, housingCostSchedule);

    if (result.metrics.survivalRate >= 90) {
      return testAge;
    }
  }
  return null;
}

// Apply purchase outflow to assets
function applyPurchaseOutflow(profile: Profile, purchaseOutflow: number): Profile {
  let remaining = purchaseOutflow;
  const result = { ...profile };
  
  if (result.assetCash >= remaining) {
    result.assetCash -= remaining;
    remaining = 0;
  } else {
    remaining -= result.assetCash;
    result.assetCash = 0;
  }
  
  if (remaining > 0 && result.assetInvest >= remaining) {
    result.assetInvest -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= result.assetInvest;
    result.assetInvest = 0;
  }
  
  if (remaining > 0) {
    result.assetCash = -remaining;
  }
  
  return result;
}

// Run relocate scenario for existing homeowners
export function runRelocateScenario(
  baseProfile: Profile,
  relocateParams: RelocateParams
): HousingScenarioResult {
  const {
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
  } = relocateParams;

  // Calculate sale proceeds
  const sellingCosts = currentPropertyValue * (sellingCostRate / 100);
  const saleProceeds = currentPropertyValue - currentMortgageRemaining - sellingCosts;

  // Calculate new purchase costs
  const newPurchaseCosts = newPropertyPrice * (newPurchaseCostRate / 100);
  const newLoanPrincipal = newPropertyPrice - newDownPayment;
  const newMonthlyPayment = computeMonthlyPaymentManYen(newLoanPrincipal, newInterestRate, newMortgageYears);
  const newMortgageAnnual = newMonthlyPayment * 12;

  // Net cash flow from transaction (can be positive if downsizing, negative if upgrading)
  const netTransactionCash = saleProceeds - newDownPayment - newPurchaseCosts;

  // Create profile for relocate scenario
  let relocateProfile: Profile;

  if (relocateAfterYears === 0) {
    // Immediate relocation
    relocateProfile = {
      ...baseProfile,
      homeStatus: 'owner',
      homeMarketValue: newPropertyPrice,
      mortgagePrincipal: newLoanPrincipal,
      mortgageInterestRate: newInterestRate,
      mortgageYearsRemaining: newMortgageYears,
      mortgageMonthlyPayment: newMonthlyPayment,
      housingCostAnnual: newMortgageAnnual + newOwnerAnnualCost,
      // Adjust assets based on transaction
      assetCash: Math.max(0, baseProfile.assetCash + netTransactionCash),
      assetInvest: netTransactionCash < 0 && baseProfile.assetCash + netTransactionCash < 0
        ? baseProfile.assetInvest + (baseProfile.assetCash + netTransactionCash)
        : baseProfile.assetInvest,
    };
  } else {
    // Future relocation as life event
    relocateProfile = {
      ...baseProfile,
      homeStatus: 'relocating',
      lifeEvents: [
        ...baseProfile.lifeEvents,
        {
          id: `relocation-sale-${Date.now()}`,
          name: '住み替え（売却・購入）',
          type: 'asset_purchase',
          age: baseProfile.currentAge + relocateAfterYears,
          amount: -netTransactionCash, // Negative if receiving money, positive if paying
          isRecurring: false,
          duration: 1,
        },
        {
          id: `relocation-housing-cost-${Date.now()}`,
          name: '住み替え後住居費',
          type: 'expense_increase',
          age: baseProfile.currentAge + relocateAfterYears,
          amount: newMortgageAnnual + newOwnerAnnualCost - baseProfile.housingCostAnnual,
          isRecurring: true,
          duration: newMortgageYears,
        },
      ],
    };
  }

  // Build schedule for relocate scenario
  const totalYears = MAX_AGE - baseProfile.currentAge + 1;
  const relocateBuyParams: BuyNowParams = {
    propertyPrice: newPropertyPrice,
    downPayment: newDownPayment,
    purchaseCostRate: newPurchaseCostRate,
    mortgageYears: newMortgageYears,
    interestRate: newInterestRate,
    ownerAnnualCost: newOwnerAnnualCost,
    buyAfterYears: 0,
  };
  const relocateSchedule = computeYearlyHousingCosts(relocateBuyParams, totalYears);

  let effectiveSchedule: number[];
  if (relocateAfterYears === 0) {
    effectiveSchedule = relocateSchedule;
  } else {
    const rentInflation = (baseProfile.rentInflationRate ?? baseProfile.inflationRate) / 100;
    effectiveSchedule = [];
    for (let y = 0; y < totalYears; y++) {
      if (y < relocateAfterYears) {
        effectiveSchedule.push(baseProfile.housingCostAnnual * Math.pow(1 + rentInflation, y));
      } else {
        effectiveSchedule.push(relocateSchedule[y - relocateAfterYears] ?? 0);
      }
    }
  }

  const relocateSim = runSimulationWithSeed(relocateProfile, BASE_SEED, effectiveSchedule);
  const relocateSafeAge = computeSafeFireAge(relocateProfile, BASE_SEED, effectiveSchedule);

  // Calculate total costs over 40 years
  const relocateTotal40 = newDownPayment + newPurchaseCosts - saleProceeds + relocateSchedule.slice(0, 40).reduce((s, c) => s + c, 0);

  const age60Index = Math.max(0, 60 - baseProfile.currentAge);
  const relocateAssetsAt60 = relocateSim.paths.yearlyData[age60Index]?.assets ?? 0;

  return {
    type: 'RELOCATE',
    scenarioProfile: relocateProfile,
    simulation: relocateSim,
    safeFireAge: relocateSafeAge,
    monthlyPayment: newMonthlyPayment + newOwnerAnnualCost / 12,
    totalCost40Years: relocateTotal40,
    assetsAt60: relocateAssetsAt60,
  };
}

// Main function: Run both rent and buy scenarios
export function runHousingScenarios(
  baseProfile: Profile,
  buyNowParams: BuyNowParams | null,
  relocateParams?: RelocateParams | null
): HousingScenarioResult[] {
  const results: HousingScenarioResult[] = [];
  const totalYears = MAX_AGE - baseProfile.currentAge + 1;

  // === 1. Baseline (Rent) Scenario ===
  const baselineSim = runSimulationWithSeed(baseProfile, BASE_SEED);
  const baselineSafeAge = computeSafeFireAge(baseProfile, BASE_SEED);

  const rentAnnual = baseProfile.housingCostAnnual;
  const rentInflation = (baseProfile.rentInflationRate ?? baseProfile.inflationRate) / 100;
  let rentTotal40 = 0;
  for (let y = 0; y < 40; y++) {
    rentTotal40 += rentAnnual * Math.pow(1 + rentInflation, y);
  }
  rentTotal40 = Math.round(rentTotal40);

  const age60Index = Math.max(0, 60 - baseProfile.currentAge);
  const baselineAssetsAt60 = baselineSim.paths.yearlyData[age60Index]?.assets ?? 0;

  results.push({
    type: 'RENT_BASELINE',
    scenarioProfile: baseProfile,
    simulation: baselineSim,
    safeFireAge: baselineSafeAge,
    monthlyPayment: rentAnnual / 12,
    totalCost40Years: rentTotal40,
    assetsAt60: baselineAssetsAt60,
  });

  // === 2. Buy Scenario ===
  if (buyNowParams) {
    const {
      propertyPrice,
      downPayment,
      purchaseCostRate,
      mortgageYears,
      interestRate,
      ownerAnnualCost,
      buyAfterYears,
    } = buyNowParams;

    const purchaseCosts = propertyPrice * (purchaseCostRate / 100);
    const loanPrincipal = propertyPrice - downPayment;
    const monthlyPayment = computeMonthlyPaymentManYen(loanPrincipal, interestRate, mortgageYears);
    const mortgageAnnual = monthlyPayment * 12;
    const purchaseOutflow = downPayment + purchaseCosts;

    // Compute yearly housing cost schedule with rate steps + escalation
    const buySchedule = computeYearlyHousingCosts(buyNowParams, totalYears);
    const buyTotal40 = purchaseOutflow + buySchedule.slice(0, 40).reduce((s, c) => s + c, 0);

    let buyProfile: Profile;
    let effectiveSchedule: number[];

    if (buyAfterYears === 0) {
      buyProfile = applyPurchaseOutflow(
        {
          ...baseProfile,
          homeStatus: 'owner',
          homeMarketValue: propertyPrice,
          mortgagePrincipal: loanPrincipal,
          mortgageInterestRate: interestRate,
          mortgageYearsRemaining: mortgageYears,
          mortgageMonthlyPayment: monthlyPayment,
          housingCostAnnual: mortgageAnnual + ownerAnnualCost,
        },
        purchaseOutflow
      );
      effectiveSchedule = buySchedule;
    } else {
      // Composite schedule: rent for buyAfterYears, then purchase schedule
      effectiveSchedule = [];
      for (let y = 0; y < totalYears; y++) {
        if (y < buyAfterYears) {
          // Rent period: use rentInflationRate
          effectiveSchedule.push(rentAnnual * Math.pow(1 + rentInflation, y));
        } else {
          // Purchase period: offset into buy schedule
          const buyYear = y - buyAfterYears;
          effectiveSchedule.push(buySchedule[buyYear] ?? 0);
        }
      }

      buyProfile = {
        ...baseProfile,
        homeStatus: 'planning',
        homeMarketValue: propertyPrice,
        mortgagePrincipal: loanPrincipal,
        mortgageInterestRate: interestRate,
        mortgageYearsRemaining: mortgageYears,
        mortgageMonthlyPayment: monthlyPayment,
        lifeEvents: [
          ...baseProfile.lifeEvents,
          {
            id: `housing-purchase-${Date.now()}`,
            name: '住宅購入',
            type: 'asset_purchase',
            age: baseProfile.currentAge + buyAfterYears,
            amount: purchaseOutflow,
            isRecurring: false,
            duration: 1,
          },
        ],
      };
    }

    const buySim = runSimulationWithSeed(buyProfile, BASE_SEED, effectiveSchedule);
    const buySafeAge = computeSafeFireAge(buyProfile, BASE_SEED, effectiveSchedule);

    const buyAssetsAt60 = buySim.paths.yearlyData[age60Index]?.assets ?? 0;

    results.push({
      type: 'BUY_NOW',
      scenarioProfile: buyProfile,
      simulation: buySim,
      safeFireAge: buySafeAge,
      monthlyPayment: monthlyPayment + ownerAnnualCost / 12,
      totalCost40Years: Math.round(buyTotal40),
      assetsAt60: buyAssetsAt60,
    });
  }

  // === 3. Relocate Scenario (for existing homeowners) ===
  if (relocateParams) {
    const relocateResult = runRelocateScenario(baseProfile, relocateParams);
    results.push(relocateResult);
  }

  return results;
}
