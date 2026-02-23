'use client';

import type { Branch, WorldlineCandidate } from '@/lib/branch';

interface BranchTreeVizProps {
  currentAge: number;
  selectedBranches: Branch[];
  candidates?: WorldlineCandidate[];
  showScores?: boolean;
}

// ---------------------------------------------------------------------------
// Decision Tree data structures
// ---------------------------------------------------------------------------

interface TreeNode {
  x: number;
  y: number;
  label?: string;
  children?: [TreeNode, TreeNode]; // [without event, with event]
  isLeaf?: boolean;
  worldlineIndex?: number;
  eventSummary?: string;
  clipped?: number; // number of clipped worldlines below this node
}

interface Edge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isUncertain: boolean;
  labelText: string;
  labelAbove: boolean; // true = upper branch (without), false = lower branch (with)
}

const MAX_WORLDLINES = 5;

// ---------------------------------------------------------------------------
// Build & layout the binary decision tree
// ---------------------------------------------------------------------------

function buildTree(
  events: Branch[],
  depth: number,
  activeEvents: string[],
  leafCounter: { value: number },
): TreeNode {
  // If no more events or we've hit the worldline cap
  if (depth >= events.length || leafCounter.value >= MAX_WORLDLINES) {
    const remaining = Math.pow(2, events.length - depth);
    if (leafCounter.value >= MAX_WORLDLINES && depth < events.length) {
      return { x: 0, y: 0, isLeaf: true, worldlineIndex: -1, clipped: remaining };
    }
    leafCounter.value++;
    return {
      x: 0,
      y: 0,
      isLeaf: true,
      worldlineIndex: leafCounter.value,
      eventSummary: activeEvents.length > 0 ? activeEvents.join(' / ') : 'ベースライン',
    };
  }

  const event = events[depth];
  const withoutChild = buildTree(events, depth + 1, activeEvents, leafCounter);
  const withChild = buildTree(events, depth + 1, [...activeEvents, event.label], leafCounter);

  return {
    x: 0,
    y: 0,
    label: event.label,
    children: [withoutChild, withChild],
  };
}

function countLeaves(node: TreeNode): number {
  if (node.isLeaf) return 1;
  if (!node.children) return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

function layoutTree(
  node: TreeNode,
  depth: number,
  maxDepth: number,
  yStart: number,
  yEnd: number,
  padX: number,
  padRight: number,
  svgWidth: number,
): void {
  const xStep = maxDepth > 0 ? (svgWidth - padX - padRight) / maxDepth : 0;
  node.x = padX + depth * xStep;
  node.y = (yStart + yEnd) / 2;

  if (!node.children) return;

  const totalLeaves = countLeaves(node);
  const topLeaves = countLeaves(node.children[0]);
  const splitRatio = topLeaves / totalLeaves;
  const midY = yStart + (yEnd - yStart) * splitRatio;

  layoutTree(node.children[0], depth + 1, maxDepth, yStart, midY, padX, padRight, svgWidth);
  layoutTree(node.children[1], depth + 1, maxDepth, midY, yEnd, padX, padRight, svgWidth);
}

function collectAllEdges(node: TreeNode, events: Branch[], depth: number, edges: Edge[]): void {
  if (!node.children) return;

  const event = events[depth];
  const shortWithout = '維持';
  const shortWith = event?.label ?? '';

  edges.push({
    from: { x: node.x, y: node.y },
    to: { x: node.children[0].x, y: node.children[0].y },
    isUncertain: false,
    labelText: shortWithout,
    labelAbove: true,
  });

  edges.push({
    from: { x: node.x, y: node.y },
    to: { x: node.children[1].x, y: node.children[1].y },
    isUncertain: true,
    labelText: shortWith,
    labelAbove: false,
  });

  collectAllEdges(node.children[0], events, depth + 1, edges);
  collectAllEdges(node.children[1], events, depth + 1, edges);
}

interface JunctionNode {
  x: number;
  y: number;
  label: string;
}

function collectJunctions(node: TreeNode, junctions: JunctionNode[]): void {
  if (node.isLeaf || !node.children) return;
  junctions.push({ x: node.x, y: node.y, label: node.label ?? '' });
  collectJunctions(node.children[0], junctions);
  collectJunctions(node.children[1], junctions);
}

interface LeafNode {
  x: number;
  y: number;
  worldlineIndex: number;
  eventSummary: string;
  clipped?: number;
}

function collectLeaves(node: TreeNode, leaves: LeafNode[]): void {
  if (node.isLeaf) {
    leaves.push({
      x: node.x,
      y: node.y,
      worldlineIndex: node.worldlineIndex ?? 0,
      eventSummary: node.eventSummary ?? '',
      clipped: node.clipped,
    });
    return;
  }
  if (node.children) {
    collectLeaves(node.children[0], leaves);
    collectLeaves(node.children[1], leaves);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BranchTreeViz({
  selectedBranches,
  candidates,
  showScores,
}: BranchTreeVizProps) {
  const uncertain = selectedBranches.filter(
    (b) => !b.auto && b.certainty === 'uncertain' && b.age !== undefined
  );

  const SVG_W = 720;
  // Dynamic height: taller with more uncertain branches (360–600)
  const SVG_H = Math.max(360, Math.min(600, 340 + uncertain.length * 60));
  const PAD_X = 40;
  const PAD_RIGHT = 200; // widened for larger text at mobile scale
  const PAD_Y = 40;

  // Font sizes scaled for mobile readability
  // At 375px device width: scale = 375/720 ≈ 0.52
  // fontSize 22 × 0.52 = 11.4px (minimum readable)
  const FONT_LABEL = 22;   // edge labels, event summaries
  const FONT_NODE = 22;    // node labels (leaf names, "現在")
  const FONT_HINT = 20;    // hints, secondary text

  // ── 0 uncertain events: simple baseline ──
  if (uncertain.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-normal text-muted-foreground mb-2">デシジョンツリー</p>
        <svg viewBox={`0 0 ${SVG_W} 140`} className="w-full h-auto" role="img" aria-label="デシジョンツリー">
          <circle cx={PAD_X} cy={50} r={8} fill="var(--brand-night)" />
          <line x1={PAD_X + 8} y1={50} x2={SVG_W - PAD_RIGHT - 7} y2={50} stroke="var(--brand-night)" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={SVG_W - PAD_RIGHT} cy={50} r={7} fill="var(--brand-gold)" />
          <text x={PAD_X} y={78} fontSize={FONT_NODE} fill="var(--brand-stone)" textAnchor="middle" fontWeight="600">現在</text>
          <text x={SVG_W - PAD_RIGHT} y={78} fontSize={FONT_NODE} fill="var(--brand-stone)" textAnchor="middle">ベースライン</text>
          <text x={SVG_W / 2} y={120} fontSize={FONT_HINT} fill="var(--brand-bronze)" textAnchor="middle">
            不確定な分岐を加えると、より多くの世界線が生まれます
          </text>
        </svg>
      </div>
    );
  }

  // ── Build decision tree ──
  const leafCounter = { value: 0 };
  const root = buildTree(uncertain, 0, [], leafCounter);

  const maxDepth = uncertain.length;
  layoutTree(root, 0, maxDepth, PAD_Y, SVG_H - PAD_Y, PAD_X, PAD_RIGHT, SVG_W);

  // Collect rendering data
  const edges: Edge[] = [];
  collectAllEdges(root, uncertain, 0, edges);

  const junctions: JunctionNode[] = [];
  collectJunctions(root, junctions);

  const leaves: LeafNode[] = [];
  collectLeaves(root, leaves);

  // Score lookup for candidates
  const scoreMap = new Map<number, { score: number; color: string }>();
  if (showScores && candidates) {
    const validLeaves = leaves.filter((l) => !l.clipped);
    candidates.forEach((c, i) => {
      if (c.score && i < validLeaves.length) {
        scoreMap.set(i, { score: c.score, color: c.color });
      }
    });
  }

  // Total clipped count
  const totalClipped = leaves
    .filter((l) => l.clipped)
    .reduce((sum, l) => sum + (l.clipped ?? 0), 0);
  // Remove clipped placeholder leaves for rendering
  const realLeaves = leaves.filter((l) => !l.clipped);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-normal text-muted-foreground mb-2">デシジョンツリー</p>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="デシジョンツリー"
      >
        {/* Edges: Cubic Bezier curves */}
        {edges.map((edge, i) => {
          const dx = (edge.to.x - edge.from.x) * 0.4;
          return (
            <path
              key={`e-${i}`}
              d={`M ${edge.from.x} ${edge.from.y} C ${edge.from.x + dx} ${edge.from.y}, ${edge.to.x - dx} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`}
              stroke={edge.isUncertain ? 'var(--brand-stone)' : 'var(--brand-night)'}
              strokeWidth={edge.isUncertain ? 1.5 : 2}
              strokeDasharray={edge.isUncertain ? '6 4' : 'none'}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {/* Edge labels */}
        {edges.map((edge, i) => {
          const t = 0.3;
          const lx = edge.from.x + (edge.to.x - edge.from.x) * t;
          const ly = edge.from.y + (edge.to.y - edge.from.y) * t;
          const offsetY = edge.labelAbove ? -12 : 24;
          const label = edge.labelText.length > 6 ? edge.labelText.slice(0, 6) + '…' : edge.labelText;
          return (
            <text
              key={`el-${i}`}
              x={lx}
              y={ly + offsetY}
              fontSize={FONT_LABEL}
              fill={edge.isUncertain ? 'var(--brand-bronze)' : 'var(--brand-stone)'}
            >
              {label}
            </text>
          );
        })}

        {/* Junction nodes: Gold, no animation */}
        {junctions.map((node, i) => (
          <g key={`j-${i}`}>
            <circle cx={node.x} cy={node.y} r={7} fill="var(--brand-gold)" />
          </g>
        ))}

        {/* Root node */}
        <circle cx={root.x} cy={root.y} r={8} fill="var(--brand-night)" />
        <text x={root.x} y={root.y + 28} fontSize={FONT_NODE} fill="var(--brand-stone)" textAnchor="middle" fontWeight="600">
          現在
        </text>

        {/* Leaf nodes (worldlines) */}
        {realLeaves.map((leaf, i) => {
          const isBaseline = leaf.eventSummary === 'ベースライン';
          return (
            <g key={`l-${i}`}>
              <circle
                cx={leaf.x}
                cy={leaf.y}
                r={isBaseline ? 7 : 6}
                fill={isBaseline ? 'var(--brand-gold)' : 'var(--card)'}
                stroke={isBaseline ? 'none' : 'var(--brand-stone)'}
                strokeWidth={isBaseline ? 0 : 1.5}
              />
              <text x={leaf.x + 14} y={leaf.y + 6} fontSize={FONT_NODE} fill="var(--brand-stone)" fontWeight={isBaseline ? '500' : 'normal'}>
                {isBaseline ? 'ベースライン' : `世界線${leaf.worldlineIndex}`}
              </text>
              {!isBaseline && (
                <text x={leaf.x + 14} y={leaf.y + 26} fontSize={FONT_LABEL} fill="var(--brand-bronze)">
                  {leaf.eventSummary.length > 12 ? leaf.eventSummary.slice(0, 12) + '…' : leaf.eventSummary}
                </text>
              )}

              {/* Score badge */}
              {showScores && scoreMap.has(i) && (() => {
                const s = scoreMap.get(i)!;
                return (
                  <>
                    <rect
                      x={leaf.x - 34}
                      y={leaf.y - 10}
                      width={30}
                      height={20}
                      rx={4}
                      fill={s.color}
                      opacity={0.9}
                    />
                    <text
                      x={leaf.x - 19}
                      y={leaf.y + 6}
                      fontSize={FONT_NODE}
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {s.score}
                    </text>
                  </>
                );
              })()}
            </g>
          );
        })}

        {/* Clipped indicator */}
        {totalClipped > 0 && (() => {
          const lastLeaf = realLeaves[realLeaves.length - 1];
          if (!lastLeaf) return null;
          return (
            <text
              x={lastLeaf.x + 8}
              y={lastLeaf.y + 40}
              fontSize={FONT_HINT}
              fill="var(--brand-bronze)"
            >
              ...他 {totalClipped} 本
            </text>
          );
        })()}
      </svg>
    </div>
  );
}
