# モバイル品質監査結果
生成日時: 2026-02-18

---

## 🔴 バグ（動作しない）

| # | 画面 | 問題 | ファイル:行 |
|---|------|------|------------|
| 1 | /app/worldline | 「戦略を見る」ボタンに onClick/href がなく、クリックしても何も起きない | components/v2/V2ResultSection.tsx:138-141 |
| 2 | /pricing | CTA「適合チェックに進む」の href が `"#"` で遷移しない。`"/fit"` であるべき | app/pricing/page.tsx:115 |
| 3 | /app/worldline | DecisionHost の handleApplyStrategy が空スタブ。新しい世界線作成が未実装 | components/v2/DecisionHost.tsx:57-59 |

---

## 🟡 UX問題（動くが体験が悪い）

| # | 画面 | 問題 | ファイル:行 | 修正案 |
|---|------|------|------------|--------|
| 1 | /fit | 12問が一括表示。モバイルでスクロール量が多い | app/fit/page.tsx:3 (TODO記載あり) | 1問ずつステップ式UIに変更 |
| 2 | /fit/result | Prep判定時「再診断を受ける」が `/fit` に遷移。`/fit/prep` への導線がない | app/fit/result/page.tsx:212-215 | Prep用のフローを `/fit/prep` に繋げる |
| 3 | 全画面 | ページタイトルの font-weight が不統一（Dashboard/Profile: `font-semibold`、Branch/Worldline: `font-bold`） | 各page.tsx | `text-xl font-bold tracking-tight` に統一 |
| 4 | /app/settings | タイトルが `text-3xl font-bold` で他画面（`text-xl`）と不統一 | app/app/settings/page.tsx:137 | `text-xl font-bold tracking-tight` に統一 |
| 5 | 全画面 | ヘッダーの sticky 挙動が不統一。Dashboard/Worldline は sticky、Branch/Settings は非 sticky | 各page.tsx | 全プロダクトページで sticky ヘッダーに統一 |
| 6 | /app/profile | サブタイトルがなく、代わりにパンくず（←ダッシュボードに戻る）のみ。他画面と構造が異なる | app/app/profile/page.tsx:166-172 | サブタイトルを追加 or パンくずを全画面に統一 |

---

## 🔵 ポリッシュ（細部の品質）

| # | カテゴリ | 問題 | ファイル:行 | 修正案 |
|---|----------|------|------------|--------|
| 1 | a11y | 展開/折りたたみボタン4箇所に aria-label なし（テキストはあるため軽微） | income-card.tsx:67, asset-card.tsx:66, advanced-input-panel.tsx:230, housing-plan-card.tsx | `aria-label="セクションを展開"` 追加 |
| 2 | shadow | AssetProjectionChart のツールチップが `shadow-lg`（他は `shadow-sm`） | components/dashboard/asset-projection-chart.tsx:84 | `shadow-sm` に統一 |
| 3 | spacing | カード内の spacing が `space-y-6`（入力カード）と `space-y-4`（レイアウト）で混在 | 各コンポーネント | 用途別に意図的であれば許容。ドキュメント化を推奨 |
| 4 | docs | HousingMultiScenarioCard が quality-audit.md のチェックリストに記載されているが、実際には未実装（HousingPlanCard のみ存在） | app/app/page.tsx | チェックリスト側を更新 |

---

## 📊 カラー監査

**パレット外の色使用: 100箇所以上（13ファイル）**

YOHACK パレット: Night `#1A1916` / Linen `#F0ECE4` / Gold `#C8B89A` / Text `#5A5550` / BG `#FAF9F7`

| ファイル | パレット外の色 |
|---------|---------------|
| components/ui/collapsible-card.tsx | `border-gray-200`, `text-gray-400` |
| components/dashboard/asset-projection-chart.tsx | `text-gray-500/700/800`, `bg-gray-400/500/700` (10箇所+) |
| components/dashboard/cash-flow-card.tsx | `bg-gray-100`, `text-gray-500/600/700/800`, `bg-gray-50`, `border-gray-200` |
| components/dashboard/conclusion-summary-card.tsx | `text-red-500/700`, `bg-red-50/80`, `text-gray-400`, `text-red-100` |
| components/dashboard/key-metrics-card.tsx | `text-red-600/700`, `bg-red-50`, `text-gray-400/500` |
| components/dashboard/monte-carlo-simulator-tab.tsx | `border-gray-200/300/700`, `bg-white`, `bg-gray-50/700/900`, `text-gray-100/500/600/700/800/900` (20箇所+) |
| components/dashboard/next-best-actions-card.tsx | `border-l-gray-300/400/600`, `bg-gray-50/100`, `text-gray-500/700/800` |
| components/dashboard/scenario-comparison-card.tsx | `border-gray-100/800`, `text-gray-400/500/600/700/900`, `bg-gray-50/200/900` |
| components/v2/ConclusionCard.tsx | `bg-gray-50/100`, `border-gray-200/700/800`, `text-gray-200/400/500/800` |
| components/branch/worldline-preview.tsx | `bg-red-100`, `text-red-700` |
| components/branch/event-customize-dialog.tsx | `text-red-600`, `hover:text-red-700`, `hover:bg-red-50` |
| components/plan/rsu-content.tsx | `text-gray-600/700` |
| components/ui/toast.tsx | `text-red-300`, `hover:text-red-50`, `focus:ring-red-400` |

**結論**: ダッシュボード系コンポーネントに Tailwind デフォルトの gray/red が大量に残存。パレット準拠への一括置換が必要。

---

## 📏 タイポグラフィ監査

**不統一箇所: 4箇所**

| 画面 | 現在 | あるべき姿 |
|------|------|-----------|
| /app (Dashboard) | `text-xl font-semibold` | `text-xl font-bold tracking-tight` |
| /app/branch | `text-xl font-bold tracking-tight` | (基準) |
| /app/worldline | `text-xl font-bold tracking-tight` | (基準) |
| /app/profile | `text-xl font-semibold` | `text-xl font-bold tracking-tight` |
| /app/settings | `text-3xl font-bold tracking-tight` | `text-xl font-bold tracking-tight` |

---

## 📐 スペーシング監査

**不統一箇所: 2箇所（軽微）**

| 箇所 | 現在 | 備考 |
|------|------|------|
| ダッシュボード入力カード群 | `space-y-4` | OK |
| 各入力カード内部 | `space-y-6` | フォーム内部なので意図的と判断 |
| CardHeader padding | `pb-3` | 標準的な Tailwind 単位。許容範囲 |

---

## ✅ 問題なし

| カテゴリ | 状況 |
|----------|------|
| タッチターゲット (B4) | 全インタラクティブ要素が 44px 以上。ボトムナビ・ヘッダー・ボタンすべて合格 |
| カード角丸 (B5) | `rounded-xl` で統一。問題なし |
| ボーダー幅 (B5) | `border` (1px) で統一。`border-l-2` は意図的なアクセント |
| 'use client' (C1) | 全インタラクティブ tsx ファイルに設置済み。漏れなし |
| 画像 alt (C2) | img/Image タグ自体がゼロ（SVG直書き）。問題なし |
| TODO/FIXME (C1) | 1件のみ: `/fit` のステップ式UI (既知) |

---

## 優先度サマリー

| 優先度 | 件数 | 内容 |
|--------|------|------|
| **P0 (バグ)** | 3 | 戦略ボタン無効、pricing CTA壊れ、DecisionHost未実装 |
| **P1 (カラー)** | 100+ | パレット外の gray/red を全面置換 |
| **P2 (統一)** | 6 | タイトルスタイル、ヘッダー sticky、サブタイトル構造 |
| **P3 (軽微)** | 4 | aria-label、shadow、spacing ドキュメント化 |
