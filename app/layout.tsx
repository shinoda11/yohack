import React from "react"
import type { Metadata } from 'next'
import { DM_Sans, Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
});

const notoSerifJP = Noto_Serif_JP({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-jp',
});

export const metadata: Metadata = {
  title: 'YOHACK - 人生に、余白を。',
  description: '余白（お金・時間・体力）で人生の選択を比較する。安心ラインと世界線比較で、住宅・キャリア・家族の意思決定を「次の一手」まで導きます。',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  openGraph: {
    images: [{ url: '/icon.svg', width: 180, height: 180 }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${dmSans.variable} ${notoSansJP.variable} ${notoSerifJP.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
