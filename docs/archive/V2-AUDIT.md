# V2 監査レポート

> 作成日: 2026-02-18
> 対象: `lib/v2/` (7ファイル, 1,377行) + 関連フック・コンポーネント

---

## 1. ファイル概要

### `lib/v2/worldline.ts` (254行)

**エクスポート:**
- 型: `KeyPerformanceIndicators`, `WorldLine`, `WorldLineResult`, `WorldLineComparison`, `WorldLineComparisonDetailed`
- 関数: `createWorldLine`, `cloneWorldLine`, `addEventToWorldLine`, `removeEventFromWorldLine`, `evaluateKpiHealth`, `compareWorldLines`

**依存:**
- `@/lib/types` → `Profile`, `SimulationResult`
- `./margin` → `Margin`
- `./events` → `ScenarioEvent`

**役割:** 世界線（WorldLine）のデータ構造定義とCRUD操作。KPI型定義と2世界線の比較ロジックを含む。

---

### `lib/v2/margin.ts` (110行)

**エクスポート:**
- 型: `Margin`, `MoneyMargin`, `TimeMargin`, `EnergyMargin`
- 関数: `createDefaultMargin`, `evaluateMoneyMarginHealth`, `evaluateTimeMarginHealth`, `evaluateEnergyMarginHealth`

**依存:** なし（外部インポートゼロ）

**役割:** 余白トリレンマ（お金・時間・体力）の型定義と健全性評価。計算ロジック自体は含まず、評価閾値の判定のみ。

---

### `lib/v2/strategy.ts` (334行)

**エクスポート:**
- 型: `StrategyLeverType`, `StrategyLever`, `StrategyImpact`, `StrategyAnalysis`
- 定数: `INCOME_STRATEGIES` (4件), `COST_STRATEGIES` (4件), `TIMING_STRATEGIES` (4件)
- 関数: `generateStrategyLevers`, `analyzeStrategy`

**依存:**
- `./worldline` → `WorldLine`, `KeyPerformanceIndicators`

**役割:** 戦略レバー（収入・支出・タイミング）のテンプレート定義と影響推定。12種類の戦略テンプレートから優先度順にソートした戦略リストを生成する。

---

### `lib/v2/events.ts` (259行)

**エクスポート:**
- 型: `EventType` (14種類), `ScenarioEvent`, `EventImpact`
- 定数: `EVENT_TEMPLATES` (14種類のイベントテンプレート)
- 関数: `createEvent`, `calculateEventImpactForYear`

**依存:** なし（外部インポートゼロ）

**役割:** 世界線に影響を与えるライフイベントの定義。EventType → EventImpact（money/time/energy + 一時的支出/収入）のテンプレートシステム。

---

### `lib/v2/adapter.ts` (216行)

**エクスポート:**
- 関数: `adaptV1ProfileToV2WorldLine`, `extractKpisFromSimulation`, `calculateMoneyMargin`, `calculateTimeMargin`, `calculateEnergyMargin`, `calculateMargin`, `updateWorldLineWithResults`

**依存:**
- `@/lib/types` → `Profile`, `SimulationResult`
- `./worldline` → `WorldLine`, `KeyPerformanceIndicators`
- `./margin` → `Margin`, `MoneyMargin`, `TimeMargin`, `EnergyMargin`

**役割:** v1（engine.ts の SimulationResult + Profile）を v2 の WorldLine / Margin / KPI に変換するアダプター層。v2システムの中核ロジック。

---

### `lib/v2/store.ts` (196行)

**エクスポート:**
- 型: `V2Store` (= `V2State` & `V2Actions`)
- フック: `useV2Store` (Zustand ストア)

**依存:**
- `zustand`

**役割:** v2のUI状態管理。activeTab, allocation（旅/投資/自由時間の配分比率）, bridges（住まい/子どもの意思決定）, selectedComparisonIds を管理。localStorage永続化なし（揮発性）。

**状態フィールド一覧:**
| フィールド | 型 | 説明 |
|---|---|---|
| `activeTab` | 5種類の文字列リテラル | 現在のタブ |
| `showV2UI` | boolean | v2 UI表示フラグ（未使用の可能性あり） |
| `goalLens` | 'stability' / 'growth' / 'balance' | 目標レンズ |
| `selectedComparisonIds` | string[] (最大2) | 比較対象シナリオID |
| `allocation` | { travel, invest, freeTime } | 余白配分（合計100%保証） |
| `bridges` | { housing, children } | 意思決定ブリッジ |

---

### `lib/v2/readinessConfig.ts` (8行)

**エクスポート:**
- 定数: `readinessConfig` (5段階: excellent / ready / on_track / needs_work / not_ready)

**依存:** なし

**役割:** 準備度レベルの表示ラベルとカラー定義。すべてグレー系のトーンで統一されている。

---

## 2. データフロー

### engine.ts SimulationResult → v2 システムへの流入経路

```
[ユーザー入力] → lib/store.ts (Profile)
                    ↓ (debounce)
                lib/engine.ts → SimulationResult
                    ↓
                lib/store.ts (simResult として保存)
                    ↓
              ┌─────┴─────────────────────┐
              ↓                           ↓
    hooks/useMargin.ts            hooks/useStrategy.ts
    (adapter.ts 経由で              (simResult.score を
     Margin を計算)                 直接参照して戦略生成)
              ↓                           ↓
    V2ResultSection               V2ResultSection
    (margins タブ)                (strategy タブ)
```

**重要:** v2 システムは独自にシミュレーションを実行しない。すべての数値は `useProfileStore` の `simResult` を参照する。

### adapter.ts の変換内容

`adapter.ts` は以下の4つの変換を行う:

1. **`extractKpisFromSimulation(SimulationResult, Profile) → KeyPerformanceIndicators`**
   - `paths.lowerPath`（10パーセンタイル）から safeFireAge を算出（資産が0以下になる年齢 - 1）
   - `paths.yearlyData` から 60歳時点・100歳時点の中央値資産を取得
   - 40-50代の年間資産増減の平均から midlifeSurplus を算出
   - `score.survival` → survivalRate, `metrics.fireAge` → fireAge をそのまま転記

2. **`calculateMoneyMargin(Profile, SimulationResult) → MoneyMargin`**
   - `cashFlow.income + pension + dividends` → 年間可処分所得
   - `cashFlow.netCashFlow` → 月次純貯蓄額（÷12）
   - `profile.assetCash / 月次支出` → 緊急資金カバー月数
   - SimulationResult が null の場合は全フィールドを `NaN` で返す（0埋め禁止のルール）

3. **`calculateTimeMargin(Profile) → TimeMargin`**
   - SimulationResult に依存しない。Profile のみから概算
   - `weeklyFreeHours`: 基本40時間（couple なら -5）
   - `annualVacationDays`: 固定値20日
   - `careerFlexibilityScore`: 年齢のみで決定（<40歳: 70, <50歳: 60, else: 50）

4. **`calculateEnergyMargin(Profile) → EnergyMargin`**
   - SimulationResult に依存しない。Profile のみから概算
   - `physicalHealthScore`: `max(100 - (age - 30) * 1.5, 50)`
   - `stressLevel`: 貯蓄率（(grossIncome + RSU - 支出) / (grossIncome + RSU)）から逆算
   - `mentalHealthScore`: `max(50, 80 - stressLevel / 2)`

### margin.ts による「余白スコア」算出

**入力:** adapter.ts が算出した `MoneyMargin`, `TimeMargin`, `EnergyMargin`

**出力:** 各ディメンションの 'excellent' / 'good' / 'fair' / 'poor' 評価

| 評価関数 | 判定ロジック |
|---|---|
| `evaluateMoneyMarginHealth` | emergencyFundCoverage >= 12 && monthlyNetSavings > 0 → excellent; >= 6 → good; >= 3 → fair; else poor |
| `evaluateTimeMarginHealth` | (weeklyFreeHours/50)*40 + (vacationDays/30)*30 + (flexibility/100)*30 のスコア: >= 80 → excellent |
| `evaluateEnergyMarginHealth` | ((100-stress)/100)*30 + (physical/100)*35 + (mental/100)*35 のスコア: >= 80 → excellent |

`useMargin` フック内で3つの評価を平均し、overallHealth を算出。

### strategy.ts による「戦略」生成

**入力と出力の関係:**

`lib/v2/strategy.ts` 自体は worldline/page.tsx からは**直接使用されていない**。代わりに `hooks/useStrategy.ts` が独自の戦略ロジックを実装している。

**hooks/useStrategy.ts のロジック:**
- **入力:** Profile, SimulationResult, MoneyMarginV2, TimeMarginV2, RiskMarginV2, worldLines
- **出力:** `StrategyEvaluation` = { primaryStrategy, alternativeStrategies, urgentActions, strategicInsights, overallAssessment }

1. **primaryStrategy の決定:** `simResult.score.overall` に基づいて4段階の戦略テンプレートから選択
   - >= 75 かつ yearsToTarget > 5 → 「積極成長戦略」
   - >= 60 → 「バランス戦略」
   - >= 40 → 「安定優先戦略」
   - < 40 → 「立て直し戦略」

2. **strategicInsights の生成:** SWOT 分析風の洞察をルールベースで生成
   - Strength: survival >= 80, monthlyNetSavings > 20
   - Weakness: liquidity < 50, risk < 50
   - Opportunity: age < 40 && yearsToTarget > 10, RSU > 0
   - Threat: inflationRate > 2.5

3. **urgentActions の生成:** スコアとマージンに基づいてアクション候補をフィルタリング

4. **overallAssessment:** readinessLevel（5段階）+ confidenceScore + keyMessage

---

## 3. UI との接続

### worldline/page.tsx のタブ構成と v2 関数の呼び出し

```
worldline/page.tsx
├── useProfileStore()  → profile, simResult, scenarios, loadScenario, saveAllocationAsScenario
├── useV2Store()       → activeTab, allocation, bridges, selectedComparisonIds
├── useMargin()        → money, time, risk (adapter.ts → margin.ts 経由)
└── useStrategy()      → primaryStrategy, strategicInsights, overallAssessment
```

| タブ | コンポーネント | 呼び出す v2 関数 |
|---|---|---|
| **余白** (margins) | `V2ResultSection` renderMode="margins" | `useMargin` → `calculateMargin` (adapter.ts) → `evaluateMoneyMarginHealth`, `evaluateTimeMarginHealth`, `evaluateEnergyMarginHealth` (margin.ts) |
| **使い道** (allocation) | `V2InputSection` renderMode="allocation" | `useV2Store` の `allocation`, `setAllocation`。v2ライブラリの関数は直接呼ばない。CashFlowの差分は `simResult.cashFlow` を直接参照 |
| **意思決定** (decision) | `V2InputSection` renderMode="decision" | `useV2Store` の `bridges`, `setHousingBridge`, `setChildrenBridge`。v2ライブラリの関数は直接呼ばない |
| **世界線** (worldlines) | `V2ComparisonView` | `lib/store.ts` の `scenarios` を直接参照。v2ライブラリの関数は呼ばない。比較指標は SimulationResult の paths/cashFlow から直接計算 |
| **戦略** (strategy) | `V2ResultSection` renderMode="strategy" | `useStrategy` フック（hooks/useStrategy.ts）。`lib/v2/strategy.ts` は**使用していない** |

### ヒーローセクション (renderMode="hero")

ページ上部に常時表示。以下を表示:
- スコアサークル（SVG円グラフ: `simResult.score.overall`）
- readinessConfig からのラベル・色
- overallAssessment.keyMessage
- 目標年齢、生存率、信頼度
- 「戦略を見る」ボタン → `setActiveTab('strategy')`

### 「意思決定」タブの表示内容

2つの「意思決定ブリッジ」カードを表示:
1. **住まいブリッジ**: 賃貸 / 購入 / 将来購入 の3択ボタン。選択すると補足テキストが表示される
2. **子どもブリッジ**: 0人 / 1人 / 2人 の3択ボタン。教育費の概算を補足テキストで表示

選択後に「世界線を比較する」ステップへの導線ボタンが出現し、worldlines タブに遷移する。

**重要:** ブリッジの選択はシミュレーションやスコアに**一切反映されない**。UIの表示のみ。

### 「使い道」(allocation) タブの表示内容

シナリオ間のキャッシュフロー差分を算出し、余白がある場合に3つの配分スライダーを表示:
- 旅・ライフスタイル / 投資 / 自由時間（合計100%保証）
- 翻訳カード: 旅行回数換算（1回30万円）、10年後投資額（年5%複利, 係数1.63固定）、労働時間削減（年収500万円換算）
- 「世界線として保存」機能で旅行配分を `expense_increase` LifeEvent に変換

### 「戦略を見る」ボタンのトリガー

ヒーローセクションの「戦略を見る」ボタンは `onViewStrategy` → `setActiveTab('strategy')` を実行し、戦略タブに切り替える。戦略タブでは以下を表示:
- 推奨戦略カード（名前、説明、信頼度、予測アウトカム、必要アクション、前提条件）
- 戦略的インサイトカード（SWOT 4カテゴリ、関連度スコア）

---

## 4. 問題点

### 4.1 EventImpact vs LifeEvent の互換性問題

**v2 の `ScenarioEvent` / `EventImpact` (events.ts) と v1 の `LifeEvent` (types.ts) は完全に別の型体系。**

| | v1 LifeEvent (types.ts) | v2 ScenarioEvent (events.ts) |
|---|---|---|
| 影響モデル | `amount`（万円）+ `duration` + `isRecurring` + `type` で分類 | `EventImpact { money, time, energy, oneTimeExpense?, oneTimeIncome? }` |
| イベント種類 | 11種類（LifeEventType） | 14種類（EventType）。一部重複するが名前が異なる |
| 開始タイミング | `age`（絶対年齢） | `startYear`（現在からの相対年数） |
| エンジン接続 | engine.ts が直接消費 | **engine.ts では一切使用されていない** |

**結論:** `lib/v2/events.ts` の `ScenarioEvent` / `EventImpact` は engine.ts の `LifeEvent` と接続するアダプターが存在しない。events.ts のイベントテンプレートは、直接シミュレーションに反映する手段がない。唯一の利用者は `components/v2/EventLayer.tsx` だが、このコンポーネント自体がどこからもインポートされていないデッドコードである。

### 4.2 ハードコードされたマジックナンバー

#### adapter.ts
| 箇所 | 値 | 意味 |
|---|---|---|
| L144 | `40` | 週あたりの基本自由時間（時間） |
| L147 | `-5` | couple の場合の自由時間減少 |
| L150 | `70, 60, 50` | 年齢別のキャリア柔軟性スコア |
| L155 | `20` | 年間有給休暇日数（固定） |
| L165 | `1.5` | 年齢による健康スコア減衰係数 |
| L165 | `50` | 健康スコアの下限 |
| L170-171 | `0.75` → N/A | 貯蓄率からストレスレベルを算出する係数（`60 - savingsRate * 100`） |

#### strategy.ts (lib/v2/)
| 箇所 | 値 | 意味 |
|---|---|---|
| L214 | `50` | 年50万円で1年早まる仮定（FIRE年齢計算） |
| L236 | `40` | 支出戦略の除算定数 |
| L252-279 | 固定値群 | タイミング戦略の影響値（fireAgeChange, survivalRateChange 等すべて固定） |

#### hooks/useMargin.ts
| 箇所 | 値 | 意味 |
|---|---|---|
| L128 | `65` | 標準退職年齢の仮定 |
| L131-132 | `20` | FIRE進捗計算の開始年齢 |
| L144 | `5, 30` | ボラティリティ許容度の計算定数 |
| L145 | `30, 20, 10` | 生存率→許容下落率の3段階 |
| L146 | `0.7, 0.4, 0.2` | 生存率→シーケンスリスクの3段階 |

#### V2InputSection.tsx
| 箇所 | 値 | 意味 |
|---|---|---|
| L633 | `30` | 旅行1回あたりの費用（万円） |
| L645 | `1.63` | 年5%複利10年の係数 |
| L654 | `500` | 自由時間換算の年収（万円） |
| L352 | `10` | 旅行配分のデフォルト継続年数 |

### 4.3 ダミー/スタブ実装

1. **`lib/v2/strategy.ts` の `estimateIncomeImpact`, `estimateCostImpact`, `estimateTimingImpact`**: タイトル文字列のパターンマッチで影響を推定している。KPIs を引数に取るが実際には使用しておらず、固定値を返す。コメントに「簡易的な推定ロジック」と記載。

2. **`lib/v2/strategy.ts` の `generateStrategyLevers`**: `targetFireAge` パラメータを受け取るが、一切使用していない（関数本体で参照なし）。

3. **`lib/v2/adapter.ts` の `calculateTimeMargin`/`calculateEnergyMargin`**: プロファイルの基本情報のみから固定値ベースで概算。ユーザーの実際の労働時間やストレスレベルの入力はない。

4. **`lib/v2/store.ts` の `showV2UI` / `goalLens`**: ストアにフィールドとセッターがあるが、worldline/page.tsx では使用されていない。

5. **意思決定ブリッジ（bridges）**: UI上で住まい/子どもの選択ができるが、選択結果はシミュレーションに**反映されない**。UIフロー上は worldlines タブへの遷移を促すのみ。

### 4.4 デッドコード/未使用エクスポート

#### 完全に未使用のファイル
| ファイル | 理由 |
|---|---|
| `components/v2/WorldLineLens.tsx` | どこからもインポートされていない |
| `components/v2/NextStepCard.tsx` | どこからもインポートされていない |
| `components/v2/EventLayer.tsx` | どこからもインポートされていない |
| `components/v2/ConclusionCard.tsx` | どこからもインポートされていない |
| `components/v2/ReasonCard.tsx` | どこからもインポートされていない |
| `hooks/useWorldLines.ts` | どこからもインポートされていない |

#### 未使用のエクスポート（lib/v2/ 内）
| ファイル | エクスポート | 使用状況 |
|---|---|---|
| `worldline.ts` | `cloneWorldLine` | `worldline.ts` 内でのみ定義。外部からの呼び出しなし |
| `worldline.ts` | `addEventToWorldLine` | 同上 |
| `worldline.ts` | `removeEventFromWorldLine` | 同上 |
| `worldline.ts` | `evaluateKpiHealth` | `WorldLineLens.tsx`（デッドコード）のみ |
| `worldline.ts` | `compareWorldLines` | `WorldLineLens.tsx`（デッドコード）のみ |
| `worldline.ts` | `WorldLineComparisonDetailed` | `WorldLineLens.tsx`（デッドコード）のみ |
| `worldline.ts` | `WorldLineComparison` | `useWorldLines.ts`（デッドコード）のみ |
| `strategy.ts` | `generateStrategyLevers` | `strategy.ts` 内の `analyzeStrategy` からのみ呼ばれるが、`analyzeStrategy` 自体が未使用 |
| `strategy.ts` | `analyzeStrategy` | 外部からの呼び出しなし |
| `strategy.ts` | `INCOME_STRATEGIES`, `COST_STRATEGIES`, `TIMING_STRATEGIES` | `strategy.ts` 内部のみ |
| `events.ts` | `createEvent` | `EventLayer.tsx`（デッドコード）のみ |
| `events.ts` | `calculateEventImpactForYear` | 外部からの呼び出しなし |
| `events.ts` | `EVENT_TEMPLATES` | `EventLayer.tsx`（デッドコード）のみ |
| `adapter.ts` | `adaptV1ProfileToV2WorldLine` | 外部からの呼び出しなし |
| `adapter.ts` | `updateWorldLineWithResults` | 外部からの呼び出しなし |
| `margin.ts` | `createDefaultMargin` | `adapter.ts` がインポートするが、`adapter.ts` 内では使用されていない（インポートのみ） |
| `store.ts` | `showV2UI`, `toggleV2UI`, `setShowV2UI` | worldline/page.tsx で使用されていない |
| `store.ts` | `goalLens`, `setGoalLens` | worldline/page.tsx で使用されていない |

### 4.5 hooks/useStrategy.ts と lib/v2/strategy.ts の重複

`hooks/useStrategy.ts`（393行）と `lib/v2/strategy.ts`（334行）は**同じ目的（戦略レコメンデーション）を異なるアプローチで実装している**。

- `lib/v2/strategy.ts`: 12種類のテンプレートベース。WorldLine の KPI を入力として、個別の影響推定を行う
- `hooks/useStrategy.ts`: SimulationResult.score.overall に基づく4段階分岐 + SWOT分析風インサイト

worldline/page.tsx は `hooks/useStrategy.ts` のみを使用。`lib/v2/strategy.ts` は完全にデッドコード。

### 4.6 その他の問題

1. **`adapter.ts` L50 の `yearlyData` アクセス:** `paths.yearlyData?.find(p => p.age === 60)` を使用しているが、SimulationPath の型定義では `yearlyData` は `AssetPoint[]` であり、age フィールドでの検索が正しいが、配列インデックスが `currentAge` からの相対位置であるため、年齢60のデータポイントが存在しない場合がある。

2. **`adapter.ts` の `createDefaultMargin` インポート:** L10 でインポートしているが、コード内で一度も使用されていない（未使用インポート）。

3. **`readinessConfig.ts` のカラーがすべてグレー系:** `excellent` から `not_ready` まですべて `bg-gray-500` 〜 `bg-gray-700` で、ユーザーが視覚的に区別しにくい。ブランドカラー（Gold #C8B89A, Night #1A1916）との整合性も不明。

4. **`V2ComparisonView.tsx` のリンク先 `/app/plan`:** ライフプランページへのリンクが複数箇所にあるが、`/app/plan` は `/app/branch` へのリダイレクトスタブ。意図的かもしれないが、「ライフプランでシナリオを作成する」というラベルと分岐ビルダーの機能が一致しない。

5. **世界線テンプレートの二重管理:** `lib/worldline-templates.ts`（V2ComparisonView が参照）と `lib/v2/events.ts` の `EVENT_TEMPLATES` が別々に存在し、イベントの定義が重複している可能性がある。
