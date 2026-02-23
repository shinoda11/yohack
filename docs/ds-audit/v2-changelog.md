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

### D14: プロファイルにリアルタイムスコアウィジェット
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 3
- 概要:
  - score-widget.tsx 新規作成（スコア + 生存率の小型表示）
  - プロファイルページヘッダー右にウィジェット配置
  - 旧ステータスドット（● 最新）を置換
  - simResult 未計算時は非表示
- テスト: 252/252 pass

### D13: ステップナビゲーション + 残存FP表現修正
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 7
- 概要:
  - 「枯渇リスクあり」テキスト削除（asset-projection-chart, monte-carlo-simulator-tab）
  - 読解ガイド文を中立表現に変更
  - 「追加しましょう」→「追加する」（life-events-summary-card）
  - ダッシュボード→分岐ビルダー→世界線比較の循環導線追加
  - 各ページ下部に「次のステップ」セクション
- テスト: 252/252 pass

### D15: デシジョンツリーノードリデザイン
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 2
- 概要:
  - ノードサイズ拡大: root r=8、junction r=7、leaf r=6-7
  - ベースライン leaf = Gold fill、他 leaf = white fill + Stone stroke
  - Edge色: 確定=Night solid、不確定=Stone dashed（旧: Stone/Gold）
  - Junction pulse animation 削除（静けさ原則）
  - Empty state: 線太く + テキスト改善
  - PAD_RIGHT 120→160、ノード間スペーシング拡大
- 詳細: `docs/ds-audit/d15-investigation.md`
- テスト: 252/252 pass

### D16: 分岐ビルダー 確定⇔不確定の切り替え
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 3
- 概要:
  - BranchNode にワンクリック確実性トグルバッジ追加
  - 計画→不確定、不確定→計画のワンクリック切り替え
  - デフォルト分岐: custom override を自動生成して certainty 変更
  - カスタム分岐: updateCustomBranch で直接更新
  - confirmed（auto）分岐はトグル対象外
- テスト: 252/252 pass

### D17: 数値入力の先頭0問題
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 2
- 概要:
  - shadcn Input コンポーネントに type="number" 時の自動全選択を追加
  - profile-summary-card.tsx の raw input にも onFocus select() を追加
  - フォーカス時に既存値が全選択 → そのまま入力で上書き可能
  - 既存の onFocus ハンドラー（SliderInput, welcome-dialog）は保持
- 対象フィールド:
  - event-customize-dialog: 年齢・金額・期間（3箇所）
  - rsu-content: 株価・為替・株数・期間・付与時株価（5箇所）
  - slider-input: 全SliderInput経由の入力
  - welcome-dialog: 年齢・リタイア年齢・年収等（6箇所）
  - profile-summary-card: 家賃（1箇所）
- 既に対応済み（変更不要）:
  - CurrencyInput: type="text" + 独自 handleFocus で select() 済み
  - InlineVariable: click-to-edit で useEffect select() 済み
- テスト: 252/252 pass

### シナリオ管理 Phase 1: 削除 + 出所ラベル
- コミット: （本コミット）
- 日付: 2026-02-23
- 変更ファイル数: 4
- 概要:
  - V2ComparisonView に × 削除ボタン + 確認ダイアログ追加
  - 出所ラベル: branch-* →「分岐」、scenario-* →「保存」
  - 表示順: branch-* 優先、同カテゴリ内は新しい順
  - ScenarioComparisonCard にも同等の変更（ソート + 出所ラベル + 確認ダイアログ）
  - 「★ あなたの状態」列は削除不可（アンカー）
  - deleteScenario は store に既存（localStorage 永続化済み）
- テスト: 252/252 pass

### デッドコード一括削除
- コミット: （本コミット）
- 日付: 2026-02-23
- 削除行数: 約260行
- 概要:
  - P0: key-metrics-card.tsx, useHousingScenarios.ts, usePlan.ts ファイル削除
  - P1: lib/types.ts の RsuGrant + VestingEvent 削除、useStrategy.ts の6型を非export化
  - P2: branch-tree-viz.tsx の未使用 collectEdges 関数削除
  - P3: globals.css の未使用 .no-scrollbar 削除
- テスト: 252/252 pass

### モバイル体験監査 + Playwright テスト導入
- コミット: （本コミット）
- 日付: 2026-02-24
- 新規ファイル数: 4（playwright.config.ts, e2e/helpers.ts, e2e/screenshots.spec.ts, e2e/mobile-quality.spec.ts）
- 概要:
  - Playwright 1.58.2 で自動スクリーンショット（3デバイス × 4ページ = 12枚）
  - モバイル品質チェック: フォント10px未満・タッチ44px未満・水平オーバーフロー
  - 検出: Recharts ラベル 9px（4要素）、チェックボックス 16px（6要素）、テンプレートボタン 38px
  - 水平オーバーフロー: 全ページ 0件
  - vitest 除外設定追加（e2e ディレクトリ）
- 詳細: `docs/ds-audit/mobile-audit.md`
- テスト: vitest 252/252 pass、Playwright 36/36 pass

### モバイル P0 修正: タッチターゲット + フォントサイズ
- コミット: （本コミット）
- 日付: 2026-02-24
- 変更ファイル数: 9
- 概要:
  - Recharts イベントラベル fontSize 9→12 + 省略6文字
  - テンプレートボタン min-h-[44px] 追加
  - 確実性トグルバッジ min-h-[44px] + px-3 追加
  - 共有ボタン・世界線生成ボタン min-h-[44px] 追加
  - テキストリンク6箇所に min-h-[44px] 追加
  - ConclusionSummaryCard サブメトリクス grid-cols-1 sm:grid-cols-3
  - Switch ラベル全体を44pxタッチターゲットに
  - HoverCard 2箇所に max-w-[calc(100vw-2rem)] 追加
- Playwright タッチターゲット違反: Dashboard 13→5、Profile 4→3、Branch 13→8
- Playwright フォント違反: Dashboard 4→0
- テスト: vitest 252/252 pass、Playwright 24/24 pass

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

---

## シナリオ管理 Phase 2: 表示選択

### 概要
- 日付: 2026-02-24
- 変更ファイル数: 5（store.ts, V2ComparisonView.tsx, scenario-comparison-card.tsx, worldline/page.tsx, scenario-selector.tsx[new]）
- 概要:
  - `visibleScenarioIds` を store に追加（localStorage 永続化）
  - `toggleScenarioVisibility(id, maxVisible?)` アクション追加
  - `saveScenario` / `addScenarioBatch` / `deleteScenario` が visibleScenarioIds を自動管理
  - 既存ユーザー向けマイグレーション: `onRehydrateStorage` で全シナリオを visible に設定（最大3）
  - ScenarioSelector コンポーネント新規作成（チェックボックスで表示切替）
  - V2ComparisonView: `slice(0, 3)` → `visibleScenarioIds` フィルタに変更
  - ScenarioComparisonCard: `comparisonIds` → `visibleScenarioIds` に移行
  - モバイル制限: `matchMedia('(min-width: 640px)')` で 2列（モバイル）/ 3列（デスクトップ）
- テスト: vitest 252/252 pass

---

## モバイル P1 修正: SVG テキスト + 残存タッチターゲット

### 概要
- 日付: 2026-02-24
- 変更ファイル数: 7
- 概要:
  - branch-tree-viz.tsx: SVG fontSize 9-11 → 20-22（viewBox 720 × 0.52 スケール考慮、11px 最小保証）
  - branch-tree-viz.tsx: PAD_RIGHT 160→200 + ラベル省略（6文字+…/12文字+…）
  - branch-timeline.tsx: SVG fontSize 9-10 → 11（1:1 描画、スケール無し）
  - profile/page.tsx: リセットボタン min-h-[44px] min-w-[44px]
  - inline-variable.tsx: text-[10px] → text-[11px]（MEDIUM）
  - V2ComparisonView.tsx: text-[10px] → text-[11px]（MEDIUM）
  - scenario-selector.tsx: text-[10px] → text-[11px]
  - e2e/mobile-quality.spec.ts: 許容リスト追加（Radix Checkbox/Switch 親ラベル44px確保済み、不可視要素、Toast）
- タッチターゲット違反: 18→0（許容リスト適用後）
- フォント違反: 0→0（維持）
- テスト: vitest 252/252 pass、Playwright 12/12 pass（iPhone SE）

### 判断メモ
- branch-tree-viz の fontSize を 22 に引き上げた結果、ラベルが重なる可能性があるため省略表示を追加
- PAD_RIGHT を 160→200 に拡大して leaf ラベルの表示領域を確保
- branch-timeline は overflow-x-auto でスクロールするため viewBox スケーリングなし。fontSize 9→11 で十分
- 許容リスト: Radix Checkbox (16x16) は親 label が 44px 以上であれば実質的にタップ可能。同様に Switch (32x18) も label で対応済み
