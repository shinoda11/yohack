'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Check, X, RotateCcw, GitCompare } from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useProfileStore, type SavedScenario } from '@/lib/store';
import type { SimulationResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ScenarioComparisonCardProps {
  currentResult: SimulationResult | null;
}

// Format date to relative time
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// Format metrics for display
function formatMetric(value: number | null | undefined, type: 'age' | 'percent' | 'asset'): string {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'age':
      return `${value}歳`;
    case 'percent':
      return `${value.toFixed(0)}%`;
    case 'asset':
      if (value >= 10000) return `${(value / 10000).toFixed(1)}億`;
      if (value < 0) return `-${Math.abs(value).toLocaleString()}万`;
      return `${value.toLocaleString()}万`;
    default:
      return String(value);
  }
}

export function ScenarioComparisonCard({ currentResult }: ScenarioComparisonCardProps) {
  const { 
    scenarios, 
    comparisonIds,
    saveScenario, 
    deleteScenario, 
    loadScenario,
    toggleComparison,
    clearComparison,
    initializeFromStorage,
  } = useProfileStore();
  
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);
  
  // Handle save
  const handleSave = () => {
    if (!newScenarioName.trim()) return;
    saveScenario(newScenarioName.trim());
    setNewScenarioName('');
    setIsSaving(false);
  };
  
  // Get comparison scenarios
  const comparisonScenarios = scenarios.filter(s => comparisonIds.includes(s.id));
  
  // Build comparison data: current + selected scenarios (max 3)
  const comparisonData: Array<{
    id: string;
    name: string;
    isCurrent: boolean;
    result: SimulationResult | null;
    createdAt?: string;
  }> = [
    { id: 'current', name: '現在', isCurrent: true, result: currentResult },
    ...comparisonScenarios.map(s => ({
      id: s.id,
      name: s.name,
      isCurrent: false,
      result: s.result,
      createdAt: s.createdAt,
    })),
  ];

  return (
    <SectionCard
      icon={<GitCompare className="h-5 w-5" />}
      title="世界線比較"
      description="異なる選択肢を並べて比較する"
    >
      <div className="space-y-4">
        {/* Save new scenario */}
        <div className="flex items-center gap-2">
          {isSaving ? (
            <>
              <Input
                placeholder="シナリオ名"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={handleSave} disabled={!newScenarioName.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={() => { setIsSaving(false); setNewScenarioName(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsSaving(true)}
              className="min-h-[44px] text-xs bg-transparent"
            >
              <Save className="h-3 w-3 mr-1" />
              現在の状態を保存
            </Button>
          )}
        </div>
        
        {/* Comparison table - 4 columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-linen dark:border-brand-stone">
                <th className="text-left py-2 pr-2 font-normal text-brand-bronze text-xs">世界線</th>
                <th className="text-right py-2 px-2 font-normal text-brand-bronze text-xs">安心ライン</th>
                <th className="text-right py-2 px-2 font-normal text-brand-bronze text-xs">成功確率</th>
                <th className="text-right py-2 px-2 font-normal text-brand-bronze text-xs">100歳資産</th>
                <th className="text-right py-2 pl-2 font-normal text-brand-bronze text-xs">余白開始</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item) => (
                <tr 
                  key={item.id}
                  className={cn(
                    "border-b border-brand-canvas dark:border-brand-stone/50 last:border-b-0",
                    item.isCurrent && "bg-brand-canvas/50 dark:bg-brand-night/50"
                  )}
                >
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-sm",
                        item.isCurrent ? "font-normal text-brand-night dark:text-brand-linen" : "text-brand-stone dark:text-brand-linen"
                      )}>
                        {item.name}
                      </span>
                      {item.isCurrent && (
                        <span className="text-[10px] px-1 py-0.5 rounded-lg bg-brand-linen text-brand-bronze dark:bg-brand-stone dark:text-brand-bronze/60">
                          今
                        </span>
                      )}
                    </div>
                    {item.createdAt && (
                      <span className="text-[10px] text-brand-bronze/60">{formatRelativeTime(item.createdAt)}</span>
                    )}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-brand-stone dark:text-brand-linen">
                    {formatMetric(item.result?.metrics.fireAge, 'age')}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-brand-stone dark:text-brand-linen">
                    {formatMetric(item.result?.metrics.survivalRate, 'percent')}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-brand-stone dark:text-brand-linen">
                    {formatMetric(item.result?.metrics.assetAt100, 'asset')}
                  </td>
                  <td className="text-right py-2 pl-2 tabular-nums text-brand-stone dark:text-brand-linen">
                    {formatMetric(item.result?.metrics.fireAge, 'age')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Saved scenarios list */}
        {scenarios.length > 0 && (
          <div className="pt-3 border-t border-brand-linen dark:border-brand-stone">
            <p className="text-xs text-brand-bronze mb-2">保存済み ({scenarios.length}件) - 比較に追加</p>
            <div className="space-y-1">
              {scenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="flex items-center justify-between min-h-[44px] py-2 group"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`compare-${scenario.id}`}
                      checked={comparisonIds.includes(scenario.id)}
                      onCheckedChange={() => toggleComparison(scenario.id)}
                      disabled={!comparisonIds.includes(scenario.id) && comparisonIds.length >= 2}
                      className="h-4 w-4"
                    />
                    <label 
                      htmlFor={`compare-${scenario.id}`}
                      className="text-sm text-brand-stone dark:text-brand-linen cursor-pointer"
                    >
                      {scenario.name}
                    </label>
                    <span className="text-[10px] text-brand-bronze/60">
                      {formatRelativeTime(scenario.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-brand-bronze/60 hover:text-brand-bronze"
                      onClick={() => loadScenario(scenario.id)}
                      title="読み込む"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-brand-bronze/60 hover:text-brand-stone"
                      onClick={() => deleteScenario(scenario.id)}
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Clear comparison */}
        {comparisonIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearComparison}
            className="min-h-[44px] text-xs text-brand-bronze/60 hover:text-brand-bronze"
          >
            比較をクリア
          </Button>
        )}
        
        {/* Empty state */}
        {scenarios.length === 0 && (
          <p className="text-xs text-brand-bronze/60 text-center py-2">
            世界線を保存すると、ここで比較できます
          </p>
        )}
      </div>
    </SectionCard>
  );
}
