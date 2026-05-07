import { Card } from '@/lib/types/game';
import { CARD_MAP, getCardsByAttribute } from '@/lib/game/cards';

export const INITIAL_HAND_SIZE = 3;
export const BASE_HP = 5;

// デバッグ用標準デッキ：属性混合10枚
const STANDARD_DECK_RECIPE: string[] = [
  'sei_noa', 'sei_liese', 'sei_grail',
  'mei_cal', 'mei_vera',
  'shin_hina', 'shin_lilia',
  'en_koko', 'en_ron', 'en_garo',
];

export function buildStandardDeck(): Card[] {
  return STANDARD_DECK_RECIPE.map(id => {
    const card = CARD_MAP[id];
    if (!card) throw new Error(`Unknown card: ${id}`);
    return card;
  });
}

// 属性デッキ構築
export function buildAttributeDeck(attr: Card['attribute']): Card[] {
  return getCardsByAttribute(attr);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
