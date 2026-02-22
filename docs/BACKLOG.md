# YOHACK Backlog v2.0

## P0: UI洗練（今週）

## P0-1: ゼロ状態の設計
status: done
priority: 0
estimate: S

### context
初回訪問・世界線0本の状態が弱い。何をすればいいか直感的でない。

### instructions
```
1. app/worldline/page.tsx で世界線が0本のとき表示するEmptyStateコンポーネントを作成
2. コピー: 「まず、あなたの家の選択肢を世界線として並べてみましょう」
3. 「最初の世界線を作る →」ボタンを配置（/app/branch へ）
4. ダッシュボードの入力未完了状態にも同様のガイダンスを追加
5. pnpm build && git add -A && git commit -m "feat: add empty state design"
```

## P0-2: 情報密度の制御
status: done
priority: 0
estimate: M

### context
ダッシュボードに入力と結果が同一画面に並びすぎ。どこを見ればいいか迷う。

### instructions
```
1. ダッシュボードの左カラム（入力）と右カラム（結果）の視覚的な重みを調整
2. 結果カードを「最重要1枚」が最初に目に入るよう並び順を見直す
3. 入力カードはデフォルトで折りたたみ、完了済みは小さく表示
4. pnpm build && git add -A && git commit -m "feat: reduce dashboard information density"
```

## P0-3: 数字の変化に文脈を与える
status: done
priority: 0
estimate: S

### context
スコアや金額が変わるとき、ただ変わる。変化の意味が伝わらない。

### instructions
```
1. スコアが変化するとき CSS transition で 600ms かけて変化
2. スコアが上がる→カードに +2px elevation（box-shadow強化）
3. スコアが下がる→カードborderが #CC3333 に 300ms フラッシュ
4. 安心ライン割れの数字: 色だけでなく ⚠️ アイコン + border太さも変化
5. pnpm build && git add -A && git commit -m "feat: animate score changes with context"
```

## P0-4: モバイル体験の統一
status: done
priority: 0
estimate: M

### context
3カラムグリッドがモバイルで崩れやすい。

### instructions
```
1. pnpm dev でモバイルサイズ（375px）を確認
2. ダッシュボードをモバイルで1カラムに統一
3. ボトムナビが全ページで正しく表示されるか確認・修正
4. タップターゲットを最小44×44pxに統一
5. pnpm build && git add -A && git commit -m "fix: unify mobile layout"
```

## P0-5: UIテキストの品質向上
status: done
priority: 0
estimate: M

### instructions
```
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

YOHACKの全UIテキストを「決断の静けさ」のトーンに統一する。

1. 以下のカテゴリで全UIテキストを棚卸しする:
   - ボタンラベル
   - エラーメッセージ
   - 空状態のコピー
   - プレースホルダー
   - ツールチップ
   - ローディング状態

2. 以下の原則で書き直す:
   - 機能を説明しない → 価値を伝える
   - 「エラーが発生しました」→「計算に必要な情報が足りません」
   - 「保存する」→「この世界線を保存」
   - 「読み込み中」→ 意味のあるスケルトンUIまたは非表示
   - 一人称複数（「私たちは」）は使わない
   - ユーザーを急かす言葉は使わない

3. 変更箇所を列挙してコミット:
   git add -A && git commit -m "ui: rewrite all UI text for professional tone"

完了条件: 全UIテキストがYOHACKのトーン「決断の静けさ」と一致している
```

## P0-6: Empty State設計
status: done
priority: P0
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

プロファイル未入力・シミュレーション未実行時の空状態を「次に何をすべきか」が伝わるものに変更する。

対象画面:
1. ダッシュボード右カラム（シミュレーション未実行時）
   - 現状: 結果カードが空欄 or 0表示
   - 改善: 「プロファイルを入力すると、ここに余白の見通しが表示されます」+ 薄いイラスト的SVG
2. 世界線比較（世界線0本）
   - 現状: 「世界線がまだありません」
   - 改善: より文脈のある案内（分岐ビルダーで作れることを伝える）
3. /branch（ブランチ未選択時）
   - 改善: 初回ユーザー向けの案内

スタイルルール:
- テキスト: text-brand-bronze
- アイコン: text-brand-gold opacity-30
- 背景: bg-brand-canvas rounded-xl
- CTAボタンがある場合: bg-brand-gold text-brand-night

完了後: pnpm build && pnpm test && git add -A && git commit -m "ui: P0-6 empty state design" && git push

## P0-7: Skeleton UI実装
status: done
priority: P0
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

計算中の待機状態をSkeleton UIに置き換え、「読み込み中」「計算中」テキストを廃止する。

対象:
1. ダッシュボード結果カード（ExitReadinessCard, KeyMetricsCard, CashFlowCard等）
   - simResult が null の間 → Skeleton表示
2. 世界線比較のスコア表示
   - 計算中 → Skeleton表示
3. MoneyMarginCard
   - isLoading時 → Skeleton表示（既存Skeleton importあり、活用する）

実装方針:
- shadcn/ui の Skeleton コンポーネントを使用（既に components/ui/skeleton.tsx あり）
- テキスト「計算中」「更新中」「反映中」→ Skeletonアニメーションに置換
- Skeletonの形状は実データの形状と一致させる（数値→短い矩形、グラフ→大きな矩形）

完了後: pnpm build && pnpm test && git add -A && git commit -m "ui: P0-7 skeleton UI" && git push

## P0-8: スペーシング体系化（8ptグリッド）
status: done
priority: P0
estimate: M

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

「関係が近いほど近く、遠いほど遠く」の原則を全コンポーネントに適用する。
参考: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14 Tip 1

1. tailwind.config.ts に spacing スケールを明示定義:
   spacing-1 = 4pt, spacing-2 = 8pt, spacing-3 = 16pt, spacing-4 = 24pt,
   spacing-5 = 32pt, spacing-6 = 48pt, spacing-8 = 64pt

2. カード内部: label↔値 は spacing-1(4pt), セクション間は spacing-3(16pt)
3. カード間マージン: spacing-4(24pt) 統一
4. 違反箇所（感覚値のp-3やmt-2の混在）を体系値に置換

完了後: git add -A && git commit -m "ui: P0-8 spacing system 8pt grid" && git push

## P0-9: フォントウェイトをRegular/Boldの2種に統一
status: done
priority: P0
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

font-weight を Regular(400) と Bold(700) の2種のみに整理する。
参考: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14 Tip 11

1. 現在使われている font-medium(500) / font-semibold(600) を棚卸し
2. 見出し・スコア・重要数値 → font-bold(700)
3. ラベル・本文・補足 → font-normal(400)
4. font-medium / font-semibold は原則廃止（例外はCLAUDE.mdに明記）

完了後: git add -A && git commit -m "ui: P0-9 font weight to regular/bold only" && git push

## P0-10: Border-radius統一
status: done
priority: P0
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

全コンポーネントのborder-radiusを統一し「同じ手が作った」感を出す。
参考: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14 Tip 12

統一ルール:
- カード・モーダル: rounded-xl (12px)
- ボタン・バッジ・タグ: rounded-lg (8px)
- 入力フィールド: rounded-lg (8px)
- グラフのツールチップ: rounded-lg (8px)
- アイコンコンテナ: rounded-md (6px)
- 全角の丸（アバター等）: rounded-full

現在の rounded-sm / rounded / rounded-md / rounded-2xl の混在を上記ルールに統一。

完了後: git add -A && git commit -m "ui: P0-10 border-radius unified" && git push

---

## P1: Alpha Tester体験（2週間以内）

## P1-1: /app/branch への導線追加
status: done
priority: 1
estimate: S

### instructions
```
完了済み
```

## P1-2: Alpha Tester向け利用状況ログ
status: todo
priority: 1
estimate: M

### context
アルファテスターが世界線を何本作ったか把握できない。KPI計測が必要。

### instructions
```
1. lib/analytics.ts を新規作成（localStorageベースのイベントトラッキング）
2. trackEvent(name: string, props?: Record<string, unknown>) を実装
3. 以下のイベントを計測: worldline_created, branch_started, simulation_run, fitgate_started
4. /app/settings または /app/dashboard に「あなたの利用状況」小パネルを追加
5. pnpm build && git add -A && git commit -m "feat: add usage analytics for alpha testers"
```

## P1-3: FitGate UX改善
status: todo
priority: 1
estimate: M

### context
12問が多く感じる。プログレスバーと質問の絞り込みで体感を短縮する。

### instructions
```
1. /fit のFitGateにプログレスバーを追加（1/12, 2/12...）
2. 質問の順序を見直し: 最重要3問を最初に配置
3. 「あと○問」テキストを各質問下部に表示
4. pnpm build && git add -A && git commit -m "feat: improve fitgate ux with progress"
```

## P1-4: 視線の流れ設計
status: done
priority: 1
estimate: L

### context
ダッシュボード全体に「見る順番」の設計がない。ユーザーが最初にどこを見て、次にどこへ目が行くかを意図的に設計する。

### instructions
```
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

【原則1: 削ることが設計である】に基づくレイアウト再構成:

1. app/app/page.tsx のレイアウトを分析する
2. この画面の「主役」を定義する: ConclusionSummaryCard（結論）が主役
3. 主役を最上部・最大サイズに配置し、それ以外は脇役として視覚的な重みを下げる:
   - 結論カードの padding を現状の1.5倍に拡大
   - スコアと安心ラインを結論の直下に横並びで配置（第二の視覚要素）
   - グラフエリアをその下に配置（第三の視覚要素）
   - 入力カードは左カラムに収め、余白を十分に確保
4. F字動線を意識してTailwindのgrid/flexレイアウトを調整
5. 「あった方がいい」要素を特定し、デフォルト非表示にする
6. pnpm build で確認
7. git add -A && git commit -m "ui: redesign dashboard layout for visual flow"

完了条件: ダッシュボードを開いた瞬間に「結論→根拠→詳細」の順で目が流れる
チェック: デザイン哲学の実装チェックリスト全項目を満たすこと
```

## P1-5: グラフを意思決定支援に昇華
status: done
priority: 1
estimate: L

### context
現状のRecharts素のグラフは「データを表示している」だけ。「世界線の分岐点」「安心ライン」が視覚的に伝わるグラフに変える。

### instructions
```
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

【原則3: 応答が信頼を作る】に基づくグラフの意思決定支援化:

1. components/dashboard/ 以下のグラフコンポーネントを特定する
2. 「カラーの意味」に従って視覚要素を追加する:
   - 安心ラインを水平の参照線（ReferenceLine）で表示、ウォーニングレッド #CC3333
   - 安全圏はセーフグリーン #4A7C59、警告圏はウォームゴールド #C8B89A
   - 世界線A/Bを比較する場合、線の太さと透明度で主従を表現
3. 【原則1: 削ることが設計である】に従い余白を確保:
   - グラフの margin を現状の1.5倍に拡大
   - 軸ラベルを日本語・万円単位に統一（端数は見せない）
4. ツールチップをカスタム化（オフホワイト #FAF9F7 背景、ダークテキスト #5A5550）
5. 【原則3】グラフの線は左から右へアニメーション描画する
6. pnpm build で確認
7. git add -A && git commit -m "ui: enhance charts with decision-support visual design"

完了条件: グラフを見た瞬間に「安全か危険か」が色と線で直感的にわかる
チェック: デザイン哲学の実装チェックリスト全項目を満たすこと
```

## P1-6: Number Input / Slider改善
status: done
priority: P1
estimate: M

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

年収・物件価格等の数値入力の体験を改善する。

対象コンポーネント:
1. components/currency-input.tsx（カンマ付き数値入力）
2. components/slider-input.tsx（スライダー入力）
3. ダッシュボード入力カード内の各Input

改善内容:
1. CurrencyInput: フォーカス時に全選択（既存selectAllと統一）
2. SliderInput: 現在値をスライダー上にツールチップ表示
3. 大きな数値（1,000万以上）の入力補助: 100万単位のステップボタン（+100 / -100）
4. 入力値の妥当性フィードバック: 範囲外の値に対してborder-dangerでハイライト
5. モバイルでのタッチ操作改善: スライダーのタッチターゲット拡大（min-h-[44px]）

完了後: pnpm build && pnpm test && git add -A && git commit -m "ui: P1-6 number input slider improvement" && git push

## P1-7: Toast / Progress Bar実装
status: done
priority: P1
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

Toast通知とProfileCompletenessのProgress Barを改善する。

対象:
1. Toast通知（hooks/use-toast.ts + components/ui/toast.tsx）
   - シミュレーション完了時: 「更新しました」のtoast表示
   - シナリオ保存時: 「世界線を保存しました」のtoast表示
   - デザイン: bg-brand-canvas border-brand-sand text-brand-stone
2. ProfileCompleteness Progress Bar改善
   - 現状: 細い1pxバー
   - 改善: 高さ4px、角丸、アニメーション付き遷移
   - 100%到達時: brand-goldで全体をフラッシュ → 5秒後にフェードアウト（既存ロジック維持）

完了後: pnpm build && pnpm test && git add -A && git commit -m "ui: P1-7 toast and progress bar" && git push

## P1-8: CTAの優先順位整理（プライマリボタン1つルール）
status: done
priority: P1
estimate: M

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

各画面のプライマリアクションを1つに絞り、視線の行き先を明確にする。
参考: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14 Tip 3

対象画面と想定プライマリアクション:
- ダッシュボード → 「世界線を作る」
- 世界線比較 → 「この世界線を保存」
- /branch → 「分岐を追加」
- FitGate → 「次の質問へ」/ 「診断結果を見る」
- LP → 「適合チェックに進む」

実装:
1. 各画面で同格のボタンが複数ある箇所を特定
2. プライマリ1つ → bg-brand-gold text-white
3. セカンダリ → border border-brand-gold text-brand-gold bg-transparent
4. ターシャリ → text-brand-bronze underlineなし

完了後: git add -A && git commit -m "ui: P1-8 single primary CTA per screen" && git push

## P1-9: 色以外の視覚的指標を追加（アクセシビリティ）
status: todo
priority: P1
estimate: S

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

色覚特性のあるユーザーにも安心ライン以上/以下が伝わるようにする。
参考: https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14 Tip 7

対象:
1. 安心ライン以上（safe）の表示
   現状: 緑色のみ → 改善: ✓アイコン + 「安心ライン以上」ラベル追加
2. 安心ライン以下（danger）の表示
   現状: 赤色のみ → 改善: ⚠アイコン + 「安心ラインを下回っています」ラベル追加
3. グラフの世界線A/B区別
   現状: 色のみ → 改善: 実線/破線で区別（stroke-dasharray）
4. タブの選択状態
   現状: 色変化のみ → 改善: 選択タブに下線追加（border-b-2 border-brand-gold）

完了後: git add -A && git commit -m "ui: P1-9 add non-color visual indicators" && git push

---

## P2: 販売準備（1ヶ月以内）

## P2-1: Supabase導入（認証基盤）
status: todo
priority: 2
estimate: L

### context
現在localStorage。Supabaseで認証とデータ永続化を実現する。

### instructions
```
1. pnpm add @supabase/supabase-js
2. lib/supabase.ts を作成
3. .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を追加（ダミー値でOK）
4. 認証フック useAuth.ts を作成（ログイン・ログアウト・セッション管理）
5. 既存のlocalStorageは維持（移行は次フェーズ）
6. pnpm build && git add -A && git commit -m "feat: add supabase auth foundation"
```

## P2-2: LP改修（ヒーロービジュアル + リズム再設計）
status: todo
priority: P2
estimate: L

### instructions
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。
LP設計書 docs/yohack-lp-design.md も参照すること。

現状の問題:
1. ヒーローがテキストのみ（プロダクトの実物が見えない）
2. 全セクションが同じリズム（py-20 + 中央テキスト + カードグリッドの繰り返し）
3. S4フラットな立場宣言の視覚的重みが弱い
4. ケースカードに数値の差分がない

改修内容:

#### S1: ヒーロー
- ヒーローテキストの下にプロダクトプレビューを追加
- SVGで「世界線A vs B」の2本のグラフライン + 安心ラインの破線を表現
- 数字はダミー値（ぼかし不要、架空の数値でOK）
- 実装: SVGアニメーション（左から右へ線が描かれる、1.5s ease-out）
- 背景: bg-white rounded-xl border border-brand-sand shadow-sm
- プレビューサイズ: max-w-2xl mx-auto mt-12

#### S2: ケースカード
- 結論の前に「Before → After」の数値差分を追加
  Case1: 「余白スコア: 買わない 82 → 駐在あり 91」（架空数値）
  Case2: 「安心ライン: ペースダウン後も維持 ✓」
- 数値はbrand-goldで大きく表示（text-2xl font-bold）

#### S3: セクションリズムの変化
- S1: 全幅、中央揃え、大きな余白（現状維持）
- S2: max-w-3xl、左揃えに変更（h2も左揃え）
- S3: 背景をbg-brand-canvasに変更（白から変化をつける）
- S4: 全幅、中央揃え、bg-brand-nightに変更 + テキストをtext-white/70に
  → ダークセクションにすることで「宣言」の重みを出す
- S5: max-w-3xl、左揃え
- S6: bg-brand-canvas
- S7: 全幅、中央揃え、大きな余白

#### S4: フラットな立場（ダーク背景に変更）
```jsx
<section className="py-24 px-4 bg-brand-night">
  <div className="max-w-2xl mx-auto text-center space-y-3">
    <p className="text-lg sm:text-xl leading-loose text-white/70">
      YOHACK は、物件も保険も投資商品も売りません。
    </p>
    ...
  </div>
</section>
```

#### CTA文言変更
- 「あなたのケースで確認する」→「自分のケースで試す」
- 「適合チェックに進む」→「12問で確認する」
- 「よくある質問」→「気になること」

#### S2追記: ケースカードをC01〜C18から6件に拡充

docs/case-catalog-results.md を読み、属性が分散した6件を選定してカードに追加する。
選定基準: 年収帯・年齢・家族構成・職種が重複しないこと。

カード構成（6件 → 3列×2行グリッド、モバイルは1列）:
- 年収帯: 900万〜3,200万をカバー
- 年齢: 28〜42歳をカバー
- solo/couple 両方含む

各カードに表示する要素:
1. 属性ラベル（年収・年齢・家族構成）
2. 状況の一言（職種・検討内容）
3. 世界線比較の結論（1〜2行）
4. スコア差分 or 安心ライン判定（text-2xl font-bold text-brand-gold）

完了後:
- pnpm build
- git add -A && git commit -m "ui: P2-2 LP hero visual + section rhythm redesign" && git push

## P2-3: Stripe決済導入
status: todo
priority: 2
estimate: L

### context
¥29,800/90日のPass購入フローをStripe Checkoutで実装する。

### instructions
```
1. pnpm add stripe @stripe/stripe-js
2. app/api/checkout/route.ts を作成
3. Stripe Checkoutセッション作成エンドポイントを実装
4. /pricing ページに「Passを購入する」ボタンを追加
5. 成功/キャンセルページを作成
6. pnpm build && git add -A && git commit -m "feat: add stripe checkout"
```

## P2-4: 数字の視覚的重み付け
status: todo
priority: 2
estimate: M

### context
金額・スコア・年齢の表示が均一で緊張感がない。重要な数字が重要に見える表示へ。

### instructions
```
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

【原則2: 数字は人生の重さを持つ】に基づく数値表示の再設計:

1. 全dashboardコンポーネントの数字表示を棚卸しする
2. 「タイポグラフィの意味」に従い3段階の階層を適用:
   - 大（重要なことを言う時）: スコア・総資産・物件価格 → text-4xl以上、DM Sans Bold、#5A5550
   - 中（機能を説明する時）: 年収・月額・年齢 → text-xl、DM Sans Regular
   - 小（寄り添って話す時）: 補足数値・パーセント → text-sm、Noto Sans JP
3. 金額は万円・億円単位で表示、細かい端数は見せない（formatCurrency()確認）
4. 【原則3】数値の変化には必ずtransitionを付ける（0.3s ease）:
   - スコア表示に0→実値へのcount-upアニメーション
5. 重要数値の周囲には必ず余白を確保（他の要素と詰めない）
6. 重要数値の背景に薄いハイライト（ウォームゴールド #C8B89A 10%opacity）を追加
7. pnpm build で確認
8. git add -A && git commit -m "ui: add visual weight hierarchy to numbers"

完了条件: 画面を見た3秒以内に最重要数値が目に入る
チェック: デザイン哲学の実装チェックリスト全項目を満たすこと
```

## P2-5: 入力フローの再設計
status: todo
priority: 2
estimate: L

### context
入力カードが「フォームを埋める」体験になっている。「自分のことを話す」体験に変える。

### instructions
```
デザイン哲学 docs/YOHACK_DESIGN_PHILOSOPHY.md を必ず読んでから実装すること。

【原則1: 削ることが設計である】+【原則3: 応答が信頼を作る】に基づく入力体験の再設計:

1. 左カラムの入力カード群（BasicInfoCard, IncomeCard等）を分析する
2. 【原則1】1画面の主役を明確にする:
   - 「次に入力すべきカード」だけを主役として視覚的に強調
   - 入力完了カードは脇役として折りたたみ、チェックマーク表示
   - カード間の余白を現状の1.5倍に拡大
3. 入力体験を「フォームを埋める」→「自分のことを話す」に変える:
   - カードタイトルを一人称的な表現に（「基本情報」→「あなたのプロフィール」）
   - 入力フィールドにplaceholder追加（例: 年収「例: 1,200万円」）
4. 【原則3】入力に対する応答を設計する:
   - ProfileCompletenessコンポーネントと連動し、入力するたびに充足度が上がる視覚フィードバック
   - 入力完了時にカードが自然に折りたたまれるtransition（0.3s ease）
5. エラーと空状態を必ず設計する（未定義の状態を作らない）
6. pnpm build で確認
7. git add -A && git commit -m "ui: redesign input flow for conversational experience"

完了条件: 入力しながら「自分のシミュレーションが育っている」感覚が得られる
チェック: デザイン哲学の実装チェックリスト全項目を満たすこと
```

---

## P3: 運用自動化（ローンチ後）

## P3-1: Instagram自動化パイプライン
status: todo
priority: 3
estimate: L

### context
n8n + Claude API + Puppeteer + Instagram Graph APIで週次投稿を85%自動化。

### instructions
```
1. scripts/instagram/ ディレクトリを作成
2. generate-carousel.js: Claude APIでQ/Cカルーセルを生成
3. render-image.js: PuppeteerでHTMLをJPEGに変換
4. post-instagram.js: Instagram Graph APIで投稿
5. README.md にセットアップ手順を記載
6. git add -A && git commit -m "feat: instagram automation pipeline scaffold"
```

## P3-2: 1on1裏メニュートリガー
status: todo
priority: 3
estimate: S

### context
世界線3本以上 or 60日経過で1on1セッション案内を表示する。

### instructions
```
1. lib/analytics.ts の worldline_created カウントを参照
2. 条件達成時にアプリ内バナーを表示
3. バナーコピー: 「プロと一緒に最終判断を整理したい方へ」
4. git add -A && git commit -m "feat: 1on1 upsell trigger"
```

---

## P4: 長期改善

## P4-1: vitestカバレッジ拡充
status: todo
priority: 4
estimate: M

### context
現在252テスト。UIコンポーネントのテストを追加する。

### instructions
```
1. 既存テストを確認
2. 主要コンポーネント5本にテストを追加
3. pnpm test && git add -A && git commit -m "test: add component tests"
```

## P4-2: FitGate → プロファイル自動プリセット
status: todo
priority: 4
estimate: M

### context
FitGate回答データをYOHACKのプロファイルに自動反映する。

### instructions
```
1. FitGateの回答をlocalStorageに保存
2. YOHACK起動時にFitGate回答があればプロファイルに反映
3. git add -A && git commit -m "feat: fitgate profile auto-preset"
```
