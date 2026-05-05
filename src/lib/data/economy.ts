import { Rarity } from '@/lib/types/meta';

// ─── EXP テーブル（次レベルまでの必要EXP）────────────────────────────────────

export const EXP_TO_NEXT_LEVEL: Record<number, number> = {
  1: 100,
  2: 150,
  3: 200,
  4: 250,
  5: 300,
  6: 400,
  7: 500,
  8: 600,
  9: 700,
  10: 800,
  11: 1000,
  12: 1200,
  13: 1400,
  14: 1600,
  15: 1800,
};

export function getExpToNextLevel(level: number): number {
  if (level <= 15) return EXP_TO_NEXT_LEVEL[level] ?? 1800;
  return 1800 + (level - 15) * 200;
}

export function getLevelFromExp(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= getExpToNextLevel(level)) {
    remaining -= getExpToNextLevel(level);
    level++;
    if (level >= 99) break;
  }
  return level;
}

export function getExpInCurrentLevel(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= getExpToNextLevel(level)) {
    remaining -= getExpToNextLevel(level);
    level++;
    if (level >= 99) break;
  }
  return remaining;
}

// ─── レベル別カード生成コスト上限 ─────────────────────────────────────────────

export const LEVEL_COST_CAP: Record<number, number> = {
  1: 6,
  2: 8,
  3: 10,
  4: 12,
  5: 14,
  6: 16,
  7: 18,
  8: 20,
  9: 22,
  10: 25,
};

export function getCostCapForLevel(level: number): number {
  if (level <= 10) return LEVEL_COST_CAP[level] ?? 25;
  if (level <= 15) return 25 + (level - 10) * 2;
  if (level <= 20) return 35 + (level - 15) * 3;
  return 50;
}

// ─── コストからレアリティを算出 ────────────────────────────────────────────────

export function rarityFromCost(cost: number): Rarity {
  if (cost <= 6) return 'C';
  if (cost <= 11) return 'R';
  if (cost <= 17) return 'SR';
  return 'SSR';
}

// ─── 対戦報酬 ─────────────────────────────────────────────────────────────────

export const BATTLE_REWARDS = {
  win:  { exp: 30, runes: 50 },
  lose: { exp: 10, runes: 10 },
  draw: { exp: 15, runes: 20 },
} as const;

// ─── ガチャ価格 ───────────────────────────────────────────────────────────────

export const GACHA_PRICE_SINGLE = 200;
export const GACHA_PRICE_TEN = 1800;

// ─── マテリアルショップ価格 ──────────────────────────────────────────────────

export const MATERIAL_PRICE_MULTIPLIER = 50;

export function getMaterialPrice(materialCost: number): number {
  return materialCost * MATERIAL_PRICE_MULTIPLIER;
}

// ─── 初期プロフィール ─────────────────────────────────────────────────────────

export const INITIAL_PROFILE = {
  level: 1,
  exp: 0,
  runes: 500,
};
