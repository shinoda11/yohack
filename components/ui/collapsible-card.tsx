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
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  icon: ReactNode;
  title: string;
  summary?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function CollapsibleCard({
  icon,
  title,
  summary,
  open,
  onOpenChange,
  children,
  className,
}: CollapsibleCardProps) {
  return (
    <Card className={cn('overflow-hidden border-gray-200 dark:border-gray-800', className)}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-400 dark:text-gray-500">
                {icon}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {!open && summary && (
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {summary}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180'
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
