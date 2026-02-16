'use client';

import Link from 'next/link';
import { Check, Shield } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const PASS_FEATURES = [
  'モンテカルロシミュレーション（1,000回）',
  '世界線比較（無制限）',
  'ライフイベント設定',
  '全プロファイル設定',
];

const FAQ_ITEMS = [
  {
    q: '90日が過ぎたらどうなりますか？',
    a: '期間終了後はシミュレーション結果の閲覧のみ可能です。再度 Pass を購入すると、すべての機能をご利用いただけます。',
  },
  {
    q: '途中でキャンセルできますか？',
    a: '買い切り型のため、途中キャンセルや返金には対応しておりません。',
  },
  {
    q: '支払い方法は？',
    a: 'クレジットカード（Visa, Mastercard, JCB, AMEX）に対応予定です。',
  },
  {
    q: '適合チェックとは何ですか？',
    a: '12問の簡単な質問で、YOHACK があなたの状況に合うかを確認します。条件に合う方にのみ Pass をご案内しています。',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
          {/* ヘッダー */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">料金</h1>
            <p className="text-[#5A5550]">
              人生の大きな決断を、データで支える
            </p>
            <p className="text-sm text-[#8A7A62]">
              YOHACK は、どの世界線を選んでも利益が変わりません。
            </p>
          </div>

          {/* メインカード */}
          <div className="grid gap-6 md:grid-cols-5">
            {/* FP 比較カード */}
            <Card className="md:col-span-2 border-border">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#C8B89A]" />
                  <h2 className="text-sm font-semibold text-[#5A5550]">利益相反ゼロ</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">FP有料相談</p>
                    <p className="text-lg font-bold text-[#5A5550]">¥30,000〜100,000</p>
                    <p className="text-xs text-muted-foreground">/ 回</p>
                  </div>

                  <div className="rounded-lg border-2 border-[#C8B89A]/30 bg-[#C8B89A]/5 p-4 space-y-1">
                    <p className="text-xs text-[#8A7A62]">YOHACK</p>
                    <p className="text-lg font-bold text-[#8A7A62]">¥29,800</p>
                    <p className="text-xs text-[#8A7A62]">/ 90日間</p>
                  </div>
                </div>

                <p className="text-xs text-[#5A5550] leading-relaxed">
                  物件も保険も投資商品も売りません。<br />
                  紹介料もアフィリエイトもゼロ。<br />
                  あなたの意思決定だけに集中できる設計です。
                </p>
              </CardContent>
            </Card>

            {/* Pass カード */}
            <Card className="md:col-span-3 border-[#C8B89A] shadow-lg relative">
              <CardHeader className="pb-2 pt-6">
                <h2 className="text-xl font-bold">90日 Pass</h2>
                <p className="text-xs text-muted-foreground">
                  すべての機能を90日間ご利用いただけます
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">¥29,800</span>
                  <span className="text-sm text-muted-foreground ml-2">/ 90日</span>
                </div>

                <div className="space-y-2.5">
                  {PASS_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-[#C8B89A] flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <a href="#">
                    <Button className="w-full bg-[#C8B89A] text-[#1A1916] hover:bg-[#8A7A62] hover:text-white">
                      適合チェックに進む
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    12問のチェック後、条件に合う方にご案内します
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

          {/* Disclaimer */}
          <footer className="border-t pt-6 pb-4 space-y-1 text-center">
            <p className="text-xs text-muted-foreground">
              本サービスはファイナンシャルアドバイスを提供するものではありません。
            </p>
            <p className="text-xs text-muted-foreground">
              シミュレーション結果は前提条件に基づく参考値であり、将来の成果を保証するものではありません。
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
