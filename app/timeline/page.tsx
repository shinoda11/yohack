'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/layout/sidebar';
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
  Car,
  Sparkles,
  Heart,
  Info,
  RefreshCw,
  Check,
  Save,
  AlertCircle,
  ArrowRight,
  GitBranch,
  Globe,
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
import { useState } from 'react';
import type { LifeEvent, LifeEventType } from '@/lib/types';
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
};

// プリセットイベント（ダッシュボードと同じ）
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
  category: 'family' | 'career' | 'lifestyle';
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
  { id: 'partial_retire', label: '部分リタイア', description: '労働時間を半分に', icon: <Plane className="h-4 w-4" />, type: 'retirement_partial', ageOffset: 15, amount: 0, duration: 1, isRecurring: false, category: 'career' },
  // Lifestyle
  { id: 'world_trip', label: '世界一周', description: '長期旅行 200万円', icon: <Globe className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 5, amount: 200, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'overseas_relocation', label: '海外移住', description: '移住費用+生活費増 年100万円 x 5年', icon: <Globe className="h-4 w-4" />, type: 'expense_increase', ageOffset: 10, amount: 100, duration: 5, isRecurring: true, category: 'lifestyle' },
  { id: 'car_purchase', label: '車購入', description: '一括購入 300万円', icon: <Car className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 3, amount: 300, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'renovation', label: 'リフォーム', description: '住宅リフォーム 500万円', icon: <Home className="h-4 w-4" />, type: 'asset_purchase', ageOffset: 20, amount: 500, duration: 1, isRecurring: false, category: 'lifestyle' },
  { id: 'travel', label: '海外旅行（年1回）', description: '年間50万円 x 10年', icon: <Plane className="h-4 w-4" />, type: 'expense_increase', ageOffset: 5, amount: 50, duration: 10, isRecurring: true, category: 'lifestyle' },
  { id: 'expense_cut', label: '支出見直し', description: '節約で年間-60万円', icon: <Heart className="h-4 w-4" />, type: 'expense_decrease', ageOffset: 1, amount: 60, duration: 20, isRecurring: true, category: 'lifestyle' },
];

// 未対応イベント（v0.1では計算に反映されないが追加は可能）
const unsupportedEventTypes: LifeEventType[] = ['retirement_partial'];

export default function TimelinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, updateProfile, runSimulationAsync, isLoading, saveScenario, scenarios, deleteScenario, loadScenario } = useProfileStore();
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetEvent | null>(null);
  // 入力中の一時的な文字列状態を保持（数値変換はonBlur時に行う）
  const [customAgeInput, setCustomAgeInput] = useState<string>(String(profile.currentAge + 5));
  const [customAmountInput, setCustomAmountInput] = useState<string>('100');
  const [customDurationInput, setCustomDurationInput] = useState<string>('1');
  
  // 実際に使用する数値
  const customAge = Number.parseInt(customAgeInput, 10) || profile.currentAge;
  const customAmount = Number.parseInt(customAmountInput, 10) || 0;
  const customDuration = Number.parseInt(customDurationInput, 10) || 1;
  
  // dirty state: イベントが変更されたがまだシミュレーションに反映されていない
  const [isSynced, setIsSynced] = useState(true);
  const [lastSyncedEventIds, setLastSyncedEventIds] = useState<string>('');
  
  // シナリオ保存ダイアログ
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  
  // 保存完了後のCTA表示
  const [justSavedScenarioId, setJustSavedScenarioId] = useState<string | null>(null);

  const lifeEvents = profile.lifeEvents || [];
  const sortedEvents = [...lifeEvents].sort((a, b) => a.age - b.age);
  
  // 現在のイベントIDと最後に同期したIDを比較してdirty状態を判定
  const currentEventIds = JSON.stringify(lifeEvents.map(e => e.id).sort());
  const isDirty = currentEventIds !== lastSyncedEventIds && lastSyncedEventIds !== '';
  
  // 初期化時に同期済みとしてマーク
  React.useEffect(() => {
    if (lastSyncedEventIds === '' && lifeEvents.length >= 0) {
      setLastSyncedEventIds(currentEventIds);
    }
  }, [currentEventIds, lastSyncedEventIds, lifeEvents.length]);
  
  // 「反映する」ボタンの処理
  const handleSync = async () => {
    await runSimulationAsync();
    setLastSyncedEventIds(currentEventIds);
    setIsSynced(true);
  };
  
  // 「シナリオとして保存」の処理
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
      
      // 成功: トースト通知
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
    
    // 反映されていない場合は先に反映
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
  
  // 世界線比較ページへ遷移
  const handleGoToComparison = () => {
    router.push('/v2');
  };
  
  // イベントタイプが未対応かチェック
  const isUnsupportedEvent = (type: LifeEventType) => unsupportedEventTypes.includes(type);

  // カテゴリ別にプリセットをグループ化
  const familyPresets = presetEvents.filter((p) => p.category === 'family');
  const careerPresets = presetEvents.filter((p) => p.category === 'career');
  const lifestylePresets = presetEvents.filter((p) => p.category === 'lifestyle');

  // プリセットからイベントを追加
  const addPresetEvent = (preset: PresetEvent) => {
    setSelectedPreset(preset);
    setCustomAgeInput(String(profile.currentAge + preset.ageOffset));
    setCustomAmountInput(String(preset.amount));
    setCustomDurationInput(String(preset.duration));
    setIsPresetDialogOpen(true);
  };

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
  };

    updateProfile({
      lifeEvents: [...lifeEvents, event],
    });
    
    // dirty状態をマーク（反映が必要）
    setIsSynced(false);

    setIsPresetDialogOpen(false);
    setSelectedPreset(null);
  };

  const handleRemoveEvent = (id: string) => {
    updateProfile({
      lifeEvents: lifeEvents.filter((e) => e.id !== id),
    });
    // dirty状態をマーク（反映が必要）
    setIsSynced(false);
  };

  // 年間影響額の合計を計算
  const totalAnnualImpact = sortedEvents.reduce((sum, event) => {
    const isExpense =
      event.type.includes('expense_increase') ||
      event.type === 'child_birth' ||
      event.type === 'education' ||
      event.type === 'asset_purchase';
    return sum + (isExpense ? -event.amount : event.amount);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content - responsive margin for sidebar */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">ライフイベント</h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  将来予定しているイベントを追加して、シミュレーションに反映させましょう
                </p>
              </div>
              {/* 反映ボタンとステータス */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Dirty状態の表示 */}
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
                
                {/* ダッシュボードに反映ボタン */}
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
                
                {/* シナリオとして保存ボタン */}
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
              {/* Family events */}
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

              {/* Career events */}
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

              {/* Lifestyle events */}
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
                {/* Summary */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <p className="text-sm text-muted-foreground">
                    {sortedEvents.length}件のイベント
                  </p>
                  <Badge variant="secondary">
                    年間影響: {totalAnnualImpact >= 0 ? '+' : ''}{totalAnnualImpact.toLocaleString()}万円
                  </Badge>
                </div>

                {/* Timeline view */}
                <div className="relative pl-4 border-l-2 border-border space-y-4">
                  {sortedEvents.map((event) => {
                    const isExpense =
                      event.type.includes('expense_increase') ||
                      event.type === 'child_birth' ||
                      event.type === 'education' ||
                      event.type === 'asset_purchase';

                    return (
                      <div
                        key={event.id}
                        className="relative flex items-start gap-3 group"
                      >
                        {/* Timeline dot */}
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
                                  <span className="text-sm font-medium">{event.name}</span>
                                </div>
                                {event.amount > 0 && (
                                  <p className={cn(
                                    'mt-1 text-sm font-medium',
                                    isExpense ? 'text-muted-foreground' : 'text-foreground'
                                  )}>
                                    {isExpense ? '-' : '+'}{event.amount.toLocaleString()}万円/年
                                    {event.duration && event.duration > 1 && (
                                      <span className="text-muted-foreground font-normal ml-1">
                                        (総額 {(event.amount * event.duration).toLocaleString()}万円)
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                
                {/* 世界線比較への誘導 */}
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
        </div>
      </main>

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
              {/* Age adjustment */}
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
                      // 数字のみ許可、空文字もOK（入力中の状態を保持）
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setCustomAgeInput(val);
                      }
                    }}
                    onBlur={() => {
                      // フォーカスが外れたときに範囲内に収める
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

              {/* Amount adjustment */}
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
              
              {/* Duration adjustment - 継続イベントのみ表示 */}
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

              {/* Summary */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="font-medium">{customAge}歳</span>
                  {selectedPreset.isRecurring && customDuration > 1 && (
                    <span> 〜 {customAge + customDuration - 1}歳</span>
                  )}
                  {selectedPreset.isRecurring ? 'の間、' : 'に、'}
                  <span className={cn(
                    'font-medium',
                    selectedPreset.type === 'income_increase' || selectedPreset.type === 'expense_decrease'
                      ? 'text-[#8A7A62] dark:text-[#C8B89A]'
                      : 'text-muted-foreground'
                  )}>
                    {selectedPreset.type === 'income_increase' || selectedPreset.type === 'expense_decrease'
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
            
            {/* 現在のイベント一覧 */}
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
            
            {/* 未反映の警告 */}
            {!isSynced && (
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  未反映のイベントがあります。保存時に自動的にダッシュボードに反映されます。
                </p>
              </div>
            )}
            
            {/* 保存済みシナリオ数 */}
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
    </div>
  );
}
