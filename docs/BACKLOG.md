# YOHACK Backlog v2.0

## P0: UI洗練（今週）

### P0-A: ゼロ状態の設計
status: todo
estimate: S
priority: P0
context:
初回訪問・世界線0本の状態が弱い。何をすればいいか直感的でない。
### instructions
1. app/worldline/page.tsx で世界線が0本のとき表示するEmptyStateコンポーネントを作成
2. コピー: 「まず、あなたの家の選択肢を世界線として並べてみましょう」
3. 「最初の世界線を作る →」ボタンを配置（/app/branch へ）
4. ダッシュボードの入力未完了状態にも同様のガイダンスを追加
5. pnpm build && git add -A && git commit -m "feat: add empty state design"

### P0-B: 情報密度の制御
status: todo
estimate: M
priority: P0
context:
ダッシュボードに入力と結果が同一画面に並びすぎ。どこを見ればいいか迷う。
### instructions
1. ダッシュボードの左カラム（入力）と右カラム（結果）の視覚的な重みを調整
2. 結果カードを「最重要1枚」が最初に目に入るよう並び順を見直す
3. 入力カードはデフォルトで折りたたみ、完了済みは小さく表示
4. pnpm build && git add -A && git commit -m "feat: reduce dashboard information density"

### P0-C: 数字の変化に文脈を与える
status: todo
estimate: S
priority: P0
context:
スコアや金額が変わるとき、ただ変わる。変化の意味が伝わらない。
### instructions
1. スコアが変化するとき CSS transition で 600ms かけて変化
2. スコアが上がる→カードに +2px elevation（box-shadow強化）
3. スコアが下がる→カードborderが #CC3333 に 300ms フラッシュ
4. 安心ライン割れの数字: 色だけでなく ⚠️ アイコン + border太さも変化
5. pnpm build && git add -A && git commit -m "feat: animate score changes with context"

### P0-D: モバイル体験の統一
status: todo
estimate: M
priority: P0
context:
3カラムグリッドがモバイルで崩れやすい。
### instructions
1. pnpm dev でモバイルサイズ（375px）を確認
2. ダッシュボードをモバイルで1カラムに統一
3. ボトムナビが全ページで正しく表示されるか確認・修正
4. タップターゲットを最小44×44pxに統一
5. pnpm build && git add -A && git commit -m "fix: unify mobile layout"

---

## P1: Alpha Tester体験（2週間以内）

### P1-1: /app/branch への導線追加
status: done
estimate: S
priority: P1

### P1-2: Alpha Tester向け利用状況ログ
status: todo
estimate: M
priority: P1
context:
アルファテスターが世界線を何本作ったか把握できない。KPI計測が必要。
### instructions
1. lib/analytics.ts を新規作成（localStorageベースのイベントトラッキング）
2. trackEvent(name: string, props?: Record<string, unknown>) を実装
3. 以下のイベントを計測: worldline_created, branch_started, simulation_run, fitgate_started
4. /app/settings または /app/dashboard に「あなたの利用状況」小パネルを追加
5. pnpm build && git add -A && git commit -m "feat: add usage analytics for alpha testers"

### P1-3: FitGate UX改善
status: todo
estimate: M
priority: P1
context:
12問が多く感じる。プログレスバーと質問の絞り込みで体感を短縮する。
### instructions
1. /fit のFitGateにプログレスバーを追加（1/12, 2/12...）
2. 質問の順序を見直し: 最重要3問を最初に配置
3. 「あと○問」テキストを各質問下部に表示
4. pnpm build && git add -A && git commit -m "feat: improve fitgate ux with progress"

---

## P2: 販売準備（1ヶ月以内）

### P2-1: Supabase導入（認証基盤）
status: todo
estimate: L
priority: P2
context:
現在localStorage。Supabaseで認証とデータ永続化を実現する。
### instructions
1. pnpm add @supabase/supabase-js
2. lib/supabase.ts を作成
3. .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を追加（ダミー値でOK）
4. 認証フック useAuth.ts を作成（ログイン・ログアウト・セッション管理）
5. 既存のlocalStorageは維持（移行は次フェーズ）
6. pnpm build && git add -A && git commit -m "feat: add supabase auth foundation"

### P2-2: LP改修（Instagram流入最適化）
status: todo
estimate: M
priority: P2
context:
yohack-lp-design.md の7セクション構成に沿ってLPを改修する。
### instructions
1. docs/yohack-lp-design.md を読む
2. app/page.tsx（LP）を7セクション構成に改修:
   S1: ヒーロー（問いの再提示）
   S2: 成果物の提示（ケース例2本）
   S3: 3軸説明
   S4: フラットな立場宣言
   S5: 向いている/いない
   S6: FAQ 4問
   S7: CTA → FitGate
3. 既存の不要セクションを削除
4. pnpm build && git add -A && git commit -m "feat: redesign lp for instagram traffic"

### P2-3: Stripe決済導入
status: todo
estimate: L
priority: P2
context:
¥29,800/90日のPass購入フローをStripe Checkoutで実装する。
### instructions
1. pnpm add stripe @stripe/stripe-js
2. app/api/checkout/route.ts を作成
3. Stripe Checkoutセッション作成エンドポイントを実装
4. /pricing ページに「Passを購入する」ボタンを追加
5. 成功/キャンセルページを作成
6. pnpm build && git add -A && git commit -m "feat: add stripe checkout"

---

## P3: 運用自動化（ローンチ後）

### P3-1: Instagram自動化パイプライン
status: todo
estimate: L
priority: P3
context:
n8n + Claude API + Puppeteer + Instagram Graph APIで週次投稿を85%自動化。
### instructions
1. scripts/instagram/ ディレクトリを作成
2. generate-carousel.js: Claude APIでQ/Cカルーセルを生成
3. render-image.js: PuppeteerでHTMLをJPEGに変換
4. post-instagram.js: Instagram Graph APIで投稿
5. README.md にセットアップ手順を記載
6. git add -A && git commit -m "feat: instagram automation pipeline scaffold"

### P3-2: 1on1裏メニュートリガー
status: todo
estimate: S
priority: P3
context:
世界線3本以上 or 60日経過で1on1セッション案内を表示する。
### instructions
1. lib/analytics.ts の worldline_created カウントを参照
2. 条件達成時にアプリ内バナーを表示
3. バナーコピー: 「プロと一緒に最終判断を整理したい方へ」
4. git add -A && git commit -m "feat: 1on1 upsell trigger"

---

## P4: 長期改善

### P4-1: vitestカバレッジ拡充
status: todo
estimate: M
priority: P4
context:
現在252テスト。UIコンポーネントのテストを追加する。
### instructions
1. 既存テストを確認
2. 主要コンポーネント5本にテストを追加
3. pnpm test && git add -A && git commit -m "test: add component tests"

### P4-2: FitGate → プロファイル自動プリセット
status: todo
estimate: M
priority: P4
context:
FitGate回答データをYOHACKのプロファイルに自動反映する。
### instructions
1. FitGateの回答をlocalStorageに保存
2. YOHACK起動時にFitGate回答があればプロファイルに反映
3. git add -A && git commit -m "feat: fitgate profile auto-preset"

---

## UI洗練タスク

### UI-1: 視線の流れ設計
priority: P1
estimate: L
status: todo

### context
ダッシュボード全体に「見る順番」の設計がない。ユーザーが最初にどこを見て、次にどこへ目が行くかを意図的に設計する。

### instructions
1. app/app/page.tsx のレイアウトを分析する
2. 現状のコンポーネント配置をF字動線・Z字動線の観点で評価する
3. 以下の優先順位でレイアウトを再構成する:
   - 最重要: ConclusionSummaryCard（結論）を最上部・最大サイズに
   - 第二: スコアと安心ラインを横並びで視覚的に強調
   - 第三: グラフエリアを結論の直下に配置
   - 入力カードは左カラムに収める（現状維持だが余白を整理）
4. Tailwindのgrid/flexレイアウトを調整してF字動線を実現
5. pnpm build で確認
6. git add -A && git commit -m "ui: redesign dashboard layout for visual flow"

完了条件: ダッシュボードを開いた瞬間に「結論→根拠→詳細」の順で目が流れる

---

### UI-2: グラフを意思決定支援に昇華
priority: P1
estimate: L
status: todo

### context
現状のRecharts素のグラフは「データを表示している」だけ。「世界線の分岐点」「安心ライン」が視覚的に伝わるグラフに変える。

### instructions
1. components/dashboard/ 以下のグラフコンポーネントを特定する
2. 以下の視覚要素を追加する:
   - 安心ラインを水平の参照線（ReferenceLine）で表示、#CC3333で「ここを割ると危険」を表現
   - 世界線A/Bを比較する場合、線の太さと透明度で主従を表現
   - グラフの余白（margin）を現状の1.5倍に拡大
   - 軸ラベルを日本語・万円単位に統一
   - ツールチップをカスタム化（#FAF9F7背景、#5A5550テキスト）
3. カラーパレット: 安全=#4A7C59、警告=#C8B89A、危険=#CC3333
4. pnpm build で確認
5. git add -A && git commit -m "ui: enhance charts with decision-support visual design"

完了条件: グラフを見た瞬間に「安全か危険か」が色と線で直感的にわかる

---

### UI-3: 数字の視覚的重み付け
priority: P2
estimate: M
status: todo

### context
金額・スコア・年齢の表示が均一で緊張感がない。重要な数字が重要に見える表示へ。

### instructions
1. 全dashboardコンポーネントの数字表示を棚卸しする
2. 数字の階層を3段階に整理する:
   - 大: スコア・総資産・物件価格（text-3xl以上、DM Sans Bold）
   - 中: 年収・月額・年齢（text-xl、DM Sans Medium）
   - 小: 補足数値・パーセント（text-sm、通常weight）
3. 金額表示のformatCurrency()が億円自動変換していることを確認
4. スコア表示に変化のアニメーション追加（0→実値へのcount-up、CSS transitionで実装）
5. 重要数値の背景に薄いハイライト（#C8B89A 10%opacity）を追加
6. pnpm build で確認
7. git add -A && git commit -m "ui: add visual weight hierarchy to numbers"

完了条件: 画面を見た3秒以内に最重要数値が目に入る

---

### UI-4: 入力フローの再設計
priority: P2
estimate: L
status: todo

### context
入力カードが「フォームを埋める」体験になっている。「自分のことを話す」体験に変える。

### instructions
1. 左カラムの入力カード群（BasicInfoCard, IncomeCard等）を分析する
2. 以下の改善を実施する:
   - 各カードのタイトルを「基本情報」→「あなたのプロフィール」のように一人称的な表現に
   - 入力フィールドにplaceholderを追加（例: 年収「例: 1,200万円」）
   - 入力完了したカードにチェックマーク表示（profileの充足度を視覚化）
   - カード間の区切りを明確にし、「次に入力すべき項目」がわかるよう未入力カードを強調
3. ProfileCompletenessコンポーネントと連動させる
4. pnpm build で確認
5. git add -A && git commit -m "ui: redesign input flow for conversational experience"

完了条件: 入力しながら「自分のシミュレーションが育っている」感覚が得られる
