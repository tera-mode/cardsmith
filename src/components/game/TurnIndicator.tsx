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
      className="turn-indicator-dungeon"
    >
      <span className="turn-indicator-dungeon__count">
        TURN {turnCount}
      </span>
      <span className="turn-indicator-dungeon__turn" style={{
        color: isPlayer ? 'var(--rune-blue)' : 'var(--rune-red)',
        animation: isPlayer ? 'gold-pulse 2s ease-in-out infinite' : 'none',
      }}>
        {isPlayer ? '▶ あなたのターン' : '⏳ AIのターン...'}
      </span>
    </div>
  );
}
