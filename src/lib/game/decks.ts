import { Card } from '@/lib/types/game';
import { CARD_MAP } from '@/lib/game/cards';

// 標準デッキ定義（合計20枚、コスト152）
// MVP ではプレイヤー・AIともにこのデッキを使う（ミラーマッチ）
const STANDARD_DECK_RECIPE: Array<{ cardId: string; count: number }> = [
  { cardId: 'militia', count: 2 },
  { cardId: 'light_infantry', count: 2 },
  { cardId: 'assault_soldier', count: 2 },
  { cardId: 'scout', count: 2 },
  { cardId: 'spear_soldier', count: 2 },
  { cardId: 'heavy_infantry', count: 2 },
  { cardId: 'combat_soldier', count: 2 },
  { cardId: 'archer', count: 2 },
  { cardId: 'guard', count: 2 },
  { cardId: 'healer', count: 2 },
];

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
