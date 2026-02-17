# CLAUDE.md

## プロジェクト概要
YOHACK — 人生の余白（お金・時間・体力）で人生の選択を比較するシミュレーター。
モンテカルロシミュレーション（1,000回、100歳まで）で住宅・キャリア・家族の意思決定を支援する。
物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保する設計。

## 誰のためのプロダクトか
- 世帯年収 1,000〜3,000万円の DINKs / プレDINKs、都市部在住、28〜42歳
- 7,000〜10,000万円クラスの住宅購入を検討中
- 「買えるか」ではなく「買った後も動けるか」が論点の層
- ペルソナA（2,000〜3,000万・合理的最適化カップル）が最優先ターゲット

## 収益モデル
- Pass: ¥29,800 / 90日（メイン収益。Stripe連携は Phase 3）
- 1on1: ¥50,000 / 回（裏メニュー。LP・Instagramでは一切言及しない）
- 運営者 = 開発者 = 1人（サラリーマン兼業）。週25分の稼働で回る設計が必須

## 技術スタック
- Next.js 16 + React 19 + TypeScript
- Zustand 5（状態管理）、Recharts（グラフ）
- shadcn/ui + Tailwind CSS 4（UI）
- Vercel（デプロイ、GitHub main ブランチ連携）
- テスト: vitest 160本（`lib/__tests__/` に5ファイル）
- **未導入**: Supabase（認証）、Stripe（決済）、SendGrid（メール）→ すべて Phase 2-3

## 現在のルート構成

### 公開ページ（認証なし）
| パス | 用途 | 行数 |
|------|------|------|
| `/` | LP（7セクション。Instagram → LP → FitGate の入口） | 359 |
| `/fit` | FitGate（12問フォーム） | 285 |
| `/fit/result` | FitGate 判定結果 | 222 |
| `/fit/prep` | Prep向けレター登録 | 59 |
| `/pricing` | 料金ページ | 160 |
| `/legal/terms` | 利用規約 | 151 |
| `/legal/privacy` | プライバシーポリシー | 146 |
| `/legal/commercial` | 特商法 | 105 |

### プロダクト（Basic認証 `/app/*`）
| パス | 用途 | 行数 |
|------|------|------|
| `/app` | メインダッシュボード（入力カード + 結果タブ） | 576 |
| `/app/branch` | 分岐ビルダー（ツリー + カテゴリ選択 + 世界線プレビュー） | 235 |
| `/app/profile` | プロファイル入力（単カラム） | 283 |
| `/app/worldline` | 世界線比較（3タブ: 世界線比較/余白/戦略） | 140 |
| `/app/settings` | 設定（データ管理・バージョン情報） | 279 |

### リダイレクト（スタブ）
| パス | リダイレクト先 |
|------|---------------|
| `/app/v2` | → `/app/worldline` |
| `/app/plan` | → `/app/branch` |
| `/rsu` | → `/app/profile` |
| `/timeline` | → `/app/branch` |

## ディレクトリ構造
```
app/
  page.tsx              ← LP（7セクション）
  fit/                  ← FitGate（12問フォーム + 判定結果 + Prep）
    page.tsx, result/page.tsx, prep/page.tsx
  app/
    page.tsx            ← メインダッシュボード
    branch/page.tsx     ← 分岐ビルダー
    profile/page.tsx    ← プロファイル入力
    worldline/page.tsx  ← 世界線比較
    settings/page.tsx   ← 設定
    v2/page.tsx         ← リダイレクトスタブ
    plan/page.tsx       ← リダイレクトスタブ
    layout.tsx          ← プロダクト共通レイアウト（Sidebar wrapper）
  pricing/page.tsx      ← 料金
  legal/                ← 利用規約・プライバシー・特商法

components/
  dashboard/            ← 19ファイル（入力カード・結果カード・オンボーディング）
  v2/                   ← 3ファイル（V2ResultSection, V2ComparisonView, MoneyMarginCard）
  branch/               ← 6ファイル（branch-tree-viz, branch-category, branch-node, worldline-preview, event-picker-dialog, event-customize-dialog）
  layout/               ← 3ファイル（sidebar, bottom-nav, brand-story-dialog）
  plan/                 ← 1ファイル（rsu-content）
  ui/                   ← 24ファイル（shadcn/ui）
  slider-input.tsx      ← 共通スライダー入力
  section-card.tsx      ← 共通セクションカード
  theme-provider.tsx    ← テーマプロバイダー

lib/
  store.ts              ← Zustand SoT（415行）
  engine.ts             ← モンテカルロシミュレーション（819行）
  housing-sim.ts        ← 住宅シミュレーション（779行）
  branch.ts             ← 分岐ビルダーロジック（369行）
  types.ts              ← 型定義（217行）
  fitgate.ts            ← FitGate判定 + Profile変換（120行）
  worldline-templates.ts← 世界線テンプレート5種（119行）
  plan.ts               ← ライフプラン計算（16行）
  glossary.ts           ← 用語集（14行）
  utils.ts              ← ユーティリティ（6行）
  v2/                   ← 5ファイル（世界線比較ロジック: adapter, margin, store, worldline, readinessConfig）
  event-catalog.ts      ← ライフイベントプリセット23種 + バンドル3種
  __tests__/            ← 5テストファイル（169テスト）
    engine.test.ts, adapter.test.ts, housing-sim.test.ts, e2e-personas.test.ts, e02-regression.test.ts

hooks/                  ← 8ファイル
scripts/                ← ケース台帳シミュレーション・感度分析・SoTチェック

docs/
  lp-design.md             ← LP設計書 v1.0
  migration-from-lp.md     ← 旧LPリポからの移植ガイド
  fitgate-reference/       ← 旧リポから抽出した移植対象コード（8ファイル、実装時の参照用）
  case-catalog-results.md  ← 18ケースの賃貸vs購入比較結果
  sensitivity-analysis.md  ← 感度分析結果
  product-backlog.md       ← プロダクトバックログ
```

## ナビゲーション

### モバイルヘッダー（md未満）
ファイル: `components/layout/mobile-header.tsx`
- Y-branchシンボル（20px）+ "YOHACK" ワードマーク（Gold）
- スクロールで流れる（sticky ではない）
- 共通レイアウト `app/app/layout.tsx` から全プロダクトページに適用

### サイドバー（デスクトップ md+）
ファイル: `components/layout/sidebar.tsx`
- ロゴ: YohackSymbol（Y字分岐SVG）+ "YOHACK" + "人生に、余白を。"
- メニュー: ダッシュボード `/app` | プロファイル `/app/profile` | 分岐ビルダー `/app/branch` | 世界線比較 `/app/worldline`
- フッター: 設定 `/app/settings`

### ボトムナビ（モバイル md未満）
ファイル: `components/layout/bottom-nav.tsx`
- タブ: ホーム(Y-branch) `/app` | 分岐 `/app/branch` | 比較 `/app/worldline` | 設定 `/app/settings`

### 共通コンポーネント
- `components/layout/yohack-symbol.tsx`: Y-branchシンボルSVG（sidebar, mobile-header, bottom-nav で共有）

## アーキテクチャ原則

### Single Source of Truth (SoT)
- `lib/store.ts` がアプリ全体の状態管理の唯一の場所
  - `profile`: ユーザー入力データ
  - `simResult`: シミュレーション計算結果
  - `scenarios`: 保存されたシナリオ
  - `selectedBranchIds`: 分岐ビルダーの選択状態
  - `customBranches`: ユーザー追加の分岐
- `lib/v2/store.ts` は世界線比較の UI 状態専用（計算結果は持たない）。唯一の許可された例外
- 第三のストアを絶対に作らない
- 各ページ/コンポーネントは `useProfileStore()` から参照のみ。独自に `runSimulation` を呼び出さない
- 違反チェック: `npm run check:store`

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存（Phase 2 で Supabase DB に移行予定）
- シミュレーションは profile 変更時に自動で debounce 実行

## エンジン仕様 (`lib/engine.ts`)

### 税金・社保（自動計算）
- `calculateEffectiveTaxRate`: 給与所得控除（6段階）→ 社保（厚生年金+健保+雇用）→ 累進所得税（7段階）+ 住民税10% + 復興税2.1%
- `useAutoTaxRate: true` がデフォルト。手動入力の `effectiveTaxRate` はフォールバック

### 年金（収入連動）
- `calculateAnnualPension`: 基礎年金（加入年数按分）+ 厚生年金（報酬比例方式、月額上限65万）
- couple モードでは配偶者年金を別計算で加算
- careerAvg = grossIncome × 0.75（過去年収不明のため現在年収ベースで概算）

### ライフイベント（収入側対応済み）
- `calculateIncomeAdjustment`: income_increase / income_decrease を self/partner 別に適用
- `calculateRentalIncome`: 賃貸収入（退職後も継続）
- **TODO**: パートナーの収入イベントによる年金額への影響は未対応（L242）

### スコア重み
| 指標 | 重み | 満点条件 |
|------|------|---------|
| survival（生存率） | 55% | survivalRate ≥ 100% |
| lifestyle（生活水準） | 20% | 退職後資産で20年分の支出 |
| risk（リスク耐性） | 15% | riskExposure × volatility が低い |
| liquidity（流動性） | 10% | 60ヶ月分の生活費を現金保有 |

### 感度分析の結論
- **investReturn のみ有意**（±31スコア）。rentInflation / maintenance / rateCap はすべて ≤4
- → 投資リターン設定UI（3%/5%/7%プリセット）は実装済み

### デフォルトプロファイル
35歳 / solo / 年収1,200万 / 資産2,500万（現金500+投資2,000+DC300）/ 家賃月15万 / 期待リターン5% / インフレ2%

## 分岐ビルダー (`lib/branch.ts` + `/app/branch`)

### 概要
ライフイベントを「確定・計画・不確定」の3カテゴリで整理し、不確定イベントの組み合わせから世界線候補を自動生成する。

### UI構成（2ステップ）
1. **select**: SVGタイムラインビジュアル + 3カテゴリの分岐チェックリスト + 「世界線を生成する」ボタン
2. **preview**: 世界線候補リスト（スコア + 差分バッジ）+ 発見カード + 「比較する」ボタン → `/app/worldline` に遷移

### 設計判断（確定済み）
- 世界線候補: 最大5本。ベースライン（確定+計画のみ）は必ず含む
- エンジン接続: 分岐 → `lib/v2/events.ts` のイベント変換 → `engine.ts` でモンテカルロ実行 → スコア算出
- カスタムイベント追加: ボタンのみ配置（Phase C で実装予定）

### SVGタイムライン
- viewBox="0 0 400 240"、水平線（今→65→100歳）
- 計画ブランチ: 上方向に実線（緑 #4A7C59）
- 不確定ブランチ: 下方向に破線（茶 #8A7A62）
- 分岐点ノード: Gold #C8B89A + pulse アニメーション

## ビジネス判断基準（市場調査 2026-02 結論）

機能追加・UI変更・メッセージング変更の判断時に参照すること。

### 価格
- ¥29,800/90日 を維持。意思決定対象（物件8,000万）の0.03%、FP有料相談の半額以下
- **トリガー**: FitGate Ready→Pass CVR が3ヶ月連続20%未満 → Prep Pass（無料7日）導入検討

### Go/No-Go 基準
| 時点 | 指標 | 目標 | 最低ライン | 未達時 |
|------|------|------|-----------|--------|
| 3ヶ月 | Pass累計 | 15件 | 5件 | 導線ボトルネック特定。0件なら撤退検討 |
| 3ヶ月 | FitGate完了率 | 60% | 40% | 質問の文言・順序を改善 |
| 6ヶ月 | Pass累計 | 40件 | 15件 | 15件未満で撤退判断 |
| 6ヶ月 | アクティベーション（世界線3本作成） | 50% | 30% | オンボーディング改善 |

### メッセージの前提仮説（未検証）
| ID | 仮説 | 棄却されたら |
|----|------|-------------|
| H1 | FP・仲介の利益相反に不信感がある | 機能訴求（世界線比較・モンテカルロ精度）に振る |
| H2 | 「買った後も動けるか」が最大の不安 | ヒーローコピーを「本当に買って大丈夫か」系に変更 |
| H3 | ¥29,800に支払い意思がある | Van Westendorp結果に合わせて価格改定 |
| H4 | 夫婦の「数字の共通言語」がない | 個人利用にフォーカス |

### 競合との差別化ライン（守るべきもの）
- **利益相反ゼロ**: 物件・保険・投資の紹介機能を入れない。アフィリエイトも入れない
- **世界線比較**: 同条件で選択肢を並走させる。FP・SUUMOにない独自価値
- **高収入特化の精度**: 累進課税・収入連動年金・インフレ調整
- **セルフサービス**: 自分で数字を動かす。「答えを出してもらう」導線は作らない

## フェーズ計画

### 完了
- **Phase A**: モバイル基盤修正（overflow-x-hidden、ボトムナビ導入）
- **Phase B**: ページ再構成（/branch, /worldline, /profile 新設 + エンジン接続）
- **Phase B-fix**: ダッシュボード復元（入力カード + 結果タブの3カラム構成を維持）
- **LP・FitGate統合**: / → LP、/app/* → プロダクト、FitGate 12問 + 判定ロジック

### 次にやること
- **UX/UI改善**: ダッシュボードのモバイルレイアウト改善（結果が入力カード群の下に埋もれる問題）、世界線比較の5タブ小画面対応、モバイルでのブランド浸透（Y-branch）

### 将来
- **Phase 2**: Supabase導入（認証 + DB）。localStorage → DB移行
- **Phase 3**: Stripe連携（Pass課金）。アクセス制御（Pass未購入者はプロダクトにアクセスできない）

## FitGate → プロファイル自動プリセット
| FitGate質問 | → YOHACKフィールド |
|------------|-------------------|
| 個人年収レンジ | `grossIncome` |
| 世帯年収レンジ | `grossIncome + partnerGrossIncome` |
| 年齢 | `currentAge` |
| 家族構成 | `mode` (solo/couple) |
| 現在の家賃 | `housingCostAnnual`（月額→年額変換） |
| 検討物件価格帯 | 住宅プラン初期値 |
| 貯蓄＋投資 | `assetCash + assetInvest` |

## コマンド
| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー |
| `pnpm build` | ビルド |
| `pnpm lint` | ESLint |
| `pnpm test` | vitest実行（160本） |
| `pnpm test:watch` | vitestウォッチ |
| `pnpm run case-sim` | ケース台帳シミュレーション（C01-C18） |
| `npm run check:store` | SoTガードレールチェック |

## コーディング規約
- UIコンポーネントは shadcn/ui を使用
- スタイリングは Tailwind CSS
- 金額の単位は万円（`formatCurrency()` で億円表示に自動変換）
- UI は日本語
- カラーパレット: Night #1A1916 / Linen #F0ECE4 / Gold #C8B89A / テキスト #5A5550 / 背景 #FAF9F7
- コンポーネントファイルは `'use client'` ディレクティブ必須
- 金融アドバイスではない旨の免責を、計算結果を表示するすべての画面に記載
- モバイルファーストのレスポンシブデザイン（max-w-2xl mx-auto が基本パターン）
- タッチターゲット 44px 以上
- スペーシング規則:
  - カード間: space-y-4 or gap-4
  - カード内（フォーム要素間）: space-y-6（入力フィールドの視覚的分離）
  - カード内（情報表示要素間）: space-y-4

## やらないことリスト
- 物件紹介・保険紹介・投資商品紹介の機能
- アフィリエイトリンク・広告表示
- 全所得層への対応拡大（ニッチ特化を維持）
- 「買うべき/買わないべき」の結論提示（比較の土台を返すだけ）
- 1on1 の LP・Instagram での言及
- FP資格によるブランディング（ツールであってアドバイスではない）

## 既知のTODO
- パートナーの収入イベントによる年金額への影響（`engine.ts` L242）
- DecisionHost の新しい世界線作成（`components/v2/DecisionHost.tsx` L58）
- `middleware.ts` → `proxy` 規約への移行（Next.js 16 非推奨警告）
- TypeScript 5.0.2 → 5.1.0+ へのアップグレード
- metadataBase 未設定（OGP用）
