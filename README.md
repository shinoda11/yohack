# YOHACK

住宅購入の意思決定を「世界線比較」で支援するシミュレーター。

モンテカルロシミュレーション（1,000回、100歳まで）で住宅・キャリア・家族の選択肢を並走比較する。
物件も保険も投資商品も売らない。利益相反ゼロを構造的に担保する設計。

## 対象ユーザー

- 世帯年収 1,000〜3,000万円の DINKs / プレDINKs
- 都市部在住、28〜42歳
- 7,000〜10,000万円クラスの住宅購入を検討中

## 技術スタック

- Next.js 16 + React 19 + TypeScript 5.9
- Zustand 5（状態管理）
- shadcn/ui + Tailwind CSS 4.1
- Recharts（グラフ）
- Vercel（デプロイ）
- vitest（252テスト）

## 開発

```bash
pnpm install
pnpm dev        # 開発サーバー
pnpm build      # ビルド
pnpm test       # テスト実行（252本）
pnpm lint       # ESLint
```

## 構成

| パス | 用途 |
|------|------|
| `/lp` | ランディングページ |
| `/fit` | FitGate（適合診断12問） |
| `/app` | メインダッシュボード（Basic認証） |
| `/app/branch` | 分岐ビルダー |
| `/app/worldline` | 世界線比較 |
| `/app/profile` | プロファイル入力 |

詳細は [CLAUDE.md](./CLAUDE.md) を参照。
