// Exit Readiness OS - Simulation Engine
// Monte Carlo simulation for financial planning

import type { 
  Profile, 
  SimulationResult, 
  AssetPoint, 
  SimulationPath,
  KeyMetrics,
  CashFlowBreakdown,
  ExitScoreDetail
} from './types';
import { getScoreLevel } from './types';

const SIMULATION_RUNS = 1000;
const MAX_AGE = 100;

// ============================================================
// Validation
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

/** プロファイルの入力値をバリデーションする */
export function validateProfile(profile: Profile): ValidationError[] {
  const errors: ValidationError[] = [];

  // currentAge: 0〜99 の整数
  if (!Number.isInteger(profile.currentAge) || profile.currentAge < 0 || profile.currentAge > 99) {
    errors.push({ field: 'currentAge', message: '年齢は0〜99の整数で入力してください' });
  }

  // targetRetireAge: currentAge 以上、100 以下
  if (profile.targetRetireAge < profile.currentAge || profile.targetRetireAge > 100) {
    errors.push({ field: 'targetRetireAge', message: `目標退職年齢は${profile.currentAge}〜100の範囲で入力してください` });
  }

  // grossIncome: 0 以上
  if (profile.grossIncome < 0) {
    errors.push({ field: 'grossIncome', message: '年収は0以上で入力してください' });
  }

  // livingCostAnnual: 0 以上
  if (profile.livingCostAnnual < 0) {
    errors.push({ field: 'livingCostAnnual', message: '生活費は0以上で入力してください' });
  }

  // housingCostAnnual: 0 以上
  if (profile.housingCostAnnual < 0) {
    errors.push({ field: 'housingCostAnnual', message: '住居費は0以上で入力してください' });
  }

  // Assets: 0 以上
  if (profile.assetCash < 0) {
    errors.push({ field: 'assetCash', message: '現金資産は0以上で入力してください' });
  }
  if (profile.assetInvest < 0) {
    errors.push({ field: 'assetInvest', message: '投資資産は0以上で入力してください' });
  }
  if (profile.assetDefinedContributionJP < 0) {
    errors.push({ field: 'assetDefinedContributionJP', message: '確定拠出年金は0以上で入力してください' });
  }

  // expectedReturn: -50〜100
  if (profile.expectedReturn < -50 || profile.expectedReturn > 100) {
    errors.push({ field: 'expectedReturn', message: '期待リターンは-50〜100の範囲で入力してください' });
  }

  // inflationRate: -10〜30
  if (profile.inflationRate < -10 || profile.inflationRate > 30) {
    errors.push({ field: 'inflationRate', message: 'インフレ率は-10〜30の範囲で入力してください' });
  }

  // volatility: 0〜1
  if (profile.volatility < 0 || profile.volatility > 1) {
    errors.push({ field: 'volatility', message: 'ボラティリティは0〜1の範囲で入力してください' });
  }

  // effectiveTaxRate: 0〜100
  if (profile.effectiveTaxRate < 0 || profile.effectiveTaxRate > 100) {
    errors.push({ field: 'effectiveTaxRate', message: '実効税率は0〜100の範囲で入力してください' });
  }

  // retireSpendingMultiplier: 0〜2
  if (profile.retireSpendingMultiplier < 0 || profile.retireSpendingMultiplier > 2) {
    errors.push({ field: 'retireSpendingMultiplier', message: '退職後支出倍率は0〜2の範囲で入力してください' });
  }

  return errors;
}

// ============================================================
// Tax Calculation (Japanese tax system, simplified)
// ============================================================

/**
 * 年収（万円）から実効税率（%）を自動計算する。
 * 所得税（累進）+ 復興特別所得税 + 住民税（10%）+ 社会保険料の合算。
 * FP 完璧ではないが、年収800万〜3000万帯で±2%の精度。
 */
export function calculateEffectiveTaxRate(grossIncome: number): number {
  if (grossIncome <= 0) return 0;

  // --- 1. 給与所得控除 (2024年基準) ---
  let employmentDeduction: number;
  if (grossIncome <= 162.5) {
    employmentDeduction = 55;
  } else if (grossIncome <= 180) {
    employmentDeduction = grossIncome * 0.4 - 10;
  } else if (grossIncome <= 360) {
    employmentDeduction = grossIncome * 0.3 + 8;
  } else if (grossIncome <= 660) {
    employmentDeduction = grossIncome * 0.2 + 44;
  } else if (grossIncome <= 850) {
    employmentDeduction = grossIncome * 0.1 + 110;
  } else {
    employmentDeduction = 195; // 上限
  }

  // --- 2. 社会保険料 ---
  // 厚生年金: 9.15% (標準報酬月額65万＝年収780万で上限)
  const pension = Math.min(grossIncome, 780) * 0.0915;
  // 健康保険: 5% (標準報酬月額上限 ≈ 年収1390万)
  const health = Math.min(grossIncome, 1390) * 0.05;
  // 雇用保険: 0.6%
  const employment = grossIncome * 0.006;
  const socialInsurance = pension + health + employment;

  // --- 3. 基礎控除 (高所得者は段階的に縮小) ---
  const totalIncome = grossIncome - employmentDeduction; // 合計所得金額
  let basicDeduction: number;
  if (totalIncome <= 2400) {
    basicDeduction = 48;
  } else if (totalIncome <= 2450) {
    basicDeduction = 32;
  } else if (totalIncome <= 2500) {
    basicDeduction = 16;
  } else {
    basicDeduction = 0;
  }

  // --- 4. 課税所得 ---
  const taxableIncome = Math.max(0, grossIncome - employmentDeduction - basicDeduction - socialInsurance);

  // --- 5. 所得税 (累進課税) ---
  let incomeTax = 0;
  const brackets: [number, number][] = [
    [195, 0.05],
    [330, 0.10],
    [695, 0.20],
    [900, 0.23],
    [1800, 0.33],
    [4000, 0.40],
    [Infinity, 0.45],
  ];
  let prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, limit) - prev;
    incomeTax += taxable * rate;
    prev = limit;
  }
  // 復興特別所得税 2.1%
  incomeTax *= 1.021;

  // --- 6. 住民税 (10%) ---
  const residentTax = taxableIncome * 0.10;

  // --- 7. 実効税率 ---
  const totalTax = incomeTax + residentTax + socialInsurance;
  return (totalTax / grossIncome) * 100;
}

/**
 * プロファイルから推定実効税率を取得する。
 * useAutoTaxRate=true の場合は自動計算、false の場合は手動入力値を返す。
 */
export function getEstimatedTaxRates(profile: Profile): { main: number; partner: number; combined: number } {
  const mainGross = profile.grossIncome + profile.rsuAnnual + profile.sideIncomeNet;
  const partnerGross = profile.partnerGrossIncome + profile.partnerRsuAnnual;

  if (!profile.useAutoTaxRate) {
    return {
      main: profile.effectiveTaxRate,
      partner: profile.effectiveTaxRate,
      combined: profile.effectiveTaxRate,
    };
  }

  const mainRate = mainGross > 0 ? calculateEffectiveTaxRate(mainGross) : 0;
  const partnerRate = partnerGross > 0 ? calculateEffectiveTaxRate(partnerGross) : 0;

  // Weighted average for display
  const totalGross = mainGross + partnerGross;
  const combined = totalGross > 0
    ? (mainGross * mainRate + partnerGross * partnerRate) / totalGross
    : 0;

  return { main: mainRate, partner: partnerRate, combined };
}

// ============================================================
// Pension Calculation
// ============================================================

/**
 * 個人の年金額を年収・退職年齢から概算する（万円/年）。
 * 加入期間 = 20歳〜min(retireAge, 60) （最大40年）
 * 基礎年金: 80万/年 × (加入年数/40)
 * 厚生年金: 平均標準報酬月額 × 5.481/1000 × 加入月数
 * 標準報酬月額上限: 65万（年収780万相当）
 * キャリア平均年収 ≈ 現在年収 × 0.75（若年期の低収入を考慮）
 */
function calculatePersonPension(grossIncome: number, retireAge: number): number {
  if (grossIncome <= 0) return 0;

  // 加入期間: 20歳〜min(retireAge, 60), 最大40年
  const contributionYears = Math.max(0, Math.min(retireAge, 60) - 20);
  const cappedYears = Math.min(contributionYears, 40);
  const contributionMonths = cappedYears * 12;

  // 基礎年金: 80万/年（満額）× 加入年数/40
  const basicPension = 80 * cappedYears / 40;

  // 厚生年金 報酬比例部分:
  // 平均標準報酬額 = 現在年収 × 0.75（キャリア平均）
  // 標準報酬月額上限 = 65万（年収780万 ÷ 12）
  const careerAvgAnnual = grossIncome * 0.75;
  const avgMonthly = Math.min(careerAvgAnnual / 12, 65);
  const proportional = avgMonthly * 5.481 / 1000 * contributionMonths;

  return Math.round(basicPension + proportional);
}

/**
 * 世帯の年間年金額を計算する（万円/年）。
 * 本人 + 配偶者（coupleモードの場合）をそれぞれ個別計算。
 * 加入期間は退職年齢（targetRetireAge）に基づく。
 * TODO: パートナーの収入イベントによる年金額への影響は未対応（プロファイル初期年収ベース）
 */
export function calculateAnnualPension(profile: Profile): number {
  let total = calculatePersonPension(profile.grossIncome, profile.targetRetireAge);
  if (profile.mode === 'couple') {
    total += calculatePersonPension(profile.partnerGrossIncome, profile.targetRetireAge);
  }
  return total;
}

// ============================================================
// Simulation Helpers
// ============================================================

// Generate random return using normal distribution (Box-Muller transform)
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Calculate income adjustment from life events at a given age, filtered by target
function calculateIncomeAdjustment(profile: Profile, age: number, target: 'self' | 'partner'): number {
  let adjustment = 0;
  for (const event of profile.lifeEvents) {
    const eventTarget = event.target || 'self';
    if (eventTarget !== target) continue;
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

// Calculate rental income from life events at a given age (applies pre- and post-retirement)
function calculateRentalIncome(profile: Profile, age: number): number {
  let rental = 0;
  for (const event of profile.lifeEvents) {
    if (event.type !== 'rental_income') continue;
    if (age >= event.age) {
      const endAge = event.duration ? event.age + event.duration : MAX_AGE;
      if (age < endAge) {
        rental += event.amount;
      }
    }
  }
  return rental;
}

// Calculate net income after tax (per-person tax, pension, income events)
function calculateNetIncome(profile: Profile, age: number): number {
  const isRetired = age >= profile.targetRetireAge;
  const rentalIncome = calculateRentalIncome(profile, age);

  if (isRetired) {
    // Post-retirement: pension (from age 65) + passive income + rental income
    const pensionAge = 65;
    const pension = age >= pensionAge ? calculateAnnualPension(profile) : 0;
    return pension + profile.retirePassiveIncome + rentalIncome;
  }

  // Pre-retirement: gross income + income events → per-person tax
  const selfAdj = calculateIncomeAdjustment(profile, age, 'self');

  const mainGross = Math.max(0, profile.grossIncome + profile.rsuAnnual + profile.sideIncomeNet + selfAdj);
  const mainRate = profile.useAutoTaxRate
    ? calculateEffectiveTaxRate(mainGross)
    : profile.effectiveTaxRate;
  let netIncome = mainGross * (1 - mainRate / 100);

  if (profile.mode === 'couple') {
    const partnerAdj = calculateIncomeAdjustment(profile, age, 'partner');
    const partnerGross = Math.max(0, profile.partnerGrossIncome + profile.partnerRsuAnnual + partnerAdj);
    const partnerRate = profile.useAutoTaxRate
      ? calculateEffectiveTaxRate(partnerGross)
      : profile.effectiveTaxRate;
    netIncome += partnerGross * (1 - partnerRate / 100);
  }

  // Add rental income (separate from employment income, applies as net)
  netIncome += rentalIncome;

  return netIncome;
}

// Calculate annual expenses with inflation
// inflationFactor: (1 + rate)^yearsElapsed — applied to living costs & rent, not mortgage
function calculateExpenses(profile: Profile, age: number, inflationFactor: number = 1): number {
  const isRetired = age >= profile.targetRetireAge;

  // Housing cost: rent inflates at rentInflationRate, mortgage stays nominal
  const isOwner = profile.homeStatus === 'owner' || profile.homeStatus === 'relocating';
  const yearsElapsed = age - profile.currentAge;
  const rentInflation = profile.rentInflationRate ?? profile.inflationRate;
  const rentInflationFactor = Math.pow(1 + rentInflation / 100, yearsElapsed);
  const housingCost = isOwner
    ? profile.housingCostAnnual                         // Mortgage: nominal fixed
    : profile.housingCostAnnual * rentInflationFactor;  // Rent: inflates at rentInflationRate

  // Living costs inflate
  let baseExpenses = profile.livingCostAnnual * inflationFactor + housingCost;

  // Life event amounts also inflate (they're defined in today's 万円)
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

  // Retired lifestyle adjustment (applied after inflation)
  if (isRetired) {
    baseExpenses *= profile.retireSpendingMultiplier;
  }

  return Math.max(0, baseExpenses);
}

// Run a single simulation path
function runSingleSimulation(profile: Profile): AssetPoint[] {
  const path: AssetPoint[] = [];

  // Initial assets
  let totalAssets = profile.assetCash + profile.assetInvest + profile.assetDefinedContributionJP;

  // Nominal return (inflation is now reflected in expenses, not subtracted from returns)
  const nominalReturn = profile.expectedReturn / 100;
  const inflationRate = profile.inflationRate / 100;

  for (let age = profile.currentAge; age <= MAX_AGE; age++) {
    // Record current state
    path.push({ age, assets: Math.round(totalAssets) });

    // Inflation factor: compound from start year
    const yearsElapsed = age - profile.currentAge;
    const inflationFactor = Math.pow(1 + inflationRate, yearsElapsed);

    // Calculate cash flow for this year
    const income = calculateNetIncome(profile, age);
    const expenses = calculateExpenses(profile, age, inflationFactor);
    const netCashFlow = income - expenses;

    // Add DC contribution if working
    const dcContrib = age < profile.targetRetireAge ? profile.dcContributionAnnual : 0;

    // Apply investment return with volatility (nominal)
    const yearReturn = randomNormal(nominalReturn, profile.volatility);
    const investmentGain = totalAssets * yearReturn;

    // Update total assets
    totalAssets = totalAssets + netCashFlow + dcContrib + investmentGain;

    // Assets can go negative (debt), but we track it
    if (totalAssets < -10000) {
      // Cap negative at -1億 for practical purposes
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

// Calculate key metrics from simulation results
function calculateMetrics(allPaths: AssetPoint[][], profile: Profile): KeyMetrics {
  // Survival rate: % of paths that never go negative
  const survivingPaths = allPaths.filter(path => 
    path.every(point => point.assets >= 0)
  );
  const survivalRate = (survivingPaths.length / allPaths.length) * 100;
  
  // Asset at 100 (median)
  const medianPath = getPercentilePath(allPaths, 50);
  const assetAt100 = medianPath[medianPath.length - 1]?.assets ?? 0;
  
  // FIRE age calculation (when 4% SWR covers inflated expenses at that age)
  let fireAge: number | null = null;
  const inflationRate = profile.inflationRate / 100;
  const safeWithdrawalRate = 0.04; // 4% rule

  for (const point of medianPath) {
    const yearsElapsed = point.age - profile.currentAge;
    const inflationFactor = Math.pow(1 + inflationRate, yearsElapsed);
    const expensesAtAge = calculateExpenses(profile, point.age, inflationFactor);
    if (point.assets * safeWithdrawalRate >= expensesAtAge) {
      fireAge = point.age;
      break;
    }
  }
  
  return {
    fireAge,
    assetAt100,
    survivalRate,
    yearsToFire: fireAge ? fireAge - profile.currentAge : null
  };
}

// Calculate post-retirement cash flow breakdown (at retirement age, with inflation)
function calculateCashFlow(profile: Profile): CashFlowBreakdown {
  const retireAge = profile.targetRetireAge;
  const pensionAge = 65;

  // Inflation factor at retirement
  const yearsToRetire = retireAge - profile.currentAge;
  const inflationFactor = Math.pow(1 + profile.inflationRate / 100, yearsToRetire);

  // Simplified cash flow at retirement
  const income = profile.retirePassiveIncome;
  const pension = retireAge >= pensionAge ? calculateAnnualPension(profile) : 0;
  const dividends = (profile.assetInvest * 0.03); // Assume 3% dividend yield
  const expenses = calculateExpenses(profile, retireAge, inflationFactor);
  
  return {
    income,
    pension,
    dividends,
    expenses,
    netCashFlow: income + pension + dividends - expenses
  };
}

// Safe number helper: replace NaN/Infinity with fallback
function safeNum(value: number, fallback: number = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

// Calculate Exit Readiness Score
export function computeExitScore(metrics: KeyMetrics, profile: Profile, paths: SimulationPath): ExitScoreDetail {
  // Guard: if metrics or paths are missing/invalid, return safe defaults
  if (!metrics || !paths || !paths.yearlyData || paths.yearlyData.length === 0) {
    return {
      overall: 0,
      level: getScoreLevel(0),
      survival: 0,
      lifestyle: 0,
      risk: 0,
      liquidity: 0,
    };
  }

  // Survival score (0-100)
  const survival = Math.min(100, safeNum(metrics.survivalRate));

  // Lifestyle score: based on projected assets at retirement age
  const yearsToRetire = profile.targetRetireAge - profile.currentAge;
  const retireInflation = Math.pow(1 + profile.inflationRate / 100, yearsToRetire);
  const targetExpenses = calculateExpenses(profile, profile.targetRetireAge, retireInflation);
  const retireIndex = Math.max(0, Math.min(yearsToRetire, paths.yearlyData.length - 1));
  const retireAssets = paths.yearlyData[retireIndex]?.assets ?? 0;
  const yearsOfExpenses = retireAssets > 0 ? safeNum(retireAssets / targetExpenses) : 0;
  const lifestyle = Math.min(100, yearsOfExpenses * 5); // 20 years = 100%

  // Risk score: inverse of volatility exposure (include home equity as non-volatile asset)
  const homeEquity = (profile.homeStatus === 'owner' || profile.homeStatus === 'relocating')
    ? Math.max(0, (profile.homeMarketValue ?? 0) - (profile.mortgagePrincipal ?? 0))
    : 0;
  const riskExposure = profile.assetInvest / (profile.assetCash + profile.assetInvest + homeEquity + 1);
  const risk = Math.max(0, safeNum(100 - riskExposure * profile.volatility * 500));

  // Liquidity score: projected assets at 5 years as months of expenses
  const projIndex = Math.min(5, paths.yearlyData.length - 1);
  const projectedAssets = paths.yearlyData[projIndex]?.assets ?? 0;
  const annualExpenses = targetExpenses > 0 ? targetExpenses : 1;
  const monthsOfExpenses = projectedAssets > 0 ? (projectedAssets / (annualExpenses / 12)) : 0;
  const liquidity = Math.min(100, safeNum(monthsOfExpenses * (100 / 60))); // 60 months = 100%

  // Overall score (weighted average)
  const rawOverall = survival * 0.55 + lifestyle * 0.20 + risk * 0.15 + liquidity * 0.10;
  const overall = Math.max(0, Math.min(100, Math.round(safeNum(rawOverall))));

  return {
    overall,
    level: getScoreLevel(overall),
    survival: Math.round(survival),
    lifestyle: Math.round(lifestyle),
    risk: Math.round(risk),
    liquidity: Math.round(liquidity)
  };
}

// Main simulation function
export async function runSimulation(profile: Profile): Promise<SimulationResult> {
  // Input validation
  const validationErrors = validateProfile(profile);
  if (validationErrors.length > 0) {
    const messages = validationErrors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`プロファイルのバリデーションエラー: ${messages}`);
  }

  try {
    // Run Monte Carlo simulations
    const allPaths: AssetPoint[][] = [];

    for (let i = 0; i < SIMULATION_RUNS; i++) {
      allPaths.push(runSingleSimulation(profile));
    }

    // Calculate percentile paths
    const medianPath = getPercentilePath(allPaths, 50);
    const optimisticPath = getPercentilePath(allPaths, 90);
    const pessimisticPath = getPercentilePath(allPaths, 10);
    const p25Path = getPercentilePath(allPaths, 25);
    const p75Path = getPercentilePath(allPaths, 75);

    const paths: SimulationPath = {
      yearlyData: medianPath,
      upperPath: optimisticPath,
      lowerPath: pessimisticPath,
      p25Path,
      p75Path,
      // Number arrays for chart components
      median: medianPath.map(p => p.assets),
      optimistic: optimisticPath.map(p => p.assets),
      pessimistic: pessimisticPath.map(p => p.assets),
    };

    // Sanitize NaN/Infinity in paths
    for (const point of paths.yearlyData) {
      point.assets = safeNum(point.assets);
    }
    for (const point of paths.upperPath) {
      point.assets = safeNum(point.assets);
    }
    for (const point of paths.lowerPath) {
      point.assets = safeNum(point.assets);
    }
    for (const point of paths.p25Path) {
      point.assets = safeNum(point.assets);
    }
    for (const point of paths.p75Path) {
      point.assets = safeNum(point.assets);
    }

    // Calculate metrics
    const metrics = calculateMetrics(allPaths, profile);
    metrics.survivalRate = safeNum(metrics.survivalRate);
    metrics.assetAt100 = safeNum(metrics.assetAt100);

    // Calculate cash flow
    const cashFlow = calculateCashFlow(profile);

    // Calculate score
    const score = computeExitScore(metrics, profile, paths);

    return {
      paths,
      metrics,
      cashFlow,
      score
    };
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof Error && error.message.startsWith('プロファイルのバリデーション')) {
      throw error;
    }
    // Wrap unexpected errors with context
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`シミュレーション実行中にエラーが発生しました: ${message}`);
  }
}

// Create default profile
export function createDefaultProfile(): Profile {
  return {
    currentAge: 35,
    targetRetireAge: 55,
    mode: 'solo',
    
    grossIncome: 1200,
    rsuAnnual: 0,
    sideIncomeNet: 0,
    partnerGrossIncome: 0,
    partnerRsuAnnual: 0,
    
    livingCostAnnual: 360,
    housingCostAnnual: 180,
    
    homeStatus: 'renter',
    homeMarketValue: 0,
    mortgagePrincipal: 0,
    mortgageInterestRate: 1.0,
    mortgageYearsRemaining: 0,
    mortgageMonthlyPayment: 0,
    
    assetCash: 500,
    assetInvest: 2000,
    assetDefinedContributionJP: 300,
    dcContributionAnnual: 66,
    
    expectedReturn: 5,
    inflationRate: 2,
    rentInflationRate: 0.5,
    volatility: 0.15,
    
    effectiveTaxRate: 25,
    useAutoTaxRate: true,
    retireSpendingMultiplier: 0.8,
    retirePassiveIncome: 0,
    
    lifeEvents: []
  };
}
