# YOHACK ベータ準備レポート
日付: 2026-02-23

## ビルド / テスト
- pnpm build: OK
- pnpm test: 252/252 pass（6 ファイル）

## デッドコード
- 削除済みファイル確認: 全 8 件 ✅
  - components/v2/WorldLineLens.tsx ✅
  - components/v2/NextStepCard.tsx ✅
  - components/v2/EventLayer.tsx ✅
  - components/v2/ConclusionCard.tsx ✅
  - components/v2/ReasonCard.tsx ✅
  - hooks/useWorldLines.ts ✅
  - lib/v2/strategy.ts ✅
  - lib/v2/events.ts ✅
- 未使用 import: 0 件 ✅

## コード品質
- console.log 残存: 1 件（`app/api/prep-register/route.ts` — Phase 2 スタブ、意図的）
- console.error/warn: 2 件（エラーハンドラ内、適切な使用）
  - `hooks/useHousingScenarios.ts:27` — console.error（例外処理）
  - `lib/fitgate.ts:188` — console.warn（API 呼び出し失敗時）
- localhost ハードコード: 0 件 ✅
- TODO/FIXME: 4 件（全て Phase 2 スコープ、Phase 1 では対応不要）
  - `app/api/prep-register/route.ts:7` — TODO Phase2: Supabase prepModeSubscribers テーブルに保存
  - `app/api/prep-register/route.ts:8` — TODO Phase2: SendGrid でレター送信
  - `app/fit/result/page.tsx:124` — TODO Phase2: Stripe Checkout ボタン
  - `lib/fitgate.ts:174` — TODO Phase2: SendGrid でテンプレート送信

## CLAUDE.md
- 更新完了: ✅（全セクション書き直し、実態に完全同期）
- テスト数: 252
- コンポーネント数: 61（dashboard 21 + branch 8 + v2 3 + layout 5 + ui 24）
- ページ数: 17（公開 9 + プロダクト 5 + リダイレクト 2 + API 1）
- hooks: 9
- lib ファイル: 14 + v2/ 5 + __tests__/ 6

## 主要ファイル行数
| ファイル | 行数 |
|---------|------|
| app/app/page.tsx | 640 |
| app/app/branch/page.tsx | 541 |
| app/app/worldline/page.tsx | 178 |
| lib/engine.ts | 505 |
| lib/calc-core.ts | 375 |
| lib/store.ts | 395 |
| lib/types.ts | 234 |
| lib/branch.ts | 688 |

## 依存関係（主要バージョン）
- Next.js 16.1.6
- React 19.2.4
- TypeScript 5.9.3
- Zustand 5.0.11
- Recharts 2.15.4
- Tailwind CSS 4.1.18
- Framer Motion 12.34.3
