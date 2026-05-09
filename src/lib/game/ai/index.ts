// 新API
export { runAITurn } from './runAITurn';
export type { RunAITurnOptions } from './runAITurn';
export { getProfile, getAllProfiles, registerProfile } from './profile_registry';
export type { BattleAIProfile, AIAction, EvalWeights, Owner, TacticId } from './types';

// レガシー互換（GameContext 移行完了後に削除）
export type { AIDifficulty } from './types';
