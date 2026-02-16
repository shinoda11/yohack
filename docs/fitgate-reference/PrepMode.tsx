import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Mail, ArrowRight, FileText, Calculator, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const prepModeSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

type PrepModeFormData = z.infer<typeof prepModeSchema>;

export default function PrepMode() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrepModeFormData>({
    resolver: zodResolver(prepModeSchema),
  });

  const subscribePrepMode = trpc.prepMode.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("登録完了", {
        description: "Prep Mode レターをお送りします",
      });
    },
    onError: (error: any) => {
      toast.error("エラーが発生しました", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: PrepModeFormData) => {
    // Prep Mode登録は京都モデル v0.3.1 仕様では計測対象外
    subscribePrepMode.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container py-4">
            <h1 className="text-xl font-bold">YOHACK - Prep Mode</h1>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-secondary/30 py-12">
          <div className="container max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prep Mode</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              YOHACK を使いこなすための準備ガイド（無料）
            </p>
          </div>
        </section>

        {/* What is Prep Mode */}
        <section className="container py-12 max-w-4xl">
          <Card className="p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4">Prep Mode とは</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              YOHACK 本体を使う前に、「年収・資産・支出の棚卸し」と「Rent vs Buy以前に決めておくべき前提（どこに住みたいか、どこまで働きたいか）」を整えることを目的としています。年収・資産・支出の整理方法、数字の扱い方、よくある質問への回答などを、メールレターでお届けします。無料です。
            </p>
            <p className="text-muted-foreground leading-relaxed">
              準備が整ったら、再度適合チェックにお越しください。招待トークンをお持ちの方は、適合チェック時に入力してください。
            </p>
          </Card>

          {/* Preparation Checklist */}
          <Card className="p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6">準備チェックリスト</h3>
            <div className="space-y-6">
              {/* Item 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">1. 年収・資産・支出の整理</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    世帯年収、金融資産、月々の支出（家賃・生活費・貯蓄）を把握しましょう。おおよその数字で構いません。
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 数字入力への心理的準備</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    YOHACK は、年収・資産・支出・物件価格などの数字を入力することで、世界線を比較します。数字を入力することに抵抗がある場合は、まずPrep Mode で準備を整えましょう。
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. 意思決定の目的を明確にする</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    「この価格で買っても逃げ道が残るか」「Rent vs Buyで結論が出ない」「投資と住宅の配分が不明」など、いま困っている問いを明確にしましょう。
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Form */}
          {!isSubscribed ? (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Prep Mode レターに登録する</h3>
              <p className="text-muted-foreground mb-6">
                準備ガイド、よくある質問、今後の展開などをメールでお届けします。
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={subscribePrepMode.isPending}
                >
                  {subscribePrepMode.isPending ? "登録中..." : "Prep Mode に登録する"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">登録完了</h3>
              <p className="text-muted-foreground mb-6">
                Prep Mode レターをお送りします。メールをご確認ください。
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/"}
              >
                トップページに戻る
              </Button>
            </Card>
          )}

          {/* Re-check Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              準備が整った方は、再度適合チェックにお越しください
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/fit-gate"}
            >
              適合チェックに進む
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
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
