'use client';

import { Unit } from '@/lib/types/game';
import { getEffectiveAtk } from '@/lib/game/helpers';

interface Props {
  unit: Unit;
  isSelected?: boolean;
}

export default function UnitToken({ unit, isSelected }: Props) {
  const isPlayer = unit.owner === 'player';
  const atk = getEffectiveAtk(unit);
  const hpPercent = Math.max(0, (unit.currentHp / (unit.maxHp + unit.buffs.auraMaxHp)) * 100);
  const imgSrc = `/images/chars/${unit.cardId}.png`;

  return (
    <div
      data-testid={`unit-${unit.instanceId}`}
      className={`unit-token unit-token--${isPlayer ? 'player' : 'enemy'}${unit.hasActedThisTurn ? ' unit-token--acted' : ''}`}
      style={{ position: 'absolute', inset: 2, overflow: 'hidden' }}
    >
      {/* HP バー（上部） */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 3,
        background: 'rgba(0,0,0,0.7)', borderRadius: '2px 2px 0 0', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${hpPercent}%`,
          background: hpPercent > 50
            ? 'linear-gradient(90deg, #6bd998, #4aaf78)'
            : hpPercent > 25
              ? 'linear-gradient(90deg, #ffd54a, #e8a93a)'
              : 'linear-gradient(90deg, #ff6b5b, #c83a28)',
          transition: 'width 0.3s',
        }} />
      </div>

      {/* キャラクター画像 */}
      <img
        src={imgSrc}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: 3,
          left: 0,
          right: 0,
          bottom: 14,
          width: '100%',
          height: 'calc(100% - 17px)',
          objectFit: 'cover',
          objectPosition: 'center 18%',
          display: 'block',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          pointerEvents: 'none',
        } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* ATK / HP（下部オーバーレイ） */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        display: 'flex', justifyContent: 'center', gap: 3,
        fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700,
        lineHeight: 1, paddingBottom: 2, paddingTop: 4,
      }}>
        <span style={{ color: '#ffb44a' }}>{atk}</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>/</span>
        <span style={{ color: '#6bd998' }}>{unit.currentHp}</span>
      </div>

      {/* スキル残数バッジ */}
      {unit.card.skill && unit.skillUsesRemaining !== 0 && (
        <div style={{
          position: 'absolute', top: 4, right: 1, zIndex: 4,
          background: 'rgba(196,120,255,0.9)',
          borderRadius: '0 2px 0 2px',
          padding: '0 2px',
          fontSize: 8,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: '11px',
        }}>
          {unit.skillUsesRemaining === 'infinite' ? '∞' : unit.skillUsesRemaining}
        </div>
      )}
    </div>
  );
}
