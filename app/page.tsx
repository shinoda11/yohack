import Link from 'next/link'
import { LPClient } from './lp-client'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="90" y1="94" x2="42" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
            <line x1="90" y1="94" x2="138" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
            <line x1="90" y1="94" x2="90" y2="156" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
            <circle cx="90" cy="94" r="9" fill="#C8B89A" />
          </svg>
          <span className="text-lg font-semibold" style={{ color: '#1A1916' }}>YOHACK</span>
        </div>
      </header>

      {/* S1: Hero */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Y-branch logo */}
          <div className="flex justify-center mb-10">
            <svg
              width="64"
              height="64"
              viewBox="0 0 180 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="90" y1="94" x2="42" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
              <line x1="90" y1="94" x2="138" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
              <line x1="90" y1="94" x2="90" y2="156" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
              <circle cx="90" cy="94" r="9" fill="#C8B89A" />
              <circle cx="42" cy="34" r="6" fill="#C8B89A" />
              <circle cx="138" cy="34" r="6" fill="#C8B89A" />
            </svg>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed tracking-tight"
            style={{ color: '#1A1916', fontFamily: 'var(--font-noto-serif-jp), serif' }}
          >
            この家を買ったあと、
            <br className="sm:hidden" />
            年収が 20% 下がっても、
            <br />
            まだ動けるか。
          </h1>

          <p className="mt-6 text-base sm:text-lg" style={{ color: '#5A5550' }}>
            この問いに、数字で答えられますか。
          </p>

          <p className="mt-8 text-sm sm:text-base leading-relaxed" style={{ color: '#8A7A62' }}>
            YOHACK は、
            <br className="sm:hidden" />
            人生の選択肢を「世界線」として並べ、
            <br className="sm:hidden" />
            安心ラインと余白を見える化する
            <br className="sm:hidden" />
            意思決定シミュレーターです。
          </p>

          <div className="mt-10">
            <Link
              href="/fit"
              className="inline-block px-8 py-4 rounded-lg text-base font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#C8B89A' }}
            >
              あなたのケースで確認する
            </Link>
          </div>

          {/* Video placeholder */}
          <div
            className="mt-14 mx-auto max-w-lg rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: '#E8E4DE',
              height: '240px',
            }}
          >
            <p className="text-sm" style={{ color: '#8A7A62' }}>
              デモ動画 — 準備中
            </p>
          </div>
        </div>
      </section>

      {/* S2: Cases */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-12"
            style={{ color: '#1A1916' }}
          >
            何が見えるようになるか
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Case 1 */}
            <div
              className="rounded-xl p-8"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1916' }}>
                世帯年収 2,400万・家賃 32万の夫婦
              </h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#8A7A62' }}>
                外資 IT ＋メガバンク。
                <br className="sm:hidden" />
                都心 8,500万の 2LDK を検討中。
                <br className="sm:hidden" />
                海外転職も視野。
              </p>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#5A5550' }}>
                「家を買う / 買わない」より
                <br className="sm:hidden" />
                「駐在を取るかどうか」の方が、
                <br className="sm:hidden" />
                全体の余白に効いていた。
              </p>
              <p className="mt-4 text-xs" style={{ color: '#8A7A62' }}>
                → 詳細は YOHACK 本体で確認できます
              </p>
            </div>

            {/* Case 2 */}
            <div
              className="rounded-xl p-8"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1916' }}>
                世帯年収 2,400万・コンサル × 事業会社
              </h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#8A7A62' }}>
                ペースダウンしたい気持ちはあるが、
                <br className="sm:hidden" />
                今のうちに買うべきか迷っている。
              </p>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#5A5550' }}>
                年収 1,800万 → 1,200万の
                <br className="sm:hidden" />
                ペースダウンを織り込んでも、
                <br className="sm:hidden" />
                8,000万ラインなら
                <br className="sm:hidden" />
                安心ラインを割らなかった。
              </p>
              <p className="mt-4 text-xs" style={{ color: '#8A7A62' }}>
                → 詳細は YOHACK 本体で確認できます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S3: Three pillars */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-12"
            style={{ color: '#1A1916' }}
          >
            3つの軸
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Worldline */}
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="90" y1="94" x2="42" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
                  <line x1="90" y1="94" x2="138" y2="34" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
                  <line x1="90" y1="94" x2="90" y2="156" stroke="#C8B89A" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="90" cy="94" r="9" fill="#C8B89A" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1916' }}>
                世界線
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5A5550' }}>
                同じ前提で、異なる選択肢を
                <br className="sm:hidden" />
                並べて比較する。
              </p>
              <p className="text-sm leading-relaxed mt-2" style={{ color: '#8A7A62' }}>
                「家を買う世界線」と
                <br className="sm:hidden" />
                「買わない世界線」を、
                <br className="sm:hidden" />
                100歳まで並走させる。
              </p>
            </div>

            {/* Safety line */}
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 24 L16 8 L28 24" stroke="#C8B89A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <line x1="4" y1="20" x2="28" y2="20" stroke="#8A7A62" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1916' }}>
                安心ライン
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5A5550' }}>
                「ここを割ると厳しい」の
                <br className="sm:hidden" />
                下限を見える化する。
              </p>
              <p className="text-sm leading-relaxed mt-2" style={{ color: '#8A7A62' }}>
                生存率と資産推移から、
                <br className="sm:hidden" />
                あなたの安心ラインを算出する。
              </p>
            </div>

            {/* Margin */}
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <div className="flex justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="#C8B89A" strokeWidth="2" fill="none" />
                  <rect x="9" y="9" width="14" height="14" rx="2" fill="#C8B89A" fillOpacity="0.2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1916' }}>
                余白
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5A5550' }}>
                その差分を「どの年代に
                <br className="sm:hidden" />
                どれだけ余裕が残るか」に翻訳する。
              </p>
              <p className="text-sm leading-relaxed mt-2" style={{ color: '#8A7A62' }}>
                お金・時間・リスクの 3 軸で、
                <br className="sm:hidden" />
                人生の余白を定量化する。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* S4: Flat stance */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F3EF' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-base sm:text-lg leading-loose" style={{ color: '#5A5550' }}>
            YOHACK は、物件も保険も
            <br className="sm:hidden" />
            投資商品も売りません。
          </p>
          <p className="text-base sm:text-lg leading-loose mt-2" style={{ color: '#5A5550' }}>
            どの世界線を選んでも、
            <br className="sm:hidden" />
            この OS の利益は変わりません。
          </p>
          <p className="text-base sm:text-lg leading-loose mt-2" style={{ color: '#5A5550' }}>
            返すのは結論ではなく、
            <br className="sm:hidden" />
            比較と判断の土台です。
          </p>
        </div>
      </section>

      {/* S5: Who it's for */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-12"
            style={{ color: '#1A1916' }}
          >
            向いている人 / 向いていない人
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* For */}
            <div
              className="rounded-xl p-8"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1916' }}>
                ✓ 向いている人
              </h3>
              <ul className="space-y-3 text-sm" style={{ color: '#5A5550' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>—</span>
                  <span>世帯年収 1,000〜3,000万で、<br className="sm:hidden" />7,000〜10,000万クラスの物件を<br className="sm:hidden" />本気で検討している</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>—</span>
                  <span>「買えるか」ではなく「買った後も動けるか」を気にしている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>—</span>
                  <span>夫婦で論点を整理するための客観データが欲しい</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#C8B89A' }}>—</span>
                  <span>自分で数字を動かして判断したい</span>
                </li>
              </ul>
            </div>

            {/* Not for */}
            <div
              className="rounded-xl p-8"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DE' }}
            >
              <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1916' }}>
                ✗ 向いていない人
              </h3>
              <ul className="space-y-3 text-sm" style={{ color: '#5A5550' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#8A7A62' }}>—</span>
                  <span>予算 5,000万以下 or 1.5億以上<br className="sm:hidden" />（レンジ外）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#8A7A62' }}>—</span>
                  <span>「買うか買わないか」をすでに決めている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#8A7A62' }}>—</span>
                  <span>数字よりもフィーリングで決めたい</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#8A7A62' }}>—</span>
                  <span>ファイナンシャルプランナーに全部任せたい</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* S6: FAQ */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F3EF' }}>
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-12"
            style={{ color: '#1A1916' }}
          >
            よくある質問
          </h2>
          <LPClient />
        </div>
      </section>

      {/* S7: CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#5A5550' }}>
            あなたのケースで、
            <br className="sm:hidden" />
            世界線比較が意味を持つかどうか。
          </p>
          <p className="text-base sm:text-lg leading-relaxed mt-1" style={{ color: '#5A5550' }}>
            12問のチェックで確認できます。
          </p>

          <div className="mt-10">
            <Link
              href="/fit"
              className="inline-block px-8 py-4 rounded-lg text-base font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#C8B89A' }}
            >
              適合チェックに進む
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs leading-relaxed" style={{ color: '#8A7A62' }}>
            ※ YOHACK はファイナンシャルアドバイスではありません。
            <br className="sm:hidden" />
            シミュレーション結果は参考値であり、
            <br className="sm:hidden" />
            将来の成果を保証するものではありません。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mt-4">
            <Link href="/legal/terms" className="text-xs transition-colors hover:underline" style={{ color: '#8A7A62' }}>
              利用規約
            </Link>
            <Link href="/legal/privacy" className="text-xs transition-colors hover:underline" style={{ color: '#8A7A62' }}>
              プライバシーポリシー
            </Link>
            <Link href="/legal/commercial" className="text-xs transition-colors hover:underline" style={{ color: '#8A7A62' }}>
              特定商取引法
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
