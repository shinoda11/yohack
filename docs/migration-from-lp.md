# 旧 LP リポジトリからの移植ガイド

## 背景

旧リポ `shinoda11/exit_readiness_lp`（Manus製）から移植対象コードを `docs/fitgate-reference/` に抽出済み。
YOHACK 本体に統合し、LP → FitGate → プロダクトの全導線を1リポでカバーする。

## 最終形のルート構成

CLAUDE.md「LP統合計画」参照:
- `/` → LP
- `/fit` → FitGate（12問）
- `/fit/result` → 判定結果
- `/app` → ダッシュボード（現在の `/` を移動）
- `/app/v2`, `/app/plan`, `/app/settings` → プロダクト機能

## fitgate-reference の各ファイル

| ファイル | 移植先 | 備考 |
|---|---|---|
| `FitGate.tsx` | `app/fit/page.tsx` | tRPC→ローカル、wouter→Next.js |
| `FitResult.tsx` | `app/fit/result/page.tsx` | Ready→Stripe(Phase3)、Prep→レター |
| `PrepMode.tsx` | `app/fit/prep/page.tsx` | メール登録はスタブ |
| `judgment-logic.ts` | `lib/fitgate.ts` | ready/prep判定のみ。session判定は削除 |
| `products.ts` | `lib/products.ts` | Phase 2 |
| `stripe-webhook.ts` | `app/api/stripe/webhook/route.ts` | Phase 2-3 |
| `stripe-checkout-logic.ts` | `app/api/stripe/checkout/route.ts` | Phase 2-3 |
| `db-schema.ts` | 参照のみ | Supabase設計時に参照 |

## 変換パターン

- tRPC呼び出し → 削除。ローカル関数を直接呼ぶ
- `import { useLocation } from "wouter"` → `import { useRouter } from "next/navigation"`
- Manus OAuth → 削除（Phase 2 で Supabase Auth）
- react-hook-form + zod → そのまま（zod既存、react-hook-form追加）
- shadcn/ui → そのまま（テーマカラー調整のみ）
- analytics (trackEvent) → 削除

## FitGate → プロファイル変換

CLAUDE.md の対応表に従い、レンジ中央値で変換:
- "世帯年収1,500万～2,499万" → grossIncome: 2000
- "金融資産2,000万～4,999万" → assetCash: 1050 + assetInvest: 2450（30:70按分）
- 世帯構成の質問がないため solo デフォルト
