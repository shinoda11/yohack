'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface InlineVariableProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  /** 表示のフォーマッター。指定しなければデフォルトの万円/億円表示 */
  format?: (value: number) => string;
}

export function InlineVariable({
  label,
  value,
  onChange,
  unit = '万円',
  step = 50,
  min = 0,
  max = 99999,
  format,
}: InlineVariableProps) {
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const dragStartX = useRef(0);
  const dragStartVal = useRef(0);
  const hasMoved = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = format
    ? format(value)
    : value >= 10000
      ? `${(value / 10000).toFixed(1)}億`
      : value.toLocaleString();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (editing) return;
      dragStartX.current = e.clientX;
      dragStartVal.current = value;
      hasMoved.current = false;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value, editing]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 3) hasMoved.current = true;
      const delta = Math.round(dx / 4) * step;
      const next = Math.max(min, Math.min(max, dragStartVal.current + delta));
      onChange(next);
    },
    [dragging, step, min, max, onChange]
  );

  const handlePointerUp = useCallback(() => {
    if (dragging && !hasMoved.current) {
      // Click (not drag) → enter edit mode
      setEditing(true);
      setEditValue(String(value));
    }
    setDragging(false);
  }, [dragging, value]);

  const commitEdit = useCallback(() => {
    const n = parseInt(editValue, 10);
    if (!isNaN(n)) {
      onChange(Math.max(min, Math.min(max, n)));
    }
    setEditing(false);
  }, [editValue, min, max, onChange]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <span className="text-[11px] text-muted-foreground tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
            className="bg-transparent border-0 border-b border-brand-gold outline-none text-center font-bold text-foreground font-[family-name:var(--font-dm-sans)] tabular-nums"
            style={{
              width: Math.max(60, editValue.length * 14 + 20),
              fontSize: 20,
            }}
          />
        ) : (
          <span
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={cn(
              'text-xl font-bold text-foreground font-[family-name:var(--font-dm-sans)] tabular-nums touch-none',
              dragging ? 'cursor-ew-resize' : 'cursor-col-resize',
              'border-b border-transparent hover:border-brand-gold/40 transition-colors',
            )}
          >
            {displayValue}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
