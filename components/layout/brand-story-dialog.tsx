'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const APP_VERSION = '0.1.0';

/** Animated Y-branch symbol for the brand story modal */
function AnimatedYSymbol() {
  return (
    <>
      <style>{`
        /* === Draw-in: lines appear as if being drawn === */
        @keyframes draw-in {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        .draw-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw-in 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .d1 { animation-delay: 0.5s; }  /* left branch */
        .d2 { animation-delay: 0.7s; }  /* right branch */
        .d3 { animation-delay: 0.4s; }  /* stem */

        /* === Node pulse: gold node pulsation === */
        @keyframes node-pulse {
          0%, 100% { r: 5; opacity: 1; }
          50%      { r: 7; opacity: 0.4; }
        }
        .node-pulse {
          animation: node-pulse 3s ease-in-out infinite;
        }

        /* === Ghost fade: unchosen path shimmer === */
        @keyframes ghost-fade {
          0%, 100% { opacity: 0.08; }
          50%      { opacity: 0.2; }
        }
        .ghost-path {
          animation: ghost-fade 4s ease-in-out infinite;
        }
        .g2 {
          animation-delay: 1.5s;
        }

        /* === Hero fade-in: whole visual header entrance === */
        @keyframes hero-fade-in {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .hero-enter {
          animation: hero-fade-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .hero-enter-d1 {
          animation: hero-fade-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
          opacity: 0;
        }
        .hero-enter-d2 {
          animation: hero-fade-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
          opacity: 0;
        }
      `}</style>
      <svg
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-20 w-20 sm:h-[120px] sm:w-[120px] text-foreground"
      >
        {/* Ghost lines — unchosen paths */}
        <line x1="90" y1="94" x2="20" y2="160" stroke="currentColor" className="ghost-path" strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="94" x2="160" y2="160" stroke="currentColor" className="ghost-path g2" strokeWidth="3" strokeLinecap="round" />
        {/* Main 3 branch lines — draw-in */}
        <line x1="90" y1="94" x2="42" y2="34" stroke="currentColor" className="draw-path d1" strokeWidth="5" strokeLinecap="round" />
        <line x1="90" y1="94" x2="138" y2="34" stroke="currentColor" className="draw-path d2" strokeWidth="5" strokeLinecap="round" />
        <line x1="90" y1="94" x2="90" y2="156" stroke="currentColor" className="draw-path d3" strokeWidth="5" strokeLinecap="round" />
        {/* Decision node — Gold, solid */}
        <circle cx="90" cy="94" r="6" fill="#C8B89A" />
        {/* Decision node — Gold, pulsing ring */}
        <circle cx="90" cy="94" r="5" fill="none" stroke="#C8B89A" strokeWidth="1.5" className="node-pulse" />
        {/* Endpoint dots */}
        <circle cx="42" cy="34" r="5" fill="currentColor" />
        <circle cx="138" cy="34" r="5" fill="currentColor" />
      </svg>
    </>
  );
}

interface BrandStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandStoryDialog({ open, onOpenChange }: BrandStoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
          {/* Visual header */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="hero-enter">
              <AnimatedYSymbol />
            </div>
            <div className="text-center" style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}>
              <p className="text-xl font-bold tracking-tight hero-enter-d1">
                <span className="text-foreground">YO</span>
                <span style={{ color: '#C8B89A' }}>HACK</span>
              </p>
              <p className="text-sm font-light tracking-[0.25em] text-muted-foreground mt-1 hero-enter-d2">人生に、余白を。</p>
            </div>
          </div>

          {/* Hidden accessible title for screen readers */}
          <DialogTitle className="sr-only">YOHACKブランドストーリー</DialogTitle>
          <DialogDescription className="sr-only">YOHACKの思想とデザインコンセプトについて</DialogDescription>

          {/* Philosophy text */}
          <div className="space-y-5 text-[17px] font-light tracking-wide text-muted-foreground" style={{ fontFamily: 'var(--font-noto-serif-jp), serif', lineHeight: 2 }}>
            <p className="text-xl font-normal mb-6">
              人生は分岐の連続です。
            </p>
            <div className="pl-4 border-l-2 border-[#C8B89A]/30 space-y-0.5 font-normal text-[#C8B89A]">
              <p>転職するか、今の会社に残るか。</p>
              <p>家を買うか、賃貸を続けるか。</p>
              <p>子どもを持つか、持たないか。</p>
            </div>
            <p>
              どの選択が「正解」かは、誰にもわかりません。
            </p>
            <p>
              でも、それぞれの未来に何が待っているかを<br />
              数字で見ることはできます。
            </p>
            <p>
              YOHACKは、あなたの人生の「余白」&mdash;<br />
              お金・時間・体力の3つの資源を可視化し、<br />
              異なる世界線を比較するシミュレーターです。
            </p>
            <p>
              Y字の分岐は、あなたの選択。<br />
              ゴールドのノードは、決断の瞬間。<br />
              薄く伸びるラインは、選ばなかった世界線。<br />
              下に伸びるラインは、あなたをここまで導いた選択の記憶。
            </p>
            <p>
              すべての未来を見渡した上で、<br />
              自分だけの道を選ぶ。
            </p>
            <p className="font-medium text-[#C8B89A]">
              それが、YOHACKの思想です。
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
