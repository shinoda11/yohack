'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
}

export function ProGate({ feature, children }: ProGateProps) {
  return (
    <div className="relative">
      {/* ぼかした背景コンテンツ */}
      <div className="blur-sm opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* オーバーレイカード */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-8 shadow-lg max-w-sm text-center space-y-4">
          <Sparkles className="h-10 w-10 text-[#C8B89A] mx-auto" />
          <h3 className="text-lg font-bold">
            {feature} は Pro 機能です
          </h3>
          <p className="text-sm text-muted-foreground">
            異なる人生の選択肢を比較して、最適な道を見つけましょう。
          </p>
          <Link href="/pricing">
            <Button className="w-full bg-[#C8B89A] text-[#1A1916] hover:bg-[#C8B89A]/90">
              Pro を始める
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            月額 ¥2,980 から
          </p>
        </div>
      </div>
    </div>
  );
}
