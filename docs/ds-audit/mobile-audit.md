# モバイル体験監査

監査日: 2026-02-24
テスト環境: Playwright 1.58.2 + Chromium (iPhone SE 375x667, iPhone 14 390x844)

---

## 概要

Playwright による自動品質チェック + コード静的分析で、モバイル表示の問題を網羅的に洗い出した。

テスト結果:
- スクリーンショット: 12/12 pass（Desktop Chrome + iPhone SE + iPhone 14 × 4ページ）
- 品質チェック: 24/24 pass（ソフトチェック、annotation ベース）
- 水平オーバーフロー: **全ページ 0件**（overflow-x-hidden が効いている）

---

## CRITICAL — フォントサイズ

### Recharts ライフイベントラベル（9px）
- **場所**: ダッシュボード — 資産推移チャート上のイベントマーカー
- **検出**: iPhone SE / iPhone 14 両方で 4要素（年金、住宅購入、年収ダウン、ペースダウン）
- **現在値**: 9px（Recharts カスタムラベル）
- **影響**: チャート上のイベント名が小さすぎて読みにくい
- **修正案**: `text-[11px]` or `text-xs`(12px) に引き上げ、または省略表示→タップで詳細

### SVG テキスト（branch-tree-viz / branch-timeline）
- **場所**: 分岐ビルダー — デシジョンツリー & タイムライン
- **現在値**: `fontSize={9}` ～ `fontSize={11}` (SVG 内部)
- **影響**: SVG が viewBox でスケールされるため、375px 幅では実質 3-4px になる
- **検出方法**: コード静的分析（SVG テキストは DOM チェックでは捕捉不可）
- **修正案**: テキストサイズを viewBox 比率に合わせて大きくする、またはモバイルでは簡略表示

### text-[10px] の使用箇所（6箇所）
| ファイル | 要素 | 重要度 |
|---------|------|--------|
| `V2ComparisonView.tsx:288` | シナリオ出所ラベル+日付 | MEDIUM |
| `branch-node.tsx:83` | 教育費自動計算の注釈 | LOW |
| `inline-variable.tsx:92` | 変数ラベル | MEDIUM |
| `event-picker-dialog.tsx:128` | 「追加済み」バッジ | LOW |
| `worldline-preview.tsx:88` | 「スコア」ラベル | LOW |
| `sidebar.tsx:120` | ナビバッジ | LOW（モバイルでは非表示） |

---

## CRITICAL — タッチターゲット（< 44px）

### チェックボックス（16x16px） — 分岐ビルダー
- **場所**: `app/branch` — 各分岐の選択チェックボックス
- **検出数**: iPhone SE で 6個、iPhone 14 で 6個
- **現在値**: 16x16px（Radix Checkbox のデフォルト）
- **修正案**: ラッパーに `min-h-[44px] min-w-[44px]` を追加、またはラベル全体をクリッカブルに

### 確実性トグルバッジ（32x19 / 42x19px） — 分岐ビルダー
- **場所**: `branch-node.tsx` — 「計画」「不確定」トグル
- **検出数**: 3-4個
- **修正案**: `min-h-[44px]` padding を追加

### テンプレートボタン（295x38px） — ダッシュボード
- **場所**: ConclusionSummaryCard — 「購入する vs 賃貸を続ける」等
- **現在値**: 高さ 38px（44px に 6px 不足）
- **修正案**: `py-2` → `py-2.5` で 44px 確保

### 共有ボタン（66x32px） — ダッシュボード
- **場所**: 結果エリア上部
- **修正案**: `h-9` → `h-11`(44px)

### Switch トグル（32x18px） — ダッシュボード
- **場所**: 楽観シナリオ表示切替
- **現在値**: Radix Switch のデフォルト
- **修正案**: ラベル全体をタップターゲットにする

### テキストリンク — 複数箇所
| リンク | サイズ | 場所 |
|--------|--------|------|
| 「分岐ビルダーを使う」 | 147x20 | ダッシュボード |
| 「詳しく見る」 | 90x20 | スコア詳細 |
| 「ベンチマーク」 | 243x20 | スコア詳細 |
| 「分岐ビルダーへ」 | 116x20 | 次のステップ |
| 「ダッシュボードに戻る」 | 136x16 | プロファイル |
- **修正案**: テキストリンクに `py-3` padding を追加して 44px 確保

### 「世界線を生成する」ボタン（343x36 / 358x36px）
- **場所**: 分岐ビルダー下部
- **修正案**: `h-9` → `h-11` で 44px 確保

---

## MEDIUM — レイアウト

### ConclusionSummaryCard サブメトリクス（grid-cols-3 固定）
- **場所**: `conclusion-summary-card.tsx:252`
- **影響**: 375px で 3カラム + gap-4 はタイト。320px 端末では潰れる
- **修正案**: `grid-cols-1 sm:grid-cols-3`

### ExitReadinessCard スコアグリッド（grid-cols-2 固定）
- **場所**: `exit-readiness-card.tsx:102`
- **影響**: 320px で gap-4 が圧迫
- **修正案**: `gap-2 sm:gap-4`

### V2ComparisonView テーブル列幅
- **場所**: `V2ComparisonView.tsx:256`
- **影響**: `w-40`(160px) + `min-w-32`(128px) × N 列は 375px に収まらない
- **対策済み**: `overflow-x-auto` + スクロールヒント「← 横スクロールできます」
- **改善案**: モバイルではカード型レイアウトに切り替え（将来）

### HoverCard 幅（w-72 = 288px）
- **場所**: `MoneyMarginCard.tsx:125`
- **影響**: 320px 端末で画面の 90% を占める
- **修正案**: `w-72 max-w-[calc(100vw-2rem)]`

---

## LOW — その他

### Recharts ツールチップ（w-[180px]）
- max-w-[90vw] があるので実害なし

### Toast 表示位置
- `md:max-w-[420px]` で制限済み、問題なし

### Bottom Nav safe-area-inset
- `env(safe-area-inset-bottom)` で対応済み

---

## レスポンシブ戦略の現状

| 区分 | 実装 |
|------|------|
| ブレークポイント | `sm:` (640px) / `md:` (768px) の2段階 |
| デスクトップ | 固定サイドバー 256px + main |
| モバイル | BottomNav + MobileHeader、サイドバー非表示 |
| JS によるレスポンシブ | なし（CSS only） |
| overflow 対策 | `html,body { overflow-x: hidden }` + テーブル `overflow-x-auto` |
| チャート | Recharts ResponsiveContainer 使用 |
| SVG | viewBox ベース（テキストは固定サイズ） |

---

## Playwright テスト構成

```
e2e/
  helpers.ts              — skipOnboarding, waitForSimulation, gotoApp
  screenshots.spec.ts     — 4ページ × 3デバイス = 12スクリーンショット
  mobile-quality.spec.ts  — フォント/タッチ/オーバーフロー × 4ページ × 2デバイス = 24チェック
```

npm scripts:
| コマンド | 用途 |
|---------|------|
| `pnpm test:e2e` | 全 Playwright テスト |
| `pnpm test:e2e:mobile` | モバイルのみ |
| `pnpm test:screenshots` | スクリーンショット撮影のみ |
| `pnpm test:mobile-quality` | モバイル品質チェックのみ |

---

## 修正優先度まとめ

### P0（即座に修正） — 完了 `5767a2d`
1. ~~Recharts イベントラベル 9px → 12px + 省略6文字~~ **Done**
2. ~~チェックボックス 16px → 親 `<label>` が 44px 確保済みを確認~~ **Done**（Checkbox 自体は 16px だが親ラベルのタップ領域で対応）
3. ~~テンプレートボタン 38px → min-h-[44px]~~ **Done**
4. ~~確実性トグルバッジ → min-h-[44px] px-3~~ **Done**
5. ~~共有ボタン・世界線生成ボタン → min-h-[44px]~~ **Done**
6. ~~テキストリンク 6箇所 → min-h-[44px]~~ **Done**
7. ~~ConclusionSummaryCard サブメトリクス grid-cols-1 sm:grid-cols-3~~ **Done**
8. ~~Switch ラベル全体を 44px タッチターゲットに~~ **Done**
9. ~~HoverCard 2箇所 max-w-[calc(100vw-2rem)]~~ **Done**

Playwright 違反数: タッチ 32→18（-14）、フォント 4→0

### P1（次スプリント） — 未着手
1. SVG テキストのモバイル最適化（branch-tree-viz / branch-timeline の fontSize 9-11）
2. Radix Switch 自体のサイズ拡大（現在 32x18px、ラベルで対応済みだが視覚的に小さい）
3. Profile ページの残存ボタン（38x32px、ScoreWidget 内リセットボタンの可能性）

### P2（継続改善） — 未着手
4. V2 比較テーブルのモバイルカード化
5. text-[10px] の段階的引き上げ（6箇所）
6. Radix Checkbox の視覚サイズ拡大（16px → 20px 等、タップ領域は確保済み）
