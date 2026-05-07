import { CARDS as BASE_CARDS } from '@/lib/game/cards';
import { Rarity } from '@/lib/types/meta';

// コスト帯でレアリティを自動決定
// 低 (4-6): C / 中 (7-13): R / 高 (14-21): SR / 極 (22+): SSR
function rarityFromCost(cost: number): Rarity {
  if (cost >= 22) return 'SSR';
  if (cost >= 14) return 'SR';
  if (cost >= 7)  return 'R';
  return 'C';
}

export const CARD_RARITIES: Record<string, Rarity> = Object.fromEntries(
  BASE_CARDS.map(card => [card.id, rarityFromCost(card.cost)])
);

export const CARDS_WITH_RARITY = BASE_CARDS.map(card => ({
  ...card,
  rarity: CARD_RARITIES[card.id] ?? 'C' as Rarity,
}));

export function getCardRarity(cardId: string): Rarity {
  return CARD_RARITIES[cardId] ?? 'C';
}

export { BASE_CARDS as CARDS };
