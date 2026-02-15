'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, Home, Users, ChevronRight } from 'lucide-react';

import type { SimulationResult, Profile, LifeEvent } from '@/lib/types';
import type { SavedScenario } from '@/lib/store';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Target,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 差分の解釈用ヘルパー
function formatDiff(diff: number | null, unit: string) {
  if (diff === null || Number.isNaN(diff)) return { label: '—', type: 'unknown' as const };
  if (diff > 0) return { label: `${Math.abs(diff).toFixed(0)}${unit}`, type: 'surplus' as const };
  if (diff < 0) return { label: `${Math.abs(diff).toFixed(0)}${unit}`, type: 'cost' as const };
  return { label: '変化なし', type: 'neutral' as const };
}

interface V2InputSectionProps {
  renderMode: 'allocation' | 'decision';
  scenarios: SavedScenario[];
  selectedComparisonIds: string[];
  setSelectedComparisonIds: (ids: string[]) => void;
  simResult: SimulationResult | null;
  profile: Profile;
  allocation: { travel: number; invest: number; freeTime: number };
  setAllocation: (key: 'travel' | 'invest' | 'freeTime', value: number) => void;
  allocationDirty: boolean;
  resetAllocation: () => void;
  markAllocationSaved: () => void;
  saveAllocationAsScenario: (
    name: string,
    baseScenario: SavedScenario | null,
    allocationEvents: LifeEvent[]
  ) => { success: boolean; error?: string; scenario?: SavedScenario };
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  bridges: { housing: 'rent' | 'buy' | 'buy_later' | null; children: 0 | 1 | 2 | null };
  setHousingBridge: (value: 'rent' | 'buy' | 'buy_later' | null) => void;
  setChildrenBridge: (value: 0 | 1 | 2 | null) => void;
  setActiveTab: (tab: 'margins' | 'allocation' | 'decision' | 'worldlines' | 'strategy') => void;
}

export function V2InputSection(props: V2InputSectionProps) {
  const {
    renderMode,
    scenarios,
    selectedComparisonIds,
    setSelectedComparisonIds,
    simResult,
    profile,
    allocation,
    setAllocation,
    allocationDirty,
    resetAllocation,
    markAllocationSaved,
    saveAllocationAsScenario,
    toast,
    bridges,
    setHousingBridge,
    setChildrenBridge,
    setActiveTab,
  } = props;

  // ローカル state: 配分保存ダイアログ
  const [isAllocationSaveDialogOpen, setIsAllocationSaveDialogOpen] = useState(false);
  const [allocationScenarioName, setAllocationScenarioName] = useState('');

  if (renderMode === 'allocation') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-600" />
              余白の使い道
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="block">条件を変えたときに増える/減る余白を、人生のアウトカムに翻訳しています。</span>
              <span className="block">数値（余白スコア等）は変えず、意思決定の読み替えだけを行います。</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 注意書き - 常時表示 */}
            <p className="text-xs text-muted-foreground border-l-2 border-amber-400 pl-3 py-1 bg-amber-50/50 dark:bg-amber-950/20 rounded-r">
              これは最適解ではなく目安です。前提で変わります。決めるのは利用者です。
            </p>
            {/* 比較対象の選択 */}
            {scenarios.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">比較するシナリオを選択</Label>
                  <div className="flex flex-wrap gap-2">
                    {scenarios.slice(0, 3).map((scenario) => (
                      <Button
                        key={scenario.id}
                        variant={selectedComparisonIds.includes(scenario.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedComparisonIds.includes(scenario.id)) {
                            setSelectedComparisonIds(selectedComparisonIds.filter(id => id !== scenario.id));
                          } else if (selectedComparisonIds.length < 1) {
                            setSelectedComparisonIds([scenario.id]);
                          } else {
                            setSelectedComparisonIds([scenario.id]);
                          }
                        }}
                      >
                        {scenario.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 余白の内訳比較 - 現在 vs 選択中シナリオ */}
                {(() => {
                  const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id));
                  const baselineCF = simResult?.cashFlow;
                  const scenarioCF = selectedScenario?.result?.cashFlow;

                  // 差分計算（SoT参照のみ）: selected - baseline
                  const netCFDiff = baselineCF && scenarioCF
                    ? (scenarioCF.netCashFlow ?? 0) - (baselineCF.netCashFlow ?? 0)
                    : null;

                  const cfResult = formatDiff(netCFDiff, '万円/年');

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {selectedScenario
                            ? `現在 → ${selectedScenario.name}`
                            : 'シナリオを選択してください'}
                        </h4>
                      </div>

                      {selectedScenario ? (
                        <div className="space-y-4">
                          {/* メイン：年間キャッシュフロー差分 */}
                          <div className={cn(
                            "rounded-xl border-2 p-6 text-center",
                            cfResult.type === 'surplus' && "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                            cfResult.type === 'cost' && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                            cfResult.type === 'neutral' && "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30",
                            cfResult.type === 'unknown' && "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30"
                          )}>
                            {cfResult.type === 'unknown' ? (
                              <div className="text-muted-foreground">—</div>
                            ) : cfResult.type === 'surplus' ? (
                              <>
                                <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">余白</div>
                                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {cfResult.label}
                                </div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">増える</div>
                              </>
                            ) : cfResult.type === 'cost' ? (
                              <>
                                <div className="text-sm text-amber-700 dark:text-amber-400 mb-1">追加コスト</div>
                                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                                  {cfResult.label}
                                </div>
                                <div className="text-sm text-amber-600 dark:text-amber-500 mt-1">増える</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm text-muted-foreground mb-1">年間キャッシュフロー</div>
                                <div className="text-2xl font-bold text-muted-foreground">変化なし</div>
                              </>
                            )}
                          </div>

                          {/* 配分スライダーと翻訳カード（余白がある場合のみ表示） */}
                          {cfResult.type === 'surplus' && netCFDiff !== null && netCFDiff > 0 && (
                            <AllocationSliders
                              netCF={netCFDiff}
                              allocation={allocation}
                              setAllocation={setAllocation}
                              allocationDirty={allocationDirty}
                              resetAllocation={resetAllocation}
                              onSave={() => {
                                const baseName = selectedScenario?.name || '現在';
                                setAllocationScenarioName(`${baseName} + 旅行配分`);
                                setIsAllocationSaveDialogOpen(true);
                              }}
                            />
                          )}

                          {/* コストの場合の解釈 */}
                          {cfResult.type === 'cost' && (
                            <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
                              <h5 className="font-medium text-sm">追加コストの使い道</h5>
                              <p className="text-sm text-muted-foreground">
                                このシナリオでは年間コストが増えます。ライフイベント（駐在、サバティカル、子育て等）への投資として使われています。
                              </p>
                            </div>
                          )}

                          {/* 変化なしの場合 */}
                          {cfResult.type === 'neutral' && (
                            <div className="rounded-lg bg-muted/50 p-4">
                              <p className="text-sm text-muted-foreground">キャッシュフローに変化はありません。</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          上のボタンからシナリオを選択すると、現在との比較が表示されます
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              // シナリオがない場合は現在の余白（netCashFlow）を使用
              (() => {
                const baselineNetCF = simResult?.cashFlow?.netCashFlow;
                const hasMargin = baselineNetCF != null && !Number.isNaN(baselineNetCF) && baselineNetCF > 0;

                return hasMargin ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-6 text-center">
                      <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">現在の年間余白</div>
                      <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                        {baselineNetCF.toFixed(0)}万円/年
                      </div>
                    </div>

                    <AllocationSliders
                      netCF={baselineNetCF}
                      allocation={allocation}
                      setAllocation={setAllocation}
                      allocationDirty={allocationDirty}
                      resetAllocation={resetAllocation}
                      onSave={() => {
                        setAllocationScenarioName('現在 + 旅行配分');
                        setIsAllocationSaveDialogOpen(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      <Info className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">余白は小さめです</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        現在のキャッシュフローでは配分可能な余白がありません。タイムラインでシナリオを作成すると比較できます。
                      </p>
                    </div>
                    <a
                      href="/timeline"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 text-sm font-medium transition-colors"
                    >
                      タイムラインでシナリオを作成
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* 配分を世界線として保存するダイアログ */}
        <Dialog open={isAllocationSaveDialogOpen} onOpenChange={setIsAllocationSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>配分を世界線として保存</DialogTitle>
              <DialogDescription>
                旅・ライフスタイル配分を新しい世界線として保存します。
                元の世界線や選択中の世界線は変更されません。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="allocation-scenario-name">世界線の名前</Label>
                <Input
                  id="allocation-scenario-name"
                  value={allocationScenarioName}
                  onChange={(e) => setAllocationScenarioName(e.target.value)}
                  placeholder="例: 旅行重視プラン"
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium">反映される内容（v0.1）:</p>
                <ul className="text-muted-foreground text-xs space-y-1 ml-4 list-disc">
                  <li>旅・ライフスタイル: 年間支出イベントとして追加</li>
                  <li>投資: 翻訳のみ（世界線に反映されません）</li>
                  <li>自由時間: 翻訳のみ（世界線に反映されません）</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAllocationSaveDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  // 選択中のシナリオを取得
                  const selectedScenario = scenarios.find(s => selectedComparisonIds.includes(s.id)) || null;
                  const baseNetCF = selectedScenario?.result?.cashFlow?.netCashFlow
                    ?? simResult?.cashFlow?.netCashFlow
                    ?? 0;

                  // 旅・ライフスタイル配分をLifeEventに変換
                  const travelAmount = Math.round(baseNetCF * allocation.travel / 100);
                  const allocationEvents: LifeEvent[] = [];

                  if (travelAmount > 0) {
                    allocationEvents.push({
                      id: `allocation-travel-${Date.now()}`,
                      type: 'expense_increase',
                      name: '旅・ライフスタイル（配分）',
                      age: profile.currentAge,
                      amount: travelAmount,
                      duration: 10, // 10年間のデフォルト
                      isRecurring: true,
                    });
                  }

                  const result = saveAllocationAsScenario(
                    allocationScenarioName,
                    selectedScenario,
                    allocationEvents
                  );

                  if (result.success) {
                    toast({
                      title: '世界線を保存しました',
                      description: `「${result.scenario?.name}」を作成しました`,
                    });
                    markAllocationSaved();
                    setIsAllocationSaveDialogOpen(false);
                    setAllocationScenarioName('');
                  } else {
                    toast({
                      title: '保存に失敗しました',
                      description: result.error,
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={!allocationScenarioName.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // renderMode === 'decision'
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          意思決定の橋
        </CardTitle>
        <CardDescription>
          大きな意思決定を選択すると、その選択による余白の変化を確認できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2つのブリッジカード */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 住まいブリッジ */}
          <div className="rounded-xl border-2 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">住まい</h3>
                <p className="text-xs text-muted-foreground">住居費は人生最大の支出</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'rent' as const, label: '賃貸', desc: '柔軟性重視' },
                { value: 'buy' as const, label: '購入', desc: '資産形成' },
                { value: 'buy_later' as const, label: '将来購入', desc: '様子見' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHousingBridge(bridges.housing === option.value ? null : option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-center transition-all",
                    bridges.housing === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                </button>
              ))}
            </div>

            {bridges.housing && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {bridges.housing === 'rent' && '賃貸は初期コストが低く、転居の自由度が高い。資産は別途形成が必要。'}
                  {bridges.housing === 'buy' && '購入は長期的にコストが固定され、資産として残る。初期コストと維持費に注意。'}
                  {bridges.housing === 'buy_later' && '今は賃貸で様子を見て、条件が整ったら購入を検討。柔軟な戦略。'}
                </p>
              </div>
            )}
          </div>

          {/* 子どもブリッジ */}
          <div className="rounded-xl border-2 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">子ども</h3>
                <p className="text-xs text-muted-foreground">教育費は計画的に</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 0 as const, label: '0人', desc: '子なし' },
                { value: 1 as const, label: '1人', desc: '一人っ子' },
                { value: 2 as const, label: '2人', desc: '二人兄弟' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChildrenBridge(bridges.children === option.value ? null : option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-center transition-all",
                    bridges.children === option.value
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                </button>
              ))}
            </div>

            {bridges.children !== null && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {bridges.children === 0 && '子どもがいない場合、教育費は不要。自由度が高く、早期退職に有利。'}
                  {bridges.children === 1 && '1人の場合、教育費は約1,000〜2,000万円（大学まで）。計画的な準備を。'}
                  {bridges.children === 2 && '2人の場合、教育費は約2,000〜4,000万円。余白への影響大。'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 1: ブリッジ選択後 → 比較へ */}
        {(bridges.housing || bridges.children !== null) && (
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">ステップ1</Badge>
                  <h4 className="font-medium text-sm">世界線を比較する</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  この選択による数値の変化を比較表で確認します
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('worldlines')}
                size="sm"
              >
                比較へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* 選択なしの場合 */}
        {!bridges.housing && bridges.children === null && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            上の選択肢を選ぶと、その意思決定による余白の変化を確認できます
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 配分スライダー + 翻訳カードの共通コンポーネント（allocation 内部で再利用）
function AllocationSliders({
  netCF,
  allocation,
  setAllocation,
  allocationDirty,
  resetAllocation,
  onSave,
}: {
  netCF: number;
  allocation: { travel: number; invest: number; freeTime: number };
  setAllocation: (key: 'travel' | 'invest' | 'freeTime', value: number) => void;
  allocationDirty: boolean;
  resetAllocation: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">この余白をどう使う？（目安）</h5>
        <div className="flex items-center gap-2">
          {allocationDirty && (
            <>
              <span className="text-xs text-amber-600 dark:text-amber-400">未保存の変更あり</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllocation}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                リセット
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">配分を変えても主要KPIには影響しません。考え方の整理用です。</p>

      {/* 配分スライダー */}
      <div className="space-y-4">
        {/* 旅・ライフスタイル */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">旅・ライフスタイル</span>
            <span className="text-sm font-medium tabular-nums">{allocation.travel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.travel}
            onChange={(e) => setAllocation('travel', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* 投資 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">投資</span>
            <span className="text-sm font-medium tabular-nums">{allocation.invest}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.invest}
            onChange={(e) => setAllocation('invest', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* 自由時間 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">自由時間</span>
            <span className="text-sm font-medium tabular-nums">{allocation.freeTime}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.freeTime}
            onChange={(e) => setAllocation('freeTime', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
        </div>
      </div>

      {/* 翻訳カード */}
      <div className="grid gap-3 sm:grid-cols-3 pt-2">
        {/* 旅・ライフスタイル */}
        <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">追加旅行予算（年額目安）</div>
          <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            {Math.round(netCF * allocation.travel / 100)}万円
          </div>
          <div className="text-xs text-muted-foreground">
            約{Math.max(0, Math.floor(netCF * allocation.travel / 100 / 30))}回分
            <span className="text-xs ml-1">(1回30万円換算)</span>
          </div>
        </div>

        {/* 投資 */}
        <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">元本配分（年額目安）</div>
          <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
            {Math.round(netCF * allocation.invest / 100)}万円
          </div>
          <div className="text-xs text-muted-foreground">
            10年後: 約{Math.round(netCF * allocation.invest / 100 * 10 * 1.63)}万円
            <span className="text-xs ml-1">(年5%複利)</span>
          </div>
        </div>

        {/* 自由時間 */}
        <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">余白時間（年換算目安）</div>
          <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
            {(netCF * allocation.freeTime / 100 / 500).toFixed(1)}年分
          </div>
          <div className="text-xs text-muted-foreground">
            年収500万円換算での労働時間削減
          </div>
        </div>
      </div>

      {/* Step 3: 配分を世界線として保存 */}
      {allocation.travel > 0 && (
        <div className="pt-4 border-t rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">ステップ3</Badge>
            <h4 className="font-medium text-sm">世界線として保存</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            この配分を新しい世界線として保存し、比較に使えるようにします
          </p>
          <Button
            onClick={onSave}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            世界線として保存
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            旅・ライフスタイル配分のみ反映（v0.1）
          </p>
        </div>
      )}
    </div>
  );
}
