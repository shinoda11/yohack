'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Mail } from 'lucide-react'

export default function PrepPage() {
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
          Prep Mode
        </h2>
        <p style={{ color: '#5A5550' }}>
          YOHACK を使いこなすための準備ガイドです。
        </p>
      </div>

      {/* Email confirmation */}
      <div className="flex items-center gap-2 p-3 rounded-lg mb-6" style={{ backgroundColor: 'rgba(138, 122, 98, 0.08)' }}>
        <Mail className="w-4 h-4 shrink-0" style={{ color: '#8A7A62' }} />
        <p className="text-xs" style={{ color: '#8A7A62' }}>結果をメールで送信しました</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3" style={{ color: '#5A5550' }}>メールレターの内容</h3>
          <ul className="space-y-2 text-sm" style={{ color: '#8A7A62' }}>
            <li>・年収・資産・支出の整理方法</li>
            <li>・数字入力のコツと扱い方</li>
            <li>・よくある質問への回答</li>
            <li>・30日後の再診断リマインド</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs mb-3" style={{ color: '#8A7A62' }}>
            条件が変わったら再診断できます。
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/fit'}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            適合チェックを受け直す
          </Button>
        </div>

        {/* Instagram */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center" style={{ color: '#8A7A62' }}>
            Instagramで問い×ケースを配信しています →{' '}
            <a
              href="https://www.instagram.com/yohack.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
              style={{ color: '#C8B89A' }}
            >
              @yohack.jp
            </a>
          </p>
        </div>
      </div>
    </Card>
  )
}
