> **Archive**: This file is a historical record. Current rules and specs are in CLAUDE.md.

# D02 調査結果: ダッシュボード重複除去

## 調査日: 2026-02-23

---

## 1. スコア表示の重複

| 場所 | コンポーネント | 表示内容 | サイズ | 表示タイミング |
|------|-------------|---------|--------|-------------|
| HERO（常時表示） | ConclusionSummaryCard | SVG ring 120px + `animatedScore` /100 | 120px | 常時 |
| 世界線タブ | ExitReadinessCard | SVG ring 144px + `animatedScore` /100 | 144px | タブ切替時 |

**重複**: 同じ `score.overall` を2つの SVG ring で表示。
どちらも `useScoreAnimation` + `useAnimatedValue` を使用し、brand-gold ストローク色。

---

## 2. 「安心ライン到達年齢」(fireAge) の重複

| 場所 | コンポーネント | 表示 | ソース |
|------|-------------|------|--------|
| HERO subMetrics | ConclusionSummaryCard | `安心ライン到達: XX歳` | `metrics.fireAge` |
| HERO headline | ConclusionSummaryCard | `XX歳で安心ライン到達。目標よりN年の余白。` | `metrics.fireAge` |
| サマリータブ | KeyMetricsCard | `安心ライン到達年齢: XX歳` + `あとN年` | `metrics.fireAge` |
| サマリータブ | KeyMetricsCard | `安心ラインまで: N年` | `targetRetireAge - currentAge` |
| 世界線タブ | KeyMetricsCard (2回目) | 同上 | 同上 |
| 世界線タブ | ScenarioComparisonCard テーブル | `安心ライン` 列 + `余白開始` 列 | `metrics.fireAge` |

**重複回数**: fireAge は画面上に最大 **5箇所** で表示される（HERO headline含む）。

---

## 3. 「生存率 / 余白維持率」(survivalRate) の重複

| 場所 | コンポーネント | 表示 | ソース |
|------|-------------|------|--------|
| HERO subMetrics | ConclusionSummaryCard | `生存率: XX%` | `metrics.survivalRate` |
| サマリータブ | KeyMetricsCard | `余白維持率: XX%` + `100歳まで余白が続く確率` | `metrics.survivalRate` |
| 世界線タブ | KeyMetricsCard (2回目) | 同上 | 同上 |
| 世界線タブ | ScenarioComparisonCard テーブル | `成功確率` 列 | `metrics.survivalRate` |
| サマリータブ | CashFlowCard | `枯渇確率 XX%`（= 100 - survivalRate） | `metrics.survivalRate` |

**重複回数**: survivalRate は最大 **5箇所**。CashFlowCard は逆数表現（枯渇確率）で文脈が異なるため許容可能。

---

## 4. 「100歳時点の資産」(assetAt100) の重複

| 場所 | コンポーネント | 表示 | ソース |
|------|-------------|------|--------|
| HERO subMetrics | ConclusionSummaryCard | `100歳時点 中央値: X万円/X億円` | `metrics.assetAt100` |
| サマリータブ | KeyMetricsCard | `100歳時点の余白: X万円` + `中央値シナリオ` | `metrics.assetAt100` |
| 世界線タブ | KeyMetricsCard (2回目) | 同上 | 同上 |
| 世界線タブ | ScenarioComparisonCard テーブル | `100歳資産` 列 | `metrics.assetAt100` |

**重複回数**: 最大 **4箇所**。

---

## 5. ExitReadinessCard の sub-scores (survival/lifestyle/risk/liquidity)

| 場所 | コンポーネント | 表示 |
|------|-------------|------|
| 世界線タブ | ExitReadinessCard | 4 sub-scores + breakdown + benchmark |

**重複なし**: sub-scores は ExitReadinessCard のみ。ただしスコアリング自体は ConclusionSummaryCard と重複。

---

## 6. ダッシュボード タブ構成と全コンポーネント配置

```
HERO（常時表示）
├── ConclusionSummaryCard
│   ├── Score ring 120px
│   ├── Headline（安心ライン言及）
│   ├── subMetrics: 生存率 / 安心ライン到達 / 100歳時点中央値
│   ├── ChangeBadge: スコア変化 / fireAge変化 / 生存率変化
│   └── 世界線テンプレート導線

<details> 前提を編集する（デフォルト閉）
├── ProfileSummaryCard
├── IncomeCard
├── RetirementCard
├── ExpenseCard
├── InvestmentCard
└── HousingPlanCard

Tabs
├── サマリー
│   ├── Save + Share buttons
│   ├── ★ KeyMetricsCard ← ConclusionSummaryCard と重複
│   ├── VariableBar
│   ├── AssetProjectionChart
│   └── CashFlowCard
├── 確率分布
│   └── MonteCarloSimulatorTab
└── 世界線
    ├── ScenarioComparisonCard（テーブルに fireAge/survivalRate/assetAt100）
    └── 2-col grid
        ├── ★ ExitReadinessCard ← Score ring が ConclusionSummaryCard と重複
        └── ★ KeyMetricsCard (2回目) ← 完全重複
```

---

## 7. 重複マトリクス（情報 × 表示箇所）

| 情報 | ConclusionSummary | KeyMetrics(サマリー) | KeyMetrics(世界線) | ExitReadiness | ScenarioComparison | CashFlow |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| スコア ring | ● | | | ● | | |
| fireAge | ● (headline+sub) | ● | ● | | ● | |
| survivalRate | ● (sub) | ● | ● | | ● | ●(逆数) |
| assetAt100 | ● (sub) | ● | ● | | ● | |
| sub-scores (4軸) | | | | ● | | |
| benchmark | | | | ● | | |
| yearsToFire | | ● | ● | | | |

---

## 8. 削除方針案

原則: **各情報は画面上に1回だけ表示する。ConclusionSummaryCard を正とする。**

### 削除対象

1. **サマリータブの KeyMetricsCard を削除** — 4メトリクス全てが ConclusionSummaryCard subMetrics と重複
2. **世界線タブの KeyMetricsCard を削除** — 同上
3. **ExitReadinessCard のスコア ring を削除** — ConclusionSummaryCard と重複。sub-scores + breakdown + benchmark は残す

### 残すもの

- **ConclusionSummaryCard** (hero): スコア ring + headline + subMetrics（正の表示）
- **ExitReadinessCard** (世界線タブ): sub-scores 4軸 + breakdown + benchmark（ring 除去）
- **ScenarioComparisonCard** (世界線タブ): 複数シナリオの比較テーブル（文脈が異なるため許容）
- **CashFlowCard** (サマリータブ): 枯渇確率は逆数かつキャッシュフロー文脈で表示
- **VariableBar** + **AssetProjectionChart**: 重複なし
