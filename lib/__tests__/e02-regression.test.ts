/**
 * E02: ENGINE_VERSION 1.0.0 リグレッションテスト
 *
 * ベースライン値は docs/e02-baseline-v1.0.0.json の実行結果。
 * スコアが TOLERANCE (±8) 以内であることを検証する。
 * エンジンの前提を変更したら pnpm case-sim → JSON 更新 → ベースライン再確定。
 */
import { describe, it, expect } from 'vitest'
import { runSimulation, createDefaultProfile, ENGINE_VERSION } from '../engine'
import { computeMonthlyPaymentManYen } from '../housing-sim'
import type { Profile, LifeEvent, HousingPurchaseDetails } from '../types'

const TOLERANCE = 8
const RUNS = 5

// ============================================================
// Baseline scores (from docs/e02-baseline-v1.0.0.json)
// ============================================================

interface Baseline {
  score: number
  survivalRate: number
}

const BASELINES: Record<string, Baseline> = {
  'C01-base':         { score: 74, survivalRate: 66 },
  'C01-buy':          { score: 80, survivalRate: 79 },
  'C01-pacedown':     { score: 69, survivalRate: 59 },
  'C01-buy-pacedown': { score: 79, survivalRate: 76 },
  'C06-base':         { score: 68, survivalRate: 55 },
  'C06-buy':          { score: 82, survivalRate: 79 },
  'C11-base':         { score: 79, survivalRate: 74 },
  'C11-buy':          { score: 82, survivalRate: 81 },
  'C04-base':         { score: 66, survivalRate: 55 },
  'C04-abroad':       { score: 72, survivalRate: 66 },
  'C04-inherit':      { score: 69, survivalRate: 60 },
  'C03-base':         { score: 72, survivalRate: 63 },
  'C03-child':        { score: 64, survivalRate: 49 },
  'C03-child-buy':    { score: 71, survivalRate: 61 },
  'C03-nursing':      { score: 69, survivalRate: 59 },
  'C03-child-nursing': { score: 62, survivalRate: 44 },
  'C05-base':         { score: 81, survivalRate: 80 },
  'C05-buy-max':      { score: 86, survivalRate: 90 },
  'C02-base':         { score: 63, survivalRate: 46 },
  'C07-base':         { score: 78, survivalRate: 74 },
  'C08-base':         { score: 61, survivalRate: 42 },
  'C09-base':         { score: 75, survivalRate: 69 },
  'C10-base':         { score: 79, survivalRate: 76 },
  'C12-base':         { score: 76, survivalRate: 71 },
  'C13-base':         { score: 78, survivalRate: 72 },
  'C14-base':         { score: 73, survivalRate: 67 },
  'C15-base':         { score: 83, survivalRate: 81 },
  'C16-base':         { score: 82, survivalRate: 83 },
  'C17-base':         { score: 80, survivalRate: 78 },
  'C18-base':         { score: 76, survivalRate: 64 },
  'C19-base':         { score: 93, survivalRate: 92 },
  'C19-partner-quit': { score: 83, survivalRate: 75 },
  'C20-base':         { score: 76, survivalRate: 71 },
  'C20-rsu-halved':   { score: 73, survivalRate: 65 },
  'C21-base':         { score: 67, survivalRate: 55 },
  'C22-base':         { score: 91, survivalRate: 98 },
  'C23-base':         { score: 89, survivalRate: 85 },
  'C24-base':         { score: 82, survivalRate: 86 },
}

// ============================================================
// Case definitions (mirrors case-catalog-sim.ts)
// ============================================================

interface CaseDef {
  id: string
  husbandAge: number; wifeAge: number
  husbandIncome: number; wifeIncome: number
  rentMonthly: number; totalSavings: number
  targetRetireAge: number
  cashRatio: number; investRatio: number; dcRatio: number
  mode?: 'solo' | 'couple'
  livingCostMonthly?: number
  homeStatus?: 'renter' | 'owner'
  mortgagePrincipal?: number
  mortgageMonthlyPayment?: number
  mortgageYearsRemaining?: number
  ownerAnnualCost?: number
  rsuAnnual?: number
  sideIncomeNet?: number
  expectedReturn?: number
}

const CASES: CaseDef[] = [
  { id: 'C01', husbandAge: 35, wifeAge: 33, husbandIncome: 1600, wifeIncome: 800, rentMonthly: 32, totalSavings: 4000, targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C02', husbandAge: 37, wifeAge: 35, husbandIncome: 1800, wifeIncome: 600, rentMonthly: 30, totalSavings: 3500, targetRetireAge: 48, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C03', husbandAge: 34, wifeAge: 32, husbandIncome: 1500, wifeIncome: 700, rentMonthly: 28, totalSavings: 3000, targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C04', husbandAge: 33, wifeAge: 31, husbandIncome: 1400, wifeIncome: 900, rentMonthly: 29, totalSavings: 5000, targetRetireAge: 45, cashRatio: 0.20, investRatio: 0.70, dcRatio: 0.10 },
  { id: 'C05', husbandAge: 36, wifeAge: 34, husbandIncome: 1700, wifeIncome: 700, rentMonthly: 31, totalSavings: 2800, targetRetireAge: 55, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C06', husbandAge: 32, wifeAge: 30, husbandIncome: 1800, wifeIncome: 600, rentMonthly: 40, totalSavings: 2500, targetRetireAge: 50, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15 },
  { id: 'C07', husbandAge: 35, wifeAge: 33, husbandIncome: 1500, wifeIncome: 500, rentMonthly: 26, totalSavings: 3200, targetRetireAge: 52, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15 },
  { id: 'C08', husbandAge: 38, wifeAge: 36, husbandIncome: 1600, wifeIncome: 600, rentMonthly: 27, totalSavings: 3800, targetRetireAge: 48, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15 },
  { id: 'C09', husbandAge: 34, wifeAge: 32, husbandIncome: 1400, wifeIncome: 800, rentMonthly: 24, totalSavings: 3000, targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C10', husbandAge: 33, wifeAge: 33, husbandIncome: 1500, wifeIncome: 900, rentMonthly: 29, totalSavings: 4500, targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C11', husbandAge: 34, wifeAge: 32, husbandIncome: 1200, wifeIncome: 300, rentMonthly: 18, totalSavings: 2000, targetRetireAge: 55, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15 },
  { id: 'C12', husbandAge: 33, wifeAge: 31, husbandIncome: 1100, wifeIncome: 700, rentMonthly: 22, totalSavings: 2500, targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15 },
  { id: 'C13', husbandAge: 30, wifeAge: 0, husbandIncome: 900, wifeIncome: 0, rentMonthly: 11, totalSavings: 1500, targetRetireAge: 55, cashRatio: 0.35, investRatio: 0.50, dcRatio: 0.15, mode: 'solo' },
  { id: 'C14', husbandAge: 28, wifeAge: 27, husbandIncome: 2200, wifeIncome: 1000, rentMonthly: 35, totalSavings: 3000, targetRetireAge: 45, cashRatio: 0.20, investRatio: 0.65, dcRatio: 0.15 },
  { id: 'C15', husbandAge: 38, wifeAge: 36, husbandIncome: 800, wifeIncome: 400, rentMonthly: 12, totalSavings: 1000, targetRetireAge: 60, cashRatio: 0.35, investRatio: 0.45, dcRatio: 0.20 },
  { id: 'C16', husbandAge: 40, wifeAge: 0, husbandIncome: 1800, wifeIncome: 0, rentMonthly: 20, totalSavings: 8000, targetRetireAge: 50, cashRatio: 0.20, investRatio: 0.70, dcRatio: 0.10, mode: 'solo' },
  { id: 'C17', husbandAge: 35, wifeAge: 33, husbandIncome: 1200, wifeIncome: 800, rentMonthly: 25, totalSavings: 2500, targetRetireAge: 52, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15 },
  // C19-C24: 拡張ペルソナ
  { id: 'C19', husbandAge: 38, wifeAge: 36, husbandIncome: 1600, wifeIncome: 700, rentMonthly: 0, totalSavings: 3500, targetRetireAge: 55, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15, livingCostMonthly: 35, homeStatus: 'owner', mortgagePrincipal: 4000, mortgageMonthlyPayment: 12, mortgageYearsRemaining: 25, ownerAnnualCost: 40 },
  { id: 'C20', husbandAge: 33, wifeAge: 31, husbandIncome: 1800, wifeIncome: 800, rentMonthly: 35, totalSavings: 4500, targetRetireAge: 48, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15, livingCostMonthly: 38, rsuAnnual: 300, sideIncomeNet: 100 },
  { id: 'C21', husbandAge: 35, wifeAge: 33, husbandIncome: 1500, wifeIncome: 700, rentMonthly: 28, totalSavings: 3500, targetRetireAge: 55, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15, livingCostMonthly: 32, expectedReturn: 3 },
  { id: 'C22', husbandAge: 35, wifeAge: 33, husbandIncome: 1500, wifeIncome: 700, rentMonthly: 28, totalSavings: 3500, targetRetireAge: 55, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15, livingCostMonthly: 32, expectedReturn: 7 },
  { id: 'C23', husbandAge: 36, wifeAge: 34, husbandIncome: 1600, wifeIncome: 600, rentMonthly: 26, totalSavings: 4000, targetRetireAge: 55, cashRatio: 0.70, investRatio: 0.20, dcRatio: 0.10, livingCostMonthly: 33 },
  { id: 'C24', husbandAge: 36, wifeAge: 34, husbandIncome: 1600, wifeIncome: 600, rentMonthly: 26, totalSavings: 4000, targetRetireAge: 55, cashRatio: 0.10, investRatio: 0.80, dcRatio: 0.10, livingCostMonthly: 33 },
]

// ============================================================
// Scenario life events (mirrors case-catalog-sim.ts)
// ============================================================

interface ScenarioDef {
  caseId: string
  scenarioId: string
  lifeEvents: Partial<LifeEvent>[]
}

const SCENARIOS: ScenarioDef[] = [
  { caseId: 'C01', scenarioId: 'C01-base', lifeEvents: [] },
  { caseId: 'C01', scenarioId: 'C01-buy', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 8500, isRecurring: false,
      purchaseDetails: { propertyPrice: 8500, downPayment: 1000, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } },
  ]},
  { caseId: 'C01', scenarioId: 'C01-pacedown', lifeEvents: [
    { type: 'income_decrease', name: '転職ペースダウン', age: 40, amount: 320, isRecurring: false, target: 'self' },
  ]},
  { caseId: 'C01', scenarioId: 'C01-buy-pacedown', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 8500, isRecurring: false,
      purchaseDetails: { propertyPrice: 8500, downPayment: 1000, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } },
    { type: 'income_decrease', name: '転職ペースダウン', age: 40, amount: 320, isRecurring: false, target: 'self' },
  ]},
  { caseId: 'C06', scenarioId: 'C06-base', lifeEvents: [] },
  { caseId: 'C06', scenarioId: 'C06-buy', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 35, amount: 8000, isRecurring: false,
      purchaseDetails: { propertyPrice: 8000, downPayment: 800, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } },
  ]},
  { caseId: 'C11', scenarioId: 'C11-base', lifeEvents: [] },
  { caseId: 'C11', scenarioId: 'C11-buy', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 37, amount: 6000, isRecurring: false,
      purchaseDetails: { propertyPrice: 6000, downPayment: 600, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 30 } },
  ]},
  { caseId: 'C04', scenarioId: 'C04-base', lifeEvents: [] },
  { caseId: 'C04', scenarioId: 'C04-abroad', lifeEvents: [
    { type: 'income_increase', name: '海外転職', age: 36, amount: 560, isRecurring: false, target: 'self' },
  ]},
  { caseId: 'C04', scenarioId: 'C04-inherit', lifeEvents: [
    { type: 'asset_gain', name: '相続', age: 45, amount: 2000, isRecurring: false },
  ]},
  { caseId: 'C03', scenarioId: 'C03-base', lifeEvents: [] },
  { caseId: 'C03', scenarioId: 'C03-child', lifeEvents: [
    { type: 'expense_increase', name: '子ども', age: 35, amount: 150, duration: 22, isRecurring: true },
  ]},
  { caseId: 'C03', scenarioId: 'C03-child-buy', lifeEvents: [
    { type: 'expense_increase', name: '子ども', age: 35, amount: 150, duration: 22, isRecurring: true },
    { type: 'housing_purchase', name: '住宅購入', age: 36, amount: 8000, isRecurring: false,
      purchaseDetails: { propertyPrice: 8000, downPayment: 800, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 35 } },
  ]},
  { caseId: 'C03', scenarioId: 'C03-nursing', lifeEvents: [
    { type: 'expense_increase', name: '親の介護', age: 55, amount: 120, duration: 10, isRecurring: true },
  ]},
  { caseId: 'C03', scenarioId: 'C03-child-nursing', lifeEvents: [
    { type: 'expense_increase', name: '子ども', age: 35, amount: 150, duration: 22, isRecurring: true },
    { type: 'expense_increase', name: '親の介護', age: 55, amount: 120, duration: 10, isRecurring: true },
  ]},
  { caseId: 'C05', scenarioId: 'C05-base', lifeEvents: [] },
  { caseId: 'C05', scenarioId: 'C05-buy-max', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 10000, isRecurring: false,
      purchaseDetails: { propertyPrice: 10000, downPayment: 1000, purchaseCostRate: 7, mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 50 } },
  ]},
  { caseId: 'C02', scenarioId: 'C02-base', lifeEvents: [] },
  { caseId: 'C07', scenarioId: 'C07-base', lifeEvents: [] },
  { caseId: 'C08', scenarioId: 'C08-base', lifeEvents: [] },
  { caseId: 'C09', scenarioId: 'C09-base', lifeEvents: [] },
  { caseId: 'C10', scenarioId: 'C10-base', lifeEvents: [] },
  { caseId: 'C12', scenarioId: 'C12-base', lifeEvents: [] },
  { caseId: 'C13', scenarioId: 'C13-base', lifeEvents: [] },
  { caseId: 'C14', scenarioId: 'C14-base', lifeEvents: [] },
  { caseId: 'C15', scenarioId: 'C15-base', lifeEvents: [] },
  { caseId: 'C16', scenarioId: 'C16-base', lifeEvents: [] },
  { caseId: 'C17', scenarioId: 'C17-base', lifeEvents: [] },
  { caseId: 'C18', scenarioId: 'C18-base', lifeEvents: [] },
  // C19: 持ち家ローン残 → パートナー離職リスク
  { caseId: 'C19', scenarioId: 'C19-base', lifeEvents: [] },
  { caseId: 'C19', scenarioId: 'C19-partner-quit', lifeEvents: [
    { type: 'income_decrease', name: '妻離職', age: 40, amount: 700, isRecurring: false, target: 'partner' },
  ]},
  // C20: RSU持ち → RSU半減リスク
  { caseId: 'C20', scenarioId: 'C20-base', lifeEvents: [] },
  { caseId: 'C20', scenarioId: 'C20-rsu-halved', lifeEvents: [
    { type: 'income_decrease', name: 'RSU半減+副業停止', age: 36, amount: 250, isRecurring: false, target: 'self' },
  ]},
  // C21 vs C22: 投資リターン差
  { caseId: 'C21', scenarioId: 'C21-base', lifeEvents: [] },
  { caseId: 'C22', scenarioId: 'C22-base', lifeEvents: [] },
  // C23 vs C24: ポートフォリオ差
  { caseId: 'C23', scenarioId: 'C23-base', lifeEvents: [] },
  { caseId: 'C24', scenarioId: 'C24-base', lifeEvents: [] },
]

// ============================================================
// Profile builders (same logic as case-catalog-sim.ts)
// ============================================================

function estimateLivingCost(householdIncome: number): number {
  if (householdIncome <= 2000) return 360
  if (householdIncome <= 2500) return 420
  return 480
}

function caseToProfile(c: CaseDef): Profile {
  const base = createDefaultProfile()
  const mode = c.mode ?? 'couple'
  const householdIncome = c.husbandIncome + c.wifeIncome

  let livingCostAnnual: number
  if (c.livingCostMonthly != null) {
    livingCostAnnual = c.livingCostMonthly * 12
  } else {
    const rawLivingCost = estimateLivingCost(householdIncome)
    livingCostAnnual = mode === 'solo' ? Math.round(rawLivingCost * 0.7) : rawLivingCost
  }

  let housingCostAnnual: number
  if (c.homeStatus === 'owner') {
    housingCostAnnual = (c.mortgageMonthlyPayment ?? 0) * 12 + (c.ownerAnnualCost ?? 0)
  } else {
    housingCostAnnual = c.rentMonthly * 12
  }

  return {
    ...base,
    currentAge: c.husbandAge,
    targetRetireAge: c.targetRetireAge,
    mode,
    grossIncome: c.husbandIncome,
    partnerGrossIncome: c.wifeIncome,
    rsuAnnual: c.rsuAnnual ?? 0,
    partnerRsuAnnual: 0,
    sideIncomeNet: c.sideIncomeNet ?? 0,
    housingCostAnnual,
    livingCostAnnual,
    homeStatus: c.homeStatus ?? 'renter',
    homeMarketValue: c.homeStatus === 'owner' ? 9000 : 0, // C19 propertyMid
    mortgagePrincipal: c.mortgagePrincipal ?? 0,
    mortgageInterestRate: 1.0,
    mortgageYearsRemaining: c.mortgageYearsRemaining ?? 0,
    mortgageMonthlyPayment: c.mortgageMonthlyPayment ?? 0,
    assetCash: Math.round(c.totalSavings * c.cashRatio),
    assetInvest: Math.round(c.totalSavings * c.investRatio),
    assetDefinedContributionJP: Math.round(c.totalSavings * c.dcRatio),
    dcContributionAnnual: 66,
    expectedReturn: c.expectedReturn ?? 5,
    inflationRate: 2,
    rentInflationRate: 0.5,
    volatility: 0.15,
    effectiveTaxRate: 25,
    useAutoTaxRate: true,
    retireSpendingMultiplier: 0.8,
    retirePassiveIncome: 0,
    lifeEvents: [],
  }
}

function buildC18Profile(): Profile {
  const c18PropertyValue = 8000
  const c18MortgageRemaining = 6000
  const c18MortgageRate = 0.7
  const c18MortgageYearsRemaining = 25
  const c18OwnerAnnualCost = 80
  const c18TotalSavings = 3000
  const ownerMonthly = computeMonthlyPaymentManYen(
    c18MortgageRemaining, c18MortgageRate, c18MortgageYearsRemaining
  )
  return {
    ...createDefaultProfile(),
    currentAge: 42,
    targetRetireAge: 55,
    mode: 'couple',
    grossIncome: 1500,
    partnerGrossIncome: 600,
    rsuAnnual: 0,
    partnerRsuAnnual: 0,
    sideIncomeNet: 0,
    housingCostAnnual: ownerMonthly * 12 + c18OwnerAnnualCost,
    livingCostAnnual: estimateLivingCost(2100),
    homeStatus: 'owner',
    homeMarketValue: c18PropertyValue,
    mortgagePrincipal: c18MortgageRemaining,
    mortgageInterestRate: c18MortgageRate,
    mortgageYearsRemaining: c18MortgageYearsRemaining,
    mortgageMonthlyPayment: ownerMonthly,
    assetCash: Math.round(c18TotalSavings * 0.30),
    assetInvest: Math.round(c18TotalSavings * 0.55),
    assetDefinedContributionJP: Math.round(c18TotalSavings * 0.15),
    dcContributionAnnual: 66,
    expectedReturn: 5,
    inflationRate: 2,
    rentInflationRate: 0.5,
    volatility: 0.15,
    effectiveTaxRate: 25,
    useAutoTaxRate: true,
    retireSpendingMultiplier: 0.8,
    retirePassiveIncome: 0,
    lifeEvents: [],
  }
}

function buildScenarioProfile(scenario: ScenarioDef): Profile {
  let profile: Profile

  if (scenario.caseId === 'C18') {
    profile = buildC18Profile()
  } else {
    const caseDef = CASES.find(c => c.id === scenario.caseId)!
    profile = caseToProfile(caseDef)
  }

  const lifeEvents: LifeEvent[] = scenario.lifeEvents.map((e, i) => ({
    id: `regression-${i}`,
    type: e.type!,
    name: e.name!,
    age: e.age!,
    amount: e.amount!,
    duration: e.duration,
    isRecurring: e.isRecurring!,
    target: e.target,
    purchaseDetails: e.purchaseDetails,
  }))

  return { ...profile, lifeEvents }
}

async function runAverage(profile: Profile): Promise<{ score: number; survivalRate: number }> {
  const results = await Promise.all(
    Array.from({ length: RUNS }, () => runSimulation(profile))
  )
  return {
    score: Math.round(
      results.reduce((sum, r) => sum + r.score.overall, 0) / results.length
    ),
    survivalRate: Math.round(
      results.reduce((sum, r) => sum + r.metrics.survivalRate, 0) / results.length
    ),
  }
}

// ============================================================
// Tests
// ============================================================

describe('E02 Regression — ENGINE_VERSION 1.0.0', () => {
  it('ENGINE_VERSION が 1.0.0 である', () => {
    expect(ENGINE_VERSION).toBe('1.0.0')
  })

  it('全シナリオがベースラインに含まれている', () => {
    for (const s of SCENARIOS) {
      expect(BASELINES).toHaveProperty(s.scenarioId)
    }
  })

  // 38シナリオを動的生成
  for (const scenario of SCENARIOS) {
    const expected = BASELINES[scenario.scenarioId]
    if (!expected) continue

    it(`${scenario.scenarioId}: score=${expected.score} ±${TOLERANCE}`, async () => {
      const profile = buildScenarioProfile(scenario)
      const result = await runAverage(profile)

      expect(result.score).toBeGreaterThanOrEqual(expected.score - TOLERANCE)
      expect(result.score).toBeLessThanOrEqual(expected.score + TOLERANCE)
    })
  }
})
