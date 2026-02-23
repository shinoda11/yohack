'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Mail } from 'lucide-react'
import {
  judgeFitGate,
  saveFitGateAnswers,
  getFitGateAttempts,
  incrementFitGateAttempts,
  sendFitGateEmail,
  type FitGateResult,
} from '@/lib/fitgate'

// Schema for 12 questions (email is collected separately)
const fitGateSchema = z.object({
  q1DecisionDeadline: z.string().min(1, '選択してください'),
  q2HousingStatus: z.string().min(1, '選択してください'),
  q3PriceRange: z.string().min(1, '選択してください'),
  q4IncomeRange: z.string().min(1, '選択してください'),
  q5AssetRange: z.string().min(1, '選択してください'),
  q6NumberInputTolerance: z.string().min(1, '選択してください'),
  q7CareerChange: z.string().min(1, '選択してください'),
  q8LifeEvent: z.string().min(1, '選択してください'),
  q9CurrentQuestion: z.string().min(1, '選択してください'),
  q10PreferredApproach: z.string().min(1, '選択してください'),
  q11PrivacyConsent: z.boolean().refine((val) => val === true, {
    message: '同意が必要です',
  }),
  q12BudgetSense: z.string().min(1, '選択してください'),
  invitationToken: z.string().optional(),
})

type FitGateFormData = z.infer<typeof fitGateSchema>

// Question data
const questions = [
  {
    key: 'q1DecisionDeadline' as const,
    label: '1. 意思決定期限はありますか',
    options: ['1か月以内', '3か月以内', '6か月以内', '未定'],
  },
  {
    key: 'q2HousingStatus' as const,
    label: '2. 住宅の検討状況',
    options: ['物件/エリア/価格帯が具体', '価格帯だけ具体', 'まだ漠然'],
  },
  {
    key: 'q3PriceRange' as const,
    label: '3. 検討価格帯',
    options: ['5,000万円未満', '5,000万〜6,999万', '7,000万〜9,999万', '1億以上'],
  },
  {
    key: 'q4IncomeRange' as const,
    label: '4. 世帯年収レンジ',
    options: ['1,000万未満', '1,000万〜1,499万', '1,500万〜2,499万', '2,500万以上'],
  },
  {
    key: 'q5AssetRange' as const,
    label: '5. 金融資産レンジ',
    options: ['500万未満', '500万〜1,999万', '2,000万〜4,999万', '5,000万以上'],
  },
  {
    key: 'q6NumberInputTolerance' as const,
    label: '6. 数字入力の許容度',
    options: ['年収/資産/支出/物件価格を入力できる', '一部だけ入力できる', '入力したくない'],
  },
  {
    key: 'q7CareerChange' as const,
    label: '7. キャリア変動の可能性',
    options: ['3年以内に転職/独立/海外の可能性が高い', '可能性はある', '予定なし'],
  },
  {
    key: 'q8LifeEvent' as const,
    label: '8. ライフイベントの分岐',
    options: ['子ども/介護/扶養などで支出増の可能性あり', '可能性はあるが小さい', '特にない'],
  },
  {
    key: 'q9CurrentQuestion' as const,
    label: '9. いま困っている問い',
    options: [
      'この価格で買っても逃げ道が残るか',
      'Rent vs Buyで結論が出ない',
      '投資と住宅の配分が不明',
      'まず何からか不明',
    ],
  },
  {
    key: 'q10PreferredApproach' as const,
    label: '10. 希望する進め方',
    options: ['自分で触って判断したい', '90分で結論を出したい', 'まず概要だけ知りたい'],
  },
]

const MAX_ATTEMPTS = 3

export default function FitGatePage() {
  return (
    <Suspense fallback={null}>
      <FitGateForm />
    </Suspense>
  )
}

function FitGateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenValue = searchParams.get('token')
  const hasTokenParam = tokenValue !== null
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 12
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Phase: questions → email → redirect
  const [phase, setPhase] = useState<'questions' | 'email'>('questions')
  const [pendingData, setPendingData] = useState<FitGateFormData | null>(null)
  const [pendingResult, setPendingResult] = useState<FitGateResult | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  // Attempt limiting
  const [attemptCount, setAttemptCount] = useState(0)
  useEffect(() => {
    setAttemptCount(getFitGateAttempts())
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FitGateFormData>({
    resolver: zodResolver(fitGateSchema),
    defaultValues: {
      q11PrivacyConsent: false,
    },
  })

  const privacyConsent = watch('q11PrivacyConsent')

  const onQuestionsSubmit = (data: FitGateFormData) => {
    // Compute judgment (email not needed for judgment logic)
    const result = judgeFitGate({
      ...data,
      email: '',
    })
    setPendingData(data)
    setPendingResult(result)
    setPhase('email')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onEmailSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError('メールアドレスを入力してください')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setEmailError('有効なメールアドレスを入力してください')
      return
    }

    setIsSubmitting(true)

    // Save answers with email
    const answersWithEmail = { ...pendingData!, email: trimmed }
    saveFitGateAnswers(answersWithEmail)
    incrementFitGateAttempts()
    await sendFitGateEmail(trimmed, pendingResult!, answersWithEmail)

    router.push(
      `/fit/result?judgment=${pendingResult!.judgment}&prepBucket=${pendingResult!.prepBucket || ''}`
    )
  }

  // Attempt limit reached
  if (attemptCount >= MAX_ATTEMPTS) {
    return (
      <Card className="p-8 border-0 shadow-sm text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto"
          style={{ backgroundColor: 'rgba(138, 122, 98, 0.15)' }}
        >
          <Mail className="w-8 h-8 text-brand-bronze" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-brand-night">
          診断回数の上限に達しました
        </h2>
        <p className="text-sm mb-4 text-brand-stone">
          診断は{MAX_ATTEMPTS}回まで利用できます。
        </p>
        <p className="text-xs text-brand-bronze">
          ご質問は{' '}
          <a href="mailto:hello@yohack.jp" className="underline">
            hello@yohack.jp
          </a>{' '}
          まで
        </p>
      </Card>
    )
  }

  // Email step
  if (phase === 'email') {
    return (
      <>
        {/* Progress — 100% */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-brand-bronze">
            <span>あと1ステップ</span>
            <span>12問 完了</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E4DE' }}>
            <div
              className="h-full rounded-full bg-brand-gold"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <Card className="p-6 sm:p-8 border-0 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto"
              style={{ backgroundColor: 'rgba(200, 184, 154, 0.2)' }}
            >
              <Mail className="w-6 h-6 text-brand-gold" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-brand-night">
              診断結果をメールでもお届けします
            </h2>
            <p className="text-sm text-brand-bronze">
              結果と次のステップをメールでお送りします
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-stone">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onEmailSubmit()
                  }
                }}
              />
              {emailError && <p className="text-sm text-brand-bronze">{emailError}</p>}
            </div>

            <Button
              size="lg"
              className="w-full text-white bg-brand-gold"
              onClick={onEmailSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中...' : '結果を見る'}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  // Questions phase
  return (
    <>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-brand-bronze">
          <span>所要時間: 約3分</span>
          <span>12問中 {currentStep}/{totalSteps}</span>
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E4DE' }}>
          <div
            className="h-full transition-all duration-300 rounded-full bg-brand-gold"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8 border-0 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
        <h1 className="text-xl font-bold mb-6 text-brand-night">
          適合チェック（12問）
        </h1>

        <form onSubmit={handleSubmit(onQuestionsSubmit)} className="space-y-8">
          {/* Q1–Q10 radio questions */}
          {questions.map((q, qi) => (
            <div key={q.key} className="space-y-3">
              <Label className="text-base font-bold text-brand-stone">
                {q.label}
              </Label>
              <RadioGroup
                onValueChange={(value) => {
                  setValue(q.key, value)
                  setCurrentStep(Math.max(currentStep, qi + 1))
                }}
              >
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${q.key}-${oi}`} />
                    <Label htmlFor={`${q.key}-${oi}`} className="font-normal cursor-pointer text-brand-stone">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors[q.key] && (
                <p className="text-sm text-brand-bronze">{(errors[q.key] as { message?: string })?.message}</p>
              )}
            </div>
          ))}

          {/* Q11: Privacy consent */}
          <div className="space-y-3">
            <Label className="text-base font-bold text-brand-stone">
              11. 情報の取り扱い（確認）
            </Label>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="q11"
                checked={privacyConsent}
                onCheckedChange={(checked) => {
                  setValue('q11PrivacyConsent', checked as boolean)
                  setCurrentStep(Math.max(currentStep, 11))
                }}
              />
              <Label htmlFor="q11" className="font-normal cursor-pointer leading-relaxed text-brand-stone">
                入力情報を目的外に利用しないことに同意する
              </Label>
            </div>
            {errors.q11PrivacyConsent && (
              <p className="text-sm text-brand-bronze">{errors.q11PrivacyConsent.message}</p>
            )}
          </div>

          {/* Q12: Budget */}
          <div className="space-y-3">
            <Label className="text-base font-bold text-brand-stone">
              12. 予算感
            </Label>
            <RadioGroup
              onValueChange={(value) => {
                setValue('q12BudgetSense', value)
                setCurrentStep(Math.max(currentStep, 12))
              }}
            >
              {['3万円未満なら検討', '3万〜4.9万なら検討', '5万円以上でも意思決定が進むなら払う', '未定'].map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`q12-${i}`} />
                  <Label htmlFor={`q12-${i}`} className="font-normal cursor-pointer text-brand-stone">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.q12BudgetSense && (
              <p className="text-sm text-brand-bronze">{errors.q12BudgetSense.message}</p>
            )}
          </div>

          {/* Invitation token — only shown when ?token= is in URL */}
          {hasTokenParam && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="token" className="text-brand-stone">招待トークン（任意）</Label>
              <Input
                id="token"
                type="text"
                placeholder="INV-XXXXXX"
                defaultValue={tokenValue ?? ''}
                {...register('invitationToken')}
              />
              <p className="text-xs text-brand-bronze">
                招待トークンをお持ちの場合は入力してください
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full text-white bg-brand-gold"
              disabled={isSubmitting}
            >
              次へ
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
