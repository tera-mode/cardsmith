'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'attack_motion' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

export function AttackMotion({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 100 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (effect.attackKind === 'melee' || reduceMotion) return null;

  if (!boardRef.current) return null;
  const from = getCellCenter(boardRef.current, effect.attacker);
  const to = getCellCenter(boardRef.current, effect.target);
  if (!from || !to) return null;

  const isCannon = effect.attackKind === 'ranged_cannon';
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <motion.div
      initial={{ x: from.x, y: from.y, opacity: 1 }}
      animate={{ x: to.x, y: to.y, opacity: 1 }}
      transition={{ duration: dur / 1000, ease: 'linear' }}
      style={{
        position: 'absolute',
        width: isCannon ? 14 : 22,
        height: isCannon ? 14 : 5,
        borderRadius: isCannon ? '50%' : 2,
        background: isCannon ? '#374151' : '#fbbf24',
        boxShadow: isCannon ? '0 0 10px #ef4444' : '0 0 6px #fbbf24',
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        pointerEvents: 'none',
      }}
    />
  );
}
