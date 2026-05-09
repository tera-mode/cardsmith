import { Position } from '@/lib/types/game';

export function getCellRect(boardEl: HTMLElement, pos: Position): DOMRect | null {
  const cell = boardEl.querySelector(`[data-testid="cell-${pos.row}-${pos.col}"]`);
  if (!cell) return null;
  return cell.getBoundingClientRect();
}

export function getCellCenter(boardEl: HTMLElement, pos: Position): { x: number; y: number } | null {
  const rect = getCellRect(boardEl, pos);
  if (!rect) return null;
  const boardRect = boardEl.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2,
  };
}

export function resolvePositionCenter(
  boardEl: HTMLElement | null,
  position: Position | { side: 'player' | 'ai' },
): { x: number; y: number } | null {
  if (!boardEl) return null;
  if ('side' in position) {
    const boardRect = boardEl.getBoundingClientRect();
    return {
      x: boardRect.width / 2,
      y: position.side === 'ai' ? 20 : boardRect.height - 20,
    };
  }
  return getCellCenter(boardEl, position);
}
