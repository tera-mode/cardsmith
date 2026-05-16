'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';
import { BOARD_COLS } from '@/lib/game/rules';

interface Props {
  session: GameSession;
  mode: InteractionMode;
  questId?: string;
}

export default function HintPanel({ session, mode, questId }: Props) {
  if (session.currentTurn !== 'player') return null;

  const isStory04 = questId === 'story_0_4';
  const isStory = !!questId?.startsWith('story_');

  let hint = '';
  let isImportant = false;

  switch (mode.type) {
    case 'unit_moving':
      hint = '🚶 移動先のマスをタップ'; break;
    case 'unit_selected':
      hint = '移動・攻撃・スキルを選択してください'; break;
    case 'unit_post_move':
      hint = '⚔ 攻撃するか「ターン終了」を押してください'; break;
    case 'card_selected':
      hint = '✨ 光ったマスにユニットを召喚！'; isImportant = true; break;
    case 'skill_targeting':
      hint = '🎯 対象マスをタップ（別のマスでキャンセル）'; break;
    case 'idle': {
      const hasFront = Array.from({ length: BOARD_COLS }, (_, c) => session.board[0]?.[c])
        .some(u => u?.owner === 'player');
      const actionsLeft = 2 - session.player.actionsUsedThisTurn;
      const hasUnits = session.board.some(row => row.some(c => c?.owner === 'player'));
      const hasHand = session.player.hand.length > 0;

      if (session.turnCount === 1 && hasHand && !session.player.hasSummonedThisTurn) {
        hint = '👆 手札のカードをタップして召喚しよう！'; isImportant = true;
      } else if (hasHand && !session.player.hasSummonedThisTurn) {
        hint = '👆 手札のカードをタップして召喚';
      } else if (hasFront && actionsLeft > 0) {
        hint = `⚔ 最前列のユニットから敵陣地を直接攻撃！（残り${actionsLeft}回）`;
        isImportant = true;
      } else if (hasUnits && !session.player.hasSummonedThisTurn) {
        hint = isStory04
          ? '👆 ユニットをタップ → 前進 → 敵陣地（上の赤ゲージ）を0にしよう！'
          : '👆 盤面のユニットをタップして行動';
        if (isStory04) isImportant = true;
      } else if (hasUnits) {
        hint = isStory
          ? '⏩ ユニットをタップして行動するか「ターン終了」を押してください'
          : '⏩ 行動するか「ターン終了」を押してください';
      } else {
        hint = '⏩ 「ターン終了」を押してAIのターンへ';
      }
      break;
    }
  }

  if (!hint) return null;

  return (
    <div style={{ padding: '4px 12px', flexShrink: 0 }}>
      <p style={{
        fontSize: 12,
        color: isImportant ? '#f0d080' : 'rgba(200,180,140,0.85)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.04em',
        background: isImportant ? 'rgba(60,40,0,0.75)' : 'rgba(8,6,4,0.65)',
        border: `1px solid ${isImportant ? 'rgba(212,175,55,0.6)' : 'var(--border-rune)'}`,
        borderRadius: 4,
        padding: '4px 10px',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        {hint}
      </p>
    </div>
  );
}
