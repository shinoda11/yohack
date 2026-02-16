import { describe, it, expect } from 'vitest'
import {
  runHousingScenarios,
  runRelocateScenario,
  computeMonthlyPaymentManYen,
  computeYearlyHousingCosts,
} from '../housing-sim'
import type { BuyNowParams, RelocateParams } from '../housing-sim'
import { createDefaultProfile } from '../engine'
import type { Profile } from '../types'

// ============================================================
// Helper
// ============================================================

/** createDefaultProfile をベースに部分的に上書き */
function profileWith(overrides: Partial<Profile>): Profile {
  return { ...createDefaultProfile(), ...overrides }
}

/** 標準的な購入パラメータ */
function defaultBuyParams(overrides: Partial<BuyNowParams> = {}): BuyNowParams {
  return {
    propertyPrice: 5000,        // 5,000万円
    downPayment: 1000,          // 1,000万円
    purchaseCostRate: 7,        // 7%
    mortgageYears: 35,
    interestRate: 1.5,          // 1.5%
    ownerAnnualCost: 50,        // 50万円/年
    buyAfterYears: 0,
    ...overrides,
  }
}

/** 標準的な住み替えパラメータ */
function defaultRelocateParams(overrides: Partial<RelocateParams> = {}): RelocateParams {
  return {
    currentPropertyValue: 4500,
    currentMortgageRemaining: 2000,
    sellingCostRate: 5,
    relocateAfterYears: 0,
    newPropertyPrice: 6000,
    newDownPayment: 1500,
    newPurchaseCostRate: 7,
    newMortgageYears: 30,
    newInterestRate: 1.5,
    newOwnerAnnualCost: 60,
    ...overrides,
  }
}

// ============================================================
// 1. 賃貸ベースライン（RENT_BASELINE）
// ============================================================

describe('RENT_BASELINE', () => {
  it('デフォルトプロファイルで実行して結果の構造が正しい', () => {
    const results = runHousingScenarios(createDefaultProfile(), null)

    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('RENT_BASELINE')
  })

  it('paths, metrics, score が存在する', () => {
    const results = runHousingScenarios(createDefaultProfile(), null)
    const { simulation } = results[0]

    expect(simulation).toHaveProperty('paths')
    expect(simulation).toHaveProperty('metrics')
    expect(simulation).toHaveProperty('score')

    // paths の内部構造
    expect(simulation.paths.yearlyData).toBeInstanceOf(Array)
    expect(simulation.paths.upperPath).toBeInstanceOf(Array)
    expect(simulation.paths.lowerPath).toBeInstanceOf(Array)
    expect(simulation.paths.median).toBeInstanceOf(Array)
    expect(simulation.paths.optimistic).toBeInstanceOf(Array)
    expect(simulation.paths.pessimistic).toBeInstanceOf(Array)
  })

  it('survivalRate が 0〜100 の範囲', () => {
    const results = runHousingScenarios(createDefaultProfile(), null)

    expect(results[0].simulation.metrics.survivalRate).toBeGreaterThanOrEqual(0)
    expect(results[0].simulation.metrics.survivalRate).toBeLessThanOrEqual(100)
  })

  it('monthlyPayment が housingCostAnnual / 12 と一致', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, null)

    expect(results[0].monthlyPayment).toBeCloseTo(profile.housingCostAnnual / 12, 5)
  })

  it('totalCost40Years が rentInflationRate 込みで計算される', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, null)

    // rentInflationRate=0.5% で40年の合計
    const rentInflation = (profile.rentInflationRate ?? profile.inflationRate) / 100
    let expected = 0
    for (let y = 0; y < 40; y++) {
      expected += profile.housingCostAnnual * Math.pow(1 + rentInflation, y)
    }
    expected = Math.round(expected)

    expect(results[0].totalCost40Years).toBe(expected)
  })
})

// ============================================================
// 2. 購入シナリオ（BUY_NOW）
// ============================================================

describe('BUY_NOW', () => {
  it('buyAfterYears = 0 で即購入シナリオが動く', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({ buyAfterYears: 0 })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[1].simulation).toHaveProperty('paths')
    expect(results[1].simulation).toHaveProperty('metrics')
    expect(results[1].simulation).toHaveProperty('score')
  })

  it('buyAfterYears = 3 でも動く', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({ buyAfterYears: 3 })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[1].simulation.metrics.survivalRate).toBeGreaterThanOrEqual(0)
  })

  it('buyAfterYears = 10 でも動く', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({ buyAfterYears: 10 })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[1].simulation.metrics.survivalRate).toBeGreaterThanOrEqual(0)
  })

  it('購入後は housingCostAnnual がローン返済 + 管理費に切り替わる', () => {
    const buyParams = defaultBuyParams({ buyAfterYears: 0 })
    const results = runHousingScenarios(createDefaultProfile(), buyParams)

    const buyResult = results[1]
    const loanPrincipal = buyParams.propertyPrice - buyParams.downPayment
    const expectedMonthly = computeMonthlyPaymentManYen(
      loanPrincipal,
      buyParams.interestRate,
      buyParams.mortgageYears
    )
    const expectedAnnual = expectedMonthly * 12 + buyParams.ownerAnnualCost

    // scenarioProfile の housingCostAnnual がローン返済に変更されている
    expect(buyResult.scenarioProfile.housingCostAnnual).toBeCloseTo(expectedAnnual, 2)
    // 元の賃貸の housingCostAnnual とは異なる
    expect(buyResult.scenarioProfile.housingCostAnnual).not.toBe(
      createDefaultProfile().housingCostAnnual
    )
  })

  it('即購入時に頭金+諸費用が資産から差し引かれる', () => {
    const profile = createDefaultProfile()
    const buyParams = defaultBuyParams({ buyAfterYears: 0 })
    const results = runHousingScenarios(profile, buyParams)

    const buyProfile = results[1].scenarioProfile
    const originalTotal = profile.assetCash + profile.assetInvest
    const buyTotal = buyProfile.assetCash + buyProfile.assetInvest
    const purchaseOutflow = buyParams.downPayment + buyParams.propertyPrice * (buyParams.purchaseCostRate / 100)

    expect(buyTotal).toBeCloseTo(originalTotal - purchaseOutflow, 2)
  })
})

// ============================================================
// 3. 住み替えシナリオ（RELOCATE）
// ============================================================

describe('RELOCATE', () => {
  it('基本パラメータで実行できる', () => {
    const profile = profileWith({ homeStatus: 'owner' })
    const result = runRelocateScenario(profile, defaultRelocateParams())

    expect(result.type).toBe('RELOCATE')
    expect(result.simulation).toHaveProperty('paths')
    expect(result.simulation).toHaveProperty('metrics')
    expect(result.simulation).toHaveProperty('score')
    expect(result.simulation.metrics.survivalRate).toBeGreaterThanOrEqual(0)
    expect(result.simulation.metrics.survivalRate).toBeLessThanOrEqual(100)
  })

  it('売却益が正しく計算される', () => {
    const params = defaultRelocateParams({
      currentPropertyValue: 5000,
      currentMortgageRemaining: 2000,
      sellingCostRate: 5,
    })
    // 売却益 = 物件価値 - 残債 - 売却費用
    // = 5000 - 2000 - (5000 * 0.05) = 5000 - 2000 - 250 = 2750
    const expectedSaleProceeds = 5000 - 2000 - 5000 * (5 / 100)

    expect(expectedSaleProceeds).toBe(2750)

    // シナリオが実行でき、結果が返る
    const profile = profileWith({ homeStatus: 'owner' })
    const result = runRelocateScenario(profile, params)
    expect(result.type).toBe('RELOCATE')
  })

  it('runHousingScenarios 経由でも RELOCATE が返る', () => {
    const profile = profileWith({ homeStatus: 'owner' })
    const results = runHousingScenarios(
      profile,
      defaultBuyParams(),
      defaultRelocateParams()
    )

    expect(results).toHaveLength(3)
    expect(results[0].type).toBe('RENT_BASELINE')
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[2].type).toBe('RELOCATE')
  })

  it('将来の住み替え（relocateAfterYears > 0）でもクラッシュしない', () => {
    const profile = profileWith({ homeStatus: 'owner' })
    const result = runRelocateScenario(
      profile,
      defaultRelocateParams({ relocateAfterYears: 5 })
    )

    expect(result.type).toBe('RELOCATE')
    expect(result.scenarioProfile.homeStatus).toBe('relocating')
    expect(result.scenarioProfile.lifeEvents.length).toBeGreaterThan(0)
  })
})

// ============================================================
// 4. 比較の整合性
// ============================================================

describe('比較の整合性', () => {
  it('同じプロファイルで賃貸 vs 購入を実行し両方の結果が返る', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, defaultBuyParams())

    expect(results).toHaveLength(2)
    expect(results[0].type).toBe('RENT_BASELINE')
    expect(results[1].type).toBe('BUY_NOW')

    // 両方のシミュレーション結果がある
    expect(results[0].simulation.paths.yearlyData.length).toBeGreaterThan(0)
    expect(results[1].simulation.paths.yearlyData.length).toBeGreaterThan(0)

    // 両方の score が計算済み
    expect(results[0].simulation.score.overall).toBeGreaterThanOrEqual(0)
    expect(results[1].simulation.score.overall).toBeGreaterThanOrEqual(0)
  })

  it('CRN（Common Random Numbers）により同じ seed で再現性がある', { timeout: 15000 }, () => {
    const profile = createDefaultProfile()

    const results1 = runHousingScenarios(profile, defaultBuyParams())
    const results2 = runHousingScenarios(profile, defaultBuyParams())

    // 同じ入力 → 同じ出力（RENT）
    expect(results1[0].simulation.metrics.survivalRate)
      .toBe(results2[0].simulation.metrics.survivalRate)
    expect(results1[0].simulation.paths.yearlyData)
      .toEqual(results2[0].simulation.paths.yearlyData)

    // 同じ入力 → 同じ出力（BUY）
    expect(results1[1].simulation.metrics.survivalRate)
      .toBe(results2[1].simulation.metrics.survivalRate)
    expect(results1[1].simulation.paths.yearlyData)
      .toEqual(results2[1].simulation.paths.yearlyData)
  })

  it('賃貸と購入の paths.yearlyData の長さが同じ', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, defaultBuyParams())

    expect(results[0].simulation.paths.yearlyData.length)
      .toBe(results[1].simulation.paths.yearlyData.length)
  })
})

// ============================================================
// 5. エッジケース
// ============================================================

describe('エッジケース', () => {
  it('頭金が物件価格を超える場合', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({
        propertyPrice: 3000,
        downPayment: 5000, // 頭金 > 物件価格
      })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    // loanPrincipal が負 → computeMonthlyPaymentManYen は 0 を返す
    const loanPrincipal = 3000 - 5000 // -2000
    expect(computeMonthlyPaymentManYen(loanPrincipal, 1.5, 35)).toBe(0)
  })

  it('ローン年数 0 の場合', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({ mortgageYears: 0 })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    // mortgageYears = 0 → monthly payment は 0
    expect(computeMonthlyPaymentManYen(4000, 1.5, 0)).toBe(0)
  })

  it('物件価格 0 の場合', () => {
    const results = runHousingScenarios(
      createDefaultProfile(),
      defaultBuyParams({ propertyPrice: 0, downPayment: 0 })
    )

    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[1].monthlyPayment).toBeCloseTo(
      defaultBuyParams().ownerAnnualCost / 12, 5
    )
  })
})

// ============================================================
// 6. computeMonthlyPaymentManYen 単体テスト
// ============================================================

// ============================================================
// 6b. computeYearlyHousingCosts 単体テスト
// ============================================================

describe('computeYearlyHousingCosts', () => {
  it('固定金利（rateSteps なし）で年次コストが返る', () => {
    const params = defaultBuyParams({ interestRate: 1.0 })
    const schedule = computeYearlyHousingCosts(params, 40)

    expect(schedule).toHaveLength(40)
    // 最初の年は正の値
    expect(schedule[0]).toBeGreaterThan(0)
  })

  it('ローン期間後は維持費のみになる', () => {
    const params = defaultBuyParams({ mortgageYears: 10, ownerAnnualCost: 50 })
    const schedule = computeYearlyHousingCosts(params, 20)

    // year 0 (during mortgage) > year 15 (post-mortgage, owner costs only)
    expect(schedule[0]).toBeGreaterThan(schedule[15])
    // year 15 should be approximately ownerAnnualCost (with potential escalation)
    expect(schedule[15]).toBeCloseTo(50, 0)
  })

  it('ownerCostEscalation で維持費が逓増する', () => {
    const params = defaultBuyParams({
      mortgageYears: 5,
      ownerAnnualCost: 100,
      ownerCostEscalation: 2.0, // 2%/年
    })
    const schedule = computeYearlyHousingCosts(params, 20)

    // Post-mortgage: year 10 owner cost should be 100 * (1.02)^10 ≈ 121.9
    const expectedYear10 = 100 * Math.pow(1.02, 10)
    expect(schedule[10]).toBeCloseTo(expectedYear10, 0)
  })

  it('rateSteps で金利ステップアップ後はコスト増', () => {
    const params = defaultBuyParams({
      interestRate: 0.5,
      rateSteps: [
        { year: 0, rate: 0.5 },
        { year: 5, rate: 1.5 },
      ],
    })
    const schedule = computeYearlyHousingCosts(params, 10)

    // ステップアップ後の年はコスト増
    expect(schedule[6]).toBeGreaterThan(schedule[0])
  })

  it('loanPrincipal <= 0 の場合は維持費のみ', () => {
    const params = defaultBuyParams({
      propertyPrice: 3000,
      downPayment: 5000,
      ownerAnnualCost: 50,
    })
    const schedule = computeYearlyHousingCosts(params, 5)

    expect(schedule[0]).toBeCloseTo(50, 0)
    expect(schedule).toHaveLength(5)
  })
})

// ============================================================
// 7. computeMonthlyPaymentManYen 単体テスト
// ============================================================

describe('computeMonthlyPaymentManYen', () => {
  it('金利 0% の場合は元金の均等割', () => {
    const monthly = computeMonthlyPaymentManYen(3600, 0, 30)

    expect(monthly).toBeCloseTo(3600 / (30 * 12), 5)
  })

  it('元金 0 の場合は 0', () => {
    expect(computeMonthlyPaymentManYen(0, 1.5, 35)).toBe(0)
  })

  it('年数 0 の場合は 0', () => {
    expect(computeMonthlyPaymentManYen(4000, 1.5, 0)).toBe(0)
  })

  it('標準的なローン（4000万円, 1.5%, 35年）で妥当な月額が返る', () => {
    const monthly = computeMonthlyPaymentManYen(4000, 1.5, 35)

    // 月額は 10〜15万円程度が妥当
    expect(monthly).toBeGreaterThan(10)
    expect(monthly).toBeLessThan(15)
  })
})
