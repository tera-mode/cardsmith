'use client';

import { Unit, Position } from '@/lib/types/game';
import UnitToken from './UnitToken';
import { useLongPress } from '@/hooks/useLongPress';
import { BOARD_ROWS } from '@/lib/game/rules';

interface Props {
  row: number;
  col: number;
  unit: Unit | null;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: (pos: Position) => void;
  onLongPress?: (unit: Unit) => void;
}

export default function BoardCell({ row, col, unit, isHighlighted, isSelected, onClick, onLongPress }: Props) {
  const isPlayerZone = row >= BOARD_ROWS - 1;
  const isAiZone = row <= 0;

  const { start, cancel, didFire } = useLongPress(() => {
    if (unit && onLongPress) onLongPress(unit);
  }, 450);

  const handleClick = () => {
    // 長押し後はクリックイベントを無視
    if (didFire.current) {
      didFire.current = false;
      return;
    }
    onClick({ row, col });
  };

  return (
    <div
      data-testid={`cell-${row}-${col}`}
      onClick={handleClick}
      onMouseDown={start}
      onMouseUp={cancel}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      className={[
        'relative w-full aspect-square flex items-center justify-center',
        'border border-[#1e3a5f] cursor-pointer transition-all duration-150',
        isPlayerZone ? 'bg-[#0d2137]' : isAiZone ? 'bg-[#1a0d0d]' : 'bg-[#0f1a2e]',
        isHighlighted ? 'bg-[#f59e0b]/30 border-[#f59e0b] border-2' : '',
        isSelected ? 'bg-[#3b82f6]/20 border-[#3b82f6] border-2' : '',
        'active:opacity-70',
      ].join(' ')}
    >
      {unit && <UnitToken unit={unit} isSelected={isSelected} />}

      {isHighlighted && !unit && (
        <div className="w-3 h-3 rounded-full bg-[#f59e0b]/60 animate-pulse" />
      )}
    </div>
  );
}
