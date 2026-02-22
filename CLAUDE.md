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
- Next.js 16 + React 19.2 + TypeScript 5.9
- Zustand 5（状態管理）、Recharts（グラフ）
- shadcn/ui + Tailwind CSS 4.1（UI）
- Vercel（デプロイ、GitHub main ブランチ連携）
- テスト: vitest 252本（`lib/__tests__/` に6ファイル、testTimeout: 30,000ms）
- 結果共有: html-to-image で PNG 生成 → Web Share API / ダウンロードフォールバック
- **未導入**: Supabase（認証）、Stripe（決済）、SendGrid（メール）→ すべて Phase 2-3

## ルーティング構造

### リクエストの流れ
```
ブラウザ → Vercel → proxy.ts（Basic認証: /app/* のみ）→ Next.js ルーター
```
- `/` → `redirect('/lp')` → LP表示（`app/(marketing)/lp/page.tsx`）
- `/app/*` → `proxy.ts` でBasic認証（`SITE_PASSWORD` 環境変数）→ 認証通過後に各ページ表示
- `/fit`, `/pricing`, `/legal/*` → 認証なし、直接表示

### 公開ページ（認証なし）
| パス | 実体ファイル | 用途 |
|------|-------------|------|
| `/` | `app/page.tsx` → redirect('/lp') | LPへリダイレクト |
| `/lp` | `app/(marketing)/lp/page.tsx` | LP（7セクション。Instagram → LP → FitGate の入口） |
| `/fit` | `app/fit/page.tsx` | FitGate（12問 → メアド入力 → 判定結果） |
| `/fit/result` | `app/fit/result/page.tsx` | FitGate 判定結果（Ready / Prep） |
| `/fit/prep` | `app/fit/prep/page.tsx` | Prep Mode 案内 |
| `/pricing` | `app/pricing/page.tsx` | 料金ページ |
| `/legal/terms` | `app/legal/terms/page.tsx` | 利用規約 |
| `/legal/privacy` | `app/legal/privacy/page.tsx` | プライバシーポリシー |
| `/legal/commercial` | `app/legal/commercial/page.tsx` | 特商法 |

### プロダクト（Basic認証 `/app/*`）
| パス | 実体ファイル | 用途 |
|------|-------------|------|
| `/app` | `app/app/page.tsx` | メインダッシュボード（入力カード + 結果タブ） |
| `/app/branch` | `app/app/branch/page.tsx` | 分岐ビルダー |
| `/app/profile` | `app/app/profile/page.tsx` | プロファイル入力（単カラム） |
| `/app/worldline` | `app/app/worldline/page.tsx` | 世界線比較（3タブ） |
| `/app/settings` | `app/app/settings/page.tsx` | 設定（データ管理・バージョン情報） |

共通レイアウト: `app/app/layout.tsx`（Sidebar + MobileHeader + BottomNav）

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
  page.tsx              ← / → redirect('/lp')
  layout.tsx            ← ルートレイアウト
  not-found.tsx         ← 404ページ
  (marketing)/
    lp/page.tsx         ← LP（Route Group: URLは /lp）
    lp-client.tsx       ← LP クライアントコンポーネント
  fit/                  ← FitGate（12問 + メアド収集 + 判定結果 + Prep）
    layout.tsx            ← FitGate専用レイアウト（ロゴヘッダー + 中央寄せ）
    page.tsx, result/page.tsx, prep/page.tsx
  app/
    page.tsx            ← メインダッシュボード（750行、最大のファイル）
    branch/page.tsx     ← 分岐ビルダー
    profile/page.tsx    ← プロファイル入力
    worldline/page.tsx  ← 世界線比較
    settings/page.tsx   ← 設定
    layout.tsx          ← プロダクト共通レイアウト（Sidebar + MobileHeader + BottomNav + Basic認証）
  pricing/page.tsx      ← 料金
  legal/                ← 利用規約・プライバシー・特商法

components/
  dashboard/            ← 20ファイル（入力カード・結果カード・オンボーディング）
  branch/               ← 8ファイル（branch-tree-viz, branch-timeline, branch-category,
                           branch-node, worldline-preview, event-picker-dialog,
                           event-customize-dialog, event-icon）
  v2/                   ← 3ファイル（V2ResultSection, V2ComparisonView, MoneyMarginCard）
  layout/               ← 5ファイル（sidebar, bottom-nav, mobile-header, brand-story-dialog, yohack-symbol）
  ui/                   ← 26ファイル（shadcn/ui）

lib/
  calc-core.ts          ← engine/housing-sim 共通計算ロジック
  engine.ts             ← モンテカルロシミュレーション
  housing-sim.ts        ← 住宅シミュレーション
  store.ts              ← Zustand SoT
  branch.ts             ← 分岐ビルダーロジック
  event-catalog.ts      ← ライフイベントプリセット23種 + バンドル3種
  types.ts              ← 型定義
  fitgate.ts            ← FitGate判定 + Profile変換 + メアド収集
  utils.ts              ← ユーティリティ + CHART_COLORS
  v2/                   ← 5ファイル（adapter, margin, store, worldline, readinessConfig）
  __tests__/            ← 6テストファイル（252テスト）

hooks/                  ← 8ファイル

docs/
  product-backlog.md      ← バックログ唯一のSoT（machine-readable形式）
  constraints.md          ← 制約定義（バックログ実行前に必読）
  roadmap.md              ← Phase2-3ロードマップ
  CHANGELOG.md            ← 変更ログ
  lp-design.md            ← LP設計書
  YOHACK_DESIGN_PHILOSOPHY.md ← デザイン哲学
  case-catalog-results.md ← 24ケースの賃貸vs購入比較結果
  sensitivity-analysis.md ← 感度分析結果
  quality-audit.md        ← 品質監査結果
  ds-audit/               ← デザインスプリント監査（before/design/after）
  fitgate-reference/      ← 旧リポから抽出した移植対象コード（参照用）
  snapshot/               ← 自動生成コード状態スナップショット
  archive/                ← 完了済みフェーズ設計書

scripts/
  run-backlog.sh          ← バックログ自動消化ランナー（Telegram通知付き）
  case-catalog-sim.ts     ← ケース台帳シミュレーション
  sensitivity-analysis.ts ← 感度分析
  check-store-sot.js      ← SoTガードレールチェック
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
  - `hiddenDefaultBranchIds`: 非表示デフォルトブランチ（undefined の場合は空配列に初期化）
- `lib/v2/store.ts` は世界線比較の UI 状態専用（計算結果は持たない）。唯一の許可された例外
- 第三のストアを絶対に作らない
- 各ページ/コンポーネントは `useProfileStore()` から参照のみ。独自に `runSimulation` を呼び出さない
- 違反チェック: `npm run check:store`

### calc-core 共通化
- `lib/calc-core.ts` が engine.ts と housing-sim.ts の共通計算ロジックを一元管理
- 抽出済み10関数: calculateEffectiveTaxRate, getEstimatedTaxRates, calculateAverageGrossIncome, calculatePersonPension, calculateAnnualPension, calculateIncomeAdjustment, calculateRentalIncome, calculateNetIncomeForAge, calculateExpensesForAge, calculateAssetGainForAge
- engine.ts は calc-core を import して re-export（後方互換）
- housing-sim.ts は calc-core を直接 import
- パリティテスト（`calc-parity.test.ts`、61件）で engine/housing-sim の整合性を自動検証

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存（Phase 2 で Supabase DB に移行予定）
- シミュレーションは profile 変更時に自動で debounce（150ms）実行
- FitGate 回答データ + メールアドレスも localStorage に保存

### 張りぼて監査の結果
- 接続率 97%（33/34項目）。AdvancedInputPanel は全削除済み
- 唯一の部分接続: `profile.mortgageInterestRate`（保留）
- 詳細は `HARIBOTE-AUDIT.md`

## ダッシュボードレイアウト骨格 (`app/app/page.tsx` — 750行)

### 全体構造
```
L349  <header> sticky ヘッダー「ダッシュボード」
L362  <main>
L364    OnboardingSteps             ← 初回訪問ガイド
L367    ProfileCompleteness         ← 入力完了度
L370    世界線ガイダンスバナー        ← scenarios.length === 0 のとき
L389    初回訪問バナー               ← サンプルデータ表示中の案内
L411    ConclusionSummaryCard       ← ヒーロー（スコア + 次の一手）※常時表示
L430    モバイル: 入力/結果 タブバー   ← md未満のみ表示
L457    <grid lg:grid-cols-[1fr_2fr]>
          左カラム（入力）  L459-L513
          右カラム（結果）  L516-L738
L743  WelcomeDialog               ← 初回ウェルカムダイアログ
```

### 左カラム: 入力カード（L459-L513）
| # | 行 | カード | 種別 | 説明 |
|---|-----|--------|------|------|
| 1 | L461 | ProfileSummaryCard | 読み取り専用 | 前提表示（年齢/世帯/家賃/資産）。「編集 →」で `/app/profile` に遷移 |
| 2 | L464 | IncomeCard | レバー | 本人年収・パートナー年収・副業収入 |
| 3 | L474 | RetirementCard | レバー | リタイア年齢スライダー・退職後事業収入・終了年齢 |
| 4 | L483 | ExpenseCard | レバー | 生活費のみ（`hideHousing` で家賃非表示） |
| 5 | L494 | InvestmentCard | レバー | 期待リターン・インフレ率 |
| 6 | L506 | HousingPlanCard | レバー | 住宅シナリオ設定 |

### 右カラム: 結果カード（L516-L738）

**モバイル（L518-L575）**: フラットリスト（タブなし）
| 行 | カード |
|-----|--------|
| L537 | ExitReadinessCard（スコア円グラフ） |
| L541 | KeyMetricsCard（安心ライン・余白維持率等） |
| L547 | AssetProjectionChart（資産推移グラフ） |
| L554 | NextBestActionsCard（次のアクション提案） |
| L561 | CashFlowCard（退職後キャッシュフロー） |
| L568 | MonteCarloSimulatorTab（確率分布） |
| L574 | ScenarioComparisonCard（世界線比較） |

**デスクトップ（L578-L737）**: 3タブ（サマリー / 確率分布 / 世界線）
- サマリータブ（L591）: ExitReadinessCard → KeyMetricsCard → AssetProjectionChart → NextBestActionsCard → CashFlowCard
- 確率分布タブ（L708）: MonteCarloSimulatorTab
- 世界線タブ（L718）: ScenarioComparisonCard + ExitReadinessCard + KeyMetricsCard

### 注意
- BasicInfoCard / AssetCard はダッシュボードから除外（`/app/profile` のみに存在）
- LifeEventsSummaryCard もダッシュボードから除外（分岐ビルダー `/app/branch` で管理）
- ExitReadinessCard 内に折りたたみベンチマークセクション（`lib/benchmarks.ts` の C01-C24 データ参照）

## エンジン仕様 (`lib/calc-core.ts` + `lib/engine.ts`)

### 税金・社保（自動計算） — `calc-core.ts`
- `calculateEffectiveTaxRate`: 給与所得控除（6段階）→ 社保（厚生年金+健保+雇用）→ 基礎控除（高所得段階縮小）→ 累進所得税（7段階）+ 住民税10% + 復興税2.1%
- `getEstimatedTaxRates`: auto/manual切替。couple時は個人別税率で加重平均
- `useAutoTaxRate: true` がデフォルト。手動入力の `effectiveTaxRate` はフォールバック

### 年金（収入連動・報酬比例方式） — `calc-core.ts`
- `calculateAnnualPension`: 基礎年金80万円（加入年数/40按分）+ 厚生年金（報酬比例: avgMonthly × 5.481/1000 × 月数、月額上限65万）
- couple モードでは配偶者年金を別計算で加算
- 年金用平均年収は22歳〜60歳の加重平均で算出（LifeEvent の income_increase/decrease を反映）

### 収入・支出・資産計算 — `calc-core.ts`
- `calculateNetIncomeForAge`: 退職前は個人別税率で手取り計算、退職後は年金(65歳〜)+事業収入+賃貸収入
- `calculateIncomeAdjustment`: income_increase / income_decrease を self/partner 別に適用
- `calculateRentalIncome`: 賃貸収入（退職後も継続）
- `calculateExpensesForAge`: 生活費×インフレ + 住居費（owner固定/renterインフレ） + イベント増減×インフレ + 退職後multiplier
- `calculateAssetGainForAge`: 一時的資産増（相続・退職金等、指定年齢のみ）
- housing_purchase: 頭金+諸費用の一括消費 → 住宅ローン返済開始
- **TODO**: パートナーの収入イベントによる年金額への影響は未対応

### スコア重み — `engine.ts`
| 指標 | 重み | 満点条件 |
|------|------|---------|
| survival（生存率） | 55% | survivalRate ≥ 100% |
| lifestyle（生活水準） | 20% | 退職後資産で20年分の支出 |
| risk（リスク耐性） | 15% | riskExposure × volatility が低い |
| liquidity（流動性） | 10% | 60ヶ月分の生活費を現金保有 |

### 感度分析の結論
- **investReturn のみ有意**（±31スコア）。rentInflation / maintenance / rateCap はすべて ≤4
- → 投資リターン設定UI（3%保守的/5%標準/7%積極的のプリセット）は実装済み
- エンジン前提変更時は `pnpm run case-sim` で24ケース再検証

### 退職後事業収入
- `postRetireIncome`: 退職後の年間事業収入（万円、デフォルト0）。顧問・コンサル等
- `postRetireIncomeEndAge`: 事業収入が続く年齢（デフォルト75）
- retireAge〜postRetireIncomeEndAge の間、事業収入を税率20%固定で手取り加算
- 実装: `calculateNetIncomeForAge()` 内（calc-core.ts）

### デフォルトプロファイル（engine.ts `createDefaultProfile()`）
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

### calc-core 接続
- 収入・支出・資産計算は `calc-core.ts` の共通関数を使用
- `calculateExpensesWithOverride`: 住宅コストスケジュールを housingOverrides に変換するブリッジ関数

## 分岐ビルダー (`lib/branch.ts` + `lib/event-catalog.ts` + `/app/branch`)

### 概要
ライフイベントを「確定・計画・不確定」の3カテゴリで整理し、不確定イベントの組み合わせから世界線候補を自動生成する。

### UI構成（2ステップ）
1. **select**: SVG決定木ビジュアル + 水平タイムライン + 3カテゴリの分岐チェックリスト + イベント追加ダイアログ + 「世界線を生成する」ボタン
2. **preview**: 世界線候補リスト（スコア + 差分バッジ）+ 「比較する」ボタン → `/app/worldline` に遷移

### カテゴリ表示
- 3カテゴリ（確定・計画・不確定）は**常に表示**。中身が空でもカテゴリヘッダーと「＋ イベントを追加」ボタンが残る
- 「＋ イベントを追加」ボタンは計画・不確定カテゴリに表示（確定は auto のため非表示）

### デフォルトブランチ (`createDefaultBranches()`)
- **確定**: 年齢を重ねる（auto）、年金受給（auto）
- **計画**: 住宅購入（renter時のみ）、第一子・第二子（couple時のみ）
- **不確定**: 年収ダウン-20%、年収ダウン-30%、ペースダウン（年収-50%）、パートナー退職（couple時のみ）

### イベントカタログ (`lib/event-catalog.ts`)
- 23種のプリセットイベント（5カテゴリ: 家族/キャリア/生活/資産/住宅）
- 3種のバンドル（海外駐在+自宅賃貸、海外駐在(賃貸)、育休パッケージ）
- プリセット → カスタマイズ → Branch 追加のフロー

### ブランチの削除・非表示ルール
- デフォルトブランチ: インラインTrash2アイコンで非表示（`hiddenDefaultBranchIds` に追加）。カスタマイズダイアログ内にも「非表示にする」ボタン
- カスタムブランチ: インラインXボタンで削除
- オーバーライドブランチ: 削除するとデフォルト版を復元
- 非表示ブランチ: ページ下部に「非表示のイベント（N件）」折りたたみセクション（Eyeアイコンで復活）

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
| `pnpm test` | vitest実行（252本） |
| `pnpm test:watch` | vitestウォッチ |
| `pnpm run case-sim` | ケース台帳シミュレーション（C01-C24） |
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

## デザイントークン

### カラートークン（`globals.css` で定義、Tailwind ユーティリティとして使用可能）

| トークン | Tailwind クラス例 | 用途 |
|---------|------------------|------|
| `--brand-gold` / `brand-gold` | `text-brand-gold`, `bg-brand-gold` | CTA、ブランドアクセント |
| `--brand-bronze` / `brand-bronze` | `text-brand-bronze` | サブテキスト、キャプション |
| `--brand-stone` / `brand-stone` | `text-brand-stone` | 本文テキスト |
| `--brand-canvas` / `brand-canvas` | `bg-brand-canvas` | 静かな背景 |
| `--brand-sand` / `brand-sand` | `border-brand-sand` | 細いボーダー |
| `--brand-night` / `brand-night` | `text-brand-night` | 見出し |
| `--brand-linen` / `brand-linen` | `bg-brand-linen` | 背景（= background） |
| `--safe` / `safe` | `text-safe`, `bg-safe` | スコア良好（生存率高い等） |
| `--danger` / `danger` | `text-danger`, `bg-danger` | スコア危険（資金不足等） |

### safe/danger vs success/destructive の使い分け
- `safe` / `danger`: YOHACKスコア・指標の状態表示（生存率、流動性、リスクバー等）
- `success` / `destructive`: shadcn/ui 標準（Toast、フォームバリデーション等のUI状態）
- 混在禁止: スコア表示に `success` を使わない、UI状態に `safe` を使わない

### チャートカラー（`CHART_COLORS` 定数）
- Recharts / Canvas は CSS 変数を直接読めないため、`lib/utils.ts` の `CHART_COLORS` 定数を使用
- `import { CHART_COLORS } from '@/lib/utils'` で参照
- SVG インライン要素では `fill="var(--brand-gold)"` のように CSS 変数を直接使用可能

### トランジション duration
- `--duration-fast` (150ms): hover、collapsible
- `--duration-base` (300ms): 数値変化（デザイン哲学: 0.3s ease）
- `--duration-slow` (600ms): スコアアニメーション

### やらないこと（デザイントークン）
- カスタム typography トークン（Tailwind 標準で十分）
- カスタム spacing トークン（Tailwind 標準で十分）
- shadcn/ui 原本（card.tsx, button.tsx 等）の改変

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
- **R01**: calc-core.ts 共通ロジック抽出 + housing-sim 接続 + パリティテスト252本
- **オンボーディングUX修正**: BrandStoryDialog / 差分バッジ / モバイルタブ初回表示
- **分岐ビルダー修正**: 空カテゴリ常時表示 / DEFAULT_BRANCHES見直し

### 将来
- **Phase 2**: Supabase導入（認証 + DB）。localStorage → DB移行
- **Phase 3**: Stripe連携（Pass課金）。アクセス制御（Pass未購入者はプロダクトにアクセスできない）

## 既知のTODO
- パートナーの収入イベントによる年金額への影響（calc-core.ts 内）
- metadataBase 未設定（OGP用）
- SendGrid 連携（FitGate メール送信のスタブ実装を本番化）

## FitGate 現状と既知の問題

### 実装済みだが未接続・張りぼての箇所

| 箇所 | 現状 | 修正タスク |
|---|---|---|
| Ready判定後の導線 | 無料でダッシュボードへ遷移。Stripe未接続 | P0-FG-3, Phase2でStripe接続 |
| Prep判定後のメール登録 | UIのみ。送信してもどこにも届かない | P0-FG-5 |
| 招待トークン欄 | 全ユーザーに常時表示。「一見さんお断り」と矛盾 | P0-FG-1 |
| FitGate→プロファイルプリセット | 実動作未確認 | P0-FG-4 |
| LP←戻るリンク | FitGateヘッダーに存在しない | P0-FG-2 |
| 「無料で〜」テキスト | Ready画面に残存。¥29,800モデルと矛盾 | P0-FG-3 |

### FitGate → プロファイル変換ルール（`lib/fitgate.ts`）

| FitGate回答 | プロファイルフィールド | 変換値 |
|---|---|---|
| 世帯年収レンジ | grossIncome | レンジ中央値（万円） |
| 年齢レンジ | currentAge | レンジ中央値 |
| 現在の家賃 | housingCostAnnual | 月額中央値 × 12 |
| 検討物件価格帯 | housingPlans[0].price | レンジ中央値 |
| 貯蓄＋投資合計 | assetCash + assetInvest | 合計を 3:7 で按分 |
| 家族構成「夫婦」 | mode | couple |
| 家族構成それ以外 | mode | solo |

### Stripe 接続のフェーズ計画

- **Phase 1（現在）**: FitGate完成・プロファイルプリセット・UI整備
- **Phase 2**: Supabase導入（認証・fitGateResponses・passSubscriptions テーブル）
- **Phase 3**: Stripe Checkout接続。Ready → ¥29,800 Pass購入 → アクセス権付与

## デザイン哲学
docs/YOHACK_DESIGN_PHILOSOPHY.md を参照。
コアコンセプトは「決断の静けさ」。
実装前に必ずデザイン哲学ドキュメントのチェックリストを確認すること。
カラーパレットとタイポグラフィはドキュメントの定義に従う。
