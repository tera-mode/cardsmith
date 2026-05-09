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
  boardRef?: React.RefObject<HTMLElement | null>;
}

export default function Board({ board, mode, highlightedCells, onUnitLongPress, boardRef }: Props) {
  const { selectUnit, moveUnit, summonToCell, useSkill, cancel } = useGame();

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

    // 召喚モード：ハイライトマスで召喚 / 自ユニットタップで選択に切り替え / その他でキャンセル
    if (mode.type === 'card_selected') {
      if (isHighlighted(pos.row, pos.col)) {
        summonToCell(pos);
      } else if (unit && unit.owner === 'player') {
        selectUnit(unit);
      } else {
        cancel();
      }
      return;
    }

    // 移動モード：ハイライトされたマスにタップ → 移動
    if (mode.type === 'unit_moving') {
      if (isHighlighted(pos.row, pos.col)) moveUnit(pos);
      return;
    }

    // unit_selected: ハイライトセルをタップで直接移動 / 別ユニット選択 / 空セルでキャンセル
    if (mode.type === 'unit_selected') {
      if (isHighlighted(pos.row, pos.col)) {
        moveUnit(pos);
        return;
      }
      if (unit && unit.owner === 'player' && !unit.hasActedThisTurn &&
          unit.instanceId !== mode.unit.instanceId) {
        selectUnit(unit);
        return;
      }
      cancel();
      return;
    }

    // unit_post_move：移動後のメニュー表示中はボードへの操作を受け付けない
    if (mode.type === 'unit_post_move') return;

    // skill_targeting：ハイライトされたマスにタップ → スキル発動
    if (mode.type === 'skill_targeting') {
      if (isHighlighted(pos.row, pos.col)) useSkill(pos);
      else cancel();
      return;
    }

    // idle：プレイヤーのユニットを選択（バリデーションは selectUnit 内で行う）
    if (unit && unit.owner === 'player') {
      selectUnit(unit);
    }
  };

  return (
    <div
      data-testid="board"
      ref={boardRef as React.RefObject<HTMLDivElement>}
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
