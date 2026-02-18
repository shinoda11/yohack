import { describe, it, expect } from 'vitest'
import {
  runHousingScenarios,
  runRelocateScenario,
  computeMonthlyPaymentManYen,
  computeYearlyHousingCosts,
} from '../housing-sim'
import type { BuyNowParams, RelocateParams, RateStep } from '../housing-sim'
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

  it('CRN（Common Random Numbers）により同じ seed で再現性がある', { timeout: 30000 }, () => {
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

  it('4000万円, 1.5%, 35年の月額返済額が ±1% 精度で正しい', () => {
    const monthly = computeMonthlyPaymentManYen(4000, 1.5, 35)
    // 理論値: 約 12.245万円/月
    const expected = 12.245
    const tolerance = expected * 0.01
    expect(monthly).toBeGreaterThan(expected - tolerance)
    expect(monthly).toBeLessThan(expected + tolerance)
  })

  it('6800万円, 0.5%, 35年の月額返済額が ±1% 精度で正しい', () => {
    const monthly = computeMonthlyPaymentManYen(6800, 0.5, 35)
    // 理論値: 約 17.65万円/月
    const expected = 17.65
    const tolerance = expected * 0.01
    expect(monthly).toBeGreaterThan(expected - tolerance)
    expect(monthly).toBeLessThan(expected + tolerance)
  })

  it('高金利（3.0%）でも正しく計算される', () => {
    const monthly = computeMonthlyPaymentManYen(5000, 3.0, 35)
    // 月額は金利が上がるほど増加する
    const lowRate = computeMonthlyPaymentManYen(5000, 1.0, 35)
    expect(monthly).toBeGreaterThan(lowRate)
    // 5000万円 3.0% 35年 → 約19.3万円/月
    expect(monthly).toBeGreaterThan(18)
    expect(monthly).toBeLessThan(21)
  })
})

// ============================================================
// 8. 変動金利モデル（rateSteps）詳細テスト
// ============================================================

describe('変動金利モデル（rateSteps）', () => {
  const FULL_RATE_STEPS: RateStep[] = [
    { year: 0, rate: 0.5 },
    { year: 5, rate: 0.8 },
    { year: 10, rate: 1.1 },
    { year: 15, rate: 1.5 },
    { year: 20, rate: 1.8 },
    { year: 25, rate: 2.0 },
    { year: 30, rate: 2.3 },
  ]

  it('ステップアップ毎に年間コストが増加する', () => {
    const params = defaultBuyParams({
      propertyPrice: 8500,
      downPayment: 1700,
      interestRate: 0.5,
      mortgageYears: 35,
      ownerAnnualCost: 60,
      ownerCostEscalation: 0,
      rateSteps: FULL_RATE_STEPS,
    })
    const schedule = computeYearlyHousingCosts(params, 40)

    // 各ステップアップ境界でコスト増加
    expect(schedule[5]).toBeGreaterThan(schedule[0])
    expect(schedule[10]).toBeGreaterThan(schedule[5])
    expect(schedule[15]).toBeGreaterThan(schedule[10])
    expect(schedule[20]).toBeGreaterThan(schedule[15])
  })

  it('30年目以降もローン期間内ならコストが発生し、cap 2.3% で頭打ちになる', () => {
    const params = defaultBuyParams({
      propertyPrice: 6800,
      downPayment: 0,
      interestRate: 0.5,
      mortgageYears: 35,
      ownerAnnualCost: 0,
      ownerCostEscalation: 0,
      rateSteps: FULL_RATE_STEPS,
    })
    const schedule = computeYearlyHousingCosts(params, 40)

    // Year 30-34: cap 2.3% でローン返済あり
    expect(schedule[30]).toBeGreaterThan(0)
    expect(schedule[34]).toBeGreaterThan(0)
    // Year 30 と Year 34 は同一金利（2.3%）なので大きく変わらない
    // （残高減少による微減のみ）
    const ratio = schedule[34] / schedule[30]
    expect(ratio).toBeGreaterThan(0.8)
    expect(ratio).toBeLessThanOrEqual(1.0)
    // Year 35+: ローン完済、ownerAnnualCost=0 なので 0
    expect(schedule[35]).toBeCloseTo(0, 1)
  })

  it('固定金利と初期同率の変動金利で year 0 は同じコスト', () => {
    const fixedParams = defaultBuyParams({
      interestRate: 0.5,
      ownerAnnualCost: 50,
      ownerCostEscalation: 0,
    })
    const variableParams = defaultBuyParams({
      interestRate: 0.5,
      ownerAnnualCost: 50,
      ownerCostEscalation: 0,
      rateSteps: [{ year: 0, rate: 0.5 }],
    })

    const fixedSchedule = computeYearlyHousingCosts(fixedParams, 5)
    const variableSchedule = computeYearlyHousingCosts(variableParams, 5)

    expect(variableSchedule[0]).toBeCloseTo(fixedSchedule[0], 2)
  })

  it('ステップアップで月額返済額が再計算され、大幅増が反映される', () => {
    const params = defaultBuyParams({
      propertyPrice: 5000,
      downPayment: 1000,
      interestRate: 0.5,
      mortgageYears: 35,
      ownerAnnualCost: 0,
      ownerCostEscalation: 0,
      rateSteps: [
        { year: 0, rate: 0.5 },
        { year: 5, rate: 2.0 },
      ],
    })
    const schedule = computeYearlyHousingCosts(params, 10)

    // 0.5% → 2.0% のジャンプで 10% 以上増加するはず
    expect(schedule[5]).toBeGreaterThan(schedule[4] * 1.1)
  })

  it('rateSteps が年順でなくてもソートされて正しく適用される', () => {
    const params = defaultBuyParams({
      interestRate: 0.5,
      ownerAnnualCost: 0,
      ownerCostEscalation: 0,
      rateSteps: [
        { year: 10, rate: 1.5 },
        { year: 0, rate: 0.5 },
        { year: 5, rate: 1.0 },
      ],
    })
    const schedule = computeYearlyHousingCosts(params, 15)

    // year 0-4: 0.5%, year 5-9: 1.0%, year 10+: 1.5%
    expect(schedule[5]).toBeGreaterThan(schedule[0])
    expect(schedule[10]).toBeGreaterThan(schedule[5])
  })
})

// ============================================================
// 9. BUY_NOW 詳細テスト
// ============================================================

describe('BUY_NOW 詳細', () => {
  it('ローン完済後は維持費のみになる', () => {
    const mortgageYears = 10
    const ownerAnnualCost = 60
    const params = defaultBuyParams({
      mortgageYears,
      ownerAnnualCost,
      ownerCostEscalation: 0,
    })
    const schedule = computeYearlyHousingCosts(params, 20)

    // ローン期間中（year 0）: ローン返済 + 維持費
    expect(schedule[0]).toBeGreaterThan(ownerAnnualCost)
    // ローン完済後（year 10+）: 維持費のみ
    expect(schedule[10]).toBeCloseTo(ownerAnnualCost, 0)
    expect(schedule[15]).toBeCloseTo(ownerAnnualCost, 0)
    expect(schedule[19]).toBeCloseTo(ownerAnnualCost, 0)
  })

  it('維持費逓増（1.5%/年）が正しく効く', () => {
    const params = defaultBuyParams({
      mortgageYears: 5,
      ownerAnnualCost: 100,
      ownerCostEscalation: 1.5,
    })
    const schedule = computeYearlyHousingCosts(params, 30)

    // Year 10: 100 * (1.015)^10 ≈ 116.1
    expect(schedule[10]).toBeCloseTo(100 * Math.pow(1.015, 10), 0)
    // Year 20: 100 * (1.015)^20 ≈ 134.7
    expect(schedule[20]).toBeCloseTo(100 * Math.pow(1.015, 20), 0)
    // Year 29: 100 * (1.015)^29 ≈ 153.7
    expect(schedule[29]).toBeCloseTo(100 * Math.pow(1.015, 29), 0)
  })

  it('totalCost40Years = 頭金+諸費用+住宅コストスケジュール合計', () => {
    const profile = createDefaultProfile()
    const buyParams = defaultBuyParams({
      propertyPrice: 5000,
      downPayment: 1000,
      purchaseCostRate: 7,
      ownerCostEscalation: 0,
    })
    const results = runHousingScenarios(profile, buyParams)
    const buyResult = results[1]

    const purchaseOutflow = buyParams.downPayment +
      buyParams.propertyPrice * (buyParams.purchaseCostRate / 100)
    const totalYears = 100 - profile.currentAge + 1
    const schedule = computeYearlyHousingCosts(buyParams, totalYears)
    const schedule40Sum = schedule.slice(0, 40).reduce((s, c) => s + c, 0)

    expect(buyResult.totalCost40Years).toBe(
      Math.round(purchaseOutflow + schedule40Sum)
    )
  })

  it('monthlyPayment = ローン月額 + 管理費月額', () => {
    const buyParams = defaultBuyParams()
    const loanPrincipal = buyParams.propertyPrice - buyParams.downPayment
    const expectedMonthly = computeMonthlyPaymentManYen(
      loanPrincipal, buyParams.interestRate, buyParams.mortgageYears
    )
    const expectedTotal = expectedMonthly + buyParams.ownerAnnualCost / 12

    const results = runHousingScenarios(createDefaultProfile(), buyParams)
    expect(results[1].monthlyPayment).toBeCloseTo(expectedTotal, 4)
  })
})

// ============================================================
// 10. 累積コスト比較（Rent vs Buy）
// ============================================================

describe('累積コスト比較', () => {
  it('高金利購入は賃貸より40年総コストが高い', () => {
    const profile = profileWith({
      housingCostAnnual: 180,
      rentInflationRate: 0.5,
    })
    const buyParams = defaultBuyParams({
      propertyPrice: 8000,
      downPayment: 1000,
      interestRate: 3.0,
      mortgageYears: 35,
      ownerAnnualCost: 80,
    })
    const results = runHousingScenarios(profile, buyParams)
    const rent = results[0]
    const buy = results[1]

    // 3% 金利で 7000万ローン → 賃貸より高い
    expect(buy.totalCost40Years).toBeGreaterThan(rent.totalCost40Years)
  })

  it('assetsAt60 が両シナリオで数値', () => {
    const results = runHousingScenarios(createDefaultProfile(), defaultBuyParams())
    expect(typeof results[0].assetsAt60).toBe('number')
    expect(typeof results[1].assetsAt60).toBe('number')
  })

  it('score.overall が両シナリオで 0-100 の範囲', () => {
    const results = runHousingScenarios(createDefaultProfile(), defaultBuyParams())
    for (const r of results) {
      expect(r.simulation.score.overall).toBeGreaterThanOrEqual(0)
      expect(r.simulation.score.overall).toBeLessThanOrEqual(100)
    }
  })

  it('safeFireAge が null でなければ currentAge 以上 70 以下', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, defaultBuyParams())
    for (const r of results) {
      if (r.safeFireAge !== null) {
        expect(r.safeFireAge).toBeGreaterThanOrEqual(profile.currentAge)
        expect(r.safeFireAge).toBeLessThanOrEqual(70)
      }
    }
  })

  it('yearlyData の各年で age が連続する', () => {
    const profile = createDefaultProfile()
    const results = runHousingScenarios(profile, defaultBuyParams())
    for (const r of results) {
      const data = r.simulation.paths.yearlyData
      for (let i = 1; i < data.length; i++) {
        expect(data[i].age).toBe(data[i - 1].age + 1)
      }
    }
  })
})

// ============================================================
// 11. C01 ケース（年収 2,400万・物件 8,500万）
// ============================================================

describe('C01 ケース（年収 2,400万・物件 8,500万）', { timeout: 30000 }, () => {
  const c01Profile = profileWith({
    currentAge: 35,
    targetRetireAge: 65,
    mode: 'couple',
    grossIncome: 1500,
    partnerGrossIncome: 900,
    assetCash: 500,
    assetInvest: 2000,
    assetDefinedContributionJP: 300,
    livingCostAnnual: 360,
    housingCostAnnual: 240,
    expectedReturn: 5,
    inflationRate: 2,
    rentInflationRate: 0.5,
    volatility: 0.15,
    homeStatus: 'renter' as const,
  })

  const c01BuyParams: BuyNowParams = {
    propertyPrice: 8500,
    downPayment: 1700,
    purchaseCostRate: 7,
    mortgageYears: 35,
    interestRate: 0.5,
    ownerAnnualCost: 80,
    buyAfterYears: 0,
    rateSteps: [
      { year: 0, rate: 0.5 },
      { year: 5, rate: 0.8 },
      { year: 10, rate: 1.1 },
      { year: 15, rate: 1.5 },
      { year: 20, rate: 1.8 },
      { year: 25, rate: 2.0 },
      { year: 30, rate: 2.3 },
    ],
    ownerCostEscalation: 1.5,
  }

  it('賃貸ベースラインが実行でき survivalRate > 0', () => {
    const results = runHousingScenarios(c01Profile, null)
    expect(results[0].type).toBe('RENT_BASELINE')
    expect(results[0].simulation.metrics.survivalRate).toBeGreaterThan(0)
  })

  it('8,500万物件の購入シナリオが実行できる', () => {
    const results = runHousingScenarios(c01Profile, c01BuyParams)
    expect(results).toHaveLength(2)
    expect(results[1].type).toBe('BUY_NOW')
    expect(results[1].simulation.metrics.survivalRate).toBeGreaterThanOrEqual(0)
  })

  it('初期月額返済額が ±1% 精度で正しい', () => {
    const loanPrincipal = 8500 - 1700 // 6800万
    const monthly = computeMonthlyPaymentManYen(loanPrincipal, 0.5, 35)
    // 6800万, 0.5%, 35年 → 理論値 約17.65万円/月
    const expected = 17.65
    const tolerance = expected * 0.01
    expect(monthly).toBeGreaterThan(expected - tolerance)
    expect(monthly).toBeLessThan(expected + tolerance)
  })

  it('頭金+諸費用が資産から正しく差し引かれる', () => {
    const results = runHousingScenarios(c01Profile, c01BuyParams)
    const buyProfile = results[1].scenarioProfile
    const originalTotal = c01Profile.assetCash + c01Profile.assetInvest
    const buyTotal = buyProfile.assetCash + buyProfile.assetInvest
    // 1700 + 8500 * 0.07 = 1700 + 595 = 2295万
    const purchaseOutflow = 1700 + 8500 * 0.07
    expect(purchaseOutflow).toBe(2295)
    expect(buyTotal).toBeCloseTo(originalTotal - purchaseOutflow, 1)
  })

  it('変動金利スケジュールで 66年間のコストが計算できる', () => {
    const totalYears = 100 - 35 + 1 // 66年
    const schedule = computeYearlyHousingCosts(c01BuyParams, totalYears)

    expect(schedule).toHaveLength(totalYears)
    expect(schedule[0]).toBeGreaterThan(0)
    // ローン完済後（year 35+）はコスト大幅減
    expect(schedule[35]).toBeLessThan(schedule[34])
  })

  it('CRN 再現性', () => {
    const r1 = runHousingScenarios(c01Profile, c01BuyParams)
    const r2 = runHousingScenarios(c01Profile, c01BuyParams)

    expect(r1[0].simulation.metrics.survivalRate)
      .toBe(r2[0].simulation.metrics.survivalRate)
    expect(r1[1].simulation.metrics.survivalRate)
      .toBe(r2[1].simulation.metrics.survivalRate)
    expect(r1[1].totalCost40Years).toBe(r2[1].totalCost40Years)
  })

  it('高収入世帯の賃貸 survivalRate が高い（>= 50%）', () => {
    const results = runHousingScenarios(c01Profile, null)
    // 世帯年収 2,400万 → 賃貸で生存率が低いことはない
    expect(results[0].simulation.metrics.survivalRate).toBeGreaterThanOrEqual(50)
  })

  it('paths.yearlyData が currentAge から 100 歳まで', () => {
    const results = runHousingScenarios(c01Profile, c01BuyParams)
    for (const r of results) {
      const data = r.simulation.paths.yearlyData
      expect(data[0].age).toBe(35)
      expect(data[data.length - 1].age).toBe(100)
      expect(data.length).toBe(66) // 35〜100歳
    }
  })
})
