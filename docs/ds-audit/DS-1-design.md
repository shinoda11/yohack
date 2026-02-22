# DS-1 設計書（変更差分の定義）

## 方針
- スコアの高低を色で示さない
- 「良い/悪い」をツールが色で判定しない
- 代替: text-[#5A5550]（濃）/ text-[#8A7A62]（薄）のみ

## ① 削除する色（26箇所）
### exit-readiness-card.tsx
- L39: bg-red-50/50 → 削除（クラス全体を除去）
- L43: text-danger → text-[#8A7A62]
- L46: text-danger → text-[#8A7A62]
- L105: bg-safe → bg-[#E8E4DE]
- L107: bg-danger → bg-[#E8E4DE]
- L206: shadow-[0_4px_12px_rgba(74,124,89,0.15)] → 削除
- L207: border-danger border-2 → 削除
- L218: '#4A7C59' → '#C8B89A' / '#CC3333' → '#C8B89A'
- L278: bg-safe text-white border-safe → bg-[#E8E4DE] text-[#5A5550] border-[#E8E4DE]
- L280: bg-danger text-white border-danger → bg-[#E8E4DE] text-[#5A5550] border-[#E8E4DE]
- L292: text-safe → text-[#5A5550]
- L294: text-danger → text-[#8A7A62]

### conclusion-summary-card.tsx
- L59: bg-danger/10 → 削除
- L61: text-danger → text-[#8A7A62]
- L62: text-danger → text-[#8A7A62]
- L247: bg-safe/10 text-safe → text-[#5A5550]
- L248: bg-danger/10 text-danger → text-[#8A7A62]
- L321: border-danger → 削除
- L364: bg-danger/10 text-danger → text-[#8A7A62]

### key-metrics-card.tsx
- L46: text-red-700 → text-[#8A7A62]
- L47: text-red-700 → text-[#8A7A62]
- L48: bg-red-50 → 削除
- L90: text-danger / text-amber-500 → text-[#8A7A62]

### cash-flow-card.tsx
- L313: text-red-700 → text-[#8A7A62]

## ② 残す（変更しない）
### scenario-comparison-card.tsx
- L237: hover:text-red-700 → そのまま（削除ボタンのUI）

### V2ComparisonView.tsx
- L290, L321, L402, L449: text-safe / text-danger → そのまま（数値の増減方向）

## ③ 色なし・文字のみに変更（8箇所）
### housing-plan-card.tsx
- L537: text-safe → text-[#5A5550]
- L562: bg-safe/10 → 削除

### V2ResultSection.tsx
- L86: '#4A7C59' → '#C8B89A' / '#CC3333' → '#C8B89A'
- L349: bg-[#E8F5E8] text-safe border-safe/30 → bg-[#F5F3EF] text-[#5A5550] border-[#E8E4DE]
- L350: bg-[#FDE8E8] text-danger border-danger/30 → bg-[#F5F3EF] text-[#5A5550] border-[#E8E4DE]

### MoneyMarginCard.tsx
- L113: bg-safe/10 text-safe → text-[#5A5550]
