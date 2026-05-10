'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';

interface Props {
  session: GameSession;
  mode: InteractionMode;
  isFinished: boolean;
  onEndTurn: () => void;
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  const color = done ? '#4ade80' : active ? '#fde047' : '#e2d5b0';
  const icon  = done ? '✓' : active ? '◆' : '◇';
  const bg    = done
    ? 'rgba(34,197,94,0.12)'
    : active
    ? 'rgba(253,224,71,0.14)'
    : 'rgba(226,213,176,0.08)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-display)', fontSize: 12,
      letterSpacing: '0.05em', fontWeight: 700,
      color,
      background: bg,
      border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : active ? 'rgba(253,224,71,0.4)' : 'rgba(226,213,176,0.2)'}`,
      borderRadius: 5,
      padding: '3px 8px',
      transition: 'all 0.2s',
      filter: active ? 'drop-shadow(0 0 5px rgba(253,224,71,0.5))' : 'none',
    }}>
      <span style={{ fontSize: 10 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function TurnStepBar({ session, mode, isFinished, onEndTurn }: Props) {
  const isPlayerTurn = session.currentTurn === 'player';

  const summoned    = session.player.hasSummonedThisTurn;
  const moved       = session.player.hasMovedThisTurn;
  const actionsUsed = session.player.actionsUsedThisTurn;
  const attacked    = actionsUsed >= 2;

  const activeSummon = mode.type === 'card_selected';
  const activeMove   = mode.type === 'unit_moving';
  const activeAttack = mode.type === 'unit_selected' || mode.type === 'unit_post_move';

  if (!isPlayerTurn || isFinished) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 12px',
        background: 'rgba(8,6,4,0.8)',
        borderTop: '1px solid var(--border-rune)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          color: 'var(--text-secondary)', letterSpacing: '0.06em',
        }}>
          {isFinished
            ? (session.winner === 'player' ? '🏆 勝利！' : session.winner === 'ai' ? '💀 敗北...' : '⚖ 引き分け')
            : '⏳ AI思考中...'}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="turn-indicator"
      style={{
        display: 'flex', alignItems: 'center',
        padding: '6px 10px',
        gap: 6,
        background: 'rgba(8,6,4,0.8)',
        borderTop: '1px solid var(--border-rune)',
      }}
    >
      {/* ステップインジケーター */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
        <Step label="召喚" done={summoned} active={activeSummon && !summoned} />
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>›</span>
        <Step label="移動" done={moved}    active={activeMove} />
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>›</span>
        <Step label={`攻撃 ${actionsUsed}/2`} done={attacked} active={activeAttack && !attacked} />
      </div>

      {/* ターン終了ボタン */}
      <button
        data-testid="end-turn-button"
        onClick={onEndTurn}
        style={{
          flexShrink: 0,
          padding: '6px 12px',
          background: 'linear-gradient(180deg, rgba(40,28,12,0.95) 0%, rgba(20,14,6,0.95) 100%)',
          border: '1px solid var(--theme-color, #c08840)',
          borderRadius: 6,
          color: 'var(--theme-color, #fde68a)',
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 10px var(--theme-glow, rgba(192,136,64,0.3))',
          minHeight: 36,
        }}
      >
        ターン終了
      </button>
    </div>
  );
}
