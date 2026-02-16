# YOHACK - アーキテクチャガイド

## 状態管理の原則

### Single Source of Truth (SoT)

このアプリケーションでは、状態管理を **`lib/store.ts`** に統一しています。

```
lib/
  store.ts      <- 唯一のZustandストア（SoT）
  engine.ts     <- シミュレーション計算ロジック
  housing-sim.ts <- 住宅シミュレーション（CRN比較）
  types.ts      <- 型定義
```

**例外**: `lib/v2/store.ts` は世界線比較の UI 状態専用ストア。計算結果は持たず、表示切替・選択状態のみを管理する。SoT ルールの唯一の許可された例外。

### ルール

1. **保存・計算結果は useProfileStore にのみ存在する**
   - `profile`: ユーザー入力データ
   - `simResult`: シミュレーション計算結果
   - `scenarios`: 保存されたシナリオ

2. **第二のストアを作成しない**
   - `lib/v2/store.ts` 以外の場所にストアを作らない
   - 新しい状態が必要な場合は `lib/store.ts` を拡張する

3. **各ページ/コンポーネントは参照のみ**
   - `useProfileStore()` から必要な値を取得
   - 独自に `runSimulation` を呼び出さない（結果は `simResult` を参照）

### チェック方法

```bash
npm run check:store
```

このスクリプトは以下をチェックします:
- 禁止パス（`app/`, `components/`等）にストアファイルがないか
- `lib/store.ts` 以外で `zustand` の `create()` が使われていないか

### なぜ統一が重要か

- **データの不整合を防ぐ**: 複数のストアがあると、同じデータが異なる値を持つ可能性がある
- **デバッグの簡素化**: 状態の流れが1箇所に集約されている
- **メンテナンス性**: 新機能追加時に影響範囲が明確

## ディレクトリ構成

```
app/
  page.tsx          <- シミュレーション（プロファイル入力 + 結果表示）
  plan/page.tsx     <- ライフプラン（ライフイベント + RSU タブ切替）
  v2/page.tsx       <- 世界線比較
  settings/         <- 設定（データ管理・バージョン情報）
  legal/            <- 利用規約・プライバシーポリシー・特商法

components/
  dashboard/        <- ダッシュボード用コンポーネント
  plan/             <- ライフプラン用（timeline-content, rsu-content）
  v2/               <- 世界線比較用コンポーネント
  layout/           <- レイアウト（サイドバー等）
  ui/               <- shadcn/ui コンポーネント

lib/
  store.ts          <- 状態管理（SoT）
  engine.ts         <- モンテカルロシミュレーション（1000回、max age 100）
  housing-sim.ts    <- 住宅シミュレーション（500回シード付き、CRN比較）
  types.ts          <- 型定義
  v2/               <- 世界線比較ロジック（store, adapter, events, margin, strategy）

hooks/
  useSimulation.ts  <- シミュレーション実行フック
  useMargin.ts      <- 余白計算
  useStrategy.ts    <- 戦略計算
  useWorldLines.ts  <- 世界線比較

scripts/
  check-store-sot.js       <- SoTガードレールチェック
  case-catalog-sim.ts      <- ケース台帳 C01-C18 シミュレーション
  sensitivity-analysis.ts  <- 感度分析

docs/
  case-catalog-results.md  <- 18ケースの賃貸vs購入比較結果
  sensitivity-analysis.md  <- 感度分析結果
```
