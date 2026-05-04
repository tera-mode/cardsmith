'use client';

import { Card } from '@/lib/types/game';
import { useLongPress } from '@/hooks/useLongPress';

// カードのサブテキスト（移動方法の補足）
const CARD_HINT: Record<string, string> = {
  scout: '2マスジャンプ',
  archer: '射程2・貫通',
  healer: '回復・無限',
  cavalry: '2マス・強化',
  cannon: '射程4・大貫通',
  defender: '8方向・反撃',
  guard: '4方向移動',
};

const CARD_EMOJI: Record<string, string> = {
  militia: '🪖',
  light_infantry: '⚔️',
  assault_soldier: '🗡️',
  scout: '🏃',
  spear_soldier: '🔱',
  heavy_infantry: '🛡️',
  combat_soldier: '⚔️',
  archer: '🏹',
  guard: '🛡️',
  healer: '✨',
  cavalry: '🐴',
  cannon: '💣',
  defender: '🏰',
};

interface Props {
  card: Card;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onClick: (index: number) => void;
  onLongPress?: (card: Card) => void;
}

export default function CardInHand({ card, index, isSelected, disabled, onClick, onLongPress }: Props) {
  const emoji = CARD_EMOJI[card.id] ?? '⚔️';
  const { start, cancel, didFire } = useLongPress(() => {
    if (onLongPress) onLongPress(card);
  }, 450);

  return (
    <button
      data-testid={`card-${card.id}-${index}`}
      onClick={() => { if (didFire.current) { didFire.current = false; return; } if (!disabled) onClick(index); }}
      onMouseDown={start}
      onMouseUp={cancel}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      disabled={disabled}
      className={[
        'relative flex-shrink-0 flex flex-col items-center rounded-lg border-2',
        'transition-all duration-150 select-none scroll-snap-align-start',
        'w-20 h-28',
        isSelected
          ? 'border-[#f59e0b] bg-[#1e3a5f] -translate-y-2 shadow-lg shadow-[#f59e0b]/30'
          : 'border-[#3b82f6]/50 bg-[#16213e]',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95',
      ].join(' ')}
    >
      {/* コスト */}
      <div className="absolute top-1 right-1 text-[10px] font-bold text-[#f59e0b] bg-[#0f1a2e] rounded px-1">
        {card.cost}
      </div>

      {/* 絵文字 */}
      <div className="text-2xl mt-4">{emoji}</div>

      {/* カード名 */}
      <div className="text-[10px] text-center text-white font-medium mt-1 px-1 leading-tight">
        {card.name}
      </div>

      {/* サブヒント（特殊移動など） */}
      {CARD_HINT[card.id] && (
        <div className="text-[8px] text-center text-[#94a3b8] px-1 leading-tight">
          {CARD_HINT[card.id]}
        </div>
      )}

      {/* ATK / HP */}
      <div className="flex gap-2 text-[10px] mt-auto mb-1">
        <span className="text-[#60a5fa]">⚔{card.atk}</span>
        <span className="text-green-400">❤{card.hp}</span>
      </div>

      {/* スキル有りインジケーター */}
      {card.skill && (
        <div className="absolute bottom-0.5 left-0.5 text-[9px] text-purple-400">★</div>
      )}
    </button>
  );
}
