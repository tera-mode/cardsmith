'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';

interface Props {
  session: GameSession;
  mode: InteractionMode;
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-display)', fontSize: 10,
      letterSpacing: '0.06em', fontWeight: 600,
      color: done ? 'var(--rune-green)' : active ? 'var(--gold)' : 'var(--text-dim)',
      transition: 'color 0.2s',
    }}>
      <span style={{ fontSize: 9 }}>{done ? '✓' : active ? '◆' : '◇'}</span>
      <span>{label}</span>
    </div>
  );
}

export default function TurnStepBar({ session, mode }: Props) {
  if (session.currentTurn !== 'player') return null;

  const summoned = session.player.hasSummonedThisTurn;
  const moved = session.player.hasMovedThisTurn;
  const attacked = session.board.some(row => row.some(cell => cell?.owner === 'player' && cell.hasActedThisTurn));

  const activeSummon = mode.type === 'card_selected';
  const activeMove = mode.type === 'unit_moving';
  const activeAttack = mode.type === 'unit_selected' || mode.type === 'unit_post_move';

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
      padding: '4px 12px',
      background: 'rgba(8,6,4,0.6)',
      borderTop: '1px solid var(--border-rune)',
      borderBottom: '1px solid var(--border-rune)',
    }}>
      <Step label="召喚" done={summoned} active={activeSummon && !summoned} />
      <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>—</span>
      <Step label="移動" done={moved} active={activeMove} />
      <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>—</span>
      <Step label="攻撃" done={attacked} active={activeAttack && !attacked} />
    </div>
  );
}
