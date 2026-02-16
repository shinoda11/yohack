# CLAUDE.md

## プロジェクト概要
YOHACK（旧 Exit Readiness OS）- 人生の余白（お金・時間・体力）で人生の選択を比較するシミュレーター。
FIRE達成可能性をモンテカルロシミュレーションで計算し、住宅・キャリア・家族の意思決定を支援する。

## 技術スタック
- Next.js 16 + React 19 + TypeScript
- Zustand（状態管理）
- Recharts（グラフ）
- shadcn/ui + Tailwind CSS（UI）
- Vercel（デプロイ、GitHub main ブランチ連携）

## アーキテクチャ原則

### Single Source of Truth (SoT)
- `lib/store.ts` がアプリ全体の状態管理の唯一の場所
- `lib/v2/store.ts` は世界線比較の UI 状態専用（計算結果は持たない）
- 第三のストアを絶対に作らない
- 新しい状態が必要な場合は既存ストアを拡張する
- 違反チェック: `npm run check:store`

### エンジン前提
- **スコアウェイト**: survival 55%, lifestyle 20%, risk 15%, liquidity 10%
- **住宅ローン**: 変動金利 0.5% → +0.3%/5年、上限 2.3%
- **家賃インフレ**: 0.5%（一般インフレ 2% とは分離、`rentInflationRate`）
- **維持費上昇**: 1.5%/年（`ownerCostEscalation`）
- **年金**: 報酬比例方式（基礎年金 80万×加入年数/40 + 標準報酬月額×5.481/1000×加入月数、月額上限 65万）
- **投資リターン**: デフォルト 5%、UI で 3%/5%/7% のプリセット選択可
- **ライフイベント（LifeEvent）**:
  - 9タイプ: `income_increase`, `income_decrease`, `expense_increase`, `expense_decrease`, `asset_purchase`, `child_birth`, `education`, `retirement_partial`, `rental_income`
  - `target?: 'self' | 'partner'` — coupleモードでパートナーの収入変動に対応（未指定='self'）
  - `bundleId?: string` — 複合イベント（バンドルプリセット）のグルーピング用
  - `rental_income` は退職前・退職後問わず世帯収入に加算（`calculateIncomeAdjustment` とは別枠）

### ディレクトリ構造
```
app/
  page.tsx          ← シミュレーション（プロファイル入力 + 結果表示）
  plan/page.tsx     ← ライフプラン（ライフイベント + RSU タブ切替）
  v2/page.tsx       ← 世界線比較（157行、分割済み・10コンポーネント）
  settings/         ← 設定（データ管理・バージョン情報）
  legal/            ← 利用規約・プライバシーポリシー・特商法
  timeline/         ← /plan へリダイレクト
  rsu/              ← /plan?tab=rsu へリダイレクト

middleware.ts       ← Basic認証（SITE_PASSWORD）

components/
  dashboard/        ← ダッシュボード用（22コンポーネント）
  plan/             ← ライフプラン用（timeline-content, rsu-content）
  v2/               ← 世界線比較用（10コンポーネント）
  layout/sidebar.tsx ← サイドバーナビゲーション
  ui/               ← shadcn/ui コンポーネント

lib/
  store.ts          ← Zustand SoT（profile, simResult, scenarios）
  engine.ts         ← モンテカルロシミュレーション（1000回、max age 100）
  housing-sim.ts    ← 住宅シミュレーション（500回シード付き、CRN比較）
  types.ts          ← 型定義

hooks/
  useSimulation.ts  ← シミュレーション実行フック
  useMargin.ts      ← 余白計算
  useStrategy.ts    ← 戦略計算
  useWorldLines.ts  ← 世界線比較

scripts/
  case-catalog-sim.ts      ← ケース台帳 C01-C18 のシミュレーション実行
  sensitivity-analysis.ts  ← 感度分析（4ケース×4パラメータ×3水準）

docs/
  case-catalog-results.md  ← 18ケースの賃貸vs購入比較結果
  sensitivity-analysis.md  ← 感度分析結果（影響度ランキング）
```

## コマンド
- `pnpm dev` — 開発サーバー起動
- `pnpm build` — ビルド
- `pnpm test` — テスト実行（vitest 120本）
- `pnpm test:watch` — テストウォッチモード
- `pnpm case-sim` — ケース台帳シミュレーション実行（C01-C18）
- `npm run check:store` — SoT ガードレールチェック
- `pnpm lint` — ESLint

## コーディング規約
- UIコンポーネントは shadcn/ui を使用
- スタイリングは Tailwind CSS
- 金額の単位は万円（`formatCurrency()` で億円表示に自動変換）
- UI は日本語
- カラーパレットは落ち着いたグレートーン（`globals.css` の CSS 変数参照）
- コンポーネントファイルは `'use client'` ディレクティブ必須

## テスト
- `lib/__tests__/` に4件（adapter, engine, e2e-personas, housing-sim）。vitest 使用
- 120本（e2e ペルソナ検証 26本含む）
- `pnpm test` — テスト実行

## 重要な注意点
- Pro/Free レイヤー（`lib/plan.ts`）は現在 `isPro()=true` で全機能開放中。Phase 2 で Supabase 認証に置き換え予定
- localStorage でプロファイルとシナリオを永続化している
- シミュレーションは profile 変更時に自動で debounce 実行される
- **投資リターンがスコアに最も影響（±31）**。他のパラメータ（金利上限・家賃上昇率・維持費上昇率）は±4以下
- エンジンの前提を変更したら必ず `pnpm case-sim` で18ケースを再検証すること
