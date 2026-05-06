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

const RUNE_CHARS = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ'];

export default function BoardCell({ row, col, unit, isHighlighted, isSelected, onClick, onLongPress }: Props) {
  const isPlayerZone = row >= BOARD_ROWS - 1;
  const isAiZone = row <= 0;

  const { start, cancel, didFire } = useLongPress(() => {
    if (unit && onLongPress) onLongPress(unit);
  }, 450);

  const handleClick = () => {
    if (didFire.current) { didFire.current = false; return; }
    onClick({ row, col });
  };

  const runeChar = RUNE_CHARS[(row * 4 + col) % RUNE_CHARS.length];

  // CSS クラス構成
  let tileClass = 'rune-tile';
  if (isAiZone) tileClass += ' rune-tile--enemy';
  else if (isPlayerZone) tileClass += ' rune-tile--player';

  if (isSelected)    tileClass += ' rune-tile--selected';
  else if (isHighlighted && unit === null) tileClass += ' rune-tile--highlight-summon';
  else if (isHighlighted) tileClass += ' rune-tile--highlight-attack';

  return (
    <div
      data-testid={`cell-${row}-${col}`}
      className={tileClass}
      onClick={handleClick}
      onMouseDown={start}
      onMouseUp={cancel}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
    >
      {/* ルーン文字（背景） */}
      {!unit && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5em',
          color: 'rgba(20,14,8,0.45)',
          textShadow: '1px 1px 0 rgba(180,160,130,0.25)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          {runeChar}
        </span>
      )}

      {/* 移動可能ドット */}
      {isHighlighted && !unit && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}>
          <div style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'var(--gold)',
            boxShadow: '0 0 8px var(--gold)',
            opacity: 0.8,
          }} />
        </div>
      )}

      {unit && <UnitToken unit={unit} isSelected={isSelected} />}
    </div>
  );
}
