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
      title="シナリオ比較"
      description="保存して比較（最大3つ）"
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
              <Button size="sm" variant="ghost" onClick={handleSave} disabled={!newScenarioName.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsSaving(false); setNewScenarioName(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsSaving(true)}
              className="text-xs bg-transparent"
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
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2 pr-2 font-medium text-gray-500 text-xs">世界線</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">安心ライン</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">成功確率</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 text-xs">100歳資産</th>
                <th className="text-right py-2 pl-2 font-medium text-gray-500 text-xs">余白開始</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item) => (
                <tr 
                  key={item.id}
                  className={cn(
                    "border-b border-gray-50 dark:border-gray-800/50 last:border-b-0",
                    item.isCurrent && "bg-gray-50/50 dark:bg-gray-900/50"
                  )}
                >
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-sm",
                        item.isCurrent ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {item.name}
                      </span>
                      {item.isCurrent && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          今
                        </span>
                      )}
                    </div>
                    {item.createdAt && (
                      <span className="text-[10px] text-gray-400">{formatRelativeTime(item.createdAt)}</span>
                    )}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-gray-700 dark:text-gray-300">
                    {formatMetric(item.result?.metrics.fireAge, 'age')}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-gray-700 dark:text-gray-300">
                    {formatMetric(item.result?.metrics.survivalRate, 'percent')}
                  </td>
                  <td className="text-right py-2 px-2 tabular-nums text-gray-700 dark:text-gray-300">
                    {formatMetric(item.result?.metrics.assetAt100, 'asset')}
                  </td>
                  <td className="text-right py-2 pl-2 tabular-nums text-gray-700 dark:text-gray-300">
                    {formatMetric(item.result?.metrics.fireAge, 'age')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Saved scenarios list */}
        {scenarios.length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-2">保存済み ({scenarios.length}件) - 比較に追加</p>
            <div className="space-y-1">
              {scenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="flex items-center justify-between py-1.5 group"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`compare-${scenario.id}`}
                      checked={comparisonIds.includes(scenario.id)}
                      onCheckedChange={() => toggleComparison(scenario.id)}
                      disabled={!comparisonIds.includes(scenario.id) && comparisonIds.length >= 2}
                      className="h-3.5 w-3.5"
                    />
                    <label 
                      htmlFor={`compare-${scenario.id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {scenario.name}
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {formatRelativeTime(scenario.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-600"
                      onClick={() => loadScenario(scenario.id)}
                      title="読み込む"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-red-500"
                      onClick={() => deleteScenario(scenario.id)}
                      title="削除"
                    >
                      <Trash2 className="h-3 w-3" />
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
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            比較をクリア
          </Button>
        )}
        
        {/* Empty state */}
        {scenarios.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">
            シナリオを保存して比較できます
          </p>
        )}
      </div>
    </SectionCard>
  );
}
