'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'victory' }>;
  onComplete: () => void;
}

export function VictoryEffect({ effect, onComplete }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 800 : effect.durationMs;

  useEffect(() => {
    if (!reduceMotion) {
      import('canvas-confetti').then(mod => {
        const confetti = mod.default;
        const fire = (originX: number) => {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { x: originX, y: 0.65 },
            colors: ['#fde68a', '#fbbf24', '#ffffff', '#f59e0b'],
            startVelocity: 40,
            gravity: 1.0,
            ticks: 180,
            disableForReducedMotion: true,
            zIndex: 300,
          });
        };
        fire(0.15);
        fire(0.85);
        setTimeout(() => fire(0.5), 320);
      });
    }

    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete, reduceMotion]);

  return (
    <motion.div
      data-testid="victory-banner"
      initial={{ scale: 0, opacity: 0, y: 24 }}
      animate={{ scale: [0, 1.15, 1], opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 52,
        fontWeight: 900,
        color: '#fde68a',
        textShadow: '0 4px 12px #000, 0 0 24px #f59e0b, 0 0 48px #f59e0b60',
        letterSpacing: '0.1em',
      }}>
        VICTORY
      </div>
    </motion.div>
  );
}
