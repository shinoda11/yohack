# D15 調査結果

## 描画方法
SVG ベース。viewBox `720 x H`（H は動的 360-480px）。

## 現在のノードスタイル
- Root: r=6, Night fill, "現在" label below
- Junction (分岐点): r=6, Gold fill, pulse animation, ラベルなし
- Leaf (世界線): r=5, Gold fill, "世界線{n}" + eventSummary テキスト

## 現在のエッジスタイル
- 確定（維持）: Stone, strokeWidth 2, solid
- 不確定（イベント）: Gold, strokeWidth 1.5, dashed 6 4
- Cubic Bezier 曲線で接続

## 問題点
1. ノードが小さい（r=5-6）— 6px radius ≒ 12px diameter は画面上で極めて小さい
2. Junction にラベルがない — 何の決断ポイントかわからない
3. 全 Leaf が同じ Gold — ベースラインと他の世界線の区別がない
4. Pulse animation が「静けさ」原則に反する
5. Empty state テキストが事務的

## 変更計画
- ノードサイズ拡大: r=8（root）、r=7（junction/baseline）、r=6（worldline leaf）
- 色分け: Leaf のうちベースラインは Gold fill、他は white fill + Stone stroke
- Edge: 確定=Night solid、不確定=Stone dashed
- Pulse animation 削除
- Empty state: テキスト改善 + 線太く
- PAD_RIGHT 拡大（ラベル配置のため）
