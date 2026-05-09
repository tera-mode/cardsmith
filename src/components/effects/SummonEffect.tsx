'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { ATTRIBUTE_COLORS } from './particles/attribute-presets';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'summon' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

export function SummonEffect({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 150 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (!boardRef.current) return null;
  const target = getCellCenter(boardRef.current, effect.to);
  if (!target) return null;

  const color = ATTRIBUTE_COLORS[effect.attribute ?? 'sei'].main;

  if (reduceMotion) return null;

  return (
    <div data-testid="effect-summon" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* 魔法陣リング */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1.6, opacity: [0, 0.9, 0] }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: target.x - 36,
          top: target.y - 36,
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}`,
          pointerEvents: 'none',
        }}
      />
      {/* 中央閃光 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 0], opacity: [0, 0.85, 0] }}
        transition={{ duration: dur / 1000 * 0.7, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: target.x - 20,
          top: target.y - 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}ff 0%, ${color}00 70%)`,
          pointerEvents: 'none',
        }}
      />
      {/* 放射粒子 × 8 */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dx = Math.cos(angle) * 55;
        const dy = Math.sin(angle) * 55;
        return (
          <motion.div
            key={i}
            initial={{ x: target.x - 3, y: target.y - 3, opacity: 1, scale: 1 }}
            animate={{ x: target.x - 3 + dx, y: target.y - 3 + dy, opacity: 0, scale: 0.3 }}
            transition={{ duration: dur / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}
