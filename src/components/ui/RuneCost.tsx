interface Props {
  runes: number;
  balance?: number;
  size?: 'sm' | 'md';
}

export default function RuneCost({ runes, balance, size = 'md' }: Props) {
  const insufficient = balance !== undefined && balance < runes;
  const textClass = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={`font-bold ${textClass} ${insufficient ? 'text-red-400' : 'text-[#fbbf24]'}`}>
      💎 {runes.toLocaleString()}
    </span>
  );
}
