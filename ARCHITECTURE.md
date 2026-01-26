# Exit Readiness OS - アーキテクチャガイド

## 状態管理の原則

### Single Source of Truth (SoT)

このアプリケーションでは、状態管理を **`lib/store.ts`** に統一しています。

\`\`\`
lib/
  store.ts      <- 唯一のZustandストア（SoT）
  engine.ts     <- シミュレーション計算ロジック
  types.ts      <- 型定義
\`\`\`

### ルール

1. **保存・計算結果は useProfileStore にのみ存在する**
   - `profile`: ユーザー入力データ
   - `simResult`: シミュレーション計算結果
   - `scenarios`: 保存されたシナリオ

2. **第二のストアを作成しない**
   - `app/v2/store.ts` のような場所にストアを作らない
   - 新しい状態が必要な場合は `lib/store.ts` を拡張する

3. **各ページ/コンポーネントは参照のみ**
   - `useProfileStore()` から必要な値を取得
   - 独自に `runSimulation` を呼び出さない（結果は `simResult` を参照）

### チェック方法

\`\`\`bash
npm run check:store
\`\`\`

このスクリプトは以下をチェックします:
- 禁止パス（`app/`, `components/`等）にストアファイルがないか
- `lib/store.ts` 以外で `zustand` の `create()` が使われていないか

### なぜ統一が重要か

- **データの不整合を防ぐ**: 複数のストアがあると、同じデータが異なる値を持つ可能性がある
- **デバッグの簡素化**: 状態の流れが1箇所に集約されている
- **メンテナンス性**: 新機能追加時に影響範囲が明確

## ディレクトリ構成

\`\`\`
app/
  page.tsx          <- プロファイル入力（メインページ）
  dashboard/        <- ダッシュボード（シミュレーション結果表示）
  timeline/         <- ライフイベント管理
  rsu/              <- RSU管理
  v2/               <- 世界線比較

components/
  dashboard/        <- ダッシュボード用コンポーネント
  layout/           <- レイアウト（サイドバー等）
  ui/               <- shadcn/ui コンポーネント

lib/
  store.ts          <- 状態管理（SoT）
  engine.ts         <- シミュレーションエンジン
  types.ts          <- 型定義
  utils.ts          <- ユーティリティ

scripts/
  check-store-sot.js <- SoTガードレールチェック
\`\`\`
