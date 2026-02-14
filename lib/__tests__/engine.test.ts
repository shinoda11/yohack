import { describe, it, expect } from 'vitest'
import { runSimulation, computeExitScore, createDefaultProfile } from '../engine'
import type { Profile, SimulationPath, KeyMetrics } from '../types'

// ============================================================
// Helper
// ============================================================

/** createDefaultProfile をベースに部分的に上書き */
function profileWith(overrides: Partial<Profile>): Profile {
  return { ...createDefaultProfile(), ...overrides }
}

// ============================================================
// 1. runSimulation
// ============================================================

describe('runSimulation', () => {
  it('結果オブジェクトに paths, metrics, cashFlow, score が存在する', async () => {
    const result = await runSimulation(createDefaultProfile())

    expect(result).toHaveProperty('paths')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('cashFlow')
    expect(result).toHaveProperty('score')
  })

  it('paths の内部構造が正しい', async () => {
    const result = await runSimulation(createDefaultProfile())
    const { paths } = result

    expect(paths.yearlyData).toBeInstanceOf(Array)
    expect(paths.upperPath).toBeInstanceOf(Array)
    expect(paths.lowerPath).toBeInstanceOf(Array)
    expect(paths.median).toBeInstanceOf(Array)
    expect(paths.optimistic).toBeInstanceOf(Array)
    expect(paths.pessimistic).toBeInstanceOf(Array)
  })

  it('metrics.survivalRate が 0〜100 の範囲', async () => {
    const result = await runSimulation(createDefaultProfile())

    expect(result.metrics.survivalRate).toBeGreaterThanOrEqual(0)
    expect(result.metrics.survivalRate).toBeLessThanOrEqual(100)
  })

  it('metrics.fireAge が null または正の整数', async () => {
    const result = await runSimulation(createDefaultProfile())
    const { fireAge } = result.metrics

    if (fireAge !== null) {
      expect(Number.isInteger(fireAge)).toBe(true)
      expect(fireAge).toBeGreaterThan(0)
    } else {
      expect(fireAge).toBeNull()
    }
  })

  it('paths.yearlyData の長さが currentAge〜100 の年数と一致', async () => {
    const profile = createDefaultProfile() // currentAge = 35
    const result = await runSimulation(profile)

    const expectedLength = 100 - profile.currentAge + 1 // 35〜100 => 66
    expect(result.paths.yearlyData).toHaveLength(expectedLength)
  })

  it('yearlyData の各要素に age と assets が含まれる', async () => {
    const result = await runSimulation(createDefaultProfile())

    for (const point of result.paths.yearlyData) {
      expect(point).toHaveProperty('age')
      expect(point).toHaveProperty('assets')
      expect(typeof point.age).toBe('number')
      expect(typeof point.assets).toBe('number')
    }
  })

  it('cashFlow の各フィールドが数値', async () => {
    const result = await runSimulation(createDefaultProfile())
    const { cashFlow } = result

    expect(typeof cashFlow.income).toBe('number')
    expect(typeof cashFlow.pension).toBe('number')
    expect(typeof cashFlow.dividends).toBe('number')
    expect(typeof cashFlow.expenses).toBe('number')
    expect(typeof cashFlow.netCashFlow).toBe('number')
  })
})

// ============================================================
// 2. computeExitScore
// ============================================================

describe('computeExitScore', () => {
  it('score.overall が 0〜100 の範囲', async () => {
    const profile = createDefaultProfile()
    const result = await runSimulation(profile)

    expect(result.score.overall).toBeGreaterThanOrEqual(0)
    expect(result.score.overall).toBeLessThanOrEqual(100)
  })

  it('score.level が GREEN/YELLOW/ORANGE/RED のいずれか', async () => {
    const profile = createDefaultProfile()
    const result = await runSimulation(profile)

    expect(['GREEN', 'YELLOW', 'ORANGE', 'RED']).toContain(result.score.level)
  })

  it('各サブスコアが 0〜100 の範囲', async () => {
    const profile = createDefaultProfile()
    const result = await runSimulation(profile)
    const { score } = result

    for (const key of ['survival', 'lifestyle', 'risk', 'liquidity'] as const) {
      expect(score[key]).toBeGreaterThanOrEqual(0)
      expect(score[key]).toBeLessThanOrEqual(100)
    }
  })

  it('直接呼び出しでも正しく動作する', () => {
    const profile = createDefaultProfile()
    const metrics: KeyMetrics = {
      fireAge: 50,
      assetAt100: 5000,
      survivalRate: 80,
      yearsToFire: 15,
    }
    const paths: SimulationPath = {
      yearlyData: [{ age: 35, assets: 2800 }],
      upperPath: [{ age: 35, assets: 4000 }],
      lowerPath: [{ age: 35, assets: 1500 }],
      median: [2800],
      optimistic: [4000],
      pessimistic: [1500],
    }

    const score = computeExitScore(metrics, profile, paths)

    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(['GREEN', 'YELLOW', 'ORANGE', 'RED']).toContain(score.level)
  })
})

// ============================================================
// 3. エッジケース
// ============================================================

describe('エッジケース', () => {
  it('収入0のプロファイルで破綻しない', async () => {
    const profile = profileWith({
      grossIncome: 0,
      rsuAnnual: 0,
      sideIncomeNet: 0,
      partnerGrossIncome: 0,
      partnerRsuAnnual: 0,
      retirePassiveIncome: 0,
    })

    const result = await runSimulation(profile)

    expect(result).toHaveProperty('paths')
    expect(result).toHaveProperty('metrics')
    expect(result.metrics.survivalRate).toBeGreaterThanOrEqual(0)
    expect(result.metrics.survivalRate).toBeLessThanOrEqual(100)
  })

  it('退職年齢が現在年齢と同じ場合', async () => {
    const profile = profileWith({
      currentAge: 50,
      targetRetireAge: 50,
    })

    const result = await runSimulation(profile)

    expect(result).toHaveProperty('paths')
    expect(result.paths.yearlyData).toHaveLength(100 - 50 + 1) // 51
    expect(result.paths.yearlyData[0].age).toBe(50)
  })

  it('資産が全て0の場合', async () => {
    const profile = profileWith({
      assetCash: 0,
      assetInvest: 0,
      assetDefinedContributionJP: 0,
      dcContributionAnnual: 0,
    })

    const result = await runSimulation(profile)

    expect(result).toHaveProperty('paths')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('score')
    expect(result.score.overall).toBeGreaterThanOrEqual(0)
    expect(result.score.overall).toBeLessThanOrEqual(100)
  })

  it('収入も資産も全て0の場合でもクラッシュしない', async () => {
    const profile = profileWith({
      grossIncome: 0,
      rsuAnnual: 0,
      sideIncomeNet: 0,
      partnerGrossIncome: 0,
      partnerRsuAnnual: 0,
      retirePassiveIncome: 0,
      assetCash: 0,
      assetInvest: 0,
      assetDefinedContributionJP: 0,
      dcContributionAnnual: 0,
    })

    const result = await runSimulation(profile)

    expect(result).toHaveProperty('paths')
    expect(result.metrics.survivalRate).toBeGreaterThanOrEqual(0)
  })

  it('currentAge が 99 の場合（2年分のデータ）', async () => {
    const profile = profileWith({
      currentAge: 99,
      targetRetireAge: 99,
    })

    const result = await runSimulation(profile)

    expect(result.paths.yearlyData).toHaveLength(2) // 99, 100
  })
})

// ============================================================
// 4. createDefaultProfile
// ============================================================

describe('createDefaultProfile', () => {
  it('Profile 型として必要なフィールドが全て存在する', () => {
    const profile = createDefaultProfile()

    // Basic info
    expect(typeof profile.currentAge).toBe('number')
    expect(typeof profile.targetRetireAge).toBe('number')
    expect(['solo', 'couple']).toContain(profile.mode)

    // Income
    expect(typeof profile.grossIncome).toBe('number')
    expect(typeof profile.rsuAnnual).toBe('number')
    expect(typeof profile.sideIncomeNet).toBe('number')
    expect(typeof profile.partnerGrossIncome).toBe('number')
    expect(typeof profile.partnerRsuAnnual).toBe('number')

    // Expenses
    expect(typeof profile.livingCostAnnual).toBe('number')
    expect(typeof profile.housingCostAnnual).toBe('number')

    // Housing
    expect(['renter', 'owner', 'planning', 'relocating']).toContain(profile.homeStatus)
    expect(typeof profile.homeMarketValue).toBe('number')
    expect(typeof profile.mortgagePrincipal).toBe('number')
    expect(typeof profile.mortgageInterestRate).toBe('number')
    expect(typeof profile.mortgageYearsRemaining).toBe('number')
    expect(typeof profile.mortgageMonthlyPayment).toBe('number')

    // Assets
    expect(typeof profile.assetCash).toBe('number')
    expect(typeof profile.assetInvest).toBe('number')
    expect(typeof profile.assetDefinedContributionJP).toBe('number')
    expect(typeof profile.dcContributionAnnual).toBe('number')

    // Investment settings
    expect(typeof profile.expectedReturn).toBe('number')
    expect(typeof profile.inflationRate).toBe('number')
    expect(typeof profile.volatility).toBe('number')

    // Tax and retirement
    expect(typeof profile.effectiveTaxRate).toBe('number')
    expect(typeof profile.retireSpendingMultiplier).toBe('number')
    expect(typeof profile.retirePassiveIncome).toBe('number')

    // Life events
    expect(profile.lifeEvents).toBeInstanceOf(Array)
  })

  it('currentAge が正の整数', () => {
    const profile = createDefaultProfile()
    expect(profile.currentAge).toBeGreaterThan(0)
    expect(Number.isInteger(profile.currentAge)).toBe(true)
  })

  it('targetRetireAge >= currentAge', () => {
    const profile = createDefaultProfile()
    expect(profile.targetRetireAge).toBeGreaterThanOrEqual(profile.currentAge)
  })

  it('割合系フィールドが妥当な範囲', () => {
    const profile = createDefaultProfile()

    expect(profile.effectiveTaxRate).toBeGreaterThanOrEqual(0)
    expect(profile.effectiveTaxRate).toBeLessThanOrEqual(100)

    expect(profile.retireSpendingMultiplier).toBeGreaterThan(0)
    expect(profile.retireSpendingMultiplier).toBeLessThanOrEqual(2)

    expect(profile.volatility).toBeGreaterThanOrEqual(0)
    expect(profile.volatility).toBeLessThanOrEqual(1)
  })
})
