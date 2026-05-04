'use client';

import { Card } from '@/lib/types/game';

const GRID = 5;
const C = 2; // center index

function moveCells(card: Card): Set<string> {
  const s = new Set<string>();
  const mv = card.movement;
  if (mv.type === 'step') {
    for (const d of mv.directions) {
      const r = C + d.dy, c = C + d.dx;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) s.add(`${r},${c}`);
    }
  } else if (mv.type === 'jump') {
    for (const d of mv.offsets) {
      const r = C + d.dy, c = C + d.dx;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) s.add(`${r},${c}`);
    }
  } else if (mv.type === 'slide') {
    for (const d of mv.directions) {
      let r = C + d.dy, c = C + d.dx;
      while (r >= 0 && r < GRID && c >= 0 && c < GRID) {
        s.add(`${r},${c}`); r += d.dy; c += d.dx;
      }
    }
  }
  return s;
}

function attackCells(card: Card): Set<string> {
  const s = new Set<string>();
  const ar = card.attackRange;
  if (ar.type === 'none') return s;
  if (ar.type === 'step') {
    for (const d of ar.directions) {
      const r = C + d.dy, c = C + d.dx;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) s.add(`${r},${c}`);
    }
  } else if (ar.type === 'ranged') {
    let r = C + ar.direction.dy, c = C + ar.direction.dx, dist = 0;
    while (dist < ar.maxDistance && r >= 0 && r < GRID && c >= 0 && c < GRID) {
      s.add(`${r},${c}`); r += ar.direction.dy; c += ar.direction.dx; dist++;
    }
  } else if (ar.type === 'aoe') {
    for (const d of ar.pattern) {
      const r = C + d.dy, c = C + d.dx;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) s.add(`${r},${c}`);
    }
  }
  return s;
}

function MiniGrid({ cells, color, label, isJump }: {
  cells: Set<string>; color: string; label: string; isJump?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="grid gap-px bg-[#0a1628] p-1 rounded-lg"
        style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
      >
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const isCenter = r === C && c === C;
            const isHit = cells.has(`${r},${c}`);
            return (
              <div
                key={`${r},${c}`}
                className="w-[14px] h-[14px] rounded-sm flex items-center justify-center"
                style={{
                  backgroundColor: isCenter
                    ? '#3b82f6'
                    : isHit ? color : '#1e293b',
                  outline: isHit && isJump ? '1px dashed #f59e0b' : undefined,
                  outlineOffset: '-1px',
                }}
              >
                {isCenter && (
                  <span className="text-[6px] text-white font-bold leading-none">◉</span>
                )}
              </div>
            );
          })
        )}
      </div>
      <span className="text-[10px]" style={{ color }}>{label}</span>
    </div>
  );
}

export default function RangeDiagram({ card }: { card: Card }) {
  const move = moveCells(card);
  const atk = attackCells(card);
  const isJump = card.movement.type === 'jump';

  return (
    <div className="flex justify-center gap-6">
      <MiniGrid cells={move} color="#60a5fa" label="移動" isJump={isJump} />
      <MiniGrid cells={atk} color="#f87171" label="攻撃" />
    </div>
  );
}
