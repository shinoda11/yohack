'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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

export function LPClient() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`} style={{ borderColor: '#E8E4DE' }}>
          <AccordionTrigger
            className="text-left text-sm sm:text-base font-medium hover:no-underline"
            style={{ color: '#1A1916' }}
          >
            {faq.q}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed" style={{ color: '#5A5550' }}>
              {faq.a}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
