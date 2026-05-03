'use client';

import { GameSession, InteractionMode } from '@/lib/types/game';

interface Props {
  session: GameSession;
  mode: InteractionMode;
}

interface StepProps {
  label: string;
  done: boolean;
  active: boolean;
}

function Step({ label, done, active }: StepProps) {
  return (
    <div className={[
      'flex items-center gap-1 text-[11px] font-medium transition-colors',
      done ? 'text-green-400' : active ? 'text-yellow-300' : 'text-gray-600',
    ].join(' ')}>
      <span>{done ? '✓' : active ? '●' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

export default function TurnStepBar({ session, mode }: Props) {
  if (session.currentTurn !== 'player') return null;

  const summoned = session.player.hasSummonedThisTurn;
  const moved = session.player.hasMovedThisTurn;
  const attacked = session.board.some((row) =>
    row.some((cell) => cell?.owner === 'player' && cell.hasActedThisTurn)
  );

  const activeSummon = mode.type === 'card_selected';
  const activeMove = mode.type === 'unit_moving';
  const activeAttack = mode.type === 'unit_selected' || mode.type === 'unit_post_move';

  return (
    <div className="flex justify-center gap-4 px-3 py-0.5">
      <Step label="召喚" done={summoned} active={activeSummon && !summoned} />
      <span className="text-gray-700 text-[10px] self-center">—</span>
      <Step label="移動" done={moved} active={activeMove} />
      <span className="text-gray-700 text-[10px] self-center">—</span>
      <Step label="攻撃" done={attacked} active={activeAttack && !attacked} />
    </div>
  );
}
