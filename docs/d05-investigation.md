# D05 調査結果: MetricCard 統一コンポーネント

## 調査日: 2026-02-23

---

## メトリクス表示の全箇所

| # | ファイル | メトリクス内容 | 現在のレイアウト | 現在の数字スタイル | 現在のラベルスタイル |
|---|---------|--------------|----------------|-------------------|-------------------|
| 1 | conclusion-summary-card | 生存率 / 安心ライン到達 / 100歳時点中央値 | `flex justify-center gap-6` (3列横並び) | `text-lg font-medium tabular-nums` | `text-xs text-muted-foreground` (値の下) |
| 2 | asset-projection-chart | 退職時中央値 / 最終中央値 / 悲観シナリオ | `grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4` | `text-lg font-bold tabular-nums text-brand-stone` | `text-xs text-muted-foreground mb-1` (値の上) |
| 3 | monte-carlo-simulator-tab | 楽観(90%ile) / 中央値 / 悲観(10%ile) | `grid gap-4 sm:grid-cols-3` (Card + CardContent) | `text-2xl font-bold tabular-nums sm:text-3xl` + Badge | `text-sm text-muted-foreground` (値の上) |
| 4 | cash-flow-card (取り崩し) | 退職時推定資産 / 年間取り崩し / 枯渇年齢 / 枯渇確率 | `grid grid-cols-2 gap-4` | `text-lg font-bold font-[DM Sans] tabular-nums` | `text-xs text-muted-foreground` (値の上) |
| 5 | exit-readiness-card | サバイバル / 生活水準 / リスク / 流動性 | `grid grid-cols-2 sm:grid-cols-4 gap-4` + HoverCard | `text-xl font-bold font-[DM Sans] tabular-nums` + アイコン | `text-xs text-muted-foreground` (値の下) |

---

## 不統一のサマリ

| 要素 | バリエーション数 | 詳細 |
|------|---------------|------|
| 数字フォントサイズ | 4種 | text-lg / text-xl / text-2xl / text-3xl |
| 数字フォントウェイト | 2種 | font-medium / font-bold |
| 数字カラー | 3種 | text-foreground(implicit) / text-brand-stone / text-brand-bronze(conditional) |
| ラベル位置 | 2種 | 値の上 / 値の下 |
| ラベルサイズ | 2種 | text-xs / text-sm |
| 背景 | 4種 | なし / bg-muted/50 / Card コンポーネント / bg-[#F0ECE4](parent) |
| 追加要素 | 3種 | なし / Badge / アイコン+HoverCard |

---

## 統一方針

### MetricCard 統一仕様
- ラベル: `text-xs text-muted-foreground mb-1`（常に値の上）
- 値: `text-xl font-medium tabular-nums text-foreground`（数字が主役）
- 3 variant: default (bg-muted/50 + rounded-lg + p-4) / emphasized (テキストのみ) / compact (py-2のみ)

### 適用マッピング
| 対象 | variant | 理由 |
|------|---------|------|
| ConclusionSummaryCard subMetrics | emphasized | Linen親カード内、背景不要 |
| AssetProjectionChart 3カード | default | 独立カード、bg-muted/50 維持 |
| MonteCarloSimulatorTab 3カード | default | Card→MetricCard に簡素化、Badge→label に統合 |
| CashFlowCard 取り崩し4メトリクス | default | 独立カード、bg-muted/50 維持 |
| ExitReadinessCard サブスコア4軸 | compact | アイコン・HoverCard除去、ScoreBreakdownに詳細を委譲 |

### 適用しない箇所
- CashFlowCard FlowItem行（収入/支出フロー、アイコン+横並び固有レイアウト）
- CashFlowCard 収入合計/年間収支（ハイライト付き固有レイアウト）
- ScenarioComparisonCard テーブルセル
- チャートツールチップ/凡例（Recharts内部）
- 入力カード内の現在値表示
