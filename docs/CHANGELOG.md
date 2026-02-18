# YOHACK 変更ログ

## 2025-02-18

### R01-Step1: calc-core.ts 共通ロジック抽出
- コミット: 86d7800
- 変更: engine.ts（837→506行）から10関数を lib/calc-core.ts（375行）に抽出
- 抽出関数: calculateEffectiveTaxRate, getEstimatedTaxRates, calculateAverageGrossIncome, calculatePersonPension, calculateAnnualPension, calculateIncomeAdjustment, calculateRentalIncome, calculateNetIncomeForAge, calculateExpensesForAge, calculateAssetGainForAge
- テスト: 191/191 パス
- ケース台帳: C01-C24 全件 ±1以内

### その他（本日完了分サマリー）
- A01-A06, C00-C07, G1, G7 他14件完了（詳細は各コミット参照）
- フレイキーテスト修正: vitest testTimeout 30000ms（96a82be）
- 技術負債: proxy.ts移行 + パッケージ更新（52b0b5a）
- CLAUDE.md再同期 2回（084672b, df8c9d5）
