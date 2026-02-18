/**
 * Branch Builder — 人生の分岐を定義し、世界線候補を自動生成する
 *
 * Branch → LifeEvent 変換を通じて、エンジンが実際に処理できる
 * イベントタイプのみを使用する。
 * child_birth / education はエンジンで無視されるため、
 * expense_increase として変換する。
 */

import type { Profile, LifeEvent, LifeEventType, SimulationResult, HousingPurchaseDetails } from './types';
import type { PresetEvent, BundlePreset } from './event-catalog';
import { getDefaultAmount } from './event-catalog';

// ============================================================
// Types
// ============================================================

export type BranchCertainty = 'confirmed' | 'planned' | 'uncertain';

export interface Branch {
  id: string;
  label: string;
  detail: string;
  certainty: BranchCertainty;
  age?: number;
  auto?: boolean;
  eventType: string;
  eventParams: Record<string, unknown>;
  directEvents?: LifeEvent[];
  presetId?: string;
  overridesDefaultId?: string;
}

export interface WorldlineCandidate {
  id: string;
  label: string;
  desc: string;
  branches: Branch[];
  color: string;
  score?: number;
  result?: SimulationResult;
}

// ============================================================
// Default Branches (profile-driven)
// ============================================================

const CANDIDATE_COLORS = {
  baseline: '#4A7C59',
  variant: '#4A6FA5',
  worst: '#8A7A62',
  extra: '#7B5EA7',
};

export function createDefaultBranches(profile: Profile): Branch[] {
  const totalIncome = profile.grossIncome + profile.partnerGrossIncome;
  const branches: Branch[] = [
    // 確定（auto=true, 常にチェック済み）
    {
      id: 'age',
      label: '年齢を重ねる',
      detail: `${profile.currentAge}歳 → 100歳`,
      certainty: 'confirmed',
      auto: true,
      eventType: '_auto',
      eventParams: {},
    },
    {
      id: 'pension',
      label: '年金受給',
      detail: '65歳から',
      certainty: 'confirmed',
      auto: true,
      eventType: '_auto',
      eventParams: {},
    },

    // 計画
    ...(profile.homeStatus === 'renter'
      ? [
          (() => {
            // HousingPlanCard のプランがあればそれを使う、なければ推定
            const hp = profile.housingPlans?.[0];
            const estimatedPrice = hp
              ? hp.price
              : Math.min(12000, Math.max(5000, Math.round(totalIncome * 5 / 100) * 100));
            const estimatedDown = hp
              ? hp.downPayment
              : Math.min(
                  Math.max(500, Math.round(profile.assetCash * 0.3 / 100) * 100),
                  Math.round(estimatedPrice * 0.2)
                );
            const loanYears = hp ? hp.years : 35;
            const interestRate = hp ? hp.rate : 0.5;
            const ownerAnnualCost = hp ? hp.maintenanceCost : 40;
            return {
              id: 'housing_purchase',
              label: '住宅購入',
              detail: `${estimatedPrice}万円（頭金${estimatedDown}万円・${loanYears}年）`,
              certainty: 'planned' as const,
              age: profile.currentAge + 2,
              eventType: 'housing_purchase',
              eventParams: {
                propertyPrice: estimatedPrice,
                downPayment: estimatedDown,
                loanYears,
                interestRate,
                ownerAnnualCost,
              },
            };
          })(),
        ]
      : []),
    ...(profile.mode === 'couple'
      ? [
          {
            id: 'child_1',
            label: '第一子',
            detail: `${profile.currentAge + 2}歳`,
            certainty: 'planned' as const,
            age: profile.currentAge + 2,
            eventType: 'child',
            eventParams: { childNumber: 1 },
          },
          {
            id: 'child_2',
            label: '第二子',
            detail: `${profile.currentAge + 4}歳`,
            certainty: 'planned' as const,
            age: profile.currentAge + 4,
            eventType: 'child',
            eventParams: { childNumber: 2 },
          },
        ]
      : []),

    // 不確定
    {
      id: 'income_down_20',
      label: '年収ダウン -20%',
      detail: `${Math.round(profile.grossIncome * 0.2)}万円減`,
      certainty: 'uncertain',
      age: profile.currentAge + 3,
      eventType: 'income_change',
      eventParams: { changePercent: -20 },
    },
    {
      id: 'income_down_30',
      label: '年収ダウン -30%',
      detail: `${Math.round(profile.grossIncome * 0.3)}万円減`,
      certainty: 'uncertain',
      age: profile.currentAge + 3,
      eventType: 'income_change',
      eventParams: { changePercent: -30 },
    },
    {
      id: 'pacedown',
      label: 'ペースダウン',
      detail: `年収 -50%（${Math.round(profile.grossIncome * 0.5)}万円減）`,
      certainty: 'uncertain',
      age: profile.targetRetireAge - 5,
      eventType: 'income_change',
      eventParams: { changePercent: -50 },
    },
    ...(profile.mode === 'couple'
      ? [
          {
            id: 'partner_quit',
            label: 'パートナー退職',
            detail: `${profile.partnerGrossIncome}万円 → 0`,
            certainty: 'uncertain' as const,
            age: profile.currentAge + 2,
            eventType: 'partner_income_change',
            eventParams: { newIncome: 0 },
          },
        ]
      : []),
  ];
  return branches;
}

// ============================================================
// Branch → LifeEvent conversion
// ============================================================

export function branchToLifeEvents(branch: Branch, _profile: Profile): LifeEvent[] {
  if (branch.directEvents) return branch.directEvents;

  const profile = _profile;
  const ts = Date.now();

  switch (branch.eventType) {
    case '_auto':
      return [];

    case 'housing_purchase': {
      const p = branch.eventParams;
      const details: HousingPurchaseDetails = {
        propertyPrice: (p.propertyPrice as number) ?? 8000,
        downPayment: (p.downPayment as number) ?? 1500,
        purchaseCostRate: 7,
        mortgageYears: (p.loanYears as number) ?? 35,
        interestRate: (p.interestRate as number) ?? 0.5,
        ownerAnnualCost: (p.ownerAnnualCost as number) ?? 40,
      };
      return [
        {
          id: `branch-${branch.id}-${ts}`,
          type: 'housing_purchase',
          name: branch.label,
          age: branch.age ?? profile.currentAge + 2,
          amount: 0,
          isRecurring: false,
          purchaseDetails: details,
        },
      ];
    }

    case 'child': {
      const childNum = (branch.eventParams.childNumber as number) ?? 1;
      const baseAge = branch.age ?? profile.currentAge + 2;
      // 3段階の教育費モデル（子ども年齢ベース）:
      //   0-5歳: 保育料 50万/年
      //   6-17歳: 学費+塾 100万/年
      //   18-21歳: 大学費用 200万/年
      return [
        {
          id: `branch-${branch.id}-nursery-${ts}`,
          type: 'expense_increase',
          name: `第${childNum}子 保育料`,
          age: baseAge,
          amount: 50,
          duration: 6,
          isRecurring: true,
        },
        {
          id: `branch-${branch.id}-school-${ts}`,
          type: 'expense_increase',
          name: `第${childNum}子 学費+塾`,
          age: baseAge + 6,
          amount: 100,
          duration: 12,
          isRecurring: true,
        },
        {
          id: `branch-${branch.id}-university-${ts}`,
          type: 'expense_increase',
          name: `第${childNum}子 大学費用`,
          age: baseAge + 18,
          amount: 200,
          duration: 4,
          isRecurring: true,
        },
      ];
    }

    case 'income_change': {
      const pct = (branch.eventParams.changePercent as number) ?? 0;
      if (pct === 0) return [];
      const amount = Math.round(profile.grossIncome * Math.abs(pct) / 100);
      const duration = branch.eventParams.duration as number | undefined;
      return [
        {
          id: `branch-${branch.id}-${ts}`,
          type: pct > 0 ? 'income_increase' : 'income_decrease',
          name: branch.label,
          age: branch.age ?? profile.currentAge + 3,
          amount,
          duration,
          isRecurring: false,
          target: 'self',
        },
      ];
    }

    case 'partner_income_change': {
      if (profile.partnerGrossIncome <= 0) return [];
      return [
        {
          id: `branch-${branch.id}-${ts}`,
          type: 'income_decrease',
          name: branch.label,
          age: branch.age ?? profile.currentAge + 2,
          amount: profile.partnerGrossIncome,
          isRecurring: false,
          target: 'partner',
        },
      ];
    }

    default:
      return [];
  }
}

// ============================================================
// Branch → Display Summary (ダッシュボード用)
// ============================================================

export interface BranchDisplayItem {
  id: string;
  label: string;
  detail: string;
  age: number | null;
  certainty: BranchCertainty;
  icon: string;
}

const BRANCH_ICONS: Record<string, string> = {
  housing_purchase: '🏠',
  child: '👶',
  income_change: '💼',
  partner_income_change: '👤',
  _direct: '📋',
};

/**
 * 分岐ビルダーの現在の状態から、ダッシュボード表示用のイベント一覧を生成する。
 * auto ブランチ（年齢を重ねる、年金受給）は除外。
 */
export function getBranchDisplayItems(
  profile: Profile,
  customBranches: Branch[],
  hiddenDefaultBranchIds: string[],
): BranchDisplayItem[] {
  const defaults = createDefaultBranches(profile);
  const overriddenIds = new Set(
    customBranches
      .map(b => b.overridesDefaultId)
      .filter((id): id is string => id != null)
  );
  const hiddenIds = new Set(hiddenDefaultBranchIds);

  // デフォルトブランチ（auto除外、hidden/overridden除外）
  const visibleDefaults = defaults.filter(
    b => !b.auto && !hiddenIds.has(b.id) && !overriddenIds.has(b.id)
  );

  const allBranches = [...visibleDefaults, ...customBranches];

  return allBranches.map(b => ({
    id: b.id,
    label: b.label,
    detail: b.detail,
    age: b.age ?? null,
    certainty: b.certainty,
    icon: b.presetId
      ? '📋'
      : BRANCH_ICONS[b.eventType] ?? '📋',
  }));
}

/**
 * 分岐ビルダーの現在の状態から、チャートマーカー用の LifeEvent[] を生成する。
 * auto ブランチは除外。branchToLifeEvents() で変換。
 */
export function getBranchDerivedLifeEvents(
  profile: Profile,
  customBranches: Branch[],
  hiddenDefaultBranchIds: string[],
): LifeEvent[] {
  const defaults = createDefaultBranches(profile);
  const overriddenIds = new Set(
    customBranches
      .map(b => b.overridesDefaultId)
      .filter((id): id is string => id != null)
  );
  const hiddenIds = new Set(hiddenDefaultBranchIds);

  const visibleDefaults = defaults.filter(
    b => !b.auto && !hiddenIds.has(b.id) && !overriddenIds.has(b.id)
  );

  const allBranches = [...visibleDefaults, ...customBranches];
  const events: LifeEvent[] = [];
  for (const b of allBranches) {
    events.push(...branchToLifeEvents(b, profile));
  }
  return events;
}

// ============================================================
// Worldline Candidate Generation
// ============================================================

export function generateWorldlineCandidates(
  selectedBranches: Branch[],
  max: number = 5
): WorldlineCandidate[] {
  const confirmed = selectedBranches.filter((b) => b.certainty === 'confirmed');
  const planned = selectedBranches.filter((b) => b.certainty === 'planned');
  const uncertain = selectedBranches.filter((b) => b.certainty === 'uncertain');

  const candidates: WorldlineCandidate[] = [];

  // 1. Baseline = confirmed + planned
  const baselineBranches = [...confirmed, ...planned];
  candidates.push({
    id: 'baseline',
    label: 'ベースライン',
    desc:
      planned.length > 0
        ? `計画通り: ${planned.map((b) => b.label).join(' + ')}`
        : '現在の計画のみ',
    branches: baselineBranches,
    color: CANDIDATE_COLORS.baseline,
  });

  // 2. Each uncertain branch as a separate variant
  const variantColors = [CANDIDATE_COLORS.variant, '#6B8E5A', '#A85C5C', '#5A8A8A'];
  for (let i = 0; i < uncertain.length && candidates.length < max; i++) {
    const u = uncertain[i];
    candidates.push({
      id: `variant-${u.id}`,
      label: u.label,
      desc: `ベースライン + ${u.label}`,
      branches: [...baselineBranches, u],
      color: variantColors[i % variantColors.length],
    });
  }

  // 3. Worst-case: all uncertain combined (if 2+ uncertain)
  if (uncertain.length >= 2 && candidates.length < max) {
    candidates.push({
      id: 'worst-case',
      label: '複合リスク',
      desc: `全不確定: ${uncertain.map((b) => b.label).join(' + ')}`,
      branches: [...baselineBranches, ...uncertain],
      color: CANDIDATE_COLORS.worst,
    });
  }

  return candidates.slice(0, max);
}

// ============================================================
// Profile Builder for Candidate
// ============================================================

export function buildProfileForCandidate(
  profile: Profile,
  candidate: WorldlineCandidate
): Profile {
  const allEvents: LifeEvent[] = [...profile.lifeEvents];

  let homeStatus = profile.homeStatus;

  for (const branch of candidate.branches) {
    const events = branchToLifeEvents(branch, profile);
    allEvents.push(...events);

    if (branch.eventType === 'housing_purchase') {
      homeStatus = 'planning';
    }
  }

  return {
    ...profile,
    homeStatus,
    lifeEvents: allEvents,
  };
}

// ============================================================
// Impact Analysis
// ============================================================

export function findMostImpactfulBranch(
  candidates: WorldlineCandidate[]
): { branch: Branch; scoreDiff: number } | null {
  const baseline = candidates.find((c) => c.id === 'baseline');
  if (!baseline?.score) return null;

  let maxDiff = 0;
  let impactBranch: Branch | null = null;

  for (const c of candidates) {
    if (c.id === 'baseline' || !c.score) continue;
    const diff = Math.abs(baseline.score - c.score);
    if (diff > maxDiff) {
      maxDiff = diff;
      // The unique branch is the one not in baseline
      const baseIds = new Set(baseline.branches.map((b) => b.id));
      const unique = c.branches.find((b) => !baseIds.has(b.id));
      if (unique) {
        impactBranch = unique;
      }
    }
  }

  return impactBranch ? { branch: impactBranch, scoreDiff: maxDiff } : null;
}

// ============================================================
// Preset → Branch conversion
// ============================================================

export function presetToBranch(
  preset: PresetEvent,
  profile: Profile,
  custom?: { age?: number; amount?: number; duration?: number; certainty?: BranchCertainty }
): Branch {
  const age = custom?.age ?? profile.currentAge + preset.ageOffset;
  const amount = custom?.amount ?? getDefaultAmount(preset, profile);
  const duration = custom?.duration ?? preset.defaultDuration;
  const certainty = custom?.certainty ?? 'uncertain';
  const ts = Date.now();

  const directEvents: LifeEvent[] = [];

  if (preset.engineType === 'housing_purchase') {
    const pd = preset.purchaseDetails!;
    directEvents.push({
      id: `preset-${preset.id}-${ts}`,
      type: 'housing_purchase',
      name: preset.name,
      age,
      amount: 0,
      isRecurring: false,
      purchaseDetails: {
        ...pd,
        propertyPrice: amount,
      },
    });
  } else {
    directEvents.push({
      id: `preset-${preset.id}-${ts}`,
      type: preset.engineType as LifeEventType,
      name: preset.name,
      age,
      amount,
      duration: preset.isRecurring ? duration : undefined,
      isRecurring: preset.isRecurring,
      target: preset.target,
    });
  }

  const detailParts: string[] = [`${age}歳`];
  if (amount > 0) detailParts.push(`${amount}万円`);
  if (preset.isRecurring && duration > 0) detailParts.push(`${duration}年間`);

  return {
    id: `preset-${preset.id}-${ts}`,
    label: preset.name,
    detail: detailParts.join(' / '),
    certainty,
    age,
    eventType: '_direct',
    eventParams: {},
    directEvents,
    presetId: preset.id,
  };
}

// ============================================================
// Bundle → Branch conversion
// ============================================================

export function bundleToBranches(
  bundle: BundlePreset,
  profile: Profile,
  startAge?: number
): Branch {
  const baseAge = startAge ?? profile.currentAge + bundle.defaultAgeOffset;
  const ts = Date.now();
  const bundleId = `bundle-${bundle.id}-${ts}`;

  const directEvents: LifeEvent[] = bundle.events.map((ev, i) => ({
    id: `${bundleId}-ev${i}`,
    type: ev.engineType as LifeEventType,
    name: ev.name,
    age: baseAge + ev.ageOffsetFromBundle,
    amount: ev.amountFn(profile),
    duration: ev.isRecurring ? ev.duration : undefined,
    isRecurring: ev.isRecurring,
    target: ev.target,
    bundleId,
  }));

  const summary = bundle.events.map((ev) => ev.name).join(' + ');

  return {
    id: bundleId,
    label: bundle.name,
    detail: `${baseAge}歳〜 / ${summary}`,
    certainty: 'uncertain',
    age: baseAge,
    eventType: '_direct',
    eventParams: {},
    directEvents,
    presetId: bundle.id,
  };
}

// ============================================================
// Default Branch → Virtual PresetEvent (for editing defaults)
// ============================================================

export function branchToVirtualPreset(branch: Branch, profile: Profile): PresetEvent | null {
  switch (branch.eventType) {
    case '_auto':
      return null;

    case 'housing_purchase': {
      const p = branch.eventParams;
      const price = (p.propertyPrice as number) ?? 8000;
      return {
        id: `_default_${branch.id}`,
        name: branch.label,
        category: 'housing',
        description: `${price}万円の住宅購入`,
        icon: '🏠',
        ageOffset: (branch.age ?? profile.currentAge + 2) - profile.currentAge,
        defaultAmount: price,
        defaultDuration: 1,
        isRecurring: false,
        engineType: 'housing_purchase',
        customizable: { age: true, amount: true, duration: false },
        amountLabel: '物件価格',
        purchaseDetails: {
          propertyPrice: price,
          downPayment: (p.downPayment as number) ?? 1500,
          purchaseCostRate: 7,
          mortgageYears: (p.loanYears as number) ?? 35,
          interestRate: (p.interestRate as number) ?? 0.5,
          ownerAnnualCost: (p.ownerAnnualCost as number) ?? 40,
        },
      };
    }

    case 'child': {
      return {
        id: `_default_${branch.id}`,
        name: branch.label,
        category: 'family',
        description: '育児費＋教育費（自動計算）',
        icon: '👶',
        ageOffset: (branch.age ?? profile.currentAge + 2) - profile.currentAge,
        defaultAmount: 100,
        defaultDuration: 6,
        isRecurring: true,
        engineType: 'expense_increase',
        customizable: { age: true, amount: false, duration: false },
        amountLabel: '年間費用',
      };
    }

    case 'income_change': {
      const pct = (branch.eventParams.changePercent as number) ?? 0;
      const amount = Math.round(profile.grossIncome * Math.abs(pct) / 100);
      const dur = branch.eventParams.duration as number | undefined;
      return {
        id: `_default_${branch.id}`,
        name: branch.label,
        category: 'career',
        description: branch.detail,
        icon: pct > 0 ? '📈' : '📉',
        ageOffset: (branch.age ?? profile.currentAge + 3) - profile.currentAge,
        defaultAmount: amount,
        defaultDuration: dur ?? 0,
        isRecurring: !!dur,
        engineType: pct > 0 ? 'income_increase' : 'income_decrease',
        target: 'self',
        customizable: { age: true, amount: true, duration: !!dur },
        amountLabel: pct > 0 ? '年間増額' : '年間減額',
      };
    }

    case 'partner_income_change': {
      return {
        id: `_default_${branch.id}`,
        name: branch.label,
        category: 'career',
        description: branch.detail,
        icon: '👤',
        ageOffset: (branch.age ?? profile.currentAge + 2) - profile.currentAge,
        defaultAmount: profile.partnerGrossIncome,
        defaultDuration: 0,
        isRecurring: false,
        engineType: 'income_decrease',
        target: 'partner',
        customizable: { age: true, amount: true, duration: false },
        amountLabel: '年間減額',
      };
    }

    default:
      return null;
  }
}
