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
  const turnLabel = `TURN ${effect.turnCount}`;

  return (
    <motion.div
      data-testid="turn-banner"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.85, 1, 1, 1, 0.92] }}
      transition={{ duration: dur / 1000, times: [0, 0.12, 0.5, 0.82, 1], ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        top: '38%',
        left: 0,
        right: 0,
        height: 88,
        background: isPlayer
          ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.22), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.22), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        zIndex: 150,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        fontWeight: 700,
        color,
        opacity: 0.8,
        letterSpacing: '0.2em',
        textShadow: `0 1px 6px #000`,
      }}>
        {turnLabel}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 34,
        fontWeight: 800,
        color,
        textShadow: `0 2px 10px #000, 0 0 24px ${color}90`,
        letterSpacing: '0.12em',
        lineHeight: 1,
      }}>
        {label}
      </div>
    </motion.div>
  );
}
