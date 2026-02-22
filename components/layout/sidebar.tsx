'use client';

import React, { useState, useEffect } from "react"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  Scale,
  UserPen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandStoryDialog } from '@/components/layout/brand-story-dialog';
import { YohackSymbol } from '@/components/layout/yohack-symbol';

/** Styled wordmark: YO (foreground) + HACK (Gold) */
function YohackWordmark() {
  return (
    <span className="text-base font-bold tracking-tight">
      <span className="text-sidebar-foreground">YO</span>
      <span className="text-brand-gold">HACK</span>
    </span>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavItemWithBadge extends NavItem {
  badge?: string;
}

const navItems: NavItemWithBadge[] = [
  {
    href: '/app',
    label: 'ダッシュボード',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: '/app/profile',
    label: 'プロファイル',
    icon: <UserPen className="h-5 w-5" />,
  },
  {
    href: '/app/branch',
    label: '分岐ビルダー',
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    href: '/app/worldline',
    label: '世界線比較',
    icon: <Scale className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);

  // Auto-open brand story on first visit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('yohack-brand-story-seen')) {
      setIsBrandDialogOpen(true);
    }
  }, []);

  // Auto-close brand story on page navigation
  useEffect(() => {
    setIsBrandDialogOpen(false);
  }, [pathname]);

  const handleBrandDialogChange = (open: boolean) => {
    setIsBrandDialogOpen(open);
    if (!open && typeof window !== 'undefined') {
      localStorage.setItem('yohack-brand-story-seen', '1');
    }
  };

  return (
    <>
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <button
        className="flex h-16 w-full items-center gap-4 border-b border-sidebar-border px-6 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
        onClick={() => setIsBrandDialogOpen(true)}
        aria-label="ブランドストーリーを表示"
      >
        <YohackSymbol size={24} />
        <div className="text-left">
          <YohackWordmark />
          <p className="text-xs text-muted-foreground">人生に、余白を。</p>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-brand-gold/20 text-brand-gold font-normal">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        <Link
          href="/app/settings"
          className={cn(
            'flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors',
            pathname === '/app/settings'
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          設定
        </Link>
      </div>
      </aside>

      {/* Brand Story Modal */}
      <BrandStoryDialog open={isBrandDialogOpen} onOpenChange={handleBrandDialogChange} />
    </>
  );
}
