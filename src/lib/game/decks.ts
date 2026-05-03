import { Card } from '@/lib/types/game';
import { CARD_MAP } from '@/lib/game/cards';

// デバッグ用標準デッキ（10枚・各1枚）
// プレイヤー・AIともにこのデッキを使う（ミラーマッチ）
const STANDARD_DECK_RECIPE: Array<{ cardId: string; count: number }> = [
  { cardId: 'militia', count: 1 },
  { cardId: 'light_infantry', count: 1 },
  { cardId: 'assault_soldier', count: 1 },
  { cardId: 'scout', count: 1 },
  { cardId: 'spear_soldier', count: 1 },
  { cardId: 'heavy_infantry', count: 1 },
  { cardId: 'combat_soldier', count: 1 },
  { cardId: 'archer', count: 1 },
  { cardId: 'guard', count: 1 },
  { cardId: 'healer', count: 1 },
];

export const INITIAL_HAND_SIZE = 3;
export const BASE_HP = 3;

export function buildStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const { cardId, count } of STANDARD_DECK_RECIPE) {
    const card = CARD_MAP[cardId];
    if (!card) throw new Error(`Unknown card: ${cardId}`);
    for (let i = 0; i < count; i++) {
      deck.push(card);
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
