'use client';

interface Props {
  currentTurn: 'player' | 'ai';
  turnCount: number;
}

export default function TurnIndicator({ currentTurn, turnCount }: Props) {
  const isPlayer = currentTurn === 'player';

  return (
    <div
      data-testid="turn-indicator"
      className={[
        'flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-bold',
        isPlayer ? 'bg-[#1e3a5f]/60 text-[#60a5fa]' : 'bg-[#3b1e1e]/60 text-[#f87171]',
      ].join(' ')}
    >
      <span>ターン {turnCount}</span>
      <span className="flex items-center gap-1">
        {isPlayer ? '▶ あなたのターン' : '⏳ AIのターン...'}
      </span>
    </div>
  );
}
