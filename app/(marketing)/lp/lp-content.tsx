'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/* ── animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

/* ── FAQ data ── */
const faqs = [
  {
    q: '何をしてくれるサービスですか？',
    a: '人生の選択肢（住宅購入・キャリア変更・家族計画など）をシミュレーションし、「世界線」として並べて比較するツールです。モンテカルロシミュレーションで 100歳までの資産推移を計算します。物件紹介や投資助言は行いません。',
  },
  {
    q: '物件の紹介や投資のアドバイスはありますか？',
    a: 'ありません。YOHACK はどの選択肢を選ぶべきかを提案しません。比較に必要な数字の土台を返すだけです。',
  },
  {
    q: '個人情報はどう扱われますか？',
    a: 'シミュレーションに使用する情報は、セッション内でのみ使用されます。第三者への提供は行いません。',
  },
  {
    q: '適合チェックの後に何が起きますか？',
    a: '12問のチェックに回答いただくと、自動で判定結果が出ます。条件に合う方には、YOHACK へのアクセス方法をご案内します。条件に合わない場合も、その旨をお伝えします。',
  },
]

/* ── Y-branch SVG with Framer Motion ── */
function YBranchHero() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.line
        x1="90" y1="94" x2="90" y2="156"
        stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      />
      <motion.line
        x1="90" y1="94" x2="42" y2="34"
        stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
      />
      <motion.line
        x1="90" y1="94" x2="138" y2="34"
        stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
      />
      <motion.circle
        cx="90" cy="94" r="9" fill="var(--brand-gold)"
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.7 }}
      />
      <motion.circle
        cx="42" cy="34" r="6" fill="var(--brand-gold)"
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.75 }}
      />
      <motion.circle
        cx="138" cy="34" r="6" fill="var(--brand-gold)"
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.8 }}
      />
    </svg>
  )
}

/* ── Section wrapper with scroll-triggered fade ── */
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
    >
      {children}
    </motion.section>
  )
}

/* ── Animated demo preview — income slider → graph change (15s loop) ── */
function DemoPreview() {
  const incomeRef = useRef<HTMLSpanElement>(null)
  const sliderFillRef = useRef<HTMLDivElement>(null)
  const sliderKnobRef = useRef<HTMLDivElement>(null)
  const pathARef = useRef<SVGPathElement>(null)
  const pathBRef = useRef<SVGPathElement>(null)
  const labelBRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const CYCLE = 5000

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Y-coordinates for path control points [M, C1, C2, C3, S, end]
    const aHi = [100, 82, 55, 38, 22, 18]
    const aLo = [100, 96, 92, 90, 96, 102]
    const bHi = [106, 98, 86, 80, 90, 106]
    const bLo = [106, 104, 102, 108, 118, 130]

    const buildPath = (hi: number[], lo: number[], t: number) => {
      const y = hi.map((h, i) => Math.round(lerp(lo[i], h, t) * 10) / 10)
      return `M40,${y[0]} C130,${y[1]} 220,${y[2]} 300,${y[3]} S400,${y[4]} 460,${y[5]}`
    }

    const tick = (ts: number) => {
      if (!start) start = ts
      const p = ((ts - start) % CYCLE) / CYCLE
      const t = (Math.cos(p * Math.PI * 2) + 1) / 2 // smooth 1→0→1

      const income = Math.round(800 + 400 * t)
      if (incomeRef.current) incomeRef.current.textContent = income.toLocaleString()

      const pct = 50 + 25 * t
      if (sliderFillRef.current) sliderFillRef.current.style.width = `${pct}%`
      if (sliderKnobRef.current) sliderKnobRef.current.style.left = `${pct - 2}%`

      if (pathARef.current) pathARef.current.setAttribute('d', buildPath(aHi, aLo, t))
      if (pathBRef.current) pathBRef.current.setAttribute('d', buildPath(bHi, bLo, t))
      if (labelBRef.current) labelBRef.current.setAttribute('y', String(Math.round(lerp(130, 106, t) - 5)))

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="bg-white rounded-xl border border-brand-sand shadow-sm p-4 sm:p-6">
      {/* Mock income slider */}
      <div className="mb-4">
        <p className="text-[10px] sm:text-xs text-brand-bronze mb-1">本人年収</p>
        <div className="flex items-baseline gap-1 mb-2">
          <span
            ref={incomeRef}
            className="text-base sm:text-lg font-bold text-brand-night font-[family-name:var(--font-dm-sans)] tabular-nums"
          >
            1,200
          </span>
          <span className="text-[10px] sm:text-xs text-brand-bronze">万円</span>
        </div>
        <div className="h-1.5 bg-brand-sand/40 rounded-full relative max-w-[180px]">
          <div
            ref={sliderFillRef}
            className="absolute top-0 left-0 h-full bg-brand-gold rounded-full"
            style={{ width: '75%' }}
          />
          <div
            ref={sliderKnobRef}
            className="absolute w-3 h-3 bg-brand-gold rounded-full shadow-sm border-2 border-white"
            style={{ top: '-3px', left: '73%' }}
          />
        </div>
      </div>

      {/* Animated chart */}
      <svg viewBox="0 0 520 165" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        {/* Grid */}
        <line x1="40" y1="10" x2="40" y2="140" stroke="var(--brand-sand)" strokeWidth="1" />
        <line x1="40" y1="140" x2="480" y2="140" stroke="var(--brand-sand)" strokeWidth="1" />
        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--brand-sand)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="40" y1="40" x2="480" y2="40" stroke="var(--brand-sand)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="40" y1="110" x2="480" y2="110" stroke="var(--brand-sand)" strokeWidth="0.5" strokeDasharray="4 4" />

        {/* Safety line */}
        <line x1="40" y1="95" x2="480" y2="95" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
        <text x="482" y="99" fill="var(--danger)" fontSize="8" opacity="0.6">安心ライン</text>

        {/* World line A */}
        <path
          ref={pathARef}
          d="M40,100 C130,82 220,55 300,38 S400,22 460,18"
          stroke="var(--safe)" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />

        {/* World line B */}
        <path
          ref={pathBRef}
          d="M40,106 C130,98 220,86 300,80 S400,90 460,106"
          stroke="var(--brand-gold)" strokeWidth="2" fill="none" strokeDasharray="8 4" strokeLinecap="round"
        />

        {/* Labels */}
        <text x="400" y="13" fill="var(--safe)" fontSize="9" fontWeight="bold">A: 6,000万</text>
        <text ref={labelBRef} x="400" y="101" fill="var(--brand-gold)" fontSize="9" fontWeight="bold">B: 8,000万</text>

        {/* Y-axis */}
        <text x="8" y="44" fill="var(--brand-bronze)" fontSize="7">3億</text>
        <text x="8" y="74" fill="var(--brand-bronze)" fontSize="7">2億</text>
        <text x="8" y="114" fill="var(--brand-bronze)" fontSize="7">1億</text>
        <text x="22" y="144" fill="var(--brand-bronze)" fontSize="7">0</text>

        {/* X-axis */}
        <text x="38" y="158" fill="var(--brand-bronze)" fontSize="7">35歳</text>
        <text x="160" y="158" fill="var(--brand-bronze)" fontSize="7">50歳</text>
        <text x="280" y="158" fill="var(--brand-bronze)" fontSize="7">65歳</text>
        <text x="400" y="158" fill="var(--brand-bronze)" fontSize="7">80歳</text>
      </svg>
    </div>
  )
}

/* ── Main LP Content ── */
export function LPContent() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      {/* Header */}
      <header className="border-b border-brand-sand bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="90" y1="94" x2="42" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
            <line x1="90" y1="94" x2="138" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
            <line x1="90" y1="94" x2="90" y2="156" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
            <circle cx="90" cy="94" r="9" fill="var(--brand-gold)" />
          </svg>
          <span className="text-lg font-bold text-brand-night">YOHACK</span>
        </div>
      </header>

      {/* S0: Hero */}
      <section className="py-20 sm:py-28 px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Y-branch logo */}
          <div className="flex justify-center mb-10">
            <YBranchHero />
          </div>

          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed tracking-tight text-brand-night"
            style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
            variants={fadeUp}
          >
            この家を買ったあと、
            <br className="sm:hidden" />
            年収が 20% 下がっても、
            <br />
            まだ動けるか。
          </motion.h1>

          <motion.p className="mt-6 text-base sm:text-lg text-brand-stone" variants={fadeUp}>
            この問いに、数字で答えられますか。
          </motion.p>

          <motion.p className="mt-8 text-sm sm:text-base leading-relaxed max-w-md mx-auto text-brand-bronze" variants={fadeUp}>
            YOHACK は、人生の選択肢を「世界線」として並べ、安心ラインと余白を見える化する意思決定シミュレーターです。
          </motion.p>

          <motion.div className="mt-10" variants={fadeUp}>
            <Link
              href="/fit?utm_source=lp&utm_medium=hero_cta"
              className="inline-block px-8 py-4 rounded-lg text-base font-bold text-primary-foreground transition-colors hover:opacity-90 bg-primary"
            >
              自分のケースで試す
            </Link>
          </motion.div>

          {/* Animated demo — income slider → graph change (loops every 5s) */}
          {/* To swap for a real recording: replace <DemoPreview /> with
              <video autoPlay loop muted playsInline className="w-full h-auto rounded-xl">
                <source src="/videos/demo-preview.mp4" type="video/mp4" />
              </video>
          */}
          <motion.div className="mt-12 max-w-2xl mx-auto" variants={fadeUp}>
            <DemoPreview />
          </motion.div>
        </motion.div>
      </section>

      {/* S2: Decision chain — 6000万 vs 8000万 */}
      <Section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest text-brand-bronze mb-6">— 問いの奥にある問い</p>
          <h2
            className="text-xl sm:text-2xl font-bold text-left mb-12 leading-relaxed text-brand-night"
            style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
          >
            35歳の選択が、
            <br />
            45歳の子どもの
            <br className="sm:hidden" />
            選択肢を決めていた。
          </h2>

          {/* Two-column chain comparison */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {/* Column A */}
            <motion.div className="space-y-0" variants={fadeUp}>
              <div className="text-xs tracking-widest text-brand-bronze mb-4">世界線 A</div>
              {[
                { age: '35歳', text: '物件 6,000万を選ぶ' },
                { age: '42歳', text: '転職のオファーを受けた', sub: '返済に余裕があったから' },
                { age: '45歳', text: '子どもを私立に入れた' },
              ].map((step, i) => (
                <div key={i}>
                  <div className="rounded-lg border border-brand-sand bg-white p-3 sm:p-4">
                    <p className="text-xs text-brand-bronze mb-1">{step.age}</p>
                    <p className="text-xs sm:text-sm font-normal text-brand-night">{step.text}</p>
                    {step.sub && <p className="text-xs text-brand-stone mt-1">（{step.sub}）</p>}
                  </div>
                  {i < 2 && (
                    <div className="flex justify-center py-1.5 text-brand-bronze/40">
                      <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6 0v12M2 8l4 5 4-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 rounded-lg bg-safe/10 px-3 py-2 sm:px-4 sm:py-3 text-center">
                <p className="text-xs text-safe mb-0.5">余白スコア</p>
                <p className="text-2xl font-bold text-safe font-[family-name:var(--font-dm-sans)] tabular-nums">78</p>
              </div>
            </motion.div>

            {/* Column B */}
            <motion.div className="space-y-0" variants={fadeUp}>
              <div className="text-xs tracking-widest text-brand-bronze mb-4">世界線 B</div>
              {[
                { age: '35歳', text: '物件 8,000万を選ぶ' },
                { age: '42歳', text: '転職のオファーを断った', sub: '返済がきつかったから' },
                { age: '45歳', text: '子どもの進路を妥協した' },
              ].map((step, i) => (
                <div key={i}>
                  <div className="rounded-lg border border-brand-sand bg-white p-3 sm:p-4">
                    <p className="text-xs text-brand-bronze mb-1">{step.age}</p>
                    <p className="text-xs sm:text-sm font-normal text-brand-night">{step.text}</p>
                    {step.sub && <p className="text-xs text-brand-stone mt-1">（{step.sub}）</p>}
                  </div>
                  {i < 2 && (
                    <div className="flex justify-center py-1.5 text-brand-bronze/40">
                      <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6 0v12M2 8l4 5 4-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 rounded-lg bg-danger/10 px-3 py-2 sm:px-4 sm:py-3 text-center">
                <p className="text-xs text-danger mb-0.5">余白スコア</p>
                <p className="text-2xl font-bold text-danger font-[family-name:var(--font-dm-sans)] tabular-nums">54</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Gap highlight */}
          <div className="mt-8 rounded-xl border border-brand-sand bg-white p-6 text-center">
            <p className="text-sm text-brand-stone">
              月々の返済差: <span className="font-bold text-brand-night">約 4.5万円</span>
            </p>
            <p className="text-sm text-brand-stone mt-1">
              10年で: <span className="font-bold text-brand-night">540万円</span>
            </p>
            <p className="text-sm text-brand-stone mt-3 leading-relaxed">
              その540万円が、転職の自由と
              <br className="sm:hidden" />
              教育費の選択肢になった。
            </p>
          </div>

          {/* Insight */}
          <div className="mt-8 space-y-2">
            <p className="text-sm sm:text-base leading-relaxed text-brand-stone">
              「買えるか」より「買った後も動けるか」。
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-brand-stone">
              YOHACKは、今の決断が将来の選択肢にどう連鎖するかを
              <br className="hidden sm:block" />
              数字で並べて見せる。
            </p>
          </div>
        </div>
      </Section>

      {/* S3: Three pillars */}
      <Section className="py-20 px-4 bg-brand-canvas">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-12 text-brand-night">
            3つの軸
          </h2>

          <motion.div
            className="grid gap-6 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {/* Worldline */}
            <motion.div className="rounded-xl p-6 text-center bg-white border border-brand-sand" variants={fadeUp}>
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="90" y1="94" x2="42" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
                  <line x1="90" y1="94" x2="138" y2="34" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
                  <line x1="90" y1="94" x2="90" y2="156" stroke="var(--brand-gold)" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="90" cy="94" r="9" fill="var(--brand-gold)" />
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2 text-brand-night">世界線</h3>
              <p className="text-sm leading-relaxed text-brand-stone">
                同じ前提で、異なる選択肢を並べて比較する。「家を買う」と「買わない」を100歳まで並走させる。
              </p>
            </motion.div>

            {/* Safety line */}
            <motion.div className="rounded-xl p-6 text-center bg-white border border-brand-sand" variants={fadeUp}>
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 24 L16 8 L28 24" stroke="var(--brand-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <line x1="4" y1="20" x2="28" y2="20" stroke="var(--brand-bronze)" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2 text-brand-night">安心ライン</h3>
              <p className="text-sm leading-relaxed text-brand-stone">
                「ここを割ると厳しい」の下限を見える化する。生存率と資産推移から算出。
              </p>
            </motion.div>

            {/* Margin */}
            <motion.div className="rounded-xl p-6 text-center bg-white border border-brand-sand" variants={fadeUp}>
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="var(--brand-gold)" strokeWidth="2" fill="none" />
                  <rect x="9" y="9" width="14" height="14" rx="2" fill="var(--brand-gold)" fillOpacity="0.2" />
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2 text-brand-night">余白</h3>
              <p className="text-sm leading-relaxed text-brand-stone">
                「どの年代にどれだけ余裕が残るか」に翻訳する。お金・時間・リスクの3軸で定量化。
              </p>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* S4: Flat stance — dark background */}
      <Section className="py-24 px-4 bg-brand-night">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-base sm:text-lg leading-loose text-white/70">
            YOHACK は、物件も保険も
            <br className="sm:hidden" />
            投資商品も売りません。
          </p>
          <p className="text-base sm:text-lg leading-loose text-white/70">
            どの世界線を選んでも、
            <br className="sm:hidden" />
            この OS の利益は変わりません。
          </p>
          <p className="text-base sm:text-lg leading-loose text-white/70">
            返すのは結論ではなく、
            <br className="sm:hidden" />
            比較と判断の土台です。
          </p>
        </div>
      </Section>

      {/* S5: Who it's for */}
      <Section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-left mb-12 text-brand-night">
            向いている人 / 向いていない人
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* For */}
            <div className="rounded-xl p-8 bg-white border border-brand-sand">
              <h3 className="text-base font-bold mb-4 text-brand-night">向いている人</h3>
              <ul className="space-y-3 text-sm text-brand-stone">
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">—</span>
                  <span>世帯年収 1,000〜3,000万で、7,000〜10,000万クラスの物件を本気で検討している</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">—</span>
                  <span>「買えるか」ではなく「買った後も動けるか」を気にしている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">—</span>
                  <span>夫婦で論点を整理するための客観データが欲しい</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">—</span>
                  <span>自分で数字を動かして判断したい</span>
                </li>
              </ul>
            </div>

            {/* Not for */}
            <div className="rounded-xl p-8 bg-white border border-brand-sand">
              <h3 className="text-base font-bold mb-4 text-brand-night">向いていない人</h3>
              <ul className="space-y-3 text-sm text-brand-stone">
                <li className="flex items-start gap-2">
                  <span className="text-brand-bronze">—</span>
                  <span>予算 5,000万以下 or 1.5億以上（レンジ外）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-bronze">—</span>
                  <span>「買うか買わないか」をすでに決めている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-bronze">—</span>
                  <span>数字よりもフィーリングで決めたい</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-bronze">—</span>
                  <span>ファイナンシャルプランナーに全部任せたい</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* S6: FAQ */}
      <Section className="py-20 px-4 bg-brand-canvas">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-12 text-brand-night">
            気になること
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-brand-sand">
                <AccordionTrigger
                  className="text-left text-sm sm:text-base font-normal hover:no-underline text-brand-night"
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-brand-stone">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* S7: CTA */}
      <Section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-base sm:text-lg leading-relaxed text-brand-stone">
            あなたのケースで、
            <br className="sm:hidden" />
            世界線比較が意味を持つかどうか。
          </p>
          <p className="text-base sm:text-lg leading-relaxed mt-1 text-brand-stone">
            12問のチェックで確認できます。
          </p>

          <div className="mt-10">
            <Link
              href="/fit?utm_source=lp&utm_medium=bottom_cta"
              className="inline-block px-8 py-4 rounded-lg text-base font-bold text-primary-foreground transition-colors hover:opacity-90 bg-primary"
            >
              12問で確認する
            </Link>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-brand-sand">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs leading-relaxed text-brand-bronze">
            ※ YOHACK はファイナンシャルアドバイスではありません。シミュレーション結果は参考値であり、将来の成果を保証するものではありません。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mt-4">
            <Link href="/legal/terms" className="text-xs transition-colors hover:underline text-brand-bronze">
              利用規約
            </Link>
            <Link href="/legal/privacy" className="text-xs transition-colors hover:underline text-brand-bronze">
              プライバシーポリシー
            </Link>
            <Link href="/legal/commercial" className="text-xs transition-colors hover:underline text-brand-bronze">
              特定商取引法
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
