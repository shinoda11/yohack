'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import type { Profile } from '@/lib/types';
import type { Branch, BranchCertainty } from '@/lib/branch';
import { presetToBranch } from '@/lib/branch';
import type { PresetEvent } from '@/lib/event-catalog';
import { getDefaultAmount } from '@/lib/event-catalog';
import { cn } from '@/lib/utils';

interface EventCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: PresetEvent | null;
  existingBranch: Branch | null;
  profile: Profile;
  onSave: (branch: Branch) => void;
  onDelete?: () => void;
  onHide?: () => void;
}

export function EventCustomizeDialog({
  open,
  onOpenChange,
  preset,
  existingBranch,
  profile,
  onSave,
  onDelete,
  onHide,
}: EventCustomizeDialogProps) {
  const isEditing = !!existingBranch;

  // Form state
  const [age, setAge] = useState(profile.currentAge);
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(1);
  const [certainty, setCertainty] = useState<BranchCertainty>('uncertain');

  // Initialize form values when dialog opens
  useEffect(() => {
    if (!open) return;

    if (existingBranch) {
      // Editing existing branch
      setAge(existingBranch.age ?? profile.currentAge);
      setCertainty(existingBranch.certainty);
      // Extract amount/duration from directEvents if available
      const ev = existingBranch.directEvents?.[0];
      if (ev) {
        setAmount(ev.type === 'housing_purchase' ? (ev.purchaseDetails?.propertyPrice ?? 8000) : ev.amount);
        setDuration(ev.duration ?? 1);
      } else if (preset) {
        // Default branch without directEvents — use virtual preset defaults
        setAmount(getDefaultAmount(preset, profile));
        setDuration(preset.defaultDuration || 1);
      }
    } else if (preset) {
      // New preset
      setAge(profile.currentAge + preset.ageOffset);
      setAmount(getDefaultAmount(preset, profile));
      setDuration(preset.defaultDuration || 1);
      setCertainty('uncertain');
    }
  }, [open, preset, existingBranch, profile]);

  const activePreset = preset;
  if (!activePreset) return null;

  const handleSave = () => {
    const branch = presetToBranch(activePreset, profile, {
      age,
      amount,
      duration,
      certainty,
    });

    if (isEditing) {
      // Preserve the original id when editing
      branch.id = existingBranch.id;
    }

    onSave(branch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="mr-2">{activePreset.icon}</span>
            {activePreset.name}
          </DialogTitle>
          <DialogDescription>{activePreset.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Age */}
          {activePreset.customizable.age && (
            <div className="space-y-1.5">
              <Label htmlFor="event-age" className="text-sm">
                開始年齢
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="event-age"
                  type="number"
                  min={profile.currentAge}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">歳</span>
              </div>
            </div>
          )}

          {/* Amount */}
          {activePreset.customizable.amount && (
            <div className="space-y-1.5">
              <Label htmlFor="event-amount" className="text-sm">
                {activePreset.amountLabel ?? '金額'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="event-amount"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">万円</span>
              </div>
            </div>
          )}

          {/* Duration (recurring only) */}
          {activePreset.customizable.duration && activePreset.isRecurring && (
            <div className="space-y-1.5">
              <Label htmlFor="event-duration" className="text-sm">
                期間
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="event-duration"
                  type="number"
                  min={1}
                  max={60}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">年</span>
              </div>
            </div>
          )}

          {/* Certainty */}
          <div className="space-y-1.5">
            <Label className="text-sm">確度</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCertainty('planned')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px]',
                  certainty === 'planned'
                    ? 'bg-[#4A7C59] text-white'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                )}
              >
                計画
              </button>
              <button
                type="button"
                onClick={() => setCertainty('uncertain')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px]',
                  certainty === 'uncertain'
                    ? 'bg-[#8A7A62] text-white'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                )}
              >
                不確定
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="text-red-700 hover:text-red-700 hover:bg-red-50 mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              削除
            </Button>
          )}
          {isEditing && onHide && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onHide();
                onOpenChange(false);
              }}
              className="text-muted-foreground hover:text-foreground mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              非表示にする
            </Button>
          )}
          <Button
            onClick={handleSave}
            className="bg-[#1A1916] text-[#F0ECE4] hover:bg-[#1A1916]/90"
          >
            {isEditing ? '保存' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
