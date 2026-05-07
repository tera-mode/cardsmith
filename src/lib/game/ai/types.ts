import { GameSession, Unit, Position, Card } from '@/lib/types/game';
import type { AttackTarget } from '@/lib/types/game';

export type AIDifficulty = 'tutorial' | 'easy' | 'normal' | 'hard';

export interface EvalWeights {
  baseHpDiff: number;
  alliedUnitValue: number;
  enemyUnitValue: number;
  alliedAdvance: number;
  enemyAdvance: number;
  healerPresence: number;
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  baseHpDiff: 50,
  alliedUnitValue: 5,
  enemyUnitValue: -5,
  alliedAdvance: 3,
  enemyAdvance: -3,
  healerPresence: 8,
};

export const TUTORIAL_WEIGHTS: EvalWeights = {
  baseHpDiff: 25,
  alliedUnitValue: 2,
  enemyUnitValue: -2,
  alliedAdvance: 2,
  enemyAdvance: -1,
  healerPresence: 4,
};

export const HARD_WEIGHTS: EvalWeights = {
  ...DEFAULT_WEIGHTS,
  healerPresence: 12,
};

// AI 内部でのアクション表現
export interface SummonAction {
  type: 'summon';
  cardIndex: number;
  position: Position;
}

export interface UnitAction {
  type: 'unit_action';
  unitId: string;
  movePos: Position | null;
  attack: AttackTarget | null;
}

export interface NoAction {
  type: 'no_action';
}

export type AIAction = SummonAction | UnitAction | NoAction;
