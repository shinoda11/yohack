# YOHACK プロダクトバックログ
> 最終更新: 2026-02-22
> 粒度: Claude Codeにそのまま渡せるレベルで記載

> ⚠️ 実行前に docs/constraints.md を必ず読むこと

---

## ✅ 完了済み（2026-02-22）

| タスク | 変更ファイル | 結果 |
|---|---|---|
| IncomeCard RSU・パートナー収入フィールド追加 | components/dashboard/income-card.tsx +55行 | 252/252 passed |
| イベントアイコン26件 絵文字→Lucide + カテゴリ左ボーダー | lib/event-catalog.ts / components/branch/event-icon.tsx（新規）/ event-picker-dialog.tsx / event-customize-dialog.tsx | 絵文字残存ゼロ |
| LP S2 決断連鎖シナリオ差し替え | app/page.tsx | 6,000万 vs 8,000万 → 転職 → 教育費 |

---

## 🔴 P0 — 次に着手（優先度順）

---

### [P0-FG-1] FitGate 招待トークン欄を条件付き表示に変更
**status:** [x]

**意図:** URLパラメータ `?token=XXX` がある場合のみトークン欄を表示する。「一見さんお断り」戦略と矛盾しないようにする。

**対象ファイル（目安）:** `app/fit/page.tsx`（フォーム末尾）
※ファイル構造が変わっている場合は `grep -r "招待トークン\|invitationToken\|token" app/fit/` で探すこと

**参考コード:**
```tsx
// URLパラメータがある場合のみ表示
const searchParams = useSearchParams();
const hasToken = searchParams.get('token');

{hasToken && (
  <div className="pt-4 border-t">
    <label>招待トークン</label>
    <Input defaultValue={hasToken} {...register('token')} />
  </div>
)}
```

**完了条件:**
- `/fit` アクセス時 → トークン欄が表示されない
- `/fit?token=ALPHA-2025` アクセス時 → トークン欄が表示され値がプリセットされている

**実装はコードを読んで現状に合わせること**

---

### [P0-FG-2] FitGateヘッダーに「← 戻る」リンク追加
**status:** [x]

**意図:** FitGateからLPに戻る導線がないため、ヘッダー左上に戻るリンクを追加する。

**対象ファイル（目安）:** `app/fit/layout.tsx`
※ファイル構造が変わっている場合は `grep -r "FitGate\|fitgate" app/fit/` で探すこと

**参考コード:**
```tsx
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// ヘッダー左側に追加
<Link
  href="/"
  className="text-xs text-brand-bronze flex items-center gap-1 hover:text-brand-stone transition-colors"
>
  <ChevronLeft className="w-3 h-3" />
  戻る
</Link>
```

**完了条件:** FitGate画面ヘッダー左上に「← 戻る」が表示され、クリックでLPへ遷移する。

**実装はコードを読んで現状に合わせること**

---

### [P0-FG-3] Ready判定画面の「無料で〜」テキスト削除 + 文言修正
**status:** [x]

**意図:** Ready画面に「無料」という文言が残っており¥29,800モデルと矛盾するため、文言を修正する。

**対象ファイル（目安）:** `app/fit/result/page.tsx`（Ready表示部分）
※ファイル構造が変わっている場合は `grep -r "無料" app/fit/` で探すこと

**参考コード:**
```tsx
// Before
<p>無料でシミュレーションをお試しください</p>

// After
<p>YOHACKでシミュレーションを開始できます</p>
{/* TODO Phase2: ここにStripe Checkout ボタンが入る */}
{/* <Button onClick={handleStripeCheckout}>Passを購入する（¥29,800）</Button> */}
<Button asChild>
  <Link href="/app?from=fitgate">シミュレーションを開始する →</Link>
</Button>
```

**完了条件:** Ready画面に「無料」という文言が一切含まれていない。

**実装はコードを読んで現状に合わせること**

---

### [P0-FG-4] FitGate回答 → ダッシュボードプロファイル自動プリセット 動作確認・修正
**status:** [x]

**意図:** FitGate回答後にダッシュボードへ遷移したとき、プロファイルが正しくプリセットされるか確認・修正する。

**対象ファイル（目安）:** `lib/fitgate.ts`（`fitGateToProfile()`）/ `app/app/profile/page.tsx`（プリセット読み込み）
※ファイル構造が変わっている場合は `grep -rn "fitGateToProfile\|loadFitGateAnswers" lib/ app/` で探すこと

**期待する挙動（変換テーブル）:**

| FitGate回答 | プロファイルフィールド | 変換値 |
|---|---|---|
| 世帯年収 2,000〜2,499万 | grossIncome | 2200 |
| 年齢 35〜39歳 | currentAge | 37 |
| 現在の家賃 | housingCostAnnual | 月額中央値 × 12 |
| 検討物件価格帯 | housingPlans[0].price | レンジ中央値 |
| 貯蓄＋投資合計 | assetCash + assetInvest | 合計を 3:7 で按分 |
| 家族構成「夫婦」 | mode | couple |

**完了条件:** fitGateToProfile() のコードを読み、変換テーブルに沿った変換が実装されていることをコードレベルで確認する。不足があれば修正する。

**実装はコードを読んで現状に合わせること**

---

### [P0-FG-5] Prep判定後のメール登録を最低限機能させる
**status:** [x]

**意図:** Prep判定後のメール登録フォームが送信してもどこにも届かないため、最低限のAPIルートを作成してログ出力する。

**対象ファイル（目安）:** `app/api/prep-register/route.ts`（新規）/ `app/fit/result/page.tsx`
※ファイル構造が変わっている場合は `grep -r "prep\|Prep" app/fit/` で探すこと

**参考コード（APIルート新規）:**
```tsx
// app/api/prep-register/route.ts
export async function POST(req: Request) {
  const { email, fitgateAnswers } = await req.json();
  // TODO Phase2: Supabase prepModeSubscribers テーブルに保存
  // TODO Phase2: SendGrid でレター送信
  console.log('[Prep登録]', email, JSON.stringify(fitgateAnswers), new Date().toISOString());
  return Response.json({ ok: true });
}
```

**完了条件:**
- Prep判定画面にメールアドレス入力フォームがある
- 送信後に完了メッセージが表示される
- API ルートが存在し、リクエストをログ出力する

**実装はコードを読んで現状に合わせること**

---

### [P0-1] LP Y字アニメーション高速化
**status:** [x]

**意図:** LPのY字SVGにドロー・アニメーションを追加し、ページ読み込み時に枝が描かれる演出を入れる。

**対象ファイル（目安）:** `app/page.tsx`（S1: Heroセクション内のY字SVG）

**参考CSS:**
```css
.y-svg .stem  { animation: draw 0.5s ease forwards 0.1s; }
.y-svg .left  { animation: draw 0.4s ease forwards 0.4s; }
.y-svg .right { animation: draw 0.4s ease forwards 0.4s; }
.y-svg .node  { animation: appear 0.2s ease forwards 0.7s; }
.y-svg .dot-l { animation: appear 0.2s ease forwards 0.75s; }
.y-svg .dot-r { animation: appear 0.2s ease forwards 0.8s; }
```

**完了条件:** ページリロード後、Y字の枝がアニメーションで描画される（0.4s以内に見え始める）。

**実装はコードを読んで現状に合わせること**

---

### [P0-2] LP → FitGate 導線接続（UTMパラメータ付き）
**status:** [x]

**意図:** LPのCTAリンクにUTMパラメータを付与して、流入元を追跡可能にする。

**対象ファイル（目安）:** `app/page.tsx`（LPのCTAボタン2箇所）

**変更内容:**
- S1 ヒーローCTA: `/fit` → `/fit?utm_source=lp&utm_medium=hero_cta`
- S7 ボトムCTA: `/fit` → `/fit?utm_source=lp&utm_medium=bottom_cta`

**完了条件:** CTAクリックで `/fit?utm_source=lp&utm_medium=...` に遷移する。

**実装はコードを読んで現状に合わせること**

---

## 🟡 P1 — 今週中

### [P1-1] LP グラフプレビューをシナリオ連動に修正
**status:** [x]

**意図:** LP S1のSVGグラフを6,000万 vs 8,000万シナリオに連動させ、世界線Aが安心ライン上、世界線Bが下落する軌跡にする。

**対象ファイル（目安）:** `app/page.tsx`（S1内のSVGグラフ）

**完了条件:** SVGグラフの2本のパスが6,000万（上昇）vs 8,000万（横ばい→下落）を表現している。

**実装はコードを読んで現状に合わせること**

---

### [P1-2] モバイルLP 375px確認・修正
**status:** [x]

**意図:** LP全体を375px幅で確認し、崩れている箇所を修正する。

**対象ファイル（目安）:** `app/page.tsx`

**確認箇所と修正方針:**

| 確認箇所 | 崩れていた場合の修正 |
|---|---|
| S1 Y字 中央寄せ | `flex justify-center` を親に追加 |
| S2 2列比較 | `grid-cols-1 sm:grid-cols-2` に変更 |
| 文字サイズ | `text-[10px]` → `text-xs`（12px）に引き上げ |

**完了条件:** 375px幅で全セクションが崩れずに表示される。

**実装はコードを読んで現状に合わせること**

---

## 🟢 P2 — 来週以降

### [P2-1] LP Next.js本実装
**status:** [x]

- `app/(marketing)/lp/page.tsx` に切り出し
- Framer Motion で CSS animation を置換
- `app/page.tsx` をダッシュボードのみに戻す

### [P2-2] チラ見せ動画（15秒）撮影・埋め込み
**status:** [x]

- 年収スライダー → グラフ変化のキャプチャ
- 数字はダミーデータ
- LP S0に埋め込み、`autoPlay loop muted playsInline`

### [P2-3] ケース台帳LP展開（6ケース）
**status:** [x]

- C01〜C18 + C19（6,000万 vs 8,000万）から6件選定
- LP S3 を `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` に拡張

### [P2-4] 1on1裏メニュー表示ロジック
**status:** [x]

- トリガー: 世界線3本以上 OR Pass購入から60日経過
- 表示場所: `/worldline` ページ末尾
- 一度閉じたら再表示しない（localStorage）

### [P2-5] Stripe Checkout接続（Phase 2）
**status:** [x]

- Ready判定 → Stripe Checkout → ¥29,800 Pass購入 → アクセス権付与
- `passSubscriptions` テーブル（Supabase）
- Webhook: `checkout.session.completed` → Pass有効化

### [P2-6] Supabase導入（Phase 2）
**status:** [ ]

- 認証: Supabase Auth
- テーブル: fitGateResponses / passSubscriptions / prepModeSubscribers
- localStorage → Supabase DB への移行

---

## 🎨 DS — デザインスプリント（プロダクトアイデンティティ統一）

> 背景: デザイン審査により「FintechSaaSとDecision OSの二重人格」が判明。
> ダッシュボードがプロダクト全体の足を引っ張っている。
> 分岐ビルダーだけがYOHACKらしい。そこに全体を寄せる。

---

### [DS-1] ダッシュボードの警告色を排除する
**status:** [ ]

**意図:**
黄色・赤・緑のボックスがウォームゴールドの世界観を壊している。
「安心ライン」の概念はYOHACKの核だが、信号機的な色使いはFintechのUIパターン。
色で緊急度を伝えるのではなく、数字と余白で伝える。

**対象ファイル（目安）:** `components/dashboard/` 内のサマリーカード群
※ grep で `yellow\|red\|green\|#CC3333\|#4A7C59` を探すこと

**完了条件:**
- ダッシュボード上に黄・赤・緑の背景色を持つボックスが存在しない
- 代替表現はテキストの濃淡またはゴールド系トーンのみ
- globals.css のカラートークンを逸脱していないこと

**実装はコードを読んで現状に合わせること**

---

### [DS-2] 「次の一手」セクションをYOHACK固有の内容に置き換える
**status:** [ ]

**意図:**
現在の「iDeCo/DC拠出を最大化」「定期的なリバランス」はMoneyForwardと区別がつかない。
YOHACKの「次の一手」はシナリオ比較から導出されるべきもの。
「分岐ビルダーで年収ダウンシナリオを試す」「この世界線を比較する」という行動促進に変える。

**対象ファイル（目安）:** `components/dashboard/` の NextBestActionsCard 相当
※ grep で `iDeCo\|リバランス\|次の一手\|NextBestAction` を探すこと

**完了条件:**
- 汎用的な投資アドバイス文言がゼロになっている
- 「次の一手」の内容が分岐ビルダー・世界線比較への具体的な誘導になっている
- 例: 「年収が20%下がるシナリオを分岐ビルダーで試す」

**実装はコードを読んで現状に合わせること**

---

### [DS-3] ダッシュボード左カラムの入力カード群を折りたたみ優先に変える
**status:** [ ]

**意図:**
7枚のカードが全展開で積まれると「入力フォーム」にしか見えない。
初回以降のユーザーには入力済みの値がサマリーで見えればいい。
展開が必要なときだけ開く設計にする。

**対象ファイル（目安）:** `components/dashboard/` 内の各入力カード
※ デフォルトで展開しているカードを確認すること

**完了条件:**
- BasicInfoCard・IncomeCard・ExpenseCard・AssetCard・InvestmentCard がデフォルト折りたたみ
- 折りたたみ時は入力済みの主要値をサマリー1行で表示
- HousingPlanCard は住宅検討中フラグがある場合のみデフォルト展開でよい

**実装はコードを読んで現状に合わせること**

---

### [DS-4] 分岐ビルダーのデシジョンツリーを全幅化する
**status:** [ ]

**意図:**
デシジョンツリーが白い四角の「ウィジェット」に閉じ込められている。
分岐ビルダーはYOHACKで唯一「意思決定OS」らしい画面。
ツリーに呼吸させる。右パネルとの関係を再整理する。

**対象ファイル（目安）:** `app/branch/page.tsx` または `components/branch/` のツリー表示部分

**完了条件:**
- デシジョンツリーの表示エリアが画面幅の60%以上を占める
- 白いボーダーボックスが削除されているか、余白十分なコンテナに置き換わっている
- 右パネルのイベントリストが左のビジュアルと視覚的に釣り合っている

**実装はコードを読んで現状に合わせること**

---

### [DS-5] 世界線比較「余白」タブの空白感を解消する
**status:** [ ]

**意図:**
Image 7: 「お金の余白」に3つの数字だけが浮いている。
余白が多すぎて未完成に見える。
数字が人生の重さを持つように、文脈と意味を添える。

**対象ファイル（目安）:** `app/worldline/page.tsx` または `components/v2/` の余白タブ
※ grep で `余白\|MarginTab\|margin` を探すこと

**完了条件:**
- 各数値に「これが何を意味するか」の1行コンテキストが付いている
- 例: `-11万円/月` の下に「現在の収支。住宅購入前に改善の余地あり」など
- 3項目のカード間の余白が統一されており、未完成に見えない

**実装はコードを読んで現状に合わせること**

---

### [DS-6] 世界線比較「戦略」タブの汎用アドバイスを削除する
**status:** [ ]

**意図:**
「分散投資の維持」「定期的なリバランス」「緊急資金の確保」はどのFPでも言う内容。
YOHACKが出す意味がない。
戦略タブはシナリオ比較の結果から導出される内容のみにする。
出せるものがなければ、空にするか非表示にする方が誠実。

**対象ファイル（目安）:** `app/worldline/page.tsx` または `components/v2/` の戦略タブ
※ grep で `分散投資\|リバランス\|緊急資金\|StrategyTab` を探すこと

**完了条件:**
- 汎用的な投資アドバイス文言がゼロ
- 戦略タブの内容がシナリオ比較の差分から導出されている、または
- 表示できる内容がない場合は「世界線を3本以上作成すると戦略が生成されます」などのプレースホルダーにする

**実装はコードを読んで現状に合わせること**

---

### [DS-7] プロファイルページに「入力している実感」を持たせる
**status:** [ ]

**意図:**
現在のプロファイルは縦に並んだフォームでしかない。
「自分の人生を入力している」という感覚がゼロ。
スライダーを動かすたびに何かが変わる、という応答性を持たせる。

**対象ファイル（目安）:** `app/profile/page.tsx` または `app/app/profile/page.tsx`

**完了条件:**
- ページ上部または右側に、入力値に連動したサマリー表示がある
- 例: 年収スライダーを動かすと「年間可処分所得: ○○万円」がリアルタイム更新される
- 最低限、現在入力中の「想定退職年齢」「総資産概算」の2項目がリアルタイム表示される

**実装はコードを読んで現状に合わせること**

---

## 未解決の問い

| # | 問い | 判断者 |
|---|---|---|
| Q1 | 物件6,000万〜8,000万はDINKS（世帯年収1,500〜2,500万）に「自分ごと」に感じるか？ | Toshiya |
| Q2 | S0の背景色: ダーク（#1A1916）維持か、オフホワイト（#FAF9F7）統一か？ | Toshiya |
| Q3 | グラフスコア参考値（78/54）をLPに出すか、完全ぼかしか？ | Toshiya |
| Q4 | S2シナリオ: 夫婦1組に絞るか、「夫婦」「ソロ」2パターンか？ | Toshiya |
| Q5 | アルファテスター10名への周知タイミングと通知方法 | Toshiya |
| Q6 | FitGate通過後、Stripe接続までの間（現Phase1）はどこで¥29,800を案内するか？ | Toshiya |
