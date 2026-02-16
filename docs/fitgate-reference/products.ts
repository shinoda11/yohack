/**
 * Product definitions for Stripe integration
 */

export const PRODUCTS = {
  PASS_90_DAYS: {
    name: "Exit Readiness OS Pass (90日間)",
    description: "シナリオ比較、レバー操作、意思決定メモ生成機能を90日間利用可能",
    price: 29800, // JPY
    currency: "jpy",
    durationDays: 90,
    features: [
      "シナリオ比較（固定3本：Rent/Buy/Buy+Shock）",
      "レバー操作（物件価格/頭金/投資入金/ショック選択）",
      "意思決定メモ生成（3ブロック固定）",
      "Onboarding 3タスク",
    ],
  },
  SESSION: {
    name: "1on1 Decision Session",
    description: "90分の個別セッション（招待制または昇格承認者のみ）",
    price: 50000, // JPY
    currency: "jpy",
    features: [
      "90分の個別セッション",
      "世界線比較の深掘り",
      "意思決定メモの作成支援",
    ],
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
