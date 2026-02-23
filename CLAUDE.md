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
- Vitest（ユニットテスト 252本 / 6ファイル）+ Playwright（E2E）
- Framer Motion（LPアニメーション）
- html-to-image → Web Share API（結果共有）
- Vercel（デプロイ、GitHub main ブランチ連携）
- **未導入（Phase 2 以降）**: Supabase, Stripe, SendGrid → `docs/constraints.md` 参照

## コマンド
- `pnpm dev` — 開発サーバー起動
- `pnpm build` — ビルド
- `pnpm test` — ユニットテスト（vitest 252本）
- `pnpm lint` — ESLint
- `pnpm test:e2e` — Playwright 全テスト
- `pnpm test:mobile-quality` — モバイル品質チェック（フォント/タッチ/オーバーフロー）
- `pnpm test:screenshots` — スクリーンショット生成（3デバイス × 4ページ）
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
| `/app` | メインダッシュボード（3層構造） |
| `/app/branch` | 分岐ビルダー |
| `/app/profile` | プロファイル入力 |
| `/app/worldline` | 世界線比較（3タブ: 世界線比較 / 余白 / 変数） |
| `/app/settings` | 設定 |

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
  dashboard/  (23)      ダッシュボード入力・結果カード群
  branch/     (8)       分岐ビルダー UI
  v2/         (3)       世界線比較ビュー（MoneyMarginCard, V2ComparisonView, V2ResultSection）
  layout/     (5)       Sidebar, BottomNav, MobileHeader, BrandStoryDialog, YohackSymbol
  ui/         (24)      shadcn/ui コンポーネント

hooks/        (7)       useSimulation, useScoreAnimation, useValidation, useMargin, useStrategy, useProfileCompleteness, use-toast

lib/
  store.ts              Zustand SoT（プロファイル・シナリオ・シミュレーション結果）
  engine.ts             モンテカルロシミュレーション本体
  calc-core.ts          共通計算ロジック（8関数）
  types.ts              型定義（Profile, SimulationResult, Scenario 等）
  branch.ts             分岐ロジック
  event-catalog.ts      プリセットイベント（23種 / 5カテゴリ）+ バンドル（3種）
  housing-sim.ts        住宅購入シミュレーション
  worldline-templates.ts 世界線テンプレート
  fitgate.ts            FitGate ロジック
  glossary.ts           用語集
  utils.ts              ユーティリティ（CHART_COLORS, cn, formatCurrency）
  v2/                   世界線比較専用（adapter, margin, store, worldline, readinessConfig）
  __tests__/  (6)       テストファイル群

e2e/
  helpers.ts            skipOnboarding, waitForSimulation, gotoApp
  mobile-quality.spec.ts フォント/タッチ/オーバーフロー × 4ページ × 2デバイス
  screenshots.spec.ts   4ページ × 3デバイス = 12スクリーンショット

docs/
  ds-audit/             デザイン監査アーカイブ（歴史的記録、現行ルールは本ファイル）
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

### ダッシュボード ↔ 分岐ビルダーのデータフロー
- ダッシュボードは `profile.lifeEvents` を表示のみ（直接編集 UI なし）
- 分岐ビルダーは `buildProfileForCandidate()` で profile をコピー+マージして一時プロファイルを作成。元の profile は変更しない
- `loadScenario()` は破壊的操作: 現在の profile が完全に上書きされる
- シナリオは生成時のスナップショット: 後から profile を変更しても反映されない

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
- 住宅購入シミュレーション。calc-core.ts を使用

## 分岐ビルダー

### lib/branch.ts
- `createDefaultBranches()`: プロファイルに応じたデフォルト分岐生成
- `branchToLifeEvents()`: 分岐 → LifeEvent 変換
- `buildProfileForCandidate()`: 候補ごとの一時プロファイル生成

### UI 構成（components/branch/）
- event-picker-dialog / event-customize-dialog: イベント選択・カスタマイズ
- branch-tree-viz: 決定木 SVG（全幅、SVG_W=720、モバイル fontSize=22）
- branch-timeline: タイムライン SVG（横スクロール、fontSize=11）
- branch-node / branch-category / worldline-preview / event-icon

## ダッシュボード（/app）

### レイアウト: 1カラム縦スクロール（Progressive Disclosure）
1. **第1層（結論）**: ConclusionSummaryCard — スコア + subMetrics + headline（mb-12）
2. **`<details>` 入力**（デフォルト閉）: ProfileSummary → Income → Retirement → Expense → Investment → HousingPlan
3. **第2層（根拠）**: VariableBar → AssetProjectionChart → ExitReadinessCard → CashFlowCard（mb-12）
4. **第3層（詳細）**: `<details>` 折りたたみ — ScenarioComparisonCard + MonteCarloSimulatorTab
- タブは廃止済み。情報を隠さず、スペーシングと折りたたみで視覚的階層を表現

### ConclusionSummaryCard（Tier 1 ヒーロー）
- スコアリング: 160px/120px (desktop/mobile)、fontSize 48 font-light Gold、strokeWidth 5
- Linen 背景 (#F0ECE4) + shadow-md + rounded-2xl + border-0
- 数字ベース headline（4 分岐パターン: 余白あり / ギリギリ / 超過 / 未到達）
- subMetrics: 生存率、安心ライン到達年齢、100歳時点中央値

## 世界線比較（/app/worldline）
- 3 タブ: 世界線比較（V2ComparisonView）/ 余白（V2ResultSection margins）/ 変数（V2ResultSection strategy — 現在値表示のみ、FPアドバイスなし）
- lib/v2/store.ts で UI 状態管理（タブ選択、比較ID）

### 比較テーブル設計
- 「★ あなたの状態」列 = `store.simResult`（固定アンカー、削除不可）
- 差分は常にアンカー基準
- テーブルは read-only（条件変更はダッシュボードで行う）

## シナリオ管理

### 4つの生成経路
| 経路 | トリガー | ID prefix |
|------|----------|-----------|
| 分岐ビルダー | 「世界線を生成する」→「比較する」 | `branch-*` |
| ダッシュテンプレート | ConclusionSummaryCard のボタン | `scenario-*` |
| 手動保存 | ScenarioComparisonCard の保存ボタン | `scenario-*` |
| 世界線テンプレート | V2ComparisonView のボタン | `scenario-*` |

### 表示管理
- `visibleScenarioIds`: 比較テーブルに表示するシナリオ ID リスト（localStorage 永続化）
- 最大3列（モバイル sm 未満は2列）
- 表示順: `branch-*` 優先、同カテゴリ内は新しい順
- ScenarioSelector: チェックボックス式の表示/非表示切り替え

### store アクション
- `saveScenario`: 新規保存 + 自動 visible 追加（上限未満の場合）
- `addScenarioBatch`: `branch-*` を全置換 + visible 更新
- `deleteScenario`: 削除 + visible/comparisonIds/activeScenarioId クリーンアップ
- `toggleScenarioVisibility`: 表示/非表示トグル（maxVisible 引数対応）

### 既知の制約
- `SavedScenario` に `source` フィールドなし。`branch-*` / `scenario-*` の prefix でのみ区別可能
- ダッシュテンプレート（Path B）は `updateProfile()` + 1500ms setTimeout で非アトミック

## コーディング規約
- UI: shadcn/ui + Tailwind CSS
- 金額: 万円単位（`formatCurrency()` で億円表示に自動変換）
- 言語: 日本語
- `'use client'` ディレクティブ必須
- 免責表示: 計算結果を表示するすべての画面に記載

### カラーパレット
- Night: `hsl(var(--night))` / #1A1916
- Gold: `hsl(var(--brand-gold))` / #C8B89A
- Linen: #F0ECE4（微細な区切り）
- Stone: #5A5550（テキスト）
- Bronze: #8A7A62（アクセント）
- Canvas: #FAF9F7（背景）
- スコア状態: `--safe` = Gold、`--danger` = Bronze。赤緑は排除済み
- UI 状態: `success`/`destructive`（shadcn/ui 標準、ui/ コンポーネント内のみ許可）
- チャート: `CHART_COLORS`（`lib/utils.ts`）
- **禁止色**: red-*/emerald-*/amber-*/green-* 等の生 Tailwind カラー。ハードコード値も禁止

### タイポグラフィスケール（厳守）
| レベル | クラス | 用途 |
|--------|--------|------|
| ヒーロースコア | `fontSize 48 font-light`（SVG内） | ConclusionSummaryCard 中央数字 |
| MetricCard 値 | `text-xl font-medium tabular-nums` | MetricCard 内数値 |
| Page Title | `text-xl font-bold tracking-tight` | 各ページ h1 |
| Card Title | `text-sm font-semibold` | CardTitle / SectionCard タイトル |
| Body | `text-sm text-muted-foreground leading-relaxed` | 本文・説明文 |
| Caption | `text-xs text-muted-foreground` | 注釈・補足 |
| **最小** | **`text-[11px]`** | **text-[10px] 以下は使用禁止** |

- 数値表示（金額・スコア・パーセント）は `tabular-nums` を必ず付与
- SVG 内テキスト: viewBox スケールを考慮し、375px 端末で実質 11px 以上になるよう設定

### カード3段階（Tier）
- **Tier 1（結論）**: ConclusionSummaryCard のみ。`bg-[#F0ECE4] shadow-md rounded-2xl border-0 p-6 md:p-8`
- **Tier 2（根拠）**: SectionCard 経由の結果カード。`bg-card shadow-sm rounded-xl border`
- **Tier 3（詳細）**: MonteCarloSimulatorTab 内カード。`rounded-lg shadow-none border`

### MetricCard 統一コンポーネント（metric-card.tsx）
- **default**: `rounded-lg bg-muted/50 p-4` — 資産推移・モンテカルロ・取り崩し
- **emphasized**: 背景なし — ConclusionSummaryCard (Linen) 内の subMetrics
- **compact**: `py-2` — ExitReadinessCard のサブスコア等

### スペーシング（3段階）
- 大区切り（セクション間）: `space-y-12` / `mb-12`（48px）
- 中区切り（カード間）: `space-y-6` / `mb-6`（24px）
- 小区切り（カード内要素間）: `space-y-4` / `gap-4`（16px）

### ボタン4バリアント
- **Primary**: shadcn default variant（Night #1A1916）。1画面に1〜2個
- **Secondary**: shadcn outline variant。副次的アクション
- **Ghost**: shadcn ghost variant。控えめなアクション（削除、アイコンボタン）
- **Link**: `text-brand-bronze hover:underline`。ナビゲーション
- **Gold背景ボタン禁止**: Gold はスコアリング・装飾のみ

### マイクロインタラクション
- カードホバー: `transition-colors duration-150 hover:border-brand-gold/30`
- `<details>` 開閉: CSS `details-show` アニメーション
- スコアリング: `useAnimatedValue` で 800ms expo-out
- カードフェードイン: `.animate-card-in`（300ms, 50ms スタガー）
- `prefers-reduced-motion: reduce` で全アニメーション無効化

## モバイル品質基準

### タッチターゲット（44px 最小）
- ボタン: `min-h-[44px]`
- テキストリンク: `inline-flex items-center min-h-[44px]`
- アイコンボタン: `min-h-[44px] min-w-[44px] flex items-center justify-center`
- Radix プリミティブ（Checkbox 16px, Switch 32px）: 親 `<label>` を `min-h-[44px]` でラップ

### フォントサイズ（11px 最小）
- CSS: `text-[10px]` 以下は使用禁止。最小は `text-[11px]` または `text-xs`（12px）
- SVG (viewBox スケール): branch-tree-viz は fontSize=22（375px で 11.4px）
- SVG (1:1 描画): branch-timeline は fontSize=11
- Recharts ラベル: fontSize={12} 以上

### レスポンシブ
- ブレークポイント: `sm:` (640px) / `md:` (768px)
- グリッド: `grid-cols-1 sm:grid-cols-3`（モバイルで縦積み）
- テーブル: `overflow-x-auto`（横スクロール許可）
- HoverCard: `max-w-[calc(100vw-2rem)]`

### Playwright 許容リスト
- Radix Checkbox/Switch: 親ラベルが 44px 以上なら許容
- 不可視要素（width/height 0, display:none, opacity:0）: 許容
- Toast コンテナ: システム UI として許容

## デザイン原則

### 決断の静けさ（Design Philosophy）
YOHACK は ¥29,800 のプレミアムプロダクト。Apple/Porsche/Aesop 水準の静謐さを目指す。

- **数字で語る、形容詞で語らない**: 「目標に近づいています」→「52歳で安心ライン到達。目標より3年の余白。」
- **FP アドバイスは出さない**: 「iDeCo 拠出を最大化」「貯蓄率を上げましょう」等の助言は禁止
- **絵文字禁止**: アイコンは Lucide（`components/branch/event-icon.tsx`）で統一
- **カラーはトークンのみ**: ハードコード値禁止
- **警告表現は最小限**: 数値が低い場合は `brand-bronze` で静かに伝える
- **SectionCard の description は非表示**: カードヘッダーはアイコン+タイトルのみ
- **Variable Bar**: チャート直上にドラッグ可能な数字。3つを超えない
- **チャート Y軸は中央値基準**: p75/p90 の複利膨張に引っ張られない

### 禁止表現
- FPアドバイス風の文言（「貯蓄率を上げましょう」「支出バランスを見直しましょう」）
- 評価的表現（「おすすめ」「推奨」「準備OK」「枯渇リスクあり」「素晴らしい選択です」）
- emerald / amber / red のステータスカラー
- パレット外の色（gray-500, red-600 等）

### 確定済みレイアウト
- ダッシュボードは1カラム縦スクロール。タブは廃止済み
- 3層構造: 結論（mb-12）→ 根拠（mb-12）→ 詳細（`<details>` 折りたたみ）
- NextBestActionsCard は削除済み（ブランドボイス違反）。復活させない
- 結果タブ（サマリー/確率分布/シナリオ）は廃止済み。復活させない
- 資産推移チャートの高さは `h-[400px] sm:h-[520px]`

## テスト

### ユニットテスト（vitest）
- `pnpm test` — 252 テスト / 6 ファイル
- calc-core.ts / engine.ts / housing-sim.ts のエンジンテストが中心

### E2E テスト（Playwright）
- `pnpm test:e2e` — 全テスト
- `pnpm test:mobile-quality` — モバイル品質チェック（4ページ × 2デバイス）
- `pnpm test:screenshots` — スクリーンショット（Desktop Chrome / iPhone SE / iPhone 14）
- Playwright 設定: `playwright.config.ts`（Chromium ベースのモバイルエミュレーション）
- ヘルパー: `e2e/helpers.ts`（skipOnboarding, waitForSimulation, gotoApp）

## 禁止事項
- Phase 1 で Supabase / Stripe / SendGrid を導入しない（`docs/constraints.md`）
- 新規 npm パッケージの導入は事前承認が必要
- 物件紹介・保険紹介・投資商品紹介の機能を入れない
- 「買うべき/買わないべき」の結論を提示しない
- 新しい Zustand ストアの追加（既存ストアを拡張すること）
- `text-[10px]` 以下のフォントサイズ（最小 `text-[11px]`）

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
- **現行ルールは CLAUDE.md に集約。`docs/ds-audit/` は歴史的アーカイブ。**
