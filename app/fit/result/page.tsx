'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Mail, ArrowRight } from 'lucide-react'
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
        <p style={{ color: '#5A5550' }}>判定結果が見つかりません。</p>
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
        <p className="text-sm font-semibold" style={{ color: '#8A7A62' }}>
          開発プレビュー — 全判定パターン
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4A7C59' }}>Ready</p>
        <ReadyResult />
      </div>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#C8B89A' }}>Prep (near)</p>
        <PrepResult prepBucket="near" />
      </div>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#8A7A62' }}>Prep (notyet)</p>
        <PrepResult prepBucket="notyet" />
      </div>
    </div>
  )
}

export default function FitResultPage() {
  return (
    <Suspense fallback={
      <Card className="p-8 border-0 shadow-sm text-center">
        <p style={{ color: '#8A7A62' }}>読み込み中...</p>
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
          <Check className="w-8 h-8" style={{ color: '#C8B89A' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1916' }}>
          適合しました
        </h2>
        <p style={{ color: '#5A5550' }}>
          YOHACKを使い始められる状態です。まずはシミュレーションをお試しください。
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(200, 184, 154, 0.1)' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#5A5550' }}>シミュレーションでできること</h3>
          <ul className="space-y-2 text-sm" style={{ color: '#5A5550' }}>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C8B89A' }} />
              <span>賃貸 vs 購入の世界線比較</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C8B89A' }} />
              <span>モンテカルロシミュレーション（1,000回）で安心ラインを算出</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C8B89A' }} />
              <span>ライフイベント（転職・育休・教育費）の影響を可視化</span>
            </li>
          </ul>
        </div>

        {/* Phase 3: Stripe Checkout will be inserted here */}

        <div className="pt-4">
          <Button
            size="lg"
            className="w-full text-white"
            style={{ backgroundColor: '#C8B89A' }}
            onClick={() => window.location.href = '/app'}
          >
            シミュレーションを試す
            <ArrowRight className="w-4 h-4 ml-2" />
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
          <Mail className="w-8 h-8" style={{ color: '#8A7A62' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1916' }}>
          {isNotYet
            ? '現在の条件ではマッチしませんでした'
            : 'もう少しで条件が整います'}
        </h2>
        <p style={{ color: '#5A5550' }}>
          {isNotYet
            ? '物件価格帯や期限、収入・資産の状況が動いたタイミングで再チェックしましょう。'
            : 'いまは前提が固まり切っていないため、先に準備を整える方が早いです。'}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3" style={{ color: '#5A5550' }}>Prep Mode とは</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#8A7A62' }}>
            YOHACK を使いこなすための準備ガイドです。年収・資産・支出の整理方法、数字の扱い方、よくある質問への回答などを、メールレターでお届けします。無料です。
          </p>
        </div>

        {/* Email registration stub */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(138, 122, 98, 0.05)' }}>
          <h3 className="font-semibold mb-2 text-sm" style={{ color: '#5A5550' }}>
            メールレターに登録する（準備中）
          </h3>
          <p className="text-xs mb-3" style={{ color: '#8A7A62' }}>
            メールレター機能は現在準備中です。近日公開予定。
          </p>
        </div>

        {!isNotYet && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#5A5550' }}>準備チェックリスト</h3>
              <ul className="space-y-2 text-xs" style={{ color: '#8A7A62' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>□</span>
                  <span>検討の期限やエリアがある程度見えている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>□</span>
                  <span>物件価格帯の目安が絞れている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>□</span>
                  <span>世帯の収支や資産を把握している</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>□</span>
                  <span>意思決定ツールへの投資に前向き</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(200, 184, 154, 0.05)' }}>
            <p className="text-xs mb-3" style={{ color: '#8A7A62' }}>
              {isNotYet
                ? '必要になったタイミングで、再度適合チェックを受けてください。'
                : '準備が整ったら、再度適合チェックを受けてください。'}
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
      </div>
    </Card>
  )
}
