# HARIBOTE-AUDIT: プロダクト全体の張りぼて調査

## 🔴 張りぼて（UIあり、ロジック未接続）→ 全件対応済み

| # | 画面 | 要素 | 対応 |
|---|------|------|------|
| ~~H1~~ | ダッシュボード | HousingPlanCard 全入力 | **store接続済み** → `Profile.housingPlans` に永続化。分岐ビルダー連携。🟢 正常に昇格 |
| ~~H2~~ | ダッシュボード | AdvancedInputPanel: 収入推移予測 | **削除済み** — 将来 Profile型+engine接続とセットで再実装 |
| ~~H3~~ | ダッシュボード | AdvancedInputPanel: 不動産評価額 | **削除済み** |
| ~~H4~~ | ダッシュボード | AdvancedInputPanel: 暗号資産 | **削除済み** |
| ~~H5~~ | ダッシュボード | AdvancedInputPanel: その他資産 | **削除済み** |
| ~~H6~~ | ダッシュボード | AdvancedInputPanel: 働き方の目標 | **削除済み** |
| ~~H7~~ | ダッシュボード | AdvancedInputPanel: 遺産スタンス | **削除済み** |
| ~~H8~~ | LP | デモ動画プレースホルダー | **削除済み** |
| ~~H9~~ | FitGate結果 | メールレター登録「準備中」 | **削除済み** |
| ~~H10~~ | FitGate Prep | メールレター登録「準備中」 | **削除済み** |
| ~~H11~~ | 料金ページ | 支払い方法FAQ | **文言修正済み** — 「決済方法は準備中です。サービス開始時にクレジットカード決済に対応します。」 |

---

## 🟡 部分接続（storeに書くがengineが無視）

| # | 画面 | 要素 | store フィールド | engine.ts の参照状況 | ファイル:行 |
|---|------|------|-----------------|---------------------|------------|
| P1 | プロファイル | 住宅ローン金利（mortgageInterestRate） | `profile.mortgageInterestRate` | engine.tsは参照しない。住宅ローン金利は`lifeEvents[].purchaseDetails.interestRate`のみ使用（L496） | `lib/types.ts` |

---

## 🟢 正常（UI → store → engine 完全接続）

| # | 画面 | 要素 | 経路 |
|---|------|------|------|
| 1 | BasicInfoCard | mode (solo/couple) | `onUpdate({mode})` → `profile.mode` → engine L307,388 (partner pension/tax) |
| 2 | BasicInfoCard | currentAge | `onUpdate({currentAge})` → `profile.currentAge` → engine 18箇所 |
| 3 | BasicInfoCard | targetRetireAge | `onUpdate({targetRetireAge})` → `profile.targetRetireAge` → engine 12箇所 |
| 4 | IncomeCard | grossIncome | `onUpdate({grossIncome})` → `profile.grossIncome` → engine L46,108,186,299,382 |
| 5 | IncomeCard | rsuAnnual | `onUpdate({rsuAnnual})` → `profile.rsuAnnual` → engine L186,299,382 |
| 6 | IncomeCard | sideIncomeNet | `onUpdate({sideIncomeNet})` → `profile.sideIncomeNet` → engine L186,382 |
| 7 | IncomeCard | partnerGrossIncome | `onUpdate({partnerGrossIncome})` → `profile.partnerGrossIncome` → engine L187,309,390 |
| 8 | IncomeCard | partnerRsuAnnual | `onUpdate({partnerRsuAnnual})` → `profile.partnerRsuAnnual` → engine L187,309,390 |
| 9 | ExpenseCard | livingCostAnnual | `onUpdate({livingCostAnnual})` → `profile.livingCostAnnual` → engine L425,598,626 |
| 10 | ExpenseCard | housingCostAnnual | `onUpdate({housingCostAnnual})` → `profile.housingCostAnnual` → engine L414-422,470,512 |
| 11 | AssetCard | assetCash | `onUpdate({assetCash})` → `profile.assetCash` → engine L454,673 |
| 12 | AssetCard | assetInvest | `onUpdate({assetInvest})` → `profile.assetInvest` → engine L454,538,625,673 |
| 13 | AssetCard | assetDefinedContributionJP | `onUpdate({assetDefinedContributionJP})` → `profile.assetDefinedContributionJP` → engine L454 |
| 14 | AssetCard | dcContributionAnnual | `onUpdate({dcContributionAnnual})` → `profile.dcContributionAnnual` → engine L535,550 |
| 15 | InvestmentCard | expectedReturn | `onUpdate({expectedReturn})` → `profile.expectedReturn` → engine L457,538 |
| 16 | InvestmentCard | inflationRate | `onUpdate({inflationRate})` → `profile.inflationRate` → engine L418,458,527 |
| 17 | InvestmentCard | volatility | `onUpdate({volatility})` → `profile.volatility` → engine L538,674 |
| 18 | InvestmentCard | useAutoTaxRate | `onUpdate({useAutoTaxRate})` → `profile.useAutoTaxRate` → engine L189,383,391 |
| 19 | InvestmentCard | effectiveTaxRate | `onUpdate({effectiveTaxRate})` → `profile.effectiveTaxRate` → engine L191,385,393 |
| 20 | InvestmentCard | retireSpendingMultiplier | `onUpdate({retireSpendingMultiplier})` → `profile.retireSpendingMultiplier` → engine L443 |
| 21 | 分岐ビルダー | ブランチ選択チェックボックス群 | `setSelectedBranchIds()` → store → `generateWorldlineCandidates()` → `buildProfileForCandidate()` → `runSimulation()` |
| 22 | 分岐ビルダー | 世界線生成ボタン | `handleGenerate()` → engine実行 → score算出 → プレビュー表示 |
| 23 | 分岐ビルダー | 比較ボタン | `handleCompare()` → `addScenarioBatch()` → `/app/worldline`遷移 |
| 24 | 分岐ビルダー | イベント追加ダイアログ | `presetToBranch()` / `bundleToBranches()` → `addCustomBranch()` → store永続化 |
| 25 | 分岐ビルダー | イベント編集ダイアログ | `updateCustomBranch()` / default→custom override → store永続化 |
| 26 | 世界線比較 | 3タブ (worldlines/margins/strategy) | `useMargin()` + `useStrategy()` → simResult由来の計算値を表示 |
| 27 | 世界線比較 | 比較テーブル4指標 | fireAge/assets60/monthlyCF/drawdownAge → 全てsimResult.paths/metrics/cashFlowから算出 |
| 28 | 世界線比較 | シナリオ読込ボタン | `loadScenario()` → profile上書き → シミュレーション再実行 |
| 29 | 設定 | データエクスポート | JSON生成 → ブラウザダウンロード |
| 30 | 設定 | データインポート | ファイル読込 → バリデーション → store復元 → シミュレーション再実行 |
| 31 | 設定 | データリセット | localStorage全削除 → `resetProfile()` → 確認ダイアログ付き |
| 32 | MonteCarloSimulatorTab | volatility スライダー | `onVolatilityChange()` → `updateProfile({volatility})` → engine L538,674 |

---

## 📊 サマリー

| 分類 | 件数 | 対応後 |
|------|------|--------|
| 🔴 張りぼて | **11件** | **0件** (H1:接続, H2-H7:削除, H8-H10:削除, H11:修正) |
| 🟡 部分接続 | **1件** | **1件** (P1:保留) |
| 🟢 正常 | **32件** | **33件** (H1が正常に昇格) |
| **合計** | **44件** | **34件** (10件削除) |
| **接続率** | **75%** (33/44) | **97%** (33/34) |

---

## 対応結果

### H1: HousingPlanCard — store接続済み
- `HousingPlan` 型を `lib/types.ts` に追加
- `Profile.housingPlans: HousingPlan[]` フィールド追加（localStorage永続化）
- `onUpdate` prop追加 → plans/rentAnnual 変更がstoreに書き込まれる
- `createDefaultBranches()` が `profile.housingPlans[0]` を参照（分岐ビルダー連携）
- リロードしてもデータ保持

### H2-H7: AdvancedInputPanel — 削除済み
- `components/dashboard/advanced-input-panel.tsx` 削除
- `app/app/page.tsx`, `app/app/profile/page.tsx` から参照・state・handler を除去
- 将来 Profile型拡張 + engine接続 とセットで再実装する

### H8: デモ動画プレースホルダー — 削除済み
- `app/page.tsx` の灰色ボックスを削除

### H9-H10: メールレター登録 — 削除済み
- `app/fit/result/page.tsx`, `app/fit/prep/page.tsx` から「準備中」セクション削除

### H11: 支払いFAQ — 修正済み
- 「クレジットカードに対応予定です」→「決済方法は準備中です。サービス開始時にクレジットカード決済に対応します。」

### P1: mortgageInterestRate — 保留
- Profile型にフィールドは存在するが、engine.tsは参照しない
- 住宅ローン金利はlifeEvents経由のpurchaseDetailsのみ使用
- 既存オーナーの入力UIがないため実害なし
- HousingPlanCard接続後に再評価予定
