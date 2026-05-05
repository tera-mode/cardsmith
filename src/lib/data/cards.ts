import { CARDS as BASE_CARDS } from '@/lib/game/cards';
import { Rarity } from '@/lib/types/meta';

export const CARD_RARITIES: Record<string, Rarity> = {
  militia: 'C',
  light_infantry: 'C',
  assault_soldier: 'C',
  scout: 'C',
  spear_soldier: 'C',
  heavy_infantry: 'R',
  combat_soldier: 'R',
  archer: 'R',
  guard: 'SR',
  healer: 'SR',
  cavalry: 'SR',
  cannon: 'SR',
  defender: 'SSR',
};

export const CARDS_WITH_RARITY = BASE_CARDS.map(card => ({
  ...card,
  rarity: CARD_RARITIES[card.id] ?? 'C' as Rarity,
}));

export function getCardRarity(cardId: string): Rarity {
  return CARD_RARITIES[cardId] ?? 'C';
}

export { BASE_CARDS as CARDS };
