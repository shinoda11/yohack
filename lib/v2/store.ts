/**
 * Exit Readiness OS v2 - Zustand Store (UI State Only)
 *
 * 重要: このストアはUI状態のみを管理する。
 * データの SoT（Source of Truth）は useProfileStore に一本化。
 * 世界線/シナリオのデータは useProfileStore.scenarios を参照すること。
 *
 * localStorage永続化なし（UI状態は揮発性）
 */

import { create } from 'zustand';

/**
 * V2 Store の状態（UI状態のみ）
 */
interface V2State {
  // UI状態
  activeTab: 'margins' | 'allocation' | 'decision' | 'worldlines' | 'strategy';

  // 世界線比較（UI状態のみ - データはuseProfileStore.scenariosを参照）
  selectedComparisonIds: string[]; // 比較対象として選択されたシナリオID（最大2つ）

  // 余白の配分（翻訳レイヤー - KPIには影響しない）
  allocation: {
    travel: number;    // 旅・ライフスタイル (%)
    invest: number;    // 投資 (%)
    freeTime: number;  // 自由時間 (%)
  };

  // 配分の変更追跡
  allocationDirty: boolean;
  allocationBase: {
    travel: number;
    invest: number;
    freeTime: number;
  };

  // 意思決定ブリッジ（v0.1は2ブリッジ固定）
  bridges: {
    housing: 'rent' | 'buy' | 'buy_later' | null;
    children: 0 | 1 | 2 | null;
  };
}

/**
 * V2 Store のアクション
 */
interface V2Actions {
  // タブ切り替え
  setActiveTab: (tab: V2State['activeTab']) => void;

  // 世界線比較
  toggleComparisonId: (id: string) => void;
  clearComparisonIds: () => void;
  setSelectedComparisonIds: (ids: string[]) => void;

  // 配分設定（合計100%を保証）
  setAllocation: (key: 'travel' | 'invest' | 'freeTime', value: number) => void;

  // 配分の変更追跡
  resetAllocation: () => void;
  markAllocationSaved: () => void;
  setAllocationBase: (base: { travel: number; invest: number; freeTime: number }) => void;

  // 意思決定ブリッジ
  setHousingBridge: (value: 'rent' | 'buy' | 'buy_later' | null) => void;
  setChildrenBridge: (value: 0 | 1 | 2 | null) => void;
  resetBridges: () => void;
}

export type V2Store = V2State & V2Actions;

/**
 * V2 Store を作成（永続化なし - UI状態のみ）
 */
export const useV2Store = create<V2Store>()((set, get) => ({
  // 初期状態
  activeTab: 'worldlines',
  selectedComparisonIds: [],
  allocation: { travel: 40, invest: 40, freeTime: 20 },
  allocationDirty: false,
  allocationBase: { travel: 40, invest: 40, freeTime: 20 },
  bridges: { housing: null, children: null },

  // アクション
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleComparisonId: (id) => {
    const { selectedComparisonIds } = get();
    if (selectedComparisonIds.includes(id)) {
      set({ selectedComparisonIds: selectedComparisonIds.filter(cid => cid !== id) });
    } else if (selectedComparisonIds.length < 2) {
      set({ selectedComparisonIds: [...selectedComparisonIds, id] });
    }
  },

  clearComparisonIds: () => set({ selectedComparisonIds: [] }),

  setSelectedComparisonIds: (ids) => set({ selectedComparisonIds: ids.slice(0, 2) }),

  // 配分設定（合計100%を保証）
  setAllocation: (key, value) => {
    const { allocation, allocationBase } = get();
    const clampedValue = Math.max(0, Math.min(100, value));
    const others = Object.entries(allocation).filter(([k]) => k !== key);
    const otherTotal = others.reduce((sum, [, v]) => sum + v, 0);

    const remaining = 100 - clampedValue;
    let newAllocation: typeof allocation;

    if (otherTotal === 0) {
      const perOther = remaining / others.length;
      newAllocation = {
        ...allocation,
        [key]: clampedValue,
        [others[0][0]]: perOther,
        [others[1][0]]: perOther,
      } as typeof allocation;
    } else {
      newAllocation = { ...allocation, [key]: clampedValue };
      for (const [k, v] of others) {
        newAllocation[k as keyof typeof allocation] = Math.round((v / otherTotal) * remaining);
      }
      const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        const diff = 100 - total;
        const firstOtherKey = others[0][0] as keyof typeof allocation;
        newAllocation[firstOtherKey] += diff;
      }
    }

    const isDirty = newAllocation.travel !== allocationBase.travel ||
                    newAllocation.invest !== allocationBase.invest ||
                    newAllocation.freeTime !== allocationBase.freeTime;

    set({ allocation: newAllocation, allocationDirty: isDirty });
  },

  resetAllocation: () => {
    const { allocationBase } = get();
    set({ allocation: { ...allocationBase }, allocationDirty: false });
  },

  markAllocationSaved: () => {
    const { allocation } = get();
    set({ allocationDirty: false, allocationBase: { ...allocation } });
  },

  setAllocationBase: (base) => {
    set({
      allocation: { ...base },
      allocationBase: { ...base },
      allocationDirty: false
    });
  },

  // 意思決定ブリッジ
  setHousingBridge: (value) => {
    set((state) => ({ bridges: { ...state.bridges, housing: value } }));
  },
  setChildrenBridge: (value) => {
    set((state) => ({ bridges: { ...state.bridges, children: value } }));
  },
  resetBridges: () => {
    set({ bridges: { housing: null, children: null } });
  },
}));
