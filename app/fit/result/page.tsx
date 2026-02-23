'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ResultContent() {
  const searchParams = useSearchParams()
  const judgment = searchParams.get('judgment') as 'ready' | 'prep' | null
  const prepBucket = searchParams.get('prepBucket') as 'near' | 'notyet' | null
  const isDev = searchParams.get('dev') === '1'

  if (judgment === 'ready') return <ReadyResult />
  if (judgment === 'prep') return <PrepResult prepBucket={prepBucket} />

  // Fallback
  if (!judgment) {
    if (isDev) {
      return <DevPreview />
    }
    return (
      <Card className="p-8 border-0 shadow-sm text-center">
        <p className="text-brand-stone">判定結果が見つかりません。</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.href = '/fit'}
        >
          適合チェックをやり直す
        </Button>
      </Card>
    )
  }

  return null
}

function DevPreview() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-sm font-bold text-brand-bronze">
          開発プレビュー — 全判定パターン
        </p>
      </div>
      <div>
        <p className="text-xs font-bold mb-2 text-safe">Ready</p>
        <ReadyResult />
      </div>
      <div>
        <p className="text-xs font-bold mb-2 text-brand-gold">Prep (near)</p>
        <PrepResult prepBucket="near" />
      </div>
      <div>
        <p className="text-xs font-bold mb-2 text-brand-bronze">Prep (notyet)</p>
        <PrepResult prepBucket="notyet" />
      </div>
    </div>
  )
}

export default function FitResultPage() {
  return (
    <Suspense fallback={
      <Card className="p-8 border-0 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </Card>
    }>
      <ResultContent />
    </Suspense>
  )
}

// --- Ready ---
function ReadyResult() {
  return (
    <Card className="p-8 border-0 shadow-sm">
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(200, 184, 154, 0.2)' }}
        >
          <Check className="w-8 h-8 text-brand-gold" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-brand-night">
          適合しました
        </h2>
        <p className="text-brand-stone">
          YOHACKでシミュレーションを開始できます
        </p>
      </div>

      {/* Email confirmation */}
      <div className="flex items-center gap-2 p-3 rounded-lg mb-6" style={{ backgroundColor: 'rgba(200, 184, 154, 0.1)' }}>
        <Mail className="w-4 h-4 shrink-0 text-brand-gold" />
        <p className="text-xs text-brand-bronze">結果をメールで送信しました</p>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(200, 184, 154, 0.1)' }}>
          <h3 className="font-bold mb-2 text-brand-stone">シミュレーションでできること</h3>
          <ul className="space-y-2 text-sm text-brand-stone">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
              <span>賃貸 vs 購入の世界線比較</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
              <span>モンテカルロシミュレーション（1,000回）で安心ラインを算出</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
              <span>ライフイベント（転職・育休・教育費）の影響を可視化</span>
            </li>
          </ul>
        </div>

        {/* TODO Phase2: ここにStripe Checkout ボタンが入る */}
        {/* <Button onClick={handleStripeCheckout}>Passを購入する（¥29,800）</Button> */}

        <div className="pt-4">
          <Button
            size="lg"
            className="w-full"
            asChild
          >
            <Link href="/app?from=fitgate">
              シミュレーションを開始する
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

// --- Prep ---
function PrepResult({ prepBucket }: { prepBucket: 'near' | 'notyet' | null }) {
  const isNotYet = prepBucket === 'notyet'

  return (
    <Card className="p-8 border-0 shadow-sm">
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(138, 122, 98, 0.15)' }}
        >
          <Mail className="w-8 h-8 text-brand-bronze" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-brand-night">
          {isNotYet
            ? '現在の条件ではマッチしませんでした'
            : 'もう少しで条件が整います'}
        </h2>
        <p className="text-brand-stone">
          {isNotYet
            ? '物件価格帯や期限、収入・資産の状況が動いたタイミングで再チェックしましょう。'
            : 'いまは前提が固まり切っていないため、先に準備を整える方が早いです。'}
        </p>
      </div>

      {/* Email confirmation */}
      <div className="flex items-center gap-2 p-3 rounded-lg mb-6" style={{ backgroundColor: 'rgba(138, 122, 98, 0.08)' }}>
        <Mail className="w-4 h-4 shrink-0 text-brand-bronze" />
        <p className="text-xs text-brand-bronze">結果をメールで送信しました</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold mb-3 text-brand-stone">Prep Mode とは</h3>
          <p className="text-sm leading-relaxed text-brand-bronze">
            YOHACK を使いこなすための準備ガイドです。年収・資産・支出の整理方法、数字の扱い方、よくある質問への回答などを、メールレターでお届けします。
          </p>
          <Button
            variant="outline"
            className="w-full mt-4 min-h-[44px] gap-2"
            asChild
          >
            <Link href="/fit/prep">
              <ArrowRight className="w-4 h-4" />
              Prep Mode で準備を始める
            </Link>
          </Button>
        </div>

        {!isNotYet && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <h3 className="font-bold mb-3 text-sm text-brand-stone">準備チェックリスト</h3>
              <ul className="space-y-2 text-xs text-brand-bronze">
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">□</span>
                  <span>検討の期限やエリアがある程度見えている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">□</span>
                  <span>物件価格帯の目安が絞れている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">□</span>
                  <span>世帯の収支や資産を把握している</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold">□</span>
                  <span>意思決定ツールへの投資に前向き</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(200, 184, 154, 0.05)' }}>
            <p className="text-xs mb-3 text-brand-bronze">
              条件が変わったら再診断できます。
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = '/fit'}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              再診断を受ける
            </Button>
          </div>
        </div>

        {/* Instagram */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center text-brand-bronze">
            Instagramで問い×ケースを配信しています →{' '}
            <a
              href="https://www.instagram.com/yohack.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-normal text-brand-gold"
            >
              @yohack.jp
            </a>
          </p>
        </div>
      </div>
    </Card>
  )
}
