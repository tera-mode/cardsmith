import { Rarity, OwnedCard, GachaTable } from '@/lib/types/meta';
import { GACHA_POOL } from '@/lib/data/gacha';

export function rollRarity(table: GachaTable, rng = Math.random): Rarity {
  const total = Object.values(table.rarityWeights).reduce((s, v) => s + v, 0);
  let r = rng() * total;
  for (const [rarity, weight] of Object.entries(table.rarityWeights)) {
    r -= weight;
    if (r <= 0) return rarity as Rarity;
  }
  return 'C';
}

export function rollCard(rarity: Rarity, rng = Math.random): string {
  const pool = GACHA_POOL[rarity];
  return pool[Math.floor(rng() * pool.length)];
}

export function rollGacha(table: GachaTable, count: 1 | 10): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(table);
    results.push(rollCard(rarity));
  }
  // 10連保証
  if (count === 10 && table.guaranteedRarity) {
    const guaranteed = table.guaranteedRarity;
    const hasGuaranteed = results.some(cardId => {
      const rarity = (Object.entries(GACHA_POOL) as [Rarity, string[]][])
        .find(([, ids]) => ids.includes(cardId))?.[0];
      const order: Rarity[] = ['C', 'R', 'SR', 'SSR'];
      return order.indexOf(rarity ?? 'C') >= order.indexOf(guaranteed);
    });
    if (!hasGuaranteed) {
      results[results.length - 1] = rollCard(guaranteed);
    }
  }
  return results;
}

export function applyGachaResult(
  ownedCards: OwnedCard[],
  cardIds: string[]
): OwnedCard[] {
  const next = [...ownedCards];
  for (const cardId of cardIds) {
    const idx = next.findIndex(c => c.cardId === cardId && !c.isCrafted);
    if (idx >= 0) {
      next[idx] = { ...next[idx], count: next[idx].count + 1 };
    } else {
      next.push({ cardId, count: 1, isCrafted: false, acquiredAt: Date.now() });
    }
  }
  return next;
}

export function getCardRarityFromPool(cardId: string): Rarity {
  for (const [rarity, ids] of Object.entries(GACHA_POOL) as [Rarity, string[]][]) {
    if (ids.includes(cardId)) return rarity;
  }
  return 'C';
}
