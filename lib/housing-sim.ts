// Housing Simulation - Rent vs Buy Comparison with CRN (Common Random Numbers)
import type { Profile, AssetPoint, ExitScoreDetail, SimulationPath, KeyMetrics } from './types';
import { calculateEffectiveTaxRate, calculateAnnualPension } from './engine';
import { getScoreLevel } from './types';

export type HousingScenarioType = 'RENT_BASELINE' | 'BUY_NOW' | 'RELOCATE';

export interface BuyNowParams {
  propertyPrice: number;        // 物件価格（万円）
  downPayment: number;          // 頭金（万円）
  purchaseCostRate: number;     // 諸費用率（%）
  mortgageYears: number;        // ローン年数（年）
  interestRate: number;         // 金利（%）
  ownerAnnualCost: number;      // 管理費・固定資産税（万円/年）
  buyAfterYears: 0 | 3 | 10;    // 購入タイミング
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

const MAX_AGE = 100;
const SIMULATION_RUNS = 500;
const BASE_SEED = 42;

// Calculate income adjustment from life events
function calculateIncomeAdjustment(profile: Profile, age: number): number {
  let adjustment = 0;
  for (const event of profile.lifeEvents) {
    if (age >= event.age) {
      const endAge = event.duration ? event.age + event.duration : MAX_AGE;
      if (age < endAge) {
        if (event.type === 'income_increase') {
          adjustment += event.amount;
        } else if (event.type === 'income_decrease') {
          adjustment -= event.amount;
        }
      }
    }
  }
  return adjustment;
}

// Calculate net income after tax (per-person tax, pension, income events)
function calculateNetIncome(profile: Profile, age: number): number {
  const isRetired = age >= profile.targetRetireAge;

  if (isRetired) {
    const pensionAge = 65;
    const pension = age >= pensionAge ? calculateAnnualPension(profile) : 0;
    return pension + profile.retirePassiveIncome;
  }

  const incomeAdj = calculateIncomeAdjustment(profile, age);

  const mainGross = Math.max(0, profile.grossIncome + profile.rsuAnnual + profile.sideIncomeNet + incomeAdj);
  const mainRate = profile.useAutoTaxRate
    ? calculateEffectiveTaxRate(mainGross)
    : profile.effectiveTaxRate;
  let netIncome = mainGross * (1 - mainRate / 100);

  if (profile.mode === 'couple') {
    const partnerGross = profile.partnerGrossIncome + profile.partnerRsuAnnual;
    const partnerRate = profile.useAutoTaxRate
      ? calculateEffectiveTaxRate(partnerGross)
      : profile.effectiveTaxRate;
    netIncome += partnerGross * (1 - partnerRate / 100);
  }

  return netIncome;
}

// Calculate annual expenses with inflation
function calculateExpenses(profile: Profile, age: number, inflationFactor: number = 1): number {
  const isRetired = age >= profile.targetRetireAge;

  const isOwner = profile.homeStatus === 'owner' || profile.homeStatus === 'relocating';
  const housingCost = isOwner
    ? profile.housingCostAnnual
    : profile.housingCostAnnual * inflationFactor;

  let baseExpenses = profile.livingCostAnnual * inflationFactor + housingCost;

  for (const event of profile.lifeEvents) {
    if (age >= event.age) {
      const endAge = event.duration ? event.age + event.duration : MAX_AGE;
      if (age < endAge) {
        if (event.type === 'expense_increase') {
          baseExpenses += event.amount * inflationFactor;
        } else if (event.type === 'expense_decrease') {
          baseExpenses -= event.amount * inflationFactor;
        }
      }
    }
  }

  if (isRetired) {
    baseExpenses *= profile.retireSpendingMultiplier;
  }

  return Math.max(0, baseExpenses);
}

// Run single simulation with seeded random
function runSingleSimulationSeeded(profile: Profile, rng: SeededRandom): AssetPoint[] {
  const path: AssetPoint[] = [];

  let totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;
  const nominalReturn = profile.expectedReturn / 100;
  const inflationRate = profile.inflationRate / 100;

  for (let age = profile.currentAge; age <= MAX_AGE; age++) {
    path.push({ age, assets: Math.round(totalAssets) });

    const yearsElapsed = age - profile.currentAge;
    const inflationFactor = Math.pow(1 + inflationRate, yearsElapsed);

    const income = calculateNetIncome(profile, age);
    const expenses = calculateExpenses(profile, age, inflationFactor);
    const netCashFlow = income - expenses;

    const dcContrib = age < profile.targetRetireAge ? profile.dcContributionAnnual : 0;

    const yearReturn = nominalReturn + rng.nextGaussian() * profile.volatility;
    const investmentGain = totalAssets * yearReturn;

    totalAssets = totalAssets + netCashFlow + dcContrib + investmentGain;

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
function runSimulationWithSeed(profile: Profile, seed: number): HousingSimulationResult {
  const allPaths: AssetPoint[][] = [];
  
  for (let i = 0; i < SIMULATION_RUNS; i++) {
    const rng = new SeededRandom(seed + i);
    allPaths.push(runSingleSimulationSeeded(profile, rng));
  }
  
  const medianPath = getPercentilePath(allPaths, 50);
  const upperPath = getPercentilePath(allPaths, 90);
  const lowerPath = getPercentilePath(allPaths, 10);

  const paths: SimulationPath = {
    yearlyData: medianPath,
    upperPath: upperPath,
    lowerPath: lowerPath,
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
  
  // FIRE age
  let fireAge: number | null = null;
  const targetExpenses = calculateExpenses(profile, profile.targetRetireAge);
  const safeWithdrawalRate = 0.04;
  
  for (const point of paths.yearlyData) {
    if (point.assets * safeWithdrawalRate >= targetExpenses) {
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
  const yearsOfExpenses = paths.yearlyData[0]?.assets 
    ? paths.yearlyData[0].assets / targetExpenses 
    : 0;
  const lifestyle = Math.min(100, yearsOfExpenses * 5);
  const riskExposure = profile.assetInvest / (profile.assetCash + profile.assetInvest + 1);
  const risk = Math.max(0, 100 - riskExposure * profile.volatility * 500);
  const totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;
  const liquidityRatio = totalAssets > 0 ? profile.assetCash / totalAssets : 0;
  const liquidity = Math.min(100, liquidityRatio * 200);
  
  const overall = Math.round(
    survival * 0.4 + 
    lifestyle * 0.3 + 
    risk * 0.15 + 
    liquidity * 0.15
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
function computeSafeFireAge(profile: Profile, seed: number): number | null {
  for (let testAge = profile.currentAge; testAge <= 70; testAge++) {
    const testProfile = { ...profile, targetRetireAge: testAge };
    const result = runSimulationWithSeed(testProfile, seed);
    
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

  const relocateSim = runSimulationWithSeed(relocateProfile, BASE_SEED);
  const relocateSafeAge = computeSafeFireAge(relocateProfile, BASE_SEED);

  // Calculate total costs over 40 years
  const totalMortgagePayments = newMonthlyPayment * 12 * newMortgageYears;
  const totalOwnerCosts = newOwnerAnnualCost * 40;
  const relocateTotal40 = newDownPayment + newPurchaseCosts - saleProceeds + totalMortgagePayments + totalOwnerCosts;

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
  
  // === 1. Baseline (Rent) Scenario ===
  const baselineSim = runSimulationWithSeed(baseProfile, BASE_SEED);
  const baselineSafeAge = computeSafeFireAge(baseProfile, BASE_SEED);
  
  const rentAnnual = baseProfile.housingCostAnnual;
  const rentTotal40 = rentAnnual * 40;
  
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
    
    const totalMortgagePayments = monthlyPayment * 12 * mortgageYears;
    const totalOwnerCosts = ownerAnnualCost * 40;
    const buyTotal40 = purchaseOutflow + totalMortgagePayments + totalOwnerCosts;
    
    let buyProfile: Profile;
    
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
    } else {
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
    
    const buySim = runSimulationWithSeed(buyProfile, BASE_SEED);
    const buySafeAge = computeSafeFireAge(buyProfile, BASE_SEED);
    
    const buyAssetsAt60 = buySim.paths.yearlyData[age60Index]?.assets ?? 0;
    
    results.push({
      type: 'BUY_NOW',
      scenarioProfile: buyProfile,
      simulation: buySim,
      safeFireAge: buySafeAge,
      monthlyPayment: monthlyPayment + ownerAnnualCost / 12,
      totalCost40Years: buyTotal40,
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
