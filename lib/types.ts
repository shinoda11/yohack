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
  | 'asset_purchase'
  | 'child_birth'
  | 'education'
  | 'retirement_partial';

// Life event definition
export interface LifeEvent {
  id: string;
  type: LifeEventType;
  name: string;
  age: number;
  amount: number; // in 万円
  duration?: number; // years
  isRecurring: boolean;
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
  volatility: number; // decimal (e.g., 0.15 = 15%)
  
  // Tax and retirement
  effectiveTaxRate: number; // %
  retireSpendingMultiplier: number;
  retirePassiveIncome: number;
  
  // Life events
  lifeEvents: LifeEvent[];
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
export function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}億円`;
  }
  return `${value.toLocaleString()}万円`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'YELLOW';
  if (score >= 40) return 'ORANGE';
  return 'RED';
}

export function getScoreColor(level: ScoreLevel): string {
  // 彩度を抑えた落ち着いたトーン
  switch (level) {
    case 'GREEN': return 'text-gray-700';
    case 'YELLOW': return 'text-gray-600';
    case 'ORANGE': return 'text-gray-600';
    case 'RED': return 'text-gray-700';
  }
}

export function getScoreBgColor(level: ScoreLevel): string {
  // 彩度を大幅に下げ、グレー寄りの落ち着いた色に
  switch (level) {
    case 'GREEN': return 'bg-gray-700';
    case 'YELLOW': return 'bg-gray-500';
    case 'ORANGE': return 'bg-gray-400';
    case 'RED': return 'bg-gray-600';
  }
}
