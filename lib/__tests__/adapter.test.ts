import { describe, it, expect } from 'vitest'
import {
  adaptV1ProfileToV2WorldLine,
  extractKpisFromSimulation,
  calculateMoneyMargin,
  calculateTimeMargin,
  calculateEnergyMargin,
  calculateMargin,
  updateWorldLineWithResults,
} from '../v2/adapter'
import { createDefaultProfile } from '../engine'
import { runSimulation } from '../engine'
import type { Profile, SimulationResult } from '../types'

// ============================================================
// Helper
// ============================================================

/** createDefaultProfile をベースに部分的に上書き */
function profileWith(overrides: Partial<Profile>): Profile {
  return { ...createDefaultProfile(), ...overrides }
}

// ============================================================
// 1. adaptV1ProfileToV2WorldLine
// ============================================================

describe('adaptV1ProfileToV2WorldLine', () => {
  it('デフォルトプロファイルで WorldLine が正しく作られる', () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)

    expect(wl).toHaveProperty('id')
    expect(wl).toHaveProperty('name')
    expect(wl).toHaveProperty('description')
    expect(wl).toHaveProperty('baseProfile')
    expect(wl).toHaveProperty('events')
    expect(wl).toHaveProperty('isBaseline')
    expect(wl).toHaveProperty('createdAt')
    expect(wl).toHaveProperty('updatedAt')
    expect(wl).toHaveProperty('result')

    expect(wl.baseProfile).toEqual(profile)
    expect(wl.events).toEqual([])
  })

  it('name, description が引数通りに設定される', () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile, 'テスト世界線', 'テスト説明文')

    expect(wl.name).toBe('テスト世界線')
    expect(wl.description).toBe('テスト説明文')
  })

  it('引数省略時にデフォルト値が使われる', () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)

    expect(wl.name).toBe('現状維持')
    expect(wl.description).toBe('現在の状況を維持した場合')
  })

  it('isBaseline が true になる', () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)

    expect(wl.isBaseline).toBe(true)
  })
})

// ============================================================
// 2. extractKpisFromSimulation
// ============================================================

describe('extractKpisFromSimulation', () => {
  it('runSimulation 結果を渡して KPI が抽出できる', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const kpis = extractKpisFromSimulation(simResult, profile)

    expect(kpis).toHaveProperty('safeFireAge')
    expect(kpis).toHaveProperty('assetsAt60')
    expect(kpis).toHaveProperty('assetsAt100')
    expect(kpis).toHaveProperty('midlifeSurplus')
    expect(kpis).toHaveProperty('survivalRate')
    expect(kpis).toHaveProperty('fireAge')
  })

  it('safeFireAge が number | null である', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const kpis = extractKpisFromSimulation(simResult, profile)

    if (kpis.safeFireAge !== null) {
      expect(typeof kpis.safeFireAge).toBe('number')
      expect(Number.isFinite(kpis.safeFireAge)).toBe(true)
    } else {
      expect(kpis.safeFireAge).toBeNull()
    }
  })

  it('assetsAt60, assetsAt100 が数値である', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const kpis = extractKpisFromSimulation(simResult, profile)

    expect(typeof kpis.assetsAt60).toBe('number')
    expect(Number.isFinite(kpis.assetsAt60)).toBe(true)
    expect(typeof kpis.assetsAt100).toBe('number')
    expect(Number.isFinite(kpis.assetsAt100)).toBe(true)
  })

  it('survivalRate が 0〜100 の範囲', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const kpis = extractKpisFromSimulation(simResult, profile)

    expect(kpis.survivalRate).toBeGreaterThanOrEqual(0)
    expect(kpis.survivalRate).toBeLessThanOrEqual(100)
  })
})

// ============================================================
// 3. calculateMoneyMargin
// ============================================================

describe('calculateMoneyMargin', () => {
  it('simResult ありの場合に各フィールドが数値である', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const money = calculateMoneyMargin(profile, simResult)

    expect(typeof money.monthlyDisposableIncome).toBe('number')
    expect(Number.isFinite(money.monthlyDisposableIncome)).toBe(true)
    expect(typeof money.monthlyNetSavings).toBe('number')
    expect(Number.isFinite(money.monthlyNetSavings)).toBe(true)
    expect(typeof money.emergencyFundCoverage).toBe('number')
    expect(Number.isFinite(money.emergencyFundCoverage)).toBe(true)
    expect(typeof money.annualDisposableIncome).toBe('number')
    expect(Number.isFinite(money.annualDisposableIncome)).toBe(true)
  })

  it('simResult が null の場合に全フィールドが NaN である（0埋め禁止ルール）', () => {
    const profile = createDefaultProfile()
    const money = calculateMoneyMargin(profile, null)

    expect(money.monthlyDisposableIncome).toBeNaN()
    expect(money.monthlyNetSavings).toBeNaN()
    expect(money.emergencyFundCoverage).toBeNaN()
    expect(money.annualDisposableIncome).toBeNaN()
  })

  it('emergencyFundCoverage が正しく計算される', async () => {
    const profile = profileWith({
      assetCash: 600,              // 現金 600万円
      livingCostAnnual: 360,       // 生活費 360万円/年
      housingCostAnnual: 120,      // 住居費 120万円/年
    })
    const simResult = await runSimulation(profile)
    const money = calculateMoneyMargin(profile, simResult)

    // emergencyFundCoverage = assetCash / (月次支出)
    // 月次支出 = cashFlow.expenses / 12
    const monthlyExpense = simResult.cashFlow.expenses / 12
    const expected = profile.assetCash / monthlyExpense

    expect(money.emergencyFundCoverage).toBeCloseTo(expected, 2)
  })

  it('支出が 0 で現金ありの場合 emergencyFundCoverage が 12 になる', () => {
    const profile = profileWith({ assetCash: 500 })
    // cashFlow.expenses が 0 のモック結果を作成
    const mockResult: SimulationResult = {
      paths: {
        yearlyData: [{ age: 35, assets: 2800 }],
        upperPath: [{ age: 35, assets: 4000 }],
        lowerPath: [{ age: 35, assets: 1500 }],
        p25Path: [{ age: 35, assets: 2200 }],
        p75Path: [{ age: 35, assets: 3400 }],
        median: [2800],
        optimistic: [4000],
        pessimistic: [1500],
      },
      metrics: { fireAge: 50, assetAt100: 5000, survivalRate: 80, yearsToFire: 15 },
      cashFlow: { income: 1000, pension: 0, dividends: 0, expenses: 0, netCashFlow: 1000 },
      score: { overall: 70, level: 'YELLOW', survival: 80, lifestyle: 60, risk: 70, liquidity: 50 },
    }
    const money = calculateMoneyMargin(profile, mockResult)

    expect(money.emergencyFundCoverage).toBe(12)
  })
})

// ============================================================
// 4. calculateTimeMargin
// ============================================================

describe('calculateTimeMargin', () => {
  it('solo モードと couple モードで weeklyFreeHours が異なる', () => {
    const solo = calculateTimeMargin(profileWith({ mode: 'solo' }))
    const couple = calculateTimeMargin(profileWith({ mode: 'couple' }))

    expect(solo.weeklyFreeHours).toBeGreaterThan(couple.weeklyFreeHours)
    // solo = 40, couple = 40 - 5 = 35
    expect(solo.weeklyFreeHours).toBe(40)
    expect(couple.weeklyFreeHours).toBe(35)
  })

  it('careerFlexibilityScore が年齢に応じて変化する', () => {
    const young = calculateTimeMargin(profileWith({ currentAge: 30 }))
    const mid = calculateTimeMargin(profileWith({ currentAge: 45 }))
    const senior = calculateTimeMargin(profileWith({ currentAge: 55 }))

    // 若いほどスコアが高い
    expect(young.careerFlexibilityScore).toBeGreaterThan(mid.careerFlexibilityScore)
    expect(mid.careerFlexibilityScore).toBeGreaterThan(senior.careerFlexibilityScore)

    // 具体値の検証
    expect(young.careerFlexibilityScore).toBe(70)   // < 40
    expect(mid.careerFlexibilityScore).toBe(60)      // 40-49
    expect(senior.careerFlexibilityScore).toBe(50)   // >= 50
  })

  it('annualVacationDays が 20 である', () => {
    const time = calculateTimeMargin(createDefaultProfile())

    expect(time.annualVacationDays).toBe(20)
  })
})

// ============================================================
// 5. calculateEnergyMargin
// ============================================================

describe('calculateEnergyMargin', () => {
  it('高収入・低支出プロファイルで stressLevel が低い', () => {
    const highSaver = calculateEnergyMargin(profileWith({
      grossIncome: 2000,
      rsuAnnual: 500,
      livingCostAnnual: 200,
      housingCostAnnual: 100,
    }))
    const lowSaver = calculateEnergyMargin(profileWith({
      grossIncome: 500,
      rsuAnnual: 0,
      livingCostAnnual: 300,
      housingCostAnnual: 150,
    }))

    expect(highSaver.stressLevel).toBeLessThan(lowSaver.stressLevel)
  })

  it('年齢が高いほど physicalHealthScore が下がる', () => {
    const young = calculateEnergyMargin(profileWith({ currentAge: 25 }))
    const mid = calculateEnergyMargin(profileWith({ currentAge: 45 }))
    const senior = calculateEnergyMargin(profileWith({ currentAge: 60 }))

    expect(young.physicalHealthScore).toBeGreaterThan(mid.physicalHealthScore)
    expect(mid.physicalHealthScore).toBeGreaterThan(senior.physicalHealthScore)
  })

  it('stressLevel が 20〜80 の範囲にクランプされる', () => {
    // 極端に高貯蓄率
    const low = calculateEnergyMargin(profileWith({
      grossIncome: 10000,
      rsuAnnual: 0,
      livingCostAnnual: 100,
      housingCostAnnual: 50,
    }))
    // 極端に低貯蓄率
    const high = calculateEnergyMargin(profileWith({
      grossIncome: 100,
      rsuAnnual: 0,
      livingCostAnnual: 300,
      housingCostAnnual: 200,
    }))

    expect(low.stressLevel).toBeGreaterThanOrEqual(20)
    expect(high.stressLevel).toBeLessThanOrEqual(80)
  })

  it('physicalHealthScore の下限が 50 である', () => {
    // 非常に高齢
    const energy = calculateEnergyMargin(profileWith({ currentAge: 99 }))

    expect(energy.physicalHealthScore).toBeGreaterThanOrEqual(50)
  })
})

// ============================================================
// 6. calculateMargin
// ============================================================

describe('calculateMargin', () => {
  it('返り値が money, time, energy の3つを含む', async () => {
    const profile = createDefaultProfile()
    const simResult = await runSimulation(profile)
    const margin = calculateMargin(profile, simResult)

    expect(margin).toHaveProperty('money')
    expect(margin).toHaveProperty('time')
    expect(margin).toHaveProperty('energy')
  })

  it('simResult が null でも money 以外はクラッシュしない', () => {
    const profile = createDefaultProfile()
    const margin = calculateMargin(profile, null)

    expect(margin).toHaveProperty('money')
    expect(margin).toHaveProperty('time')
    expect(margin).toHaveProperty('energy')

    // money は NaN（0埋め禁止）
    expect(margin.money.monthlyDisposableIncome).toBeNaN()
    // time, energy は通常の値
    expect(Number.isFinite(margin.time.weeklyFreeHours)).toBe(true)
    expect(Number.isFinite(margin.energy.stressLevel)).toBe(true)
  })
})

// ============================================================
// 7. updateWorldLineWithResults
// ============================================================

describe('updateWorldLineWithResults', () => {
  it('WorldLine の result が正しく更新される', async () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)
    const simResult = await runSimulation(profile)

    // 更新前: result.simulation は null
    expect(wl.result.simulation).toBeNull()
    expect(wl.result.margin).toBeNull()
    expect(wl.result.kpis).toBeNull()

    const updated = updateWorldLineWithResults(wl, simResult)

    // 更新後: result が設定される
    expect(updated.result.simulation).toBe(simResult)
    expect(updated.result.margin).not.toBeNull()
    expect(updated.result.kpis).not.toBeNull()
    expect(updated.result.lastCalculatedAt).toBeInstanceOf(Date)
    expect(updated.result.error).toBeNull()
  })

  it('isCalculating が false になる', async () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)
    const simResult = await runSimulation(profile)

    const updated = updateWorldLineWithResults(wl, simResult)

    expect(updated.result.isCalculating).toBe(false)
  })

  it('元の WorldLine は変更されない（イミュータブル）', async () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)
    const simResult = await runSimulation(profile)

    updateWorldLineWithResults(wl, simResult)

    // 元のオブジェクトは変わらない
    expect(wl.result.simulation).toBeNull()
    expect(wl.result.margin).toBeNull()
    expect(wl.result.kpis).toBeNull()
  })

  it('更新後の kpis に正しい値が入る', async () => {
    const profile = createDefaultProfile()
    const wl = adaptV1ProfileToV2WorldLine(profile)
    const simResult = await runSimulation(profile)

    const updated = updateWorldLineWithResults(wl, simResult)
    const kpis = updated.result.kpis!

    expect(kpis.survivalRate).toBeGreaterThanOrEqual(0)
    expect(kpis.survivalRate).toBeLessThanOrEqual(100)
    expect(typeof kpis.assetsAt60).toBe('number')
    expect(typeof kpis.assetsAt100).toBe('number')
  })
})
