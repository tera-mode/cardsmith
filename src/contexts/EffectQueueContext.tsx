'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameEffect, EffectId } from '@/lib/types/effects';

interface EffectQueueContextValue {
  activeEffects: GameEffect[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  push: (effects: any[] | any) => EffectId[];
  complete: (id: EffectId) => void;
  clear: () => void;
  reduceMotion: boolean;
}

const EffectQueueContext = createContext<EffectQueueContextValue | null>(null);

export function EffectQueueProvider({ children }: { children: React.ReactNode }) {
  const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const push = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (input: any[] | any): EffectId[] => {
      const arr = Array.isArray(input) ? input : [input];
      const withIds = arr.map(e => ({ ...e, id: uuidv4() } as GameEffect));
      setActiveEffects(prev => [...prev, ...withIds]);
      return withIds.map(e => e.id);
    },
    []
  );

  const complete = useCallback((id: EffectId) => {
    setActiveEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const clear = useCallback(() => {
    setActiveEffects([]);
  }, []);

  return (
    <EffectQueueContext.Provider value={{ activeEffects, push, complete, clear, reduceMotion }}>
      {children}
    </EffectQueueContext.Provider>
  );
}

export function useEffectQueue() {
  const ctx = useContext(EffectQueueContext);
  if (!ctx) throw new Error('useEffectQueue must be used within EffectQueueProvider');
  return ctx;
}

// GameContext 内から省略なしで呼べる安全版（Provider外でも動く）
export function useEffectQueueSafe() {
  return useContext(EffectQueueContext);
}
