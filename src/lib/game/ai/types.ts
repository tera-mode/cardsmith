import { GameSession, Position, AttackTarget } from '@/lib/types/game';
import type { Rng } from './rng';

// ─── 基本型 ───────────────────────────────────────────────────────────────

export type Owner = 'player' | 'ai';
export type TacticId = 'balanced' | 'scripted';

// ─── 評価重み ─────────────────────────────────────────────────────────────

export interface EvalWeights {
  baseHpDiff: number;
  alliedUnitValue: number;
  enemyUnitValue: number;
  alliedAdvance: number;
  enemyAdvance: number;
  healerPresence: number;
  skillPotential: number;
  enemyAttackThreat: number;
  alliedAttackThreat: number;
}

// ─── 探索オプション ───────────────────────────────────────────────────────

export interface SearchOptions {
  topKSummon?: number;
  topKAction?: number;
}

// ─── AIAction ────────────────────────────────────────────────────────────

export type AIAction =
  | { type: 'summon';   cardIndex: number; position: Position }
  | { type: 'move';     unitId: string;    position: Position }
  | { type: 'attack';   unitId: string;    target: AttackTarget }
  | { type: 'skill';    unitId: string;    target: Position | null }
  | { type: 'end_turn' };

// ─── 戦術インターフェース ─────────────────────────────────────────────────

export interface TacticStrategy {
  id: TacticId;
  defaultWeights: EvalWeights;

  prefilterActions?(
    state: GameSession,
    actions: AIAction[],
    weights: EvalWeights,
    options: SearchOptions,
  ): AIAction[];

  preferAction?(a: AIAction, b: AIAction, state: GameSession): number;

  scriptedTurn?(state: GameSession, rng: Rng): AIAction[];
}

// ─── BattleAIProfile ─────────────────────────────────────────────────────

export interface BattleAIProfile {
  id: string;
  displayName: string;
  description: string;
  tacticId: TacticId;
  searchDepth: 0 | 1 | 2 | 3;
  evalWeights: EvalWeights;
  searchOptions?: SearchOptions;
  defaultBaseHp: number;
}

// ─── レガシー互換（削除予定） ─────────────────────────────────────────────

/** @deprecated Use BattleAIProfile instead */
export type AIDifficulty = 'tutorial' | 'easy' | 'normal' | 'hard';
