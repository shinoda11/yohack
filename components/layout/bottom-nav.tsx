'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GitBranch, Scale, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/app', label: 'ホーム', icon: Home },
  { href: '/app/branch', label: '分岐', icon: GitBranch },
  { href: '/app/worldline', label: '比較', icon: Scale },
  { href: '/app/settings', label: '設定', icon: Settings },
] as const;

// Note: /app/profile is not in the bottom nav; it's accessed from the sidebar on desktop

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-[#F0ECE4]/95 backdrop-blur-sm" style={{ borderColor: '#E8E4DE' }}>
      <div className="flex h-16 items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive
                  ? 'text-[#C8B89A]'
                  : 'text-[#B5AFA6]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
