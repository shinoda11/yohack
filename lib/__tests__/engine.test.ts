import { describe, it, expect, vi } from 'vitest'
import { runSimulation, computeExitScore, createDefaultProfile, validateProfile } from '../engine'
import { branchToLifeEvents } from '../branch'
import type { Profile, SimulationPath, KeyMetrics } from '../types'
import type { Branch } from '../branch'

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
      p25Path: [{ age: 35, assets: 2200 }],
      p75Path: [{ age: 35, assets: 3400 }],
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

// ============================================================
// 5. validateProfile
// ============================================================

describe('validateProfile', () => {
  it('正常値でエラーなし', () => {
    const errors = validateProfile(createDefaultProfile())

    expect(errors).toHaveLength(0)
  })

  it('currentAge が -1 でエラー', () => {
    const errors = validateProfile(profileWith({ currentAge: -1 }))

    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.field === 'currentAge')).toBe(true)
  })

  it('currentAge が 100 でエラー', () => {
    const errors = validateProfile(profileWith({ currentAge: 100 }))

    expect(errors.some(e => e.field === 'currentAge')).toBe(true)
  })

  it('currentAge が小数でエラー', () => {
    const errors = validateProfile(profileWith({ currentAge: 35.5 }))

    expect(errors.some(e => e.field === 'currentAge')).toBe(true)
  })

  it('targetRetireAge < currentAge でエラー', () => {
    const errors = validateProfile(profileWith({
      currentAge: 50,
      targetRetireAge: 40,
    }))

    expect(errors.some(e => e.field === 'targetRetireAge')).toBe(true)
  })

  it('targetRetireAge > 100 でエラー', () => {
    const errors = validateProfile(profileWith({ targetRetireAge: 101 }))

    expect(errors.some(e => e.field === 'targetRetireAge')).toBe(true)
  })

  it('grossIncome がマイナスでエラー', () => {
    const errors = validateProfile(profileWith({ grossIncome: -100 }))

    expect(errors.some(e => e.field === 'grossIncome')).toBe(true)
  })

  it('livingCostAnnual がマイナスでエラー', () => {
    const errors = validateProfile(profileWith({ livingCostAnnual: -50 }))

    expect(errors.some(e => e.field === 'livingCostAnnual')).toBe(true)
  })

  it('housingCostAnnual がマイナスでエラー', () => {
    const errors = validateProfile(profileWith({ housingCostAnnual: -10 }))

    expect(errors.some(e => e.field === 'housingCostAnnual')).toBe(true)
  })

  it('資産フィールドがマイナスでエラー', () => {
    const errors = validateProfile(profileWith({
      assetCash: -100,
      assetInvest: -200,
      assetDefinedContributionJP: -50,
    }))

    expect(errors.some(e => e.field === 'assetCash')).toBe(true)
    expect(errors.some(e => e.field === 'assetInvest')).toBe(true)
    expect(errors.some(e => e.field === 'assetDefinedContributionJP')).toBe(true)
  })

  it('volatility が 2 でエラー', () => {
    const errors = validateProfile(profileWith({ volatility: 2 }))

    expect(errors.some(e => e.field === 'volatility')).toBe(true)
  })

  it('expectedReturn が範囲外でエラー', () => {
    const errors = validateProfile(profileWith({ expectedReturn: 150 }))

    expect(errors.some(e => e.field === 'expectedReturn')).toBe(true)
  })

  it('inflationRate が範囲外でエラー', () => {
    const errors = validateProfile(profileWith({ inflationRate: -20 }))

    expect(errors.some(e => e.field === 'inflationRate')).toBe(true)
  })

  it('effectiveTaxRate が範囲外でエラー', () => {
    const errors = validateProfile(profileWith({ effectiveTaxRate: 110 }))

    expect(errors.some(e => e.field === 'effectiveTaxRate')).toBe(true)
  })

  it('retireSpendingMultiplier が範囲外でエラー', () => {
    const errors = validateProfile(profileWith({ retireSpendingMultiplier: 3 }))

    expect(errors.some(e => e.field === 'retireSpendingMultiplier')).toBe(true)
  })

  it('複数エラーが同時に返る', () => {
    const errors = validateProfile(profileWith({
      currentAge: -1,
      grossIncome: -100,
      volatility: 5,
    }))

    expect(errors.length).toBeGreaterThanOrEqual(3)
  })

  it('各エラーに field と message がある', () => {
    const errors = validateProfile(profileWith({ currentAge: -1 }))

    for (const error of errors) {
      expect(typeof error.field).toBe('string')
      expect(typeof error.message).toBe('string')
      expect(error.message.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================
// 6. runSimulation バリデーション統合
// ============================================================

describe('runSimulation バリデーション', () => {
  it('不正プロファイルで例外が投げられる', async () => {
    const profile = profileWith({ currentAge: -1 })

    await expect(runSimulation(profile)).rejects.toThrow('バリデーションエラー')
  })

  it('volatility が範囲外で例外が投げられる', async () => {
    const profile = profileWith({ volatility: 2 })

    await expect(runSimulation(profile)).rejects.toThrow('バリデーションエラー')
  })

  it('エラーメッセージにフィールド名が含まれる', async () => {
    const profile = profileWith({ grossIncome: -100 })

    await expect(runSimulation(profile)).rejects.toThrow('grossIncome')
  })
})

// ============================================================
// 7. 退職後事業収入 (postRetireIncome)
// ============================================================

describe('退職後事業収入', () => {
  it('postRetireIncome=300 の場合、退職後〜75歳の間に収入が反映される', async () => {
    const retireAge = 55
    const endAge = 75
    const base = await runSimulation(profileWith({
      targetRetireAge: retireAge,
      postRetireIncome: 0,
      postRetireIncomeEndAge: endAge,
    }))
    const withIncome = await runSimulation(profileWith({
      targetRetireAge: retireAge,
      postRetireIncome: 300,
      postRetireIncomeEndAge: endAge,
    }))

    // 退職後事業収入があるほうが100歳時点の資産が大きい（中央値）
    const baseAt100 = base.paths.yearlyData[base.paths.yearlyData.length - 1].assets
    const withAt100 = withIncome.paths.yearlyData[withIncome.paths.yearlyData.length - 1].assets
    expect(withAt100).toBeGreaterThan(baseAt100)
  })

  it('postRetireIncome=0（デフォルト）で既存挙動と変わらない', async () => {
    const profile = createDefaultProfile()
    // デフォルトは postRetireIncome: 0
    expect(profile.postRetireIncome).toBe(0)
    expect(profile.postRetireIncomeEndAge).toBe(75)

    const result = await runSimulation(profile)
    // 既存テストと同じ: 結果が正常に返る
    expect(result.metrics.survivalRate).toBeGreaterThanOrEqual(0)
    expect(result.metrics.survivalRate).toBeLessThanOrEqual(100)
  })

  it('postRetireIncomeEndAge < retireAge の場合、退職後収入なし', async () => {
    // エンジンは内蔵シード PRNG を使用。同じ seed を指定すれば同じ乱数列になる
    const fixedSeed = 12345
    const retireAge = 55

    const base = await runSimulation(profileWith({
      targetRetireAge: retireAge,
      postRetireIncome: 0,
      postRetireIncomeEndAge: 50, // retireAge より前
    }), { seed: fixedSeed })

    const withIncome = await runSimulation(profileWith({
      targetRetireAge: retireAge,
      postRetireIncome: 500,
      postRetireIncomeEndAge: 50, // retireAge より前 → 効果なし
    }), { seed: fixedSeed })

    // 同じ seed + endAge < retireAge なので収入は発生せず、結果は一致するはず
    const baseAt100 = base.paths.yearlyData[base.paths.yearlyData.length - 1].assets
    const withAt100 = withIncome.paths.yearlyData[withIncome.paths.yearlyData.length - 1].assets
    const diff = Math.abs(withAt100 - baseAt100)
    expect(diff).toBeLessThan(1)
  })
})

// ============================================================
// 8. 子どもイベント教育費自動紐付け
// ============================================================

describe('子どもイベント教育費バンドル', () => {
  function childBranch(childNumber: number, age: number): Branch {
    return {
      id: `child_${childNumber}`,
      label: `第${childNumber}子`,
      detail: `${age}歳`,
      certainty: 'planned',
      age,
      eventType: 'child',
      eventParams: { childNumber },
    }
  }

  it('37歳で第一子 → 3段階の教育費イベントが生成される', () => {
    const profile = createDefaultProfile()
    const branch = childBranch(1, 37)
    const events = branchToLifeEvents(branch, profile)

    // 3イベント: 保育料、学費+塾、大学費用
    expect(events).toHaveLength(3)

    // 保育料: 37歳〜42歳（6年）50万
    const nursery = events.find(e => e.name.includes('保育'))!
    expect(nursery.type).toBe('expense_increase')
    expect(nursery.age).toBe(37)
    expect(nursery.amount).toBe(50)
    expect(nursery.duration).toBe(6)

    // 学費+塾: 43歳〜54歳（12年）100万
    const school = events.find(e => e.name.includes('学費'))!
    expect(school.type).toBe('expense_increase')
    expect(school.age).toBe(43)
    expect(school.amount).toBe(100)
    expect(school.duration).toBe(12)

    // 大学: 55歳〜58歳（4年）200万
    const univ = events.find(e => e.name.includes('大学'))!
    expect(univ.type).toBe('expense_increase')
    expect(univ.age).toBe(55)
    expect(univ.amount).toBe(200)
    expect(univ.duration).toBe(4)
  })

  it('37歳で第一子 + 40歳で第二子 → 2人分が正しく生成される', () => {
    const profile = createDefaultProfile()
    const events1 = branchToLifeEvents(childBranch(1, 37), profile)
    const events2 = branchToLifeEvents(childBranch(2, 40), profile)

    expect(events1).toHaveLength(3)
    expect(events2).toHaveLength(3)

    // 第一子は37歳ベース、第二子は40歳ベース
    expect(events1[0].age).toBe(37)
    expect(events2[0].age).toBe(40)

    // 第二子の大学開始: 40 + 18 = 58歳
    const univ2 = events2.find(e => e.name.includes('大学'))!
    expect(univ2.age).toBe(58)

    // 全イベント名に子番号が含まれる
    for (const e of events1) expect(e.name).toContain('第1子')
    for (const e of events2) expect(e.name).toContain('第2子')
  })

  it('子どもイベントなし → 教育費イベントなし', () => {
    const profile = createDefaultProfile()
    const branch: Branch = {
      id: 'income_down',
      label: '年収ダウン',
      detail: '',
      certainty: 'uncertain',
      age: 40,
      eventType: 'income_change',
      eventParams: { changePercent: -20 },
    }
    const events = branchToLifeEvents(branch, profile)

    // 教育費関連のイベントがない
    const eduEvents = events.filter(e =>
      e.name.includes('保育') || e.name.includes('学費') || e.name.includes('大学')
    )
    expect(eduEvents).toHaveLength(0)
  })
})
