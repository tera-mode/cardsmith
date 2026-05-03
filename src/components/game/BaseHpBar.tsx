'use client';

import { BASE_HP } from '@/lib/game/decks';

interface Props {
  owner: 'player' | 'ai';
  hp: number;
  maxHp?: number;
}

export default function BaseHpBar({ owner, hp, maxHp = BASE_HP }: Props) {
  const isPlayer = owner === 'player';
  const percent = Math.max(0, (hp / maxHp) * 100);

  return (
    <div
      data-testid={isPlayer ? 'player-base-hp' : 'ai-base-hp'}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        isPlayer ? 'bg-[#1e3a5f]/80' : 'bg-[#3b1e1e]/80',
      ].join(' ')}
    >
      <span className="text-xs font-bold text-gray-400 w-12">
        {isPlayer ? '自陣' : 'AI陣地'}
      </span>

      {/* HP ハート（最大 maxHp 個） */}
      <div className="flex gap-1">
        {Array.from({ length: maxHp }).map((_, i) => (
          <span
            key={i}
            className={[
              'text-lg leading-none transition-all duration-300',
              i < hp
                ? (isPlayer ? 'text-[#3b82f6]' : 'text-[#ef4444]')
                : 'text-gray-700',
              hp === 1 && i === 0 ? 'animate-pulse' : '',
            ].join(' ')}
          >
            {i < hp ? '❤️' : '🖤'}
          </span>
        ))}
      </div>

      {/* HP数値 */}
      <span className={[
        'text-base font-bold ml-auto',
        isPlayer ? 'text-[#60a5fa]' : 'text-[#f87171]',
      ].join(' ')}>
        {hp}
      </span>

      {/* HPバー */}
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500',
            isPlayer ? 'bg-[#3b82f6]' : 'bg-[#ef4444]',
            percent <= 33 ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
