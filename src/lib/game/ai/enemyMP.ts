import { Card } from '@/lib/types/game';

// ターンカウントに応じて敵が使えるMP
export function getEnemyMP(turnCount: number): number {
  return Math.min(8 + turnCount * 2, 30);
}

export function canEnemySummon(
  card: Card,
  turnCount: number,
  alreadySummonedCost: number
): boolean {
  return card.cost + alreadySummonedCost <= getEnemyMP(turnCount);
}
