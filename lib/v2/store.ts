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
  showV2UI: boolean;
  
  // 目標設定（表示用）
  goalLens: 'stability' | 'growth' | 'balance';
  
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
  
  // 出口ターゲット（将来の買い手像）- 解釈レイヤー、計算には影響しない
  exitTarget: 'young_single' | 'elite_single' | 'family_practical' | 'semi_investor' | 'high_end' | null;
  
  /**
   * 出口ターゲット適合度
   * - v0.1: 表示のみ、TRI（お金/時間/体力）への反映なし
   * - 将来拡張: この値を基にTRI計算に重み付けを行う予定
   *   - 例: 適合度lowの場合、売却リスクを時間/体力コストとして反映
   *   - 例: 適合度highの場合、出口戦略の安心感をお金の余白に微加算
   */
  exitTargetCompatibility: 'high' | 'medium' | 'low' | 'hold' | null;
  
  // 合意形成の型（③④選択時のみ使用）- パートナー各自の優先順位
  consensusPriorities: {
    partner1: string[];  // 最大3つ
    partner2: string[];  // 最大3つ
  };
}

/**
 * V2 Store のアクション
 */
interface V2Actions {
  // タブ切り替え
  setActiveTab: (tab: V2State['activeTab']) => void;
  
  // 目標レンズ切り替え
  setGoalLens: (lens: V2State['goalLens']) => void;
  
  // UI表示切り替え
  toggleV2UI: () => void;
  setShowV2UI: (show: boolean) => void;
  
  // 世界線比較
  toggleComparisonId: (id: string) => void;
  clearComparisonIds: () => void;
  
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
  
  // 出口ターゲット
  setExitTarget: (value: V2State['exitTarget']) => void;
  
  /**
   * 出口ターゲット適合度を設定
   * - v0.1: UI状態として保持のみ
   * - 将来拡張: TRI計算への反映を予定
   */
  setExitTargetCompatibility: (value: V2State['exitTargetCompatibility']) => void;
  
  // 合意形成の型
  togglePartnerPriority: (partner: 'partner1' | 'partner2', priority: string) => void;
  resetConsensusPriorities: () => void;
}

export type V2Store = V2State & V2Actions;

/**
 * V2 Store を作成（永続化なし - UI状態のみ）
 */
export const useV2Store = create<V2Store>()((set, get) => ({
  // 初期状態
  activeTab: 'worldlines',
  showV2UI: false,
  goalLens: 'balance',
  selectedComparisonIds: [],
  allocation: { travel: 40, invest: 40, freeTime: 20 },
  allocationDirty: false,
  allocationBase: { travel: 40, invest: 40, freeTime: 20 },
  bridges: { housing: null, children: null },
  exitTarget: null,
  exitTargetCompatibility: null, // v0.1: TRI反映なし、将来拡張用
  consensusPriorities: { partner1: [], partner2: [] },

  // アクション
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setGoalLens: (lens) => set({ goalLens: lens }),
  
  toggleV2UI: () => set((state) => ({ showV2UI: !state.showV2UI })),
  
  setShowV2UI: (show) => set({ showV2UI: show }),
  
  toggleComparisonId: (id) => {
    const { selectedComparisonIds } = get();
    if (selectedComparisonIds.includes(id)) {
      // Remove
      set({ selectedComparisonIds: selectedComparisonIds.filter(cid => cid !== id) });
    } else if (selectedComparisonIds.length < 2) {
      // Add (max 2)
      set({ selectedComparisonIds: [...selectedComparisonIds, id] });
    }
  },
  
  clearComparisonIds: () => set({ selectedComparisonIds: [] }),
  
  // 配分設定（合計100%を保証）
  setAllocation: (key, value) => {
    const { allocation, allocationBase } = get();
    const clampedValue = Math.max(0, Math.min(100, value));
    const others = Object.entries(allocation).filter(([k]) => k !== key);
    const otherTotal = others.reduce((sum, [, v]) => sum + v, 0);
    
    // 残りを按分して合計100%に
    const remaining = 100 - clampedValue;
    let newAllocation: typeof allocation;
    
    if (otherTotal === 0) {
      // 他が全て0の場合は均等配分
      const perOther = remaining / others.length;
      newAllocation = {
        ...allocation,
        [key]: clampedValue,
        [others[0][0]]: perOther,
        [others[1][0]]: perOther,
      } as typeof allocation;
    } else {
      // 按分
      newAllocation = { ...allocation, [key]: clampedValue };
      for (const [k, v] of others) {
        newAllocation[k as keyof typeof allocation] = Math.round((v / otherTotal) * remaining);
      }
      // 丸め誤差補正
      const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        const diff = 100 - total;
        const firstOtherKey = others[0][0] as keyof typeof allocation;
        newAllocation[firstOtherKey] += diff;
      }
    }
    
    // dirty判定（ベースと比較）
    const isDirty = newAllocation.travel !== allocationBase.travel ||
                    newAllocation.invest !== allocationBase.invest ||
                    newAllocation.freeTime !== allocationBase.freeTime;
    
    set({ allocation: newAllocation, allocationDirty: isDirty });
  },
  
  // 配分をベースにリセット
  resetAllocation: () => {
    const { allocationBase } = get();
    set({ allocation: { ...allocationBase }, allocationDirty: false });
  },
  
  // 保存完了時にdirtyをクリア＆現在の配分をベースに設定
  markAllocationSaved: () => {
    const { allocation } = get();
    set({ allocationDirty: false, allocationBase: { ...allocation } });
  },
  
  // ベース配分を設定（シナリオ選択時など）
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
  
  // 出口ターゲット
  setExitTarget: (value) => set({ exitTarget: value }),
  
  /**
   * 出口ターゲット適合度を設定
   * v0.1: UI状態として保持のみ、TRI計算への反映なし
   * 
   * TODO(v0.2+): TRI反映時のロジック案
   * - 'high' → お金の余白に +2〜5% の安心感補正
   * - 'medium' → 変更なし
   * - 'low' → 時間/体力コストとして売却リスク懸念を微加算
   * - 'hold' → 判定保留、反映なし
   */
  setExitTargetCompatibility: (value) => set({ exitTargetCompatibility: value }),
  
  // 合意形成の型
  togglePartnerPriority: (partner, priority) => {
    const { consensusPriorities } = get();
    const currentList = consensusPriorities[partner];
    if (currentList.includes(priority)) {
      // 削除
      set({
        consensusPriorities: {
          ...consensusPriorities,
          [partner]: currentList.filter(p => p !== priority),
        },
      });
    } else if (currentList.length < 3) {
      // 追加（最大3つ）
      set({
        consensusPriorities: {
          ...consensusPriorities,
          [partner]: [...currentList, priority],
        },
      });
    }
  },
  resetConsensusPriorities: () => {
    set({ consensusPriorities: { partner1: [], partner2: [] } });
  },
}));
