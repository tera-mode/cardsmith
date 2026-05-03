'use client';

import { Unit } from '@/lib/types/game';

const UNIT_EMOJI: Record<string, string> = {
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
      className={[
        'relative w-full h-full flex flex-col items-center justify-center rounded select-none',
        isPlayer ? 'bg-[#1e3a5f] border-2 border-[#3b82f6]' : 'bg-[#3b1e1e] border-2 border-[#ef4444]',
        isSelected ? 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-[#0f3460]' : '',
        unit.hasActedThisTurn ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* HP バー */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 rounded-t">
        <div
          className="h-full rounded-t transition-all duration-300"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>

      {/* 絵文字 */}
      <span className="text-base leading-none mt-1">{emoji}</span>

      {/* ATK / HP */}
      <div className="flex gap-1 text-[9px] leading-none mt-0.5">
        <span className={isPlayer ? 'text-[#60a5fa]' : 'text-[#f87171]'}>
          {atk}
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-green-400">{unit.currentHp}</span>
      </div>

      {/* スキル残回数 */}
      {unit.card.skill && unit.skillUsesRemaining !== 0 && (
        <div className="absolute bottom-0 right-0 text-[8px] leading-none bg-purple-700 px-0.5 rounded-bl rounded-tr text-white">
          {unit.skillUsesRemaining === 'infinite' ? '∞' : unit.skillUsesRemaining}
        </div>
      )}
    </div>
  );
}
