'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'hit' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

export function HitEffect({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 100 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (!boardRef.current) return null;
  const center = getCellCenter(boardRef.current, effect.target);
  if (!center) return null;

  if (reduceMotion) return null;

  return (
    <div data-testid="effect-hit" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* 円形閃光 */}
      <motion.div
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: center.x - 28,
          top: center.y - 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, #fbbf24 40%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* 十字スパーク */}
      {[0, 45, 90, 135].map(deg => (
        <motion.div
          key={deg}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: dur / 1000 * 0.8, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: center.x - 1,
            top: center.y - 18,
            width: 2,
            height: 36,
            background: 'rgba(255,255,255,0.9)',
            transformOrigin: '50% 100%',
            transform: `rotate(${deg}deg)`,
            boxShadow: '0 0 6px #fff',
          }}
        />
      ))}
      {/* クリティカル追加リング */}
      {effect.isCritical && (
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: dur / 1000 * 1.2 }}
          style={{
            position: 'absolute',
            left: center.x - 32,
            top: center.y - 32,
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid #fbbf24',
            boxShadow: '0 0 16px #fbbf24',
          }}
        />
      )}
    </div>
  );
}
