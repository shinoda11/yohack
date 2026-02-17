'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { SectionCard } from '@/components/section-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Plane,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Car,
  Sparkles,
  Heart,
  Info,
  RefreshCw,
  Check,
  Save,
  AlertCircle,
  ArrowRight,
  Gift,
  GitBranch,
  Globe,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LifeEvent, LifeEventType, Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

// 落ち着いた配色のアイコン設定
const eventTypeIcons: Record<string, React.ReactNode> = {
  income_increase: <TrendingUp className="h-4 w-4" />,
  income_decrease: <TrendingDown className="h-4 w-4" />,
  expense_increase: <TrendingUp className="h-4 w-4" />,
  expense_decrease: <TrendingDown className="h-4 w-4" />,
  asset_purchase: <Home className="h-4 w-4" />,
  child_birth: <Baby className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  retirement_partial: <Briefcase className="h-4 w-4" />,
  rental_income: <Home className="h-4 w-4" />,
};

const eventTypeLabels: Record<string, string> = {
  income_increase: '収入増加',
  income_decrease: '収入減少',
  expense_increase: '支出増加',
  expense_decrease: '支出削減',
  asset_purchase: '資産購入',
  child_birth: '出産',
  education: '教育費',
  retirement_partial: '部分退職',
  rental_income: '賃貸収入',
};

// プリセットイベント
interface PresetEvent {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: LifeEventType;
  ageOffset: number;
  amount: number;
  duration: number;
  isRecurring: boolean;
  category: 'family' | 'career' | 'lifestyle' | 'asset';
  defaultTarget?: 'self' | 'partner';
}

const presetEvents: PresetEvent[] = [
  // Family
  { id: 'wedding', label: '結婚式', description: '挙式・披露宴 350万円', icon: <Heart className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 2, amount: 350, duration: 1, isRecurring: false, category: 'family' },
  { id: 'child1', label: '第一子誕生', description: '出産・乳幼児期の費用', icon: <Baby className="h-4 w-4" />, type: 'child_birth', ageOffset: 3, amount: 100, duration: 6, isRecurring: true, category: 'family' },
  { id: 'child2', label: '第二子誕生', description: '出産・乳幼児期の費用', icon: <Baby className="h-4 w-4" />, type: 'child_birth', ageOffset: 6, amount: 100, duration: 6, isRecurring: true, category: 'family' },
  { id: 'edu_private_elem', label: '私立小学校', description: '年間約150万円 x 6年', icon: <GraduationCap className="h-4 w-4" />, type: 'education', ageOffset: 8, amount: 150, duration: 6, isRecurring: true, category: 'family' },
  { id: 'edu_private_middle', label: '私立中学校', description: '年間約130万円 x 3年', icon: <GraduationCap className="h-4 w-4" />, type: 'education', ageOffset: 14, amount: 130, duration: 3, isRecurring: true, category: 'family' },
  { id: 'edu_university', label: '大学進学', description: '私立理系で年間約180万円 x 4年', icon: <GraduationCap className="h-4 w-4" />, type: 'education', ageOffset: 20, amount: 180, duration: 4, isRecurring: true, category: 'family' },
  // Career
  { id: 'promotion', label: '昇進・昇給', description: '年収+100万円を想定', icon: <Briefcase className="h-4 w-4" />, type: 'income_increase', ageOffset: 3, amount: 100, duration: 1, isRecurring: false, category: 'career' },
  { id: 'job_change', label: '転職', description: '年収+150万円を想定', icon: <Briefcase className="h-4 w-4" />, type: 'income_increase', ageOffset: 2, amount: 150, duration: 1, isRecurring: false, category: 'career' },
  { id: 'overseas_assignment', label: '海外駐在', description: '年収+200万円（手当込み）x 3年', icon: <Globe className="h-4 w-4" />, type: 'income_increase', ageOffset: 3, amount: 200, duration: 3, isRecurring: true, category: 'career' },
  { id: 'side_business', label: '副業開始', description: '年間+50万円を想定', icon: <Sparkles className="h-4 w-4" />, type: 'income_increase', ageOffset: 1, amount: 50, duration: 10, isRecurring: true, category: 'career' },
  // { id: 'partial_retire', label: '部分リタイア', description: '労働時間を半分に', icon: <Plane className="h-4 w-4" />, type: 'retirement_partial', ageOffset: 15, amount: 0, duration: 1, isRecurring: false, category: 'career' },
  { id: 'partner_childcare_leave', label: 'パートナー育休', description: '育休取得による収入減（1年間）', icon: <Baby className="h-4 w-4" />, type: 'income_decrease', ageOffset: 3, amount: 0, duration: 1, isRecurring: true, category: 'career', defaultTarget: 'partner' },
  { id: 'partner_part_time', label: 'パートナー時短勤務', description: '時短勤務による収入減（3年間）', icon: <Briefcase className="h-4 w-4" />, type: 'income_decrease', ageOffset: 3, amount: 0, duration: 3, isRecurring: true, category: 'career', defaultTarget: 'partner' },
  { id: 'partner_career_change', label: 'パートナー転職', description: 'パートナーの転職による収入増', icon: <Briefcase className="h-4 w-4" />, type: 'income_increase', ageOffset: 2, amount: 100, duration: 1, isRecurring: false, category: 'career', defaultTarget: 'partner' },
  // Lifestyle
  { id: 'world_trip', label: '世界一周', description: '長期旅行 200万円', icon: <Globe className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 5, amount: 200, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'overseas_relocation', label: '海外移住', description: '移住費用+生活費増 年100万円 x 5年', icon: <Globe className="h-4 w-4" />, type: 'expense_increase', ageOffset: 10, amount: 100, duration: 5, isRecurring: true, category: 'lifestyle' },
  { id: 'car_purchase', label: '車購入', description: '一括購入 300万円', icon: <Car className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 3, amount: 300, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'renovation', label: 'リフォーム', description: '住宅リフォーム 500万円', icon: <Home className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 20, amount: 500, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'travel', label: '海外旅行（年1回）', description: '年間50万円 x 10年', icon: <Plane className="h-4 w-4" />, type: 'expense_increase', ageOffset: 5, amount: 50, duration: 10, isRecurring: true, category: 'lifestyle' },
  { id: 'expense_cut', label: '支出見直し', description: '節約で年間-60万円', icon: <Heart className="h-4 w-4" />, type: 'expense_decrease', ageOffset: 1, amount: 60, duration: 20, isRecurring: true, category: 'lifestyle' },
  // Asset (相続・贈与・退職金)
  { id: 'inheritance', label: '相続', description: '親からの相続（税引後）', icon: <Gift className="h-4 w-4" />, type: 'asset_gain', ageOffset: 30, amount: 2000, duration: 1, isRecurring: false, category: 'asset' },
  { id: 'housing_gift', label: '住宅資金贈与', description: '親からの住宅購入援助', icon: <Home className="h-4 w-4" />, type: 'asset_gain', ageOffset: 0, amount: 1000, duration: 1, isRecurring: false, category: 'asset' },
  { id: 'severance', label: '退職金', description: '退職時の一時金', icon: <Briefcase className="h-4 w-4" />, type: 'asset_gain', ageOffset: 15, amount: 3000, duration: 1, isRecurring: false, category: 'asset' },
  // Family (介護)
  { id: 'nursing_care_parent', label: '親の介護費用', description: '月10万×10年', icon: <Heart className="h-4 w-4" />, type: 'expense_increase', ageOffset: 25, amount: 120, duration: 10, isRecurring: true, category: 'family' },
  { id: 'nursing_care_self', label: '自身の介護費用', description: '月15万×5年（80歳〜）', icon: <Heart className="h-4 w-4" />, type: 'expense_increase', ageOffset: 45, amount: 180, duration: 5, isRecurring: true, category: 'family' },
];

// 未対応イベント
// const unsupportedEventTypes: LifeEventType[] = ['retirement_partial'];

// バンドルプリセット（複合イベントテンプレート）
interface BundlePresetEvent {
  name: string;
  type: LifeEventType;
  target?: 'self' | 'partner';
  amountFn: (profile: Profile) => number;
  duration: number;
  isRecurring: boolean;
  ageOffsetFromBundle: number;
}

interface BundlePreset {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'family' | 'career' | 'lifestyle' | 'asset';
  defaultAgeOffset: number;
  events: BundlePresetEvent[];
  coupleOnly?: boolean;
}

const bundlePresets: BundlePreset[] = [
  {
    id: 'overseas_with_home',
    label: '海外駐在（持ち家あり）',
    description: '駐在手当 + 住居費補助 + 自宅賃貸収入',
    icon: <Globe className="h-4 w-4" />,
    category: 'career',
    defaultAgeOffset: 3,
    events: [
      { name: '駐在手当', type: 'income_increase', amountFn: () => 200, duration: 3, isRecurring: true, ageOffsetFromBundle: 0 },
      { name: '住居費補助', type: 'expense_decrease', amountFn: (p) => p.housingCostAnnual, duration: 3, isRecurring: true, ageOffsetFromBundle: 0 },
      { name: '自宅賃貸収入', type: 'rental_income', amountFn: (p) => Math.round(p.housingCostAnnual * 0.8), duration: 3, isRecurring: true, ageOffsetFromBundle: 0 },
    ],
  },
  {
    id: 'overseas_renter',
    label: '海外駐在（賃貸）',
    description: '駐在手当 + 住居費補助（現家賃解約）',
    icon: <Globe className="h-4 w-4" />,
    category: 'career',
    defaultAgeOffset: 3,
    events: [
      { name: '駐在手当', type: 'income_increase', amountFn: () => 200, duration: 3, isRecurring: true, ageOffsetFromBundle: 0 },
      { name: '住居費補助（現家賃解約）', type: 'expense_decrease', amountFn: (p) => p.housingCostAnnual, duration: 3, isRecurring: true, ageOffsetFromBundle: 0 },
    ],
  },
  {
    id: 'partner_childcare_package',
    label: '育休→時短→フル復帰',
    description: 'パートナー育休1年 + 時短2年 + 出産費用',
    icon: <Baby className="h-4 w-4" />,
    category: 'family',
    defaultAgeOffset: 3,
    coupleOnly: true,
    events: [
      { name: '育休', type: 'income_decrease', target: 'partner', amountFn: (p) => Math.round(p.partnerGrossIncome * 0.3), duration: 1, isRecurring: true, ageOffsetFromBundle: 0 },
      { name: '時短勤務', type: 'income_decrease', target: 'partner', amountFn: (p) => Math.round(p.partnerGrossIncome * 0.25), duration: 2, isRecurring: true, ageOffsetFromBundle: 1 },
      { name: '出産費用', type: 'expense_increase', amountFn: () => 100, duration: 1, isRecurring: true, ageOffsetFromBundle: 0 },
    ],
  },
];

export function TimelineContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, updateProfile, runSimulationAsync, isLoading, saveScenario, scenarios, deleteScenario, loadScenario } = useProfileStore();
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetEvent | null>(null);
  const [customAgeInput, setCustomAgeInput] = useState<string>(String(profile.currentAge + 5));
  const [customAmountInput, setCustomAmountInput] = useState<string>('100');
  const [customDurationInput, setCustomDurationInput] = useState<string>('1');

  const customAge = Number.parseInt(customAgeInput, 10) || profile.currentAge;
  const customAmount = Number.parseInt(customAmountInput, 10) || 0;
  const customDuration = Number.parseInt(customDurationInput, 10) || 1;

  const [isSynced, setIsSynced] = useState(true);
  const [lastSyncedEventIds, setLastSyncedEventIds] = useState<string>('');

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const [justSavedScenarioId, setJustSavedScenarioId] = useState<string | null>(null);

  // Target selector state (self/partner)
  const [customTargetInput, setCustomTargetInput] = useState<'self' | 'partner'>('self');

  // Edit dialog state
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [editAgeInput, setEditAgeInput] = useState('');
  const [editAmountInput, setEditAmountInput] = useState('');
  const [editDurationInput, setEditDurationInput] = useState('');
  const [editTargetInput, setEditTargetInput] = useState<'self' | 'partner'>('self');

  // Bundle dialog state
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundlePreset | null>(null);
  const [bundleAgeInput, setBundleAgeInput] = useState<string>(String(profile.currentAge + 3));
  const bundleAge = Number.parseInt(bundleAgeInput, 10) || profile.currentAge;

  const editAge = Number.parseInt(editAgeInput, 10) || profile.currentAge;
  const editAmount = Number.parseInt(editAmountInput, 10) || 0;
  const editDuration = Number.parseInt(editDurationInput, 10) || 1;

  const openEditDialog = (event: LifeEvent) => {
    setEditingEvent(event);
    setEditAgeInput(String(event.age));
    setEditAmountInput(String(event.amount));
    setEditDurationInput(String(event.duration || 1));
    setEditTargetInput(event.target || 'self');
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    const updated: LifeEvent = {
      ...editingEvent,
      age: editAge,
      amount: editAmount,
      duration: editingEvent.isRecurring ? editDuration : 1,
      target: editTargetInput !== 'self' ? editTargetInput : undefined,
    };
    updateProfile({
      lifeEvents: lifeEvents.map((e) => (e.id === updated.id ? updated : e)),
    });
    setIsSynced(false);
    setEditingEvent(null);
  };

  const handleDeleteFromEdit = () => {
    if (!editingEvent) return;
    handleRemoveEvent(editingEvent.id);
    setEditingEvent(null);
  };

  const lifeEvents = profile.lifeEvents || [];
  const sortedEvents = [...lifeEvents].sort((a, b) => a.age - b.age);

  const currentEventIds = JSON.stringify(lifeEvents.map(e => e.id).sort());
  const isDirty = currentEventIds !== lastSyncedEventIds && lastSyncedEventIds !== '';

  React.useEffect(() => {
    if (lastSyncedEventIds === '' && lifeEvents.length >= 0) {
      setLastSyncedEventIds(currentEventIds);
    }
  }, [currentEventIds, lastSyncedEventIds, lifeEvents.length]);

  const handleSync = async () => {
    await runSimulationAsync();
    setLastSyncedEventIds(currentEventIds);
    setIsSynced(true);
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast({
        title: '保存エラー',
        description: 'シナリオ名を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    const doSave = () => {
      const result = saveScenario(scenarioName.trim());

      if (!result.success) {
        toast({
          title: '保存に失敗しました',
          description: result.error || '不明なエラーが発生しました。',
          variant: 'destructive',
        });
        return;
      }

      const savedScenario = result.scenario;
      const savedTime = savedScenario
        ? new Date(savedScenario.createdAt).toLocaleString('ja-JP', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : '';

      toast({
        title: 'シナリオを保存しました',
        description: `「${savedScenario?.name}」${savedTime ? ` (${savedTime})` : ''}`,
      });

      if (savedScenario) {
        setJustSavedScenarioId(savedScenario.id);
      }

      setIsSaveDialogOpen(false);
      setScenarioName('');
    };

    if (!isSynced) {
      runSimulationAsync().then(() => {
        setLastSyncedEventIds(currentEventIds);
        setIsSynced(true);
        doSave();
      });
    } else {
      doSave();
    }
  };

  const handleGoToComparison = () => {
    router.push('/app/v2');
  };

  const isUnsupportedEvent = (_type: LifeEventType) => false;

  const familyPresets = presetEvents.filter((p) => p.category === 'family');
  const careerPresets = presetEvents.filter((p) => p.category === 'career' && (!p.defaultTarget || p.defaultTarget === 'self' || profile.mode === 'couple'));
  const lifestylePresets = presetEvents.filter((p) => p.category === 'lifestyle');
  const assetPresets = presetEvents.filter((p) => p.category === 'asset');

  const addPresetEvent = (preset: PresetEvent) => {
    setSelectedPreset(preset);
    setCustomAgeInput(String(profile.currentAge + preset.ageOffset));
    setCustomDurationInput(String(preset.duration));

    // Set target
    const target = preset.defaultTarget || 'self';
    setCustomTargetInput(target);

    // Compute amount for partner presets
    let amount = preset.amount;
    if (preset.id === 'partner_childcare_leave') {
      amount = Math.round(profile.partnerGrossIncome * 0.3);
    } else if (preset.id === 'partner_part_time') {
      amount = Math.round(profile.partnerGrossIncome * 0.5);
    }
    setCustomAmountInput(String(amount));

    setIsPresetDialogOpen(true);
  };

  const addBundlePreset = (bundle: BundlePreset) => {
    setSelectedBundle(bundle);
    setBundleAgeInput(String(profile.currentAge + bundle.defaultAgeOffset));
    setIsBundleDialogOpen(true);
  };

  const confirmBundlePreset = () => {
    if (!selectedBundle) return;
    const bId = `bundle-${Date.now()}`;
    const newEvents: LifeEvent[] = selectedBundle.events.map((evt, i) => ({
      id: `${bId}-${i}`,
      type: evt.type,
      name: evt.name,
      age: bundleAge + evt.ageOffsetFromBundle,
      amount: evt.amountFn(profile),
      duration: evt.duration,
      isRecurring: evt.isRecurring,
      target: evt.target !== 'self' ? evt.target : undefined,
      bundleId: bId,
    }));
    updateProfile({ lifeEvents: [...lifeEvents, ...newEvents] });
    setIsSynced(false);
    setIsBundleDialogOpen(false);
    setSelectedBundle(null);
  };

  const filteredBundlePresets = bundlePresets.filter(
    (b) => !b.coupleOnly || profile.mode === 'couple'
  );

  const confirmPresetEvent = () => {
    if (!selectedPreset) return;

    const event: LifeEvent = {
      id: `event-${Date.now()}`,
      type: selectedPreset.type,
      name: selectedPreset.label,
      age: customAge,
      amount: customAmount,
      duration: selectedPreset.isRecurring ? customDuration : 1,
      isRecurring: selectedPreset.isRecurring,
      target: customTargetInput !== 'self' ? customTargetInput : undefined,
    };

    updateProfile({
      lifeEvents: [...lifeEvents, event],
    });

    setIsSynced(false);

    setIsPresetDialogOpen(false);
    setSelectedPreset(null);
  };

  const handleRemoveEvent = (id: string) => {
    updateProfile({
      lifeEvents: lifeEvents.filter((e) => e.id !== id),
    });
    setIsSynced(false);
  };

  const totalAnnualImpact = sortedEvents.reduce((sum, event) => {
    const isExpense =
      event.type.includes('expense_increase') ||
      event.type === 'child_birth' ||
      event.type === 'education' ||
      event.type === 'asset_purchase';
    return sum + (isExpense ? -event.amount : event.amount);
  }, 0);

  return (
    <>
      {/* Header actions */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">ライフイベント</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              将来予定しているイベントを追加して、シミュレーションに反映させましょう
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isSynced && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                未反映
              </Badge>
            )}
            {isSynced && lifeEvents.length > 0 && (
              <Badge variant="outline" className="text-[#8A7A62] border-[#C8B89A]/40 bg-[#C8B89A]/10 dark:text-[#C8B89A] dark:border-[#C8B89A]/30 dark:bg-[#C8B89A]/5">
                <Check className="h-3 w-3 mr-1" />
                反映済み
              </Badge>
            )}

            <Button
              onClick={handleSync}
              disabled={isSynced || isLoading}
              variant="outline"
              size="sm"
              className={cn(
                'transition-all bg-transparent',
                !isSynced && 'border-amber-400 hover:bg-amber-50 text-amber-700 dark:border-amber-600 dark:hover:bg-amber-950/30 dark:text-amber-300'
              )}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                  計算中
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  反映
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              disabled={lifeEvents.length === 0}
              size="sm"
              className="bg-[#C8B89A] hover:bg-[#8A7A62] text-white"
            >
              <Save className="mr-1.5 h-4 w-4" />
              シナリオ保存
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Add Section */}
      <SectionCard
        title="イベントを追加"
        icon={<CalendarDays className="h-5 w-5" />}
        description="ボタンをクリックして年齢と金額を調整するだけで追加できます"
      >
        <div className="space-y-5">
          {filteredBundlePresets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                パッケージ
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredBundlePresets.map((bundle) => (
                  <TooltipProvider key={bundle.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 px-3 bg-transparent border-dashed"
                          onClick={() => addBundlePreset(bundle)}
                        >
                          {bundle.icon}
                          <span className="ml-1.5">{bundle.label}</span>
                          <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">
                            {bundle.events.length}件
                          </Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{bundle.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Baby className="h-3 w-3" />
              家族・教育
            </p>
            <div className="flex flex-wrap gap-2">
              {familyPresets.map((preset) => (
                <TooltipProvider key={preset.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 bg-transparent"
                        onClick={() => addPresetEvent(preset)}
                      >
                        {preset.icon}
                        <span className="ml-1.5">{preset.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              キャリア・収入
            </p>
            <div className="flex flex-wrap gap-2">
              {careerPresets.map((preset) => {
                const unsupported = isUnsupportedEvent(preset.type);
                return (
                  <TooltipProvider key={preset.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-auto py-2 px-3 bg-transparent",
                            unsupported && "opacity-60 border-dashed"
                          )}
                          onClick={() => addPresetEvent(preset)}
                        >
                          {preset.icon}
                          <span className="ml-1.5">{preset.label}</span>
                          {unsupported && (
                            <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">
                              準備中
                            </Badge>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{preset.description}</p>
                        {unsupported && (
                          <p className="text-amber-600 text-xs mt-1">
                            このイベントは現在計算に反映されません
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Plane className="h-3 w-3" />
              ライフスタイル
            </p>
            <div className="flex flex-wrap gap-2">
              {lifestylePresets.map((preset) => (
                <TooltipProvider key={preset.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 bg-transparent"
                        onClick={() => addPresetEvent(preset)}
                      >
                        {preset.icon}
                        <span className="ml-1.5">{preset.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Gift className="h-3 w-3" />
              相続・贈与・退職金
            </p>
            <div className="flex flex-wrap gap-2">
              {assetPresets.map((preset) => (
                <TooltipProvider key={preset.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 bg-transparent"
                        onClick={() => addPresetEvent(preset)}
                      >
                        {preset.icon}
                        <span className="ml-1.5">{preset.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Registered Events */}
      <SectionCard
        title="登録済みイベント"
        icon={<CalendarDays className="h-5 w-5" />}
        className="mt-6"
      >
        {sortedEvents.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <p className="text-sm text-muted-foreground">
                {sortedEvents.length}件のイベント
              </p>
              <Badge variant="secondary">
                年間影響: {totalAnnualImpact >= 0 ? '+' : ''}{totalAnnualImpact.toLocaleString()}万円
              </Badge>
            </div>

            <div className="relative pl-4 border-l-2 border-border space-y-4">
              {sortedEvents.map((event) => {
                const isExpense =
                  event.type.includes('expense_increase') ||
                  event.type === 'child_birth' ||
                  event.type === 'education' ||
                  event.type === 'asset_purchase';
                const isIncome = event.type === 'income_increase' || event.type === 'rental_income' || event.type === 'expense_decrease';

                return (
                  <div
                    key={event.id}
                    className="relative flex items-start gap-3 group"
                  >
                    <div className="absolute -left-[21px] top-2 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground" />

                    <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {eventTypeIcons[event.type]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-muted">
                                {event.age}歳
                                {event.duration && event.duration > 1 && ` - ${event.age + event.duration - 1}歳`}
                              </Badge>
                              <span className="text-sm font-medium">
                                {event.name}
                                {event.target === 'partner' && (
                                  <span className="text-xs text-muted-foreground ml-1">(パートナー)</span>
                                )}
                              </span>
                            </div>
                            {event.amount > 0 && (
                              <p className={cn(
                                'mt-1 text-sm font-medium',
                                isExpense ? 'text-muted-foreground' : 'text-foreground'
                              )}>
                                {isExpense ? '-' : isIncome ? '+' : '-'}{event.amount.toLocaleString()}万円/年
                                {event.duration && event.duration > 1 && (
                                  <span className="text-muted-foreground font-normal ml-1">
                                    (総額 {(event.amount * event.duration).toLocaleString()}万円)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(event)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              ライフイベントがまだ登録されていません
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              上のボタンからイベントを追加してください
            </p>
          </div>
        )}
      </SectionCard>

      {/* 保存完了CTA */}
      {justSavedScenarioId && (
        <div className="mt-6 rounded-lg border-2 border-[#C8B89A]/40 bg-[#C8B89A]/10 p-4 dark:border-[#C8B89A]/30 dark:bg-[#C8B89A]/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8B89A]/20 dark:bg-[#C8B89A]/10">
                <Check className="h-5 w-5 text-[#C8B89A]" />
              </div>
              <div>
                <p className="font-medium text-[#8A7A62] dark:text-[#C8B89A]">シナリオを保存しました</p>
                <p className="text-sm text-[#8A7A62]/80 dark:text-[#C8B89A]/80">世界線比較で現状と比較できます</p>
              </div>
            </div>
            <Button
              onClick={handleGoToComparison}
              className="bg-[#C8B89A] hover:bg-[#8A7A62] text-white"
            >
              世界線比較へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 保存済みシナリオ一覧 */}
      {scenarios.length > 0 && (
        <SectionCard
          title="保存済みシナリオ"
          icon={<GitBranch className="h-5 w-5" />}
          description="保存したシナリオは世界線比較で使用できます"
          className="mt-6"
        >
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-colors",
                  justSavedScenarioId === scenario.id
                    ? "border-[#C8B89A]/40 bg-[#C8B89A]/5 dark:border-[#C8B89A]/30 dark:bg-[#C8B89A]/5"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scenario.createdAt).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {scenario.profile.lifeEvents && ` - ${scenario.profile.lifeEvents.length}件のイベント`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadScenario(scenario.id)}
                    className="bg-transparent"
                  >
                    読み込む
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      deleteScenario(scenario.id);
                      if (justSavedScenarioId === scenario.id) {
                        setJustSavedScenarioId(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleGoToComparison}
                className="bg-transparent"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                世界線比較で詳しく比較する
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Guide */}
      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">ライフイベントの使い方</p>
            <ul className="space-y-1 text-xs">
              <li>1. イベントを追加・削除したら「反映」ボタンを押してダッシュボードに反映</li>
              <li>2. 「シナリオ保存」で現在の設定を保存（世界線比較タブで使用可能）</li>
              <li>3. 世界線比較タブで保存したシナリオと現状を比較できます</li>
              <li>- 収入増加イベントは資産形成にプラス、支出増加イベントはマイナスとして計算されます</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preset confirmation dialog */}
      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        {selectedPreset && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPreset.icon}
                {selectedPreset.label}
              </DialogTitle>
              <DialogDescription>
                {selectedPreset.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-age">発生年齢</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="preset-age"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customAgeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setCustomAgeInput(val);
                      }
                    }}
                    onBlur={() => {
                      const num = Number.parseInt(customAgeInput, 10);
                      if (Number.isNaN(num) || num < profile.currentAge) {
                        setCustomAgeInput(String(profile.currentAge));
                      } else if (num > 100) {
                        setCustomAgeInput('100');
                      } else {
                        setCustomAgeInput(String(num));
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">歳</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    (あと{Math.max(0, customAge - profile.currentAge)}年後)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-amount">
                  {selectedPreset.isRecurring ? '年間金額' : '金額（一括）'}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="preset-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customAmountInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setCustomAmountInput(val);
                      }
                    }}
                    onBlur={() => {
                      const num = Number.parseInt(customAmountInput, 10);
                      if (Number.isNaN(num) || num < 0) {
                        setCustomAmountInput('0');
                      } else if (num > 10000) {
                        setCustomAmountInput('10000');
                      } else {
                        setCustomAmountInput(String(num));
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedPreset.isRecurring ? '万円/年' : '万円'}
                  </span>
                </div>
              </div>

              {selectedPreset.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="preset-duration">期間</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="preset-duration"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customDurationInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) {
                          setCustomDurationInput(val);
                        }
                      }}
                      onBlur={() => {
                        const num = Number.parseInt(customDurationInput, 10);
                        if (Number.isNaN(num) || num < 1) {
                          setCustomDurationInput('1');
                        } else if (num > 50) {
                          setCustomDurationInput('50');
                        } else {
                          setCustomDurationInput(String(num));
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">年間</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    総額: {(customAmount * customDuration).toLocaleString()}万円
                  </p>
                </div>
              )}

              {profile.mode === 'couple' && (selectedPreset.type === 'income_increase' || selectedPreset.type === 'income_decrease') && (
                <div className="space-y-2">
                  <Label>対象者</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="preset-target"
                        checked={customTargetInput === 'self'}
                        onChange={() => setCustomTargetInput('self')}
                        className="accent-[#8A7A62]"
                      />
                      <span className="text-sm">自分</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="preset-target"
                        checked={customTargetInput === 'partner'}
                        onChange={() => setCustomTargetInput('partner')}
                        className="accent-[#8A7A62]"
                      />
                      <span className="text-sm">パートナー</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="font-medium">{customAge}歳</span>
                  {selectedPreset.isRecurring && customDuration > 1 && (
                    <span> 〜 {customAge + customDuration - 1}歳</span>
                  )}
                  {selectedPreset.isRecurring ? 'の間、' : 'に、'}
                  <span className={cn(
                    'font-medium',
                    selectedPreset.type === 'income_increase' || selectedPreset.type === 'expense_decrease' || selectedPreset.type === 'rental_income'
                      ? 'text-[#8A7A62] dark:text-[#C8B89A]'
                      : 'text-muted-foreground'
                  )}>
                    {selectedPreset.type === 'income_increase' || selectedPreset.type === 'expense_decrease' || selectedPreset.type === 'rental_income'
                      ? `+${customAmount.toLocaleString()}万円`
                      : `-${customAmount.toLocaleString()}万円`}
                    {selectedPreset.isRecurring ? '/年' : '（一括）'}
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={confirmPresetEvent}>
                追加する
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
        {editingEvent && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {eventTypeIcons[editingEvent.type]}
                {editingEvent.name}
              </DialogTitle>
              <DialogDescription>
                {eventTypeLabels[editingEvent.type] || editingEvent.type}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">開始年齢</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-age"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editAgeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) setEditAgeInput(val);
                    }}
                    onBlur={() => {
                      const num = Number.parseInt(editAgeInput, 10);
                      if (Number.isNaN(num) || num < profile.currentAge) setEditAgeInput(String(profile.currentAge));
                      else if (num > 100) setEditAgeInput('100');
                      else setEditAgeInput(String(num));
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">歳</span>
                </div>
              </div>

              {editingEvent.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">期間</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-duration"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editDurationInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) setEditDurationInput(val);
                      }}
                      onBlur={() => {
                        const num = Number.parseInt(editDurationInput, 10);
                        if (Number.isNaN(num) || num < 1) setEditDurationInput('1');
                        else if (num > 50) setEditDurationInput('50');
                        else setEditDurationInput(String(num));
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">年間</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      （{editAge}歳 〜 {editAge + editDuration - 1}歳）
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-amount">
                  {editingEvent.isRecurring ? '年間金額' : '金額（一括）'}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editAmountInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) setEditAmountInput(val);
                    }}
                    onBlur={() => {
                      const num = Number.parseInt(editAmountInput, 10);
                      if (Number.isNaN(num) || num < 0) setEditAmountInput('0');
                      else if (num > 10000) setEditAmountInput('10000');
                      else setEditAmountInput(String(num));
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {editingEvent.isRecurring ? '万円/年' : '万円'}
                  </span>
                </div>
                {editingEvent.isRecurring && editDuration > 1 && (
                  <p className="text-xs text-muted-foreground">
                    総額: {(editAmount * editDuration).toLocaleString()}万円
                  </p>
                )}
              </div>

              {profile.mode === 'couple' && (editingEvent.type === 'income_increase' || editingEvent.type === 'income_decrease') && (
                <div className="space-y-2">
                  <Label>対象者</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-target"
                        checked={editTargetInput === 'self'}
                        onChange={() => setEditTargetInput('self')}
                        className="accent-[#8A7A62]"
                      />
                      <span className="text-sm">自分</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-target"
                        checked={editTargetInput === 'partner'}
                        onChange={() => setEditTargetInput('partner')}
                        className="accent-[#8A7A62]"
                      />
                      <span className="text-sm">パートナー</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteFromEdit}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                削除
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingEvent(null)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Bundle Preset Dialog */}
      <Dialog open={isBundleDialogOpen} onOpenChange={setIsBundleDialogOpen}>
        {selectedBundle && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedBundle.icon}
                {selectedBundle.label}
              </DialogTitle>
              <DialogDescription>
                {selectedBundle.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bundle-age">開始年齢</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bundle-age"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bundleAgeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setBundleAgeInput(val);
                      }
                    }}
                    onBlur={() => {
                      const num = Number.parseInt(bundleAgeInput, 10);
                      if (Number.isNaN(num) || num < profile.currentAge) {
                        setBundleAgeInput(String(profile.currentAge));
                      } else if (num > 100) {
                        setBundleAgeInput('100');
                      } else {
                        setBundleAgeInput(String(num));
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">歳</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    (あと{Math.max(0, bundleAge - profile.currentAge)}年後)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>登録されるイベント ({selectedBundle.events.length}件)</Label>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  {selectedBundle.events.map((evt, i) => {
                    const amount = evt.amountFn(profile);
                    const startAge = bundleAge + evt.ageOffsetFromBundle;
                    const isExpenseType = evt.type === 'expense_increase' || evt.type === 'expense_decrease';
                    const isIncomeType = evt.type === 'income_increase' || evt.type === 'rental_income';
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-background text-muted-foreground">
                          {eventTypeIcons[evt.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{evt.name}</span>
                          {evt.target === 'partner' && (
                            <span className="text-xs text-muted-foreground ml-1">(パートナー)</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                          {startAge}歳{evt.duration > 1 && `〜${startAge + evt.duration - 1}歳`}
                        </span>
                        <span className={cn(
                          'text-xs font-medium tabular-nums flex-shrink-0',
                          (isIncomeType || evt.type === 'expense_decrease') ? 'text-[#8A7A62] dark:text-[#C8B89A]' : 'text-muted-foreground'
                        )}>
                          {(isIncomeType || evt.type === 'expense_decrease') ? '+' : '-'}{amount.toLocaleString()}万円/年
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBundleDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={confirmBundlePreset}>
                一括追加する
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Save Scenario Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              シナリオとして保存
            </DialogTitle>
            <DialogDescription>
              現在のライフイベント設定をシナリオとして保存します。
              保存したシナリオは「世界線比較」タブで比較できます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">シナリオ名</Label>
              <Input
                id="scenario-name"
                placeholder="例: 子供2人＋転職プラン"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                保存されるイベント ({lifeEvents.length}件)
              </p>
              {lifeEvents.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {sortedEvents.slice(0, 5).map(event => (
                    <li key={event.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{event.age}歳:</span>
                      <span>{event.name}</span>
                    </li>
                  ))}
                  {lifeEvents.length > 5 && (
                    <li className="text-muted-foreground">
                      ...他 {lifeEvents.length - 5} 件
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">イベントがありません</p>
              )}
            </div>

            {!isSynced && (
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  未反映のイベントがあります。保存時に自動的にダッシュボードに反映されます。
                </p>
              </div>
            )}

            {scenarios.length > 0 && (
              <p className="text-xs text-muted-foreground">
                現在 {scenarios.length} 件のシナリオが保存されています
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveScenario}
              disabled={!scenarioName.trim() || isLoading}
            >
              {isLoading ? '保存中...' : '保存する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
