'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'turn_banner' }>;
  onComplete: () => void;
}

export function TurnBanner({ effect, onComplete }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 300 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  const isPlayer = effect.side === 'player';
  const color = isPlayer ? '#22c55e' : '#ef4444';
  const label = isPlayer ? 'YOUR TURN' : 'ENEMY TURN';

  return (
    <motion.div
      data-testid="turn-banner"
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: ['-100%', '0%', '0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur / 1000, times: [0, 0.2, 0.7, 1], ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        height: 72,
        background: isPlayer
          ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.25), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.25), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 800,
        color,
        textShadow: `0 2px 8px #000, 0 0 20px ${color}80`,
        letterSpacing: '0.12em',
      }}>
        {label}
      </div>
    </motion.div>
  );
}
