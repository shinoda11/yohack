# CLAUDE.md

## プロジェクト概要
YOHACK — 住宅購入の意思決定を「世界線比較」で支援するシミュレーター。
モンテカルロシミュレーション（1,000回、100歳まで）で住宅・キャリア・家族の選択肢を並走比較する。
物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保する設計。

対象: 世帯年収 1,000〜3,000万円の DINKs / プレDINKs、都市部在住、28〜42歳。
収益: Pass ¥29,800/90日。運営者 = 開発者 = 1人。

## コマンド
| コマンド | 用途 |
|---------|------|
| `pnpm dev` | 開発サーバー |
| `pnpm build` | ビルド |
| `pnpm lint` | ESLint |
| `pnpm test` | vitest |
| `pnpm run case-sim` | ケース台帳シミュレーション |
| `npm run check:store` | SoTガードレールチェック |

## 技術スタック
- Next.js + React + TypeScript
- Zustand（状態管理）、Recharts（グラフ）
- shadcn/ui + Tailwind CSS
- Vercel（GitHub main ブランチ連携）
- vitest（テスト）
- Framer Motion（LPアニメーション）
- html-to-image → Web Share API（結果共有）
- **未導入（Phase 2以降）**: Supabase, Stripe, SendGrid → `docs/constraints.md` 参照

## ルーティング

### 公開（認証なし）
| パス | 用途 |
|------|------|
| `/` | → `redirect('/lp')` |
| `/lp` | LP（Route Group `(marketing)`） |
| `/fit` | FitGate（12問 → メアド → 判定） |
| `/fit/result` | FitGate判定結果 |
| `/fit/prep` | Prep Mode案内 |
| `/pricing` | 料金 |
| `/legal/*` | 利用規約・プライバシー・特商法 |

### プロダクト（Basic認証 `/app/*`）
| パス | 用途 |
|------|------|
| `/app` | メインダッシュボード |
| `/app/branch` | 分岐ビルダー |
| `/app/profile` | プロファイル入力 |
| `/app/worldline` | 世界線比較（3タブ） |
| `/app/settings` | 設定 |

認証: `proxy.ts` で `/app/*` にBasic認証。
共通レイアウト: `app/app/layout.tsx`（Sidebar + MobileHeader + BottomNav）

## アーキテクチャ原則

### Single Source of Truth (SoT)
- `lib/store.ts` がアプリ全体の状態管理の唯一の場所
- `lib/v2/store.ts` は世界線比較の UI 状態専用。唯一の許可された例外
- **第三のストアを絶対に作らない**
- 違反チェック: `npm run check:store`

### calc-core 共通化
- `lib/calc-core.ts` が engine.ts と housing-sim.ts の共通計算ロジックを一元管理
- パリティテスト（`calc-parity.test.ts`）で整合性を自動検証

### ダッシュボード ↔ 分岐ビルダーのデータフロー
- ダッシュボードは `profile.lifeEvents` を表示のみ（直接編集UIなし）
- 分岐ビルダーは `buildProfileForCandidate()` で profile をコピー+マージして一時プロファイルを作成。元の profile は変更しない
- `loadScenario()` は破壊的操作: 現在の profile が完全に上書きされる
- シナリオは生成時のスナップショット: 後から profile を変更しても反映されない
- エンジンが無視するイベント型: `child_birth`, `education`, `asset_purchase`, `retirement_partial`

### localStorage 永続化
- プロファイルとシナリオは localStorage に保存
- シミュレーションは profile 変更時に自動で debounce（150ms）実行

## コーディング規約
- UI: shadcn/ui + Tailwind CSS
- 金額: 万円単位（`formatCurrency()` で億円表示に自動変換）
- 言語: 日本語
- `'use client'` ディレクティブ必須
- 免責表示: 計算結果を表示するすべての画面に記載
- モバイルファースト（タッチターゲット 44px 以上）

### カラー
- ブランド: Night #1A1916 / Linen #F0ECE4 / Gold #C8B89A / Stone #5A5550 / Canvas #FAF9F7 / Bronze #8A7A62
- スコア状態: `text-safe`/`bg-safe`（良好）、`text-danger`/`bg-danger`（危険）
- UI状態: `success`/`destructive`（shadcn/ui標準）
- **混在禁止**: スコア表示に `success` を使わない
- チャート: `CHART_COLORS`（`lib/utils.ts`）

### スペーシング
- カード間: `space-y-4` or `gap-4`
- カード内フォーム要素間: `space-y-6`
- カード内情報表示要素間: `space-y-4`

## デザイン原則

### 決断の静けさ（Design Philosophy）
YOHACKは ¥29,800 のプレミアムプロダクト。Apple/Porsche/Aesop水準の静謐さを目指す。

- **数字で語る、形容詞で語らない**: 「目標に近づいています」→「52歳で安心ライン到達。目標より3年の余白。」
- **FPアドバイスは出さない**: 「iDeCo拠出を最大化」「貯蓄率を上げましょう」等の助言は禁止。LP宣言「答えを出さない、土台を返す」と整合させる
- **絵文字禁止**: アイコンは Lucide（`components/branch/event-icon.tsx` の EventIcon）で統一
- **カラーはトークンのみ**: emerald-600, amber-600, red-700 等の直値禁止。`--safe`, `--danger`, `--brand-gold`, `--brand-bronze` を使う
- **警告表現は最小限**: 赤背景+赤ボーダー+AlertTriangleの三重表現を禁止。数値が低い場合は `brand-bronze` で静かに伝える
- **SectionCard の description は非表示**: カードヘッダーはアイコン+タイトルのみ

### ダッシュボード構造（確定済み）
- ダッシュボードは1カラムレイアウト。入力カードは `<details>` で折りたたみ（デフォルト閉）
- ConclusionSummaryCard にスコア数字は表示しない（ExitReadinessCard に一本化）
- NextBestActionsCard は削除済み（ブランドボイス違反のため）。復活させない
- mobileTab による入力/結果切り替えは廃止済み。モバイルもデスクトップも同じ1カラム構造

## 絶対にやらないこと
- Phase1 で Supabase / Stripe / SendGrid を導入しない（`docs/constraints.md`）
- 新規 npm パッケージの導入は事前承認が必要
- 物件紹介・保険紹介・投資商品紹介の機能を入れない
- 「買うべき/買わないべき」の結論を提示しない

## バックログ実行ルール
- `docs/product-backlog.md` がタスク管理の唯一のSoT
- 実行前に `docs/constraints.md` を必ず読む
- 変更してよいファイルはタスクに明示されたもののみ
- 既存テストが全件passしていることを確認してからコミット

## デザインスプリント（DS）ワークフロー
1. 調査 → `docs/ds-audit/DS-X-before.md`
2. 設計 → `docs/ds-audit/DS-X-design.md`
3. 実行 → 設計書の差分のみ適用
4. 検査 → `docs/ds-audit/DS-X-after.md`

## エンジン仕様
- スコア重み: survival 55% / lifestyle 20% / risk 15% / liquidity 10%
- 税金・年金: 自動計算（累進課税7段階 + 報酬比例年金）
- 感度分析: `investReturn` のみ有意（±31スコア）、他は ≤4
- デフォルト: 35歳/solo/年収1,200万/資産2,500万/家賃月15万/リターン5%/インフレ2%
