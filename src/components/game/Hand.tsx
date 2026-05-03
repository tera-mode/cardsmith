'use client';

import { Card, InteractionMode } from '@/lib/types/game';
import CardInHand from './CardInHand';
import { useGame } from '@/contexts/GameContext';

interface Props {
  hand: Card[];
  mode: InteractionMode;
  hasSummonedThisTurn: boolean;
  isPlayerTurn: boolean;
}

export default function Hand({ hand, mode, hasSummonedThisTurn, isPlayerTurn }: Props) {
  const { selectCard } = useGame();

  const selectedIndex = mode.type === 'card_selected' ? mode.cardIndex : -1;
  const canSummon = isPlayerTurn && !hasSummonedThisTurn;

  return (
    <div
      data-testid="hand"
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 px-3">
        <span className="text-xs text-gray-400">手札</span>
        <span className="text-xs text-gray-500">{hand.length}枚</span>
        {!canSummon && isPlayerTurn && (
          <span className="text-xs text-orange-400">（召喚済み）</span>
        )}
      </div>

      <div className="hand-scroll flex gap-2 px-3 pb-1 min-h-[7rem]">
        {hand.length === 0 ? (
          <div className="flex items-center text-xs text-gray-500 w-full justify-center">
            手札なし
          </div>
        ) : (
          hand.map((card, i) => (
            <CardInHand
              key={`${card.id}-${i}`}
              card={card}
              index={i}
              isSelected={selectedIndex === i}
              disabled={!canSummon}
              onClick={selectCard}
            />
          ))
        )}
      </div>
    </div>
  );
}
