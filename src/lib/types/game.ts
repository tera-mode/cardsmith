// ─── 静的データ：カード定義 ───────────────────────────────────────────────

export type DirectionVector = { dx: number; dy: number };

export type MovementPattern =
  | { type: 'step'; directions: DirectionVector[] }
  | { type: 'jump'; offsets: DirectionVector[] }
  | { type: 'slide'; directions: DirectionVector[] };

export type AttackRange =
  | { type: 'step'; directions: DirectionVector[] }
  | { type: 'ranged'; direction: DirectionVector; maxDistance: number }
  | { type: 'aoe'; pattern: DirectionVector[] }
  | { type: 'none' };

export type SkillEffectType =
  | 'penetrate'
  | 'big_penetrate'
  | 'counter'
  | 'reduce'
  | 'self_destruct'
  | 'heal'
  | 'buff'
  | 'teleport'
  | 'aoe_attack'
  | 'paralyze'
  | 'invincible';

export interface Skill {
  id: string;
  name: string;
  description: string;
  effectType: SkillEffectType;
  effectValue?: number;
  uses: number | 'infinite';
  range?: AttackRange;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  movement: MovementPattern;
  attackRange: AttackRange;
  atk: number;
  hp: number;
  skill?: Skill;
}

// ─── 動的データ：ゲーム状態 ───────────────────────────────────────────────

export interface Position {
  row: number;
  col: number;
}

export interface Unit {
  instanceId: string;
  cardId: string;
  card: Card;
  owner: 'player' | 'ai';
  position: Position;
  currentHp: number;
  maxHp: number;
  skillUsesRemaining: number | 'infinite';
  hasActedThisTurn: boolean;
  hasSummonedThisTurn: boolean; // 召喚されたターン（召喚酔いなし。フラグとして記録のみ）
  buffs: { atkBonus: number };
}

export type BoardState = (Unit | null)[][];

export interface PlayerState {
  baseHp: number;
  deck: Card[];
  hand: Card[];
  hasSummonedThisTurn: boolean;
  hasActedThisTurn: boolean;
}

export type GamePhase = 'draw' | 'main' | 'end_turn' | 'finished';

export interface GameSession {
  sessionId: string;
  userId: string;
  startedAt: number;
  finishedAt?: number;
  currentTurn: 'player' | 'ai';
  turnCount: number;
  phase: GamePhase;
  board: BoardState;
  player: PlayerState;
  ai: PlayerState;
  winner?: 'player' | 'ai' | 'draw';
  log: string[];
}

// ─── UI操作用の型 ─────────────────────────────────────────────────────────

export type InteractionMode =
  | { type: 'idle' }
  | { type: 'card_selected'; cardIndex: number }
  | { type: 'unit_selected'; unit: Unit }
  | { type: 'unit_moved'; unit: Unit }; // 移動後・攻撃/スキル選択中

export type AttackTarget =
  | { type: 'unit'; unit: Unit }
  | { type: 'base' };

// ─── Firestore保存用の型 ─────────────────────────────────────────────────

export interface SessionRecord {
  sessionId: string;
  userId: string;
  startedAt: number;
  finishedAt: number;
  winner: 'player' | 'ai' | 'draw';
  turnCount: number;
  finalState: {
    playerBaseHp: number;
    aiBaseHp: number;
  };
  log: string[];
  playerDeckId: string;
}
