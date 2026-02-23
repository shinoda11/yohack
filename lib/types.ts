// Exit Readiness OS - Type Definitions

// Household mode
export type HouseholdMode = 'solo' | 'couple';

// Home ownership status
export type HomeStatus = 'renter' | 'owner' | 'planning' | 'relocating';

// Exit score level
export type ScoreLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

// Life event types
export type LifeEventType =
  | 'income_increase'
  | 'income_decrease'
  | 'expense_increase'
  | 'expense_decrease'
  | 'asset_gain'
  | 'asset_purchase'
  | 'housing_purchase'
  | 'child_birth'
  | 'education'
  | 'retirement_partial'
  | 'rental_income';

// Life event definition
export interface HousingPurchaseDetails {
  propertyPrice: number;      // 物件価格（万円）
  downPayment: number;        // 頭金（万円）
  purchaseCostRate: number;   // 諸費用率（%、デフォルト7）
  mortgageYears: number;      // ローン年数（デフォルト35）
  interestRate: number;       // 金利（%、デフォルト0.5）
  ownerAnnualCost: number;    // 管理費+固定資産税（万円/年、デフォルト40）
}

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  name: string;
  age: number;
  amount: number; // in 万円
  duration?: number; // years
  isRecurring: boolean;
  target?: 'self' | 'partner'; // undefined = 'self'（後方互換）
  bundleId?: string; // バンドルプリセットで一括登録されたイベントの紐づけ用
  purchaseDetails?: HousingPurchaseDetails; // housing_purchase 専用
}

// Housing plan for comparison (HousingPlanCard)
export interface HousingPlan {
  id: string;
  name: string;
  price: number;           // 物件価格（万円）
  downPayment: number;     // 頭金（万円）
  rate: number;            // 金利（%）
  years: number;           // ローン年数
  maintenanceCost: number; // メンテ費（万円/年）
  purchaseCostRate: number; // 諸費用率（%）
}

// User profile / input data
export interface Profile {
  // Basic info
  currentAge: number;
  targetRetireAge: number;
  mode: HouseholdMode;
  
  // Income
  grossIncome: number; // 万円/年
  rsuAnnual: number;
  sideIncomeNet: number;
  partnerGrossIncome: number;
  partnerRsuAnnual: number;
  
  // Expenses
  livingCostAnnual: number;
  housingCostAnnual: number;
  
  // Housing
  homeStatus: HomeStatus;
  homeMarketValue: number;
  mortgagePrincipal: number;
  mortgageInterestRate: number;
  mortgageYearsRemaining: number;
  mortgageMonthlyPayment: number;
  
  // Assets
  assetCash: number;
  assetInvest: number;
  assetDefinedContributionJP: number;
  dcContributionAnnual: number;
  
  // Investment settings
  expectedReturn: number; // %
  inflationRate: number; // %
  rentInflationRate?: number; // % (家賃インフレ率, undefined → inflationRate にフォールバック)
  volatility: number; // decimal (e.g., 0.15 = 15%)
  
  // Tax and retirement
  effectiveTaxRate: number; // % (manual override value)
  useAutoTaxRate: boolean; // true = auto-calculate from income
  retireSpendingMultiplier: number;
  retirePassiveIncome: number;
  postRetireIncome: number; // 退職後の年間事業収入（万円）。顧問・コンサル等
  postRetireIncomeEndAge: number; // その収入が続く年齢
  
  // Life events
  lifeEvents: LifeEvent[];

  // Housing plans (HousingPlanCard comparison plans)
  housingPlans: HousingPlan[];
}

// Asset data point for charts
export interface AssetPoint {
  age: number;
  assets: number; // 万円
}

// Simulation path data
export interface SimulationPath {
  yearlyData: AssetPoint[];
  upperPath: AssetPoint[]; // 90th percentile
  lowerPath: AssetPoint[]; // 10th percentile
  p25Path: AssetPoint[];   // 25th percentile
  p75Path: AssetPoint[];   // 75th percentile
  // Aliases for component compatibility
  median: number[];
  optimistic: number[];
  pessimistic: number[];
}

// Exit score breakdown
export interface ExitScoreDetail {
  overall: number; // 0-100
  level: ScoreLevel;
  survival: number; // 0-100, probability of not running out of money
  lifestyle: number; // 0-100, ability to maintain lifestyle
  risk: number; // 0-100, portfolio risk score (inverted)
  liquidity: number; // 0-100, cash/liquid assets ratio
}

// Key metrics from simulation
export interface KeyMetrics {
  fireAge: number | null; // Age when FIRE is possible, null if never
  assetAt100: number; // Asset value at age 100 (median)
  survivalRate: number; // % of simulations that don't go bankrupt
  yearsToFire: number | null;
}

// Cash flow breakdown
export interface CashFlowBreakdown {
  income: number;
  pension: number;
  dividends: number;
  expenses: number;
  netCashFlow: number;
}

// Full simulation result
export interface SimulationResult {
  paths: SimulationPath;
  metrics: KeyMetrics;
  cashFlow: CashFlowBreakdown;
  score: ExitScoreDetail;
  engineVersion: string;
}

// Scenario for comparison
export interface Scenario {
  id: string;
  name: string;
  profile: Profile;
  result: SimulationResult | null;
}

// RSU Grant
export interface RsuGrant {
  id: string;
  name: string;
  grantDate: Date;
  totalShares: number;
  vestingSchedule: VestingEvent[];
  currentPrice: number; // per share in 円
}

export interface VestingEvent {
  date: Date;
  shares: number;
  vested: boolean;
}

// Format helpers
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (value === 0) return '0万円';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 10000) {
    const oku = abs / 10000;
    return `${sign}${oku % 1 === 0 ? oku.toFixed(0) : oku.toFixed(1)}億円`;
  }
  return `${sign}${Math.round(abs).toLocaleString()}万円`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value % 1 === 0 ? `${Math.round(value)}%` : `${value.toFixed(1)}%`;
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'YELLOW';
  if (score >= 40) return 'ORANGE';
  return 'RED';
}

export function getScoreColor(level: ScoreLevel): string {
  switch (level) {
    case 'GREEN': return 'text-brand-bronze';
    case 'YELLOW': return 'text-brand-stone';
    case 'ORANGE': return 'text-brand-stone';
    case 'RED': return 'text-brand-stone';
  }
}

export function getScoreBgColor(level: ScoreLevel): string {
  switch (level) {
    case 'GREEN': return 'bg-brand-gold';
    case 'YELLOW': return 'bg-brand-stone';
    case 'ORANGE': return 'bg-brand-stone';
    case 'RED': return 'bg-brand-stone';
  }
}
