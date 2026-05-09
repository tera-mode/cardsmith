import { Position } from './game';

export type EffectId = string;

export type GameEffect =
  | { id: EffectId; type: 'summon';       cardId: string; attribute?: 'sei'|'mei'|'shin'|'en'|'sou'|'kou'; to: Position; durationMs: number }
  | { id: EffectId; type: 'move';         instanceId: string; from: Position; to: Position; durationMs: number }
  | { id: EffectId; type: 'attack_motion'; attacker: Position; target: Position; attackKind: 'melee'|'ranged_arrow'|'ranged_cannon'; durationMs: number }
  | { id: EffectId; type: 'hit';          target: Position; damage: number; isCritical?: boolean; attackKind: 'melee'|'ranged_arrow'|'ranged_cannon'; durationMs: number }
  | { id: EffectId; type: 'death';        instanceId: string; position: Position; attribute?: 'sei'|'mei'|'shin'|'en'|'sou'|'kou'; durationMs: number }
  | { id: EffectId; type: 'base_attack';  attacker: Position; targetSide: 'player'|'ai'; damage: number; durationMs: number }
  | { id: EffectId; type: 'status_apply'; target: Position; status: 'frozen'|'paralyzed'|'silenced'; durationMs: number }
  | { id: EffectId; type: 'skill_proc';   source: Position; skillId: string; targets?: Position[]; visualHint?: 'heal'|'buff'|'debuff'|'aoe'|'generic'; durationMs: number }
  | { id: EffectId; type: 'hp_change';    side: 'player'|'ai'; from: number; to: number; durationMs: number }
  | { id: EffectId; type: 'damage_number'; position: Position | { side: 'player'|'ai' }; value: number; kind: 'damage'|'heal'|'block'|'miss'; durationMs: number }
  | { id: EffectId; type: 'turn_banner';  side: 'player'|'ai'; turnCount: number; durationMs: number }
  | { id: EffectId; type: 'victory';      durationMs: number }
  | { id: EffectId; type: 'defeat';       durationMs: number };
