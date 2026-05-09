'use client';

import { motion } from 'motion/react';
import { BASE_HP } from '@/lib/game/decks';

interface Props {
  owner: 'player' | 'ai';
  hp: number;
  maxHp?: number;
}

function Heart({ active, isPlayer }: { active: boolean; isPlayer: boolean }) {
  const color = active ? (isPlayer ? '#5db8ff' : '#e85a4a') : '#2a2218';
  const glow = active ? (isPlayer ? '0 0 4px rgba(93,184,255,0.7)' : '0 0 4px rgba(232,90,74,0.7)') : 'none';
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={{ filter: active ? `drop-shadow(${isPlayer ? '0 0 3px #5db8ff' : '0 0 3px #e85a4a'})` : 'grayscale(1) opacity(0.3)' }}>
      <path
        d="M12 21s-7-4.5-9-9.5C1.5 7 5 3 8.5 3c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2C19 3 22.5 7 21 11.5c-2 5-9 9.5-9 9.5z"
        fill={active ? (isPlayer ? '#5db8ff' : '#e85a4a') : '#2a1810'}
        stroke={active ? (isPlayer ? '#8ecfff' : '#ff8a78') : '#3a2a20'}
        strokeWidth="1"
      />
    </svg>
  );
}

export default function BaseHpBar({ owner, hp, maxHp = BASE_HP }: Props) {
  const isPlayer = owner === 'player';
  const percent = Math.max(0, (hp / maxHp) * 100);
  const cls = `hp-bar-dungeon hp-bar-dungeon--${isPlayer ? 'player' : 'enemy'}`;

  return (
    <div
      data-testid={isPlayer ? 'player-base-hp' : 'ai-base-hp'}
      className={cls}
    >
      <span className="hp-bar-dungeon__label">
        {isPlayer ? '自陣' : 'AI陣地'}
      </span>

      <div className="hp-bar-dungeon__hearts">
        {Array.from({ length: maxHp }).map((_, i) => (
          <Heart key={i} active={i < hp} isPlayer={isPlayer} />
        ))}
      </div>

      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
        color: isPlayer ? 'var(--rune-blue)' : 'var(--rune-red)',
        minWidth: 14, textAlign: 'center', flexShrink: 0,
      }}>
        {hp}
      </span>

      <div className="hp-bar-dungeon__track">
        <motion.div
          className="hp-bar-dungeon__fill"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
