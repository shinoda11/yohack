// 感度分析スクリプト
// 4ケース × 4パラメータ × 3水準 = 48シナリオ
// 各パラメータは1つだけ変動させ、他は現行値に固定（1因子ずつ）

import { runSimulation, createDefaultProfile } from '../lib/engine'
import { runHousingScenarios, type BuyNowParams, type RateStep } from '../lib/housing-sim'
import type { Profile } from '../lib/types'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface CaseDefinition {
  id: string
  name: string
  husbandAge: number
  wifeAge: number
  husbandIncome: number
  wifeIncome: number
  rentMonthly: number
  totalSavings: number
  propertyMin: number
  propertyMax: number
  targetRetireAge: number
  cashRatio: number
  investRatio: number
  dcRatio: number
  mode?: 'solo' | 'couple'
}

interface ScenarioResult {
  caseId: string
  param: string
  level: string
  value: number
  rentScore: number
  buyScore: number
  scoreDiff: number  // buy - rent
}

// ------------------------------------------------------------------
// Target Cases (4)
// ------------------------------------------------------------------

const TARGET_CASES: CaseDefinition[] = [
  {
    id: 'C01', name: '王道DINK（購入+3）',
    husbandAge: 35, wifeAge: 33, husbandIncome: 1600, wifeIncome: 800,
    rentMonthly: 32, totalSavings: 4000, propertyMin: 8000, propertyMax: 9500,
    targetRetireAge: 50, cashRatio: 0.25, investRatio: 0.60, dcRatio: 0.15,
  },
  {
    id: 'C06', name: '高家賃DINK（購入+11）',
    husbandAge: 32, wifeAge: 30, husbandIncome: 1800, wifeIncome: 600,
    rentMonthly: 40, totalSavings: 2500, propertyMin: 7500, propertyMax: 9000,
    targetRetireAge: 50, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C08', name: 'メンタルリスク（賃貸-4）',
    husbandAge: 38, wifeAge: 36, husbandIncome: 1600, wifeIncome: 600,
    rentMonthly: 27, totalSavings: 3800, propertyMin: 8000, propertyMax: 9000,
    targetRetireAge: 48, cashRatio: 0.30, investRatio: 0.55, dcRatio: 0.15,
  },
  {
    id: 'C16', name: '高貯蓄ソロ（賃貸-5）',
    husbandAge: 40, wifeAge: 0, husbandIncome: 1800, wifeIncome: 0,
    rentMonthly: 20, totalSavings: 8000, propertyMin: 7000, propertyMax: 9000,
    targetRetireAge: 50, cashRatio: 0.20, investRatio: 0.70, dcRatio: 0.10,
    mode: 'solo',
  },
]

// ------------------------------------------------------------------
// Parameter Definitions
// ------------------------------------------------------------------

interface ParamDef {
  key: string
  label: string
  levels: { label: string; value: number }[]
  defaultIdx: number // index of current/default level
}

const PARAMS: ParamDef[] = [
  {
    key: 'expectedReturn',
    label: '投資リターン',
    levels: [
      { label: '3%', value: 3 },
      { label: '5%（現行）', value: 5 },
      { label: '7%', value: 7 },
    ],
    defaultIdx: 1,
  },
  {
    key: 'rateCap',
    label: 'ローン金利上限',
    levels: [
      { label: '1.5%', value: 1.5 },
      { label: '2.3%（現行）', value: 2.3 },
      { label: '3.0%', value: 3.0 },
    ],
    defaultIdx: 1,
  },
  {
    key: 'rentInflationRate',
    label: '家賃上昇率',
    levels: [
      { label: '0%', value: 0 },
      { label: '0.5%（現行）', value: 0.5 },
      { label: '1.0%', value: 1.0 },
    ],
    defaultIdx: 1,
  },
  {
    key: 'ownerCostEscalation',
    label: '維持費上昇率',
    levels: [
      { label: '0.5%', value: 0.5 },
      { label: '1.5%（現行）', value: 1.5 },
      { label: '2.5%', value: 2.5 },
    ],
    defaultIdx: 1,
  },
]

// ------------------------------------------------------------------
// Helpers (reused from case-catalog-sim.ts)
// ------------------------------------------------------------------

function estimateLivingCost(householdIncome: number): number {
  if (householdIncome <= 2000) return 360
  if (householdIncome <= 2500) return 420
  return 480
}

function caseToProfile(c: CaseDefinition, overrides?: Partial<Profile>): Profile {
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
    ...overrides,
  }
}

function makeRateSteps(cap: number): RateStep[] {
  const steps: RateStep[] = []
  let rate = 0.5
  for (let y = 0; y <= 30; y += 5) {
    steps.push({ year: y, rate: Math.min(rate, cap) })
    rate += 0.3
  }
  return steps
}

function caseToBuyParams(c: CaseDefinition, rateCap?: number, ownerCostEscalation?: number): BuyNowParams {
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
    rateSteps: makeRateSteps(rateCap ?? 2.3),
    ownerCostEscalation: ownerCostEscalation ?? 1.5,
  }
}

// ------------------------------------------------------------------
// Run one scenario (1 run each for rent & buy)
// ------------------------------------------------------------------

async function runScenario(
  c: CaseDefinition,
  paramKey: string,
  paramValue: number,
): Promise<{ rentScore: number; buyScore: number }> {
  // Build profile and buy params with the varied parameter
  const profileOverrides: Partial<Profile> = {}
  let rateCap: number | undefined
  let ownerCostEsc: number | undefined

  switch (paramKey) {
    case 'expectedReturn':
      profileOverrides.expectedReturn = paramValue
      break
    case 'rateCap':
      rateCap = paramValue
      break
    case 'rentInflationRate':
      profileOverrides.rentInflationRate = paramValue
      break
    case 'ownerCostEscalation':
      ownerCostEsc = paramValue
      break
  }

  const profile = caseToProfile(c, profileOverrides)
  const buyParams = caseToBuyParams(c, rateCap, ownerCostEsc)

  // Rent baseline (1 run)
  const rentResult = await runSimulation(profile)
  const rentScore = rentResult.score.overall

  // Buy scenario
  const housingResults = runHousingScenarios(profile, buyParams)
  const buyResult = housingResults.find(r => r.type === 'BUY_NOW')!
  const buyScore = buyResult.simulation.score.overall

  return { rentScore, buyScore }
}

// ------------------------------------------------------------------
// Markdown generation
// ------------------------------------------------------------------

function fmtSign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function generateMarkdown(results: ScenarioResult[]): string {
  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const lines: string[] = []

  lines.push('# 感度分析結果')
  lines.push('')
  lines.push(`> 生成日時: ${ts}`)
  lines.push('> 方法: 4ケース × 4パラメータ × 3水準 = 48シナリオ（各1回実行）')
  lines.push('> 1因子ずつ変動、他は現行値に固定')
  lines.push('')

  // --- パラメータ別テーブル ---
  for (const param of PARAMS) {
    lines.push(`## ${param.label}`)
    lines.push('')
    lines.push(`変動: ${param.levels.map(l => l.label).join(' / ')}`)
    lines.push('')

    // Header
    lines.push('| ケース | 指標 | ' + param.levels.map(l => l.label).join(' | ') + ' | 振れ幅 |')
    lines.push('|:-------|:-----|' + param.levels.map(() => ':-----:').join('|') + '|-------:|')

    for (const c of TARGET_CASES) {
      const caseResults = results.filter(r => r.caseId === c.id && r.param === param.key)
      if (caseResults.length !== 3) continue

      const rentScores = caseResults.map(r => r.rentScore)
      const buyScores = caseResults.map(r => r.buyScore)
      const diffs = caseResults.map(r => r.scoreDiff)

      const rentSwing = Math.max(...rentScores) - Math.min(...rentScores)
      const buySwing = Math.max(...buyScores) - Math.min(...buyScores)
      const diffSwing = Math.max(...diffs) - Math.min(...diffs)

      lines.push(`| ${c.id} ${c.name} | 賃貸スコア | ${rentScores.join(' | ')} | **${rentSwing}** |`)
      lines.push(`| | 購入スコア | ${buyScores.join(' | ')} | **${buySwing}** |`)
      lines.push(`| | スコア差 | ${diffs.map(fmtSign).join(' | ')} | **${diffSwing}** |`)
    }

    // Average swing across all cases
    const allRentSwings: number[] = []
    const allBuySwings: number[] = []
    const allDiffSwings: number[] = []
    for (const c of TARGET_CASES) {
      const caseResults = results.filter(r => r.caseId === c.id && r.param === param.key)
      if (caseResults.length !== 3) continue
      const rentScores = caseResults.map(r => r.rentScore)
      const buyScores = caseResults.map(r => r.buyScore)
      const diffs = caseResults.map(r => r.scoreDiff)
      allRentSwings.push(Math.max(...rentScores) - Math.min(...rentScores))
      allBuySwings.push(Math.max(...buyScores) - Math.min(...buyScores))
      allDiffSwings.push(Math.max(...diffs) - Math.min(...diffs))
    }
    const avgRent = Math.round(allRentSwings.reduce((a, b) => a + b, 0) / allRentSwings.length)
    const avgBuy = Math.round(allBuySwings.reduce((a, b) => a + b, 0) / allBuySwings.length)
    const avgDiff = Math.round(allDiffSwings.reduce((a, b) => a + b, 0) / allDiffSwings.length)

    lines.push(`| **平均** | 賃貸スコア | | | | **${avgRent}** |`)
    lines.push(`| | 購入スコア | | | | **${avgBuy}** |`)
    lines.push(`| | スコア差 | | | | **${avgDiff}** |`)
    lines.push('')
  }

  // --- 影響度ランキング ---
  lines.push('## 影響度ランキング')
  lines.push('')
  lines.push('スコアの振れ幅（低水準→高水準）の4ケース平均で評価。')
  lines.push('')

  const rankings: { param: string; label: string; avgRentSwing: number; avgBuySwing: number; avgDiffSwing: number }[] = []

  for (const param of PARAMS) {
    const swingsRent: number[] = []
    const swingsBuy: number[] = []
    const swingsDiff: number[] = []
    for (const c of TARGET_CASES) {
      const caseResults = results.filter(r => r.caseId === c.id && r.param === param.key)
      if (caseResults.length !== 3) continue
      const rents = caseResults.map(r => r.rentScore)
      const buys = caseResults.map(r => r.buyScore)
      const diffs = caseResults.map(r => r.scoreDiff)
      swingsRent.push(Math.max(...rents) - Math.min(...rents))
      swingsBuy.push(Math.max(...buys) - Math.min(...buys))
      swingsDiff.push(Math.max(...diffs) - Math.min(...diffs))
    }
    rankings.push({
      param: param.key,
      label: param.label,
      avgRentSwing: Math.round(swingsRent.reduce((a, b) => a + b, 0) / swingsRent.length),
      avgBuySwing: Math.round(swingsBuy.reduce((a, b) => a + b, 0) / swingsBuy.length),
      avgDiffSwing: Math.round(swingsDiff.reduce((a, b) => a + b, 0) / swingsDiff.length),
    })
  }

  // Sort by max of avgRentSwing and avgBuySwing (overall impact)
  rankings.sort((a, b) => Math.max(b.avgRentSwing, b.avgBuySwing) - Math.max(a.avgRentSwing, a.avgBuySwing))

  lines.push('| 順位 | パラメータ | 賃貸スコア振れ幅 | 購入スコア振れ幅 | 賃貸vs購入差の振れ幅 | 判定 |')
  lines.push('|:-----|:-----------|:----------------:|:----------------:|:--------------------:|:-----|')

  rankings.forEach((r, i) => {
    const maxSwing = Math.max(r.avgRentSwing, r.avgBuySwing)
    let judgment: string
    if (maxSwing >= 10) {
      judgment = 'ユーザー調整可能にすべき'
    } else if (maxSwing >= 5) {
      judgment = 'デフォルト値を慎重に選ぶ'
    } else {
      judgment = '現行値で固定してよい'
    }
    lines.push(`| ${i + 1} | ${r.label} | **${r.avgRentSwing}** | **${r.avgBuySwing}** | **${r.avgDiffSwing}** | ${judgment} |`)
  })

  lines.push('')
  lines.push('### 判定基準')
  lines.push('')
  lines.push('- **振れ幅10以上**: ユーザー調整可能にすべき')
  lines.push('- **振れ幅5-9**: デフォルト値を慎重に選ぶ')
  lines.push('- **振れ幅4以下**: 現行値で固定してよい')
  lines.push('')

  return lines.join('\n')
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

async function main() {
  console.log('=== 感度分析開始 ===')
  console.log(`対象: ${TARGET_CASES.length}ケース × ${PARAMS.length}パラメータ × 3水準 = ${TARGET_CASES.length * PARAMS.length * 3}シナリオ`)
  console.log('')

  const results: ScenarioResult[] = []

  for (const c of TARGET_CASES) {
    console.log(`[${c.id}] ${c.name}`)

    for (const param of PARAMS) {
      process.stdout.write(`  ${param.label}: `)

      for (const level of param.levels) {
        const { rentScore, buyScore } = await runScenario(c, param.key, level.value)
        const diff = Math.round(buyScore - rentScore)

        results.push({
          caseId: c.id,
          param: param.key,
          level: level.label,
          value: level.value,
          rentScore: Math.round(rentScore),
          buyScore: Math.round(buyScore),
          scoreDiff: diff,
        })

        process.stdout.write(`${level.label}=${Math.round(rentScore)}/${Math.round(buyScore)} `)
      }
      console.log('')
    }
    console.log('')
  }

  // Markdown出力
  const md = generateMarkdown(results)
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const outPath = resolve(scriptDir, '../docs/sensitivity-analysis.md')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, md, 'utf-8')

  console.log('=== 完了 ===')
  console.log(`結果: ${outPath}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
