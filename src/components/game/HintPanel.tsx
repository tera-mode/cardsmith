'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';
import { BOARD_COLS } from '@/lib/game/rules';

interface Props {
  session: GameSession;
  mode: InteractionMode;
}

export default function HintPanel({ session, mode }: Props) {
  if (session.currentTurn !== 'player') return null;

  let hint = '';
  switch (mode.type) {
    case 'unit_moving':       hint = '🚶 移動先を選んでタップ'; break;
    case 'unit_selected':     hint = '移動・攻撃・スキルから選択'; break;
    case 'unit_post_move':    hint = '⚔ 攻撃か「行動終了」を選択'; break;
    case 'card_selected':     hint = '光ったマスにユニットを召喚！'; break;
    case 'skill_targeting':   hint = '✨ 対象マスをタップ（他のマスでキャンセル）'; break;
    case 'idle': {
      const hasFront = Array.from({ length: BOARD_COLS }, (_, c) => session.board[0]?.[c])
        .some(u => u?.owner === 'player' && !u.hasActedThisTurn);
      if (hasFront) hint = '⚔ 最前線からベース攻撃できます';
      else if (session.player.hand.length > 0 && !session.player.hasSummonedThisTurn)
        hint = '手札のカードをタップして召喚';
      else {
        const hasUnacted = session.board.some(row => row.some(c => c?.owner === 'player' && !c.hasActedThisTurn));
        if (hasUnacted) hint = '盤面のユニットをタップして行動';
      }
      if (session.turnCount === 1 && !hint) hint = '手札のカードをタップして召喚しよう';
      break;
    }
  }

  if (!hint) return null;

  return (
    <div style={{ padding: '3px 12px', flexShrink: 0 }}>
      <p style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.04em',
        background: 'rgba(8,6,4,0.6)',
        border: '1px solid var(--border-rune)',
        borderRadius: 3,
        padding: '3px 8px',
      }}>
        {hint}
      </p>
    </div>
  );
}
