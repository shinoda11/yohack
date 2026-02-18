# CLAUDE.md

## プロジェクト概要
YOHACK — 住宅購入の意思決定を「世界線比較」で支援するシミュレーター。
モンテカルロシミュレーション（1,000回、100歳まで）で住宅・キャリア・家族の選択肢を並走比較する。
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
- テスト: vitest 191本（`lib/__tests__/` に5ファイル）
- **未導入**: Supabase（認証）、Stripe（決済）、SendGrid（メール）→ すべて Phase 2-3

## 現在のルート構成

### 公開ページ（認証なし）
| パス | 用途 | 行数 |
|------|------|------|
| `/` | LP（7セクション。Instagram → LP → FitGate の入口） | 347 |
| `/fit` | FitGate（12問 → メアド入力 → 判定結果） | 419 |
| `/fit/result` | FitGate 判定結果（Ready / Prep） | 238 |
| `/fit/prep` | Prep Mode 案内 | 74 |
| `/pricing` | 料金ページ | 160 |
| `/legal/terms` | 利用規約 | 151 |
| `/legal/privacy` | プライバシーポリシー | 146 |
| `/legal/commercial` | 特商法 | 105 |

### プロダクト（Basic認証 `/app/*`）
| パス | 用途 | 行数 |
|------|------|------|
| `/app` | メインダッシュボード（入力カード + 結果タブ） | 610 |
| `/app/branch` | 分岐ビルダー（決定木 + カテゴリ選択 + イベントカタログ + 世界線プレビュー） | 488 |
| `/app/profile` | プロファイル入力（単カラム） | 263 |
| `/app/worldline` | 世界線比較（3タブ: 世界線比較/余白/戦略） | 153 |
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
  fit/                  ← FitGate（12問 + メアド収集 + 判定結果 + Prep）
    layout.tsx            ← FitGate専用レイアウト（ロゴヘッダー + 中央寄せ）
    page.tsx, result/page.tsx, prep/page.tsx
  app/
    page.tsx            ← メインダッシュボード
    branch/page.tsx     ← 分岐ビルダー
    profile/page.tsx    ← プロファイル入力
    worldline/page.tsx  ← 世界線比較
    settings/page.tsx   ← 設定
    v2/page.tsx         ← リダイレクトスタブ
    plan/page.tsx       ← リダイレクトスタブ
    layout.tsx          ← プロダクト共通レイアウト（Sidebar + MobileHeader + BottomNav）
  pricing/page.tsx      ← 料金
  legal/                ← 利用規約・プライバシー・特商法
  proxy.ts             ← /app/* にBasic認証

components/
  dashboard/            ← 20ファイル（入力カード・結果カード・オンボーディング）
                           profile-summary-card（前提サマリー読み取り専用）、retirement-card（リタイア設定）を含む
  branch/               ← 7ファイル（branch-tree-viz, branch-timeline, branch-category,
                           branch-node, worldline-preview, event-picker-dialog, event-customize-dialog）
  v2/                   ← 3ファイル（V2ResultSection, V2ComparisonView, MoneyMarginCard）
  layout/               ← 5ファイル（sidebar, bottom-nav, mobile-header, brand-story-dialog, yohack-symbol）
  plan/                 ← 1ファイル（rsu-content）
  ui/                   ← 24ファイル（shadcn/ui）
  currency-input.tsx    ← 共通カンマ付き数値入力
  slider-input.tsx      ← 共通スライダー入力
  section-card.tsx      ← 共通セクションカード
  theme-provider.tsx    ← テーマプロバイダー

lib/
  store.ts              ← Zustand SoT（377行）
  engine.ts             ← モンテカルロシミュレーション（~835行）
  housing-sim.ts        ← 住宅シミュレーション（779行）
  benchmarks.ts         ← ケース台帳C01-C18ハードコード結果（ダッシュボード参照用）
  branch.ts             ← 分岐ビルダーロジック（~690行）
  event-catalog.ts      ← ライフイベントプリセット23種 + バンドル3種（570行）
  types.ts              ← 型定義（232行）
  fitgate.ts            ← FitGate判定 + Profile変換 + メアド収集（149行）
  worldline-templates.ts← 世界線テンプレート5種（119行）
  plan.ts               ← ライフプラン計算（16行）
  glossary.ts           ← 用語集（14行）
  utils.ts              ← ユーティリティ（6行）
  v2/                   ← 5ファイル（adapter, margin, store, worldline, readinessConfig）
  __tests__/            ← 5テストファイル（191テスト）
    engine.test.ts, adapter.test.ts, housing-sim.test.ts, e2e-personas.test.ts, e02-regression.test.ts

hooks/                  ← 8ファイル（useMargin, useStrategy, useSimulation, useHousingScenarios,
                           useProfileCompleteness, useValidation, usePlan, use-toast）
scripts/                ← case-catalog-sim.ts, sensitivity-analysis.ts, check-store-sot.js

docs/
  lp-design.md             ← LP設計書 v1.0
  migration-from-lp.md     ← 旧LPリポからの移植ガイド
  fitgate-reference/       ← 旧リポから抽出した移植対象コード（参照用）
  case-catalog-results.md  ← 18ケースの賃貸vs購入比較結果
  sensitivity-analysis.md  ← 感度分析結果
  product-backlog.md       ← プロダクトバックログ
  phase-*.md               ← フェーズ別設計書
  quality-audit.md         ← 品質監査結果
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
  - `hiddenDefaultBranchIds`: 非表示デフォルトブランチ（migration で自動クリア）
- `lib/v2/store.ts` は世界線比較の UI 状態専用（計算結果は持たない）。唯一の許可された例外
- 第三のストアを絶対に作らない
- 各ページ/コンポーネントは `useProfileStore()` から参照のみ。独自に `runSimulation` を呼び出さない
- 違反チェック: `npm run check:store`

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存（Phase 2 で Supabase DB に移行予定）
- シミュレーションは profile 変更時に自動で debounce（150ms）実行
- FitGate 回答データ + メールアドレスも localStorage に保存

### 張りぼて監査の結果
- 接続率 97%（33/34項目）。AdvancedInputPanel は全削除済み
- 唯一の部分接続: `profile.mortgageInterestRate`（保留）
- 詳細は `HARIBOTE-AUDIT.md`

## ダッシュボード左カラム構成 (`app/app/page.tsx`)

| # | カード | 種別 | 説明 |
|---|--------|------|------|
| 1 | ProfileSummaryCard | 読み取り専用 | 前提表示（年齢/世帯/家賃/資産）。「編集 →」で `/app/profile` に遷移 |
| 2 | IncomeCard | レバー | 本人年収・パートナー年収・副業収入 |
| 3 | RetirementCard | レバー | リタイア年齢スライダー・退職後事業収入・終了年齢 |
| 4 | ExpenseCard | レバー | 生活費のみ（`hideHousing` で家賃非表示。家賃はサマリーに移動） |
| 5 | InvestmentCard | レバー | 期待リターン・インフレ率 |
| 6 | HousingPlanCard | レバー | 住宅シナリオ設定 |

- BasicInfoCard / AssetCard はダッシュボードから除外（`/app/profile` のみに存在）
- LifeEventsSummaryCard もダッシュボードから除外（分岐ビルダー `/app/branch` で管理）
- ExitReadinessCard 内に折りたたみベンチマークセクション（`lib/benchmarks.ts` の C01-C18 データ参照）

## エンジン仕様 (`lib/engine.ts`)

### 税金・社保（自動計算）
- `calculateEffectiveTaxRate`: 給与所得控除（6段階）→ 社保（厚生年金+健保+雇用）→ 累進所得税（7段階）+ 住民税10% + 復興税2.1%
- `useAutoTaxRate: true` がデフォルト。手動入力の `effectiveTaxRate` はフォールバック

### 年金（収入連動・報酬比例方式）
- `calculateAnnualPension`: 基礎年金80万円（加入年数/40按分）+ 厚生年金（報酬比例: avgMonthly × 5.481/1000 × 月数、月額上限65万）
- couple モードでは配偶者年金を別計算で加算
- 年金用平均年収は22歳〜60歳の加重平均で算出（LifeEvent の income_increase/decrease を反映）

### ライフイベント
- `calculateIncomeAdjustment`: income_increase / income_decrease を self/partner 別に適用
- `calculateRentalIncome`: 賃貸収入（退職後も継続）
- `calculateExpenses`: expense_increase / expense_decrease をインフレ調整で適用
- housing_purchase: 頭金+諸費用の一括消費 → 住宅ローン返済開始
- **TODO**: パートナーの収入イベントによる年金額への影響は未対応（L242）

### スコア重み（L684）
| 指標 | 重み | 満点条件 |
|------|------|---------|
| survival（生存率） | 55% | survivalRate ≥ 100% |
| lifestyle（生活水準） | 20% | 退職後資産で20年分の支出 |
| risk（リスク耐性） | 15% | riskExposure × volatility が低い |
| liquidity（流動性） | 10% | 60ヶ月分の生活費を現金保有 |

### 感度分析の結論
- **investReturn のみ有意**（±31スコア）。rentInflation / maintenance / rateCap はすべて ≤4
- → 投資リターン設定UI（3%保守的/5%標準/7%積極的のプリセット）は実装済み
- エンジン前提変更時は `pnpm run case-sim` で18ケース再検証

### 退職後事業収入
- `postRetireIncome`: 退職後の年間事業収入（万円、デフォルト0）。顧問・コンサル等
- `postRetireIncomeEndAge`: 事業収入が続く年齢（デフォルト75）
- retireAge〜postRetireIncomeEndAge の間、事業収入を税率20%固定で手取り加算
- 実装: `calculateNetIncome()` / `calculateCashFlow()` 内

### デフォルトプロファイル（L800-）
35歳 / solo / 年収1,200万 / 資産2,500万（現金500+投資2,000+DC300）/ 家賃月15万 / 期待リターン5% / インフレ2% / 家賃インフレ0.5% / 退職後事業収入0万

## 住宅シミュレーション (`lib/housing-sim.ts`)

### 変動金利モデル
- `RateStep[]` でステップアップスケジュールを定義
- ケース台帳のデフォルト: 初期0.5% → +0.3%/5年 → 上限2.3%（30年目）
- `rateSteps` 未指定時は `interestRate` の固定金利

### 住宅シナリオ3種
- `RENT_BASELINE`: 賃貸継続（家賃インフレ `rentInflationRate` 適用）
- `BUY_NOW`: 即購入
- `RELOCATE`: 売却+住み替え

## 分岐ビルダー (`lib/branch.ts` + `lib/event-catalog.ts` + `/app/branch`)

### 概要
ライフイベントを「確定・計画・不確定」の3カテゴリで整理し、不確定イベントの組み合わせから世界線候補を自動生成する。

### UI構成（2ステップ）
1. **select**: SVG決定木ビジュアル + 水平タイムライン + 3カテゴリの分岐チェックリスト + イベント追加ダイアログ + 「世界線を生成する」ボタン
2. **preview**: 世界線候補リスト（スコア + 差分バッジ）+ 「比較する」ボタン → `/app/worldline` に遷移

### イベントカタログ (`lib/event-catalog.ts`)
- 23種のプリセットイベント（5カテゴリ: 家族/キャリア/生活/資産/住宅）
- 3種のバンドル（海外駐在+自宅賃貸、海外駐在(賃貸)、育休パッケージ）
- プリセット → カスタマイズ → Branch 追加のフロー

### ブランチの削除ルール
- デフォルトブランチ: 削除ボタンなし（チェックボックスでON/OFF）
- カスタムブランチ: インラインXボタンで削除
- オーバーライドブランチ: 削除するとデフォルト版を復元

### 教育費自動バンドル
- 子どもイベント（`eventType: 'child'`）追加時、`branchToLifeEvents()` が3段階の教育費イベントを自動生成
  - 保育料 50万/年 × 6年（0-5歳）
  - 学費+塾 100万/年 × 12年（6-17歳）
  - 大学費用 200万/年 × 4年（18-21歳）
- UIに「教育費自動加算: 保育50万→学費100万→大学200万/年」の注釈表示（`branch-node.tsx`）

### 設計判断（確定済み）
- 世界線候補: 最大5本。ベースライン（確定+計画のみ）は必ず含む
- エンジン接続: Branch → `branchToLifeEvents()` → Profile.lifeEvents にマージ → `engine.ts` でモンテカルロ → スコア算出

## FitGate (`/fit` + `lib/fitgate.ts`)

### フロー
12問回答 → メアド入力（必須、スキップ不可）→ 判定結果表示

### 判定ロジック
4条件すべて満たせば Ready: 年収1,500万+、資産2,000万+、数字入力OK、予算3万+
それ以外は Prep（near / notyet の2段階）

### リトライ制限
- localStorage で回数管理、3回まで
- 4回目以降は「診断は3回まで利用できます」表示

### メール送信
- 現在はスタブ（console.log のみ）
- 将来 SendGrid で Ready/Prep 別テンプレート送信

### プロファイル変換
| FitGate質問 | → YOHACKフィールド |
|------------|-------------------|
| 世帯年収レンジ | `grossIncome` |
| 金融資産レンジ | `assetCash + assetInvest`（30:70按分） |

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

### 競合との差別化ライン（守るべきもの）
- **利益相反ゼロ**: 物件・保険・投資の紹介機能を入れない。アフィリエイトも入れない
- **世界線比較**: 同条件で選択肢を並走させる。FP・SUUMOにない独自価値
- **高収入特化の精度**: 累進課税・収入連動年金・インフレ調整
- **セルフサービス**: 自分で数字を動かす。「答えを出してもらう」導線は作らない

## コマンド
| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー |
| `pnpm build` | ビルド |
| `pnpm lint` | ESLint |
| `pnpm test` | vitest実行（191本） |
| `pnpm test:watch` | vitestウォッチ |
| `pnpm run case-sim` | ケース台帳シミュレーション（C01-C18） |
| `npm run check:store` | SoTガードレールチェック |

## コーディング規約
- UIコンポーネントは shadcn/ui を使用
- スタイリングは Tailwind CSS
- 金額の単位は万円（`formatCurrency()` で億円表示に自動変換）
- UI は日本語
- カラーパレット: Night #1A1916 / Linen #F0ECE4 / Gold #C8B89A / テキスト #5A5550 / 背景 #FAF9F7 / アクセント #8A7A62
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

## フェーズ計画

### 完了
- **Phase A**: モバイル基盤修正（overflow-x-hidden、ボトムナビ導入）
- **Phase B**: ページ再構成（/branch, /worldline, /profile 新設 + エンジン接続）
- **Phase B-fix**: ダッシュボード復元（入力カード + 結果タブの3カラム構成を維持）
- **LP・FitGate統合**: / → LP、/app/* → プロダクト、FitGate 12問 + 判定ロジック
- **Phase E**: 横スクロール根絶 + SVGベジェ曲線化 + ブランドストーリー連携
- **Phase F**: イベントカタログ復元（23プリセット + 3バンドル + ダイアログUI）
- **Phase G-1**: デッドコード削除（旧タイムライン・旧ページ・未使用export除去）
- **Phase G-2**: 世界線比較を3タブ化・コンポーネント削減
- **張りぼて監査**: 接続率 75% → 97%（AdvancedInputPanel削除、HousingPlanCard store接続）

### 将来
- **Phase 2**: Supabase導入（認証 + DB）。localStorage → DB移行
- **Phase 3**: Stripe連携（Pass課金）。アクセス制御（Pass未購入者はプロダクトにアクセスできない）

## 既知のTODO
- パートナーの収入イベントによる年金額への影響（`engine.ts` L242）
- metadataBase 未設定（OGP用）
- SendGrid 連携（FitGate メール送信のスタブ実装を本番化）
