'use client';

import { Card } from '@/lib/types/game';
import { useLongPress } from '@/hooks/useLongPress';
import { getCardRarity } from '@/lib/data/cards';
import { RARITY_COLORS } from '@/lib/types/meta';

const RARITY_CSS: Record<string, string> = {
  C: 'var(--rarity-c)', R: 'var(--rarity-r)', SR: 'var(--rarity-sr)', SSR: 'var(--rarity-ssr)',
};

// 属性ごとのカラーオーバーレイ
const ATTR_TINT: Record<string, string> = {
  sei:  'rgba(212,175,55,0.25)',
  mei:  'rgba(74,26,74,0.35)',
  shin: 'rgba(58,122,58,0.30)',
  en:   'rgba(138,32,32,0.35)',
  sou:  'rgba(42,90,138,0.30)',
  kou:  'rgba(46,230,255,0.20)',
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
  const rarity = getCardRarity(card.id);
  const rarityColor = RARITY_CSS[rarity] ?? 'var(--rarity-c)';
  const tint = ATTR_TINT[card.attribute ?? ''] ?? 'rgba(0,0,0,0.2)';

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

      {/* アートエリア — キャラクター画像 */}
      <div className="dungeon-card__art" style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* 属性カラーオーバーレイ */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: tint,
          pointerEvents: 'none',
        }} />
        {/* キャラクター画像 */}
        <img
          src={`/images/chars/${card.id}.png`}
          alt={card.name}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
            display: 'block',
            userSelect: 'none',
          }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
            // フォールバック: 背景色表示のみ
          }}
        />
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
