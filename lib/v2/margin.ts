/**
 * Exit Readiness OS v2 - 余白 (Margin)
 * MoneyMargin に集中。TimeMargin/EnergyMargin は固定値ベースで信頼性不足のため一時削除。
 */

/**
 * お金の余白
 */
export type MoneyMargin = {
  monthlyDisposableIncome: number; // 月々の手取り収入
  monthlyNetSavings: number;       // 月々の純貯蓄額（収入 - 支出）
  emergencyFundCoverage: number;   // 緊急資金で生活費をカバーできる月数
  annualDisposableIncome: number;  // 年間可処分所得
};

/**
 * お金の余白の健全性を評価
 */
export function evaluateMoneyMarginHealth(margin: MoneyMargin): 'excellent' | 'good' | 'fair' | 'poor' {
  // 緊急資金カバー月数で判定
  if (margin.emergencyFundCoverage >= 12 && margin.monthlyNetSavings > 0) {
    return 'excellent';
  }
  if (margin.emergencyFundCoverage >= 6 && margin.monthlyNetSavings >= 0) {
    return 'good';
  }
  if (margin.emergencyFundCoverage >= 3) {
    return 'fair';
  }
  return 'poor';
}
