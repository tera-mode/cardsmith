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

// スキルはIDと使用回数のみ保持。効果はレジストリで解決する。
export interface Skill {
  id: string;
  uses: number | 'infinite';
}

export interface Card {
  id: string;
  name: string;
  attribute?: 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';
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

export interface UnitBuffs {
  atkBonus: number;    // 永続バフ (buff スキル、怒り、凱旋など)
  auraAtk: number;     // オーラ由来の ATK ボーナス (戦旗など、毎ターン再計算)
  auraMaxHp: number;   // オーラ由来の maxHP ボーナス (聖なる加護など、毎ターン再計算)
}

export interface StatusEffects {
  frozen: boolean;     // 凍結：次ターン行動不可
  paralyzed: boolean;  // 麻痺：次ターン行動不可
  silenced: boolean;   // 沈黙：スキル封印
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
  hasMovedThisTurn: boolean;
  hasSummonedThisTurn: boolean;
  buffs: UnitBuffs;
  statusEffects: StatusEffects;
  isToken?: boolean;           // トークンユニット（残骸・召集など）
  pendingRevival?: boolean;    // 復活スケジュール済み
}

export type BoardState = (Unit | null)[][];

export interface PlayerState {
  baseHp: number;
  deck: Card[];
  hand: Card[];
  hasSummonedThisTurn: boolean;
  hasMovedThisTurn: boolean;
  hasAttackedThisTurn: boolean;  // 1ターンに攻撃できるのは1回まで
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
  // スキルエンジン用
  eventDepth?: number;
  eventCount?: number;
}

// ─── UI操作用の型 ─────────────────────────────────────────────────────────

export type InteractionMode =
  | { type: 'idle' }
  | { type: 'card_selected'; cardIndex: number }
  | { type: 'unit_selected'; unit: Unit }
  | { type: 'unit_moving'; unit: Unit }
  | { type: 'unit_post_move'; unit: Unit }
  | { type: 'skill_targeting'; unit: Unit; skillId: string };

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
