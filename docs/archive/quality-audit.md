# モバイル品質監査（Quality Audit）

## 目的
モバイル（375px / iPhone SE）で全画面を体系的に検査し、バグ・UX問題・ポリッシュ不足を洗い出す。
「アマチュアプロダクト感」を消し、God is in the details を実現する。

## 前提
- CLAUDE.md を先に読むこと
- この監査は **修正指示ではなく調査** 。結果を AUDIT-RESULT.md に書き出す
- 修正は監査結果を確認してから別途指示する

---

## Part A: 機能テスト（動くべきものが動くか）

全画面の全インタラクティブ要素を検証する。

### A1: `/app` ダッシュボード

```
モバイル表示:
[ ] ConclusionSummaryCard が表示される
[ ] 「入力」「結果」タブ切り替えが動作する
[ ] 入力タブ:
    [ ] BasicInfoCard: 全スライダー/入力が操作可能
    [ ] IncomeCard: 全スライダー/入力が操作可能
    [ ] ExpenseCard: 全スライダー/入力が操作可能
    [ ] AssetCard: 全スライダー/入力が操作可能
    [ ] HousingPlanCard: 全入力が操作可能
    [ ] InvestmentCard: 全入力が操作可能
    [ ] AdvancedInputPanel: 開閉が動作、中の入力が操作可能
[ ] 結果タブ:
    [ ] ExitReadinessCard: スコア表示
    [ ] KeyMetricsCard: 指標表示
    [ ] CashFlowCard: グラフ表示（横スクロールなし）
    [ ] AssetProjectionChart: グラフ表示
    [ ] HousingMultiScenarioCard: 表示
    [ ] ScenarioComparisonCard: 表示
    [ ] NextBestActionsCard: アクション表示
    [ ] MonteCarloSimulatorTab: 表示
[ ] 入力変更 → 結果タブに反映（debounce 後）
[ ] WelcomeDialog: 初回訪問時に表示される
[ ] OnboardingSteps: バナー表示
```

### A2: `/app/branch` 分岐ビルダー

```
[ ] 決定木 SVG が表示される
[ ] 確定・計画・不確定のカテゴリが表示される
[ ] チェックボックスが操作可能
[ ] チェック変更 → SVG がリアルタイム更新
[ ] 「カスタムイベントを追加」ボタンの状態（有効/無効）
[ ] 「世界線を生成する」ボタン → 世界線候補リスト表示
[ ] 世界線候補リストのスコア・差分バッジ表示
[ ] 「比較する」ボタン → /app/worldline に遷移
```

### A3: `/app/worldline` 世界線比較

```
[ ] 5タブのスクロール操作
[ ] 各タブの切り替えが動作する
[ ] タブ1（概要）: 世界線カード表示
[ ] タブ2（資産推移）: グラフ表示
[ ] タブ3（キャッシュフロー）: グラフ表示
[ ] タブ4（余白）: 余白スコア表示
[ ] タブ5（戦略）: ★「戦略を見る」ボタンが動作するか ← 既知バグの疑い
[ ] 世界線の追加・削除が動作する
[ ] DecisionHost: 新しい世界線作成（TODO: 未実装の可能性あり）
```

### A4: `/app/profile` プロファイル

```
[ ] 全入力フィールドが操作可能
[ ] 入力変更がストアに反映される
[ ] 「← ダッシュボードに戻る」リンクが動作する
```

### A5: `/app/settings` 設定

```
[ ] データリセットが動作する
[ ] バージョン情報が表示される
[ ] 各設定項目が操作可能
```

### A6: `/` LP

```
[ ] 全7セクション (S1〜S7) が表示される
[ ] CTA ボタン → /fit に遷移する
[ ] チラ見せ動画（もしあれば）が再生される
[ ] フッターリンクが動作する
```

### A7: `/fit` FitGate

```
[ ] 12問が順に表示される
[ ] 各質問の選択肢が操作可能
[ ] 自由記述欄が入力可能
[ ] 進捗インジケーターが動作する
[ ] 完了 → /fit/result に遷移する
```

### A8: `/fit/result` 判定結果

```
[ ] Ready/Prep の判定結果が表示される
[ ] Ready → Pass 購入導線（現在の状態を確認）
[ ] Prep → /fit/prep への導線
```

### A9: `/pricing` 料金

```
[ ] 料金情報が表示される
[ ] CTA ボタンが動作する
```

---

## Part B: ビジュアル品質（God is in the details）

各画面で以下のチェックを行う。コードレベルで確認し、問題をリストアップ。

### B1: タイポグラフィ

```bash
# フォントサイズの一貫性を検査
grep -rn "text-\[" app/ components/ --include="*.tsx" | grep -v node_modules | sort

# text-xs 未満の小さすぎるフォント
grep -rn "text-\[8px\]\|text-\[9px\]\|text-\[10px\]\|fontSize.*[89]" app/ components/ --include="*.tsx"

# フォントウェイトの不整合
grep -rn "font-bold\|font-semibold\|font-medium\|font-normal" app/ components/ --include="*.tsx" | head -30
```

確認項目:
- [ ] ページタイトルのサイズが統一されているか（全画面で同じ heading レベル）
- [ ] カードタイトルのサイズ・ウェイトが統一されているか
- [ ] 本文テキストが text-sm 以上か（text-xs は補助テキストのみ）
- [ ] 数値表示のフォントが DM Sans（等幅風）で統一されているか
- [ ] 日本語テキストに不自然な折り返しがないか

### B2: スペーシング・余白

```bash
# padding/margin のばらつきを検査
grep -rn "p-[0-9]\|px-[0-9]\|py-[0-9]\|gap-[0-9]" app/ components/ --include="*.tsx" | \
  grep -v node_modules | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20

# カード間のスペーシング
grep -rn "space-y-\|gap-" app/app/page.tsx
```

確認項目:
- [ ] カード間の spacing が統一されているか（space-y-4 or gap-4）
- [ ] カード内の padding が統一されているか（p-4 or p-5）
- [ ] セクション間の区切りが視覚的に明確か
- [ ] ボトムナビの上に十分な余白があるか（コンテンツが隠れない）

### B3: カラー一貫性

```bash
# YOHACK カラーパレット外の色が使われていないか
grep -rn "text-gray-\|bg-gray-\|border-gray-\|text-blue-\|bg-blue-\|text-red-\|bg-red-" app/ components/ --include="*.tsx" | \
  grep -v node_modules | grep -v "ui/"

# Tailwind のデフォルト色（gray-200, gray-300 など）がパレット外に残っていないか
grep -rn "gray-[1-9]00\|slate-\|zinc-\|neutral-\|stone-" app/ components/ --include="*.tsx" | \
  grep -v node_modules | grep -v "ui/"
```

確認項目:
- [ ] 全テキストが #5A5550 or #1A1916（Night） or #8A7A62 のいずれかか
- [ ] 全ボーダーが #F0ECE4（Linen）か
- [ ] 全背景が #FAF9F7 or #FFFFFF か
- [ ] アクセントカラーが Gold #C8B89A のみか
- [ ] 成功=緑、警告=Gold、危険=red-700 の使い分けが統一されているか

### B4: タッチターゲット

```bash
# 44px 未満のタッチターゲットを検索
grep -rn "h-[1-8]\b\|h-\[.*px\]\|py-[01]\b\|p-[01]\b" app/ components/ --include="*.tsx" | \
  grep -v node_modules | grep -v "ui/"

# ボタンの高さ確認
grep -rn "<button\|<Button" app/ components/ --include="*.tsx" | head -30
```

確認項目:
- [ ] 全ボタンが min-h-[44px] 以上か
- [ ] チェックボックスのタップ領域が十分か
- [ ] リンクのタップ領域が十分か
- [ ] スライダーの操作ハンドルが 44px 以上か

### B5: ボーダー・シャドウ・角丸

```bash
# 角丸の一貫性
grep -rn "rounded-\|border-radius" app/ components/ --include="*.tsx" | \
  grep -v node_modules | grep -v "ui/" | awk -F: '{print $3}' | grep -oP "rounded-\w+" | sort | uniq -c | sort -rn

# シャドウの使用状況
grep -rn "shadow-\|box-shadow" app/ components/ --include="*.tsx" | \
  grep -v node_modules | grep -v "ui/"
```

確認項目:
- [ ] カードの角丸が統一されているか（rounded-lg or rounded-xl）
- [ ] シャドウが控えめか（shadow-sm 程度。Serene Clarity トーンに合っているか）
- [ ] ボーダーの太さが統一されているか（border = 1px のみ）

### B6: 各画面のタイトル

コードから全画面のタイトル/見出しを抽出:

```bash
# 各 page.tsx のタイトル部分を確認
for f in app/app/page.tsx app/app/branch/page.tsx app/app/worldline/page.tsx app/app/profile/page.tsx app/app/settings/page.tsx; do
  echo "=== $f ==="
  grep -n "text-.*font-\|<h[1-6]\|className.*heading\|title" "$f" | head -5
done
```

確認項目:
- [ ] 全画面のタイトルが同じスタイルか（text-xl font-bold or similar）
- [ ] サブタイトル（説明文）のスタイルが統一されているか
- [ ] タイトルの文言が統一されたトーンか（「ダッシュボード」「分岐ビルダー」「世界線比較」「プロファイル」「設定」）

---

## Part C: コード品質チェック

### C1: コンソールエラー

```bash
# 'use client' の欠落
grep -rL "'use client'" app/ components/ --include="*.tsx" | grep -v "layout\|page\|ui/"

# TODO / FIXME / HACK
grep -rn "TODO\|FIXME\|HACK\|XXX" app/ components/ lib/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v __tests__
```

### C2: アクセシビリティ

```bash
# alt テキストのない画像
grep -rn "<img\|<Image" app/ components/ --include="*.tsx" | grep -v "alt="

# aria-label のないインタラクティブ要素
grep -rn "onClick\|onChange" app/ components/ --include="*.tsx" | grep -v "aria-label\|aria-" | head -20
```

---

## 出力フォーマット

AUDIT-RESULT.md を以下の形式で作成:

```markdown
# モバイル品質監査結果
生成日時: YYYY-MM-DD

## 🔴 バグ（動作しない）
| # | 画面 | 問題 | ファイル:行 |
|---|------|------|------------|
| 1 | /app/worldline | 「戦略を見る」ボタンが動作しない | components/v2/xxx.tsx:123 |

## 🟡 UX問題（動くが体験が悪い）
| # | 画面 | 問題 | ファイル:行 | 修正案 |
|---|------|------|------------|--------|

## 🔵 ポリッシュ（細部の品質）
| # | カテゴリ | 問題 | ファイル:行 | 修正案 |
|---|----------|------|------------|--------|

## 📊 カラー監査
パレット外の色使用: N 箇所
詳細: ...

## 📏 タイポグラフィ監査
不統一箇所: N 箇所
詳細: ...

## 📐 スペーシング監査
不統一箇所: N 箇所
詳細: ...
```

---

## 実行方法

Claude Code に:
```
docs/quality-audit.md を読んで実行して。
Part A → Part B → Part C の順に。
結果は AUDIT-RESULT.md に書き出して。修正はしないで。
```
