# フィールド↔エンジン接続監査

実施日: 2025-02-18（R01-Step2 反映: 同日）
テスト数: 191

## サマリー
- Profile フィールド: 32項目中 31項目 ✅、1項目 ⚠️（mortgageInterestRate 部分接続）
- LifeEvent タイプ: 11種中 7種 ✅、1種 ⚠️、3種 死型
- housing-sim 不整合: 5件 → **4件解消済**（R01-Step2）、残り1件（asset_purchase: B01で対応）

## ❌/⚠️ 一覧

| # | 項目 | 分類 | 重要度 | 対応 |
|---|------|------|--------|------|
| 1 | mortgageInterestRate → engine.ts 未参照 | 部分接続 | 低 | 保留 |
| 2 | partner income → 年金未反映 | 既知TODO | 低 | BACKLOG |
| 3 | ~~postRetireIncome → housing-sim 未実装~~ | ~~engine/sim不整合~~ | ~~中~~ | ✅ R01-Step2で解消済 |
| 4 | ~~postRetireIncomeEndAge → housing-sim 未実装~~ | ~~engine/sim不整合~~ | ~~中~~ | ✅ R01-Step2で解消済 |
| 5 | ~~rental_income → housing-sim 未処理~~ | ~~engine/sim不整合~~ | ~~中~~ | ✅ R01-Step2で解消済 |
| 6 | ~~partner income adjustment → housing-sim 未適用~~ | ~~engine/sim不整合~~ | ~~低~~ | ✅ R01-Step2で解消済 |
| 7 | asset_purchase → 両エンジン未処理 | 未接続 | 低 | B01で対応 |
| 8 | child_birth / education / retirement_partial | 死型定義 | 無 | 削除可 |

## 全フィールド詳細

### Part 1: Profile フィールド

| # | フィールド | engine.ts | housing-sim.ts | 影響 | 判定 |
|---|-----------|-----------|----------------|------|------|
| 1 | `currentAge` | L485, L534 | L301, L317 | シミュレーション開始年・インフレ年数の起点 | ✅ |
| 2 | `targetRetireAge` | L369, L419, L543 | L212, L247, L325 | 退職判定・DC拠出停止・年金開始判定 | ✅ |
| 3 | `mode` | L307, L396 | L228 | couple時にパートナー年金・収入を加算 | ✅ |
| 4 | `grossIncome` | L186, L298, L390 | L222 | 税率自動計算・年金平均年収・手取り計算の起点 | ✅ |
| 5 | `rsuAnnual` | L186, L299, L390 | L222 | grossIncomeに加算（税・年金・手取りに影響） | ✅ |
| 6 | `sideIncomeNet` | L186, L390 | L222 | 手取り加算（年金計算には含まない＝正しい） | ✅ |
| 7 | `partnerGrossIncome` | L187, L309, L398 | L229 | パートナー税・年金・手取り | ✅ |
| 8 | `partnerRsuAnnual` | L187, L309, L398 | L229 | partnerGrossIncomeに加算 | ✅ |
| 9 | `livingCostAnnual` | L433 | L264 | 生活費基礎額（インフレ適用） | ✅ |
| 10 | `housingCostAnnual` | L423, L481 | L255-L260 | 住居費（賃貸:家賃インフレ、持ち家:固定） | ✅ |
| 11 | `homeStatus` | L424, L469, L683 | L253, L299, L440 | 賃貸/持ち家判定・住宅購入イベント制御・リスクスコア | ✅ |
| 12 | `homeMarketValue` | L684 | L441 | リスクスコアのhomeEquity計算のみ | ✅ |
| 13 | `mortgagePrincipal` | L684 | L441 | リスクスコアのhomeEquity（評価額-残債） | ✅ |
| 14 | `mortgageInterestRate` | なし | L559, L712 | housing-sim シナリオ構築のみ、engine本体で未使用 | ⚠️ 部分接続 |
| 15 | `mortgageYearsRemaining` | L475-L476 | L559 | 既存持ち家のローン完済年齢を算出 | ✅ |
| 16 | `mortgageMonthlyPayment` | L477 | L560, L713 | 既存持ち家の年間ローン返済額算出 | ✅ |
| 17 | `assetCash` | L462 | L294, L494 | 初期資産・購入時取り崩し・リスクスコア分母 | ✅ |
| 18 | `assetInvest` | L462, L638 | L294, L502 | 初期資産・配当利回り3%・リスクスコア分子 | ✅ |
| 19 | `assetDefinedContributionJP` | L462 | L294 | 初期資産に合算 | ✅ |
| 20 | `dcContributionAnnual` | L543 | L325 | 退職前に毎年資産に加算 | ✅ |
| 21 | `expectedReturn` | L465 | L295 | 投資リターン平均（モンテカルロ mean） | ✅ |
| 22 | `inflationRate` | L426, L466, L535 | L258, L296, L431 | インフレ係数・家賃インフレ fallback | ✅ |
| 23 | `rentInflationRate` | L426 | L258, L614, L659 | 家賃インフレ率（undefinedならinflationRate） | ✅ |
| 24 | `volatility` | L546, L687 | L327, L444 | モンテカルロ stdDev・リスクスコア | ✅ |
| 25 | `effectiveTaxRate` | L189-L194, L393 | L225, L231 | useAutoTaxRate=false時の手動税率 | ✅ |
| 26 | `useAutoTaxRate` | L189, L391, L399 | L223, L230 | 自動/手動税率切替 | ✅ |
| 27 | `retireSpendingMultiplier` | L451 | L280 | 退職後支出の掛け率（0.8=生活費2割減） | ✅ |
| 28 | `retirePassiveIncome` | L384 | L217 | 退職後の配当・不動産等パッシブ収入 | ✅ |
| 29 | `postRetireIncome` | L378-L381 | calc-core経由 | 退職後事業収入 | ✅ (R01-Step2) |
| 30 | `postRetireIncomeEndAge` | L379-L380 | calc-core経由 | 事業収入終了年齢 | ✅ (R01-Step2) |
| 31 | `lifeEvents` | L335-L555 | L195-L336 | 全イベントタイプを処理（下記Part2参照） | ✅ |
| 32 | `housingPlans` | なし | なし（UI→BuyNowParams経由） | branch.ts L83 でデフォルト住宅購入パラメータ参照 | ✅ 間接接続 |

### Part 2: LifeEvent タイプ別処理

| LifeEventType | engine.ts | housing-sim.ts | 生成元 | 判定 |
|---------------|-----------|----------------|--------|------|
| `income_increase` | L341 `adjustment += amount` | L199 (self/partner混在) | preset/branch/bundle | ✅ |
| `income_decrease` | L343 `adjustment -= amount` | L201 (self/partner混在) | preset/branch/bundle | ✅ |
| `expense_increase` | L440 `+= amount * inflation` | L270 | preset/branch(child→教育費)/bundle | ✅ |
| `expense_decrease` | L443 `-= amount * inflation` | L273 | preset/bundle | ✅ |
| `asset_gain` | L552 `assetGain += amount` | L333 | preset(相続/退職金/贈与) | ✅ |
| `housing_purchase` | L492-L525 頭金+諸費用+ローン | L305-L314 頭金+諸費用 | preset/branch | ✅ |
| `rental_income` | L354-L364 `rental += amount` | calc-core経由 | bundle(海外駐在+持家) | ✅ (R01-Step2) |
| `asset_purchase` | **なし** | **なし** | housing-sim L579(relocate) | ❌ 未接続 |
| `child_birth` | **なし** | **なし** | 生成されない(branch.tsがexpense_increaseに変換) | ⚠️ 死型 |
| `education` | **なし** | **なし** | 生成されない(同上) | ⚠️ 死型 |
| `retirement_partial` | **なし** | **なし** | 生成されない、使用箇所なし | ⚠️ 死型 |

### Part 3: housing-sim.ts 固有の不整合

R01-Step2 で housing-sim.ts が calc-core.ts の共通関数を使用するようになり、4件解消。残り1件:

| 項目 | engine.ts | housing-sim.ts | 影響度 | 状態 |
|------|-----------|----------------|--------|------|
| ~~`postRetireIncome`~~ | calc-core `calculateNetIncomeForAge` | calc-core 経由で処理 | ~~中~~ | ✅ 解消済 |
| ~~`postRetireIncomeEndAge`~~ | calc-core `calculateNetIncomeForAge` | calc-core 経由で処理 | ~~中~~ | ✅ 解消済 |
| ~~`rental_income` イベント~~ | calc-core `calculateRentalIncome` | calc-core 経由で処理 | ~~中~~ | ✅ 解消済 |
| ~~partner income adjustment~~ | calc-core `calculateIncomeAdjustment` | calc-core 経由で処理 | ~~低~~ | ✅ 解消済 |
| `asset_purchase` イベント | 未実装 | 未実装 | **低** | B01で対応 |

### Part 4: 分岐ビルダー eventType → LifeEvent 変換

| branch eventType | branchToLifeEvents() 変換先 | engine処理 | 判定 |
|-----------------|---------------------------|-----------|------|
| `_auto` | → [] (空) | — | ✅ 設計通り |
| `housing_purchase` | → `housing_purchase` + purchaseDetails | L492-L525 | ✅ |
| `child` | → `expense_increase` ×3 (保育50/学費100/大学200) | L440 | ✅ |
| `income_change` | → `income_increase` or `income_decrease` (target:self) | L341/L343 | ✅ |
| `partner_income_change` | → `income_decrease` (target:partner) | L343 (手取り✅、年金⚠️) | ⚠️ 既知 |
| `_direct` (preset/bundle) | → directEvents（各presetのengineType） | 各タイプ別 | ✅ |
