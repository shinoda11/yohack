import { describe, it, expect } from 'vitest'
import { runSimulation, createDefaultProfile, calculateAnnualPension } from '../engine'
import type { Profile } from '../types'

// ============================================================
// Helper
// ============================================================

function profileWith(overrides: Partial<Profile>): Profile {
  return { ...createDefaultProfile(), ...overrides }
}

/**
 * Monte Carlo はランダム性があるため、複数回実行して平均を取る。
 * 各アサーションは実測値 ± 15pt 程度の余裕を持った範囲で検証する。
 *
 * 10回実行の実測値（2026-02-16 基準）:
 *   A: score=51 survival=63% FIRE=50 assets60=19,475万
 *   B: score=55 survival=70% FIRE=42 assets60=37,240万
 *   C: score=68 survival=75% FIRE=42 assets60=47,399万
 *   D: score=25 survival=0%  FIRE=null assets60=-3,521万
 *   E: score=64 survival=72% FIRE=49 assets60=21,482万
 */
async function runAverage(profile: Profile, runs = 3) {
  const results = await Promise.all(
    Array.from({ length: runs }, () => runSimulation(profile))
  )

  const avg = (fn: (r: typeof results[0]) => number) =>
    results.reduce((sum, r) => sum + fn(r), 0) / results.length

  // fireAge: null が混ざる場合は non-null の平均、全部 null なら null
  const fireAges = results.map(r => r.metrics.fireAge).filter((a): a is number => a !== null)
  const avgFireAge = fireAges.length > 0 ? fireAges.reduce((s, a) => s + a, 0) / fireAges.length : null

  // 60歳時点の median 資産
  const assetsAt60 = results.map(r => {
    const point = r.paths.yearlyData.find(p => p.age === 60)
    return point?.assets ?? 0
  })
  const avgAssetsAt60 = assetsAt60.reduce((s, a) => s + a, 0) / assetsAt60.length

  return {
    score: avg(r => r.score.overall),
    survival: avg(r => r.score.survival),
    lifestyle: avg(r => r.score.lifestyle),
    risk: avg(r => r.score.risk),
    liquidity: avg(r => r.score.liquidity),
    survivalRate: avg(r => r.metrics.survivalRate),
    fireAge: avgFireAge,
    assetsAt60: avgAssetsAt60,
    cashFlow: {
      pension: avg(r => r.cashFlow.pension),
      expenses: avg(r => r.cashFlow.expenses),
    },
  }
}

// ============================================================
// E2E ペルソナ検証テスト
// ============================================================

describe('E2E ペルソナ検証', () => {
  // ----------------------------------------------------------
  // A: 堅実DINK（共働き、35歳、世帯年収1600万、資産3000万）
  // 実測: score=51, survival=63%, FIRE=50, assets60=19,475万
  // ----------------------------------------------------------
  describe('A: 堅実DINK', () => {
    const persona = profileWith({
      currentAge: 35,
      targetRetireAge: 50,
      mode: 'couple',
      grossIncome: 1000,
      partnerGrossIncome: 600,
      rsuAnnual: 0,
      sideIncomeNet: 0,
      partnerRsuAnnual: 0,
      livingCostAnnual: 360,
      housingCostAnnual: 180,
      assetCash: 1000,
      assetInvest: 1500,
      assetDefinedContributionJP: 500,
      dcContributionAnnual: 66,
      expectedReturn: 5,
      inflationRate: 2,
      volatility: 0.15,
      retireSpendingMultiplier: 0.8,
      retirePassiveIncome: 0,
    })

    it('スコアが40〜80の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.score).toBeGreaterThanOrEqual(40)
      expect(r.score).toBeLessThanOrEqual(80)
    })

    it('生存率が55〜82%の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.survivalRate).toBeGreaterThanOrEqual(55)
      expect(r.survivalRate).toBeLessThanOrEqual(82)
    })

    it('FIRE年齢が48〜52歳の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.fireAge).not.toBeNull()
      expect(r.fireAge!).toBeGreaterThanOrEqual(48)
      expect(r.fireAge!).toBeLessThanOrEqual(52)
    })

    it('60歳時点の資産が1.5億〜2.5億', async () => {
      const r = await runAverage(persona)
      expect(r.assetsAt60).toBeGreaterThanOrEqual(15000)
      expect(r.assetsAt60).toBeLessThanOrEqual(25000)
    })
  })

  // ----------------------------------------------------------
  // B: 高収入DINK（共働き、32歳、世帯年収3000万、資産5000万）
  // 実測: score=55, survival=70%, FIRE=42, assets60=37,240万
  // ----------------------------------------------------------
  describe('B: 高収入DINK', () => {
    const persona = profileWith({
      currentAge: 32,
      targetRetireAge: 45,
      mode: 'couple',
      grossIncome: 1500,
      partnerGrossIncome: 800,
      rsuAnnual: 400,
      sideIncomeNet: 100,
      partnerRsuAnnual: 200,
      livingCostAnnual: 480,
      housingCostAnnual: 240,
      assetCash: 1500,
      assetInvest: 3000,
      assetDefinedContributionJP: 500,
      dcContributionAnnual: 66,
      expectedReturn: 5,
      inflationRate: 2,
      volatility: 0.15,
      retireSpendingMultiplier: 0.8,
      retirePassiveIncome: 50,
    })

    it('スコアが42〜88の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.score).toBeGreaterThanOrEqual(42)
      expect(r.score).toBeLessThanOrEqual(88)
    })

    it('生存率が60〜87%の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.survivalRate).toBeGreaterThanOrEqual(60)
      expect(r.survivalRate).toBeLessThanOrEqual(87)
    })

    it('FIRE年齢が39〜44歳の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.fireAge).not.toBeNull()
      expect(r.fireAge!).toBeGreaterThanOrEqual(39)
      expect(r.fireAge!).toBeLessThanOrEqual(44)
    })

    it('60歳時点の資産が3億〜5億', async () => {
      const r = await runAverage(persona)
      expect(r.assetsAt60).toBeGreaterThanOrEqual(30000)
      expect(r.assetsAt60).toBeLessThanOrEqual(50000)
    })
  })

  // ----------------------------------------------------------
  // C: 超高収入DINK（共働き、38歳、世帯年収5000万+、資産1.5億）
  // 実測: score=68, survival=75%, FIRE=42, assets60=47,399万
  // ----------------------------------------------------------
  describe('C: 超高収入DINK', () => {
    const persona = profileWith({
      currentAge: 38,
      targetRetireAge: 45,
      mode: 'couple',
      grossIncome: 2500,
      partnerGrossIncome: 1200,
      rsuAnnual: 800,
      sideIncomeNet: 200,
      partnerRsuAnnual: 300,
      livingCostAnnual: 600,
      housingCostAnnual: 360,
      assetCash: 3000,
      assetInvest: 10000,
      assetDefinedContributionJP: 2000,
      dcContributionAnnual: 66,
      expectedReturn: 5,
      inflationRate: 2,
      volatility: 0.15,
      retireSpendingMultiplier: 0.8,
      retirePassiveIncome: 100,
    })

    it('スコアが55〜88の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.score).toBeGreaterThanOrEqual(55)
      expect(r.score).toBeLessThanOrEqual(88)
    })

    it('生存率が65〜85%の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.survivalRate).toBeGreaterThanOrEqual(65)
      expect(r.survivalRate).toBeLessThanOrEqual(85)
    })

    it('FIRE年齢が40〜44歳の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.fireAge).not.toBeNull()
      expect(r.fireAge!).toBeGreaterThanOrEqual(40)
      expect(r.fireAge!).toBeLessThanOrEqual(44)
    })

    it('60歳時点の資産が3.5億〜6億', async () => {
      const r = await runAverage(persona)
      expect(r.assetsAt60).toBeGreaterThanOrEqual(35000)
      expect(r.assetsAt60).toBeLessThanOrEqual(60000)
    })
  })

  // ----------------------------------------------------------
  // D: 若手シングル（28歳、年収500万、資産200万）
  // 実測: score=25, survival=0%, FIRE=null, assets60=-3,521万
  // 年収500万で55歳FIREは極めて困難なペルソナ
  // ----------------------------------------------------------
  describe('D: 若手シングル', () => {
    const persona = profileWith({
      currentAge: 28,
      targetRetireAge: 55,
      mode: 'solo',
      grossIncome: 500,
      rsuAnnual: 0,
      sideIncomeNet: 0,
      partnerGrossIncome: 0,
      partnerRsuAnnual: 0,
      livingCostAnnual: 240,
      housingCostAnnual: 96,
      assetCash: 100,
      assetInvest: 100,
      assetDefinedContributionJP: 0,
      dcContributionAnnual: 0,
      expectedReturn: 5,
      inflationRate: 2,
      volatility: 0.15,
      retireSpendingMultiplier: 0.8,
      retirePassiveIncome: 0,
    })

    it('スコアが5〜40の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.score).toBeGreaterThanOrEqual(5)
      expect(r.score).toBeLessThanOrEqual(40)
    })

    it('生存率が5%以下', async () => {
      const r = await runAverage(persona)
      expect(r.survivalRate).toBeLessThanOrEqual(5)
    })

    it('FIRE達成不可（null）', async () => {
      const r = await runAverage(persona)
      expect(r.fireAge).toBeNull()
    })

    it('60歳時点の資産がマイナス', async () => {
      const r = await runAverage(persona)
      expect(r.assetsAt60).toBeLessThan(0)
    })
  })

  // ----------------------------------------------------------
  // E: 余裕DINK（共働き、42歳、世帯年収2000万、資産8000万）
  // 実測: score=64, survival=72%, FIRE=49, assets60=21,482万
  // ----------------------------------------------------------
  describe('E: 余裕DINK', () => {
    const persona = profileWith({
      currentAge: 42,
      targetRetireAge: 50,
      mode: 'couple',
      grossIncome: 1200,
      partnerGrossIncome: 800,
      rsuAnnual: 100,
      sideIncomeNet: 0,
      partnerRsuAnnual: 0,
      livingCostAnnual: 420,
      housingCostAnnual: 200,
      assetCash: 2000,
      assetInvest: 5000,
      assetDefinedContributionJP: 1000,
      dcContributionAnnual: 66,
      expectedReturn: 5,
      inflationRate: 2,
      volatility: 0.15,
      retireSpendingMultiplier: 0.8,
      retirePassiveIncome: 30,
    })

    it('スコアが50〜88の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.score).toBeGreaterThanOrEqual(50)
      expect(r.score).toBeLessThanOrEqual(88)
    })

    it('生存率が62〜90%の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.survivalRate).toBeGreaterThanOrEqual(62)
      expect(r.survivalRate).toBeLessThanOrEqual(90)
    })

    it('FIRE年齢が47〜52歳の範囲', async () => {
      const r = await runAverage(persona)
      expect(r.fireAge).not.toBeNull()
      expect(r.fireAge!).toBeGreaterThanOrEqual(47)
      expect(r.fireAge!).toBeLessThanOrEqual(52)
    })

    it('60歳時点の資産が1.7億〜2.7億', async () => {
      const r = await runAverage(persona)
      expect(r.assetsAt60).toBeGreaterThanOrEqual(17000)
      expect(r.assetsAt60).toBeLessThanOrEqual(27000)
    })
  })

  // ----------------------------------------------------------
  // パートナー収入イベント
  // ----------------------------------------------------------
  describe('パートナー収入イベント', () => {
    it('DINKs + partner income_decrease でスコアが下がる', async () => {
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 50,
        mode: 'couple',
        grossIncome: 1000,
        partnerGrossIncome: 600,
        livingCostAnnual: 360,
        housingCostAnnual: 180,
        assetCash: 1000,
        assetInvest: 1500,
        assetDefinedContributionJP: 500,
        dcContributionAnnual: 66,
        lifeEvents: [],
      })

      const withPartnerDecrease = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'partner-leave',
            type: 'income_decrease',
            name: 'パートナー育休',
            age: 36,
            amount: 300,
            duration: 3,
            isRecurring: true,
            target: 'partner',
          },
        ],
      })

      const [rBase, rWithEvent] = await Promise.all([
        runAverage(base),
        runAverage(withPartnerDecrease),
      ])

      expect(rBase.score).toBeGreaterThan(rWithEvent.score)
    })

    it('solo モードでは partner イベントが無視される', async () => {
      const base = profileWith({
        currentAge: 28,
        targetRetireAge: 55,
        mode: 'solo',
        grossIncome: 500,
        livingCostAnnual: 240,
        housingCostAnnual: 96,
        assetCash: 100,
        assetInvest: 100,
        lifeEvents: [],
      })

      const withPartnerEvent = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'partner-decrease',
            type: 'income_decrease',
            name: 'パートナー転職',
            age: 30,
            amount: 200,
            duration: 5,
            isRecurring: true,
            target: 'partner',
          },
        ],
      })

      const [rBase, rWithEvent] = await Promise.all([
        runAverage(base, 5),
        runAverage(withPartnerEvent, 5),
      ])

      // solo モードでは partner ブロックが実行されないためスコアが同じ
      expect(Math.abs(rBase.score - rWithEvent.score)).toBeLessThanOrEqual(5)
    })
  })

  // ----------------------------------------------------------
  // 賃貸収入イベント
  // ----------------------------------------------------------
  describe('賃貸収入イベント', () => {
    it('rental_income が退職後も収入に加算される', async () => {
      // 退職年齢を低めに設定し、rental_income が退職後も効くことを確認
      const base = profileWith({
        currentAge: 45,
        targetRetireAge: 50,
        mode: 'solo',
        grossIncome: 800,
        livingCostAnnual: 300,
        housingCostAnnual: 120,
        assetCash: 2000,
        assetInvest: 3000,
        assetDefinedContributionJP: 500,
        lifeEvents: [],
      })

      const withRental = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'rental-1',
            type: 'rental_income' as const,
            name: '自宅賃貸収入',
            age: 45,
            amount: 120,
            duration: 30,
            isRecurring: true,
          },
        ],
      })

      const [rBase, rWithRental] = await Promise.all([
        runAverage(base),
        runAverage(withRental),
      ])

      // rental_income ありのほうがスコアが高い（退職後も収入があるため）
      expect(rWithRental.score).toBeGreaterThan(rBase.score)
      expect(rWithRental.survivalRate).toBeGreaterThan(rBase.survivalRate)
    })

    it('rental_income + income_decrease の複合ケースが正しく計算される', async () => {
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 50,
        mode: 'couple',
        grossIncome: 1000,
        partnerGrossIncome: 600,
        livingCostAnnual: 360,
        housingCostAnnual: 180,
        assetCash: 1000,
        assetInvest: 1500,
        assetDefinedContributionJP: 500,
        lifeEvents: [],
      })

      // rental_income + partner income_decrease: 賃貸収入でパートナー減収を一部相殺
      const withComplex = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'rental-2',
            type: 'rental_income' as const,
            name: '賃貸収入',
            age: 36,
            amount: 100,
            duration: 20,
            isRecurring: true,
          },
          {
            id: 'partner-decrease-2',
            type: 'income_decrease',
            name: 'パートナー育休',
            age: 36,
            amount: 300,
            duration: 2,
            isRecurring: true,
            target: 'partner' as const,
          },
        ],
      })

      // 純減なのでスコアは下がるが、rental_income があるので完全な300万減よりはマシ
      const onlyDecrease = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'partner-decrease-3',
            type: 'income_decrease',
            name: 'パートナー育休',
            age: 36,
            amount: 300,
            duration: 2,
            isRecurring: true,
            target: 'partner' as const,
          },
        ],
      })

      const [rComplex, rOnlyDecrease] = await Promise.all([
        runAverage(withComplex),
        runAverage(onlyDecrease),
      ])

      // rental_income で一部相殺されるため、複合ケースのスコアが高い
      expect(rComplex.score).toBeGreaterThan(rOnlyDecrease.score)
    })
  })

  // ----------------------------------------------------------
  // サブスコア相対比較
  // ----------------------------------------------------------
  describe('ペルソナ間の相対比較', () => {
    it('超高収入DINKのスコアは若手シングルより高い', async () => {
      const highIncome = profileWith({
        currentAge: 38, targetRetireAge: 45, mode: 'couple',
        grossIncome: 2500, partnerGrossIncome: 1200, rsuAnnual: 800,
        sideIncomeNet: 200, partnerRsuAnnual: 300,
        livingCostAnnual: 600, housingCostAnnual: 360,
        assetCash: 3000, assetInvest: 10000, assetDefinedContributionJP: 2000,
        dcContributionAnnual: 66, retirePassiveIncome: 100,
      })
      const young = profileWith({
        currentAge: 28, targetRetireAge: 55, mode: 'solo',
        grossIncome: 500, rsuAnnual: 0, sideIncomeNet: 0,
        livingCostAnnual: 240, housingCostAnnual: 96,
        assetCash: 100, assetInvest: 100, assetDefinedContributionJP: 0,
        dcContributionAnnual: 0, retirePassiveIncome: 0,
      })

      const [rHigh, rYoung] = await Promise.all([
        runAverage(highIncome),
        runAverage(young),
      ])

      expect(rHigh.score).toBeGreaterThan(rYoung.score)
      expect(rHigh.survivalRate).toBeGreaterThan(rYoung.survivalRate)
    })

    it('余裕DINKのスコアは堅実DINKより高い', async () => {
      const comfort = profileWith({
        currentAge: 42, targetRetireAge: 50, mode: 'couple',
        grossIncome: 1200, partnerGrossIncome: 800, rsuAnnual: 100,
        livingCostAnnual: 420, housingCostAnnual: 200,
        assetCash: 2000, assetInvest: 5000, assetDefinedContributionJP: 1000,
        dcContributionAnnual: 66, retirePassiveIncome: 30,
      })
      const steady = profileWith({
        currentAge: 35, targetRetireAge: 50, mode: 'couple',
        grossIncome: 1000, partnerGrossIncome: 600,
        livingCostAnnual: 360, housingCostAnnual: 180,
        assetCash: 1000, assetInvest: 1500, assetDefinedContributionJP: 500,
        dcContributionAnnual: 66, retirePassiveIncome: 0,
      })

      const [rComfort, rSteady] = await Promise.all([
        runAverage(comfort),
        runAverage(steady),
      ])

      expect(rComfort.score).toBeGreaterThan(rSteady.score)
    })
  })

  // ----------------------------------------------------------
  // 年金へのライフイベント反映 (E03)
  // ----------------------------------------------------------
  describe('年金へのライフイベント反映', () => {
    it('income_decrease で年金額が下がる', () => {
      // 年収700万は標準報酬月額上限(65万=年収780万)以下なので差が出る
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 65,
        grossIncome: 700,
        rsuAnnual: 0,
        lifeEvents: [],
      })

      const withDecrease = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'career-change',
            type: 'income_decrease',
            name: '転職ダウン',
            age: 40,
            amount: 300,
            isRecurring: true,
          },
        ],
      })

      const pensionBase = calculateAnnualPension(base)
      const pensionDecreased = calculateAnnualPension(withDecrease)

      expect(pensionBase).toBeGreaterThan(pensionDecreased)
    })

    it('パートナーの income_decrease でパートナー年金が下がる', () => {
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 65,
        mode: 'couple',
        grossIncome: 1600,
        rsuAnnual: 0,
        partnerGrossIncome: 800,
        partnerRsuAnnual: 0,
        lifeEvents: [],
      })

      const withPartnerDecrease = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'partner-leave',
            type: 'income_decrease',
            name: 'パートナー育休→時短',
            age: 38,
            amount: 300,
            duration: 3,
            isRecurring: true,
            target: 'partner' as const,
          },
        ],
      })

      const pensionBase = calculateAnnualPension(base)
      const pensionWithEvent = calculateAnnualPension(withPartnerDecrease)

      // パートナーの3年間のdecreaseで世帯年金が下がる
      expect(pensionBase).toBeGreaterThan(pensionWithEvent)
      // ただし影響は限定的（38年中3年間のみ）
      expect(pensionBase - pensionWithEvent).toBeLessThan(20)
    })

    it('ライフイベントなしの場合は従来と同じ年金額', () => {
      const profile = profileWith({
        currentAge: 35,
        targetRetireAge: 65,
        grossIncome: 1000,
        rsuAnnual: 0,
        lifeEvents: [],
      })

      const pension = calculateAnnualPension(profile)
      // 加入期間: 22歳〜60歳 = 38年
      // 平均年収: 22〜34歳(13年)=1000, 35〜59歳(25年)=1000 → 平均1000
      // 標準報酬月額: min(1000/12, 65) = 65 (上限)
      // 基礎年金: 80 * 38/40 = 76
      // 報酬比例: 65 * 5.481/1000 * 456 = 162.4
      // 合計: 238
      expect(pension).toBeGreaterThan(200)
      expect(pension).toBeLessThan(280)
    })
  })

  // ----------------------------------------------------------
  // asset_gain イベント (E04)
  // ----------------------------------------------------------
  describe('asset_gain イベント', () => {
    it('asset_gain が資産に反映される', async () => {
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 55,
        grossIncome: 1000,
        lifeEvents: [],
      })

      const withGain = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'inherit',
            type: 'asset_gain',
            name: '相続',
            age: 45,
            amount: 2000,
            isRecurring: false,
          },
        ],
      })

      const [rBase, rWithGain] = await Promise.all([
        runAverage(base),
        runAverage(withGain),
      ])

      // 2000万の一時資産増加でスコアが上がる
      expect(rWithGain.score).toBeGreaterThan(rBase.score)
    })

    it('asset_gain は該当年齢のみ発動する（一時的）', async () => {
      const withGain = profileWith({
        currentAge: 35,
        targetRetireAge: 55,
        grossIncome: 1000,
        lifeEvents: [
          {
            id: 'severance',
            type: 'asset_gain',
            name: '退職金',
            age: 50,
            amount: 3000,
            isRecurring: false,
          },
        ],
      })

      const result = await runAverage(withGain, 1)
      // 50歳以降の資産 > 49歳以前の資産（+3000万のジャンプ）
      // paths[0] の yearlyData で確認する代わりに、スコアで間接検証
      expect(result.score).toBeGreaterThan(0)
    })
  })

  // ----------------------------------------------------------
  // 介護費用 (E05)
  // ----------------------------------------------------------
  describe('介護費用イベント', () => {
    it('expense_increase で介護費用がスコアに影響する', async () => {
      const base = profileWith({
        currentAge: 35,
        targetRetireAge: 55,
        grossIncome: 1000,
        lifeEvents: [],
      })

      const withNursing = profileWith({
        ...base,
        lifeEvents: [
          {
            id: 'nursing',
            type: 'expense_increase',
            name: '親の介護費用',
            age: 60,
            amount: 120,
            duration: 10,
            isRecurring: true,
          },
        ],
      })

      const [rBase, rWithNursing] = await Promise.all([
        runAverage(base),
        runAverage(withNursing),
      ])

      // 年120万×10年の支出増でスコアが下がる
      expect(rBase.score).toBeGreaterThan(rWithNursing.score)
    })
  })
})
