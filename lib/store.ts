/**
 * YOHACK - Zustand State Management Store
 * 
 * ============================================================
 * SINGLE SOURCE OF TRUTH (SoT) - 状態管理の唯一の場所
 * ============================================================
 * 
 * このファイルがアプリ全体の状態管理の唯一の場所です。
 * 
 * ルール:
 * 1. 保存・計算結果（profile, simResult, scenarios）は useProfileStore にのみ存在する
 * 2. 他の場所（app/v2/store.ts 等）に第二のストアを作成しない
 * 3. 各ページ/コンポーネントは useProfileStore から参照のみ行う
 * 4. 新しいストアが必要な場合は、このファイルを拡張する
 * 
 * 違反チェック: npm run check:store (scripts/check-store-sot.js)
 * ============================================================
 */

// 「試行錯誤」体験を保証: 入力変更 → 即座に結果更新

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, SimulationResult, Scenario, LifeEvent } from './types';
import type { Branch } from './branch';
import { runSimulation, createDefaultProfile } from './engine';

// localStorage keys
const PROFILE_STORAGE_KEY = 'exit-readiness-profile';
const SCENARIOS_STORAGE_KEY = 'exit-readiness-scenarios';

// localStorage helpers
function loadScenariosFromStorage(): SavedScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load scenarios from localStorage', e);
  }
  return [];
}

function saveScenariosToStorage(scenarios: SavedScenario[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.error('Failed to save scenarios to localStorage', e);
  }
}

// Scenario with creation date
export interface SavedScenario extends Scenario {
  createdAt: string; // ISO date string
}

// Store state interface
interface ProfileStore {
  // State - 計算結果を1つのstateに集約
  profile: Profile;
  simResult: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Scenarios for comparison (max 3 for comparison: current + 2 saved)
  scenarios: SavedScenario[];
  activeScenarioId: string | null;
  comparisonIds: string[]; // IDs of scenarios to compare (max 2)
  
  // Onboarding
  hasOnboarded: boolean;

  // Branch builder state
  selectedBranchIds: string[];
  customBranches: Branch[];
  hiddenDefaultBranchIds: string[];

  // 内部: debounce管理
  _pendingUpdate: boolean;
  _storageInitialized: boolean;
  
  // Actions
  updateProfile: (updates: Partial<Profile>) => void;
  resetProfile: () => void;
  runSimulationAsync: () => Promise<void>;
  initializeFromStorage: () => void;
  
  // Onboarding action
  setHasOnboarded: () => void;

  // Branch builder actions
  setSelectedBranchIds: (ids: string[]) => void;
  addCustomBranch: (branch: Branch) => void;
  removeCustomBranch: (id: string) => void;
  updateCustomBranch: (id: string, updates: Partial<Branch>) => void;
  hideDefaultBranch: (id: string) => void;
  unhideDefaultBranch: (id: string) => void;
  addScenarioBatch: (scenarios: SavedScenario[]) => void;

  // Scenario actions
  saveScenario: (name: string) => { success: boolean; error?: string; scenario?: SavedScenario };
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  toggleComparison: (id: string) => void;
  clearComparison: () => void;
}

// Debounce timeout reference (module level for cleanup)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Create the store with persistence
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => {
      // 即時フィードバック: 150msのdebounceで高速レスポンス
      const triggerSimulation = () => {
        // Clear existing timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        // 即座にisLoadingをtrueにして「計算中」を表示
        set({ isLoading: true, _pendingUpdate: true });
        
        // 150ms後に実行（タイピング中の連続入力を吸収）
        debounceTimer = setTimeout(async () => {
          const { profile } = get();
          
          try {
            const result = await runSimulation(profile);
            set({ simResult: result, isLoading: false, error: null, _pendingUpdate: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Simulation failed',
              isLoading: false,
              _pendingUpdate: false
            });
          }
        }, 150);
      };
      
      return {
        // Initial state
        profile: createDefaultProfile(),
        simResult: null,
        isLoading: true, // 初回は計算中として開始
        error: null,
        scenarios: [],
        activeScenarioId: null,
        comparisonIds: [],
        hasOnboarded: false,
        selectedBranchIds: [],
        customBranches: [],
        hiddenDefaultBranchIds: [],
        _pendingUpdate: false,
        _storageInitialized: false,
        
        // Update profile and trigger simulation immediately
        updateProfile: (updates) => {
          set((state) => ({
            profile: { ...state.profile, ...updates }
          }));
          triggerSimulation();
        },
        
        // Reset to default profile
        resetProfile: () => {
          set({
            profile: createDefaultProfile(),
            activeScenarioId: null
          });
          triggerSimulation();
        },
        
        // Run simulation manually (for initial load)
        runSimulationAsync: async () => {
          const { profile, _pendingUpdate } = get();
          
          // 既にpending updateがある場合はスキップ（debounceに任せる）
          if (_pendingUpdate) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const result = await runSimulation(profile);
            set({ simResult: result, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Simulation failed',
              isLoading: false 
            });
          }
        },
        
        // Initialize scenarios from localStorage
        initializeFromStorage: () => {
          const { _storageInitialized } = get();
          if (_storageInitialized) return;
          
          const savedScenarios = loadScenariosFromStorage();
          set({ 
            scenarios: savedScenarios,
            _storageInitialized: true
          });
        },
        
        // Onboarding action
        setHasOnboarded: () => set({ hasOnboarded: true }),

        // Branch builder actions
        setSelectedBranchIds: (ids) => set({ selectedBranchIds: ids }),
        addCustomBranch: (branch) =>
          set((s) => ({ customBranches: [...s.customBranches, branch] })),
        removeCustomBranch: (id) =>
          set((s) => ({ customBranches: s.customBranches.filter((b) => b.id !== id) })),
        updateCustomBranch: (id, updates) =>
          set((s) => ({
            customBranches: s.customBranches.map((b) =>
              b.id === id ? { ...b, ...updates } : b
            ),
          })),
        hideDefaultBranch: (id) =>
          set((s) => ({
            hiddenDefaultBranchIds: s.hiddenDefaultBranchIds.includes(id)
              ? s.hiddenDefaultBranchIds
              : [...s.hiddenDefaultBranchIds, id],
          })),
        unhideDefaultBranch: (id) =>
          set((s) => ({
            hiddenDefaultBranchIds: s.hiddenDefaultBranchIds.filter((bid) => bid !== id),
          })),
        addScenarioBatch: (newScenarios) => {
          const { scenarios } = get();
          const nonBranch = scenarios.filter((s) => !s.id.startsWith('branch-'));
          const updated = [...nonBranch, ...newScenarios];
          set({
            scenarios: updated,
            comparisonIds: newScenarios.slice(0, 2).map((s) => s.id),
          });
          saveScenariosToStorage(updated);
        },

        // Save current profile as a scenario
        saveScenario: (name) => {
          const { profile, simResult, scenarios, isLoading } = get();
          
          // バリデーション: 計算中は保存しない
          if (isLoading) {
            return { success: false, error: '計算中です。完了後に再度お試しください。' };
          }
          
          // バリデーション: simResultがない場合は保存しない
          if (!simResult) {
            return { success: false, error: 'シミュレーション結果がありません。' };
          }
          
          // バリデーション: 名前が空の場合
          if (!name.trim()) {
            return { success: false, error: 'シナリオ名を入力してください。' };
          }
          
          const id = `scenario-${Date.now()}`;
          
          const newScenario: SavedScenario = {
            id,
            name: name.trim(),
            profile: { ...profile },
            result: { ...simResult },
            createdAt: new Date().toISOString(),
          };
          
          const updatedScenarios = [...scenarios, newScenario];
          set({
            scenarios: updatedScenarios,
            activeScenarioId: id
          });
          
          try {
            saveScenariosToStorage(updatedScenarios);
            return { success: true, scenario: newScenario };
          } catch (e) {
            // ストレージ保存失敗時もメモリには保存済み
            console.error('Failed to persist scenario to storage', e);
            return { success: true, scenario: newScenario, error: '保存は成功しましたが、永続化に失敗しました。' };
          }
        },
        
        // Load a saved scenario
        loadScenario: (id) => {
          const { scenarios } = get();
          const scenario = scenarios.find(s => s.id === id);
          
          if (scenario) {
            set({
              profile: { ...scenario.profile },
              simResult: scenario.result,
              activeScenarioId: id
            });
            // Trigger simulation to ensure fresh results
            triggerSimulation();
          }
        },
        
        // Delete a scenario
        deleteScenario: (id) => {
          const { scenarios, activeScenarioId, comparisonIds } = get();
          
          const updatedScenarios = scenarios.filter(s => s.id !== id);
          set({
            scenarios: updatedScenarios,
            activeScenarioId: activeScenarioId === id ? null : activeScenarioId,
            comparisonIds: comparisonIds.filter(cid => cid !== id),
          });
          saveScenariosToStorage(updatedScenarios);
        },
        
        // Toggle scenario in comparison (max 2)
        toggleComparison: (id) => {
          const { comparisonIds } = get();
          
          if (comparisonIds.includes(id)) {
            // Remove from comparison
            set({ comparisonIds: comparisonIds.filter(cid => cid !== id) });
          } else if (comparisonIds.length < 2) {
            // Add to comparison (max 2)
            set({ comparisonIds: [...comparisonIds, id] });
          }
          // If already at max, do nothing
        },
        
        // Clear all comparisons
        clearComparison: () => {
          set({ comparisonIds: [] });
        }
      };
    },
    {
      name: PROFILE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // 永続化するプロパティを限定（計算結果やローディング状態は除外）
      partialize: (state) => ({
        profile: state.profile,
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
        comparisonIds: state.comparisonIds,
        hasOnboarded: state.hasOnboarded,
        selectedBranchIds: state.selectedBranchIds,
        customBranches: state.customBranches,
        hiddenDefaultBranchIds: state.hiddenDefaultBranchIds,
      }),
      // ストレージから復元後にシミュレーションを再実行
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate: useAutoTaxRate が未定義の既存プロファイルにデフォルト値を設定
          if (state.profile.useAutoTaxRate === undefined) {
            state.profile.useAutoTaxRate = true;
          }
          // Migrate: rentInflationRate が未定義の既存プロファイルにデフォルト値を設定
          if (state.profile.rentInflationRate === undefined) {
            state.profile.rentInflationRate = 0.5;
          }
          // Migrate: housingPlans が未定義の既存プロファイルに空配列を設定
          if (!state.profile.housingPlans) {
            state.profile.housingPlans = [];
          }
          // Migrate: hiddenDefaultBranchIds が undefined の場合は空配列に
          if (!state.hiddenDefaultBranchIds) {
            state.hiddenDefaultBranchIds = [];
          }
          // 復元後にシミュレーションを再実行
          state._storageInitialized = true;
          setTimeout(() => {
            state.runSimulationAsync();
          }, 0);
        }
      },
    }
  )
);
