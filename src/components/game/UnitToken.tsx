'use client';

import { Unit } from '@/lib/types/game';

const UNIT_EMOJI: Record<string, string> = {
  militia:         '🪖',
  light_infantry:  '⚔️',
  assault_soldier: '🗡️',
  scout:           '🏃',
  spear_soldier:   '🔱',
  heavy_infantry:  '🛡️',
  combat_soldier:  '⚔️',
  archer:          '🏹',
  guard:           '🛡️',
  healer:          '✨',
  cavalry:         '🐎',
  cannon:          '💣',
  defender:        '🏰',
};

interface Props {
  unit: Unit;
  isSelected?: boolean;
}

export default function UnitToken({ unit, isSelected }: Props) {
  const isPlayer = unit.owner === 'player';
  const emoji = UNIT_EMOJI[unit.cardId] ?? '⚔️';
  const atk = unit.card.atk + unit.buffs.atkBonus;
  const hpPercent = Math.max(0, (unit.currentHp / unit.maxHp) * 100);

  return (
    <div
      data-testid={`unit-${unit.instanceId}`}
      className={`unit-token unit-token--${isPlayer ? 'player' : 'enemy'}${unit.hasActedThisTurn ? ' unit-token--acted' : ''}`}
      style={{ position: 'absolute', inset: 2 }}
    >
      {/* HP バー (上部) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
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

      {/* アイコン */}
      <span style={{ fontSize: 15, lineHeight: 1, marginTop: 3, display: 'block' }}>
        {emoji}
      </span>

      {/* ATK / HP */}
      <div style={{ display: 'flex', gap: 3, fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, marginTop: 1 }}>
        <span style={{ color: '#ffb44a' }}>{atk}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
        <span style={{ color: '#6bd998' }}>{unit.currentHp}</span>
      </div>

      {/* スキル残数バッジ */}
      {unit.card.skill && unit.skillUsesRemaining !== 0 && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          background: 'rgba(196,120,255,0.85)',
          borderRadius: '2px 0 2px 0',
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
