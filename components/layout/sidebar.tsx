'use client';

import React, { useState, useEffect } from "react"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  User,
  Sparkles,
  CreditCard,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrandStoryDialog } from '@/components/layout/brand-story-dialog';

/** Y-branch symbol SVG — shared between mobile header and desktop sidebar */
function YohackSymbol({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 3 branch lines */}
      <line x1="90" y1="94" x2="42" y2="34" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="138" y2="34" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <line x1="90" y1="94" x2="90" y2="156" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      {/* Decision node — Gold */}
      <circle cx="90" cy="94" r="9" fill="#C8B89A" />
      {/* Endpoint dots */}
      <circle cx="42" cy="34" r="6" fill="currentColor" />
      <circle cx="138" cy="34" r="6" fill="currentColor" />
    </svg>
  );
}

/** Styled wordmark: YO (foreground) + HACK (Gold) */
function YohackWordmark() {
  return (
    <span className="text-base font-bold tracking-tight">
      <span className="text-sidebar-foreground">YO</span>
      <span style={{ color: '#C8B89A' }}>HACK</span>
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
    href: '/plan',
    label: 'ライフプラン',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    href: '/',
    label: 'シミュレーション',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: '/v2',
    label: '世界線比較',
    icon: <Sparkles className="h-5 w-5" />,
    badge: 'Pro',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsBrandDialogOpen(true)}
          aria-label="ブランドストーリーを表示"
        >
          <YohackSymbol size={20} />
          <YohackWordmark />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
        // Mobile: slide in/out
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible
        "lg:translate-x-0"
      )}>
      {/* Logo */}
      <button
        className="flex h-16 w-full items-center gap-3 border-b border-sidebar-border px-6 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C8B89A]/20 text-[#C8B89A] font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pricing & Settings */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        <Link
          href="/pricing"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/pricing'
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}
        >
          <CreditCard className="h-5 w-5" />
          料金プラン
        </Link>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          設定
        </Link>
      </div>

        {/* User profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">ゲストユーザー</p>
              <p className="text-xs text-muted-foreground">無料プラン</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Brand Story Modal */}
      <BrandStoryDialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen} />
    </>
  );
}
