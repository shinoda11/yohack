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
  activeTab: 'worldlines' | 'margins' | 'strategy';

  // 世界線比較（UI状態のみ - データはuseProfileStore.scenariosを参照）
  selectedComparisonIds: string[]; // 比較対象として選択されたシナリオID（最大2つ）
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
}

export type V2Store = V2State & V2Actions;

/**
 * V2 Store を作成（永続化なし - UI状態のみ）
 */
export const useV2Store = create<V2Store>()((set, get) => ({
  // 初期状態
  activeTab: 'worldlines',
  selectedComparisonIds: [],

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
}));
