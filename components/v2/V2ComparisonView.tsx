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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface V2ComparisonViewProps {
  simResult: SimulationResult | null;
  profile: Profile;
  scenarios: SavedScenario[];
  selectedComparisonIds: string[];
  toggleComparisonId: (id: string) => void;
  clearComparisonIds: () => void;
  loadScenario: (id: string) => void;
  setActiveTab: (tab: 'margins' | 'allocation' | 'decision' | 'worldlines' | 'strategy') => void;
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
      <line x1="90" y1="94" x2="42" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
      <circle cx="90" cy="94" r="9" fill="#C8B89A" />
      <circle cx="42" cy="34" r="6" fill="#C8B89A" opacity="0.5" />
      <circle cx="138" cy="34" r="6" fill="#C8B89A" opacity="0.5" />
    </svg>
  );
}

const steps = [
  {
    icon: <CalendarDays className="h-5 w-5 text-[#C8B89A]" />,
    title: '条件を変える',
    description: 'ライフプランでイベントを追加。転職・出産・住宅購入など。',
  },
  {
    icon: <Save className="h-5 w-5 text-[#C8B89A]" />,
    title: 'シナリオを保存',
    description: '現在の条件に名前をつけて保存。いつでも戻れる。',
  },
  {
    icon: <Columns className="h-5 w-5 text-[#C8B89A]" />,
    title: '並べて比較',
    description: '最大2つのシナリオを現在の状態と並べて比較。',
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
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8B89A]/10">
                      {step.icon}
                    </div>
                    <span className="text-xs font-medium text-[#C8B89A]">ステップ{i + 1}</span>
                  </div>
                  <h4 className="text-sm font-medium">{step.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/plan" className="mt-8">
              <Button className="bg-[#C8B89A] hover:bg-[#8A7A62] text-white gap-2">
                ライフプランでシナリオを作成する
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Comparison table (1+ scenarios) ---
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          世界線比較
        </CardTitle>
        <CardDescription>
          現在の状態と保存済みシナリオを並列比較します（最大2つまで選択可能）
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 比較表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground w-40">指標</th>
                <th className="text-center py-3 px-2 font-medium min-w-32">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="default" className="bg-primary">現在</Badge>
                    <span className="text-xs text-muted-foreground">ベースライン</span>
                  </div>
                </th>
                {scenarios.slice(0, 2).map((scenario) => (
                  <th key={scenario.id} className="text-center py-3 px-2 font-medium min-w-32">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleComparisonId(scenario.id)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
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
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-2 font-medium">安心ライン到達年齢</td>
                <td className="text-center py-3 px-2 tabular-nums font-semibold">
                  {(() => {
                    if (!simResult) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    const age = simResult.metrics.fireAge;
                    if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                    return `${age}歳`;
                  })()}
                </td>
                {scenarios.slice(0, 2).map((scenario) => (
                  <td key={scenario.id} className={cn(
                    "text-center py-3 px-2 tabular-nums font-semibold",
                    selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                  )}>
                    {(() => {
                      if (!scenario.result) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                      const age = scenario.result.metrics.fireAge;
                      if (age == null || age > 100) return <span className="text-muted-foreground text-xs">未達</span>;
                      return `${age}歳`;
                    })()}
                  </td>
                ))}
              </tr>

              {/* 60歳時点の資産 */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-2 font-medium">60歳時点資産</td>
                <td className="text-center py-3 px-2 tabular-nums font-semibold">
                  {(() => {
                    if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    if (profile.currentAge > 60) return <span className="text-muted-foreground text-xs">なし</span>;
                    const idx = Math.min(60 - profile.currentAge, simResult.paths.yearlyData.length - 1);
                    const assets = simResult.paths.yearlyData[idx]?.assets;
                    if (assets == null || Number.isNaN(assets)) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    return `${(assets / 10000).toFixed(1)}億`;
                  })()}
                </td>
                {scenarios.slice(0, 2).map((scenario) => {
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
                      "text-center py-3 px-2 tabular-nums font-semibold",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {`${(assets / 10000).toFixed(1)}億`}
                    </td>
                  );
                })}
              </tr>

              {/* 40-50代平均月次CFマージン - SoTのcashFlow.netCashFlowを参照 */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-2 font-medium">現在の月次CF</td>
                <td className="text-center py-3 px-2 tabular-nums font-semibold">
                  {(() => {
                    // SoTのcashFlow.netCashFlowを参照（年間値を月次に変換）
                    const netCF = simResult?.cashFlow?.netCashFlow;
                    if (netCF == null || Number.isNaN(netCF)) {
                      return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    }
                    const monthlyCF = netCF / 12;
                    return `${monthlyCF.toFixed(0)}万/月`;
                  })()}
                </td>
                {scenarios.slice(0, 2).map((scenario) => {
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
                      "text-center py-3 px-2 tabular-nums font-semibold",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {`${monthlyCF.toFixed(0)}万/月`}
                    </td>
                  );
                })}
              </tr>

              {/* 取り崩し開始年齢 */}
              <tr className="hover:bg-muted/30">
                <td className="py-3 px-2 font-medium">取り崩し開始</td>
                <td className="text-center py-3 px-2 tabular-nums font-semibold">
                  {(() => {
                    if (!simResult?.paths.yearlyData) return <span className="text-muted-foreground text-xs">—（未計算）</span>;
                    const ddIdx = simResult.paths.yearlyData.findIndex((y, i) =>
                      i > 0 && y.assets < simResult.paths.yearlyData[i - 1].assets
                    );
                    // 取り崩しがない = 資産が常に増加している
                    return ddIdx > 0
                      ? `${profile.currentAge + ddIdx}歳`
                      : <span className="text-muted-foreground text-xs">なし</span>;
                  })()}
                </td>
                {scenarios.slice(0, 2).map((scenario) => {
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
                      ddIdx > 0 ? "tabular-nums font-semibold" : "text-muted-foreground text-xs",
                      selectedComparisonIds.includes(scenario.id) && "bg-accent/10"
                    )}>
                      {ddIdx > 0 ? `${scenario.profile.currentAge + ddIdx}歳` : 'なし'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

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
            {scenarios.slice(0, 2).map((scenario) => (
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
            href="/plan"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>新しいシナリオを作成</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Step 2: 比較後 → 余白の使い道へ */}
        <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">ステップ2</Badge>
                <h4 className="font-medium text-sm">余白の使い道を決める</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                差分を確認したら、その余白をどう使うか配分を検討します
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('allocation')}
              size="sm"
            >
              使い道へ
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
