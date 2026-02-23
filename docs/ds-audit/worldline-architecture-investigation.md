> **Archive**: This file is a historical record. Current rules and specs are in CLAUDE.md.

# 世界線生成アーキテクチャ調査

調査日: 2026-02-23

## scenarios の型

```typescript
// lib/types.ts:170-175
export interface Scenario {
  id: string;
  name: string;
  profile: Profile;
  result: SimulationResult | null;
}

// lib/store.ts:56-58
export interface SavedScenario extends Scenario {
  createdAt: string; // ISO date string
}
```

**注意**: `source` や `origin` フィールドは存在しない。経路の区別は `id` のプレフィクスのみ。

---

## 世界線が作られる全経路

### 経路A: 分岐ビルダー（`addScenarioBatch`）

- **トリガー**: `/app/branch` で分岐を選択 →「世界線を生成する」→ プレビュー →「比較する」ボタン
- **処理**:
  1. `generateWorldlineCandidates(selectedBranches)` で最大5候補を生成（`lib/branch.ts:384`）
     - baseline（確定+計画）、各不確定の variant、複合リスク（worst-case）
  2. 各候補に `runSimulation()` でスコア計算
  3. `handleCompare()` で `SavedScenario[]` を構築（`app/app/branch/page.tsx:199`）
  4. `addScenarioBatch(scenarios)` で保存（`lib/store.ts:247`）
- **保存**: `addScenarioBatch` は **既存の `branch-*` シナリオを全削除してから追加**
  ```typescript
  const nonBranch = scenarios.filter((s) => !s.id.startsWith('branch-'));
  const updated = [...nonBranch, ...newScenarios];
  ```
- **ID 形式**: `branch-${candidateId}-${timestamp}`（例: `branch-baseline-1708700000000`）
- **名前の例**: 「ベースライン」「年収ダウン -20%」「複合リスク」
- **識別**: `id.startsWith('branch-')` で判定可能

### 経路B: ダッシュボードのテンプレート導線（`saveScenario` ×2）

- **トリガー**: `/app` の ConclusionSummaryCard 内テンプレートボタン（例:「購入する vs 賃貸を続ける」）
- **処理**（`app/app/page.tsx:228-250`）:
  1. `saveScenario(template.baselineName)` で現在のプロファイルをベースラインとして保存
  2. `updateProfile(template.createVariant(profile))` でプロファイルを変更
  3. 1500ms 待機（シミュレーション完了を待つ）
  4. `saveScenario(template.variantName)` で変更後プロファイルを保存
  5. `/app/v2`（→ `/app/worldline`）に遷移
- **保存**: `saveScenario` で1件ずつ追加。既存シナリオは削除されない
- **ID 形式**: `scenario-${timestamp}`
- **名前の例**: 「賃貸を続ける」+「購入した場合」、「DINKs継続」+「子ども1人」
- **識別**: `id.startsWith('scenario-')` で判定可能だが、経路C（手動保存）と同じプレフィクス

### 経路C: 手動保存（ダッシュボード ScenarioComparisonCard）

- **トリガー**: `/app` の第3層（詳細）内 ScenarioComparisonCard の「保存」ボタン
- **処理**（`components/dashboard/scenario-comparison-card.tsx:71-76`）:
  1. ユーザーがシナリオ名を入力
  2. `saveScenario(name)` で現在のプロファイル+simResult をスナップショット保存
- **保存**: `saveScenario` で1件追加
- **ID 形式**: `scenario-${timestamp}`（経路Bと同一）
- **名前の例**: ユーザー任意（例:「独身」「年収1800万の場合」）
- **識別**: 経路Bと区別不可能

### 経路D: 世界線ページのテンプレート追加（`saveScenario` ×1）

- **トリガー**: `/app/worldline` で V2ComparisonView 内のテンプレートボタン
- **処理**（`app/app/worldline/page.tsx:49-73`）:
  1. プロファイルをスナップショット
  2. `updateProfile(template.createVariant(profile))` で変更
  3. 1500ms 待機
  4. `saveScenario(template.variantName)` で variant のみ保存
  5. 元のプロファイルを復元
- **保存**: `saveScenario` で1件追加（variant のみ、baseline は追加しない）
- **ID 形式**: `scenario-${timestamp}`
- **識別**: 経路B/Cと区別不可能

### 経路E: WelcomeDialog

- **シナリオを作らない**。プロファイル初期設定のみ。

---

## 「独身」「ベースライン」「年収ダウン -20%」の出所

| 名前 | 経路 | 出所 |
|------|------|------|
| 「ベースライン」 | A（分岐ビルダー） | `generateWorldlineCandidates()` が baseline 候補に固定名を付与（`lib/branch.ts:398`） |
| 「年収ダウン -20%」 | A（分岐ビルダー） | `createDefaultBranches()` が生成する不確定分岐のラベル（`lib/branch.ts:140`）。分岐ビルダーで選択→候補名として使用 |
| 「独身」 | C（手動保存） | ソースコードに存在しない。ユーザーが ScenarioComparisonCard で手動入力した名前 |

---

## 世界線比較テーブルの表示ロジック

### V2ComparisonView（`/app/worldline`）
- `scenarios` props を受け取り、**先頭3件**を無条件で表示（`scenarios.slice(0, 3)`）
- 経路A/B/C/D の区別なし。全 scenarios が同一配列に混在
- 「★ あなたの状態」（`store.simResult`）をアンカーとして固定表示

### ScenarioComparisonCard（`/app` ダッシュボード第3層）
- `comparisonIds` で選択されたシナリオのみ表示
- こちらも経路の区別なし

### フィルタリング
- **経路ベースのフィルタリングは一切ない**
- `addScenarioBatch` のみ、追加時に `branch-*` を置換する挙動あり
- 表示時点では全シナリオが同列

---

## 分岐ビルダーとの接続

- 分岐ビルダーで生成した世界線は `addScenarioBatch` → `scenarios` に保存される ✅
- 比較テーブルに表示される ✅
- テンプレート/手動保存で作った世界線と **同じ配列に混在する** ⚠️
- `addScenarioBatch` は `branch-*` を置換するが、`scenario-*`（テンプレート/手動）は残る
  → 分岐ビルダーで再生成すると、古い `branch-*` は消えるが `scenario-*` は残り続ける

---

## 問題の整理

1. **経路の混在**: 分岐ビルダー（構造的分岐）とテンプレート（プロファイル変数変更）が同じ `scenarios[]` に混在。ユーザーから見ると「どこから来たかわからない」世界線が並ぶ
2. **出所の追跡不可**: `SavedScenario` に `source` フィールドがない。`id` プレフィクスで `branch-*` は判定可能だが、テンプレート経由と手動保存は区別できない
3. **古いシナリオの残存**: `addScenarioBatch` は `branch-*` のみ置換。`scenario-*` は永続的に蓄積 → 分岐ビルダーで再設計しても古いテンプレート/手動シナリオが残る
4. **テンプレート経路のプロファイル副作用**: 経路B は `updateProfile()` でグローバルプロファイルを一時的に変更する。1500ms の `setTimeout` で完了を待つが、シミュレーションの完了保証がない（race condition のリスク）
5. **表示上限3件の問題**: `scenarios.slice(0, 3)` で先頭3件のみ表示。経路B/C のシナリオが先頭にあると、経路A の分岐ビルダー結果が表示されない可能性がある

---

## 設計改善の方向性（案のみ、実装はしない）

### 案A: scenarios に source フィールドを追加
```typescript
interface SavedScenario extends Scenario {
  createdAt: string;
  source: 'branch' | 'template' | 'manual';
}
```
- 表示時に source でグルーピング可能
- 既存データのマイグレーションが必要

### 案B: テンプレート経路を廃止し、分岐ビルダーに統合
- ConclusionSummaryCard のテンプレートボタン → 分岐ビルダーへのリンクに変更
- 世界線の生成は分岐ビルダーのみに一本化
- テンプレートの「購入 vs 賃貸」等は分岐ビルダーのプリセットとして提供
- メリット: 経路が1つになり混乱がなくなる
- デメリット: ダッシュボードからのクイックスタート導線がなくなる

### 案C: scenarios を経路別に分離表示
- 比較テーブルで「分岐ビルダーから」「テンプレートから」「手動保存」をセクション分け
- 同一配列のままだが、UI 上で区別する
- `id` プレフィクスベースで判定

### 案D: 分岐ビルダー再生成時に全シナリオをクリア
- `addScenarioBatch` で `branch-*` だけでなく全シナリオを置換
- シンプルだが、手動保存したシナリオが消えるリスク

### 推奨: 案B（テンプレート廃止 + 分岐ビルダー一本化）
- 「2経路問題」の根本解決
- 分岐ビルダーが唯一の世界線生成源になり、ユーザーの混乱がなくなる
- ConclusionSummaryCard は「分岐ビルダーで世界線を設計する」への導線に変更
