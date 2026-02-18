'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, X } from 'lucide-react';
import type { Branch } from '@/lib/branch';
import { cn } from '@/lib/utils';

const CERTAINTY_BORDER: Record<string, string> = {
  confirmed: 'border-l-[#1A1916]',
  planned: 'border-l-[#4A7C59]',
  uncertain: 'border-l-[#8A7A62]',
};

interface BranchNodeProps {
  branch: Branch;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BranchNode({ branch, selected, onToggle, disabled, onEdit, onDelete }: BranchNodeProps) {
  const borderColor = CERTAINTY_BORDER[branch.certainty] ?? 'border-l-border';

  return (
    <label
      className={cn(
        'flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-md border-l-4 cursor-pointer transition-colors',
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
          <span className="text-sm font-medium text-foreground">{branch.label}</span>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
              aria-label="編集"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{branch.detail}</p>
        {branch.eventType === 'child' && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">教育費自動加算: 保育50万→学費100万→大学200万/年</p>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
          aria-label="削除"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </label>
  );
}
