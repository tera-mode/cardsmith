import { Card } from '@/lib/types/game';
import { CARD_MAP, getCardsByAttribute, getStarterCardsByAttribute } from '@/lib/game/cards';

export type Archetype = 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';

export const ARCHETYPES: { id: Archetype; name: string; emoji: string; tagline: string }[] = [
  { id: 'sei',  name: '聖の流派', emoji: '⚪',  tagline: '守る・繋ぐ・育てる' },
  { id: 'mei',  name: '冥の流派', emoji: '⚫',  tagline: '死を糧にする・じわじわ削る' },
  { id: 'shin', name: '森の流派', emoji: '🟢', tagline: '粘る・癒す・共生する' },
  { id: 'en',   name: '焔の流派', emoji: '🔴', tagline: '攻め込む・燃やし尽くす' },
  { id: 'sou',  name: '蒼の流派', emoji: '🔵', tagline: '凍らせる・足止めする' },
  { id: 'kou',  name: '鋼の流派', emoji: '⚙️', tagline: '計算する・耐える・支配する' },
];

export const INITIAL_HAND_SIZE = 3;
export const BASE_HP = 5;

// 系統の初期デッキ（低コスト5種 × 各2枚 = 10枚）
export function buildStarterDeck(archetype: Archetype): Card[] {
  return getStarterCardsByAttribute(archetype).flatMap(c => [c, c]);
}

// 敵デッキ: 報酬カード×2 + 初期5種の一部 = 10枚
export function buildEnemyDeck(archetype: Archetype, stageOrder: 1 | 2 | 3 | 4 | 5): Card[] {
  const sorted = getCardsByAttribute(archetype).sort((a, b) => a.cost - b.cost);
  const reward = sorted[5 + stageOrder - 1];
  const starters = sorted.slice(0, 5);
  // 報酬×2 + 初期5種×2 = 12枚 → 最低コスト2種から1枚ずつ削って10枚
  const deck = [reward, reward, ...starters.flatMap(c => [c, c])];
  deck.splice(2, 1);
  deck.splice(3, 1);
  return deck;
}

// 後方互換: sei 初期デッキを標準デッキとして返す
export function buildStandardDeck(): Card[] {
  return buildStarterDeck('sei');
}

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

/** シード付きRNG でシャッフル（シミュレーター用、決定論的） */
export function shuffleDeckWithRng(deck: Card[], rng: { next(): number }): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
