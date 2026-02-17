# Phase B: ページ構成の移行

## 全体設計
docs/ux-architecture-v1.md を参照。

## §10 の設計判断（確定）
1. 世界線候補の自動生成 → **最大5本**。ベースライン（確定+計画のみ）は必ず含む。不確定イベントの組み合わせから候補を生成し、ユーザーが比較したい2〜3本を選ぶ。
2. カスタムイベントの入力UI → **ボトムシート**（モバイル）/ **モーダル**（デスクトップ）。ただし Phase B では「＋カスタムイベントを追加」ボタンを置くだけで、実装は Phase C で。
3. プロファイル変更時の再計算 → **保存時（debounce 500ms）**。既存の useSimulation.ts の debounce パターンを踏襲。
4. RSU → **/profile 内**（「収入」セクションの一部として配置）。
5. デスクトップの /branch ツリー → **左カラム固定**。右にイベント選択。

---

# Phase B1: ルーティング + /profile 分離

## 目的
- /v2 → /worldline のリネーム
- /plan → /branch のリネーム  
- /profile 新設（/ から入力部分を分離）
- / を軽量化（入力を外して結果だけ残す → B3 でホームに書き換え）

## Step 1: ルーティング変更

### 新規ディレクトリ作成
```
app/worldline/page.tsx   ← app/v2/page.tsx の内容をコピー
app/branch/page.tsx      ← 空のプレースホルダー（B2で実装）
app/profile/page.tsx     ← / から入力部分を移動
```

### リダイレクト設定
```
app/v2/page.tsx     → /worldline にリダイレクト
app/plan/page.tsx   → /branch にリダイレクト
app/timeline/page.tsx → /branch にリダイレクト（既存）
app/rsu/page.tsx    → /profile?tab=rsu にリダイレクト（既存）
```

リダイレクトの実装:
```tsx
// app/v2/page.tsx
import { redirect } from 'next/navigation';
export default function V2Page() { redirect('/worldline'); }
```

### ボトムナビ・サイドバーの更新
```
components/layout/bottom-nav.tsx:
  - /plan → /branch
  - /v2 → /worldline

components/layout/sidebar.tsx:
  - 「ライフプラン」/plan → 「分岐」/branch
  - 「世界線比較」/v2 → 「比較」/worldline
  - 「プロファイル」/profile を追加（設定の上）
```

## Step 2: /profile ページ作成

### app/profile/page.tsx
現在の app/page.tsx（ダッシュボード）から **入力カード群** を移動。

移動するコンポーネント:
```
components/dashboard/basic-info-card.tsx      → そのまま使用
components/dashboard/income-card.tsx          → そのまま使用
components/dashboard/asset-card.tsx           → そのまま使用
components/dashboard/housing-plan-card.tsx    → そのまま使用
components/dashboard/expense-card.tsx         → そのまま使用
components/dashboard/investment-card.tsx      → そのまま使用
components/plan/rsu-content.tsx               → RSUセクションとして統合
components/dashboard/advanced-input-panel.tsx → 「詳細設定」として配置
```

ページ構成:
```tsx
'use client'

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold" style={{ color: '#1A1916' }}>
          プロファイル
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          あなたの現在の状況を設定します。ここが全てのシミュレーションの前提になります。
        </p>
      </header>

      {/* セクション単位のアコーディオン */}
      {/* 各カードは既存コンポーネントをそのまま使う */}
      <BasicInfoCard />
      <IncomeCard />
      <AssetCard />
      <HousingPlanCard />
      <ExpenseCard />
      <InvestmentCard />

      {/* RSU（アコーディオンの中に） */}
      <Collapsible title="RSU・ストックオプション">
        <RSUContent />
      </Collapsible>

      {/* 詳細設定 */}
      <Collapsible title="詳細設定">
        <AdvancedInputPanel />
      </Collapsible>
    </div>
  )
}
```

### app/page.tsx の軽量化
入力カードを外して、結果表示のみ残す。
B3 でホーム画面に書き換えるが、B1 では「入力が /profile に移動したことを示すリンク」を置くだけ。

```tsx
// 暫定: B3 でホーム画面に全面書き換え
export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* プロファイルへの導線 */}
      <Link href="/profile" className="...">
        プロファイルを編集 →
      </Link>

      {/* 結果カード群（既存を維持） */}
      <ExitReadinessCard />
      <KeyMetricsCard />
      <CashFlowCard />
      <AssetProjectionChart />
      <ConclusionSummaryCard />
      <NextBestActionsCard />
    </div>
  )
}
```

## Step 3: テスト
```bash
pnpm build
pnpm test
```

確認項目:
```
[ ] /profile が表示される
[ ] /profile で入力値を変更するとシミュレーションが再実行される
[ ] / から入力カードが消えて結果だけ表示される
[ ] / に「プロファイルを編集」リンクがある
[ ] /v2 が /worldline にリダイレクトされる
[ ] /plan が /branch にリダイレクトされる
[ ] /worldline が正常に表示される（旧 /v2 と同じ）
[ ] /branch がプレースホルダーとして表示される
[ ] ボトムナビのリンク先が更新されている
[ ] サイドバーのリンク先が更新されている
[ ] ボトムナビで /branch がアクティブになる
```

## 注意事項
- lib/store.ts は変更しない
- lib/engine.ts は変更しない
- 既存のコンポーネントのファイル名・パスは変えない（移動ではなく import パスの変更のみ）
- /branch の中身は B2 で実装する。B1 ではプレースホルダー:
  ```tsx
  export default function BranchPage() {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1>分岐ビルダー</h1>
        <p>Phase B2 で実装予定</p>
      </div>
    )
  }
  ```

---

# Phase B2: /branch 分岐ビルダー

## 前提
- B1 完了後に実施
- プロトタイプ: /mnt/user-data/outputs/yohack-lifeplan-concept.jsx の Screen 2 がベース

## 新規ファイル構成
```
app/branch/page.tsx                      ← メインページ
components/branch/branch-tree-viz.tsx     ← SVGツリー可視化
components/branch/branch-category.tsx    ← カテゴリ（確定/計画/不確定）
components/branch/branch-node.tsx        ← 個別の分岐ノード
components/branch/worldline-preview.tsx  ← 世界線候補プレビュー
lib/branch.ts                           ← 分岐 → 世界線変換ロジック
```

## lib/branch.ts — 分岐データモデル

```typescript
// 分岐の確実性レベル
export type BranchCertainty = 'confirmed' | 'planned' | 'uncertain';

// 分岐の定義
export interface Branch {
  id: string;
  label: string;
  detail: string;
  certainty: BranchCertainty;
  age?: number;          // 発生年齢
  auto?: boolean;        // 自動追加（確定イベント）
  // エンジンとの接続
  eventType: string;     // lib/v2/events.ts の LifeEventType に対応
  eventParams: Record<string, unknown>;  // イベントのパラメータ
}

// デフォルト分岐カテゴリ
export const DEFAULT_BRANCHES: Branch[] = [
  // 確定
  { id: 'age', label: '年齢を重ねる', detail: '{currentAge}歳 → 100歳', certainty: 'confirmed', auto: true, eventType: '_auto', eventParams: {} },
  { id: 'pension', label: '年金受給', detail: '65歳から', certainty: 'confirmed', auto: true, eventType: '_auto', eventParams: {} },

  // 計画
  { id: 'housing_purchase', label: '住宅購入', detail: '', certainty: 'planned', eventType: 'housing_purchase', eventParams: { propertyPrice: 8500, downPayment: 1500, loanYears: 35, interestRate: 0.5 } },
  { id: 'child_1', label: '第一子', detail: '', certainty: 'planned', eventType: 'child', eventParams: { childNumber: 1 } },
  { id: 'child_2', label: '第二子', detail: '', certainty: 'planned', eventType: 'child', eventParams: { childNumber: 2 } },
  { id: 'career_change', label: '転職（確定）', detail: '', certainty: 'planned', eventType: 'income_change', eventParams: { changePercent: 0 } },

  // 不確定
  { id: 'income_down_20', label: '年収ダウン -20%', detail: '', certainty: 'uncertain', eventType: 'income_change', eventParams: { changePercent: -20 } },
  { id: 'income_down_30', label: '年収ダウン -30%', detail: '', certainty: 'uncertain', eventType: 'income_change', eventParams: { changePercent: -30 } },
  { id: 'expat', label: '海外駐在', detail: '', certainty: 'uncertain', eventType: 'income_change', eventParams: { changePercent: 30, duration: 2 } },
  { id: 'pacedown', label: 'ペースダウン', detail: '', certainty: 'uncertain', eventType: 'income_change', eventParams: { changePercent: -50 } },
  { id: 'partner_quit', label: 'パートナー退職', detail: '', certainty: 'uncertain', eventType: 'partner_income_change', eventParams: { newIncome: 0 } },
  { id: 'partner_return', label: 'パートナー復帰', detail: '', certainty: 'uncertain', eventType: 'partner_income_change', eventParams: {} },
];

// 選択された分岐から世界線候補を生成
export function generateWorldlineCandidates(
  selectedBranches: Branch[],
  maxCandidates: number = 5
): WorldlineCandidate[] {
  const confirmed = selectedBranches.filter(b => b.certainty === 'confirmed');
  const planned = selectedBranches.filter(b => b.certainty === 'planned');
  const uncertain = selectedBranches.filter(b => b.certainty === 'uncertain');

  const candidates: WorldlineCandidate[] = [];

  // WL1: ベースライン（確定 + 計画のみ）
  candidates.push({
    id: 'baseline',
    label: '現状維持',
    desc: '計画通りに進んだ場合',
    branches: [...confirmed, ...planned],
    color: '#4A7C59',
  });

  // 不確定イベントを1つずつ追加した候補
  for (const ub of uncertain) {
    if (candidates.length >= maxCandidates) break;
    candidates.push({
      id: `with-${ub.id}`,
      label: `${ub.label}した場合`,
      desc: `ベースライン + ${ub.label}`,
      branches: [...confirmed, ...planned, ub],
      color: '#4A6FA5',
    });
  }

  // 不確定イベントを2つ組み合わせた候補（残り枠があれば）
  if (uncertain.length >= 2 && candidates.length < maxCandidates) {
    candidates.push({
      id: `worst-case`,
      label: '複合リスク',
      desc: uncertain.map(u => u.label).join(' + '),
      branches: [...confirmed, ...planned, ...uncertain],
      color: '#8A7A62',
    });
  }

  return candidates;
}

export interface WorldlineCandidate {
  id: string;
  label: string;
  desc: string;
  branches: Branch[];
  color: string;
  score?: number;  // エンジン実行後に付与
}
```

## app/branch/page.tsx — メインページ

3ステップのフロー:
1. 分岐の選択（BranchCategory × 3）
2. 世界線候補のプレビュー（WorldlinePreview）
3. 比較する世界線を選んで /worldline へ

```
ステップ1: 分岐の選択
┌─────────────────────────────────┐
│ ← 戻る                          │
│ あなたの分岐を選ぶ                │
│                                 │
│ ┌─── ツリー可視化 SVG ────┐     │
│ │                          │     │
│ └──────────────────────────┘     │
│                                 │
│ ◆ 確定している未来               │
│   ✓ 年齢を重ねる (自動)          │
│   ✓ 年金受給 (自動)             │
│                                 │
│ ● 計画している未来               │
│   □ 住宅購入                    │
│   □ 第一子                      │
│                                 │
│ ◌ 不確定な未来                   │
│   □ 年収ダウン -20%             │
│   □ 海外駐在                    │
│   □ ペースダウン                 │
│   [+ カスタムイベントを追加]      │
│                                 │
│ ┌─────────────────────────┐     │
│ │ 世界線を生成する（N個の分岐）│     │
│ └─────────────────────────┘     │
└─────────────────────────────────┘

ステップ2: 世界線候補
┌─────────────────────────────────┐
│ ← 分岐を編集                    │
│ N つの世界線                     │
│                                 │
│ ┌─── ツリー + スコア可視化 ──┐  │
│ └──────────────────────────────┘│
│                                 │
│ □ 現状維持         78点         │
│ □ 転職したら       62点  -16    │
│ □ 駐在→ペースダウン 71点  -7    │
│                                 │
│ ┌──── 発見カード ──────────┐    │
│ │ 「転職」が最もスコアに影響   │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ 選んだ世界線を比較する      │     │
│ └─────────────────────────┘     │
└─────────────────────────────────┘
```

### エンジンとの接続
分岐の選択 → 世界線候補の生成 → 各候補でエンジン実行:

```typescript
// 1. 選択された分岐を lib/v2/events.ts のイベントに変換
// Branch.eventType と Branch.eventParams を使って LifeEvent を生成

// 2. 各世界線候補について、profile + events でエンジン実行
// lib/v2/adapter.ts の buildScenarioInput() を使用

// 3. スコアを計算
// engine.ts の runMonteCarloSimulation() を実行

// 4. 結果を store.ts の scenarios に保存
```

### ストアとの接続
lib/store.ts に以下を追加:
```typescript
// 選択中の分岐 ID リスト
selectedBranchIds: string[];
setSelectedBranchIds: (ids: string[]) => void;

// カスタム分岐（ユーザーが追加したもの）
customBranches: Branch[];
addCustomBranch: (branch: Branch) => void;
removeCustomBranch: (id: string) => void;
```

localStorage で永続化する（既存の persist パターンに従う）。

### デスクトップレイアウト
```
┌──────────────────────────────────────┐
│ 左カラム（固定）   │ 右カラム（スクロール） │
│                    │                      │
│ ツリー可視化 SVG   │ ◆ 確定している未来     │
│                    │ ● 計画している未来     │
│ スコアサマリー      │ ◌ 不確定な未来        │
│                    │                      │
│                    │ [世界線を生成する]     │
└──────────────────────────────────────┘
```

```tsx
<div className="flex flex-col md:flex-row md:gap-8">
  {/* ツリー - モバイルでは上部、デスクトップでは左固定 */}
  <div className="md:w-80 md:sticky md:top-20 md:self-start">
    <BranchTreeViz ... />
  </div>
  {/* カテゴリ - モバイルでは下、デスクトップでは右 */}
  <div className="flex-1">
    <BranchCategory ... />
  </div>
</div>
```

## コンポーネント仕様

### components/branch/branch-tree-viz.tsx
- プロトタイプの BranchTreeViz をそのまま production 化
- SVG ベース、レスポンシブ（viewBox 使用）
- 確定 = 実線 #1A1916、計画 = 実線 #4A7C59、不確定 = 点線 #8A7A62
- 分岐点 = ゴールドの circle #C8B89A + pulse アニメーション
- 選択状態で枝が生える / 消えるアニメーション（300ms transition）

### components/branch/branch-node.tsx
- プロトタイプの BranchNode をそのまま production 化
- タッチターゲット 44px 以上
- 選択 / 非選択の toggle
- auto=true のノードは操作不可（グレー表示）

### components/branch/branch-category.tsx
- カテゴリヘッダー（アイコン + ラベル + 説明）
- BranchNode のリスト
- 「不確定」カテゴリの末尾に「+ カスタムイベントを追加」ボタン

### components/branch/worldline-preview.tsx
- 世界線候補カード（チェックボックス + ラベル + スコア + diff）
- 発見カード（最もスコア差が大きい分岐を自動検出）
- 「選んだ世界線を比較する」ボタン → /worldline に遷移

## 注意事項
- 分岐ノードの「詳細設定」（物件価格、年収変動率など）は Phase C で実装。B2 では DEFAULT_BRANCHES のデフォルトパラメータを使用。
- 「+ カスタムイベントを追加」ボタンは B2 では disabled にしておく。
- 世界線候補のスコアは実際にエンジンを実行して算出する。ダミーデータは使わない。

---

# Phase B3: / ホーム画面 + /worldline 整理

## 前提
- B1, B2 完了後に実施

## app/page.tsx — ホーム画面

全面書き換え。「分岐ツリーの俯瞰 + 世界線サマリー」画面にする。

### 3つの状態

**状態1: 初回訪問（プロファイル未設定）**
```
┌─────────────────────────────────┐
│        Y                        │
│   人生の分岐を、描いてみる。      │
│                                 │
│   ┌── 簡単なツリーイラスト ──┐   │
│   └──────────────────────────┘   │
│                                 │
│   確定している未来と、           │
│   不確定な未来。                 │
│   その組み合わせが              │
│   「世界線」になります。         │
│                                 │
│   [はじめる]                    │
│   → /profile（プロファイル設定）  │
└─────────────────────────────────┘
```

**状態2: プロファイル設定済み・分岐未選択**
```
┌─────────────────────────────────┐
│ あなたの世界線                    │
│                                 │
│ ┌── 幹だけのツリー ──────┐      │
│ │  ●今 → → → (枝なし)    │      │
│ └──────────────────────────┘     │
│                                 │
│ まだ分岐がありません。            │
│ 最初の分岐を描いてみましょう。     │
│                                 │
│ [分岐を描きはじめる]              │
│ → /branch                       │
└─────────────────────────────────┘
```

**状態3: 世界線あり（メイン状態）**
```
┌─────────────────────────────────┐
│ あなたの世界線                    │
│                                 │
│ ┌── ツリー（幹 + 枝） ──────┐   │
│ │  分岐点にゴールドノード      │   │
│ │  各枝にスコアミニバッジ      │   │
│ └──────────────────────────────┘  │
│                                 │
│ ┌ 世界線サマリー ───────────┐    │
│ │ 現状維持    78  ████████░░│    │
│ │ 転職したら  62  ██████░░░░│    │
│ │ 駐在→PD    71  ███████░░░│    │
│ └───────────────────────────┘    │
│                                 │
│ ┌ 発見 ────────────────────┐    │
│ │ Y 「転職」が余白に最も影響  │    │
│ └───────────────────────────┘    │
│                                 │
│ [分岐を追加・変更] [詳細を比較]   │
└─────────────────────────────────┘
```

### 判定ロジック
```typescript
// store.ts から取得
const { profile, scenarios } = useStore();

const hasProfile = profile.currentAge > 0 && profile.grossIncome > 0;
const hasWorldlines = scenarios.length > 0;

if (!hasProfile) → 状態1（初回）
else if (!hasWorldlines) → 状態2（分岐未選択）
else → 状態3（メイン）
```

## app/worldline/page.tsx — 整理

旧 /v2 の内容をそのまま使用。以下のみ変更:

1. ページタイトルを「世界線比較」→「比較」に
2. 「分岐を変更する」リンクを追加（→ /branch）
3. パンくず: ホーム > 比較
4. 空状態（シナリオ0件）: 「まず分岐を描いてください」→ /branch へ導線

## ボトムナビの active 判定更新
```
/ → ホーム がアクティブ
/profile → ホーム がアクティブ（設定系なので）
/branch → 分岐 がアクティブ
/worldline → 比較 がアクティブ
/settings → 設定 がアクティブ
/pricing → 設定 がアクティブ
```

## 不要コンポーネントの削除
B3 完了後、以下が不要になる可能性がある。ただし **他から import されていないことを確認してから** 削除:
```
components/dashboard/life-events-card.tsx
components/dashboard/life-events-summary-card.tsx
components/dashboard/housing-multi-scenario-card.tsx
components/dashboard/scenario-comparison-card.tsx
components/plan/timeline-content.tsx
```

## テスト
```bash
pnpm build
pnpm test
```

確認項目:
```
[ ] / が3つの状態で正しく表示される
[ ] / のツリーが分岐の状態を反映している
[ ] / の世界線サマリーがスコアを表示している
[ ] / の「分岐を追加」が /branch に遷移する
[ ] / の「詳細を比較」が /worldline に遷移する
[ ] /worldline が正常に動作する（旧 /v2 と同等）
[ ] /worldline の「分岐を変更」が /branch に遷移する
[ ] ボトムナビのアクティブ状態が各ページで正しい
[ ] 全ページでモバイル横揺れが発生しない
```
