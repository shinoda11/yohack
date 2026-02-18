'use client';

import { useMemo } from 'react';
import { branchToLifeEvents, type Branch } from '@/lib/branch';
import type { Profile, LifeEvent } from '@/lib/types';

// ============================================================
// Types
// ============================================================

interface TimelineNode {
  id: string;
  name: string;
  age: number;
  endAge: number | null;
  amount: string;
  certainty: 'confirmed' | 'planned' | 'uncertain';
  special?: 'current' | 'pension';
}

interface BranchTimelineProps {
  profile: Profile;
  selectedBranches: Branch[];
}

// ============================================================
// Constants
// ============================================================

const COLORS = {
  axis: '#F0ECE4',
  confirmed: '#1A1916',
  planned: '#C8B89A',
  uncertain: '#C8B89A',
  text: '#5A5550',
  accent: '#8A7A62',
  bg: '#FAF9F7',
};

const NODE_SPACING = 140; // min px between nodes
const PADDING_LEFT = 60;
const PADDING_RIGHT = 40;
const NODE_R = 6;
const AXIS_Y = 20;
const LABEL_TOP = AXIS_Y + 20;   // event name y
const DETAIL_TOP = AXIS_Y + 32;  // amount/age detail y
const BAR_TOP = AXIS_Y + 38;     // duration bar y
const SVG_H = 78;                // total svg height

// ============================================================
// Helpers
// ============================================================

function formatAmount(e: LifeEvent): string {
  if (e.type === 'housing_purchase' && e.purchaseDetails) {
    return `${e.purchaseDetails.propertyPrice.toLocaleString()}万円`;
  }
  if (e.type === 'asset_gain') return `+${e.amount}万円`;
  const isDecrease = e.type === 'income_decrease' || e.type === 'expense_decrease';
  const sign = isDecrease ? '-' : '+';
  if (e.isRecurring || (e.duration && e.duration > 0)) {
    return `${sign}${e.amount}万円/年`;
  }
  const isIncome = e.type === 'income_increase' || e.type === 'rental_income';
  if (isIncome) return `${sign}${e.amount}万円/年`;
  return `${sign}${e.amount}万円`;
}

function buildNodes(branches: Branch[], profile: Profile): TimelineNode[] {
  const items: TimelineNode[] = [];

  for (const branch of branches) {
    if (branch.auto) continue;
    if (branch.id === 'age') continue;

    const events = branchToLifeEvents(branch, profile);
    for (const e of events) {
      items.push({
        id: e.id,
        name: e.name,
        age: e.age,
        endAge: e.duration && e.duration > 0 ? e.age + e.duration : null,
        amount: formatAmount(e),
        certainty: branch.certainty,
      });
    }
  }

  const certaintyOrder = { confirmed: 0, planned: 1, uncertain: 2 };
  items.sort((a, b) => a.age - b.age || certaintyOrder[a.certainty] - certaintyOrder[b.certainty]);

  // Insert special markers
  const currentAge = profile.currentAge;
  const hasPension = branches.some(b => b.id === 'pension');

  const result: TimelineNode[] = [
    { id: '_current', name: `現在`, age: currentAge, endAge: null, amount: '', certainty: 'confirmed', special: 'current' },
  ];

  let pensionInserted = false;
  for (const item of items) {
    if (hasPension && !pensionInserted && item.age >= 65) {
      result.push({ id: '_pension', name: '年金受給', age: 65, endAge: null, amount: '', certainty: 'confirmed', special: 'pension' });
      pensionInserted = true;
    }
    result.push(item);
  }
  if (hasPension && !pensionInserted) {
    result.push({ id: '_pension', name: '年金受給', age: 65, endAge: null, amount: '', certainty: 'confirmed', special: 'pension' });
  }

  return result;
}

// ============================================================
// Component
// ============================================================

export function BranchTimeline({ profile, selectedBranches }: BranchTimelineProps) {
  const nodes = useMemo(
    () => buildNodes(selectedBranches, profile),
    [selectedBranches, profile]
  );

  if (nodes.length <= 1) {
    // Only "current" marker, no events
    return (
      <div className="mt-4 w-full">
        <p className="text-xs font-medium text-[#5A5550] mb-2">タイムライン</p>
        <p className="text-xs text-[#8A7A62] py-4 text-center">
          イベントを選択するとタイムラインに表示されます
        </p>
      </div>
    );
  }

  const nodeCount = nodes.length;
  const totalW = PADDING_LEFT + (nodeCount - 1) * NODE_SPACING + PADDING_RIGHT;

  // Node x positions: equal spacing
  const nodeX = (i: number) => PADDING_LEFT + i * NODE_SPACING;

  // For duration bars, find the node index by age (approximate)
  const ageToIndex = new Map<number, number>();
  nodes.forEach((n, i) => {
    if (!ageToIndex.has(n.age)) ageToIndex.set(n.age, i);
  });

  // Interpolate x for an arbitrary age (for duration bar end)
  const ageToXInterp = (age: number): number => {
    // Find surrounding nodes
    let leftIdx = 0;
    let rightIdx = nodeCount - 1;
    for (let i = 0; i < nodeCount; i++) {
      if (nodes[i].age <= age) leftIdx = i;
      if (nodes[i].age >= age && i < rightIdx) { rightIdx = i; break; }
    }
    if (leftIdx === rightIdx) return nodeX(leftIdx);
    const leftAge = nodes[leftIdx].age;
    const rightAge = nodes[rightIdx].age;
    if (rightAge === leftAge) return nodeX(leftIdx);
    const t = (age - leftAge) / (rightAge - leftAge);
    return nodeX(leftIdx) + t * (nodeX(rightIdx) - nodeX(leftIdx));
  };

  return (
    <div className="mt-4 w-full">
      <p className="text-xs font-medium text-[#5A5550] mb-2">タイムライン</p>
      <div className="overflow-x-auto -mx-4 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <svg
          width={totalW}
          height={SVG_H}
          viewBox={`0 0 ${totalW} ${SVG_H}`}
          aria-label="ライフイベントタイムライン"
          className="block"
        >
          {/* Axis line */}
          <line
            x1={PADDING_LEFT - 10} y1={AXIS_Y}
            x2={totalW - PADDING_RIGHT + 10} y2={AXIS_Y}
            stroke={COLORS.axis}
            strokeWidth={2}
          />

          {/* Connections between nodes */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const prev = nodes[i - 1];
            const x1 = nodeX(i - 1);
            const x2 = nodeX(i);
            const isUncertain = node.certainty === 'uncertain' || prev.certainty === 'uncertain';
            return (
              <line
                key={`conn-${node.id}`}
                x1={x1} y1={AXIS_Y}
                x2={x2} y2={AXIS_Y}
                stroke={isUncertain ? COLORS.uncertain : COLORS.planned}
                strokeWidth={2}
                strokeDasharray={isUncertain ? '4 3' : undefined}
              />
            );
          })}

          {/* Nodes + labels */}
          {nodes.map((node, i) => {
            const x = nodeX(i);
            const isSpecial = !!node.special;
            const isCurrent = node.special === 'current';
            const isPension = node.special === 'pension';
            const isUncertain = node.certainty === 'uncertain';
            const isPlanned = node.certainty === 'planned';

            const fillColor = isCurrent ? COLORS.confirmed
              : isPension ? COLORS.confirmed
              : isUncertain ? COLORS.bg
              : isPlanned ? COLORS.planned
              : COLORS.confirmed;

            const strokeColor = isCurrent ? COLORS.confirmed
              : isPension ? COLORS.confirmed
              : isUncertain ? COLORS.uncertain
              : 'none';

            return (
              <g key={node.id}>
                {/* Duration bar */}
                {node.endAge && (
                  <rect
                    x={x}
                    y={BAR_TOP}
                    width={Math.max(ageToXInterp(node.endAge) - x, 8)}
                    height={4}
                    rx={2}
                    fill={isUncertain ? COLORS.uncertain : COLORS.planned}
                    opacity={0.3}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={isCurrent ? NODE_R + 1 : NODE_R}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isUncertain || isPension ? 1.5 : 0}
                />

                {/* Age label (above, on axis) */}
                <text
                  x={x}
                  y={AXIS_Y - NODE_R - 4}
                  textAnchor="middle"
                  fill={isSpecial ? COLORS.confirmed : COLORS.accent}
                  fontSize={9}
                  fontWeight={isSpecial ? 600 : 400}
                >
                  {isCurrent ? `現在 ${node.age}歳` : isPension ? `${node.age}歳` : `${node.age}歳`}
                </text>

                {/* Event name (below axis) */}
                <text
                  x={x}
                  y={LABEL_TOP}
                  textAnchor="middle"
                  fill={COLORS.text}
                  fontSize={10}
                  fontWeight={500}
                >
                  {node.name}
                </text>

                {/* Amount detail (below name) */}
                {node.amount && (
                  <text
                    x={x}
                    y={DETAIL_TOP}
                    textAnchor="middle"
                    fill={COLORS.accent}
                    fontSize={9}
                  >
                    {node.amount}
                    {node.endAge ? ` (${node.endAge - node.age}年)` : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
