# 世界線比較テーブル スコア不安定バグ — 調査と修正

## 症状
- 世界線比較ページの「現在」カラムの数値がタブ切り替えやページ遷移で大幅に変動
- 同じ条件（プロファイル未変更）にもかかわらず、安心ライン到達年齢・60歳資産・月次CFなどが変化

## 根本原因（3つ）

### 1. モンテカルロエンジンの非決定性
`lib/engine.ts` の `randomNormal()` が `Math.random()` を使用していた。
1,000回のMC実行は毎回異なる乱数列を使うため、同じプロファイルでも実行ごとに異なる結果を返す。

- `paths.yearlyData` は中央値パスだが、サンプルの違いで数百万円単位の差が出る
- `metrics.fireAge` も中央値パス基準のため、±1〜3歳の変動が発生
- `score.overall` は上記の変動を重み付け合算するため、±5〜15ptの変動が発生

### 2. `handleApplyTemplate` がプロファイルを復元しない
`app/app/worldline/page.tsx` の `handleApplyTemplate` が:
1. `updateProfile(variantChanges)` で現在のプロファイルをバリアントに書き換え
2. シナリオ保存後、元のプロファイルに戻さない
3. 結果: 「現在」カラムがバリアントの結果を表示してしまう

### 3. `loadScenario` が不要な再シミュレーションを実行
`lib/store.ts` の `loadScenario` が:
1. `simResult: scenario.result` で保存済みスナップショットを設定
2. 直後に `triggerSimulation()` を呼び出し
3. 150ms後に新しい（異なる乱数の）シミュレーションで上書き
4. 結果: シナリオの保存済み結果と「現在」の表示が不一致

## 修正内容

### Fix 1: シード付きPRNG導入 (`lib/engine.ts`)
- `SeededRandom` クラスを追加（`housing-sim.ts` と同じLCGアルゴリズム）
- `profileToSeed(profile)` でプロファイルのJSON文字列からDJB2ハッシュを生成
- 各MC実行は `baseSeed + runIndex` でシードされた独自のRNGを使用
- `runSimulation(profile, { seed?: number })` で外部からのシード指定も可能（テスト用）
- **効果**: 同じプロファイル → 同じシード → 同じ結果（完全決定的）

### Fix 2: プロファイル復元 (`app/app/worldline/page.tsx`)
- `handleApplyTemplate` でバリアント適用前にオリジナルプロファイルをスナップショット
- シナリオ保存後にオリジナルプロファイルを復元
- **効果**: テンプレート適用後も「現在」ベースラインが安定

### Fix 3: 不要な再シミュレーション削除 (`lib/store.ts`)
- `loadScenario` から `triggerSimulation()` を削除
- 代わりに `lastSimVersion = newVersion` を設定してキャッシュを有効化
- **効果**: シナリオ読み込み時に保存済み結果をそのまま使用（再計算なし）

## テスト結果
- `pnpm build`: OK
- `pnpm test`: 252/252 pass
- `engine.test.ts` のシード固定テスト: `Math.random` モック → `{ seed }` オプションに移行

## 影響範囲
- `lib/engine.ts`: SeededRandom追加、runSimulation/runSingleSimulation署名変更
- `lib/store.ts`: loadScenarioから再シミュレーション削除
- `app/app/worldline/page.tsx`: handleApplyTemplateにプロファイル復元追加
- `lib/__tests__/engine.test.ts`: シードテスト手法の更新
