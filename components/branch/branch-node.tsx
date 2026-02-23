'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, X, Trash2 } from 'lucide-react';
import type { Branch } from '@/lib/branch';
import { cn } from '@/lib/utils';

const CERTAINTY_BORDER: Record<string, string> = {
  confirmed: 'border-l-brand-night',
  planned: 'border-l-safe',
  uncertain: 'border-l-brand-bronze',
};

interface BranchNodeProps {
  branch: Branch;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onToggleCertainty?: () => void;
}

export function BranchNode({ branch, selected, onToggle, disabled, onEdit, onDelete, onHide, onToggleCertainty }: BranchNodeProps) {
  const borderColor = CERTAINTY_BORDER[branch.certainty] ?? 'border-l-border';

  return (
    <label
      className={cn(
        'flex items-center gap-4 min-h-[44px] px-3 py-2 rounded-lg border-l-4 cursor-pointer transition-colors',
        borderColor,
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50',
        selected && !disabled && 'bg-accent/30'
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-normal text-foreground">{branch.label}</span>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-colors -my-2"
              aria-label="編集"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">{branch.detail}</p>
          {onToggleCertainty && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCertainty();
              }}
              className={cn(
                'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors',
                branch.certainty === 'planned'
                  ? 'text-brand-gold hover:bg-brand-gold/10'
                  : 'text-brand-stone hover:bg-brand-stone/10'
              )}
            >
              {branch.certainty === 'planned' ? '計画' : '不確定'}
            </button>
          )}
        </div>
        {branch.eventType === 'child' && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">教育費自動加算: 保育50万→学費100万→大学200万/年</p>
        )}
      </div>
      {onHide && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHide();
          }}
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label="非表示"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-brand-bronze/10 transition-colors"
          aria-label="削除"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-brand-stone" />
        </button>
      )}
    </label>
  );
}
