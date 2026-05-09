import { GameSession, Unit, Position, BoardState, Card, StatusEffects, UnitBuffs } from '@/lib/types/game';
import { BOARD_ROWS, BOARD_COLS, isInBounds, getUnit, placeUnit, removeUnit } from '@/lib/game/rules';
import { v4 as uuidv4 } from 'uuid';

// ─── 方向ベクトル定数 ────────────────────────────────────────────────────

export const DIR4: Position[] = [
  { row: -1, col: 0 }, { row: 1, col: 0 },
  { row: 0, col: -1 }, { row: 0, col: 1 },
];
export const DIR8: Position[] = [
  { row: -1, col: 0 }, { row: 1, col: 0 },
  { row: 0, col: -1 }, { row: 0, col: 1 },
  { row: -1, col: -1 }, { row: -1, col: 1 },
  { row: 1, col: -1 }, { row: 1, col: 1 },
];

// ─── ボード・位置取得 ─────────────────────────────────────────────────────

export function opposite(owner: 'player' | 'ai'): 'player' | 'ai' {
  return owner === 'player' ? 'ai' : 'player';
}

export function getAllUnitsOnBoard(state: GameSession): Unit[] {
  const units: Unit[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const u = state.board[r][c];
      if (u) units.push(u);
    }
  }
  return units;
}

export function getAlliesOnBoard(state: GameSession, owner: 'player' | 'ai'): Unit[] {
  return getAllUnitsOnBoard(state).filter(u => u.owner === owner);
}

export function getEnemiesOnBoard(state: GameSession, owner: 'player' | 'ai'): Unit[] {
  return getAllUnitsOnBoard(state).filter(u => u.owner !== owner);
}

export function getAdjacentPositions(pos: Position, dirs: Position[]): Position[] {
  return dirs
    .map(d => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter(isInBounds);
}

export function getAdjacent4Empty(state: GameSession, pos: Position): Position[] {
  return getAdjacentPositions(pos, DIR4).filter(p => !state.board[p.row][p.col]);
}

export function getAdjacent8Empty(state: GameSession, pos: Position): Position[] {
  return getAdjacentPositions(pos, DIR8).filter(p => !state.board[p.row][p.col]);
}

export function getAdjacent4Enemies(state: GameSession, pos: Position, owner: 'player' | 'ai'): Unit[] {
  return getAdjacentPositions(pos, DIR4)
    .map(p => state.board[p.row][p.col])
    .filter((u): u is Unit => !!u && u.owner !== owner);
}

export function getAdjacent8Enemies(state: GameSession, pos: Position, owner: 'player' | 'ai'): Unit[] {
  return getAdjacentPositions(pos, DIR8)
    .map(p => state.board[p.row][p.col])
    .filter((u): u is Unit => !!u && u.owner !== owner);
}

export function getAdjacent8Allies(state: GameSession, pos: Position, owner: 'player' | 'ai'): Unit[] {
  return getAdjacentPositions(pos, DIR8)
    .map(p => state.board[p.row][p.col])
    .filter((u): u is Unit => !!u && u.owner === owner);
}

export function getAdjacent4Allies(state: GameSession, pos: Position, owner: 'player' | 'ai'): Unit[] {
  return getAdjacentPositions(pos, DIR4)
    .map(p => state.board[p.row][p.col])
    .filter((u): u is Unit => !!u && u.owner === owner);
}

export function getAllEmptyPositions(state: GameSession): Position[] {
  const result: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (!state.board[r][c]) result.push({ row: r, col: c });
    }
  }
  return result;
}

export function getEmptySummonZone(state: GameSession, owner: 'player' | 'ai'): Position[] {
  const row = owner === 'player' ? BOARD_ROWS - 1 : 0;
  const result: Position[] = [];
  for (let c = 0; c < BOARD_COLS; c++) {
    if (!state.board[row][c]) result.push({ row, col: c });
  }
  return result;
}

export function getEnemiesInRadius(state: GameSession, pos: Position, radius: number, owner: 'player' | 'ai'): Unit[] {
  const result: Unit[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const u = state.board[r][c];
      if (!u || u.owner === owner) continue;
      const dist = Math.abs(r - pos.row) + Math.abs(c - pos.col);
      if (dist <= radius) result.push(u);
    }
  }
  return result;
}

export function hasNearbyEnemy(state: GameSession, pos: Position, radius: number, owner: 'player' | 'ai'): boolean {
  return getEnemiesInRadius(state, pos, radius, owner).length > 0;
}

// 自分に最も近い空きマス（敵の隣接）
export function getAdjacentEmptyTowardSelf(
  state: GameSession,
  selfPos: Position,
  enemyPos: Position
): Position | null {
  const candidates = DIR4
    .map(d => ({ row: enemyPos.row + d.row, col: enemyPos.col + d.col }))
    .filter(p => isInBounds(p) && !state.board[p.row][p.col]);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const distA = Math.abs(a.row - selfPos.row) + Math.abs(a.col - selfPos.col);
    const distB = Math.abs(b.row - selfPos.row) + Math.abs(b.col - selfPos.col);
    return distA - distB;
  });
  return candidates[0];
}

export function getDirectionFromTo(from: Position, to: Position): Position {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  return {
    row: dr === 0 ? 0 : dr > 0 ? 1 : -1,
    col: dc === 0 ? 0 : dc > 0 ? 1 : -1,
  };
}

export function isOutOfBounds(pos: Position): boolean {
  return !isInBounds(pos);
}

// 左右ターゲット（薙ぎ払い用）
export function getLeftRightTargets(state: GameSession, pos: Position, attacker: Unit): Unit[] {
  const left = { row: pos.row, col: pos.col - 1 };
  const right = { row: pos.row, col: pos.col + 1 };
  return [left, right]
    .filter(isInBounds)
    .map(p => state.board[p.row][p.col])
    .filter((u): u is Unit => !!u && u.owner !== attacker.owner);
}

// ─── ユニット操作（純関数：新 state を返す） ─────────────────────────────

export function updateUnit(state: GameSession, unit: Unit): GameSession {
  const board = state.board.map(r => [...r]);
  board[unit.position.row][unit.position.col] = unit;
  return { ...state, board };
}

export function moveUnitTo(state: GameSession, instanceId: string, newPos: Position): GameSession {
  const board = state.board.map(r => [...r]);
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.instanceId === instanceId) {
        const unit = board[r][c]!;
        board[r][c] = null;
        board[newPos.row][newPos.col] = { ...unit, position: newPos };
        return { ...state, board };
      }
    }
  }
  return state;
}

export function swapPositions(state: GameSession, idA: string, idB: string): GameSession {
  const board = state.board.map(r => [...r]);
  let unitA: Unit | null = null;
  let posA: Position | null = null;
  let unitB: Unit | null = null;
  let posB: Position | null = null;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.instanceId === idA) { unitA = board[r][c]!; posA = { row: r, col: c }; }
      if (board[r][c]?.instanceId === idB) { unitB = board[r][c]!; posB = { row: r, col: c }; }
    }
  }

  if (!unitA || !unitB || !posA || !posB) return state;
  board[posA.row][posA.col] = { ...unitB, position: posA };
  board[posB.row][posB.col] = { ...unitA, position: posB };
  return { ...state, board };
}

export function removeUnitFromBoard(state: GameSession, instanceId: string): GameSession {
  const board = state.board.map(r => [...r]);
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]?.instanceId === instanceId) {
        board[r][c] = null;
        return { ...state, board };
      }
    }
  }
  return state;
}

export function findUnit(state: GameSession, instanceId: string): Unit | null {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (state.board[r][c]?.instanceId === instanceId) return state.board[r][c]!;
    }
  }
  return null;
}

export function healUnit(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  const newHp = Math.min(unit.currentHp + amount, unit.maxHp + unit.buffs.auraMaxHp);
  return updateUnit(state, { ...unit, currentHp: newHp });
}

export function damageUnit(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  return updateUnit(state, { ...unit, currentHp: unit.currentHp - amount });
}

export function incrementAtkBuff(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  return updateUnit(state, { ...unit, buffs: { ...unit.buffs, atkBonus: unit.buffs.atkBonus + amount } });
}

export function incrementMaxHpAndCurrentHp(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  return updateUnit(state, {
    ...unit,
    maxHp: unit.maxHp + amount,
    currentHp: unit.currentHp + amount,
  });
}

export function silenceUnit(state: GameSession, instanceId: string): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  return updateUnit(state, { ...unit, statusEffects: { ...unit.statusEffects, silenced: true } });
}

export function applyStatusEffect(
  state: GameSession,
  instanceId: string,
  effect: keyof StatusEffects,
  _duration: number
): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  return updateUnit(state, { ...unit, statusEffects: { ...unit.statusEffects, [effect]: true } });
}

export function decrementSkillUses(state: GameSession, instanceId: string): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  const uses = unit.skillUsesRemaining;
  if (uses === 'infinite') return state;
  return updateUnit(state, { ...unit, skillUsesRemaining: Math.max(0, uses - 1) });
}

export function scheduleRevival(state: GameSession, instanceId: string): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  // pendingRevivalは除去前にフラグを立てる。復活処理はターン開始時に行う。
  // GameSessionにpendingRevivalsを追加
  const revivalList = (state as GameSessionWithRevival).pendingRevivals ?? [];
  return {
    ...state,
    pendingRevivals: [...revivalList, { card: unit.card, owner: unit.owner, position: unit.position }],
  } as GameSession;
}

export function applyBaseDamage(state: GameSession, attacker: 'player' | 'ai', amount: number): GameSession {
  if (attacker === 'player') {
    return { ...state, ai: { ...state.ai, baseHp: state.ai.baseHp - amount } };
  } else {
    return { ...state, player: { ...state.player, baseHp: state.player.baseHp - amount } };
  }
}

// ─── 計算 ─────────────────────────────────────────────────────────────────

export function getEffectiveAtk(unit: Unit): number {
  return unit.card.atk + unit.buffs.atkBonus + unit.buffs.auraAtk;
}

export function isUnitAlive(unit: Unit, state: GameSession): boolean {
  return findUnit(state, unit.instanceId) !== null;
}

export function canAct(unit: Unit): boolean {
  return !unit.statusEffects.frozen && !unit.statusEffects.paralyzed;
}

export function isSkillBlocked(unit: Unit): boolean {
  return unit.statusEffects.silenced;
}

export function clearTurnStatusEffects(unit: Unit): Unit {
  return {
    ...unit,
    statusEffects: { frozen: false, paralyzed: false, silenced: unit.statusEffects.silenced },
    hasActedThisTurn: false,
    hasMovedThisTurn: false,
    hasSummonedThisTurn: false,
  };
}

// ─── 手札・デッキ ─────────────────────────────────────────────────────────

export function getHand(state: GameSession, owner: 'player' | 'ai'): Card[] {
  return owner === 'player' ? state.player.hand : state.ai.hand;
}

export function removeFromHand(state: GameSession, owner: 'player' | 'ai', cardId: string): GameSession {
  if (owner === 'player') {
    const idx = state.player.hand.findIndex(c => c.id === cardId);
    if (idx < 0) return state;
    const hand = [...state.player.hand];
    hand.splice(idx, 1);
    return { ...state, player: { ...state.player, hand } };
  } else {
    const idx = state.ai.hand.findIndex(c => c.id === cardId);
    if (idx < 0) return state;
    const hand = [...state.ai.hand];
    hand.splice(idx, 1);
    return { ...state, ai: { ...state.ai, hand } };
  }
}

export function pickLowestCostCard(hand: Card[], maxCost: number): Card | null {
  const eligible = hand.filter(c => c.cost <= maxCost);
  if (eligible.length === 0) return null;
  return eligible.reduce((a, b) => a.cost <= b.cost ? a : b);
}

export function applyCostReduction(state: GameSession, owner: 'player' | 'ai', cardId: string, amount: number): GameSession {
  const hand = getHand(state, owner);
  const idx = hand.findIndex(c => c.id === cardId);
  if (idx < 0) return state;
  const newHand = [...hand];
  newHand[idx] = { ...newHand[idx], cost: Math.max(0, newHand[idx].cost - amount) };
  if (owner === 'player') {
    return { ...state, player: { ...state.player, hand: newHand } };
  } else {
    return { ...state, ai: { ...state.ai, hand: newHand } };
  }
}

// ─── トークン作成 ─────────────────────────────────────────────────────────

export const TOKEN_CARD: Card = {
  id: 'token_1_1',
  name: 'トークン',
  cost: 0,
  movement: { type: 'step', directions: [{ dx: 0, dy: -1 }] },
  attackRange: { type: 'step', directions: [{ dx: 0, dy: -1 }] },
  atk: 1,
  hp: 1,
};

export function createTokenUnit(owner: 'player' | 'ai', position: Position): Unit {
  return {
    instanceId: `token_${uuidv4().slice(0, 8)}`,
    cardId: TOKEN_CARD.id,
    card: TOKEN_CARD,
    owner,
    position,
    currentHp: 1,
    maxHp: 1,
    skillUsesRemaining: 0,
    hasActedThisTurn: true, // 召喚ターンは行動不可
    hasMovedThisTurn: false,
    hasSummonedThisTurn: true,
    buffs: { atkBonus: 0, auraAtk: 0, auraMaxHp: 0 },
    statusEffects: { frozen: false, paralyzed: false, silenced: false },
    isToken: true,
  };
}

export function createCloneUnit(source: Unit, position: Position): Unit {
  return {
    instanceId: `clone_${uuidv4().slice(0, 8)}`,
    cardId: source.cardId,
    card: { ...source.card, skill: undefined }, // クローンはスキルなし（無限分身防止）
    owner: source.owner,
    position,
    currentHp: source.card.hp,
    maxHp: source.card.hp,
    skillUsesRemaining: 0,
    hasActedThisTurn: true,
    hasMovedThisTurn: false,
    hasSummonedThisTurn: true,
    buffs: { atkBonus: 0, auraAtk: 0, auraMaxHp: 0 },
    statusEffects: { frozen: false, paralyzed: false, silenced: false },
    isToken: true,
  };
}

// 復活用の型拡張（GameSessionに pendingRevivals を追加）
export interface PendingRevival {
  card: Card;
  owner: 'player' | 'ai';
  position: Position;
}

export interface GameSessionWithRevival extends GameSession {
  pendingRevivals?: PendingRevival[];
}

// ─── ログ ─────────────────────────────────────────────────────────────────

export function appendLog(state: GameSession, ...lines: string[]): GameSession {
  return { ...state, log: [...state.log, ...lines] };
}
