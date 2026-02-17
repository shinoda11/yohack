// ケース台帳シミュレーション (C01-C18) + ライフイベントシナリオ
// ENGINE_VERSION 1.0.0 ベースライン確定用
//
// 出力:
//   docs/case-catalog-results.md    — 人間可読（賃貸 vs 購入 比較表）
//   docs/e02-baseline-v1.0.0.json   — 機械可読（リグレッションテスト用）
//   docs/e02-baseline-v1.0.0.md     — 人間可読（シナリオ別結果）

import { runSimulation, createDefaultProfile, ENGINE_VERSION } from '../lib/engine'
import { runHousingScenarios, computeMonthlyPaymentManYen, type BuyNowParams, type RateStep } from '../lib/housing-sim'
import type { Profile, LifeEventType, HousingPurchaseDetails, LifeEvent } from '../lib/types'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 5回実行で分散を抑える
const RUNS = 5

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface CaseDefinition {
  id: string
  name: string
  husbandAge: number
  wifeAge: number
  husbandIncome: number   // 万円/年
  wifeIncome: number      // 万円/年
  rentMonthly: number     // 万円/月
  totalSavings: number    // 貯蓄+投資 万円
  propertyMin: number     // 物件下限 万円
  propertyMax: number     // 物件上限 万円
  targetRetireAge: number
  cashRatio: number       // 現金比率
  investRatio: number     // 投資比率
  dcRatio: number         // DC比率
  mode?: 'solo' | 'couple' // デフォルト: couple
}

interface RentResult {
  score: number
  survival: number
  lifestyle: number
  risk: number
  liquidity: number
  survivalRate: number
  fireAge: number | null
  assetsAt60: number
  assetsAt100: number
}

interface HousingResult {
  score: number
  survivalRate: number
  fireAge: number | null
  assetsAt60: number
  assetsAt100: number
  monthlyPayment: number
  totalCost40Years: number
}

interface CaseResult {
  case: CaseDefinition
  rent: RentResult
  housing: HousingResult
}

// ライフイベントシナリオ用
interface LifeEventInput {
  type: LifeEventType
  name: string
  age: number
  amount: number
  duration?: number
  isRecurring: boolean
  target?: 'self' | 'partner'
  purchaseDetails?: HousingPurchaseDetails
}

interface CaseScenario {
  caseId: string
  scenarioId: string
  label: string
  lifeEvents: LifeEventInput[]
}

interface ScenarioResult {
  scenarioId: string
  caseId: string
  label: string
  score: { overall: number; survival: number; lifestyle: number; risk: number; liquidity: number }
  metrics: { fireAge: number | null; survivalRate: number; assetAt100: number }
  assetsAt60: number
  lifeEvents: LifeEventInput[]
}

// ------------------------------------------------------------------
// Case Definitions (C01-C17)
// ------------------------------------------------------------------

const CASES: CaseDefinition[] = [
  {
    id: 'C01', name: '王道DINK都心マンション検討',
    husbandAge: 35, wifeAge: 33, husbandIncome: 1600, wifeIncome: 800,
    rentMonthly: 32, totalSavings: 4000, propertyMin: 8000, propertyMax: 9500,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C02', name: '高負荷キャリア×ペースダウン不安',
    husbandAge: 37, wifeAge: 35, husbandIncome: 1800, wifeIncome: 600,
    rentMonthly: 30, totalSavings: 3500, propertyMin: 7000, propertyMax: 8500,
    targetRetireAge: 48, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C03', name: 'DINK前提から子ども1人ありかも',
    husbandAge: 34, wifeAge: 32, husbandIncome: 1500, wifeIncome: 700,
    rentMonthly: 28, totalSavings: 3000, propertyMin: 7500, propertyMax: 9000,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C04', name: '海外転職オプション強めDINK',
    husbandAge: 33, wifeAge: 31, husbandIncome: 1400, wifeIncome: 900,
    rentMonthly: 29, totalSavings: 5000, propertyMin: 8000, propertyMax: 10000,
    targetRetireAge: 45, cashRatio: 0.20, investRatio: 0.70, dcRatio: 0.10,
  },
  {
    id: 'C05', name: '事前審査MAXで揺れるケース',
    husbandAge: 36, wifeAge: 34, husbandIncome: 1700, wifeIncome: 700,
    rentMonthly: 31, totalSavings: 2800, propertyMin: 9000, propertyMax: 12000,
    targetRetireAge: 55, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C06', name: '高家賃ハイパフォーマーDINK',
    husbandAge: 32, wifeAge: 30, husbandIncome: 1800, wifeIncome: 600,
    rentMonthly: 40, totalSavings: 2500, propertyMin: 7500, propertyMax: 9000,
    targetRetireAge: 50, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C07', name: '片働きリスク顕在夫婦',
    husbandAge: 35, wifeAge: 33, husbandIncome: 1500, wifeIncome: 500,
    rentMonthly: 26, totalSavings: 3200, propertyMin: 7000, propertyMax: 8000,
    targetRetireAge: 52, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C08', name: 'メンタルダウンリスク意識',
    husbandAge: 38, wifeAge: 36, husbandIncome: 1600, wifeIncome: 600,
    rentMonthly: 27, totalSavings: 3800, propertyMin: 8000, propertyMax: 9000,
    targetRetireAge: 48, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C09', name: 'リモート前提崩壊リスク',
    husbandAge: 34, wifeAge: 32, husbandIncome: 1400, wifeIncome: 800,
    rentMonthly: 24, totalSavings: 3000, propertyMin: 7000, propertyMax: 8500,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C10', name: '9,000〜10,000ラインで迷う',
    husbandAge: 33, wifeAge: 33, husbandIncome: 1500, wifeIncome: 900,
    rentMonthly: 29, totalSavings: 4500, propertyMin: 9000, propertyMax: 10000,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C11', name: '堅実1馬力＋時短妻',
    husbandAge: 34, wifeAge: 32, husbandIncome: 1200, wifeIncome: 300,
    rentMonthly: 18, totalSavings: 2000, propertyMin: 5500, propertyMax: 7000,
    targetRetireAge: 55, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C12', name: '共働き中堅×第2子タイミング',
    husbandAge: 33, wifeAge: 31, husbandIncome: 1100, wifeIncome: 700,
    rentMonthly: 22, totalSavings: 2500, propertyMin: 6000, propertyMax: 7500,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  // --- C13-C17: カバレッジ拡張 ---
  {
    id: 'C13', name: 'ソロ購入・堅実会社員',
    husbandAge: 30, wifeAge: 0, husbandIncome: 900, wifeIncome: 0,
    rentMonthly: 11, totalSavings: 1500, propertyMin: 3000, propertyMax: 4000,
    targetRetireAge: 55, cashRatio: 0.35, investRatio: 0.50, dcRatio: 0.15,
    mode: 'solo',
  },
  {
    id: 'C14', name: '高年収若手DINK・タワマン検討',
    husbandAge: 28, wifeAge: 27, husbandIncome: 2200, wifeIncome: 1000,
    rentMonthly: 35, totalSavings: 3000, propertyMin: 12000, propertyMax: 15000,
    targetRetireAge: 45, cashRatio: 0.20, investRatio: 0.65, dcRatio: 0.15,
  },
  {
    id: 'C15', name: '子ども2人・共働き中堅・郊外戸建て',
    husbandAge: 38, wifeAge: 36, husbandIncome: 800, wifeIncome: 400,
    rentMonthly: 12, totalSavings: 1000, propertyMin: 4000, propertyMax: 5000,
    targetRetireAge: 60, cashRatio: 0.35, investRatio: 0.45, dcRatio: 0.20,
  },
  {
    id: 'C16', name: '40歳ソロ・高貯蓄・賃貸継続派',
    husbandAge: 40, wifeAge: 0, husbandIncome: 1800, wifeIncome: 0,
    rentMonthly: 20, totalSavings: 8000, propertyMin: 7000, propertyMax: 9000,
    targetRetireAge: 50, cashRatio: 0.20, investRatio: 0.70, dcRatio: 0.10,
    mode: 'solo',
  },
  {
    id: 'C17', name: 'フリーランス夫+会社員妻・収入変動大',
    husbandAge: 35, wifeAge: 33, husbandIncome: 1200, wifeIncome: 800,
    rentMonthly: 25, totalSavings: 2500, propertyMin: 6500, propertyMax: 8000,
    targetRetireAge: 52, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
]

// ------------------------------------------------------------------
// Life Event Scenarios
// ------------------------------------------------------------------

const SCENARIOS: CaseScenario[] = [
  // --- C01: 王道DINK ---
  { caseId: 'C01', scenarioId: 'C01-base', label: 'ベースライン（賃貸継続）', lifeEvents: [] },
  { caseId: 'C01', scenarioId: 'C01-buy', label: '38歳で8,500万購入', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 8500, isRecurring: false,
      purchaseDetails: { propertyPrice: 8500, downPayment: 1000, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } }
  ]},
  { caseId: 'C01', scenarioId: 'C01-pacedown', label: '40歳で夫年収20%ダウン', lifeEvents: [
    { type: 'income_decrease', name: '転職ペースダウン', age: 40, amount: 320, isRecurring: false, target: 'self' }
  ]},
  { caseId: 'C01', scenarioId: 'C01-buy-pacedown', label: '購入+ペースダウン', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 8500, isRecurring: false,
      purchaseDetails: { propertyPrice: 8500, downPayment: 1000, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } },
    { type: 'income_decrease', name: '転職ペースダウン', age: 40, amount: 320, isRecurring: false, target: 'self' }
  ]},

  // --- C06: 高家賃ハイパフォーマー ---
  { caseId: 'C06', scenarioId: 'C06-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C06', scenarioId: 'C06-buy', label: '35歳で8,000万購入', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 35, amount: 8000, isRecurring: false,
      purchaseDetails: { propertyPrice: 8000, downPayment: 800, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 40 } }
  ]},

  // --- C11: 堅実1馬力 ---
  { caseId: 'C11', scenarioId: 'C11-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C11', scenarioId: 'C11-buy', label: '37歳で6,000万購入', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 37, amount: 6000, isRecurring: false,
      purchaseDetails: { propertyPrice: 6000, downPayment: 600, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 30 } }
  ]},

  // --- C04: 海外転職オプション ---
  { caseId: 'C04', scenarioId: 'C04-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C04', scenarioId: 'C04-abroad', label: '36歳で海外転職（年収+40%）', lifeEvents: [
    { type: 'income_increase', name: '海外転職', age: 36, amount: 560, isRecurring: false, target: 'self' }
  ]},
  { caseId: 'C04', scenarioId: 'C04-inherit', label: '45歳で相続2000万', lifeEvents: [
    { type: 'asset_gain', name: '相続', age: 45, amount: 2000, isRecurring: false }
  ]},

  // --- C03: 子ども1人ありかも ---
  { caseId: 'C03', scenarioId: 'C03-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C03', scenarioId: 'C03-child', label: '35歳で子ども（支出+150万/年×22年）', lifeEvents: [
    { type: 'expense_increase', name: '子ども', age: 35, amount: 150, duration: 22, isRecurring: true }
  ]},
  { caseId: 'C03', scenarioId: 'C03-child-buy', label: '子ども+住宅購入', lifeEvents: [
    { type: 'expense_increase', name: '子ども', age: 35, amount: 150, duration: 22, isRecurring: true },
    { type: 'housing_purchase', name: '住宅購入', age: 36, amount: 8000, isRecurring: false,
      purchaseDetails: { propertyPrice: 8000, downPayment: 800, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 35 } }
  ]},

  // --- C05: 審査MAX ---
  { caseId: 'C05', scenarioId: 'C05-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C05', scenarioId: 'C05-buy-max', label: '38歳で10,000万購入（ギリギリ）', lifeEvents: [
    { type: 'housing_purchase', name: '住宅購入', age: 38, amount: 10000, isRecurring: false,
      purchaseDetails: { propertyPrice: 10000, downPayment: 1000, purchaseCostRate: 7,
        mortgageYears: 35, interestRate: 0.5, ownerAnnualCost: 50 } }
  ]},

  // --- 他のケースはベースラインのみ ---
  { caseId: 'C02', scenarioId: 'C02-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C07', scenarioId: 'C07-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C08', scenarioId: 'C08-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C09', scenarioId: 'C09-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C10', scenarioId: 'C10-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C12', scenarioId: 'C12-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C13', scenarioId: 'C13-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C14', scenarioId: 'C14-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C15', scenarioId: 'C15-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C16', scenarioId: 'C16-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C17', scenarioId: 'C17-base', label: 'ベースライン', lifeEvents: [] },
  { caseId: 'C18', scenarioId: 'C18-base', label: 'ベースライン（持ち家継続）', lifeEvents: [] },
]

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** 世帯年収から生活費を推定（万円/年） */
function estimateLivingCost(householdIncome: number): number {
  if (householdIncome <= 2000) return 360
  if (householdIncome <= 2500) return 420
  return 480
}

/** CaseDefinition → Profile 変換 */
function caseToProfile(c: CaseDefinition): Profile {
  const base = createDefaultProfile()
  const mode = c.mode ?? 'couple'
  const householdIncome = c.husbandIncome + c.wifeIncome
  const rawLivingCost = estimateLivingCost(householdIncome)
  const livingCost = mode === 'solo' ? Math.round(rawLivingCost * 0.7) : rawLivingCost

  return {
    ...base,
    currentAge: c.husbandAge,
    targetRetireAge: c.targetRetireAge,
    mode,

    grossIncome: c.husbandIncome,
    partnerGrossIncome: c.wifeIncome,
    rsuAnnual: 0,
    partnerRsuAnnual: 0,
    sideIncomeNet: 0,

    housingCostAnnual: c.rentMonthly * 12,
    livingCostAnnual: livingCost,

    homeStatus: 'renter',
    homeMarketValue: 0,
    mortgagePrincipal: 0,
    mortgageInterestRate: 1.0,
    mortgageYearsRemaining: 0,
    mortgageMonthlyPayment: 0,

    assetCash: Math.round(c.totalSavings * c.cashRatio),
    assetInvest: Math.round(c.totalSavings * c.investRatio),
    assetDefinedContributionJP: Math.round(c.totalSavings * c.dcRatio),
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

/** 変動金利ステップアップスケジュール（+0.3%/5年, cap 2.3%） */
const DEFAULT_RATE_STEPS: RateStep[] = [
  { year: 0, rate: 0.5 },
  { year: 5, rate: 0.8 },
  { year: 10, rate: 1.1 },
  { year: 15, rate: 1.4 },
  { year: 20, rate: 1.7 },
  { year: 25, rate: 2.0 },
  { year: 30, rate: 2.3 },
]

/** CaseDefinition → BuyNowParams 変換 */
function caseToBuyParams(c: CaseDefinition): BuyNowParams {
  const propertyPrice = Math.round((c.propertyMin + c.propertyMax) / 2)
  const cashAvailable = Math.round(c.totalSavings * c.cashRatio)
  const rawDown = Math.round(propertyPrice * 0.10)
  const downPayment = Math.min(rawDown, cashAvailable)

  return {
    propertyPrice,
    downPayment,
    purchaseCostRate: 7,
    mortgageYears: 35,
    interestRate: 0.5,
    ownerAnnualCost: Math.round(propertyPrice * 0.01),
    buyAfterYears: 0,
    rateSteps: DEFAULT_RATE_STEPS,
    ownerCostEscalation: 1.5,
  }
}

/** LifeEventInput[] → LifeEvent[] 変換 */
function inputsToLifeEvents(inputs: LifeEventInput[]): LifeEvent[] {
  return inputs.map((input, i) => ({
    id: `scenario-event-${i}`,
    type: input.type,
    name: input.name,
    age: input.age,
    amount: input.amount,
    duration: input.duration,
    isRecurring: input.isRecurring,
    target: input.target,
    purchaseDetails: input.purchaseDetails,
  }))
}

/** runSimulation を複数回実行して平均を取る（拡張版） */
async function runAverage(profile: Profile, runs = RUNS): Promise<RentResult> {
  const results = await Promise.all(
    Array.from({ length: runs }, () => runSimulation(profile))
  )

  const avg = (fn: (r: typeof results[0]) => number) =>
    results.reduce((sum, r) => sum + fn(r), 0) / results.length

  const fireAges = results
    .map(r => r.metrics.fireAge)
    .filter((a): a is number => a !== null)
  const avgFireAge = fireAges.length > 0
    ? Math.round(fireAges.reduce((s, a) => s + a, 0) / fireAges.length)
    : null

  const assetsAt60 = results.map(r => {
    const point = r.paths.yearlyData.find(p => p.age === 60)
    return point?.assets ?? 0
  })
  const avgAssetsAt60 = Math.round(
    assetsAt60.reduce((s, a) => s + a, 0) / assetsAt60.length
  )

  return {
    score: Math.round(avg(r => r.score.overall)),
    survival: Math.round(avg(r => r.score.survival)),
    lifestyle: Math.round(avg(r => r.score.lifestyle)),
    risk: Math.round(avg(r => r.score.risk)),
    liquidity: Math.round(avg(r => r.score.liquidity)),
    survivalRate: Math.round(avg(r => r.metrics.survivalRate)),
    fireAge: avgFireAge,
    assetsAt60: avgAssetsAt60,
    assetsAt100: Math.round(avg(r => r.metrics.assetAt100)),
  }
}

// ------------------------------------------------------------------
// Markdown generation (legacy format for case-catalog-results.md)
// ------------------------------------------------------------------

function fmtAge(age: number | null): string {
  return age !== null ? `${age}歳` : '—'
}

function fmtMoney(val: number): string {
  if (val === 0) return '0万'
  const abs = Math.abs(val)
  const sign = val < 0 ? '-' : ''
  if (abs >= 10000) {
    const oku = abs / 10000
    return `${sign}${oku % 1 === 0 ? oku.toFixed(0) : oku.toFixed(1)}億`
  }
  return `${sign}${Math.round(abs).toLocaleString('ja-JP')}万`
}

function generateCatalogMarkdown(results: CaseResult[]): string {
  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const lines: string[] = []

  lines.push('# YOHACK ケース台帳 × シミュレーション結果')
  lines.push('')
  lines.push(`> ENGINE_VERSION: ${ENGINE_VERSION}`)
  lines.push(`> 実行日: ${ts}`)
  lines.push(`> 各シナリオ${RUNS}回実行の平均値`)
  lines.push('> エンジン: Monte Carlo 1000回（賃貸） / 500回シード付き（住宅購入）')
  lines.push('')

  // --- 賃貸ベースライン一覧 ---
  lines.push('## 賃貸ベースライン一覧')
  lines.push('')
  lines.push('| ID | ケース名 | 年齢 | 世帯年収 | 貯蓄+投資 | 家賃/月 | スコア | 生存率 | FIRE年齢 | 60歳資産 | 100歳資産 |')
  lines.push('|:---|:---------|:-----|:---------|:----------|:--------|-------:|-------:|:---------|:---------|:----------|')

  for (const r of results) {
    const c = r.case
    const rent = r.rent
    const household = c.husbandIncome + c.wifeIncome
    const isSolo = c.mode === 'solo'
    const isC18 = c.id === 'C18'
    const ageStr = isSolo ? `${c.husbandAge}歳` : `${c.husbandAge}歳/${c.wifeAge}歳`
    const rentStr = isC18 ? '※持ち家' : `${c.rentMonthly}万`
    lines.push(
      `| ${c.id} | ${c.name} | ${ageStr} | ${fmtMoney(household)} | ${fmtMoney(c.totalSavings)} | ${rentStr} | ${rent.score} | ${rent.survivalRate}% | ${fmtAge(rent.fireAge)} | ${fmtMoney(rent.assetsAt60)} | ${fmtMoney(rent.assetsAt100)} |`
    )
  }

  lines.push('')

  // --- 住宅購入比較一覧 ---
  lines.push('## 住宅購入比較一覧')
  lines.push('')
  lines.push('| ID | 物件価格 | 月額返済 | 40年総コスト | 購入スコア | 購入生存率 | 購入FIRE | 購入60歳資産 | 賃貸スコア | スコア差 |')
  lines.push('|:---|:---------|:---------|:-------------|-----------:|-----------:|:---------|:-------------|-----------:|---------:|')

  for (const r of results) {
    const c = r.case
    const isC18 = c.id === 'C18'
    const propertyPrice = Math.round((c.propertyMin + c.propertyMax) / 2)
    const h = r.housing
    const rent = r.rent
    const diff = h.score - rent.score
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`
    const priceStr = isC18 ? `※売却→賃貸` : fmtMoney(propertyPrice)
    lines.push(
      `| ${c.id} | ${priceStr} | ${h.monthlyPayment.toFixed(1)}万 | ${fmtMoney(h.totalCost40Years)} | ${h.score} | ${h.survivalRate}% | ${fmtAge(h.fireAge)} | ${fmtMoney(h.assetsAt60)} | ${rent.score} | ${diffStr} |`
    )
  }

  lines.push('')

  // --- 各ケース詳細 ---
  lines.push('## 各ケース詳細')
  lines.push('')

  for (const r of results) {
    const c = r.case
    const rent = r.rent
    const h = r.housing
    const propertyPrice = Math.round((c.propertyMin + c.propertyMax) / 2)
    const household = c.husbandIncome + c.wifeIncome
    const isSolo = c.mode === 'solo'
    const isC18 = c.id === 'C18'

    lines.push(`### ${c.id}: ${c.name}`)
    lines.push('')
    lines.push('**プロフィール**')

    if (isSolo) {
      lines.push(`- ${c.husbandAge}歳（ソロ）`)
      lines.push(`- 年収: ${fmtMoney(c.husbandIncome)}`)
    } else {
      lines.push(`- 夫${c.husbandAge}歳 / 妻${c.wifeAge}歳`)
      lines.push(`- 世帯年収: ${fmtMoney(household)}（夫${fmtMoney(c.husbandIncome)} / 妻${fmtMoney(c.wifeIncome)}）`)
    }

    if (isC18) {
      lines.push(`- 住居: 持ち家（物件${fmtMoney(c.propertyMin)}、残債${fmtMoney(c.propertyMax)}）`)
    } else {
      lines.push(`- 家賃: ${c.rentMonthly}万/月（年${c.rentMonthly * 12}万）`)
    }
    lines.push(`- 貯蓄+投資: ${fmtMoney(c.totalSavings)}`)
    lines.push(`- 目標退職: ${c.targetRetireAge}歳`)
    if (!isC18) {
      lines.push(`- 検討物件: ${fmtMoney(c.propertyMin)}〜${fmtMoney(c.propertyMax)}`)
    }
    lines.push('')

    if (isC18) {
      lines.push('| 指標 | 持ち家継続 | 売却→賃貸 | diff |')
      lines.push('|:-----|:-----------|:----------|:-----|')
    } else {
      lines.push(`| 指標 | 賃貸 | 購入（${fmtMoney(propertyPrice)}） | diff |`)
      lines.push('|:-----|:-----|:-----|:-----|')
    }

    const scoreDiff = h.score - rent.score
    const survDiff = h.survivalRate - rent.survivalRate
    const a60Diff = h.assetsAt60 - rent.assetsAt60

    lines.push(`| スコア | ${rent.score} | ${h.score} | ${scoreDiff >= 0 ? '+' : ''}${scoreDiff} |`)
    lines.push(`| 生存率 | ${rent.survivalRate}% | ${h.survivalRate}% | ${survDiff >= 0 ? '+' : ''}${survDiff}% |`)
    lines.push(`| FIRE年齢 | ${fmtAge(rent.fireAge)} | ${fmtAge(h.fireAge)} | — |`)
    lines.push(`| 60歳資産 | ${fmtMoney(rent.assetsAt60)} | ${fmtMoney(h.assetsAt60)} | ${fmtMoney(a60Diff)} |`)
    const a100Diff = h.assetsAt100 - rent.assetsAt100
    lines.push(`| 100歳資産 | ${fmtMoney(rent.assetsAt100)} | ${fmtMoney(h.assetsAt100)} | ${fmtMoney(a100Diff)} |`)

    if (isC18) {
      lines.push(`| 月額支出 | ローン+維持費 | ${h.monthlyPayment.toFixed(1)}万(家賃) | — |`)
      lines.push(`| 40年総コスト | — | ${fmtMoney(h.totalCost40Years)} | — |`)
    } else {
      let rentTotal40 = 0
      for (let y = 0; y < 40; y++) {
        rentTotal40 += c.rentMonthly * 12 * Math.pow(1.005, y)
      }
      rentTotal40 = Math.round(rentTotal40)
      lines.push(`| 月額支出 | ${c.rentMonthly}万 | ${h.monthlyPayment.toFixed(1)}万 | — |`)
      lines.push(`| 40年総コスト | ${fmtMoney(rentTotal40)} | ${fmtMoney(h.totalCost40Years)} | — |`)
    }
    lines.push('')

    if (isC18) {
      lines.push(`> 売却条件: 物件時価${fmtMoney(c.propertyMin)} / 残債${fmtMoney(c.propertyMax)} / 売却諸費用5% → 売却後賃貸22万/月`)
    } else {
      const buyParams = caseToBuyParams(c)
      lines.push(`> 購入条件: 物件${fmtMoney(propertyPrice)} / 頭金${fmtMoney(buyParams.downPayment)} / ${buyParams.mortgageYears}年ローン 変動${buyParams.interestRate}%→+0.3%/5年 / 諸費用${buyParams.purchaseCostRate}% / 維持費年${fmtMoney(buyParams.ownerAnnualCost)}(+1.5%/年)`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

async function main() {
  console.log('=== ケース台帳シミュレーション開始 ===')
  console.log(`ENGINE_VERSION: ${ENGINE_VERSION}`)
  console.log(`実行回数: ${RUNS}回/シナリオ`)
  console.log(`対象: ${CASES.length + 1} ケース（C01-C17 + C18特殊）+ ${SCENARIOS.length} シナリオ`)
  console.log('')

  // ==================================================================
  // Part 1: 賃貸 vs 購入 比較（既存ケース台帳）
  // ==================================================================
  const caseResults: CaseResult[] = []

  for (const c of CASES) {
    console.log(`[${c.id}] ${c.name} ...`)
    const profile = caseToProfile(c)

    // (A) 賃貸ベースライン
    const rent = await runAverage(profile)

    // (B) 住宅購入
    const buyParams = caseToBuyParams(c)
    const housingResults = runHousingScenarios(profile, buyParams)
    const buyResult = housingResults.find(r => r.type === 'BUY_NOW')!

    const housing: HousingResult = {
      score: buyResult.simulation.score.overall,
      survivalRate: Math.round(buyResult.simulation.metrics.survivalRate),
      fireAge: buyResult.safeFireAge,
      assetsAt60: buyResult.assetsAt60,
      assetsAt100: Math.round(buyResult.simulation.metrics.assetAt100),
      monthlyPayment: buyResult.monthlyPayment,
      totalCost40Years: buyResult.totalCost40Years,
    }

    caseResults.push({ case: c, rent, housing })

    console.log(`  賃貸: score=${rent.score}, survival=${rent.survivalRate}%, FIRE=${rent.fireAge ?? 'N/A'}`)
    console.log(`  購入: score=${housing.score}, survival=${housing.survivalRate}%, FIRE=${housing.fireAge ?? 'N/A'}`)
    console.log('')
  }

  // === C18: 既に購入済み・売却検討（逆パターン） ===
  {
    console.log('[C18] 既に購入済み・売却検討 ...')

    const c18PropertyValue = 8000
    const c18MortgageRemaining = 6000
    const c18MortgageRate = 0.7
    const c18MortgageYearsRemaining = 25
    const c18OwnerAnnualCost = 80
    const c18SellingCostRate = 5
    const c18SellRentMonthly = 22
    const c18TotalSavings = 3000
    const c18CashRatio = 0.30
    const c18InvestRatio = 0.55
    const c18DcRatio = 0.15

    const ownerMonthly = computeMonthlyPaymentManYen(
      c18MortgageRemaining, c18MortgageRate, c18MortgageYearsRemaining
    )
    const ownerProfile: Profile = {
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
      assetCash: Math.round(c18TotalSavings * c18CashRatio),
      assetInvest: Math.round(c18TotalSavings * c18InvestRatio),
      assetDefinedContributionJP: Math.round(c18TotalSavings * c18DcRatio),
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
    const ownerResult = await runAverage(ownerProfile)

    const sellingCosts = c18PropertyValue * (c18SellingCostRate / 100)
    const saleProceeds = c18PropertyValue - c18MortgageRemaining - sellingCosts

    const renterProfile: Profile = {
      ...ownerProfile,
      homeStatus: 'renter',
      homeMarketValue: 0,
      mortgagePrincipal: 0,
      mortgageInterestRate: 0,
      mortgageYearsRemaining: 0,
      mortgageMonthlyPayment: 0,
      housingCostAnnual: c18SellRentMonthly * 12,
      assetCash: Math.round(c18TotalSavings * c18CashRatio) + Math.round(saleProceeds),
    }
    const renterResult = await runAverage(renterProfile)

    let rentTotal40 = 0
    for (let y = 0; y < 40; y++) {
      rentTotal40 += c18SellRentMonthly * 12 * Math.pow(1.005, y)
    }

    const c18Case: CaseDefinition = {
      id: 'C18', name: '既に購入済み・売却検討',
      husbandAge: 42, wifeAge: 40, husbandIncome: 1500, wifeIncome: 600,
      rentMonthly: 0,
      totalSavings: c18TotalSavings,
      propertyMin: c18PropertyValue,
      propertyMax: c18MortgageRemaining,
      targetRetireAge: 55,
      cashRatio: c18CashRatio, investRatio: c18InvestRatio, dcRatio: c18DcRatio,
    }
    caseResults.push({
      case: c18Case,
      rent: ownerResult,
      housing: {
        ...renterResult,
        monthlyPayment: c18SellRentMonthly,
        totalCost40Years: Math.round(rentTotal40),
      },
    })

    console.log(`  持ち家継続: score=${ownerResult.score}, survival=${ownerResult.survivalRate}%, FIRE=${ownerResult.fireAge ?? 'N/A'}`)
    console.log(`  売却→賃貸: score=${renterResult.score}, survival=${renterResult.survivalRate}%, FIRE=${renterResult.fireAge ?? 'N/A'}`)
    console.log(`  売却益: ${fmtMoney(Math.round(saleProceeds))}`)
    console.log('')
  }

  // ==================================================================
  // Part 2: ライフイベントシナリオ実行
  // ==================================================================
  console.log('=== ライフイベントシナリオ実行 ===')
  console.log('')

  const scenarioResults: ScenarioResult[] = []

  // C18用の特別プロファイル取得ヘルパー
  const c18CaseResult = caseResults.find(r => r.case.id === 'C18')

  for (const scenario of SCENARIOS) {
    let profile: Profile

    if (scenario.caseId === 'C18') {
      // C18は持ち家プロファイルをベースに使う
      const c18PropertyValue = 8000
      const c18MortgageRemaining = 6000
      const c18MortgageRate = 0.7
      const c18MortgageYearsRemaining = 25
      const c18OwnerAnnualCost = 80
      const c18TotalSavings = 3000
      const ownerMonthly = computeMonthlyPaymentManYen(
        c18MortgageRemaining, c18MortgageRate, c18MortgageYearsRemaining
      )
      profile = {
        ...createDefaultProfile(),
        currentAge: 42,
        targetRetireAge: 55,
        mode: 'couple',
        grossIncome: 1500,
        partnerGrossIncome: 600,
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
        lifeEvents: inputsToLifeEvents(scenario.lifeEvents),
      }
    } else {
      const caseDef = CASES.find(c => c.id === scenario.caseId)!
      profile = {
        ...caseToProfile(caseDef),
        lifeEvents: inputsToLifeEvents(scenario.lifeEvents),
      }
    }

    console.log(`  [${scenario.scenarioId}] ${scenario.label} ...`)
    const result = await runAverage(profile)

    scenarioResults.push({
      scenarioId: scenario.scenarioId,
      caseId: scenario.caseId,
      label: scenario.label,
      score: {
        overall: result.score,
        survival: result.survival,
        lifestyle: result.lifestyle,
        risk: result.risk,
        liquidity: result.liquidity,
      },
      metrics: {
        fireAge: result.fireAge,
        survivalRate: result.survivalRate,
        assetAt100: result.assetsAt100,
      },
      assetsAt60: result.assetsAt60,
      lifeEvents: scenario.lifeEvents,
    })

    console.log(`    score=${result.score}, survival=${result.survivalRate}%, FIRE=${result.fireAge ?? 'N/A'}`)
  }
  console.log('')

  // ==================================================================
  // Output
  // ==================================================================

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const docsDir = resolve(scriptDir, '../docs')
  mkdirSync(docsDir, { recursive: true })

  // 1. case-catalog-results.md（賃貸 vs 購入 比較表）
  const catalogMd = generateCatalogMarkdown(caseResults)
  writeFileSync(resolve(docsDir, 'case-catalog-results.md'), catalogMd, 'utf-8')

  // 2. e02-baseline-v1.0.0.json（リグレッションテスト用）
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const jsonOutput = {
    engineVersion: ENGINE_VERSION,
    runDate: dateStr,
    runs: RUNS,
    results: scenarioResults,
  }
  writeFileSync(
    resolve(docsDir, 'e02-baseline-v1.0.0.json'),
    JSON.stringify(jsonOutput, null, 2),
    'utf-8'
  )

  // 3. e02-baseline-v1.0.0.md（人間可読シナリオ別結果）
  const scenarioMdLines: string[] = []
  scenarioMdLines.push('# E02: ENGINE_VERSION 1.0.0 ベースライン結果')
  scenarioMdLines.push('')
  scenarioMdLines.push(`> ENGINE_VERSION: ${ENGINE_VERSION}`)
  scenarioMdLines.push(`> 実行日: ${dateStr}`)
  scenarioMdLines.push(`> 各シナリオ${RUNS}回実行の平均値`)
  scenarioMdLines.push('')
  scenarioMdLines.push('| シナリオID | ケース | ラベル | スコア | 生存率 | FIRE年齢 | 60歳資産 | 100歳資産 | イベント数 |')
  scenarioMdLines.push('|:-----------|:-------|:-------|-------:|-------:|:---------|:---------|:----------|:---------:|')

  for (const r of scenarioResults) {
    scenarioMdLines.push(
      `| ${r.scenarioId} | ${r.caseId} | ${r.label} | ${r.score.overall} | ${r.metrics.survivalRate}% | ${fmtAge(r.metrics.fireAge)} | ${fmtMoney(r.assetsAt60)} | ${fmtMoney(r.metrics.assetAt100)} | ${r.lifeEvents.length} |`
    )
  }
  scenarioMdLines.push('')

  // 妥当性チェック結果
  scenarioMdLines.push('## 妥当性チェック')
  scenarioMdLines.push('')

  const findScore = (id: string) => scenarioResults.find(r => r.scenarioId === id)?.score.overall ?? 0
  const findSurvival = (id: string) => scenarioResults.find(r => r.scenarioId === id)?.metrics.survivalRate ?? 0

  const checks: [string, boolean][] = [
    ['C01-buy < C01-base（住宅購入でスコアが下がる）', findScore('C01-buy') < findScore('C01-base')],
    ['C01-pacedown < C01-base（ペースダウンでスコアが下がる）', findScore('C01-pacedown') < findScore('C01-base')],
    ['C01-buy-pacedown < C01-buy（購入+ペースダウンが最も厳しい）', findScore('C01-buy-pacedown') < findScore('C01-buy')],
    ['C03-child < C03-base（子ども追加でスコアが下がる）', findScore('C03-child') < findScore('C03-base')],
    ['C03-child-buy < C03-child（子ども+住宅が最も厳しい）', findScore('C03-child-buy') < findScore('C03-child')],
    ['C04-abroad > C04-base（海外転職でスコアが上がる）', findScore('C04-abroad') > findScore('C04-base')],
    ['C04-inherit > C04-base（相続でスコアが上がる）', findScore('C04-inherit') > findScore('C04-base')],
    ['C05-buy-max < C05-base（高額物件購入は厳しい）', findScore('C05-buy-max') < findScore('C05-base')],
  ]

  for (const [desc, pass] of checks) {
    scenarioMdLines.push(`- ${pass ? '✅' : '❌'} ${desc}`)
  }
  scenarioMdLines.push('')

  writeFileSync(resolve(docsDir, 'e02-baseline-v1.0.0.md'), scenarioMdLines.join('\n'), 'utf-8')

  console.log('=== 完了 ===')
  console.log(`結果:`)
  console.log(`  ${resolve(docsDir, 'case-catalog-results.md')}`)
  console.log(`  ${resolve(docsDir, 'e02-baseline-v1.0.0.json')}`)
  console.log(`  ${resolve(docsDir, 'e02-baseline-v1.0.0.md')}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
