'use client';

import { Card } from '@/lib/types/game';
import { useLongPress } from '@/hooks/useLongPress';
import { getCardRarity } from '@/lib/data/cards';
import { RARITY_COLORS } from '@/lib/types/meta';

const CARD_EMOJI: Record<string, string> = {
  militia: '🪖', light_infantry: '⚔️', assault_soldier: '🗡️', scout: '🏃',
  spear_soldier: '🔱', heavy_infantry: '🛡️', combat_soldier: '⚔️',
  archer: '🏹', guard: '🛡️', healer: '✨', cavalry: '🐎', cannon: '💣', defender: '🏰',
};

const RARITY_CSS: Record<string, string> = {
  C: 'var(--rarity-c)', R: 'var(--rarity-r)', SR: 'var(--rarity-sr)', SSR: 'var(--rarity-ssr)',
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
  const rarity = getCardRarity(card.id);
  const rarityColor = RARITY_CSS[rarity] ?? 'var(--rarity-c)';

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
      className={`dungeon-card${isSelected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
      style={{ width: 80, height: 112, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* コストバッジ */}
      <div className="dungeon-card__cost">{card.cost}</div>

      {/* レアリティバッジ */}
      <div className="dungeon-card__rarity" style={{ color: rarityColor, borderColor: rarityColor }}>
        {rarity}
      </div>

      {/* アートエリア */}
      <div className="dungeon-card__art" style={{ width: '100%' }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
      </div>

      {/* カード名 */}
      <div className="dungeon-card__name">{card.name}</div>

      {/* ATK / HP */}
      <div className="dungeon-card__stats">
        <span className="dungeon-card__atk">⚔{card.atk}</span>
        <span className="dungeon-card__hp">♥{card.hp}</span>
      </div>

      {/* スキルバッジ */}
      {card.skill && (
        <div style={{
          position: 'absolute', bottom: 2, left: 2,
          fontSize: 9, color: 'var(--rarity-sr)',
          fontFamily: 'var(--font-display)', fontWeight: 700,
        }}>★</div>
      )}
    </button>
  );
}
