'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { ATTRIBUTE_COLORS } from './particles/attribute-presets';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'death' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

export function DeathEffect({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 150 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (!boardRef.current) return null;
  const center = getCellCenter(boardRef.current, effect.position);
  if (!center) return null;

  const color = ATTRIBUTE_COLORS[effect.attribute ?? 'sei'].main;

  if (reduceMotion) return null;

  return (
    <div data-testid="effect-death" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* 中央爆散光 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2.8, opacity: 0 }}
        transition={{ duration: dur / 1000 * 0.7 }}
        style={{
          position: 'absolute',
          left: center.x - 36,
          top: center.y - 36,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${color} 40%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* 16個の放射粒子 */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 55 + (i % 3) * 15;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist + 30;
        return (
          <motion.div
            key={i}
            initial={{ x: center.x - 4, y: center.y - 4, opacity: 1, scale: 1 }}
            animate={{ x: center.x - 4 + dx, y: center.y - 4 + dy, opacity: 0, scale: 0.2 }}
            transition={{ duration: dur / 1000, ease: [0.2, 0.6, 0.4, 1.0] }}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}
