'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { resolvePositionCenter } from '@/lib/effects/coords';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'damage_number' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

const KIND_COLOR: Record<string, string> = {
  damage: '#ef4444',
  heal: '#22c55e',
  block: '#94a3b8',
  miss: '#cbd5e1',
};

export function DamageNumber({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 400 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  const center = resolvePositionCenter(boardRef.current ?? null, effect.position);
  if (!center) return null;

  const color = KIND_COLOR[effect.kind] ?? '#fff';
  const text =
    effect.kind === 'block' ? 'BLOCK'
    : effect.kind === 'miss'  ? 'MISS'
    : effect.kind === 'heal'  ? `+${effect.value}`
    : `-${effect.value}`;

  const fontSize = effect.kind === 'damage' && effect.value >= 3 ? 28 : 22;
  // ランダムな横ブレ（コンポーネント生成時に固定）
  const jitter = useMemo(() => (Math.random() - 0.5) * 24, []);

  return (
    <motion.div
      data-testid="damage-number"
      initial={{ x: center.x + jitter, y: center.y, opacity: 0, scale: 0.6 }}
      animate={{
        x: center.x + jitter,
        y: center.y - 52,
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1.3, 1.0, 0.9],
      }}
      transition={{ duration: dur / 1000, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        fontFamily: 'var(--font-display)',
        fontSize,
        fontWeight: 800,
        color,
        textShadow: '0 2px 4px #000, 0 0 8px #000',
        translate: '-50% -50%',
        pointerEvents: 'none',
        zIndex: 120,
        userSelect: 'none',
      }}
    >
      {text}
    </motion.div>
  );
}
