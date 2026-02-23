'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { SavedScenario } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ScenarioSelectorProps {
  scenarios: SavedScenario[];
  visibleScenarioIds: string[];
  toggleScenarioVisibility: (id: string, maxVisible?: number) => void;
}

function getSourceLabel(id: string): string {
  return id.startsWith('branch-') ? '分岐' : '保存';
}

export function ScenarioSelector({
  scenarios,
  visibleScenarioIds,
  toggleScenarioVisibility,
}: ScenarioSelectorProps) {
  // Responsive: 2 on mobile, 3 on desktop
  const [maxVisible, setMaxVisible] = useState(3);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 640px)');
    const update = () => setMaxVisible(mql.matches ? 3 : 2);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  if (scenarios.length === 0) return null;

  // Sort: branch-* first, then by createdAt desc
  const sorted = [...scenarios].sort((a, b) => {
    const aIsBranch = a.id.startsWith('branch-');
    const bIsBranch = b.id.startsWith('branch-');
    if (aIsBranch && !bIsBranch) return -1;
    if (!aIsBranch && bIsBranch) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const visibleCount = visibleScenarioIds.length;
  const atLimit = visibleCount >= maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs text-muted-foreground shrink-0">
        表示 ({visibleCount}/{maxVisible})
      </span>
      {sorted.map((scenario) => {
        const isVisible = visibleScenarioIds.includes(scenario.id);
        const disabled = !isVisible && atLimit;
        return (
          <label
            key={scenario.id}
            className={cn(
              'flex items-center gap-1.5 min-h-[44px] cursor-pointer text-sm',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Checkbox
              checked={isVisible}
              onCheckedChange={() => toggleScenarioVisibility(scenario.id, maxVisible)}
              disabled={disabled}
              className="h-4 w-4"
            />
            <span className={isVisible ? 'text-foreground' : 'text-muted-foreground'}>
              {scenario.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {getSourceLabel(scenario.id)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
