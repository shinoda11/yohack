# CLAUDE.md

## プロジェクト概要
YOHACK — 住宅購入の意思決定を「世界線比較」で支援するシミュレーター。
モンテカルロシミュレーション（1,000回、100歳まで）で住宅・キャリア・家族の選択肢を並走比較する。
物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保する設計。

対象: 世帯年収 1,000〜3,000万円の DINKs / プレDINKs、都市部在住、28〜42歳。
収益: Pass ¥29,800/90日。運営者 = 開発者 = 1人。

## 技術スタック
- Next.js 16 + React 19 + TypeScript 5.9
- Zustand 5（状態管理）、Recharts（グラフ）
- shadcn/ui + Tailwind CSS 4.1（UI）
- Vercel（デプロイ、GitHub main ブランチ連携）
- テスト: vitest 252本（`lib/__tests__/` に6ファイル）
- 結果共有: html-to-image → Web Share API / ダウンロード
- **未導入（Phase 2-3）**: Supabase, Stripe, SendGrid → `docs/constraints.md` 参照

## コマンド
| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー |
| `pnpm build` | ビルド |
| `pnpm lint` | ESLint |
| `pnpm test` | vitest実行（252本） |
| `pnpm test:watch` | vitestウォッチ |
| `pnpm run case-sim` | ケース台帳シミュレーション（C01-C24） |
| `npm run check:store` | SoTガードレールチェック |

---

## ルーティング構造

### リクエストの流れ
```
ブラウザ → Vercel → proxy.ts（/app/* のみBasic認証）→ Next.js ルーター
```

### 公開ページ（認証なし）
| パス | 実体ファイル | 用途 |
|------|-------------|------|
| `/` | `app/page.tsx` | `redirect('/lp')` するだけ |
| `/lp` | `app/(marketing)/lp/page.tsx` | LP（Route Group `(marketing)` でURLは `/lp`） |
| `/fit` | `app/fit/page.tsx` | FitGate（12問 → メアド → 判定） |
| `/fit/result` | `app/fit/result/page.tsx` | FitGate 判定結果 |
| `/fit/prep` | `app/fit/prep/page.tsx` | Prep Mode 案内 |
| `/pricing` | `app/pricing/page.tsx` | 料金 |
| `/legal/*` | `app/legal/*/page.tsx` | 利用規約・プライバシー・特商法 |

### プロダクト（Basic認証 `/app/*`）
| パス | 実体ファイル | 用途 |
|------|-------------|------|
| `/app` | `app/app/page.tsx`（750行） | メインダッシュボード |
| `/app/branch` | `app/app/branch/page.tsx` | 分岐ビルダー |
| `/app/profile` | `app/app/profile/page.tsx` | プロファイル入力 |
| `/app/worldline` | `app/app/worldline/page.tsx` | 世界線比較（3タブ） |
| `/app/settings` | `app/app/settings/page.tsx` | 設定 |

共通レイアウト: `app/app/layout.tsx`（Sidebar + MobileHeader + BottomNav）

### リダイレクト
| パス | → |
|------|---|
| `/app/v2` | `/app/worldline` |
| `/app/plan` | `/app/branch` |
| `/rsu` | `/app/profile` |
| `/timeline` | `/app/branch` |

---

## ディレクトリ構造
```
app/
  page.tsx                   ← / → redirect('/lp')
  layout.tsx                 ← ルートレイアウト
  not-found.tsx              ← 404
  globals.css                ← CSS変数・デザイントークン
  (marketing)/lp/            ← LP（Route Group）
  fit/                       ← FitGate（layout.tsx + page.tsx + result/ + prep/）
  app/                       ← プロダクト（Basic認証配下）
    page.tsx                   ← ダッシュボード（750行、最大のファイル）
    layout.tsx                 ← 共通レイアウト（Sidebar + MobileHeader + BottomNav）
    branch/page.tsx            ← 分岐ビルダー
    profile/page.tsx           ← プロファイル入力
    worldline/page.tsx         ← 世界線比較
    settings/page.tsx          ← 設定
  pricing/page.tsx             ← 料金
  legal/                       ← 利用規約・プライバシー・特商法

components/
  dashboard/    ← 20ファイル（入力カード6 + 結果カード8 + オンボーディング3 + その他3）
  branch/       ← 8ファイル（ツリー可視化、タイムライン、カテゴリ、イベントダイアログ等）
  v2/           ← 3ファイル（V2ResultSection, V2ComparisonView, MoneyMarginCard）
  layout/       ← 5ファイル（sidebar, bottom-nav, mobile-header, brand-story-dialog, yohack-symbol）
  ui/           ← 24ファイル（shadcn/ui）

lib/
  store.ts           ← Zustand SoT（profile, simResult, scenarios, branches）
  engine.ts          ← モンテカルロシミュレーション
  calc-core.ts       ← engine/housing-sim 共通計算ロジック（税金・年金・収支10関数）
  housing-sim.ts     ← 住宅シミュレーション（賃貸/購入/住み替え）
  branch.ts          ← 分岐ビルダーロジック
  event-catalog.ts   ← ライフイベントプリセット23種 + バンドル3種
  types.ts           ← 型定義
  fitgate.ts         ← FitGate判定 + Profile変換
  utils.ts           ← ユーティリティ + CHART_COLORS
  benchmarks.ts      ← ケース台帳C01-C24データ
  glossary.ts        ← 用語ツールチップ定義
  plan.ts            ← Pro判定
  worldline-templates.ts ← 世界線テンプレート
  v2/                ← 5ファイル（adapter, margin, store, worldline, readinessConfig）
  __tests__/         ← 6テストファイル（252テスト）

hooks/               ← 9ファイル
  useSimulation.ts     ← メインシミュレーション実行
  useMargin.ts         ← 余白計算
  useStrategy.ts       ← 戦略レコメンド
  useScoreAnimation.ts ← スコアアニメーション
  useValidation.ts     ← バリデーション
  useHousingScenarios.ts, usePlan.ts, useProfileCompleteness.ts, use-toast.ts

scripts/
  run-backlog.sh          ← バックログ自動消化ランナー（Telegram通知付き）
  case-catalog-sim.ts     ← ケース台帳シミュレーション
  sensitivity-analysis.ts ← 感度分析
  check-store-sot.js      ← SoTガードレールチェック
  backlog-runner.mjs      ← バックログランナー（Node版）

docs/
  product-backlog.md   ← バックログ唯一のSoT（タスク管理の起点）
  constraints.md       ← 制約定義（Phase1で禁止する技術・実行ルール。バックログ実行前に必読）
  roadmap.md           ← Phase2-3ロードマップ（Stripe/Supabase/SendGrid）
  CHANGELOG.md         ← 変更ログ
  case-catalog-results.md ← 24ケースの賃貸vs購入比較結果
  ds-audit/            ← デザインスプリント監査（DS-X-before/design/after の3フェーズ記録）
  fitgate-reference/   ← 旧リポから抽出した移植対象コード（参照用）
  archive/             ← 完了済み設計書・過去の監査結果
```

---

## ダッシュボードレイアウト骨格 (`app/app/page.tsx` — 750行)

### 全体構造
```
L349  <header> sticky ヘッダー「ダッシュボード」
L362  <main>
L364    OnboardingSteps             ← 初回訪問ガイド
L367    ProfileCompleteness         ← 入力完了度
L370    世界線ガイダンスバナー        ← scenarios === 0 のとき
L389    初回訪問バナー               ← サンプルデータ表示中の案内
L411    ConclusionSummaryCard       ← ヒーロー（スコア + 次の一手）※常時表示
L430    モバイル: 入力/結果 タブバー   ← md未満のみ
L457    <grid lg:grid-cols-[1fr_2fr]>
          左カラム（入力）  L459-L513
          右カラム（結果）  L516-L738
L743  WelcomeDialog               ← 初回ウェルカムダイアログ
```

### 左カラム: 入力カード（L459-L513）
| # | 行 | コンポーネント | 説明 |
|---|-----|---------------|------|
| 1 | L461 | ProfileSummaryCard | 前提表示（読み取り専用）。「編集 →」で `/app/profile` |
| 2 | L464 | IncomeCard | 本人年収・パートナー年収・副業収入 |
| 3 | L474 | RetirementCard | リタイア年齢・退職後事業収入 |
| 4 | L483 | ExpenseCard | 生活費（`hideHousing`で家賃非表示） |
| 5 | L494 | InvestmentCard | 期待リターン・インフレ率 |
| 6 | L506 | HousingPlanCard | 賃貸 vs 購入プラン比較 |

### 右カラム: 結果カード（L516-L738）

**モバイル（L518-L575）** — フラットリスト:
ExitReadinessCard → KeyMetricsCard → AssetProjectionChart → NextBestActionsCard → CashFlowCard → MonteCarloSimulatorTab → ScenarioComparisonCard

**デスクトップ（L578-L737）** — 3タブ:
- サマリー: ExitReadinessCard → KeyMetricsCard → AssetProjectionChart → NextBestActionsCard → CashFlowCard
- 確率分布: MonteCarloSimulatorTab
- 世界線: ScenarioComparisonCard + ExitReadinessCard + KeyMetricsCard

---

## アーキテクチャ原則

### Single Source of Truth (SoT)
- `lib/store.ts` がアプリ全体の状態管理の唯一の場所
  - `profile`: ユーザー入力データ
  - `simResult`: シミュレーション計算結果
  - `scenarios`: 保存されたシナリオ
  - `selectedBranchIds`: 分岐ビルダーの選択状態
  - `customBranches`: ユーザー追加の分岐
  - `hiddenDefaultBranchIds`: 非表示デフォルトブランチ
- `lib/v2/store.ts` は世界線比較の UI 状態専用。唯一の許可された例外
- **第三のストアを絶対に作らない**
- 各ページ/コンポーネントは `useProfileStore()` から参照のみ。独自に `runSimulation` を呼び出さない
- 違反チェック: `npm run check:store`

### calc-core 共通化
- `lib/calc-core.ts` が engine.ts と housing-sim.ts の共通計算ロジックを一元管理
- engine.ts は calc-core を import して re-export（後方互換）
- パリティテスト（`calc-parity.test.ts`、61件）で整合性を自動検証

### ダッシュボード ↔ 分岐ビルダーのデータフロー
- ダッシュボードは `profile.lifeEvents` を**表示のみ**（直接編集UIなし）
- 分岐ビルダーは `buildProfileForCandidate()` で profile を**コピー+マージ**して一時プロファイルを作成
  - 既存 `profile.lifeEvents` + ブランチ由来イベントをマージ → `runSimulation()`
  - 元の profile は変更しない
- `addScenarioBatch()` で SavedScenario として保存（古い branch- シナリオは自動削除）
- **`loadScenario()` は破壊的操作**: シナリオをロードすると現在の profile が完全に上書きされる
- **シナリオは生成時のスナップショット**: 生成後に profile を変更しても保存済みシナリオには反映されない
- **エンジンが無視するイベント型**: `child_birth`, `education`, `asset_purchase`, `retirement_partial`（分岐ビルダーは `expense_increase` 等に変換して回避）

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存
- シミュレーションは profile 変更時に自動で debounce（150ms）実行

---

## コーディング規約
- UIコンポーネントは shadcn/ui を使用
- スタイリングは Tailwind CSS
- 金額の単位は万円（`formatCurrency()` で億円表示に自動変換）
- UI は日本語
- コンポーネントファイルは `'use client'` ディレクティブ必須
- 金融アドバイスではない旨の免責を、計算結果を表示するすべての画面に記載
- モバイルファースト（タッチターゲット 44px 以上）

### カラー
- ブランド: Night #1A1916 / Linen #F0ECE4 / Gold #C8B89A / Stone #5A5550 / Canvas #FAF9F7 / Bronze #8A7A62
- スコア状態: `text-safe`/`bg-safe`（良好）、`text-danger`/`bg-danger`（危険）
- UI状態: `success`/`destructive`（shadcn/ui標準）
- **混在禁止**: スコア表示に `success` を使わない、UI状態に `safe` を使わない
- チャート: `CHART_COLORS`（`lib/utils.ts`）を使用

### スペーシング
- カード間: space-y-4 or gap-4
- カード内（フォーム要素間）: space-y-6
- カード内（情報表示要素間）: space-y-4

---

## 重要な注意点

### 絶対にやらないこと
- Phase1 で Supabase / Stripe / SendGrid を導入しない（`docs/constraints.md`）
- 新規 npm パッケージの導入は事前承認が必要
- 物件紹介・保険紹介・投資商品紹介の機能を入れない
- アフィリエイトリンク・広告を入れない
- 「買うべき/買わないべき」の結論を提示しない（比較の土台を返すだけ）

### バックログ実行ルール
- `docs/product-backlog.md` がタスク管理の唯一のSoT
- 実行前に `docs/constraints.md` を必ず読む
- 変更してよいファイルはタスクに明示されたもののみ
- 環境変数が必要な実装はしない
- 既存のテストが252件passしていることを確認してからコミット

### デザインスプリント（DS）ワークフロー
1. **調査** → `docs/ds-audit/DS-X-before.md` に現状記録
2. **設計** → `docs/ds-audit/DS-X-design.md` に変更差分を定義
3. **実行** → 設計書の差分のみを適用
4. **検査** → `docs/ds-audit/DS-X-after.md` に結果記録、before/after比較で承認

### エンジン仕様の要点
- スコア重み: survival 55% / lifestyle 20% / risk 15% / liquidity 10%
- 税金・年金は自動計算（累進課税7段階 + 報酬比例年金）
- 感度分析結論: `investReturn` のみ有意（±31スコア）、他は ≤4
- デフォルト: 35歳/solo/年収1,200万/資産2,500万/家賃月15万/リターン5%/インフレ2%
