'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { useProfileStore, type SavedScenario } from '@/lib/store';
import {
  createDefaultBranches,
  generateWorldlineCandidates,
  buildProfileForCandidate,
  presetToBranch,
  bundleToBranches,
  branchToVirtualPreset,
  type Branch,
  type WorldlineCandidate,
} from '@/lib/branch';
import { runSimulation } from '@/lib/engine';
import { PRESET_EVENTS } from '@/lib/event-catalog';
import type { PresetEvent, BundlePreset } from '@/lib/event-catalog';
import { BranchCategory } from '@/components/branch/branch-category';
import { BranchTreeViz } from '@/components/branch/branch-tree-viz';
import { BranchTimeline } from '@/components/branch/branch-timeline';
import { WorldlinePreview } from '@/components/branch/worldline-preview';
import { EventPickerDialog } from '@/components/branch/event-picker-dialog';
import { EventCustomizeDialog } from '@/components/branch/event-customize-dialog';

export default function BranchPage() {
  const router = useRouter();
  const {
    profile,
    selectedBranchIds,
    setSelectedBranchIds,
    customBranches,
    addCustomBranch,
    removeCustomBranch,
    updateCustomBranch,
    hiddenDefaultBranchIds,
    hideDefaultBranch,
    unhideDefaultBranch,
    addScenarioBatch,
    scenarios,
  } = useProfileStore();

  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [candidates, setCandidates] = useState<WorldlineCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customizePreset, setCustomizePreset] = useState<PresetEvent | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Generate default branches from profile
  const defaultBranches = useMemo(() => createDefaultBranches(profile), [profile]);

  // IDs of defaults overridden by custom branches
  const overriddenDefaultIds = useMemo(
    () => new Set(customBranches.map((b) => b.overridesDefaultId).filter((id): id is string => !!id)),
    [customBranches]
  );

  // Default branch IDs (for detecting edits on defaults)
  const defaultBranchIds = useMemo(
    () => new Set(defaultBranches.map((b) => b.id)),
    [defaultBranches]
  );

  // All branches = filtered defaults + custom
  const hiddenIds = useMemo(() => new Set(hiddenDefaultBranchIds), [hiddenDefaultBranchIds]);
  const allBranches = useMemo(
    () => [
      ...defaultBranches.filter((d) => !hiddenIds.has(d.id) && !overriddenDefaultIds.has(d.id)),
      ...customBranches,
    ],
    [defaultBranches, customBranches, hiddenIds, overriddenDefaultIds]
  );

  // Hidden default branches (for restore UI)
  const hiddenDefaults = useMemo(
    () => defaultBranches.filter((d) => hiddenIds.has(d.id)),
    [defaultBranches, hiddenIds]
  );

  // Available branch IDs for filtering stale selections
  const availableIds = useMemo(() => new Set(allBranches.map((b) => b.id)), [allBranches]);

  // Active selected IDs (filtered against available)
  const activeSelectedIds = useMemo(() => {
    const ids = selectedBranchIds.filter((id) => availableIds.has(id));
    // Auto branches are always selected
    const autoIds = allBranches.filter((b) => b.auto).map((b) => b.id);
    return new Set([...autoIds, ...ids]);
  }, [selectedBranchIds, availableIds, allBranches]);

  // Categorized branches
  const confirmed = useMemo(
    () => allBranches.filter((b) => b.certainty === 'confirmed'),
    [allBranches]
  );
  const planned = useMemo(
    () => allBranches.filter((b) => b.certainty === 'planned'),
    [allBranches]
  );
  const uncertain = useMemo(
    () => allBranches.filter((b) => b.certainty === 'uncertain'),
    [allBranches]
  );

  // Selected branches (full objects)
  const selectedBranches = useMemo(
    () => allBranches.filter((b) => activeSelectedIds.has(b.id)),
    [allBranches, activeSelectedIds]
  );

  // Non-auto selected count (to determine if generate button should be enabled)
  const nonAutoSelectedCount = useMemo(
    () => selectedBranches.filter((b) => !b.auto).length,
    [selectedBranches]
  );

  // Existing preset IDs for duplicate prevention
  const existingPresetIds = useMemo(
    () => new Set(customBranches.map((b) => b.presetId).filter((id): id is string => !!id)),
    [customBranches]
  );

  // Deletable branch IDs = all custom branches (including overrides)
  const deletableBranchIds = useMemo(
    () => new Set(customBranches.map((b) => b.id)),
    [customBranches]
  );

  // Hidable branch IDs = non-auto default branches
  const hidableBranchIds = useMemo(
    () => new Set(defaultBranches.filter((b) => !b.auto).map((b) => b.id)),
    [defaultBranches]
  );

  const handleToggle = useCallback(
    (id: string) => {
      const branch = allBranches.find((b) => b.id === id);
      if (!branch || branch.auto) return;

      const current = new Set(selectedBranchIds.filter((sid) => availableIds.has(sid)));
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      setSelectedBranchIds(Array.from(current));
    },
    [selectedBranchIds, availableIds, allBranches, setSelectedBranchIds]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const rawCandidates = generateWorldlineCandidates(selectedBranches);
      setProgress({ current: 0, total: rawCandidates.length });

      const scored: WorldlineCandidate[] = [];
      for (let i = 0; i < rawCandidates.length; i++) {
        const c = rawCandidates[i];
        const modifiedProfile = buildProfileForCandidate(profile, c);
        const result = await runSimulation(modifiedProfile);
        scored.push({
          ...c,
          score: result.score.overall,
          result,
        });
        setProgress({ current: i + 1, total: rawCandidates.length });
      }

      setCandidates(scored);
      // Pre-select all candidates
      setSelectedCandidateIds(new Set(scored.map((c) => c.id)));
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedBranches, profile]);

  const handleCandidateToggle = useCallback((id: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCompare = useCallback(() => {
    const chosen = candidates.filter((c) => selectedCandidateIds.has(c.id));
    const ts = Date.now();
    const scenarios: SavedScenario[] = chosen.map((c) => ({
      id: `branch-${c.id}-${ts}`,
      name: c.label,
      profile: buildProfileForCandidate(profile, c),
      result: c.result ?? null,
      createdAt: new Date().toISOString(),
    }));
    addScenarioBatch(scenarios);
    router.push('/app/worldline');
  }, [candidates, selectedCandidateIds, profile, addScenarioBatch, router]);

  const handleBack = useCallback(() => {
    setStep('select');
  }, []);

  // ── Event flow handlers ──

  const handleSelectPreset = useCallback(
    (preset: PresetEvent) => {
      setPickerOpen(false);
      setCustomizePreset(preset);
    },
    []
  );

  const handleSelectBundle = useCallback(
    (bundle: BundlePreset) => {
      const branch = bundleToBranches(bundle, profile);
      addCustomBranch(branch);
      // Auto-select the new branch
      setSelectedBranchIds([...selectedBranchIds, branch.id]);
      setPickerOpen(false);
    },
    [profile, addCustomBranch, selectedBranchIds, setSelectedBranchIds]
  );

  const handleCustomizeSave = useCallback(
    (branch: Branch) => {
      if (editingBranch) {
        const isDefault = defaultBranchIds.has(editingBranch.id);
        if (isDefault) {
          // Editing a default branch → create custom override
          let savedBranch: Branch;

          if (editingBranch.eventType === 'child') {
            // Child branches need two events (childcare + education)
            const childNum = (editingBranch.eventParams.childNumber as number) ?? 1;
            const newAge = branch.age ?? editingBranch.age ?? profile.currentAge + 2;
            const ts = Date.now();
            savedBranch = {
              id: `edited-${editingBranch.id}-${ts}`,
              label: editingBranch.label,
              detail: `${newAge}歳`,
              certainty: branch.certainty,
              age: newAge,
              eventType: '_direct',
              eventParams: {},
              directEvents: [
                {
                  id: `edited-${editingBranch.id}-childcare-${ts}`,
                  type: 'expense_increase',
                  name: `第${childNum}子 育児費`,
                  age: newAge,
                  amount: 100,
                  duration: 6,
                  isRecurring: true,
                },
                {
                  id: `edited-${editingBranch.id}-edu-${ts}`,
                  type: 'expense_increase',
                  name: `第${childNum}子 教育費`,
                  age: newAge + 6,
                  amount: 150,
                  duration: 16,
                  isRecurring: true,
                },
              ],
              overridesDefaultId: editingBranch.id,
            };
          } else {
            // Other defaults: use the dialog-generated branch
            savedBranch = { ...branch, overridesDefaultId: editingBranch.id };
          }

          addCustomBranch(savedBranch);
          // Replace in selectedBranchIds
          setSelectedBranchIds([
            ...selectedBranchIds.filter((id) => id !== editingBranch.id),
            savedBranch.id,
          ]);
        } else {
          // Editing an existing custom branch
          updateCustomBranch(editingBranch.id, branch);
        }
      } else {
        // Adding new
        addCustomBranch(branch);
        // Auto-select the new branch
        setSelectedBranchIds([...selectedBranchIds, branch.id]);
      }
      setCustomizePreset(null);
      setEditingBranch(null);
    },
    [editingBranch, defaultBranchIds, profile, updateCustomBranch, addCustomBranch, selectedBranchIds, setSelectedBranchIds]
  );

  const handleCustomizeDelete = useCallback(() => {
    if (editingBranch) {
      // Deleting a custom branch
      removeCustomBranch(editingBranch.id);
      if (editingBranch.overridesDefaultId) {
        // Override branch: restore the default by re-selecting its ID
        setSelectedBranchIds([
          ...selectedBranchIds.filter((id) => id !== editingBranch.id),
          editingBranch.overridesDefaultId,
        ]);
      } else {
        // Pure custom branch: just remove from selection
        setSelectedBranchIds(selectedBranchIds.filter((id) => id !== editingBranch.id));
      }
    }
    setEditingBranch(null);
    setCustomizePreset(null);
  }, [editingBranch, removeCustomBranch, selectedBranchIds, setSelectedBranchIds]);

  const handleCustomizeHide = useCallback(() => {
    if (editingBranch) {
      hideDefaultBranch(editingBranch.id);
      setSelectedBranchIds(selectedBranchIds.filter((id) => id !== editingBranch.id));
    }
    setEditingBranch(null);
    setCustomizePreset(null);
  }, [editingBranch, hideDefaultBranch, selectedBranchIds, setSelectedBranchIds]);

  const handleToggleCertainty = useCallback((branch: Branch) => {
    if (branch.auto || branch.certainty === 'confirmed') return;
    const newCertainty = branch.certainty === 'planned' ? 'uncertain' : 'planned';

    const isDefault = defaultBranchIds.has(branch.id);
    if (isDefault) {
      // Default branch → create custom override with toggled certainty
      const ts = Date.now();
      const overrideBranch: Branch = {
        ...branch,
        id: `toggled-${branch.id}-${ts}`,
        certainty: newCertainty,
        overridesDefaultId: branch.id,
      };
      addCustomBranch(overrideBranch);
      setSelectedBranchIds([
        ...selectedBranchIds.filter((id) => id !== branch.id),
        overrideBranch.id,
      ]);
    } else {
      // Custom branch → direct update
      updateCustomBranch(branch.id, { certainty: newCertainty });
    }
  }, [defaultBranchIds, addCustomBranch, updateCustomBranch, selectedBranchIds, setSelectedBranchIds]);

  const handleHideBranch = useCallback((branch: Branch) => {
    hideDefaultBranch(branch.id);
    setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branch.id));
  }, [hideDefaultBranch, selectedBranchIds, setSelectedBranchIds]);

  const handleDeleteBranch = useCallback((branch: Branch) => {
    removeCustomBranch(branch.id);
    if (branch.overridesDefaultId) {
      // Override branch: restore the default by re-selecting its ID
      setSelectedBranchIds([
        ...selectedBranchIds.filter((id) => id !== branch.id),
        branch.overridesDefaultId,
      ]);
    } else {
      // Pure custom branch: just remove from selection
      setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branch.id));
    }
  }, [removeCustomBranch, selectedBranchIds, setSelectedBranchIds]);

  const handleEditBranch = useCallback((branch: Branch) => {
    // Try real preset first (for custom branches from event catalog)
    const preset = PRESET_EVENTS.find((p) => p.id === branch.presetId);
    if (preset) {
      setEditingBranch(branch);
      setCustomizePreset(preset);
      return;
    }
    // Fall back to virtual preset for default branches
    const virtualPreset = branchToVirtualPreset(branch, profile);
    if (virtualPreset) {
      setEditingBranch(branch);
      setCustomizePreset(virtualPreset);
    }
  }, [profile]);

  // Message for zero uncertain branches selected
  const hasUncertain = selectedBranches.some((b) => b.certainty === 'uncertain');

  // Determine customize dialog open state
  const customizeOpen = !!customizePreset;

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl px-4 py-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">分岐ビルダー</h1>
        <p className="mt-1 text-sm text-brand-bronze">
          分岐を選び、世界線を生成します
        </p>
      </div>

      {/* First-visit guidance */}
      {nonAutoSelectedCount === 0 && step === 'select' && (
        <div className="mb-6 rounded-xl bg-brand-canvas border border-brand-sand p-4 text-sm text-brand-bronze space-y-1">
          <p>「計画」や「不確定」の分岐にチェックを入れて、下の「世界線を生成する」を押してください。</p>
          <p className="text-xs text-brand-bronze/60">組み合わせから最大5本の世界線を自動生成し、スコアで比較できます</p>
        </div>
      )}

      {/* Decision Tree: Full Width */}
      <div className="mb-8">
        <BranchTreeViz
          currentAge={profile.currentAge}
          selectedBranches={selectedBranches}
          candidates={step === 'preview' ? candidates : undefined}
          showScores={step === 'preview'}
        />
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <BranchTimeline
          profile={profile}
          selectedBranches={selectedBranches}
        />
      </div>

      {/* Events: Single Column */}
      <div>
        {step === 'select' ? (
          <div className="space-y-6">
            <BranchCategory
              certainty="confirmed"
              branches={confirmed}
              selectedIds={activeSelectedIds}
              onToggle={handleToggle}
            />
            <BranchCategory
              certainty="planned"
              branches={planned}
              selectedIds={activeSelectedIds}
              onToggle={handleToggle}
              onAddEvent={() => setPickerOpen(true)}
              onEditBranch={handleEditBranch}
              onDeleteBranch={handleDeleteBranch}
              deletableBranchIds={deletableBranchIds}
              onHideBranch={handleHideBranch}
              hidableBranchIds={hidableBranchIds}
              onToggleCertainty={handleToggleCertainty}
            />
            <BranchCategory
              certainty="uncertain"
              branches={uncertain}
              selectedIds={activeSelectedIds}
              onToggle={handleToggle}
              onAddEvent={() => setPickerOpen(true)}
              onEditBranch={handleEditBranch}
              onDeleteBranch={handleDeleteBranch}
              deletableBranchIds={deletableBranchIds}
              onHideBranch={handleHideBranch}
              hidableBranchIds={hidableBranchIds}
              onToggleCertainty={handleToggleCertainty}
            />

            {!hasUncertain && nonAutoSelectedCount > 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                不確定な分岐を加えると、より多くの世界線が生まれます
              </p>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={nonAutoSelectedCount === 0 || isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中… ({progress.current}/{progress.total})
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  世界線を生成する
                </>
              )}
            </Button>

            {/* Hidden default events (collapsible) */}
            {hiddenDefaults.length > 0 && (
              <details className="pt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  非表示のイベント（{hiddenDefaults.length}件）
                </summary>
                <div className="mt-2 space-y-1">
                  {hiddenDefaults.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <span className="text-muted-foreground">{branch.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unhideDefaultBranch(branch.id)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3 w-3" />
                        復活
                      </Button>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : (
          <WorldlinePreview
            candidates={candidates}
            selectedIds={selectedCandidateIds}
            onToggle={handleCandidateToggle}
            onCompare={handleCompare}
            onBack={handleBack}
          />
        )}
      </div>

      {/* Dialogs */}
      <EventPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectPreset={handleSelectPreset}
        onSelectBundle={handleSelectBundle}
        existingPresetIds={existingPresetIds}
        showPartnerPresets={profile.mode === 'couple'}
        isRenter={profile.homeStatus === 'renter'}
      />
      <EventCustomizeDialog
        open={customizeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCustomizePreset(null);
            setEditingBranch(null);
          }
        }}
        preset={customizePreset}
        existingBranch={editingBranch}
        profile={profile}
        onSave={handleCustomizeSave}
        onDelete={editingBranch && !defaultBranchIds.has(editingBranch.id) ? handleCustomizeDelete : undefined}
        onHide={editingBranch && defaultBranchIds.has(editingBranch.id) && !editingBranch.auto ? handleCustomizeHide : undefined}
      />

      {/* 次のステップ — 世界線が生成済みの場合のみ */}
      {scenarios.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">
            次のステップ
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            生成した世界線を並べて、余白とスコアを比較できます。
          </p>
          <Link
            href="/app/worldline"
            className="inline-flex items-center gap-1 text-sm text-brand-bronze hover:underline underline-offset-4"
          >
            世界線比較へ
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}
