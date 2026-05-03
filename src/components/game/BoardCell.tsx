'use client';

import { Unit, Position } from '@/lib/types/game';
import UnitToken from './UnitToken';

interface Props {
  row: number;
  col: number;
  unit: Unit | null;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: (pos: Position) => void;
}

export default function BoardCell({ row, col, unit, isHighlighted, isSelected, onClick }: Props) {
  const isPlayerZone = row >= 4;
  const isAiZone = row <= 1;

  return (
    <div
      data-testid={`cell-${row}-${col}`}
      onClick={() => onClick({ row, col })}
      className={[
        'relative w-full aspect-square flex items-center justify-center',
        'border border-[#1e3a5f] cursor-pointer transition-all duration-150',
        isPlayerZone ? 'bg-[#0d2137]' : isAiZone ? 'bg-[#1a0d0d]' : 'bg-[#0f1a2e]',
        isHighlighted ? 'bg-[#f59e0b]/30 border-[#f59e0b] border-2' : '',
        isSelected ? 'bg-[#3b82f6]/20 border-[#3b82f6] border-2' : '',
        'active:opacity-70',
      ].join(' ')}
    >
      {unit && (
        <UnitToken unit={unit} isSelected={isSelected && unit !== null} />
      )}

      {/* ハイライト時の波紋エフェクト */}
      {isHighlighted && !unit && (
        <div className="w-3 h-3 rounded-full bg-[#f59e0b]/60 animate-pulse" />
      )}
    </div>
  );
}
