# D08 Investigation: 戦略タブ → What-if 変換

## 現状の戦略タブ構成

### 表示箇所
- `app/app/worldline/page.tsx` — 3タブ構成の「戦略」タブ
- `components/v2/V2ResultSection.tsx` — `renderMode === 'strategy'` セクション (lines 257-373)
- `hooks/useStrategy.ts` — 戦略データ生成ロジック

### 現在表示されている内容

#### Card 1: 「戦略分析: {戦略名}」
- **戦略名**: 積極成長戦略 / バランス戦略 / 安定優先戦略 / 立て直し戦略
- **Description**: 「まずは基盤を固め、リスクを抑えながら確実性を高めます」等
- **信頼度バッジ**: 「信頼度 XX%」
- **Expected Outcomes（3 metric boxes）**:
  - 予測スコア改善: +XX
  - 安心ラインまで: XX年
  - リスク変化: ±XX%
- **スコアに影響する変数**（実態はFPアドバイス）:
  - 「生活防衛資金の積み増し」
  - 「固定費の削減」
  - 「安定資産の比率増加」
  - 「投資比率の引き上げ」
  - 「成長株への傾斜」
  - 「RSUの戦略的保有」
  - 「分散投資の維持」
  - 「定期的なリバランス」
  - 「緊急の支出見直し」
  - 「収入増加の模索」
  - 「FIRE目標年齢の見直し」
- **前提条件**: 「市場が平均的に推移」「収入が維持される」等

#### Card 2: 「戦略的インサイト」（SWOT分析）
- 強み: 「高い生存確率」「健全なキャッシュフロー」
- 弱み: 「流動性リスク」「高いリスク露出」
- 機会: 「時間の優位性」「RSU収入の活用」
- 脅威: 「インフレリスク」

### FP アドバイス表現（違反箇所）
1. requiredActions 全文 — 「積み増し」「削減」「比率増加」等は完全にFPアドバイス
2. 戦略名 — 「安定優先戦略」「積極成長戦略」等は推奨を含意
3. description — 「〜を目指します」は推奨表現
4. strategicInsights — 「緊急時の資金確保に課題があります」は評価的表現
5. MoneyMarginCard — 「収支バランスの見直しが有効です」(line 145)

## 変更計画

### 削除するもの
- 戦略名（積極成長/バランス/安定優先/立て直し）
- Expected Outcomes メトリクスボックス
- requiredActions リスト
- assumptions リスト
- 戦略的インサイト（SWOT）カード全体
- 信頼度バッジ

### 追加するもの
- 「スコアに影響する変数」セクション
- profile から取得した現在値を MetricCard で表示
- ダッシュボードへの導線テキスト

### Profile フィールドマッピング
| 変数 | フィールド | 表示 |
|------|-----------|------|
| 世帯年収 | grossIncome + partnerGrossIncome | X 万円 |
| 年間支出 | livingCostAnnual | X 万円 |
| 投資リターン | expectedReturn | X % |
| 緊急資金 | assetCash / (livingCostAnnual / 12) | X.X ヶ月 |
| 物件価格 | propertyPrice | X 万円（0超の場合のみ） |

### 変更しないもの
- `hooks/useStrategy.ts` — hero セクションの overallAssessment で使用中
- worldline/page.tsx のタブ構成 — 名前変更のみ
