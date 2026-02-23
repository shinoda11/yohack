> **Archive**: This file is a historical record. Current rules and specs are in CLAUDE.md.

# DS-1 調査: ダッシュボードの警告色（before）

> 調査日: 2026-02-22
> 対象: `components/dashboard/` + `components/v2/`

## 概要

ダッシュボード上で信号機的な色（黄・赤・緑 / safe・danger / ハードコード色）が使われている箇所の全一覧。

---

## 1. exit-readiness-card.tsx（最多: 12箇所）

| 行 | コード | 分類 |
|---|---|---|
| 39 | `belowSafety && "border-2 border-danger/40 bg-red-50/50 dark:bg-red-950/10"` | 赤系bg |
| 43 | `<AlertTriangle className="h-3.5 w-3.5 text-danger" />` | 赤系text |
| 46 | `belowSafety && "text-danger"` | 赤系text |
| 105 | `if (value >= 80) return 'bg-safe';` | 緑系bg（プログレスバー） |
| 107 | `return 'bg-danger';` | 赤系bg（プログレスバー） |
| 206 | `scoreDirection === 'up' && 'shadow-[0_4px_12px_rgba(74,124,89,0.15)]'` | 緑系shadow（#4A7C59） |
| 207 | `scoreDirection === 'down' && 'border-danger border-2 !duration-150'` | 赤系border |
| 218 | `const strokeColor = animatedScore >= 80 ? '#4A7C59' : animatedScore >= 50 ? '#C8B89A' : '#CC3333';` | 緑/赤ハードコード |
| 278 | `score.overall >= 80 && "bg-safe text-white border-safe"` | 緑系badge |
| 280 | `score.overall < 50 && "bg-danger text-white border-danger"` | 赤系badge |
| 292 | `score.overall >= 80 && "text-safe"` | 緑系text |
| 294 | `score.overall < 50 && "text-danger"` | 赤系text |

### 文言（GREEN/YELLOW/RED ラベル）
| 行 | コード |
|---|---|
| 193 | `GREEN: '十分'` |
| 194 | `YELLOW: '良好'` |
| 196 | `RED: '要見直し'` |
| 296 | `score.level === 'GREEN' && <>目標達成の可能性が非常に高いです</>` |
| 297 | `score.level === 'YELLOW' && <>目標達成の見込みは良好です</>` |
| 299 | `score.level === 'RED' && <>計画の見直しをおすすめします</>` |

---

## 2. conclusion-summary-card.tsx（8箇所）

| 行 | コード | 分類 |
|---|---|---|
| 12 | `type Status = 'GREEN' \| 'YELLOW' \| 'RED' \| 'CALCULATING';` | 型定義 |
| 34 | `if (score.overall >= 70) return 'GREEN';` | ステータス判定 |
| 35 | `if (score.overall >= 40) return 'YELLOW';` | ステータス判定 |
| 36 | `return 'RED';` | ステータス判定 |
| 59 | `bgColor: 'bg-danger/10'` | 赤系bg |
| 61 | `iconColor: 'text-danger'` | 赤系text |
| 62 | `textColor: 'text-danger'` | 赤系text |
| 247-248 | `'bg-safe/10 text-safe'` / `'bg-danger/10 text-danger'` | 緑赤切替 |
| 321 | `scoreDirection === 'down' && 'border-danger !duration-150'` | 赤系border |
| 364 | `"bg-danger/10 text-danger"` | 赤系bg+text |

---

## 3. key-metrics-card.tsx（3箇所）

| 行 | コード | 分類 |
|---|---|---|
| 46 | `icon: 'text-red-700 dark:text-red-400'` | 赤系text（Tailwind直） |
| 47 | `value: 'text-red-700 dark:text-red-300'` | 赤系text（Tailwind直） |
| 48 | `bg: 'bg-red-50 dark:bg-red-950/20'` | 赤系bg（Tailwind直） |
| 90 | `isDanger ? "text-danger dark:text-red-400" : "text-amber-500 dark:text-amber-400"` | 赤/黄系text |

---

## 4. cash-flow-card.tsx（1箇所）

| 行 | コード | 分類 |
|---|---|---|
| 313 | `depletionProb !== null && depletionProb > 20 && "text-red-700"` | 赤系text（Tailwind直） |

---

## 5. housing-plan-card.tsx（2箇所）

| 行 | コード | 分類 |
|---|---|---|
| 537 | `bestPlanId === 'rent' ? 'text-safe' : 'text-[#4A6FA5]'` | 緑系text |
| 562 | `s.id === bestPlanId && bestPlanId === 'rent' && 'bg-safe/10'` | 緑系bg |

---

## 6. scenario-comparison-card.tsx（1箇所）

| 行 | コード | 分類 |
|---|---|---|
| 237 | `className="h-11 w-11 text-brand-bronze/60 hover:text-red-700"` | 赤系hover（削除ボタン） |

---

## 7. V2ResultSection.tsx（3箇所）

| 行 | コード | 分類 |
|---|---|---|
| 86 | `stroke={(score >= 80) ? '#4A7C59' : (score >= 50) ? '#C8B89A' : '#CC3333'}` | 緑/赤ハードコード（SVG円） |
| 349 | `insight.category === 'strength' && 'bg-[#E8F5E8] text-safe border-safe/30'` | 緑系bg+text |
| 350 | `insight.category === 'weakness' && 'bg-[#FDE8E8] text-danger border-danger/30'` | 赤系bg+text |

---

## 8. V2ComparisonView.tsx（4箇所）

| 行 | コード | 分類 |
|---|---|---|
| 290 | `delta < 0 ? "text-safe" : "text-danger"` | 緑赤切替（差分表示） |
| 321 | `delta > 0 ? 'text-safe' : 'text-danger'` | 緑赤切替（差分表示） |
| 402 | `delta > 0 ? "text-safe" : "text-danger"` | 緑赤切替（差分表示） |
| 449 | `delta > 0 ? "text-safe" : "text-danger"` | 緑赤切替（差分表示） |

---

## 9. MoneyMarginCard.tsx（1箇所）

| 行 | コード | 分類 |
|---|---|---|
| 113 | `metric.highlight ? 'bg-safe/10 text-safe' : 'bg-muted text-muted-foreground'` | 緑系bg+text |

---

## 集計

| 分類 | 箇所数 |
|---|---|
| `text-safe` / `bg-safe` (緑系トークン) | 12 |
| `text-danger` / `bg-danger` (赤系トークン) | 16 |
| `text-red-*` / `bg-red-*` (Tailwind直指定) | 5 |
| `text-amber-*` (黄系Tailwind直指定) | 1 |
| `#4A7C59` (緑ハードコード) | 2 |
| `#CC3333` (赤ハードコード) | 2 |
| `#E8F5E8` / `#FDE8E8` (緑赤bg直指定) | 2 |
| **合計** | **40箇所** |

### 注意: 削除すべきでない箇所
- `scenario-comparison-card.tsx:237` の `hover:text-red-700` は削除ボタンのUIフィードバックであり、スコア表示ではない。`destructive` に置換が妥当。
- `V2ComparisonView.tsx` の差分表示（290, 321, 402, 449）はスコアではなく数値比較の上下を示すもの。トークン変更の対象だが意味が異なる。
