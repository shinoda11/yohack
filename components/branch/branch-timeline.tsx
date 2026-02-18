'use client';

import { useMemo } from 'react';
import { branchToLifeEvents, type Branch } from '@/lib/branch';
import type { Profile, LifeEvent } from '@/lib/types';

// ============================================================
// Types
// ============================================================

interface TimelineEvent {
  id: string;
  name: string;
  age: number;
  endAge: number | null; // age + duration (null = one-time)
  amount: string;
  certainty: 'confirmed' | 'planned' | 'uncertain';
  row: number; // vertical lane assignment
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
};

const PADDING_LEFT = 40;
const PADDING_RIGHT = 16;
const AXIS_Y = 40;        // y of the main axis line
const ROW_HEIGHT = 54;     // height per event row
const NODE_R = 5;
const TICK_HEIGHT = 6;

// ============================================================
// Helpers
// ============================================================

function formatAmount(e: LifeEvent): string {
  if (e.type === 'housing_purchase' && e.purchaseDetails) {
    return `${e.purchaseDetails.propertyPrice.toLocaleString()}万円`;
  }
  if (e.type === 'asset_gain') return `+${e.amount}万円`;
  const isIncome = e.type === 'income_increase' || e.type === 'rental_income';
  const isDecrease = e.type === 'income_decrease' || e.type === 'expense_decrease';
  const sign = isDecrease ? '-' : '+';
  if (e.isRecurring || (e.duration && e.duration > 0)) {
    return `${sign}${e.amount}万円/年`;
  }
  if (isIncome) return `${sign}${e.amount}万円/年`;
  return `${sign}${e.amount}万円`;
}

function buildTimelineEvents(branches: Branch[], profile: Profile): TimelineEvent[] {
  const items: TimelineEvent[] = [];

  for (const branch of branches) {
    // Skip auto branches (age, pension is handled separately)
    if (branch.auto) continue;
    // Skip the "age" confirmed branch
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
        row: 0, // assigned below
      });
    }
  }

  // Sort by age, then by certainty (confirmed first)
  const certaintyOrder = { confirmed: 0, planned: 1, uncertain: 2 };
  items.sort((a, b) => a.age - b.age || certaintyOrder[a.certainty] - certaintyOrder[b.certainty]);

  // Assign rows: greedy lane packing to avoid overlaps
  // Each lane tracks the "end age" of the last event in it
  const laneEnds: number[] = [];
  for (const item of items) {
    const endAge = item.endAge ?? item.age;
    let placed = false;
    for (let i = 0; i < laneEnds.length; i++) {
      if (item.age > laneEnds[i] + 2) { // +2 age gap to avoid label collisions
        laneEnds[i] = endAge;
        item.row = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      item.row = laneEnds.length;
      laneEnds.push(endAge);
    }
  }

  return items;
}

// ============================================================
// Component
// ============================================================

export function BranchTimeline({ profile, selectedBranches }: BranchTimelineProps) {
  const currentAge = profile.currentAge;
  const maxAge = 100;

  const events = useMemo(
    () => buildTimelineEvents(selectedBranches, profile),
    [selectedBranches, profile]
  );

  const rowCount = events.length > 0
    ? Math.max(...events.map(e => e.row)) + 1
    : 0;

  // Pension marker at 65
  const pensionAge = 65;
  const hasPension = selectedBranches.some(b => b.id === 'pension');

  // SVG sizing
  const viewW = 600;
  const usableW = viewW - PADDING_LEFT - PADDING_RIGHT;
  const eventAreaTop = AXIS_Y + 24; // gap between axis and first row
  const svgH = eventAreaTop + Math.max(rowCount, 1) * ROW_HEIGHT + 16;

  // Age → x coordinate
  const ageToX = (age: number) =>
    PADDING_LEFT + ((age - currentAge) / (maxAge - currentAge)) * usableW;

  // Tick marks every 10 years, aligned
  const ticks: number[] = [];
  for (let a = Math.ceil(currentAge / 10) * 10; a <= maxAge; a += 10) {
    if (a > currentAge) ticks.push(a);
  }

  return (
    <div className="mt-4 w-full">
      <p className="text-xs font-medium text-[#5A5550] mb-2">タイムライン</p>
      <svg
        viewBox={`0 0 ${viewW} ${svgH}`}
        className="w-full"
        style={{ minHeight: Math.max(svgH * 0.5, 120) }}
        aria-label="ライフイベントタイムライン"
      >
        {/* Grid lines at decade ticks */}
        {ticks.map(age => (
          <line
            key={`grid-${age}`}
            x1={ageToX(age)} y1={AXIS_Y}
            x2={ageToX(age)} y2={svgH - 8}
            stroke={COLORS.axis}
            strokeWidth={1}
          />
        ))}

        {/* Main axis line */}
        <line
          x1={PADDING_LEFT} y1={AXIS_Y}
          x2={viewW - PADDING_RIGHT} y2={AXIS_Y}
          stroke={COLORS.axis}
          strokeWidth={2}
        />

        {/* Tick marks + labels */}
        {ticks.map(age => (
          <g key={`tick-${age}`}>
            <line
              x1={ageToX(age)} y1={AXIS_Y - TICK_HEIGHT / 2}
              x2={ageToX(age)} y2={AXIS_Y + TICK_HEIGHT / 2}
              stroke={COLORS.accent}
              strokeWidth={1}
            />
            <text
              x={ageToX(age)}
              y={AXIS_Y - TICK_HEIGHT - 2}
              textAnchor="middle"
              fill={COLORS.accent}
              fontSize={9}
            >
              {age}
            </text>
          </g>
        ))}

        {/* Current age marker */}
        <circle
          cx={ageToX(currentAge)}
          cy={AXIS_Y}
          r={NODE_R + 1}
          fill={COLORS.confirmed}
        />
        <text
          x={ageToX(currentAge)}
          y={AXIS_Y + 16}
          textAnchor="middle"
          fill={COLORS.confirmed}
          fontSize={9}
          fontWeight={600}
        >
          現在 {currentAge}歳
        </text>

        {/* Pension marker */}
        {hasPension && pensionAge > currentAge && pensionAge <= maxAge && (
          <g>
            <line
              x1={ageToX(pensionAge)} y1={AXIS_Y - 10}
              x2={ageToX(pensionAge)} y2={AXIS_Y + 10}
              stroke={COLORS.confirmed}
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
            <text
              x={ageToX(pensionAge)}
              y={AXIS_Y + 16}
              textAnchor="middle"
              fill={COLORS.confirmed}
              fontSize={8}
            >
              年金 {pensionAge}歳
            </text>
          </g>
        )}

        {/* Event items */}
        {events.map(ev => {
          const x = ageToX(ev.age);
          const y = eventAreaTop + ev.row * ROW_HEIGHT + ROW_HEIGHT / 2;
          const color = ev.certainty === 'confirmed' ? COLORS.confirmed
            : ev.certainty === 'planned' ? COLORS.planned
            : COLORS.uncertain;
          const isUncertain = ev.certainty === 'uncertain';

          return (
            <g key={ev.id}>
              {/* Vertical connector from axis to event row */}
              <line
                x1={x} y1={AXIS_Y}
                x2={x} y2={y}
                stroke={color}
                strokeWidth={1}
                strokeDasharray={isUncertain ? '3 2' : undefined}
                opacity={0.4}
              />

              {/* Duration bar */}
              {ev.endAge && (
                <rect
                  x={x}
                  y={y - 3}
                  width={Math.max(ageToX(Math.min(ev.endAge, maxAge)) - x, 2)}
                  height={6}
                  rx={3}
                  fill={color}
                  opacity={0.3}
                />
              )}

              {/* Node circle */}
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill={isUncertain ? '#FAF9F7' : color}
                stroke={color}
                strokeWidth={isUncertain ? 1.5 : 0}
              />

              {/* Event name (above) */}
              <text
                x={x + NODE_R + 4}
                y={y - 7}
                fill={COLORS.text}
                fontSize={10}
                fontWeight={500}
              >
                {ev.name}
              </text>

              {/* Amount (below) */}
              <text
                x={x + NODE_R + 4}
                y={y + 12}
                fill={COLORS.accent}
                fontSize={9}
              >
                {ev.age}歳{ev.endAge ? `〜${ev.endAge}歳` : ''} / {ev.amount}
              </text>
            </g>
          );
        })}

        {/* Empty state */}
        {events.length === 0 && (
          <text
            x={viewW / 2}
            y={eventAreaTop + 20}
            textAnchor="middle"
            fill={COLORS.accent}
            fontSize={11}
          >
            イベントを選択するとタイムラインに表示されます
          </text>
        )}
      </svg>
    </div>
  );
}
