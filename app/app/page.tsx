'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/lib/store';
import { useMainSimulation } from '@/hooks/useSimulation';
import { createDefaultBranches, type WorldlineCandidate } from '@/lib/branch';
import { BranchTreeViz } from '@/components/branch/branch-tree-viz';
import { Button } from '@/components/ui/button';
import { ArrowRight, GitBranch, Scale } from 'lucide-react';
import { ExitReadinessCard } from '@/components/dashboard/exit-readiness-card';
import { KeyMetricsCard } from '@/components/dashboard/key-metrics-card';
import { AssetProjectionChart } from '@/components/dashboard/asset-projection-chart';
import { ConclusionSummaryCard } from '@/components/dashboard/conclusion-summary-card';

// Y-branch symbol (large, for intro screen)
function YBranchSymbol() {
  return (
    <svg
      width={120}
      height={120}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mx-auto"
    >
      <line x1="90" y1="94" x2="42" y2="34" stroke="#D4CFC7" strokeWidth="5" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="#D4CFC7" strokeWidth="5" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="#D4CFC7" strokeWidth="5" strokeLinecap="round" />
      <circle cx="90" cy="94" r="10" fill="#C8B89A">
        <animate attributeName="r" values="10;12;10" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="42" cy="34" r="5" fill="#B5AFA6" />
      <circle cx="138" cy="34" r="5" fill="#B5AFA6" />
    </svg>
  );
}

// Score bar component
function ScoreBar({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// State 1: Intro (first visit)
function IntroState() {
  const router = useRouter();
  const { setHasOnboarded } = useProfileStore();

  const handleStart = () => {
    setHasOnboarded();
    router.push('/app/profile');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <YBranchSymbol />

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
        人生の分岐を、描いてみる。
      </h1>

      <div className="mt-6 max-w-sm space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>確定している未来と、不確定な未来。</p>
        <p>その組み合わせが「世界線」になります。</p>
        <p>
          1,000回のモンテカルロシミュレーションで、
          <br />
          それぞれの世界線のスコアを算出します。
        </p>
      </div>

      <Button
        onClick={handleStart}
        size="lg"
        className="mt-10 gap-2 bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90 px-8"
      >
        はじめる
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="mt-12 text-xs text-muted-foreground">
        本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

// State 2: Profile set, no worldlines yet
function NoBranchState() {
  const { profile, simResult, isLoading } = useProfileStore();
  useMainSimulation();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">あなたの世界線</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          分岐を描いて、未来を比較しましょう
        </p>
      </div>

      {/* Dashboard summary */}
      <ExitReadinessCard score={simResult?.score ?? null} isLoading={isLoading} />
      <KeyMetricsCard
        metrics={simResult?.metrics ?? null}
        currentAge={profile.currentAge}
        targetRetireAge={profile.targetRetireAge}
        isLoading={isLoading}
      />

      <BranchTreeViz currentAge={profile.currentAge} selectedBranches={[]} />

      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          まだ分岐がありません。
          <br />
          最初の分岐を描いてみましょう。
        </p>
        <Button asChild className="gap-2 bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90">
          <Link href="/app/branch">
            <GitBranch className="h-4 w-4" />
            分岐を描きはじめる
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

// State 3: Has worldlines
function WorldlineState() {
  const { profile, simResult, isLoading, scenarios, selectedBranchIds } = useProfileStore();
  useMainSimulation();

  // Reconstruct branches from stored selectedBranchIds
  const defaultBranches = useMemo(() => createDefaultBranches(profile), [profile]);
  const autoIds = useMemo(() => defaultBranches.filter((b) => b.auto).map((b) => b.id), [defaultBranches]);
  const allSelectedIds = useMemo(
    () => new Set([...autoIds, ...selectedBranchIds]),
    [autoIds, selectedBranchIds]
  );
  const selectedBranches = useMemo(
    () => defaultBranches.filter((b) => allSelectedIds.has(b.id)),
    [defaultBranches, allSelectedIds]
  );

  // Build candidates from scenarios for display
  const branchScenarios = useMemo(
    () => scenarios.filter((s) => s.id.startsWith('branch-')),
    [scenarios]
  );

  const candidates: WorldlineCandidate[] = useMemo(
    () =>
      branchScenarios.map((s, i) => ({
        id: s.id,
        label: s.name,
        desc: '',
        branches: [],
        color: i === 0 ? '#4A7C59' : i === branchScenarios.length - 1 ? '#8A7A62' : '#4A6FA5',
        score: s.result?.score.overall,
        result: s.result ?? undefined,
      })),
    [branchScenarios]
  );

  const impact = useMemo(() => {
    if (candidates.length < 2) return null;
    // Approximate: treat first as baseline for impact
    const baseline = candidates[0];
    if (!baseline?.score) return null;
    let maxDiff = 0;
    let impactCandidate: (typeof candidates)[0] | null = null;
    for (const c of candidates.slice(1)) {
      if (!c.score) continue;
      const diff = Math.abs(baseline.score - c.score);
      if (diff > maxDiff) {
        maxDiff = diff;
        impactCandidate = c;
      }
    }
    return impactCandidate ? { label: impactCandidate.label, scoreDiff: maxDiff } : null;
  }, [candidates]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">あなたの世界線</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {branchScenarios.length}本の世界線を比較中
        </p>
      </div>

      {/* Dashboard summary */}
      <ExitReadinessCard score={simResult?.score ?? null} isLoading={isLoading} />
      <KeyMetricsCard
        metrics={simResult?.metrics ?? null}
        currentAge={profile.currentAge}
        targetRetireAge={profile.targetRetireAge}
        isLoading={isLoading}
      />
      <AssetProjectionChart
        data={simResult?.paths ?? null}
        targetRetireAge={profile.targetRetireAge}
        lifeEvents={profile.lifeEvents}
        isLoading={isLoading}
      />

      {/* Tree visualization */}
      <BranchTreeViz
        currentAge={profile.currentAge}
        selectedBranches={selectedBranches}
        candidates={candidates}
        showScores
      />

      {/* Worldline score summary */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">世界線スコア</h2>
        {candidates.map((c) => (
          <ScoreBar
            key={c.id}
            label={c.label}
            score={c.score ?? 0}
            color={c.color}
          />
        ))}
      </div>

      {/* Discovery card */}
      {impact && impact.scoreDiff > 0 && (
        <div className="flex items-start gap-3 rounded-lg border p-4" style={{ borderColor: '#C8B89A30', backgroundColor: '#C8B89A10' }}>
          <YBranchIcon />
          <div>
            <p className="text-sm font-medium text-foreground">発見</p>
            <p className="text-xs text-muted-foreground">
              「{impact.label}」がスコアに最も影響します（{impact.scoreDiff}点差）。
              世界線比較で詳細を確認しましょう。
            </p>
          </div>
        </div>
      )}

      {/* Conclusion */}
      <ConclusionSummaryCard
        score={simResult?.score ?? null}
        metrics={simResult?.metrics ?? null}
        isLoading={isLoading}
        targetRetireAge={profile.targetRetireAge}
        profile={profile}
        hasScenarios={branchScenarios.length > 0}
      />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" asChild className="flex-1 gap-2 bg-transparent">
          <Link href="/app/branch">
            <GitBranch className="h-4 w-4" />
            分岐を追加・変更
          </Link>
        </Button>
        <Button asChild className="flex-1 gap-2 bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90">
          <Link href="/app/worldline">
            <Scale className="h-4 w-4" />
            詳細を比較
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        本サービスは金融アドバイスではありません。投資判断はご自身の責任で行ってください。
      </p>
    </div>
  );
}

// Small Y-branch icon for discovery card
function YBranchIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 mt-0.5"
    >
      <line x1="90" y1="94" x2="42" y2="34" stroke="#C8B89A" strokeWidth="10" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="#C8B89A" strokeWidth="10" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="#C8B89A" strokeWidth="10" strokeLinecap="round" />
      <circle cx="90" cy="94" r="12" fill="#C8B89A" />
    </svg>
  );
}

export default function HomePage() {
  const { hasOnboarded, profile, scenarios } = useProfileStore();

  const hasBranchScenarios = scenarios.some((s) => s.id.startsWith('branch-'));

  if (!hasOnboarded) {
    return <IntroState />;
  }

  if (!hasBranchScenarios) {
    return <NoBranchState />;
  }

  return <WorldlineState />;
}
