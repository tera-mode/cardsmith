'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { useEffectQueue } from '@/contexts/EffectQueueContext';

interface Props {
  effect: Extract<GameEffect, { type: 'skill_proc' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement | null>;
}

const HINT_CONFIG = {
  heal:    { color: '#22c55e', symbol: '✚', label: 'HEAL' },
  buff:    { color: '#f59e0b', symbol: '▲', label: 'BUFF' },
  debuff:  { color: '#a855f7', symbol: '▼', label: 'DEBUFF' },
  aoe:    { color: '#ef4444', symbol: '◎', label: 'AOE' },
  generic: { color: '#7dd3fc', symbol: '✦', label: 'SKILL' },
} as const;

export function SkillProcEffect({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 200 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (!boardRef.current) return null;
  const center = getCellCenter(boardRef.current, effect.source);
  if (!center) return null;

  const cfg = HINT_CONFIG[effect.visualHint ?? 'generic'];

  if (reduceMotion) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* 発動源のリング */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.4, 1.0], opacity: [0, 1, 0] }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: center.x - 28,
          top: center.y - 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: `2px solid ${cfg.color}`,
          boxShadow: `0 0 16px ${cfg.color}`,
        }}
      />
      {/* シンボル + ラベル */}
      <motion.div
        initial={{ y: center.y, opacity: 0, scale: 0.6 }}
        animate={{ y: center.y - 40, opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: center.x,
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          color: cfg.color,
          textShadow: '0 1px 4px #000',
          translate: '-50% -50%',
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.symbol} {cfg.label}
      </motion.div>
      {/* 対象へのビーム（ターゲットがある場合） */}
      {effect.targets?.map((tgt, i) => {
        if (!boardRef.current) return null;
        const tgtCenter = getCellCenter(boardRef.current, tgt);
        if (!tgtCenter) return null;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.2, 0.8], opacity: [0, 0.8, 0] }}
            transition={{ duration: dur / 1000 * 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: tgtCenter.x - 16,
              top: tgtCenter.y - 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.color}99 0%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}
