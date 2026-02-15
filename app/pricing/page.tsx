'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// --- 料金定数（将来変更しやすいよう一箇所にまとめる） ---
const MONTHLY_PRICE = 2980;
const ANNUAL_PRICE = 29800;
const ANNUAL_MONTHLY = Math.round(ANNUAL_PRICE / 12);

const FREE_FEATURES = [
  '基本シミュレーション',
  '資産推移グラフ',
  'おすすめアクション',
  '住宅プラン比較（1プラン）',
  'ライフイベント管理',
];

const FREE_EXCLUDED = [
  '世界線比較',
  '住宅プラン複数比較',
  '効果シミュレーション',
  'データエクスポート',
];

const PRO_FEATURES = [
  'Free の全機能',
  '世界線比較（無制限）',
  '住宅プラン複数比較（最大3プラン）',
  'おすすめアクションの効果計算',
  'データエクスポート',
  '優先サポート',
];

const FAQ_ITEMS = [
  {
    q: '無料プランでもシミュレーションは正確ですか？',
    a: 'はい。Free と Pro でシミュレーションの精度に差はありません。Pro では比較・分析機能が追加されます。',
  },
  {
    q: '途中でプラン変更できますか？',
    a: 'はい。いつでも Pro にアップグレード、またはダウングレードできます。',
  },
  {
    q: '支払い方法は？',
    a: 'クレジットカード（Visa, Mastercard, JCB, AMEX）に対応予定です。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい。解約後も期間終了まで Pro 機能をご利用いただけます。',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const displayPrice = isAnnual ? ANNUAL_MONTHLY : MONTHLY_PRICE;
  const displayPriceFormatted = `¥${displayPrice.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
          {/* ヘッダー */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">料金プラン</h1>
            <p className="text-muted-foreground">
              人生の大きな決断を、データで支える
            </p>
          </div>

          {/* 年額/月額切り替え */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                'text-sm font-medium',
                !isAnnual ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              月額
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                isAnnual ? 'bg-[#C8B89A]' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isAnnual ? 'translate-x-6' : 'translate-x-0.5'
                )}
              />
            </button>
            <span
              className={cn(
                'text-sm font-medium',
                isAnnual ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              年額（2ヶ月分お得）
            </span>
          </div>

          {/* プランカード */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free プラン */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold">Free</h2>
                <p className="text-xs text-muted-foreground">ずっと無料</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">¥0</span>
                </div>

                <div className="space-y-2">
                  {FREE_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {FREE_EXCLUDED.map(f => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted-foreground opacity-40"
                    >
                      <X className="h-4 w-4 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/">
                  <Button variant="outline" className="w-full">
                    今すぐ始める
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro プラン */}
            <Card className="border-[#C8B89A] shadow-lg relative">
              <div className="absolute -top-3 left-4">
                <span className="rounded-full bg-[#C8B89A] px-3 py-1 text-xs font-medium text-[#1A1916]">
                  おすすめ
                </span>
              </div>
              <CardHeader className="pb-2 pt-6">
                <h2 className="text-lg font-semibold">Pro</h2>
                {isAnnual ? (
                  <p className="text-xs text-muted-foreground">
                    年 ¥{ANNUAL_PRICE.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">月額プラン</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">
                    {displayPriceFormatted}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    / 月
                  </span>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      年額 ¥{ANNUAL_PRICE.toLocaleString()}（2ヶ月分お得）
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {PRO_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#C8B89A] flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <Button className="w-full bg-[#C8B89A] text-[#1A1916] hover:bg-[#C8B89A]/90">
                    Pro を始める
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    ※ 現在準備中です
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              よくある質問
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
