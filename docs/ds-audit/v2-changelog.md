# デザイン監査 v2.0 — 変更履歴

監査日: 2026-02-23
初期スコア: 44/100
目標: 90/100

---

## P0: Week 1-2（44→62点目標）

### D01: 赤色完全除去 + FP表現中立化 + 分岐ビルダー色統一
- コミット: `ff83b45` + `bc1ca57`
- 日付: 2026-02-23
- 変更ファイル数: 21
- 概要:
  - CSS変数 --safe → Gold、--danger → Bronze
  - text-red / bg-red 全廃
  - 「要改善」→削除、「達成困難」→「未到達」
  - 戦略タブ「推奨戦略」→「戦略分析」
- テスト: 252/252 pass

### D02: ダッシュボード重複除去
- コミット: `c836469`
- 日付: 2026-02-23
- 変更ファイル数: 4
- 概要:
  - スコアリング 2箇所→1箇所（ConclusionSummaryCard のみ）
  - KeyMetricsCard 除去
  - ExitReadinessCard からスコアリング削除
- テスト: 252/252 pass

### D03: スコア英雄化 + カード3段階重み付け
- コミット: `9dacb3f`
- 日付: 2026-02-23
- 変更ファイル数: 3
- 概要:
  - スコア数字 fontSize 48 / fontWeight 300 / Gold
  - リング 120→160px (desktop)
  - Tier 1: Linen + shadow-md + rounded-2xl
  - Tier 2: white + shadow-sm + rounded-xl
  - Tier 3: white + border-only + rounded-lg + shadow-none
- テスト: 252/252 pass

### D04: セクション間スペーシング3段階化
- コミット: `7304956`
- 日付: 2026-02-23
- 変更ファイル数: 4
- 概要:
  - 大区切り 48px（セクション間）
  - 中区切り 24px（カード間）
  - 小区切り 16px（カード内）
  - テーブル行間 py-2→py-3
- テスト: 252/252 pass

---

## P1: Week 3-4（62→80点目標）

### D05: MetricCard 統一コンポーネント
- コミット: `5b2e8ea`
- 日付: 2026-02-23
- 変更ファイル数: 8
- 概要:
  - metric-card.tsx 新規作成（3 variant: default/emphasized/compact）
  - 5コンポーネントの「ラベル+数字」パターンを統一
- テスト: 252/252 pass

### D06: ボタン4バリアント統一
- コミット: `2539ac3`
- 日付: 2026-02-23
- 変更ファイル数: 16
- 概要:
  - Gold背景ボタン全廃 → Night (#1A1916) Primary
  - 「読み込む」→「この世界線で試す」
  - rounded-md → rounded-lg 統一
- テスト: 252/252 pass

### D07: タイポグラフィスケール厳密適用
- コミット: `a0d48c6`
- 日付: 2026-02-23
- 変更ファイル数: 9
- 概要:
  - Section Title: text-xs tracking-widest font-semibold
  - Card Title: text-sm font-semibold（SectionCard/CollapsibleCard 経由で~20カード）
  - 6段階タイポグラフィスケール確立
- テスト: 252/252 pass

### D08: 戦略タブ → What-if 変換
- コミット: `d769bb9`
- 日付: 2026-02-23
- 変更ファイル数: 7
- 概要:
  - 戦略名/強み/弱み/アドバイス全削除
  - 「スコアに影響する変数」セクション（MetricCard表示）に置換
  - タブラベル「戦略」→「変数」
  - useStrategy の FPアドバイス→中立表現
- テスト: 252/252 pass

### D09: アニメーション追加
- コミット: `bc5baf6`
- 日付: 2026-02-23
- 変更ファイル数: 6
- 概要:
  - スコアカウントアップ 800ms
  - リング transition cubic-bezier(0.16,1,0.3,1)
  - カードフェードインスタガー 50ms間隔
  - prefers-reduced-motion 対応
- テスト: 252/252 pass

### D10: 資産推移グラフ簡素化 + 0ライン追加
- コミット: `c46200e`
- 日付: 2026-02-23
- 変更ファイル数: 1（-83行/+48行）
- 概要:
  - ReferenceLine y=0（brand-bronze 破線）
  - 中央値 Gold/solid/2px、悲観 bronze/dashed/1px
  - Area fillOpacity 0.15→0.06
  - ツールチップ 5→2項目、凡例 4→2項目
- テスト: 252/252 pass

---

## バグ修正

### URGENT: 世界線比較テーブル スコア不安定
- コミット: `d954d33`
- 日付: 2026-02-23
- 変更ファイル数: 5
- 根本原因:
  1. engine.ts が Math.random() 使用 → SeededRandom + profileToSeed() に変更
  2. handleApplyTemplate がプロファイル未復元 → スナップショット＆リストア追加
  3. loadScenario が再シミュレーション → 保存スナップショット直接使用に変更
- 詳細: `docs/ds-audit/worldline-score-bug-investigation.md`
- テスト: 252/252 pass

---

## P2: Week 5-6（80→90点目標）

### D12-pre: 比較テーブルのアンカー固定
- コミット: `3133d04`
- 日付: 2026-02-23
- 変更ファイル数: 4
- 概要:
  - 「現在/ベースライン」→「★ あなたの状態」
  - ダッシュボード比較テーブル read-only化（「で試す」削除）
  - 世界線版「で試す」→「この条件でダッシュボードを編集」リンク
  - 差分基準を store.simResult に固定
- 詳細: `docs/ds-audit/d12-pre-investigation.md`
- テスト: 252/252 pass

### D12: ダッシュボード3層構造再編
- コミット: `1d17aa0`
- 日付: 2026-02-23
- 変更ファイル数: 3（-158行/+75行）
- 概要:
  - タブ（サマリー/確率分布/シナリオ）廃止
  - 3層縦スクロール: 結論→根拠→詳細(折りたたみ)
  - ExitReadinessCard を第2層（根拠）に昇格
  - 重複保存フロー削除（ScenarioComparisonCard に一本化）
- 詳細: `docs/ds-audit/d12-investigation.md`
- テスト: 252/252 pass

---

## 全コミット一覧（時系列）

| ハッシュ | タスク | メッセージ |
|---------|--------|-----------|
| `ff83b45` | D01 | style: D01 — remove red coloring + neutralize FP expressions |
| `bc1ca57` | D01 | fix: D01 complete — red/green/amber fully purged, FP expressions neutralized |
| `c836469` | D02 | refactor: D02 — remove dashboard duplication, single source of truth per metric |
| `9dacb3f` | D03 | feat: D03 — score heroization + 3-tier card hierarchy |
| `7304956` | D04 | style: D04 — 3-tier section spacing (48/24/16px) |
| `5b2e8ea` | D05 | feat: D05 — MetricCard unified component (3 variants) |
| `2539ac3` | D06 | feat: D06 — button 4-variant unification, Gold bg abolished |
| `a0d48c6` | D07 | style: D07 — typography scale strict application |
| `d769bb9` | D08 | feat: D08 — strategy tab → What-if variable display |
| `bc5baf6` | D09 | feat: D09 — score count-up 800ms + card fade-in stagger |
| `d954d33` | Bug | fix: deterministic MC simulation — seeded PRNG for stable worldline comparison |
| `c46200e` | D10 | feat: D10 — simplify asset projection chart + zero line |
| `3133d04` | D12-pre | fix: D12-pre — anchor "★ あなたの状態" + remove "で試す" buttons |
| `1d17aa0` | D12 | feat: D12 — ダッシュボード3層構造再編 |
