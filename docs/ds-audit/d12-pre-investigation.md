> **Archive**: This file is a historical record. Current rules and specs are in CLAUDE.md.

# D12-pre: 比較テーブル アンカー修正 + 「で試す」削除

## 変更目的
比較テーブルの「現在」列が何を意味するか曖昧だった。
また「で試す」ボタンが profile を破壊的に上書きする副作用を持ち、ユーザーに混乱を招いていた。

## 変更内容

### 1. アンカー列の命名統一
- ダッシュボード・世界線の両テーブルで「現在」→「★ あなたの状態」に統一
- `store.simResult` を固定アンカーとして扱い、差分は常にアンカー基準で計算

### 2. 「で試す」ボタンの扱い
- **ダッシュボード** (`scenario-comparison-card.tsx`): loadScenario (RotateCcw) ボタンを完全削除。テーブルは read-only
- **世界線** (`V2ComparisonView.tsx`): 「で試す」ボタン → 「この条件でダッシュボードを編集」リンクに変更。loadScenario を呼びつつ `/app` に遷移

### 3. Badge → テキストへの変更
- 世界線テーブルのヘッダーから `<Badge>現在</Badge>` + "ベースライン" subtext を削除
- 「★ あなたの状態」のプレーンテキストに統一

## 影響ファイル
- `components/dashboard/scenario-comparison-card.tsx`
- `components/v2/V2ComparisonView.tsx`
- `CLAUDE.md` — 比較テーブル設計原則を追加

## 設計原則（CLAUDE.md に追記）
- 「★ あなたの状態」列 = `store.simResult`（固定アンカー）
- 差分は常にアンカー基準
- テーブルは read-only（ダッシュボード側）
- 条件変更はダッシュボードで行う（世界線からはリンク遷移）
