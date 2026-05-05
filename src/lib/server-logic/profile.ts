import { PlayerProfile } from '@/lib/types/meta';
import { getLevelFromExp, getExpToNextLevel, INITIAL_PROFILE } from '@/lib/data/economy';

export function createInitialProfile(userId: string): PlayerProfile {
  const now = Date.now();
  return {
    userId,
    ...INITIAL_PROFILE,
    createdAt: now,
    updatedAt: now,
  };
}

export function addExp(
  profile: PlayerProfile,
  amount: number
): { profile: PlayerProfile; leveledUp: boolean; levelsGained: number } {
  const oldLevel = profile.level;
  const newExp = profile.exp + amount;
  const newLevel = getLevelFromExp(newExp);
  return {
    profile: { ...profile, exp: newExp, level: newLevel, updatedAt: Date.now() },
    leveledUp: newLevel > oldLevel,
    levelsGained: newLevel - oldLevel,
  };
}

export function addRunes(profile: PlayerProfile, amount: number): PlayerProfile {
  return { ...profile, runes: profile.runes + amount, updatedAt: Date.now() };
}

export function consumeRunes(profile: PlayerProfile, amount: number): PlayerProfile | null {
  if (profile.runes < amount) return null;
  return { ...profile, runes: profile.runes - amount, updatedAt: Date.now() };
}

export function getExpProgress(profile: PlayerProfile): { current: number; required: number; pct: number } {
  const required = getExpToNextLevel(profile.level);
  let current = profile.exp;
  let lv = 1;
  while (lv < profile.level) {
    current -= getExpToNextLevel(lv);
    lv++;
  }
  current = Math.max(0, current);
  return { current, required, pct: Math.min(1, current / required) };
}
