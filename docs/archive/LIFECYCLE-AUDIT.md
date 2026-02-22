# LIFECYCLE-AUDIT: ダッシュボード lifeEvents と分岐ビルダーの関係

## 1. ダッシュボード側

### 1.1 LifeEvent 型定義 (`lib/types.ts` L12-47)

```typescript
export type LifeEventType =
  | 'income_increase' | 'income_decrease'
  | 'expense_increase' | 'expense_decrease'
  | 'asset_gain' | 'asset_purchase'
  | 'housing_purchase' | 'child_birth' | 'education'
  | 'retirement_partial' | 'rental_income';

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  name: string;
  age: number;
  amount: number;            // 万円
  duration?: number;         // 年
  isRecurring: boolean;
  target?: 'self' | 'partner';
  bundleId?: string;
  purchaseDetails?: HousingPurchaseDetails;
}
```

`Profile.lifeEvents: LifeEvent[]` — デフォルトは空配列 `[]`。

### 1.2 profile.lifeEvents を読み書きするコンポーネント

| ファイル | 読み/書き | 内容 |
|---------|----------|------|
| `components/dashboard/life-events-summary-card.tsx` | 読み | イベント数・名前・年齢・年間影響額を表示 |
| `components/dashboard/asset-projection-chart.tsx` | 読み | チャート上の `<ReferenceLine>` マーカー |
| `components/dashboard/housing-plan-card.tsx` | 読み | 収入/支出の調整額計算 |
| `app/app/page.tsx` | 読み | AssetProjectionChart に props で渡す |
| `lib/branch.ts` (`buildProfileForCandidate`) | 書き | ブランチ由来の LifeEvent[] をマージして一時プロファイルを作成 |
| `lib/store.ts` (`loadScenario`) | 書き | シナリオの profile でまるごと上書き |

**注意:** lifeEvents を直接追加/削除する専用アクションは store に存在しない。唯一の更新パスは `updateProfile({ lifeEvents: [...] })`。

### 1.3 engine.ts が lifeEvents を消費する箇所

| 関数 | 行 | 処理内容 |
|------|---|---------|
| `calculateAverageGrossIncome()` | L230-271 | income_increase/decrease を年齢範囲で適用し年金計算用の平均年収を算出 |
| `calculateAnnualPension()` | L297-319 | 上記を self/partner 別に呼び出し年金額を計算 |
| `calculateIncomeAdjustment()` | L333-343 | 各年の収入調整額を合計（income_increase/decrease/rental_income） |
| `calculateRentalIncome()` | L353-361 | rental_income イベントの合計 |
| `calculateExpenses()` | L405-447 | expense_increase/decrease をインフレ調整して年間支出に加算/減算 |
| `runSingleSimulation()` | L483-517 | housing_purchase: 頭金+諸費用を資産から差引、ローン返済を設定（1回限り） |
| `runSingleSimulation()` | L543-547 | asset_gain: 指定年齢で資産に一括加算 |

**エンジンが無視する型:** `child_birth`, `education`, `asset_purchase`, `retirement_partial`（ロジック未実装）。

---

## 2. 分岐ビルダー側

### 2.1 createDefaultBranches() が生成するイベント

| id | ラベル | certainty | eventType | 条件 |
|----|--------|-----------|-----------|------|
| `age` | 年齢を重ねる | confirmed | `_auto` | 常に |
| `pension` | 年金受給 | confirmed | `_auto` | 常に |
| `housing_purchase` | 住宅購入 | planned | `housing_purchase` | homeStatus === 'renter' |
| `child_1` | 第一子 | planned | `child` | mode === 'couple' |
| `child_2` | 第二子 | planned | `child` | mode === 'couple' |
| `income_down_20` | 年収ダウン -20% | uncertain | `income_change` | 常に |
| `pacedown` | ペースダウン -50% | uncertain | `income_change` | 常に |
| `expat` | 海外駐在 +30% | uncertain | `income_change` | 常に |
| `partner_quit` | パートナー退職 | uncertain | `partner_income_change` | mode === 'couple' |

### 2.2 customBranches の構造

Phase F で追加したプリセット/バンドル由来のブランチ:

```typescript
// デフォルトブランチ
{ id: 'housing_purchase', eventType: 'housing_purchase', eventParams: {...}, directEvents: undefined }

// カスタムブランチ（プリセット/バンドル由来）
{ id: 'preset-wedding-1739...', eventType: '_direct', eventParams: {}, directEvents: LifeEvent[], presetId: 'wedding' }
```

**違い:**
- デフォルト: `branchToLifeEvents()` の switch で変換
- カスタム: `directEvents` を直接使用（switch をバイパス）

### 2.3 branchToLifeEvents() の変換ロジック

| eventType | → LifeEvent[] |
|-----------|--------------|
| `_auto` | `[]`（概念的ブランチ、イベントなし） |
| `_direct` | `branch.directEvents` をそのまま返す |
| `housing_purchase` | `[{type: 'housing_purchase', purchaseDetails: {...}}]` 1件 |
| `child` | `[{type: 'expense_increase', name: '育児費', duration: 6}, {type: 'expense_increase', name: '教育費', duration: 16}]` 2件 |
| `income_change` | `[{type: 'income_increase' or 'income_decrease'}]` 1件 |
| `partner_income_change` | `[{type: 'income_decrease', target: 'partner'}]` 1件 |
| その他 | `[]` |

### 2.4 「世界線を生成する」ボタンのデータフロー

```
1. selectedBranches (Branch[])
   ↓
2. generateWorldlineCandidates(selectedBranches) → WorldlineCandidate[] (最大5本)
   - ベースライン = confirmed + planned
   - 各 uncertain を1本ずつ追加したバリアント
   - 全 uncertain を含むワーストケース
   ↓
3. handleGenerate() — 各候補に対して:
   a. buildProfileForCandidate(profile, candidate)
      - allEvents = [...profile.lifeEvents]  ← 既存イベントを保持
      - 各ブランチの branchToLifeEvents() 結果を allEvents に push
      - return { ...profile, lifeEvents: allEvents }
   b. runSimulation(modifiedProfile) → スコア算出
   ↓
4. プレビュー画面に候補を表示
   ↓
5. handleCompare() — 選択した候補を SavedScenario に変換:
   - id: `branch-${c.id}-${timestamp}`
   - profile: buildProfileForCandidate(profile, candidate)  ← Profile のスナップショット
   - result: シミュレーション結果
   ↓
6. addScenarioBatch(scenarios)
   - 既存の branch- シナリオを全削除
   - 新シナリオを追加
   - localStorage に保存
   - /app/worldline に遷移
```

---

## 3. 重複・競合の分析

### 3.1 同じ概念の二重存在

| 概念 | ダッシュボード側 | 分岐ビルダー側 | 状態 |
|------|---------------|--------------|------|
| 住宅購入 | `profile.homeStatus` + 住宅ローンフィールド群 | `housing_purchase` ブランチ → LifeEvent | **潜在的重複** |
| 子ども | なし（ダッシュボードに子ども入力なし） | `child` ブランチ → expense_increase ×2 | 分岐のみ |
| 転職・年収変動 | なし | `income_change` ブランチ | 分岐のみ |
| パートナー退職 | なし | `partner_income_change` ブランチ | 分岐のみ |

### 3.2 住宅購入の重複リスク（最大の問題点）

ダッシュボードの HousingPlanCard は `profile.homeStatus`, `profile.homeMarketValue`, `profile.mortgagePrincipal` 等を読む。分岐ビルダーの `housing_purchase` ブランチは `LifeEvent { type: 'housing_purchase', purchaseDetails: {...} }` を生成する。

**engine.ts の処理:**
- L461: `profile.homeStatus` を参照して住宅関連の初期設定を行う
- L483-517: `profile.lifeEvents` の `housing_purchase` イベントを処理（`purchaseOccurred` フラグで1回限り）

**現状:** ダッシュボードで `homeStatus: 'renter'` の場合、分岐ビルダーで `housing_purchase` ブランチを選択すると、シナリオの profile に `housing_purchase` LifeEvent が追加される。エンジンは LifeEvent 側の `purchaseDetails` を使ってローンを設定する。`homeStatus` 自体は 'renter' のまま。

→ **二重処理はない**（`purchaseOccurred` フラグで防止）が、**概念的に2箇所に住宅情報が分散**している。

### 3.3 片方を変更したとき他方に反映されるか

**されない。** 完全に独立。

- ダッシュボードで `profile.grossIncome` を変更 → 分岐ビルダーの `createDefaultBranches()` は次回レンダリング時に再計算されるが、**既に保存されたシナリオの lifeEvents には反映されない**。
- 分岐ビルダーで世界線を生成 → ダッシュボードの `profile.lifeEvents` は**変更されない**（シナリオとして別に保存される）。

### 3.4 engine.ts に渡されるときのマージ/上書き

**マージ。** `buildProfileForCandidate()` は:
```typescript
const allEvents = [...profile.lifeEvents];  // 既存を保持
// ブランチ由来のイベントを追加
allEvents.push(...branchEvents);
return { ...profile, lifeEvents: allEvents };
```

ただし `loadScenario()` は**完全上書き**:
```typescript
set({ profile: { ...scenario.profile } });  // シナリオの profile で全置換
```

### 3.5 二重カウントのリスク

| シナリオ | リスク |
|---------|--------|
| ユーザーが手動で lifeEvents を追加（現在UIなし） → 分岐ビルダーで同じイベントを追加 | **高**（buildProfileForCandidate がマージするため二重カウント） |
| 分岐ビルダーで世界線生成 → loadScenario → 再度分岐ビルダーで生成 | **なし**（addScenarioBatch が古い branch- シナリオを削除する） |
| ダッシュボードの住宅入力 + 分岐ビルダーの housing_purchase | **低**（purchaseOccurred フラグで防止。ただし概念が分散） |

---

## 4. 発見事項まとめ

### 正常に動作している点
1. `buildProfileForCandidate()` のマージロジックは正しい
2. `addScenarioBatch()` の古いシナリオ削除は正しい
3. `purchaseOccurred` フラグで住宅購入の二重処理を防止
4. 分岐ビルダーはダッシュボードの profile を読み取るが直接変更しない

### 注意が必要な点

1. **loadScenario() は破壊的操作**: シナリオをロードすると現在の profile.lifeEvents が完全に上書きされる。ユーザーが手動で追加したイベントは失われる（現在は手動追加UIがないため実害なし）。

2. **シナリオは生成時のスナップショット**: 生成後に profile を変更しても、保存済みシナリオの lifeEvents は更新されない。古いシナリオを比較に使うと、現在の profile と不整合になる可能性がある。

3. **住宅情報の分散**: `profile.homeStatus`/`homeMarketValue`/`mortgagePrincipal` と `LifeEvent { type: 'housing_purchase' }` に住宅情報が分散。同期メカニズムなし。

4. **エンジンが無視する型がある**: `child_birth`, `education`, `asset_purchase`, `retirement_partial` はエンジンにロジックがない。分岐ビルダーの `child` ブランチは `expense_increase` に変換して回避している。

5. **ダッシュボードに lifeEvents 直接編集UIがない**: `life-events-summary-card.tsx` は表示のみで `/app/branch` へのリンクを提供。将来直接編集UIを追加する場合、二重カウント防止の設計が必要。

---

## 5. データフロー図

```
┌──────────────────────────────────────────────────────────────┐
│ ダッシュボード (/app)                                         │
│                                                              │
│  profile.lifeEvents ←──────── 表示のみ                       │
│        │                    (life-events-summary-card)        │
│        │                    (asset-projection-chart)          │
│        │                    (housing-plan-card)               │
│        ▼                                                     │
│  engine.ts → simResult → 結果表示                             │
└──────────────────────────────────────────────────────────────┘
        │ profile（読み取り）
        ▼
┌──────────────────────────────────────────────────────────────┐
│ 分岐ビルダー (/app/branch)                                    │
│                                                              │
│  createDefaultBranches(profile) → Branch[]                   │
│  customBranches (store) → Branch[]                           │
│        │ 選択                                                │
│        ▼                                                     │
│  generateWorldlineCandidates(selectedBranches)               │
│        │                                                     │
│        ▼                                                     │
│  buildProfileForCandidate(profile, candidate)                │
│    = { ...profile, lifeEvents: [...profile.lifeEvents,       │
│                                 ...branchDerivedEvents] }    │
│        │                                                     │
│        ▼                                                     │
│  runSimulation(modifiedProfile) → score                      │
│        │                                                     │
│        ▼                                                     │
│  SavedScenario { profile: modifiedProfile, result }          │
│        │                                                     │
│        ▼                                                     │
│  addScenarioBatch() → store.scenarios[]                      │
└──────────────────────────────────────────────────────────────┘
        │ loadScenario(id)
        ▼
┌──────────────────────────────────────────────────────────────┐
│ store.ts                                                     │
│                                                              │
│  profile = scenario.profile  ← 完全上書き（破壊的）            │
│  simResult = scenario.result                                 │
└──────────────────────────────────────────────────────────────┘
```
