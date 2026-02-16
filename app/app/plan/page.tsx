import { TimelineContent } from '@/components/plan/timeline-content';

export default function PlanPage() {
  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">ライフプラン</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            人生の計画を立て、シミュレーションに反映させましょう
          </p>
        </div>

        <TimelineContent />
      </div>
    </div>
  );
}
