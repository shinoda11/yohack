'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import {
  PRESET_EVENTS,
  BUNDLE_PRESETS,
  CATEGORIES,
  isPartnerPreset,
  type EventCategory,
  type PresetEvent,
  type BundlePreset,
} from '@/lib/event-catalog';
import { cn } from '@/lib/utils';

interface EventPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (preset: PresetEvent) => void;
  onSelectBundle: (bundle: BundlePreset) => void;
  existingPresetIds: Set<string>;
  showPartnerPresets: boolean;
  isRenter: boolean;
}

const ALL_CATEGORIES = [
  { key: 'all' as const, label: 'すべて', icon: '📋' },
  ...Object.entries(CATEGORIES).map(([key, meta]) => ({
    key: key as EventCategory,
    label: meta.label,
    icon: meta.icon,
  })),
];

export function EventPickerDialog({
  open,
  onOpenChange,
  onSelectPreset,
  onSelectBundle,
  existingPresetIds,
  showPartnerPresets,
  isRenter,
}: EventPickerDialogProps) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');

  const filteredPresets = useMemo(() => {
    return PRESET_EVENTS.filter((preset) => {
      // Filter by category
      if (activeCategory !== 'all' && preset.category !== activeCategory) return false;
      // Hide partner presets in solo mode
      if (!showPartnerPresets && isPartnerPreset(preset)) return false;
      // Hide housing_purchase if already an owner
      if (preset.id === 'housing_purchase' && !isRenter) return false;
      return true;
    });
  }, [activeCategory, showPartnerPresets, isRenter]);

  const filteredBundles = useMemo(() => {
    return BUNDLE_PRESETS.filter((bundle) => {
      if (activeCategory !== 'all' && bundle.category !== activeCategory) return false;
      if (!showPartnerPresets && bundle.coupleOnly) return false;
      return true;
    });
  }, [activeCategory, showPartnerPresets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>イベントを追加</DialogTitle>
          <DialogDescription>
            分岐に追加するイベントを選択
          </DialogDescription>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 px-6 scrollbar-none">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1 shrink-0 px-4 py-2.5 rounded-full text-xs font-medium transition-colors min-h-[44px]',
                activeCategory === cat.key
                  ? 'bg-brand-night text-brand-linen'
                  : 'bg-accent/50 text-muted-foreground hover:bg-accent'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Preset list */}
        <div className="overflow-y-auto flex-1 px-6 pb-2" style={{ maxHeight: '50vh' }}>
          <div className="space-y-1">
            {filteredPresets.map((preset) => {
              const isAdded = existingPresetIds.has(preset.id);
              return (
                <div
                  key={preset.id}
                  className={cn(
                    'flex items-center gap-4 min-h-[44px] px-3 py-2 rounded-md transition-colors',
                    isAdded ? 'opacity-50' : 'hover:bg-accent/50'
                  )}
                >
                  <span className="text-lg shrink-0" aria-hidden="true">
                    {preset.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {preset.name}
                      </span>
                      {isAdded && (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          追加済み
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {preset.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-11 w-11"
                    disabled={isAdded}
                    onClick={() => onSelectPreset(preset)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Bundles */}
          {filteredBundles.length > 0 && (
            <>
              <div className="my-4 border-t" />
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                セットプリセット
              </p>
              <div className="space-y-1">
                {filteredBundles.map((bundle) => {
                  const isAdded = existingPresetIds.has(bundle.id);
                  return (
                    <div
                      key={bundle.id}
                      className={cn(
                        'flex items-center gap-4 min-h-[44px] px-3 py-2 rounded-md transition-colors',
                        isAdded ? 'opacity-50' : 'hover:bg-accent/50'
                      )}
                    >
                      <span className="text-lg shrink-0" aria-hidden="true">
                        {bundle.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {bundle.name}
                          </span>
                          {isAdded && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              追加済み
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {bundle.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-11 w-11"
                        disabled={isAdded}
                        onClick={() => onSelectBundle(bundle)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {filteredPresets.length === 0 && filteredBundles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              該当するイベントがありません
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
