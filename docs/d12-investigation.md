# D12 調査結果

## 現在のタブ構成
- タブ1 (サマリー): Save/Share buttons → VariableBar → AssetProjectionChart → CashFlowCard
- タブ2 (確率分布): MonteCarloSimulatorTab
- タブ3 (世界線): ScenarioComparisonCard → ExitReadinessCard

## デスクトップレイアウト
1カラム構成（2カラムではない）:
- ConclusionSummaryCard (HERO, mb-12)
- `<details>` 入力カード群（折りたたみ）
- Tabs（サマリー / 確率分布 / 世界線）

## モバイルレイアウト
デスクトップと同じ1カラム。入力/結果のタブ切り替えは存在しない（廃止済み）。

## 問題点
1. 3タブ構成により、ユーザーは「サマリー」タブしか見ない可能性が高い
2. ExitReadinessCard（スコア詳細）が「世界線」タブに隠れている — 根拠なのに詳細扱い
3. サマリータブに独自の「保存」フローがあり、ScenarioComparisonCard の保存と重複

## 変更計画
1. Tabs を完全削除 → 縦スクロール3層構造に統合
2. ExitReadinessCard を第2層（根拠）に昇格
3. サマリータブの重複保存フローを削除（ScenarioComparisonCard の保存に一本化）
4. 第3層を `<details>` 折りたたみ

## 削除対象
- NextBestActionsCard: 存在しない（削除済み）
- HousingMultiScenarioCard: 存在しない
- サマリータブの保存フロー: ScenarioComparisonCard と重複のため削除
- Tabs/TabsList/TabsTrigger/TabsContent: 全削除

## 新しい構成
```
第1層（結論）: ConclusionSummaryCard  ← mb-12
第2層（根拠）: Share → VariableBar+Chart → ExitReadinessCard → CashFlowCard  ← mb-12
第3層（詳細）: <details> ScenarioComparisonCard + MonteCarloSimulatorTab
```
