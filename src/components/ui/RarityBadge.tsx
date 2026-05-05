import { Rarity, RARITY_COLORS } from '@/lib/types/meta';

interface Props {
  rarity: Rarity;
  size?: 'xs' | 'sm';
}

export default function RarityBadge({ rarity, size = 'sm' }: Props) {
  const color = RARITY_COLORS[rarity];
  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  return (
    <span
      className={`${textSize} font-bold px-1 py-0.5 rounded`}
      style={{ color, border: `1px solid ${color}`, lineHeight: 1 }}
    >
      {rarity}
    </span>
  );
}
