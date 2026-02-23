'use client';

import Link from 'next/link';
import type { SimulationResult, Profile } from '@/lib/types';
import type { SavedScenario } from '@/lib/store';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  ArrowRight,
  ChevronRight,
  CalendarDays,
  Save,
  Columns,
  Info,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { worldlineTemplates } from '@/lib/worldline-templates';
import { cn } from '@/lib/utils';

interface V2ComparisonViewProps {
  simResult: SimulationResult | null;
  profile: Profile;
  scenarios: SavedScenario[];
  selectedComparisonIds: string[];
  toggleComparisonId: (id: string) => void;
  clearComparisonIds: () => void;
  loadScenario: (id: string) => void;
  setActiveTab: (tab: 'worldlines' | 'margins' | 'strategy') => void;
  onApplyTemplate?: (templateId: string) => void;
  applyingTemplate?: string | null;
}

/** Y-branch symbol for the empty state */
function YBranchSymbol() {
  return (
    <svg
      width={64}
      height={64}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="90" y1="94" x2="42" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
      <circle cx="90" cy="94" r="9" fill="var(--brand-gold)" />
      <circle cx="42" cy="34" r="6" fill="var(--brand-gold)" opacity="0.5" />
      <circle cx="138" cy="34" r="6" fill="var(--brand-gold)" opacity="0.5" />
    </svg>
  );
}

const steps = [
  {
    icon: <CalendarDays className="h-5 w-5 text-brand-gold" />,
    title: '条件を変える',
    description: '転職・出産・住宅購入などのイベントを追加',
  },
  {
    icon: <Save className="h-5 w-5 text-brand-gold" />,
    title: 'シナリオを保存',
    description: '現在の条件に名前をつけて保存',
  },
  {
    icon: <Columns className="h-5 w-5 text-brand-gold" />,
    title: '並べて比較',
    description: '最大3つのシナリオを並べて比較',
  },
];

export function V2ComparisonView(props: V2ComparisonViewProps) {
  const {
    simResult,
    profile,
    scenarios,
    selectedComparisonIds,
    toggleComparisonId,
    clearComparisonIds,
    loadScenario,
    setActiveTab,
    onApplyTemplate,
    applyingTemplate,
  } = props;

  // --- Empty state ---
  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 px-6">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            {/* Y-branch symbol */}
            <YBranchSymbol />

            {/* Heading */}
            <h3
              className="mt-6 text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
            >
              世界線を作って、比較する
            </h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              同じ前提で異なる選択肢を並べると、<br className="hidden sm:inline" />
              どの年代にどれだけ余白が残るか見えてきます。
            </p>

            {/* Step guide */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3 w-full">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4 text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-gold/10">
                      {step.icon}
                    </div>
                    <span className="text-xs font-normal text-brand-gold">ステップ{i + 1}</span>
                  </div>
                  <h4 className="text-sm font-normal">{step.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/app/branch" className="mt-8">
              <Button className="bg-brand-gold hover:bg-brand-bronze text-white gap-2">
                分岐ビルダーでシナリオを作成する
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Pre-compute raw values for comparison highlighting ---
  const currentRaw = {
    fireAge: (() => {
      if (!simResult) return null;
      const age = simResult.metrics.fireAge;
      return (age == null || age > 100) ? null : age;
    })(),
    assets60: (() => {
      if (!simResult?.paths.yearlyData || profile.currentAge > 60) return null;
      const idx = Math.min(60 - profile.currentAge, simResult.paths.yearlyData.length - 1);
      const assets = simResult.paths.yearlyData[idx]?.assets;
      return (assets == null || Number.isNaN(assets)) ? null : assets;
    })(),
    monthlyCF: (() => {
      const netCF = simResult?.cashFlow?.netCashFlow;
      if (netCF == null || Number.isNaN(netCF)) return null;
      return Math.round(netCF / 12);
    })(),
    drawdownAge: (() => {
      if (!simResult?.paths.yearlyData) return null;
      const ddIdx = simResult.paths.yearlyData.findIndex((y, i) =>
        i > 0 && y.assets < simResult.paths.yearlyData[i - 1].assets
      );
      return ddIdx > 0 ? profile.currentAge + ddIdx : null;
    })(),
  };

  const scenarioRawMap = new Map(scenarios.slice(0, 3).map((scenario) => [scenario.id, {
    fireAge: (() => {
      if (!scenario.result) return null;
      const age = scenario.result.metrics.fireAge;
      return (age == null || age > 100) ? null : age;
    })(),
    assets60: (() => {
      const data = scenario.result?.paths.yearlyData;
      if (!data || scenario.profile.currentAge > 60) return null;
      const idx = Math.min(60 - scenario.profile.currentAge, data.length - 1);
      const assets = data[idx]?.assets;
      return (assets == null || Number.isNaN(assets)) ? null : assets;
    })(),
    monthlyCF: (() => {
      const netCF = scenario.result?.cashFlow?.netCashFlow;
      if (netCF == null || Number.isNaN(netCF)) return null;
      return Math.round(netCF / 12);
    })(),
    drawdownAge: (() => {
      const data = scenario.result?.paths.yearlyData;
      if (!data) return null;
      const ddIdx = data.findIndex((y, i) => i > 0 && y.assets < data[i - 1].assets);
      return ddIdx > 0 ? scenario.profile.currentAge + ddIdx : null;
    })(),
  }]));

  type MetricKey = 'fireAge' | 'assets60' | 'monthlyCF' | 'drawdownAge';
  const rowHasDiff = (metric: MetricKey) =>
    scenarios.slice(0, 3).some((s) => scenarioRawMap.get(s.id)?.[metric] !== currentRaw[metric]);

  // Unused worldline templates (for add-worldline prompt)
  const usedNames = new Set(scenarios.map(s => s.name));
  const unusedTemplates = worldlineTemplates.filter(t =>
    t.isRelevant(profile) &&
    !usedNames.has(t.baselineName) &&
    !usedNames.has(t.variantName)
  );

  // --- Comparison table (1+ scenarios) ---
  return (
    <>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          世界線比較
        </CardTitle>
        <CardDescription>
          現在の状態と保存済みシナリオを並列比較
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 比較表 */}
        <p className="text-xs text-muted-foreground mb-2 sm:hidden">← 横スクロールできます</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-normal text-muted-foreground w-40">指標</th>
                <th className="text-center py-3 px-2 font-normal min-w-32">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="default" className="bg-primary">現在</Badge>
                    <span className="text-xs text-muted-foreground">ベースライン</span>
                  </div>
                </th>
                {scenarios.slice(0, 3).map((scenario) => (
                  <th key={scenario.id} className="text-center py-3 px-2 font-normal min-w-32">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleComparisonId(scenario.id)}
                        className={cn(
                          "px-3 py-2 min-h-[44px] rounded-lg text-xs font-normal transition-colors",
                          selectedComparisonIds.includes(scenario.id)
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {scenario.name}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {new Date(scenario.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 安心ライン到達年齢 */}
              <tr className={cn("border-b hover:bg-muted/30", rowHasDiff('fireAge') && "bg-brand-gold/[0.08]")}>
                <td className="py-3 px-2 font-normal">安心ライン到達年齢</td>
                <td className="text-center py-3 px-2 tabular-nums font-bold">
                  {(() => {
                    if (!simResult) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    const age = simResult.metrics.fireAge;
                    if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                    return `${age}歳`;
                  })()}
                </td>
                {scenarios.slice(0, 3).map((scenario) => {
                  const sRaw = scenarioRawMap.get(scenario.id);
                  const delta = (sRaw?.fireAge != null && currentRaw.fireAge != null)
                    ? sRaw.fireAge - currentRaw.fireAge : null;
                  return (
                    <td key={scenario.id} className={cn(
                      "text-center py-3 px-2 tabular-nums font-bold",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {(() => {
                        if (!scenario.result) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                        const age = scenario.result.metrics.fireAge;
                        if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                        return `${age}歳`;
                      })()}
                      {delta != null && delta !== 0 && (
                        <span className={cn("inline-flex items-center gap-0.5 text-xs mt-0.5", delta < 0 ? "text-safe" : "text-brand-bronze")}>
                          {delta < 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {delta > 0 ? '+' : ''}{delta}歳
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 60歳時点の資産 */}
              <tr className={cn("border-b hover:bg-muted/30", rowHasDiff('assets60') && "bg-brand-gold/[0.08]")}>
                <td className="py-3 px-2 font-normal">60歳時点資産</td>
                <td className="text-center py-3 px-2 tabular-nums font-bold">
                  {(() => {
                    if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    if (profile.currentAge > 60) return <span className="text-muted-foreground text-xs">なし</span>;
                    const idx = Math.min(60 - profile.currentAge, simResult.paths.yearlyData.length - 1);
                    const assets = simResult.paths.yearlyData[idx]?.assets;
                    if (assets == null || Number.isNaN(assets)) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    return `${(assets / 10000).toFixed(1)}億`;
                  })()}
                </td>
                {scenarios.slice(0, 3).map((scenario) => {
                  const sRaw = scenarioRawMap.get(scenario.id);
                  const delta = (sRaw?.assets60 != null && currentRaw.assets60 != null)
                    ? sRaw.assets60 - currentRaw.assets60 : null;
                  const deltaText = delta != null && delta !== 0
                    ? `${delta > 0 ? '+' : ''}${Math.round(delta).toLocaleString()}万`
                    : null;
                  const deltaClass = delta != null && delta !== 0
                    ? (delta > 0 ? 'text-safe' : 'text-brand-bronze') : undefined;

                  const data = scenario.result?.paths.yearlyData;
                  if (!data) {
                    return (
                      <td key={scenario.id} className={cn(
                        "text-center py-3 px-2 text-muted-foreground text-xs",
                        selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                      )}>—（未計算）</td>
                    );
                  }
                  if (scenario.profile.currentAge > 60) {
                    return (
                      <td key={scenario.id} className={cn(
                        "text-center py-3 px-2 text-muted-foreground text-xs",
                        selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                      )}>なし</td>
                    );
                  }
                  const idx = Math.min(60 - scenario.profile.currentAge, data.length - 1);
                  const assets = data[idx]?.assets;
                  if (assets == null || Number.isNaN(assets)) {
                    return (
                      <td key={scenario.id} className={cn(
                        "text-center py-3 px-2 text-muted-foreground text-xs",
                        selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                      )}>—（未計算）</td>
                    );
                  }
                  return (
                    <td key={scenario.id} className={cn(
                      "text-center py-3 px-2 tabular-nums font-bold",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {`${(assets / 10000).toFixed(1)}億`}
                      {deltaText && delta != null && delta !== 0 && (
                        <span className={cn("inline-flex items-center gap-0.5 text-xs mt-0.5", deltaClass)}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {deltaText}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 40-50代平均月次CFマージン - SoTのcashFlow.netCashFlowを参照 */}
              <tr className={cn("border-b hover:bg-muted/30", rowHasDiff('monthlyCF') && "bg-brand-gold/[0.08]")}>
                <td className="py-3 px-2 font-normal">現在の月次CF</td>
                <td className="text-center py-3 px-2 tabular-nums font-bold">
                  {(() => {
                    const netCF = simResult?.cashFlow?.netCashFlow;
                    if (netCF == null || Number.isNaN(netCF)) {
                      return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    }
                    const monthlyCF = netCF / 12;
                    return `${monthlyCF.toFixed(0)}万/月`;
                  })()}
                </td>
                {scenarios.slice(0, 3).map((scenario) => {
                  const sRaw = scenarioRawMap.get(scenario.id);
                  const delta = (sRaw?.monthlyCF != null && currentRaw.monthlyCF != null)
                    ? sRaw.monthlyCF - currentRaw.monthlyCF : null;

                  const netCF = scenario.result?.cashFlow?.netCashFlow;
                  if (netCF == null || Number.isNaN(netCF)) {
                    return (
                      <td key={scenario.id} className={cn(
                        "text-center py-3 px-2 text-muted-foreground text-xs",
                        selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                      )}>—（未計算）</td>
                    );
                  }
                  const monthlyCF = netCF / 12;
                  return (
                    <td key={scenario.id} className={cn(
                      "text-center py-3 px-2 tabular-nums font-bold",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {`${monthlyCF.toFixed(0)}万/月`}
                      {delta != null && delta !== 0 && (
                        <span className={cn("inline-flex items-center gap-0.5 text-xs mt-0.5", delta > 0 ? "text-safe" : "text-brand-bronze")}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {delta > 0 ? '+' : ''}{delta}万/月
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 取り崩し開始年齢 */}
              <tr className={cn("hover:bg-muted/30", rowHasDiff('drawdownAge') && "bg-brand-gold/[0.08]")}>
                <td className="py-3 px-2 font-normal">取り崩し開始</td>
                <td className="text-center py-3 px-2 tabular-nums font-bold">
                  {(() => {
                    if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    const ddIdx = simResult.paths.yearlyData.findIndex((y, i) =>
                      i > 0 && y.assets < simResult.paths.yearlyData[i - 1].assets
                    );
                    return ddIdx > 0
                      ? `${profile.currentAge + ddIdx}歳`
                      : <span className="text-muted-foreground text-xs">なし</span>;
                  })()}
                </td>
                {scenarios.slice(0, 3).map((scenario) => {
                  const sRaw = scenarioRawMap.get(scenario.id);
                  const delta = (sRaw?.drawdownAge != null && currentRaw.drawdownAge != null)
                    ? sRaw.drawdownAge - currentRaw.drawdownAge : null;

                  const data = scenario.result?.paths.yearlyData;
                  if (!data) {
                    return (
                      <td key={scenario.id} className={cn(
                        "text-center py-3 px-2 text-muted-foreground text-xs",
                        selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                      )}>—（未計算）</td>
                    );
                  }
                  const ddIdx = data.findIndex((y, i) => i > 0 && y.assets < data[i - 1].assets);
                  return (
                    <td key={scenario.id} className={cn(
                      "text-center py-3 px-2",
                      ddIdx > 0 ? "tabular-nums font-bold" : "text-muted-foreground text-xs",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {ddIdx > 0 ? `${scenario.profile.currentAge + ddIdx}歳` : 'なし'}
                      {delta != null && delta !== 0 && (
                        <span className={cn("inline-flex items-center gap-0.5 text-xs mt-0.5", delta > 0 ? "text-safe" : "text-brand-bronze")}>
                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {delta > 0 ? '+' : ''}{delta}歳
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 全指標同一ガイド */}
        {(() => {
          // 各シナリオの4指標が「現在」と全て同一かチェック
          const currentFireAge = simResult?.metrics.fireAge ?? null;
          const currentAssets60 = (() => {
            if (!simResult?.paths.yearlyData || profile.currentAge > 60) return null;
            const idx = Math.min(60 - profile.currentAge, simResult.paths.yearlyData.length - 1);
            return simResult.paths.yearlyData[idx]?.assets ?? null;
          })();
          const currentMonthlyCF = (() => {
            const netCF = simResult?.cashFlow?.netCashFlow;
            if (netCF == null || Number.isNaN(netCF)) return null;
            return Math.round(netCF / 12);
          })();
          const currentDrawdownAge = (() => {
            if (!simResult?.paths.yearlyData) return null;
            const ddIdx = simResult.paths.yearlyData.findIndex((y, i) =>
              i > 0 && y.assets < simResult.paths.yearlyData[i - 1].assets
            );
            return ddIdx > 0 ? profile.currentAge + ddIdx : null;
          })();

          const allSame = scenarios.slice(0, 3).every((scenario) => {
            const sFireAge = scenario.result?.metrics.fireAge ?? null;
            const sAssets60 = (() => {
              const data = scenario.result?.paths.yearlyData;
              if (!data || scenario.profile.currentAge > 60) return null;
              const idx = Math.min(60 - scenario.profile.currentAge, data.length - 1);
              return data[idx]?.assets ?? null;
            })();
            const sMonthlyCF = (() => {
              const netCF = scenario.result?.cashFlow?.netCashFlow;
              if (netCF == null || Number.isNaN(netCF)) return null;
              return Math.round(netCF / 12);
            })();
            const sDrawdownAge = (() => {
              const data = scenario.result?.paths.yearlyData;
              if (!data) return null;
              const ddIdx = data.findIndex((y, i) => i > 0 && y.assets < data[i - 1].assets);
              return ddIdx > 0 ? scenario.profile.currentAge + ddIdx : null;
            })();

            return sFireAge === currentFireAge
              && sAssets60 === currentAssets60
              && sMonthlyCF === currentMonthlyCF
              && sDrawdownAge === currentDrawdownAge;
          });

          if (!allSame) return null;

          return (
            <div className="mt-4 flex gap-4 rounded-lg border-l-4 border-l-brand-gold bg-brand-gold/10 p-4 dark:bg-brand-gold/5">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-brand-gold" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-normal text-sm">現在の条件とシナリオが同一です</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    条件を変更するか、別パターンのシナリオを追加すると差分が表示されます
                  </p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 font-normal text-foreground">①</span>
                    <div>
                      <span className="font-normal text-foreground">条件を変更する</span>
                      <p className="mt-0.5">収入・支出・イベントを変えると差分が表示されます</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 font-normal text-foreground">②</span>
                    <div>
                      <span className="font-normal text-foreground">別パターンを追加する</span>
                      <p className="mt-0.5">異なる条件のシナリオを保存して並べて比較</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href="/app">
                    <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                      シミュレーションへ
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/app/branch">
                    <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                      分岐ビルダーへ
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* アクション行 */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedComparisonIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearComparisonIds}
                className="bg-transparent"
              >
                選択解除
              </Button>
            )}
            {scenarios.slice(0, 3).map((scenario) => (
              <Button
                key={scenario.id}
                variant="ghost"
                size="sm"
                onClick={() => loadScenario(scenario.id)}
              >
                「{scenario.name}」を読み込む
              </Button>
            ))}
          </div>
          <Link
            href="/app/branch"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>新しいシナリオを作成</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Step 2: 比較後 → 余白を確認 */}
        <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">ステップ2</Badge>
                <h4 className="font-normal text-sm">余白を確認する</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                差分を確認したら、余白を比較
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('margins')}
              size="sm"
            >
              余白へ
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 世界線追加プレースホルダー（1-2本のとき表示） */}
    {scenarios.length >= 1 && scenarios.length < 3 && (
      <div className="rounded-lg border-2 border-dashed border-brand-gold/40 hover:border-brand-gold p-6 transition-colors">
        <div className="flex flex-col items-center text-center gap-4">
          <Plus className="h-6 w-6 text-brand-bronze" />
          <p className="text-sm font-normal text-brand-bronze">世界線を追加</p>
          {unusedTemplates.length > 0 && onApplyTemplate && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {unusedTemplates.slice(0, 3).map((t) => {
                const isApplying = applyingTemplate === t.id;
                const isDisabled = applyingTemplate !== null;
                return (
                  <button
                    key={t.id}
                    onClick={() => onApplyTemplate(t.id)}
                    disabled={isDisabled}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors',
                      'border-brand-gold/30 text-brand-bronze dark:border-brand-gold/20',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-brand-gold/10 hover:border-brand-gold/50',
                    )}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {isApplying && <Loader2 className="h-3 w-3 animate-spin" />}
                  </button>
                );
              })}
            </div>
          )}
          <Link href="/app">
            <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
              ダッシュボードで条件を変えて保存
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    )}
    </>
  );
}
