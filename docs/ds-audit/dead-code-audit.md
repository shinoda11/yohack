# デッドコード監査結果

日付: 2026-02-23
対象: D01-D17 + バグ修正後のコードベース

---

## 未使用コンポーネント（ファイルごと削除可能）

| ファイル | 行数 | 理由 | 削除可否 |
|----------|------|------|----------|
| `components/dashboard/key-metrics-card.tsx` | 182 | D02 で除去対象。0 参照 | 削除可 |

- `next-best-actions-card.tsx` は D12 で正しく削除済み
- `HousingMultiScenarioCard` はコードベースに存在しない

---

## 未使用 hook（ファイルごと削除可能）

| ファイル | 行数 | 理由 |
|----------|------|------|
| `hooks/useHousingScenarios.ts` | 41 | 0 import。住宅シナリオ比較の旧ロジック |
| `hooks/usePlan.ts` | 24 | 0 import。プラン機能の旧ロジック |

---

## 未使用の型定義

| 型名 | 定義ファイル | 備考 |
|------|------------|------|
| `RsuGrant` | `lib/types.ts:178-185` | 0 外部参照。`components/plan/rsu-content.tsx` が独自のローカル `RSUGrant` を定義しており重複 |
| `VestingEvent` | `lib/types.ts:187-191` | `RsuGrant.vestingSchedule` のみで参照。RsuGrant と共に孤立 |

---

## 未使用 export（内部使用のみで export が不要）

### hooks/useStrategy.ts の未使用 export 型

| 型名 | 行 | 外部参照数 |
|------|-----|-----------|
| `ImpactLevel` | 10 | 0（内部使用のみ） |
| `TimeHorizon` | 11 | 0（内部使用のみ） |
| `StrategyRecommendation` | 13-25 | 0（内部使用のみ） |
| `ActionPriority` | 27-36 | 0（内部使用のみ） |
| `StrategyEvaluation` | 39-45 | 0（内部使用のみ） |
| `StrategicInsight` | 47-53 | 0（内部使用のみ） |

`OverallAssessment`（55-60）のみ外部参照あり（V2ResultSection.tsx）。
これらの型は useStrategy.ts 内部で使用されているため、export を外すだけで良い（削除不要）。

---

## 未使用の関数（ファイル内デッドコード）

| 関数名 | 定義ファイル | 行 | 理由 |
|--------|------------|-----|------|
| `collectEdges` | `components/branch/branch-tree-viz.tsx` | 106-133 | `collectAllEdges`（135行）のみ使用。`collectEdges` は呼び出されていない |

---

## 未使用 CSS クラス

| クラス名 | 定義ファイル | 備考 |
|----------|------------|------|
| `no-scrollbar` | `app/globals.css:292-293` | .tsx/.css から 0 参照 |

---

## 未使用 import

pnpm build は warning なしで成功。ESLint は Windows 環境でエンコーディングエラーのため実行不可。
手動確認の結果、主要ファイル（app/app/page.tsx, worldline/page.tsx, V2ComparisonView.tsx）に未使用 import なし。

---

## D12/D08 の残骸チェック

| 項目 | 状態 |
|------|------|
| Tabs import（app/app/page.tsx） | 正しく除去済み ✅ |
| 旧タブ値（"summary"/"montecarlo"/"scenario"） | 0 参照 ✅ |
| primaryStrategy/strategicInsights（types.ts） | 正しく除去済み ✅ |
| primaryStrategy/strategicInsights（useStrategy.ts） | 内部変数として残存（export されていない、問題なし） |
| loadScenario | worldline/page.tsx + V2ComparisonView で正当に使用中 ✅ |
| handleApplyTemplate | worldline/page.tsx + V2ComparisonView で正当に使用中 ✅ |

---

## lib/v2/ モジュール

全モジュール使用中。未使用なし。

| ファイル | import 数 |
|----------|----------|
| `adapter.ts` | 2 |
| `margin.ts` | 5 |
| `readinessConfig.ts` | 1 |
| `store.ts` | 1 |
| `worldline.ts` | 1 |

---

## 削除の優先順位

### P0: ファイルごと削除（最もインパクト大）
1. `components/dashboard/key-metrics-card.tsx` — 182行のデッドコード
2. `hooks/useHousingScenarios.ts` — 41行のデッドコード
3. `hooks/usePlan.ts` — 24行のデッドコード

### P1: 未使用型の除去
4. `lib/types.ts` の `RsuGrant` + `VestingEvent` — 孤立した型定義
5. `hooks/useStrategy.ts` の 6 型を export → 非 export に変更

### P2: ファイル内デッドコード
6. `branch-tree-viz.tsx` の `collectEdges` 関数を削除

### P3: 未使用 CSS
7. `globals.css` の `.no-scrollbar` を削除

合計削除可能行数: 約 260 行

---

## 注意事項
- 動的 import や条件付き import がある場合、grep では検出できない
- `useStrategy.ts` の型は内部で使用されているため、export キーワードを外すだけ（型自体は削除不可）
- `no-scrollbar` は将来のスクロール系 UI で使う可能性があるため、判断は任意
- ESLint のエンコーディング問題は Windows 環境固有。CI では問題ない可能性あり
