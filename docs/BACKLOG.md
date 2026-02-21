# YOHACK Product Backlog

> **運用ルール**
> - `status`: todo / running / done / skip
> - Claude Codeへの指示は `### instructions` ブロックに完全記述
> - 完了条件を必ず明記。曖昧な指示は書かない
> - バックログ追加は末尾に。優先度変更はpriority数値を変更
> - このファイル自体をgit管理する（変更履歴がバックログの進捗記録になる）

---

## P0-1: フレイキーテスト修正
status: done
priority: 0
estimate: S

### context
251/252 通過中。失敗は `postRetireIncomeEndAge < retireAge` のケースでモンテカルロ分散による不安定なアサーション。

### instructions
```
以下を実行してフレイキーテストを修正する。

1. pnpm test 2>&1 を実行して失敗しているテストを特定する
2. 失敗テスト: "退職後収入なし" に関するテストを lib/ 以下で探す
3. 原因: モンテカルロシミュレーションの分散により、境界値でテストが不安定
4. 修正方針: アサーションの許容範囲を広げる（exactマッチ → rangeチェック）
   または、テスト用のシード固定（Math.random をモック）で再現性を確保する
5. pnpm test を3回実行して全て252/252 passed になることを確認
6. git add -A && git commit -m "fix: stabilize flaky Monte Carlo test"

完了条件: pnpm test を3回連続実行して全て252/252 passed
```

---

## P0-2: metadataBase 設定（OGP対応）
status: todo
priority: 0
estimate: S

### context
app/layout.tsx の metadataBase が未設定。InstagramのbioリンクからLP訪問時にOGPが表示されない。

### instructions
```
1. app/layout.tsx を開く
2. metadata オブジェクトに以下を追加:
   metadataBase: new URL('https://yohack.jp')
   
   また以下のOGP設定を追加:
   openGraph: {
     title: 'YOHACK — 人生の選択肢を世界線で比較する',
     description: 'この家を買ったあと、年収が20%下がっても、まだ動けるか。世界線比較で確認する。',
     url: 'https://yohack.jp',
     siteName: 'YOHACK',
     locale: 'ja_JP',
     type: 'website',
   },
   twitter: {
     card: 'summary_large_image',
     title: 'YOHACK — 人生の選択肢を世界線で比較する',
     description: 'この家を買ったあと、年収が20%下がっても、まだ動けるか。',
   }

3. pnpm build でエラーなし確認
4. git add app/layout.tsx && git commit -m "feat: add metadataBase and OGP tags"

完了条件: pnpm buildが通り、metadataBaseの警告が消える
```

---

## P1-1: /app/branch への導線追加
status: todo
priority: 1
estimate: S

### context
ConclusionSummaryCardから分岐ビルダーへの導線が存在しない。世界線3本作成（Activation KPI）の入り口が見えていない。

### instructions
```
1. components/dashboard/ConclusionSummaryCard.tsx を開く
2. 世界線テンプレートボタン群の最下部に以下を追加:

   <div className="mt-4 pt-4 border-t border-border">
     <p className="text-xs text-muted-foreground mb-2">
       もっと詳しく分岐を設計したい場合
     </p>
     <a
       href="/app/branch"
       className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8B89A] hover:text-[#8A7A62] transition-colors"
     >
       分岐ビルダーを使う
       <span aria-hidden="true">→</span>
     </a>
   </div>

3. 既存のテンプレートボタン群は変更しない
4. pnpm build 確認
5. git add -A && git commit -m "feat: add branch builder CTA to ConclusionSummaryCard"

完了条件: ダッシュボードのConclusionSummaryCardに「分岐ビルダーを使う」リンクが表示される
```

---

## P1-2: Alpha Tester 向け利用状況ログ
status: todo
priority: 1
estimate: M

### context
Alpha testerが世界線を何本作ったか把握できない。Activation KPI（世界線3本作成）を計測できる最小限のログ機構が必要。localStorage + window.dispatchEvent で計測し、後でSupabaseに移行する。

### instructions
```
1. lib/analytics.ts を新規作成:

   export type AnalyticsEvent = 
     | { type: 'worldline_created'; count: number }
     | { type: 'branch_viewed' }
     | { type: 'simulation_run' }

   export function trackEvent(event: AnalyticsEvent) {
     // localStorage に蓄積
     const key = 'yohack_events'
     const existing = JSON.parse(localStorage.getItem(key) || '[]')
     existing.push({ ...event, timestamp: new Date().toISOString() })
     localStorage.setItem(key, JSON.stringify(existing))
     
     // コンソールにも出力（alpha期間のデバッグ用）
     console.log('[YOHACK Analytics]', event)
   }

   export function getWorldlineCount(): number {
     const events = JSON.parse(localStorage.getItem('yohack_events') || '[]')
     return events.filter((e: any) => e.type === 'worldline_created').length
   }

2. app/app/worldline/page.tsx で世界線作成時に trackEvent({ type: 'worldline_created', count: getWorldlineCount() + 1 }) を呼ぶ

3. app/app/branch/page.tsx で分岐ビルダー表示時に trackEvent({ type: 'branch_viewed' }) を呼ぶ

4. pnpm build && pnpm test 確認
5. git add -A && git commit -m "feat: add lightweight analytics for alpha KPI tracking"

完了条件: 世界線作成時にlocalStorageのyohack_eventsにイベントが記録される
```

---

## P1-3: FitGate UX改善（12問→体感短縮）
status: todo
priority: 1
estimate: M

### context
FitGateは12問あるが、完了率60%+を目標にしている。現在の完了率不明。プログレスバー追加と質問順序の最適化で離脱を減らす。

### instructions
```
1. app/fit/page.tsx を開いて現在の構造を確認
2. 以下を改善:
   a. 画面上部にステップ数プログレスバー追加（例: 「3 / 12」+ 進捗バー）
   b. 最初の3問を最も「刺さる」質問にする（年収・物件価格帯・年齢）
      → この3問で「自分のことだ」と思わせて離脱を防ぐ
   c. 各質問に小さなラベルを追加（例: 「ステップ 1: 基本情報」）
3. デザインはYOHACKのカラーパレット踏襲（#C8B89A, #5A5550, #FAF9F7）
4. pnpm build 確認
5. git add -A && git commit -m "feat: improve FitGate UX with progress bar and question reorder"

完了条件: FitGateにプログレスバーが表示され、最初の質問が年収・物件価格帯・年齢になっている
```

---

## P2-1: Supabase 導入（認証基盤）
status: todo
priority: 2
estimate: L

### context
現在localStorage永続化のみ。決済後のアクセス制御・複数デバイス対応・FitGate回答→プロファイル自動プリセットに必要。

### instructions
```
1. pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

2. .env.local に以下を追加（値はプレースホルダー、実際の値は環境変数で注入）:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

3. lib/supabase.ts を新規作成:
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )

4. app/app/layout.tsx に Supabase の SessionProvider を追加（認証状態管理）

5. 認証なしでも /app/* にアクセス可能な状態を維持する（alpha期間は認証必須にしない）
   → middleware.ts で /app/* は認証チェックをスキップ（将来の切り替え用にコードだけ書く）

6. CLAUDE.md の「認証/決済」セクションを「Supabase導入済み（認証未強制）」に更新

7. pnpm build 確認（.env.local のプレースホルダーでビルドが通ること）
8. git add -A && git commit -m "feat: add Supabase client foundation (auth not enforced)"

完了条件: pnpm buildが通り、lib/supabase.tsが存在し、middleware.tsに認証スキップのコードがある
```

---

## P2-2: LP改修（Instagram流入最適化）
status: todo
priority: 2
estimate: M

### context
app/page.tsx（325行）が現在のLP。yohack-lp-design.md の7セクション構成に改修する。
チラ見せ動画は後回し（S3でスタブ表示）。

### instructions
```
yohack-lp-design.md を読んで、app/page.tsx を以下の7セクション構成に改修する。

セクション構成:
S1: ヒーロー（「この家を買ったあと、年収が20%下がっても、まだ動けるか」）
S2: ケース例2本（C01/C02ベース。前提条件＋結論だけ。過程は見せない）
S3: 3つの軸（世界線・安心ライン・余白）
S4: フラットな立場宣言（3行）
S5: 向いている人/向いていない人
S6: FAQ 4問
S7: CTA → /fit（FitGateへ）

デザイン制約:
- カラー: #C8B89A（ゴールド）, #5A5550（テキスト）, #FAF9F7（背景）, #8A7A62（アクセント）
- フォント: DM Sans + Noto Sans JP（既存のglobals.cssに従う）
- 価格（¥29,800）は表示しない
- 「購入」「申し込み」という言葉は使わない。「確認する」「チェックする」を使う
- YBranchシンボル（SVG: Y字分岐）をアクセントとして使用
- チラ見せ動画はスタブ（グレーボックス＋「準備中」）でOK

既存のapp/page.tsxを完全に書き換える。
pnpm build 確認。
git add app/page.tsx && git commit -m "feat: redesign LP for Instagram traffic (S1-S7)"

完了条件: / にアクセスすると7セクションのLPが表示され、CTAが/fitに遷移する
```

---

## P2-3: Stripe 決済導入
status: todo
priority: 2
estimate: L

### context
P2-1（Supabase）完了後に着手。¥29,800/90日のPass購入→アクセス権付与の一気通貫。

### instructions
```
前提: P2-1（Supabase導入）が完了していること。

1. pnpm add stripe @stripe/stripe-js

2. .env.local に追加:
   STRIPE_SECRET_KEY=sk_test_...（プレースホルダー）
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...（プレースホルダー）
   STRIPE_WEBHOOK_SECRET=whsec_...（プレースホルダー）

3. app/api/checkout/route.ts を新規作成:
   - POST: Stripe Checkout Session を作成（¥29,800, 90日Pass）
   - success_url: /app/onboard?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /fit/result

4. app/api/webhook/route.ts を新規作成:
   - checkout.session.completed イベントを受信
   - Supabaseの pass_subscriptions テーブルにレコード作成
   - ユーザーのアクセス権を有効化

5. app/fit/result/page.tsx（Readyページ）に「YOHACKを始める ¥29,800」ボタンを追加
   → /api/checkout に POST → Stripe Checkout にリダイレクト

6. Supabaseに以下のテーブルスキーマをSQLで用意:
   pass_subscriptions (
     id uuid primary key,
     user_id uuid references auth.users,
     stripe_session_id text,
     started_at timestamptz,
     expires_at timestamptz,
     created_at timestamptz default now()
   )

7. pnpm build 確認
8. git add -A && git commit -m "feat: add Stripe checkout and pass subscription"

完了条件: /fit/resultに決済ボタンが表示され、/api/checkoutがStripe Checkout URLを返す
```

---

## P3-1: Instagram自動化パイプライン構築
status: todo
priority: 3
estimate: L

### context
n8n + Claude API + Puppeteer + Instagram Graph API。週25分運用（日曜15分手動承認）の実現。詳細はyohack-e2e-funnel.jsxのautomationMapを参照。

### instructions
```
scripts/instagram/ ディレクトリを作成して以下を実装する。

1. scripts/instagram/generate-carousel.js
   - QxCマッピング（Q問1-20 × Cケース1-18）から今週分を選定
   - Claude API（claude-sonnet-4-6）で4枚のカルーセルHTMLを生成
   - Q型テンプレート / C型テンプレートを使い分ける（yohack-instagram-account-design.jsxの仕様通り）
   - カラー: #C8B89A, #5A5550, #FAF9F7

2. scripts/instagram/render-carousel.js
   - generate-carousel.js の出力HTMLをPuppeteerでJPEG変換
   - 1080×1350px（4:5比率）で書き出し
   - output/week-YYYY-MM-DD/ に保存

3. scripts/instagram/post-to-instagram.js
   - Instagram Graph API でカルーセル投稿
   - INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID を環境変数から読む

4. scripts/instagram/approve-server.js
   - Telegram Bot（TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID）でプレビュー送信
   - [✅ 投稿する] [✏️ 修正] ボタン
   - 承認後に post-to-instagram.js を実行

5. package.json に以下を追加:
   "instagram:generate": "node scripts/instagram/generate-carousel.js",
   "instagram:preview": "node scripts/instagram/approve-server.js",
   "instagram:post": "node scripts/instagram/post-to-instagram.js"

6. scripts/requirements-instagram.txt:
   puppeteer, @anthropic-ai/sdk, node-telegram-bot-api

7. git add -A && git commit -m "feat: Instagram automation pipeline (generate→approve→post)"

完了条件: npm run instagram:generate でHTMLファイルが生成され、npm run instagram:preview でTelegramにプレビューが届く
```

---

## P3-2: 1on1 裏メニュートリガー
status: todo
priority: 3
estimate: S

### context
世界線3本作成 or 60日経過でアプリ内に1on1（¥50,000）の案内を表示。Pass購入者だけが知る最深部。

### instructions
```
1. lib/analytics.ts（P1-2で作成）の getWorldlineCount() を使う
2. hooks/useSession1on1Trigger.ts を新規作成:

   export function useSession1on1Trigger() {
     const [shouldShow, setShouldShow] = useState(false)
     
     useEffect(() => {
       const worldlineCount = getWorldlineCount()
       const purchasedAt = localStorage.getItem('yohack_purchased_at')
       
       if (!purchasedAt) return // Pass未購入者には表示しない
       
       const daysSincePurchase = purchasedAt 
         ? (Date.now() - new Date(purchasedAt).getTime()) / (1000 * 60 * 60 * 24)
         : 0
       
       if (worldlineCount >= 3 || daysSincePurchase >= 60) {
         setShouldShow(true)
       }
     }, [])
     
     return shouldShow
   }

3. components/dashboard/Session1on1Banner.tsx を新規作成:
   - shouldShow が true の時だけ表示
   - 「プロと一緒に最終判断を整理したい方へ」というコピー
   - 「1on1セッションについて（¥50,000）」リンク → /pricing または外部申込みページ
   - 閉じるボタンあり（localStorage に dismissed フラグ保存）

4. app/app/page.tsx のダッシュボードにSession1on1Bannerを追加

5. git add -A && git commit -m "feat: add 1on1 session upsell trigger (3 worldlines or 60 days)"

完了条件: localStorage に yohack_purchased_at を手動セットし、世界線を3本作成するとバナーが表示される
```

---

## P4-1: vitest カバレッジ拡充
status: todo
priority: 4
estimate: M

### context
現在252テストはcalc-core.ts中心。housing-sim.ts, branch.ts, fitgate.ts のカバレッジが薄い。

### instructions
```
1. pnpm test --coverage でカバレッジレポートを確認
2. カバレッジが50%以下のファイルを特定
3. 優先順位: housing-sim.ts → branch.ts → fitgate.ts の順でテスト追加
4. 各ファイルで最低80%カバレッジを目標
5. pnpm test で全テスト通過確認
6. git add -A && git commit -m "test: add coverage for housing-sim, branch, fitgate"

完了条件: 全体カバレッジ70%以上、各主要ファイル60%以上
```

---

## P4-2: FitGate → プロファイル自動プリセット
status: todo
priority: 4
estimate: M

### context
FitGate回答をYOHACKのプロファイルに自動反映。P2-1（Supabase）完了後に本実装。現在は localStorage経由の仮実装を先行。

### instructions
```
1. lib/fitgate.ts の回答データ構造を確認
2. lib/fitgate-to-profile.ts を新規作成:
   FitGate回答 → store.ts の Profile 型に変換するアダプター
   
   マッピング（yohack-lp-design.mdのFitGate→YOHACKプリセット対応表に従う）:
   - 個人年収レンジ → grossIncome
   - 世帯年収レンジ → grossIncome + partnerGrossIncome
   - 年齢 → currentAge
   - 家族構成 → mode (solo/couple)
   - 現在の家賃（月額） → housingCostAnnual（×12）
   - 検討物件価格帯 → 住宅プラン初期値
   - 貯蓄+投資 → assetCash + assetInvest（50/50で按分）

3. /fit/result の Ready判定後、localStorage に fitgate_responses を保存
4. /app 初回訪問時に fitgate_responses があればプロファイルに自動適用
5. pnpm test で既存テスト全通過確認
6. git add -A && git commit -m "feat: auto-preset profile from FitGate responses"

完了条件: FitGateを完了してReadyになった後、/appを開くとプロファイルに値が自動入力されている
```
