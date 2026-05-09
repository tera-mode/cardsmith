'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'defeat' }>;
  onComplete: () => void;
}

export function DefeatEffect({ effect, onComplete }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 600 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  return (
    <motion.div
      data-testid="defeat-banner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48,
          fontWeight: 900,
          color: '#ef4444',
          textShadow: '0 4px 12px #000, 0 0 24px #ef444480',
          letterSpacing: '0.15em',
        }}
      >
        DEFEAT
      </motion.div>
    </motion.div>
  );
}
