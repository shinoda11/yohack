# CLAUDE.md

## プロジェクト概要
YOHACK — 人生の余白（お金・時間・体力）で人生の選択を比較するシミュレーター。
モンテカルロシミュレーション（1,000回×100歳）で安心ラインと余白スコアを算出。
住宅購入の意思決定を支援する。物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保。

対象: 世帯年収 1,000〜3,000万円の DINKs / プレDINKs、都市部在住、28〜42歳。
収益: Pass ¥29,800/90日。運営者 = 開発者 = 1人。

## 技術スタック
- Next.js 16 + React 19 + TypeScript 5.9
- Zustand 5（状態管理）
- Recharts 2.15（グラフ）
- shadcn/ui + Tailwind CSS 4（UI）
- Vitest（テスト、現在 252 本 / 6 ファイル）
- Framer Motion（LPアニメーション）
- html-to-image → Web Share API（結果共有）
- Vercel（デプロイ、GitHub main ブランチ連携）
- **未導入（Phase 2 以降）**: Supabase, Stripe, SendGrid → `docs/constraints.md` 参照

## コマンド
- `pnpm dev` — 開発サーバー起動
- `pnpm build` — ビルド
- `pnpm test` — テスト実行（252 本）
- `pnpm lint` — ESLint
- `pnpm run case-sim` — ケース台帳シミュレーション
- `npm run check:store` — SoTガードレールチェック

## ルーティング

### 公開（認証なし）— 9 ページ
| パス | 用途 |
|------|------|
| `/` | → `redirect('/lp')` |
| `/lp` | LP（Route Group `(marketing)`） |
| `/fit` | FitGate（12問 → メアド → 判定） |
| `/fit/result` | FitGate 判定結果 |
| `/fit/prep` | Prep Mode 案内 |
| `/pricing` | 料金 |
| `/rsu` | RSU ヘルパー |
| `/timeline` | タイムライン表示 |
| `/legal/*` | 利用規約・プライバシー・特商法（3ページ） |

### プロダクト（Basic認証 `/app/*`）— 5 ページ
| パス | 用途 |
|------|------|
| `/app` | メインダッシュボード |
| `/app/branch` | 分岐ビルダー |
| `/app/profile` | プロファイル入力 |
| `/app/worldline` | 世界線比較（3タブ: 世界線比較 / 余白 / 戦略） |
| `/app/settings` | 設定 |
| `/app/v2` | → `redirect('/app/worldline')` |

認証: `proxy.ts` で `/app/*` に Basic認証。
共通レイアウト: `app/app/layout.tsx`（Sidebar + MobileHeader + BottomNav）

## ディレクトリ構造

```
app/
  (marketing)/lp/      LP
  app/                  プロダクト共通レイアウト + ページ群
  fit/                  FitGate (fit/, fit/result/, fit/prep/)
  api/prep-register/    Prep登録 API（Phase 2 スタブ）
  legal/                法務ページ群
  rsu/                  RSUヘルパー
  timeline/             タイムラインビュー
  globals.css           グローバルCSS + アニメーション定義

components/
  dashboard/  (21)      ダッシュボード入力・結果カード群
  branch/     (8)       分岐ビルダー UI
  v2/         (3)       世界線比較ビュー（MoneyMarginCard, V2ComparisonView, V2ResultSection）
  layout/     (5)       Sidebar, BottomNav, MobileHeader, BrandStoryDialog, YohackSymbol
  ui/         (24)      shadcn/ui コンポーネント

hooks/        (9)       useSimulation, useScoreAnimation, useValidation, useMargin 等

lib/
  store.ts              Zustand SoT（プロファイル・シナリオ・シミュレーション結果）
  engine.ts             モンテカルロシミュレーション本体（505行）
  calc-core.ts          共通計算ロジック（8関数、375行）
  types.ts              型定義（Profile, SimulationResult, Scenario 等）
  branch.ts             分岐ロジック（688行）
  event-catalog.ts      プリセットイベント（23種 / 5カテゴリ）+ バンドル（3種）
  housing-sim.ts        住宅購入シミュレーション
  worldline-templates.ts 世界線テンプレート
  fitgate.ts            FitGate ロジック
  glossary.ts           用語集
  utils.ts              ユーティリティ（CHART_COLORS, cn, formatCurrency）
  v2/                   世界線比較専用（adapter, margin, store, worldline, readinessConfig）
  __tests__/  (6)       テストファイル群
```

## アーキテクチャ原則

### Single Source of Truth (SoT)
- `lib/store.ts` がアプリ全体の状態管理の唯一の場所
- `lib/v2/store.ts` は世界線比較の UI 状態専用（唯一の許可された例外）
- **第三のストアを作らない**
- 違反チェック: `npm run check:store`

### シミュレーション結果キャッシュ
- `profileVersion` カウンター方式（store 内）
- profile が変わった時だけ再計算、それ以外は store の `simResult` を返す
- `profileVersion`/`lastSimVersion` は localStorage に保存しない（リロード時は再計算）
- debounce 150ms で連続入力を吸収

### calc-core 共通化
- `lib/calc-core.ts` が engine.ts と housing-sim.ts の共通計算ロジックを一元管理
- パリティテスト（`calc-parity.test.ts`）で整合性を自動検証
- 8 関数: calculateEffectiveTaxRate, getEstimatedTaxRates, calculateAnnualPension, calculateIncomeAdjustment, calculateRentalIncome, calculateNetIncomeForAge, calculateExpensesForAge, calculateAssetGainForAge

### ダッシュボード ↔ 分岐ビルダーのデータフロー
- ダッシュボードは `profile.lifeEvents` を表示のみ（直接編集 UI なし）
- 分岐ビルダーは `buildProfileForCandidate()` で profile をコピー+マージして一時プロファイルを作成。元の profile は変更しない
- `loadScenario()` は破壊的操作: 現在の profile が完全に上書きされる
- シナリオは生成時のスナップショット: 後から profile を変更しても反映されない
- エンジンが無視するイベント型: `child_birth`, `education`, `asset_purchase`, `retirement_partial`

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存（persist middleware）
- `profileVersion`/`lastSimVersion` は保存しない（揮発、リロード時に再計算）

## エンジン仕様

### engine.ts
- モンテカルロシミュレーション本体（1,000 回、max age 100）
- スコア重み: survival 55% / lifestyle 20% / risk 15% / liquidity 10%
- 税金・年金: 自動計算（累進課税 7 段階 + 報酬比例年金）
- 変動金利: 0.5% + 0.3%/5年、cap 2.3%
- 家賃インフレ: 0.5%/年
- 感度分析: `investReturn` のみ有意（±31 スコア）、他は ≤4
- デフォルト: 35歳 / solo / 年収 1,200万 / 資産 2,500万 / 家賃月 15万 / リターン 5% / インフレ 2%

### housing-sim.ts
- 住宅購入シミュレーション
- calc-core.ts を使用（独自実装ではない）

## 分岐ビルダー

### lib/branch.ts
- `createDefaultBranches()`: プロファイルに応じたデフォルト分岐生成
- `branchToLifeEvents()`: 分岐 → LifeEvent 変換
- `buildProfileForCandidate()`: 候補ごとの一時プロファイル生成

### lib/event-catalog.ts
- 23 種のプリセットイベント（family 8 / career 7 / lifestyle 6 / asset 3 / housing 1）
- 3 種のバンドルプリセット（overseas_with_home, overseas_renter, partner_childcare_package）

### UI 構成（components/branch/）
- event-picker-dialog: イベント選択ダイアログ
- event-customize-dialog: イベントカスタマイズ
- branch-tree-viz: 決定木 SVG（全幅、SVG_W=720）
- branch-timeline: タイムライン表示
- branch-node / branch-category: ノード・カテゴリ表示
- worldline-preview: 世界線プレビュー
- event-icon: Lucide アイコン統一コンポーネント

## ダッシュボード（/app）

### レイアウト: 1カラム（モバイル・デスクトップ共通）
1. **ConclusionSummaryCard**（ヒーロー）: スコアリング + 数字 headline + 世界線テンプレート導線
2. **`<details>` 折りたたみ**（デフォルト閉）: ProfileSummary → Income → Retirement → Expense → Investment → HousingPlan
3. **結果タブ**（3タブ）:
   - サマリー: VariableBar → AssetProjectionChart → CashFlowCard
   - 確率分布: MonteCarloSimulatorTab
   - 世界線: ScenarioComparisonCard + ExitReadinessCard（スコア詳細: sub-scores + breakdown + benchmark）

### ConclusionSummaryCard
- 120px スコアリング（brand-gold 統一色、`useAnimatedValue` 600ms）
- 数字ベース headline（4 分岐パターン: 余白あり / ギリギリ / 超過 / 未到達）
- subMetrics: 生存率、安心ライン到達年齢、100歳時点中央値
- 世界線テンプレート導線（3本未満のとき表示）

## 世界線比較（/app/worldline）
- 3 タブ: 世界線比較（V2ComparisonView）/ 余白（V2ResultSection margins）/ 戦略（V2ResultSection strategy）
- 分岐ビルダーへの導線あり
- lib/v2/store.ts で UI 状態管理

## コーディング規約
- UI: shadcn/ui + Tailwind CSS
- 金額: 万円単位（`formatCurrency()` で億円表示に自動変換）
- 言語: 日本語
- `'use client'` ディレクティブ必須
- 免責表示: 計算結果を表示するすべての画面に記載
- モバイルファースト（タッチターゲット 44px 以上）

### カラーパレット
- Night: `hsl(var(--night))` / #1A1916
- Gold: `hsl(var(--brand-gold))` / #C8B89A
- Linen: #F0ECE4（微細な区切り）
- Stone: #5A5550（テキスト）
- Bronze: #8A7A62（アクセント）
- Canvas: #FAF9F7（背景）
- スコア状態: `--safe` = Gold (#C8B89A)、`--danger` = Bronze (#8A7A62)。赤緑は排除済み
- UI 状態: `success`/`destructive`（shadcn/ui 標準、ui/ コンポーネント内のみ許可）
- チャート: `CHART_COLORS`（`lib/utils.ts`）
- **禁止色**: red-*/emerald-*/amber-*/green-* 等の生 Tailwind カラー。#CC3333, #4A7C59 等のハードコード
- 削除ボタン: `hover:text-brand-stone`（赤の destructive は ui/ コンポーネント内のみ）

### タイポグラフィ
- 数値表示（金額・スコア・パーセント）は `tabular-nums` を必ず付与
- フォント階層: ヒーロー数値 `text-2xl sm:text-3xl font-bold` / カード内指標 `text-lg font-bold` / 本文 `text-sm` / 注釈 `text-xs`
- SVG 内テキスト: `font-variant-numeric` は効かないため、ブラウザ default で許容

### スペーシング
- カード間: `space-y-4` or `gap-4`
- カード内フォーム要素間: `space-y-6`
- カード内情報表示要素間: `space-y-4`
- カード角丸: `rounded-xl`（Card コンポーネントに統一済み）
- カードシャドウ: `shadow-sm`（Card コンポーネントに統一済み）

### マイクロインタラクション
- カードホバー: `transition-colors duration-150 hover:border-brand-gold/30`（Card コンポーネントに組込み済み）
- `<details>` 開閉: CSS `details-show` アニメーション（globals.css）
- タブ切替: `.animate-fade-in`（150ms ease-out）
- スコアリング: ring + animatedScore は `useAnimatedValue` で 600ms ease-out

## デザイン原則

### 決断の静けさ（Design Philosophy）
YOHACK は ¥29,800 のプレミアムプロダクト。Apple/Porsche/Aesop 水準の静謐さを目指す。

- **数字で語る、形容詞で語らない**: 「目標に近づいています」→「52歳で安心ライン到達。目標より3年の余白。」
- **FP アドバイスは出さない**: 「iDeCo 拠出を最大化」「貯蓄率を上げましょう」等の助言は禁止。LP 宣言「答えを出さない、土台を返す」と整合
- **絵文字禁止**: アイコンは Lucide（`components/branch/event-icon.tsx` の EventIcon）で統一
- **カラーはトークンのみ**: emerald-600, amber-600, red-700 等の直値禁止
- **警告表現は最小限**: 赤背景+赤ボーダー+AlertTriangle の三重表現を禁止。数値が低い場合は `brand-bronze` で静かに伝える
- **SectionCard の description は非表示**: カードヘッダーはアイコン+タイトルのみ
- **Variable Bar**: チャート直上にドラッグ可能な数字（年収・生活費・目標年齢）を配置。3つを超えない
- **固定 vs 変数**: 年齢・資産残高等の「事実」は `<details>` 内。年収・生活費・目標年齢等の「問い」は VariableBar で即座に操作
- **チャート Y軸は中央値基準**: p75/p90 の複利膨張に引っ張られない

### 確定済みレイアウト
- ダッシュボードは1カラム。入力カードは `<details>` で折りたたみ（デフォルト閉）
- ConclusionSummaryCard がヒーロー（スコアリング + 数字結論 + 世界線テンプレート）
- NextBestActionsCard は削除済み（ブランドボイス違反のため）。復活させない
- mobileTab による入力/結果切り替えは廃止済み。モバイルもデスクトップも同じ1カラム
- 資産推移チャートの高さは `h-[400px] sm:h-[520px]`
- 分岐ビルダー（/branch）はツリー全幅 → イベント一覧の1カラム構成

## 禁止事項
- Phase 1 で Supabase / Stripe / SendGrid を導入しない（`docs/constraints.md`）
- 新規 npm パッケージの導入は事前承認が必要
- 物件紹介・保険紹介・投資商品紹介の機能を入れない
- 「買うべき/買わないべき」の結論を提示しない
- 新しい Zustand ストアの追加（既存ストアを拡張すること）

## バックログ実行ルール
- `docs/product-backlog.md` がタスク管理の唯一の SoT
- 実行前に `docs/constraints.md` を必ず読む
- 変更してよいファイルはタスクに明示されたもののみ
- 既存テストが全件 pass していることを確認してからコミット

## デザインスプリント（DS）ワークフロー
1. 調査 → `docs/ds-audit/DS-X-before.md`
2. 設計 → `docs/ds-audit/DS-X-design.md`
3. 実行 → 設計書の差分のみ適用
4. 検査 → `docs/ds-audit/DS-X-after.md`
