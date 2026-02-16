import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const fitGateSchema = z.object({
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  q1DecisionDeadline: z.string().min(1, "選択してください"),
  q2HousingStatus: z.string().min(1, "選択してください"),
  q3PriceRange: z.string().min(1, "選択してください"),
  q4IncomeRange: z.string().min(1, "選択してください"),
  q5AssetRange: z.string().min(1, "選択してください"),
  q6NumberInputTolerance: z.string().min(1, "選択してください"),
  q7CareerChange: z.string().min(1, "選択してください"),
  q8LifeEvent: z.string().min(1, "選択してください"),
  q9CurrentQuestion: z.string().min(1, "選択してください"),
  q10PreferredApproach: z.string().min(1, "選択してください"),
  q11PrivacyConsent: z.boolean().refine((val) => val === true, {
    message: "同意が必要です",
  }),
  q12BudgetSense: z.string().min(1, "選択してください"),
  invitationToken: z.string().optional(),
});

type FitGateFormData = z.infer<typeof fitGateSchema>;

export default function FitGate() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 12;

  // Track page view
  useEffect(() => {
    trackEvent(AnalyticsEvents.FITGATE_STARTED);
  }, []);

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
  });

  const submitFitGate = trpc.fitGate.submit.useMutation({
    onSuccess: (data) => {
      // Navigate to result page with judgment result and email
      const email = watch("email") || "";
      const prepBucketParam = data.prepBucket ? `&prepBucket=${data.prepBucket}` : "";
      setLocation(`/fit-result?result=${data.judgmentResult}&id=${data.id}&email=${encodeURIComponent(email)}${prepBucketParam}`);
    },
    onError: (error: any) => {
      toast.error("エラーが発生しました", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FitGateFormData) => {
    trackEvent(AnalyticsEvents.FITGATE_SUBMITTED);
    submitFitGate.mutate(data);
  };

  const privacyConsent = watch("q11PrivacyConsent");

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container py-4">
            <h1 className="text-xl font-bold">YOHACK - 適合チェック（12問）</h1>
          </div>
        </header>

        {/* Progress */}
        <div className="bg-secondary/30 py-4">
          <div className="container">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>所要時間: 約3分</span>
              <span>12問中 {currentStep}/{totalSteps}</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <section className="container py-12 max-w-3xl">
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Email (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス（必須）</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                />
                <p className="text-xs text-muted-foreground">
                  判定結果と次のステップをお送りするため、メールアドレスが必要です
                </p>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Q1: 意思決定期限 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">1. 意思決定期限はありますか</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q1DecisionDeadline", value);
                    setCurrentStep(Math.max(currentStep, 1));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1か月以内" id="q1-1" />
                    <Label htmlFor="q1-1" className="font-normal cursor-pointer">1か月以内</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3か月以内" id="q1-2" />
                    <Label htmlFor="q1-2" className="font-normal cursor-pointer">3か月以内</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6か月以内" id="q1-3" />
                    <Label htmlFor="q1-3" className="font-normal cursor-pointer">6か月以内</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="未定" id="q1-4" />
                    <Label htmlFor="q1-4" className="font-normal cursor-pointer">未定</Label>
                  </div>
                </RadioGroup>
                {errors.q1DecisionDeadline && (
                  <p className="text-sm text-destructive">{errors.q1DecisionDeadline.message}</p>
                )}
              </div>

              {/* Q2: 住宅の検討状況 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">2. 住宅の検討状況</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q2HousingStatus", value);
                    setCurrentStep(Math.max(currentStep, 2));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="物件/エリア/価格帯が具体" id="q2-1" />
                    <Label htmlFor="q2-1" className="font-normal cursor-pointer">物件/エリア/価格帯が具体</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="価格帯だけ具体" id="q2-2" />
                    <Label htmlFor="q2-2" className="font-normal cursor-pointer">価格帯だけ具体</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="まだ漠然" id="q2-3" />
                    <Label htmlFor="q2-3" className="font-normal cursor-pointer">まだ漠然</Label>
                  </div>
                </RadioGroup>
                {errors.q2HousingStatus && (
                  <p className="text-sm text-destructive">{errors.q2HousingStatus.message}</p>
                )}
              </div>

              {/* Q3: 検討価格帯 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">3. 検討価格帯</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q3PriceRange", value);
                    setCurrentStep(Math.max(currentStep, 3));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5,000万円未満" id="q3-1" />
                    <Label htmlFor="q3-1" className="font-normal cursor-pointer">5,000万円未満</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5,000万〜6,999万" id="q3-2" />
                    <Label htmlFor="q3-2" className="font-normal cursor-pointer">5,000万〜6,999万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7,000万〜9,999万" id="q3-3" />
                    <Label htmlFor="q3-3" className="font-normal cursor-pointer">7,000万〜9,999万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1億以上" id="q3-4" />
                    <Label htmlFor="q3-4" className="font-normal cursor-pointer">1億以上</Label>
                  </div>
                </RadioGroup>
                {errors.q3PriceRange && (
                  <p className="text-sm text-destructive">{errors.q3PriceRange.message}</p>
                )}
              </div>

              {/* Q4: 世帯年収レンジ */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">4. 世帯年収レンジ</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q4IncomeRange", value);
                    setCurrentStep(Math.max(currentStep, 4));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1,000万未満" id="q4-1" />
                    <Label htmlFor="q4-1" className="font-normal cursor-pointer">1,000万未満</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1,000万〜1,499万" id="q4-2" />
                    <Label htmlFor="q4-2" className="font-normal cursor-pointer">1,000万〜1,499万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1,500万〜2,499万" id="q4-3" />
                    <Label htmlFor="q4-3" className="font-normal cursor-pointer">1,500万〜2,499万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2,500万以上" id="q4-4" />
                    <Label htmlFor="q4-4" className="font-normal cursor-pointer">2,500万以上</Label>
                  </div>
                </RadioGroup>
                {errors.q4IncomeRange && (
                  <p className="text-sm text-destructive">{errors.q4IncomeRange.message}</p>
                )}
              </div>

              {/* Q5: 金融資産レンジ */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">5. 金融資産レンジ</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q5AssetRange", value);
                    setCurrentStep(Math.max(currentStep, 5));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="500万未満" id="q5-1" />
                    <Label htmlFor="q5-1" className="font-normal cursor-pointer">500万未満</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="500万〜1,999万" id="q5-2" />
                    <Label htmlFor="q5-2" className="font-normal cursor-pointer">500万〜1,999万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2,000万〜4,999万" id="q5-3" />
                    <Label htmlFor="q5-3" className="font-normal cursor-pointer">2,000万〜4,999万</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5,000万以上" id="q5-4" />
                    <Label htmlFor="q5-4" className="font-normal cursor-pointer">5,000万以上</Label>
                  </div>
                </RadioGroup>
                {errors.q5AssetRange && (
                  <p className="text-sm text-destructive">{errors.q5AssetRange.message}</p>
                )}
              </div>

              {/* Q6: 数字入力の許容度 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">6. 数字入力の許容度</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q6NumberInputTolerance", value);
                    setCurrentStep(Math.max(currentStep, 6));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="年収/資産/支出/物件価格を入力できる" id="q6-1" />
                    <Label htmlFor="q6-1" className="font-normal cursor-pointer">年収/資産/支出/物件価格を入力できる</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="一部だけ入力できる" id="q6-2" />
                    <Label htmlFor="q6-2" className="font-normal cursor-pointer">一部だけ入力できる</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="入力したくない" id="q6-3" />
                    <Label htmlFor="q6-3" className="font-normal cursor-pointer">入力したくない</Label>
                  </div>
                </RadioGroup>
                {errors.q6NumberInputTolerance && (
                  <p className="text-sm text-destructive">{errors.q6NumberInputTolerance.message}</p>
                )}
              </div>

              {/* Q7: キャリア変動の可能性 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">7. キャリア変動の可能性</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q7CareerChange", value);
                    setCurrentStep(Math.max(currentStep, 7));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3年以内に転職/独立/海外の可能性が高い" id="q7-1" />
                    <Label htmlFor="q7-1" className="font-normal cursor-pointer">3年以内に転職/独立/海外の可能性が高い</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="可能性はある" id="q7-2" />
                    <Label htmlFor="q7-2" className="font-normal cursor-pointer">可能性はある</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="予定なし" id="q7-3" />
                    <Label htmlFor="q7-3" className="font-normal cursor-pointer">予定なし</Label>
                  </div>
                </RadioGroup>
                {errors.q7CareerChange && (
                  <p className="text-sm text-destructive">{errors.q7CareerChange.message}</p>
                )}
              </div>

              {/* Q8: ライフイベントの分岐 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">8. ライフイベントの分岐</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q8LifeEvent", value);
                    setCurrentStep(Math.max(currentStep, 8));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="子ども/介護/扶養などで支出増の可能性あり" id="q8-1" />
                    <Label htmlFor="q8-1" className="font-normal cursor-pointer">子ども/介護/扶養などで支出増の可能性あり</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="可能性はあるが小さい" id="q8-2" />
                    <Label htmlFor="q8-2" className="font-normal cursor-pointer">可能性はあるが小さい</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="特にない" id="q8-3" />
                    <Label htmlFor="q8-3" className="font-normal cursor-pointer">特にない</Label>
                  </div>
                </RadioGroup>
                {errors.q8LifeEvent && (
                  <p className="text-sm text-destructive">{errors.q8LifeEvent.message}</p>
                )}
              </div>

              {/* Q9: いま困っている問い */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">9. いま困っている問い</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q9CurrentQuestion", value);
                    setCurrentStep(Math.max(currentStep, 9));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="この価格で買っても逃げ道が残るか" id="q9-1" />
                    <Label htmlFor="q9-1" className="font-normal cursor-pointer">この価格で買っても逃げ道が残るか</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rent vs Buyで結論が出ない" id="q9-2" />
                    <Label htmlFor="q9-2" className="font-normal cursor-pointer">Rent vs Buyで結論が出ない</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="投資と住宅の配分が不明" id="q9-3" />
                    <Label htmlFor="q9-3" className="font-normal cursor-pointer">投資と住宅の配分が不明</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="まず何からか不明" id="q9-4" />
                    <Label htmlFor="q9-4" className="font-normal cursor-pointer">まず何からか不明</Label>
                  </div>
                </RadioGroup>
                {errors.q9CurrentQuestion && (
                  <p className="text-sm text-destructive">{errors.q9CurrentQuestion.message}</p>
                )}
              </div>

              {/* Q10: 希望する進め方 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">10. 希望する進め方</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q10PreferredApproach", value);
                    setCurrentStep(Math.max(currentStep, 10));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="自分で触って判断したい" id="q10-1" />
                    <Label htmlFor="q10-1" className="font-normal cursor-pointer">自分で触って判断したい</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="90分で結論を出したい" id="q10-2" />
                    <Label htmlFor="q10-2" className="font-normal cursor-pointer">90分で結論を出したい</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="まず概要だけ知りたい" id="q10-3" />
                    <Label htmlFor="q10-3" className="font-normal cursor-pointer">まず概要だけ知りたい</Label>
                  </div>
                </RadioGroup>
                {errors.q10PreferredApproach && (
                  <p className="text-sm text-destructive">{errors.q10PreferredApproach.message}</p>
                )}
              </div>

              {/* Q11: 情報の取り扱い（確認） */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">11. 情報の取り扱い（確認）</Label>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="q11"
                    checked={privacyConsent}
                    onCheckedChange={(checked) => {
                      setValue("q11PrivacyConsent", checked as boolean);
                      setCurrentStep(Math.max(currentStep, 11));
                    }}
                  />
                  <Label htmlFor="q11" className="font-normal cursor-pointer leading-relaxed">
                    入力情報を目的外に利用しないことに同意する
                  </Label>
                </div>
                {errors.q11PrivacyConsent && (
                  <p className="text-sm text-destructive">{errors.q11PrivacyConsent.message}</p>
                )}
              </div>

              {/* Q12: 予算感 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">12. 予算感</Label>
                <RadioGroup
                  onValueChange={(value) => {
                    setValue("q12BudgetSense", value);
                    setCurrentStep(Math.max(currentStep, 12));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3万円未満なら検討" id="q12-1" />
                    <Label htmlFor="q12-1" className="font-normal cursor-pointer">3万円未満なら検討</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3万〜4.9万なら検討" id="q12-2" />
                    <Label htmlFor="q12-2" className="font-normal cursor-pointer">3万〜4.9万なら検討</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5万円以上でも意思決定が進むなら払う" id="q12-3" />
                    <Label htmlFor="q12-3" className="font-normal cursor-pointer">5万円以上でも意思決定が進むなら払う</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="未定" id="q12-4" />
                    <Label htmlFor="q12-4" className="font-normal cursor-pointer">未定</Label>
                  </div>
                </RadioGroup>
                {errors.q12BudgetSense && (
                  <p className="text-sm text-destructive">{errors.q12BudgetSense.message}</p>
                )}
              </div>

              {/* 招待トークン（任意） */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="token">招待トークン（任意）</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="INV-XXXXXX"
                  {...register("invitationToken")}
                />
                <p className="text-xs text-muted-foreground">
                  招待トークンはSessionの案内可否に影響します
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitFitGate.isPending}
                >
                  {submitFitGate.isPending ? "送信中..." : "適合チェックを完了する"}
                </Button>
              </div>
            </form>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 YOHACK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
