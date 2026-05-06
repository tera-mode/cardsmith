import { Rarity } from '@/lib/types/meta';

const RARITY_CSS: Record<Rarity, string> = {
  C: 'var(--rarity-c)',
  R: 'var(--rarity-r)',
  SR: 'var(--rarity-sr)',
  SSR: 'var(--rarity-ssr)',
};

interface Props {
  rarity: Rarity;
  size?: 'xs' | 'sm';
}

export default function RarityBadge({ rarity, size = 'sm' }: Props) {
  const color = RARITY_CSS[rarity];
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: size === 'xs' ? 9 : 10,
      fontWeight: 700,
      color,
      border: `1px solid ${color}`,
      borderRadius: 3,
      padding: '1px 5px',
      lineHeight: 1.4,
      letterSpacing: '0.04em',
    }}>
      {rarity}
    </span>
  );
}
