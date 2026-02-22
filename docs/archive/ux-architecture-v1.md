# Phase A: モバイル基盤修正

## 目的
モバイルでの横揺れ根絶 + ボトムナビゲーション導入 + 全画面のレスポンシブ対応。
新機能は追加しない。既存コードの修正のみ。

## 参照ドキュメント
- docs/ux-architecture-v1.md §6（モバイル対応の原則）
- docs/ux-architecture-v1.md §5（ナビゲーション）

---

## Step 1: グローバルな横揺れ防止

### app/globals.css
```css
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

### app/layout.tsx
- ルートの `<div>` に `overflow-x-hidden max-w-screen` を追加
- 既存の `flex` レイアウト（サイドバー + メイン）をレスポンシブ化:
  - モバイル: `flex-col` でサイドバー非表示、メインが全幅
  - デスクトップ: 既存の `flex` を維持

---

## Step 2: ボトムナビゲーション（モバイル）

### 新規ファイル: components/layout/bottom-nav.tsx
```
'use client'

4タブのボトムナビゲーション:
- ホーム (Home アイコン, /)
- 分岐 (GitBranch アイコン, /plan) ← 将来 /branch に変更
- 比較 (Scale アイコン, /v2) ← 将来 /worldline に変更  
- 設定 (Settings アイコン, /settings)

デザイン仕様:
- 高さ: 64px + safe-area-inset-bottom
- 背景: #F0ECE4 (linen) + backdrop-blur
- アクティブ色: #C8B89A (gold)
- 非アクティブ色: #B5AFA6 (muted)
- アイコン: lucide-react (Home, GitBranch, Scale, Settings)
- ラベル: text-xs, アイコンの下に
- 現在のパスでアクティブ状態を切り替え（usePathname）
- border-top: 1px solid #E8E4DE

md 以上では非表示 (hidden md:hidden → className="md:hidden")
```

### components/layout/sidebar.tsx の修正
- `md:hidden` ではなく `hidden md:flex` に変更
- モバイルではサイドバーを完全に隠す（ハンバーガーメニューも不要）

### app/layout.tsx の修正
- `<BottomNav />` をメインコンテンツの後に追加
- モバイル時にメインコンテンツに `pb-20`（ボトムナビの高さ分）を追加

---

## Step 3: 各ページのモバイル最適化

### app/page.tsx（ダッシュボード）
- 2カラムレイアウト → モバイルでは1カラムに
  - 入力カード群 → 結果カード群 の順で縦に積む
  - `grid grid-cols-1 md:grid-cols-2 gap-4` パターン
- カード内のパディング: `p-4 md:p-6`

### 全 SVG / Recharts コンポーネント
以下のファイルで Recharts の `<ResponsiveContainer>` が正しく設定されているか確認:
- components/dashboard/asset-projection-chart.tsx
- components/dashboard/monte-carlo-simulator-tab.tsx
- components/v2/MoneyMarginCard.tsx

修正パターン:
```tsx
<div className="w-full overflow-x-hidden">
  <ResponsiveContainer width="100%" height={300}>
    ...
  </ResponsiveContainer>
</div>
```

### テーブル → モバイルではカード表示に
テーブルを使っているコンポーネントを探して、モバイルではカードスタックに切り替え:
```tsx
{/* デスクトップ */}
<div className="hidden md:block">
  <Table>...</Table>
</div>
{/* モバイル */}
<div className="md:hidden space-y-2">
  {data.map(item => <Card>...</Card>)}
</div>
```

### components/slider-input.tsx
- スライダーのタッチターゲットが十分か確認（最低44px）
- `min-h-[44px]` を追加

### 全ページ共通
- `px-4 md:px-6` のパディングルール統一
- `text-sm md:text-base` のフォントサイズルール
- `max-w-screen overflow-x-hidden` をページコンテナに

---

## Step 4: テスト

### 手動確認項目
```
[ ] / （ダッシュボード）がモバイル幅（375px）で横揺れしない
[ ] /plan がモバイル幅で横揺れしない
[ ] /v2 がモバイル幅で横揺れしない
[ ] /settings がモバイル幅で横揺れしない
[ ] /pricing がモバイル幅で横揺れしない
[ ] ボトムナビが表示される（モバイル）
[ ] ボトムナビが非表示（デスクトップ）
[ ] サイドバーが非表示（モバイル）
[ ] サイドバーが表示（デスクトップ）
[ ] ボトムナビの各タブが正しいページに遷移する
[ ] 現在のページに対応するタブがアクティブ状態になる
[ ] Recharts のグラフが横にはみ出さない
[ ] スライダーがタッチで操作可能
[ ] テキストが切れていない
```

### ビルド確認
```bash
pnpm build
pnpm test
```

---

## 注意事項
- 新しいページは作らない（Phase B で実施）
- 新しい機能は追加しない
- 既存の機能を壊さない
- コンポーネントの分割・統合はしない
- ストアの変更はしない
- ルーティングの変更はしない（/plan, /v2 はそのまま）
