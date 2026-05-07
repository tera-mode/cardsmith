import { Rarity } from '@/lib/types/meta';

export const DECK_MAX_CARDS = 10;
export const DECK_MAX_SAME = 2;
export const INITIAL_HAND_SIZE = 3;

// ─── EXP テーブル（次レベルまでの必要EXP）────────────────────────────────────
// Lv10 が最大。10 → 9999 で事実上不変。
export const EXP_TO_NEXT_LEVEL: Record<number, number> = {
  1: 100,
  2: 150,
  3: 200,
  4: 200,
  5: 250,
  6: 300,
  7: 400,
  8: 500,
  9: 700,
  10: 9999,
};

export function getExpToNextLevel(level: number): number {
  return EXP_TO_NEXT_LEVEL[Math.min(level, 10)] ?? 9999;
}

export function getLevelFromExp(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (level < 10 && remaining >= getExpToNextLevel(level)) {
    remaining -= getExpToNextLevel(level);
    level++;
  }
  return level;
}

export function getExpInCurrentLevel(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (level < 10 && remaining >= getExpToNextLevel(level)) {
    remaining -= getExpToNextLevel(level);
    level++;
  }
  return remaining;
}

// ─── デッキ総コスト上限（Lvごと）────────────────────────────────────────────
// 「per-card cap」から「deck total cap」に変更。
export const LEVEL_COST_CAP: Record<number, number> = {
  1: 80,
  2: 90,
  3: 100,
  4: 115,
  5: 130,
  6: 150,
  7: 170,
  8: 185,
  9: 200,
  10: 220,
};

export function getCostCapForLevel(level: number): number {
  return LEVEL_COST_CAP[Math.min(level, 10)] ?? 220;
}

// ─── コストからレアリティを算出 ────────────────────────────────────────────────

export function rarityFromCost(cost: number): Rarity {
  if (cost <= 6) return 'C';
  if (cost <= 11) return 'R';
  if (cost <= 17) return 'SR';
  return 'SSR';
}

// ─── ステージ報酬テーブル ─────────────────────────────────────────────────────

export const STAGE_REWARDS = {
  tutorial_1:  { exp: 30,  runes: 50  },
  tutorial_2:  { exp: 30,  runes: 50  },
  tutorial_3:  { exp: 90,  runes: 100 },
  archetype_1: { exp: 60,  runes: 100 },
  archetype_2: { exp: 70,  runes: 120 },
  archetype_3: { exp: 90,  runes: 150 },
  archetype_4: { exp: 110, runes: 180 },
  archetype_5: { exp: 150, runes: 300 },
} as const;

// ─── 対戦報酬（後方互換維持）─────────────────────────────────────────────────

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
  runes: 0,
};
