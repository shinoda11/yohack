# CLAUDE.md

## プロジェクト概要
YOHACK — 人生の余白（お金・時間・体力）で人生の選択を比較するシミュレーター。
モンテカルロシミュレーション（1,000回×100歳）で安心ラインと余白スコアを算出。
住宅購入の意思決定を支援する。物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保。

対象: 世帯年収 1,000〜3,000万円の DINKs / プレDINKs、都市部在住、28〜42歳。
収益: Pass ¥29,800/90日。運営者 = 開発者 = 1人。

## ワークフロー規律

### 1. Plan First
- 3ステップ以上のタスクは、実装前に計画を出力する
- 計画: 「何を変えるか」「なぜ」「どう検証するか」
- 想定外が起きたら STOP して再計画。押し通さない

### 2. Verification Before Done
- `pnpm build` + `pnpm test`（252テスト pass）は全コミットの最低条件
- モバイル影響がある変更は `pnpm test:mobile-quality` も実行
- 「staff engineer が approve するか？」を自問してからコミット

### 3. Self-Improvement
- 修正指示を受けたら、同じミスを防ぐルールを CLAUDE.md に追記する
- 判断メモで「指示と異なる判断をした理由」を必ず報告する

### 4. Autonomous Bug Fixing
- バグ報告やスクリーンショットを受けたら、質問せずに直す
- ログ、エラー、テスト失敗を自分で追って解決する

### 5. Simplicity First
- 変更は最小限。影響範囲を最小化する
- 2箇所でしか使わない関数に新ファイルは作らない
- hacky に感じたら「全部知った上で、エレガントな方法は？」と自問する

### 6. Documentation = CLAUDE.md
- CLAUDE.md が唯一のドキュメント。他のファイルにルール・仕様を分散させない
- 新しい規約・仕様が確立されたら CLAUDE.md に追記する
- docs/ ディレクトリは存在しない（全て CLAUDE.md に統合済み）

## 技術スタック
- Next.js 16 + React 19 + TypeScript 5.9
- Zustand 5（状態管理）
- Recharts 2.15（グラフ）
- shadcn/ui + Tailwind CSS 4（UI）
- Vitest（ユニットテスト 252本 / 6ファイル）+ Playwright（E2E）
- Framer Motion（LPアニメーション）
- html-to-image → Web Share API（結果共有）
- Vercel（デプロイ、GitHub main ブランチ連携）
- **未導入（Phase 2 以降）**: Supabase, Stripe, SendGrid

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
- エンジンが無視するイベント型: `child_birth`, `education`, `asset_purchase`, `retirement_partial`

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

### ケース台帳（ENGINE_VERSION 1.0.0）
- `pnpm run case-sim` で再生成可能
- 24ケース（C01-C24）× 賃貸ベースライン + 住宅購入比較
- 各シナリオ5回実行の平均値、MC 1000回（賃貸）/ 500回シード付き（住宅購入）

#### 賃貸ベースライン一覧

| ID | ケース名 | 年齢 | 世帯年収 | 貯蓄+投資 | 家賃/月 | スコア | 生存率 | FIRE年齢 | 60歳資産 | 100歳資産 |
|:---|:---------|:-----|:---------|:----------|:--------|-------:|-------:|:---------|:---------|:----------|
| C01 | 王道DINK都心マンション検討 | 35歳/33歳 | 2,400万 | 4,000万 | 32万 | 72 | 64% | 50歳 | 2.6億 | 3.0億 |
| C02 | 高負荷キャリア×ペースダウン不安 | 37歳/35歳 | 2,400万 | 3,500万 | 30万 | 62 | 46% | — | 1.6億 | -6,296万 |
| C03 | DINK前提から子ども1人ありかも | 34歳/32歳 | 2,200万 | 3,000万 | 28万 | 72 | 63% | 50歳 | 2.5億 | 2.7億 |
| C04 | 海外転職オプション強めDINK | 33歳/31歳 | 2,300万 | 5,000万 | 29万 | 66 | 54% | 45歳 | 2.2億 | 9,983万 |
| C05 | 事前審査MAXで揺れるケース | 36歳/34歳 | 2,400万 | 2,800万 | 31万 | 81 | 80% | 52歳 | 3.2億 | 6.9億 |
| C06 | 高家賃ハイパフォーマーDINK | 32歳/30歳 | 2,400万 | 2,500万 | 40万 | 67 | 54% | 50歳 | 2.4億 | 8,780万 |
| C07 | 片働きリスク顕在夫婦 | 35歳/33歳 | 2,000万 | 3,200万 | 26万 | 79 | 76% | 50歳 | 2.7億 | 5.3億 |
| C08 | メンタルダウンリスク意識 | 38歳/36歳 | 2,200万 | 3,800万 | 27万 | 61 | 43% | — | 1.4億 | -8,538万 |
| C09 | リモート前提崩壊リスク | 34歳/32歳 | 2,200万 | 3,000万 | 24万 | 76 | 71% | 49歳 | 2.7億 | 4.8億 |
| C10 | 9,000〜10,000ラインで迷う | 33歳/33歳 | 2,400万 | 4,500万 | 29万 | 79 | 76% | 46歳 | 3.5億 | 7.2億 |
| C11 | 堅実1馬力＋時短妻 | 34歳/32歳 | 1,500万 | 2,000万 | 18万 | 78 | 73% | 54歳 | 2.2億 | 3.7億 |
| C12 | 共働き中堅×第2子タイミング | 33歳/31歳 | 1,800万 | 2,500万 | 22万 | 76 | 70% | 49歳 | 2.4億 | 4.1億 |
| C13 | ソロ購入・堅実会社員 | 30歳 | 900万 | 1,500万 | 11万 | 78 | 73% | 52歳 | 1.7億 | 3.1億 |
| C14 | 高年収若手DINK・タワマン検討 | 28歳/27歳 | 3,200万 | 3,000万 | 35万 | 73 | 67% | 42歳 | 4.2億 | 6.8億 |
| C15 | 子ども2人・共働き中堅・郊外戸建て | 38歳/36歳 | 1,200万 | 1,000万 | 12万 | 83 | 81% | 60歳 | 1.6億 | 3.0億 |
| C16 | 40歳ソロ・高貯蓄・賃貸継続派 | 40歳 | 1,800万 | 8,000万 | 20万 | 82 | 83% | 45歳 | 2.4億 | 5.9億 |
| C17 | フリーランス夫+会社員妻・収入変動大 | 35歳/33歳 | 2,000万 | 2,500万 | 25万 | 80 | 78% | 50歳 | 2.6億 | 5.5億 |
| C20 | RSU+副業持ち外資IT | 33歳/31歳 | 2,600万 | 4,500万 | 35万 | 75 | 69% | 46歳 | 3.5億 | 5.8億 |
| C21 | 保守的投資リターン3% | 35歳/33歳 | 2,200万 | 3,500万 | 28万 | 67 | 55% | 54歳 | 2.3億 | 4,500万 |
| C22 | 積極的投資リターン7% | 35歳/33歳 | 2,200万 | 3,500万 | 28万 | 91 | 98% | 47歳 | 5.2億 | 40.1億 |
| C23 | 現金偏重ポートフォリオ | 36歳/34歳 | 2,200万 | 4,000万 | 26万 | 90 | 86% | 50歳 | 3.4億 | 8.6億 |
| C24 | 高攻撃ポートフォリオ | 36歳/34歳 | 2,200万 | 4,000万 | 26万 | 82 | 85% | 49歳 | 3.4億 | 8.7億 |
| C19 | 持ち家ローン残あり住み替え検討 | 38歳/36歳 | 2,300万 | 3,500万 | ※持ち家 | 95 | 96% | 48歳 | 3.5億 | 11.8億 |
| C18 | 既に購入済み・売却検討 | 42歳/40歳 | 2,100万 | 3,000万 | ※持ち家 | 82 | 76% | 55歳 | 1.7億 | 3.0億 |

#### 住宅購入比較一覧

| ID | 物件価格 | 月額返済 | 40年総コスト | 購入スコア | 購入生存率 | 購入FIRE | 購入60歳資産 | 賃貸スコア | スコア差 |
|:---|:---------|:---------|:-------------|-----------:|-----------:|:---------|:-------------|-----------:|---------:|
| C01 | 8,750万 | 27.8万 | 1.6億 | 76 | 71% | 57歳 | 2.4億 | 72 | +4 |
| C02 | 7,750万 | 24.6万 | 1.4億 | 66 | 53% | 57歳 | 1.5億 | 62 | +4 |
| C03 | 8,250万 | 26.4万 | 1.5億 | 73 | 64% | 58歳 | 2.1億 | 72 | +1 |
| C04 | 9,000万 | 28.5万 | 1.6億 | 66 | 54% | 56歳 | 1.8億 | 66 | +0 |
| C05 | 1.1億 | 34.2万 | 1.9億 | 80 | 76% | 59歳 | 2.6億 | 81 | -1 |
| C06 | 8,250万 | 26.4万 | 1.5億 | 79 | 72% | 57歳 | 2.8億 | 67 | +12 |
| C07 | 7,500万 | 23.8万 | 1.3億 | 80 | 78% | 57歳 | 2.4億 | 79 | +1 |
| C08 | 8,500万 | 26.9万 | 1.5億 | 56 | 35% | 59歳 | 1.0億 | 61 | -5 |
| C09 | 7,750万 | 24.7万 | 1.4億 | 75 | 68% | 57歳 | 2.3億 | 76 | -1 |
| C10 | 9,500万 | 30.1万 | 1.7億 | 78 | 74% | 56歳 | 2.9億 | 79 | -1 |
| C11 | 6,250万 | 19.9万 | 1.1億 | 77 | 69% | 63歳 | 1.8億 | 78 | -1 |
| C12 | 6,750万 | 21.6万 | 1.2億 | 77 | 70% | 56歳 | 2.0億 | 76 | +1 |
| C13 | 3,500万 | 11.1万 | 6,273万 | 77 | 71% | 64歳 | 1.5億 | 78 | -1 |
| C14 | 1.4億 | 44.7万 | 2.4億 | 70 | 59% | 56歳 | 2.9億 | 73 | -3 |
| C15 | 4,500万 | 14.5万 | 8,086万 | 82 | 75% | 66歳 | 1.3億 | 83 | -1 |
| C16 | 8,000万 | 25.4万 | 1.4億 | 78 | 77% | 55歳 | 2.0億 | 82 | -4 |
| C17 | 7,250万 | 23.0万 | 1.3億 | 83 | 80% | 56歳 | 2.3億 | 80 | +3 |
| C20 | 9,000万 | 28.5万 | 1.6億 | 78 | 75% | 54歳 | 3.4億 | 75 | +3 |
| C21 | 7,500万 | 23.8万 | 1.3億 | 74 | 67% | 63歳 | 2.3億 | 67 | +7 |
| C22 | 7,500万 | 23.8万 | 1.3億 | 91 | 99% | 49歳 | 4.9億 | 91 | +0 |
| C23 | 7,500万 | 23.8万 | 1.3億 | 90 | 87% | 56歳 | 3.1億 | 90 | +0 |
| C24 | 7,500万 | 24.7万 | 1.4億 | 83 | 87% | 56歳 | 3.2億 | 82 | +1 |
| C18 | ※売却→賃貸 | 22.0万 | 1.2億 | 83 | 77% | 55歳 | 2.2億 | 82 | +1 |

## 禁止事項
- Phase 1 で Supabase / Stripe / SendGrid を導入しない
- 新規 npm パッケージの導入は事前承認が必要
- 環境変数が必要な実装はしない
- 物件紹介・保険紹介・投資商品紹介の機能を入れない
- 「買うべき/買わないべき」の結論を提示しない
- 新しい Zustand ストアの追加（既存ストアを拡張すること）
- `text-[10px]` 以下のフォントサイズ（最小 `text-[11px]`）

## バックログ実行ルール
- 本ファイルの「バックログ」セクションがタスク管理の SoT
- 変更してよいファイルはタスクに明示されたもののみ
- 既存テストが全件 pass していることを確認してからコミット

## バックログ

### P1 — 今月中（プロダクト品質）

#### デザインスプリント

| # | タイトル | 状態 |
|---|---------|------|
| DS-1 | ダッシュボード警告色排除（黄・赤・緑→ゴールド系トーン） | ✅ |
| DS-2 | 「次の一手」をYOHACK固有に（iDeCo/リバランス→分岐ビルダー誘導） | ✅ |
| DS-3 | 入力カード折りたたみ優先（サマリー1行、展開オンデマンド） | ✅ |
| DS-4 | 分岐ツリー全幅化（白ボックスから解放、画面幅60%+） | ✅ |
| DS-5 | 余白タブ空白感解消（数値に1行コンテキスト追加） | ✅ |
| DS-6 | 戦略タブ汎用アドバイス削除（シナリオ導出のみ） | ✅ |
| DS-7 | プロファイル入力実感（年収スライダー連動リアルタイム表示） | ✅ |

#### モバイル品質

| # | タイトル | 状態 |
|---|---------|------|
| MQ-1 | Prep判定時の `/fit/prep` 導線追加 | ✅ |
| MQ-2 | sticky ヘッダー統一（Settings・Worldline・Branch） | ✅ |
| MQ-3 | /app/profile サブタイトル追加 | ✅ |
| MQ-4 | 折りたたみボタン aria-label（income-card, housing-plan-card） | ✅ |

### P2 — 来月（インフラ + コンテンツ）

| # | タイトル | 依存 | 状態 |
|---|---------|------|------|
| P2-1 | Supabase導入（Auth + DB 3テーブル） | — | ⬜ |
| P2-2 | localStorage → Supabase DB移行 | P2-1 | ⬜ |
| P2-3 | FitGate → Supabase → プロファイル自動プリセット | P2-1 | ⬜ |
| P2-4 | Stripe Pass決済（¥29,800/90日） | P2-1 | ⬜ |
| P2-5 | URLアクセス制御（Basic認証 → Supabase Auth） | P2-1 | ⬜ |
| P2-6 | 特商法・プライバシーポリシー・利用規約（バーチャルオフィス） | — | ⬜ |
| P2-7 | チラ見せ動画15秒（LP S1。videoタグ実装済み、mp4未撮影） | — | ⬜ |
| P2-8 | ケース台帳LP展開 6件（LP S3拡張） | — | ⬜ |

### P3 — 4〜5月（マーケティング）

| # | タイトル | 状態 |
|---|---------|------|
| P3-1 | Instagramアカウント開設（yohack.jp、ビジネス、FB連携） | ⬜ |
| P3-2 | 初回投稿9枚制作（C×5 + Q×3 + 裏側×1） | ⬜ |
| P3-3 | Instagram自動化（n8n + Claude API + Puppeteer + Graph API） | ⬜ |
| P3-4 | GA4イベント計測（LP→FitGate→決済） | ⬜ |
| P3-5 | 1on1裏メニュー表示ロジック（世界線3本 or 60日経過） | ⬜ |

### 完了済み
- エンジン v1.0.0: calc-core 10関数、パリティテスト61件、252テスト pass、感度分析完了
- LP / FitGate: 7セクション + FitGate 12問 + Ready/Prep判定 + UTM + モバイル375px
- プロダクトUX: オンボーディング、分岐ビルダー、IncomeCard RSU/パートナー、イベントアイコン Lucide化、世界線3タブ再構成
- 技術負債: デッドコンポーネント削除、ルート直下クリーンアップ、CLAUDE.mdスリム化

### やらない（判断済み）

| 内容 | 理由 |
|------|------|
| 住み替え（持ち家→賃貸） | エンジン設計変更が大。販売後フィードバックで再判断 |
| 複数物件比較（A/B/C） | 手動で世界線を分ければ代替可能 |
| 不動産出口戦略 | 住み替え依存 |
| パートナー招待機能 | Supabase依存 + 画面共有で代替可能 |
| UIコンポーネントテスト | エンジンテスト252本で十分 |
| v2/page.tsx 分割リファクタ | 3タブ再構成済み。不要 |

### 未解決の問い

| # | 問い |
|---|------|
| Q1 | 物件6,000万〜8,000万はDINKSに「自分ごと」に感じるか？ |
| Q2 | S0背景色: ダーク維持かオフホワイト統一か？ |
| Q3 | グラフスコア参考値をLPに出すか完全ぼかしか？ |
| Q4 | S2シナリオ: 夫婦1組かソロ2パターンか？ |
| Q5 | アルファテスター通知タイミングと方法 |
| Q6 | Stripe接続前のPhase1で¥29,800をどこで案内するか？ |

## ベータ準備レポート（2026-02-23）

### コード品質
- console.log 残存: 1件（`app/api/prep-register/route.ts` — Phase 2 スタブ、意図的）
- console.error/warn: 2件（エラーハンドラ内、適切な使用）
- localhost ハードコード: 0件
- TODO/FIXME: 4件（全て Phase 2 スコープ）
  - `app/api/prep-register/route.ts:7` — TODO Phase2: Supabase prepModeSubscribers テーブルに保存
  - `app/api/prep-register/route.ts:8` — TODO Phase2: SendGrid でレター送信
  - `app/fit/result/page.tsx:124` — TODO Phase2: Stripe Checkout ボタン
  - `lib/fitgate.ts:174` — TODO Phase2: SendGrid でテンプレート送信

### 依存関係（主要バージョン）
- Next.js 16.1.6 / React 19.2.4 / TypeScript 5.9.3
- Zustand 5.0.11 / Recharts 2.15.4 / Tailwind CSS 4.1.18 / Framer Motion 12.34.3
