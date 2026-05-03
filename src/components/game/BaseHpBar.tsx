'use client';

interface Props {
  owner: 'player' | 'ai';
  hp: number;
  maxHp?: number;
}

export default function BaseHpBar({ owner, hp, maxHp = 20 }: Props) {
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

      {/* HP ハート表示（最大5個） */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const threshold = (i + 1) * (maxHp / 5);
          const filled = hp >= threshold;
          const partial = hp > threshold - maxHp / 5 && hp < threshold;
          return (
            <span
              key={i}
              className={[
                'text-sm transition-all duration-300',
                filled ? (isPlayer ? 'text-[#3b82f6]' : 'text-[#ef4444]') : 'text-gray-600',
              ].join(' ')}
            >
              {filled ? '❤️' : partial ? '🩶' : '🖤'}
            </span>
          );
        })}
      </div>

      {/* 数値バー */}
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500',
            isPlayer ? 'bg-[#3b82f6]' : 'bg-[#ef4444]',
            percent <= 25 ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className={[
        'text-sm font-bold w-8 text-right',
        isPlayer ? 'text-[#60a5fa]' : 'text-[#f87171]',
      ].join(' ')}>
        {hp}
      </span>
    </div>
  );
}
