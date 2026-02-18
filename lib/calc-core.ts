/**
 * calc-core.ts — engine.ts と housing-sim.ts の共通計算ロジック
 *
 * engine.ts から抽出。housing-sim.ts からも同じ関数を使うことで
 * 計算ロジックの乖離を防ぐ。
 */

import type { Profile, LifeEvent, HomeStatus } from './types';

export const MAX_AGE = 100;

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
  const pension = Math.min(grossIncome, 780) * 0.0915;
  const health = Math.min(grossIncome, 1390) * 0.05;
  const employment = grossIncome * 0.006;
  const socialInsurance = pension + health + employment;

  // --- 3. 基礎控除 (高所得者は段階的に縮小) ---
  const totalIncome = grossIncome - employmentDeduction;
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
 * ライフイベントを考慮した加入期間の平均年収を計算する。
 * 年金の報酬比例部分は加入期間全体の平均標準報酬月額で決まるため、
 * 途中の収入変動を加重平均で反映させる。
 */
function calculateAverageGrossIncome(
  baseGrossIncome: number,
  lifeEvents: LifeEvent[],
  currentAge: number,
  retireAge: number,
  target: 'self' | 'partner'
): number {
  const CAREER_START_AGE = 22;
  const pensionEndAge = Math.min(retireAge, 60);
  const totalYears = Math.max(0, pensionEndAge - CAREER_START_AGE);
  if (totalYears === 0) return baseGrossIncome;

  let totalIncome = 0;

  for (let age = CAREER_START_AGE; age < pensionEndAge; age++) {
    let yearlyIncome = baseGrossIncome;

    // currentAge 以降のみライフイベントを適用
    if (age >= currentAge) {
      for (const event of lifeEvents) {
        const eventTarget = event.target || 'self';
        if (eventTarget !== target) continue;
        if (event.type !== 'income_increase' && event.type !== 'income_decrease') continue;

        if (age >= event.age) {
          const endAge = event.duration ? event.age + event.duration : 999;
          if (age < endAge) {
            if (event.type === 'income_increase') {
              yearlyIncome += event.amount;
            } else {
              yearlyIncome -= event.amount;
            }
          }
        }
      }
    }

    totalIncome += Math.max(0, yearlyIncome);
  }

  return totalIncome / totalYears;
}

function calculatePersonPension(grossIncome: number, retireAge: number): number {
  if (grossIncome <= 0) return 0;

  const contributionYears = Math.max(0, Math.min(retireAge, 60) - 20);
  const cappedYears = Math.min(contributionYears, 40);
  const contributionMonths = cappedYears * 12;

  const basicPension = 80 * cappedYears / 40;
  const avgMonthly = Math.min(grossIncome / 12, 65);
  const proportional = avgMonthly * 5.481 / 1000 * contributionMonths;

  return Math.round(basicPension + proportional);
}

/**
 * 世帯の年間年金額を計算する（万円/年）。
 * 本人 + 配偶者（coupleモードの場合）をそれぞれ個別計算。
 * ライフイベントによる収入変動を加入期間の加重平均年収に反映する。
 */
export function calculateAnnualPension(profile: Profile): number {
  const selfAvg = calculateAverageGrossIncome(
    profile.grossIncome + profile.rsuAnnual,
    profile.lifeEvents,
    profile.currentAge,
    profile.targetRetireAge,
    'self'
  );
  let total = calculatePersonPension(selfAvg, profile.targetRetireAge);

  if (profile.mode === 'couple') {
    const partnerAvg = calculateAverageGrossIncome(
      profile.partnerGrossIncome + profile.partnerRsuAnnual,
      profile.lifeEvents,
      profile.currentAge,
      profile.targetRetireAge,
      'partner'
    );
    total += calculatePersonPension(partnerAvg, profile.targetRetireAge);
  }
  return total;
}

// ============================================================
// Income Calculation (Step 1-B)
// ============================================================

/**
 * ライフイベントによる収入増減を target(self/partner) ごとに計算する。
 */
export function calculateIncomeAdjustment(
  lifeEvents: LifeEvent[],
  age: number,
  target: 'self' | 'partner'
): number {
  let adjustment = 0;
  for (const event of lifeEvents) {
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

/**
 * ライフイベントからの賃貸収入を計算する（退職前後とも適用）。
 */
export function calculateRentalIncome(lifeEvents: LifeEvent[], age: number): number {
  let rental = 0;
  for (const event of lifeEvents) {
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

/**
 * 指定年齢の世帯手取り収入を計算する。
 * engine.ts の calculateNetIncome() と完全に同じロジック。
 */
export function calculateNetIncomeForAge(profile: Profile, age: number): number {
  const isRetired = age >= profile.targetRetireAge;
  const rentalIncome = calculateRentalIncome(profile.lifeEvents, age);

  if (isRetired) {
    // Post-retirement: pension (from age 65) + passive income + rental income + business income
    const pensionAge = 65;
    const pension = age >= pensionAge ? calculateAnnualPension(profile) : 0;

    // 退職後事業収入（顧問・コンサル等）: postRetireIncomeEndAge まで、実効税率20%固定
    const postRetireGross = (profile.postRetireIncome ?? 0);
    const postRetireEndAge = (profile.postRetireIncomeEndAge ?? 75);
    const postRetireNet = (postRetireGross > 0 && age < postRetireEndAge)
      ? postRetireGross * 0.8
      : 0;

    return pension + profile.retirePassiveIncome + rentalIncome + postRetireNet;
  }

  // Pre-retirement: gross income + income events → per-person tax
  const selfAdj = calculateIncomeAdjustment(profile.lifeEvents, age, 'self');

  const mainGross = Math.max(0, profile.grossIncome + profile.rsuAnnual + profile.sideIncomeNet + selfAdj);
  const mainRate = profile.useAutoTaxRate
    ? calculateEffectiveTaxRate(mainGross)
    : profile.effectiveTaxRate;
  let netIncome = mainGross * (1 - mainRate / 100);

  if (profile.mode === 'couple') {
    const partnerAdj = calculateIncomeAdjustment(profile.lifeEvents, age, 'partner');
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

// ============================================================
// Expense Calculation (Step 1-C)
// ============================================================

/**
 * 指定年齢の年間支出を計算する。
 * engine.ts の calculateExpenses() と完全に同じロジック。
 *
 * housingOverrides: 住宅購入後のローン+管理費で上書きする場合に渡す
 */
export function calculateExpensesForAge(
  profile: Profile,
  age: number,
  inflationFactor: number = 1,
  housingOverrides?: { homeStatus: HomeStatus; housingCostAnnual: number }
): number {
  const isRetired = age >= profile.targetRetireAge;

  // Housing cost: rent inflates at rentInflationRate, mortgage stays nominal
  const homeStatus = housingOverrides?.homeStatus ?? profile.homeStatus;
  const housingCostBase = housingOverrides?.housingCostAnnual ?? profile.housingCostAnnual;
  const isOwner = homeStatus === 'owner' || homeStatus === 'relocating';
  const yearsElapsed = age - profile.currentAge;
  const rentInflation = profile.rentInflationRate ?? profile.inflationRate;
  const rentInflationFactor = Math.pow(1 + rentInflation / 100, yearsElapsed);
  const housingCost = isOwner
    ? housingCostBase                         // Mortgage+maintenance: nominal fixed
    : housingCostBase * rentInflationFactor;  // Rent: inflates at rentInflationRate

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

// ============================================================
// Asset Events (Step 1-D)
// ============================================================

/**
 * 指定年齢の一時的な資産増イベント合計を計算する（相続・退職金・贈与等）。
 */
export function calculateAssetGainForAge(lifeEvents: LifeEvent[], age: number): number {
  let assetGain = 0;
  for (const event of lifeEvents) {
    if (event.type === 'asset_gain' && age === event.age) {
      assetGain += event.amount;
    }
  }
  return assetGain;
}
