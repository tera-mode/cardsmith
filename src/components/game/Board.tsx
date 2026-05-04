'use client';

import { BoardState, Position, Unit, InteractionMode } from '@/lib/types/game';
import BoardCell from './BoardCell';
import { useGame } from '@/contexts/GameContext';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';

interface Props {
  board: BoardState;
  mode: InteractionMode;
  highlightedCells: Position[];
  onUnitLongPress?: (unit: Unit) => void;
}

export default function Board({ board, mode, highlightedCells, onUnitLongPress }: Props) {
  const { selectUnit, moveUnit, summonToCell } = useGame();

  const isHighlighted = (row: number, col: number) =>
    highlightedCells.some((p) => p.row === row && p.col === col);

  const isSelectedUnit = (unit: Unit | null): boolean => {
    if (!unit) return false;
    if (
      mode.type === 'unit_selected' ||
      mode.type === 'unit_moving' ||
      mode.type === 'unit_post_move'
    ) {
      return mode.unit.instanceId === unit.instanceId;
    }
    return false;
  };

  const handleCellClick = (pos: Position) => {
    const unit = board[pos.row]?.[pos.col];

    // 召喚モード：ハイライトされたマスにタップ → 召喚
    if (mode.type === 'card_selected') {
      if (isHighlighted(pos.row, pos.col)) summonToCell(pos);
      return;
    }

    // 移動モード：ハイライトされたマスにタップ → 移動
    if (mode.type === 'unit_moving') {
      if (isHighlighted(pos.row, pos.col)) moveUnit(pos);
      return;
    }

    // unit_selected（アクション選択メニュー表示中）：
    // オーバーレイ背後なのでボードタップは基本的に cancel に流れるが、
    // 別のプレイヤーユニットを選び直す場合のみ処理
    if (mode.type === 'unit_selected') {
      if (unit && unit.owner === 'player' && !unit.hasActedThisTurn &&
          unit.instanceId !== mode.unit.instanceId) {
        selectUnit(unit);
      }
      return;
    }

    // unit_post_move：移動後のメニュー表示中はボードへの操作を受け付けない
    if (mode.type === 'unit_post_move') return;

    // idle：プレイヤーのユニットを選択
    if (unit && unit.owner === 'player' && !unit.hasActedThisTurn) {
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
            onLongPress={onUnitLongPress}
          />
        ))
      )}
    </div>
  );
}
