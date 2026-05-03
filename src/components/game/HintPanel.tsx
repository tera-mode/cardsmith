'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';
import { BOARD_COLS } from '@/lib/game/rules';

interface Props {
  session: GameSession;
  mode: InteractionMode;
}

export default function HintPanel({ session, mode }: Props) {
  const isPlayerTurn = session.currentTurn === 'player';
  if (!isPlayerTurn) return null;

  let hint = '';

  switch (mode.type) {
    case 'unit_moving':
      hint = '🚶 移動先を選んでタップ。その場に留まるなら下のボタンを押して。';
      break;
    case 'unit_selected':
      hint = '❓ 「移動する」「攻撃」「スキル」から選んでください。';
      break;
    case 'unit_post_move': {
      const hasAttackable = session.board.some((row) =>
        row.some((cell) => cell && cell.owner === 'player' && cell.instanceId === mode.unit.instanceId)
      );
      hint = hasAttackable
        ? '⚔ 攻撃するか「行動終了」を選んでください。'
        : '✅ 行動終了ボタンで次に進めます。';
      break;
    }
    case 'card_selected':
      hint = '📥 光ったマスをタップしてユニットを召喚！';
      break;
    case 'idle': {
      // 最前線のユニットがいる場合
      const frontRow = 0;
      let hasFrontUnit = false;
      for (let c = 0; c < BOARD_COLS; c++) {
        const unit = session.board[frontRow]?.[c];
        if (unit && unit.owner === 'player' && !unit.hasActedThisTurn) {
          hasFrontUnit = true;
          break;
        }
      }
      if (hasFrontUnit) {
        hint = '⚔ 最前線のユニットは「ベース攻撃」で敵陣HPを削れます！';
      } else if (session.player.hand.length > 0 && !session.player.hasSummonedThisTurn) {
        hint = '📥 手札のカードをタップして召喚できます。';
      } else {
        const hasUnacted = session.board.some((row) =>
          row.some((cell) => cell?.owner === 'player' && !cell.hasActedThisTurn)
        );
        if (hasUnacted) hint = '🎮 盤面のユニットをタップして行動させよう！';
      }
      if (session.turnCount === 1 && !hint) {
        hint = '📥 まず手札のカードをタップして召喚しよう！';
      }
      break;
    }
  }

  if (!hint) return null;

  return (
    <div className="px-3 py-1">
      <p className="text-[11px] text-[#94a3b8] bg-[#0f1a2e]/60 rounded px-2 py-1">
        💡 {hint}
      </p>
    </div>
  );
}
