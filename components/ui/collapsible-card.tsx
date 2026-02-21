'use client';

import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  icon: ReactNode;
  title: string;
  summary?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  completed?: boolean;
}

export function CollapsibleCard({
  icon,
  title,
  summary,
  open,
  onOpenChange,
  children,
  className,
  completed,
}: CollapsibleCardProps) {
  const isCompact = !open && completed;
  return (
    <Card className={cn(
      'overflow-hidden border-[#F0ECE4] dark:border-[#5A5550]',
      isCompact && 'border-[#F0ECE4]/60 dark:border-[#5A5550]/40',
      className,
    )}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between text-left transition-colors hover:bg-muted/50",
              isCompact ? "px-4 py-2.5" : "px-6 py-4",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={cn(
                "shrink-0 items-center justify-center",
                isCompact
                  ? "flex h-6 w-6 text-[#4A7C59]/60 dark:text-[#6BA368]/60"
                  : "flex h-8 w-8 text-[#8A7A62]/60 dark:text-[#8A7A62]",
              )}>
                {isCompact ? <Check className="h-4 w-4" /> : icon}
              </div>
              <div className="min-w-0">
                <CardTitle className={cn(
                  "font-semibold",
                  isCompact ? "text-sm text-muted-foreground" : "text-base",
                )}>{title}</CardTitle>
                {!open && summary && (
                  <div className={cn(
                    "truncate text-muted-foreground",
                    isCompact ? "text-xs mt-0" : "text-sm mt-0.5",
                  )}>
                    {summary}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'shrink-0 text-muted-foreground transition-transform duration-200',
                isCompact ? 'h-3 w-3' : 'h-4 w-4',
                open && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
