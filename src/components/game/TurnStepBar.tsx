'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';

interface Props {
  session: GameSession;
  mode: InteractionMode;
  isFinished: boolean;
  onEndTurn: () => void;
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  const color = done ? '#22c55e' : active ? '#f8d878' : 'rgba(255,255,255,0.28)';
  const icon  = done ? '✓' : active ? '◆' : '◇';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-display)', fontSize: 11,
      letterSpacing: '0.06em', fontWeight: 700,
      color,
      transition: 'color 0.2s',
      filter: active ? 'drop-shadow(0 0 4px rgba(248,216,120,0.6))' : 'none',
    }}>
      <span style={{ fontSize: 10 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function TurnStepBar({ session, mode, isFinished, onEndTurn }: Props) {
  const isPlayerTurn = session.currentTurn === 'player';

  const summoned = session.player.hasSummonedThisTurn;
  const moved    = session.player.hasMovedThisTurn;
  const attacked = session.board.some(row => row.some(cell => cell?.owner === 'player' && cell.hasActedThisTurn));

  const activeSummon = mode.type === 'card_selected';
  const activeMove   = mode.type === 'unit_moving';
  const activeAttack = mode.type === 'unit_selected' || mode.type === 'unit_post_move';

  // 終了状態・AIターン中はシンプルな1行のみ
  if (!isPlayerTurn || isFinished) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 12px',
        background: 'rgba(8,6,4,0.75)',
        borderTop: '1px solid var(--border-rune)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          color: 'var(--text-dim)', letterSpacing: '0.06em',
        }}>
          {isFinished
            ? (session.winner === 'player' ? '🏆 勝利！' : session.winner === 'ai' ? '💀 敗北...' : '⚖ 引き分け')
            : '⏳ AI思考中...'}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '5px 10px',
      gap: 6,
      background: 'rgba(8,6,4,0.75)',
      borderTop: '1px solid var(--border-rune)',
    }}>
      {/* ステップインジケーター */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <Step label="召喚" done={summoned} active={activeSummon && !summoned} />
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>—</span>
        <Step label="移動" done={moved}    active={activeMove} />
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>—</span>
        <Step label="攻撃" done={attacked} active={activeAttack && !attacked} />
      </div>

      {/* ターン終了ボタン（コンパクト） */}
      <button
        data-testid="end-turn-button"
        onClick={onEndTurn}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          background: 'linear-gradient(180deg, #5a3a10 0%, #2a1a06 100%)',
          border: '1px solid #a07030',
          borderRadius: 6,
          color: '#f8d878',
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 8px rgba(160,112,48,0.3)',
          minHeight: 36,
        }}
      >
        ⚔ 終了
      </button>
    </div>
  );
}
