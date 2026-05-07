import { Unit, BoardState, Position, Card, GameSession, AttackTarget, DirectionVector } from '@/lib/types/game';
import { v4 as uuidv4 } from 'uuid';

export const BOARD_ROWS = 4;
export const BOARD_COLS = 4;

// ─── ユーティリティ ───────────────────────────────────────────────────────

export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_ROWS && pos.col >= 0 && pos.col < BOARD_COLS;
}

export function getUnit(board: BoardState, pos: Position): Unit | null {
  if (!isInBounds(pos)) return null;
  return board[pos.row][pos.col];
}

export function placeUnit(board: BoardState, unit: Unit, pos: Position): BoardState {
  const next = board.map((row) => [...row]);
  next[pos.row][pos.col] = { ...unit, position: pos };
  return next;
}

export function removeUnit(board: BoardState, pos: Position): BoardState {
  const next = board.map((row) => [...row]);
  next[pos.row][pos.col] = null;
  return next;
}

// プレイヤー視点の「前方向」をオーナーに応じて反転する
function toAbsoluteDir(dir: DirectionVector, owner: 'player' | 'ai'): DirectionVector {
  return owner === 'ai' ? { dx: dir.dx, dy: -dir.dy } : dir;
}

// ─── 合法手：移動 ─────────────────────────────────────────────────────────

export function getLegalMoves(unit: Unit, board: BoardState): Position[] {
  const { movement } = unit.card;
  const owner = unit.owner;
  const moves: Position[] = [];

  if (movement.type === 'step') {
    for (const dir of movement.directions) {
      const abs = toAbsoluteDir(dir, owner);
      const to: Position = {
        row: unit.position.row + abs.dy,
        col: unit.position.col + abs.dx,
      };
      if (!isInBounds(to)) continue;
      if (board[to.row][to.col] !== null) continue; // 自分・敵問わず移動不可
      moves.push(to);
    }
  } else if (movement.type === 'jump') {
    for (const offset of movement.offsets) {
      const abs = toAbsoluteDir(offset, owner);
      const to: Position = {
        row: unit.position.row + abs.dy,
        col: unit.position.col + abs.dx,
      };
      if (!isInBounds(to)) continue;
      if (board[to.row][to.col] !== null) continue;
      moves.push(to);
    }
  } else if (movement.type === 'slide') {
    for (const dir of movement.directions) {
      const abs = toAbsoluteDir(dir, owner);
      let cur: Position = { row: unit.position.row + abs.dy, col: unit.position.col + abs.dx };
      while (isInBounds(cur) && board[cur.row][cur.col] === null) {
        moves.push({ ...cur });
        cur = { row: cur.row + abs.dy, col: cur.col + abs.dx };
      }
    }
  }

  return moves;
}

// ─── 合法手：攻撃 ─────────────────────────────────────────────────────────

export function getLegalAttacks(unit: Unit, board: BoardState): AttackTarget[] {
  const { attackRange } = unit.card;
  const owner = unit.owner;
  const targets: AttackTarget[] = [];

  if (attackRange.type === 'none') return [];

  // 最前線チェック（ベース攻撃判定用）
  const frontRow = owner === 'player' ? 0 : BOARD_ROWS - 1;
  const isAtFront = unit.position.row === frontRow;

  if (attackRange.type === 'step') {
    for (const dir of attackRange.directions) {
      const abs = toAbsoluteDir(dir, owner);
      const to: Position = {
        row: unit.position.row + abs.dy,
        col: unit.position.col + abs.dx,
      };
      if (!isInBounds(to)) {
        // 盤外 = ベース攻撃チェック
        if (isAtFront && abs.dy === (owner === 'player' ? -1 : 1)) {
          targets.push({ type: 'base' });
        }
        continue;
      }
      const target = board[to.row][to.col];
      if (target && target.owner !== owner) {
        targets.push({ type: 'unit', unit: target });
      }
    }
  } else if (attackRange.type === 'ranged') {
    const abs = toAbsoluteDir(attackRange.direction, owner);
    let cur: Position = { row: unit.position.row + abs.dy, col: unit.position.col + abs.dx };
    let dist = 0;
    while (dist < attackRange.maxDistance) {
      if (!isInBounds(cur)) {
        // 盤外：ベース攻撃
        if (isAtFront) {
          targets.push({ type: 'base' });
        }
        break;
      }
      const occupant = board[cur.row][cur.col];
      if (occupant) {
        if (occupant.owner !== owner) {
          targets.push({ type: 'unit', unit: occupant });
        }
        break; // 敵味方問わず遮蔽
      }
      cur = { row: cur.row + abs.dy, col: cur.col + abs.dx };
      dist++;
    }
  } else if (attackRange.type === 'aoe') {
    for (const offset of attackRange.pattern) {
      const abs = toAbsoluteDir(offset, owner);
      const to: Position = {
        row: unit.position.row + abs.dy,
        col: unit.position.col + abs.dx,
      };
      if (!isInBounds(to)) continue;
      const target = board[to.row][to.col];
      if (target && target.owner !== owner) {
        targets.push({ type: 'unit', unit: target });
      }
    }
  }

  return targets;
}

// ─── 召喚 ─────────────────────────────────────────────────────────────────

export function getSummonZone(owner: 'player' | 'ai'): number[] {
  // 4×4以下: 1行ゾーン、6×6以上: 2行ゾーン
  const zoneRows = BOARD_ROWS <= 4 ? 1 : 2;
  return owner === 'player'
    ? Array.from({ length: zoneRows }, (_, i) => BOARD_ROWS - zoneRows + i)
    : Array.from({ length: zoneRows }, (_, i) => i);
}

export function getLegalSummonPositions(board: BoardState, owner: 'player' | 'ai'): Position[] {
  const rows = getSummonZone(owner);
  const positions: Position[] = [];
  for (const row of rows) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] === null) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

export function createUnit(card: Card, owner: 'player' | 'ai', position: Position): Unit {
  return {
    instanceId: `unit_${uuidv4().slice(0, 8)}`,
    cardId: card.id,
    card,
    owner,
    position,
    currentHp: card.hp,
    maxHp: card.hp,
    skillUsesRemaining: card.skill ? card.skill.uses : 0,
    hasActedThisTurn: false,
    hasSummonedThisTurn: true,
    buffs: { atkBonus: 0, auraAtk: 0, auraMaxHp: 0 },
    statusEffects: { frozen: false, paralyzed: false, silenced: false },
  };
}

// ─── 戦闘解決 ─────────────────────────────────────────────────────────────

export interface CombatResult {
  board: BoardState;
  session: GameSession;
  log: string[];
}

export function resolveAttack(
  session: GameSession,
  attacker: Unit,
  target: AttackTarget
): { board: BoardState; log: string[]; playerBaseHp: number; aiBaseHp: number } {
  let board = session.board.map((row) => [...row]);
  const log: string[] = [];
  let playerBaseHp = session.player.baseHp;
  let aiBaseHp = session.ai.baseHp;

  if (target.type === 'base') {
    const damage = 1; // デフォルト（スキルで上書き）
    if (attacker.owner === 'player') {
      aiBaseHp -= damage;
      log.push(`${attacker.card.name} が敵陣を攻撃！AI陣地HP -${damage}`);
    } else {
      playerBaseHp -= damage;
      log.push(`AI ${attacker.card.name} が自陣を攻撃！自陣HP -${damage}`);
    }
    return { board, log, playerBaseHp, aiBaseHp };
  }

  // ユニット攻撃
  const defender = target.unit;
  const atk = attacker.card.atk + attacker.buffs.atkBonus;
  const newHp = defender.currentHp - atk;
  log.push(`${attacker.card.name}（ATK${atk}）→ ${defender.card.name}（残HP: ${Math.max(0, newHp)}）`);

  if (newHp <= 0) {
    // 破壊
    board = removeUnit(board, defender.position);
    log.push(`${defender.card.name} が破壊された`);
  } else {
    // HP更新
    const updatedDefender: Unit = { ...defender, currentHp: newHp };
    board = placeUnit(board, updatedDefender, defender.position);
  }

  return { board, log, playerBaseHp, aiBaseHp };
}

// ─── ゲーム開始 ───────────────────────────────────────────────────────────

export function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}
