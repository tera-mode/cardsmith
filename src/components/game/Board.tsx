'use client';

import { BoardState, Position, Unit, InteractionMode, AttackTarget } from '@/lib/types/game';
import BoardCell from './BoardCell';
import { useGame } from '@/contexts/GameContext';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';

interface Props {
  board: BoardState;
  mode: InteractionMode;
  highlightedCells: Position[];
}

export default function Board({ board, mode, highlightedCells }: Props) {
  const { selectUnit, moveUnit, attackTarget, summonToCell } = useGame();

  const isHighlighted = (row: number, col: number) =>
    highlightedCells.some((p) => p.row === row && p.col === col);

  const isSelectedUnit = (unit: Unit | null): boolean => {
    if (!unit) return false;
    if (mode.type === 'unit_selected' || mode.type === 'unit_moved') {
      return mode.unit.instanceId === unit.instanceId;
    }
    return false;
  };

  const handleCellClick = (pos: Position) => {
    const unit = board[pos.row][pos.col];

    if (mode.type === 'card_selected') {
      if (isHighlighted(pos.row, pos.col)) {
        summonToCell(pos);
      }
      return;
    }

    if (mode.type === 'unit_selected') {
      if (isHighlighted(pos.row, pos.col)) {
        if (unit && unit.owner !== mode.unit.owner) {
          // 敵ユニットをタップ → 攻撃
          attackTarget({ type: 'unit', unit });
        } else {
          // 空きマスをタップ → 移動
          moveUnit(pos);
        }
        return;
      }
      if (unit && unit.owner === 'player') {
        selectUnit(unit);
        return;
      }
    }

    if (mode.type === 'unit_moved') {
      if (isHighlighted(pos.row, pos.col) && unit && unit.owner !== mode.unit.owner) {
        attackTarget({ type: 'unit', unit });
      }
      return;
    }

    // idle: プレイヤーユニットを選択
    if (unit && unit.owner === 'player') {
      selectUnit(unit);
    }
  };

  return (
    <div
      data-testid="board"
      className="grid gap-px bg-[#0a1628]"
      style={{
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        width: 'min(calc(100vw - 1.5rem), 460px)',
        aspectRatio: `${BOARD_COLS} / ${BOARD_ROWS}`,
      }}
    >
      {board.map((row, r) =>
        row.map((unit, c) => (
          <BoardCell
            key={`${r}-${c}`}
            row={r}
            col={c}
            unit={unit}
            isHighlighted={isHighlighted(r, c)}
            isSelected={isSelectedUnit(unit)}
            onClick={handleCellClick}
          />
        ))
      )}
    </div>
  );
}
