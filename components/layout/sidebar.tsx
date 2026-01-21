'use client';

import React, { useState, useEffect } from "react"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Settings,
  User,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'ダッシュボード',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: '/v2',
    label: '世界線比較',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    href: '/timeline',
    label: 'タイムライン',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    href: '/rsu',
    label: 'RSU管理',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
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
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-sm">
            E
          </div>
          <span className="font-semibold text-white">Exit Readiness</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-slate-800"
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
        "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out",
        // Mobile: slide in/out
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible
        "lg:translate-x-0"
      )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-lg">
          E
        </div>
        <div>
          <h1 className="font-semibold tracking-tight">Exit Readiness</h1>
          <p className="text-xs text-slate-400">人生の選択を比較するOS</p>
        </div>
      </div>

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
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-slate-700 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Settings className="h-5 w-5" />
          設定
        </Link>
      </div>

        {/* User profile */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium">ゲストユーザー</p>
              <p className="text-xs text-slate-400">無料プラン</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
