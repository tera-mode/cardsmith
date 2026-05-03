import { GameSession, Unit, Position, SkillEffectType, AttackTarget } from '@/lib/types/game';
import { getLegalAttacks, resolveAttack, placeUnit, isInBounds, getUnit } from '@/lib/game/rules';

// ─── スキル抽象化インターフェース ─────────────────────────────────────────
//
// 新スキルタイプの追加手順:
//  1. game.ts の SkillEffectType に型を追加
//  2. このファイルに SkillResolver を実装したオブジェクトを作成
//  3. SKILL_RESOLVERS に登録
//  4. cards.ts のカード定義に effectType を設定

export interface SkillResolver {
  canActivate(state: GameSession, source: Unit): boolean;
  getValidTargets(state: GameSession, source: Unit): Position[];
  resolve(state: GameSession, source: Unit, target?: Position): { state: GameSession; log: string[] };
}

// ─── 各スキル実装 ─────────────────────────────────────────────────────────

const penetrateResolver: SkillResolver = {
  canActivate(state, source) {
    const uses = source.skillUsesRemaining;
    if (uses !== 'infinite' && uses <= 0) return false;
    const frontRow = source.owner === 'player' ? 0 : 5;
    return source.position.row === frontRow;
  },
  getValidTargets(_state, _source) {
    return []; // ベース攻撃は位置選択不要
  },
  resolve(state, source) {
    const log: string[] = [];
    const damage = 2;
    let playerBaseHp = state.player.baseHp;
    let aiBaseHp = state.ai.baseHp;

    if (source.owner === 'player') {
      aiBaseHp -= damage;
      log.push(`${source.card.name} の貫通攻撃！AI陣地HP -${damage}`);
    } else {
      playerBaseHp -= damage;
      log.push(`AI ${source.card.name} の貫通攻撃！自陣HP -${damage}`);
    }

    const uses = source.skillUsesRemaining;
    const newUses = uses === 'infinite' ? 'infinite' : uses - 1;
    const board = state.board.map((r) => [...r]);
    const updatedSource: Unit = { ...source, skillUsesRemaining: newUses };
    board[source.position.row][source.position.col] = updatedSource;

    return {
      state: {
        ...state,
        board,
        player: { ...state.player, baseHp: playerBaseHp },
        ai: { ...state.ai, baseHp: aiBaseHp },
        log: [...state.log, ...log],
      },
      log,
    };
  },
};

const bigPenetrateResolver: SkillResolver = {
  canActivate(state, source) {
    const uses = source.skillUsesRemaining;
    if (uses !== 'infinite' && uses <= 0) return false;
    const frontRow = source.owner === 'player' ? 0 : 5;
    return source.position.row === frontRow;
  },
  getValidTargets() {
    return [];
  },
  resolve(state, source) {
    const log: string[] = [];
    const damage = source.card.atk + source.buffs.atkBonus;
    let playerBaseHp = state.player.baseHp;
    let aiBaseHp = state.ai.baseHp;

    if (source.owner === 'player') {
      aiBaseHp -= damage;
      log.push(`${source.card.name} の大貫通攻撃（ATK${damage}）！AI陣地HP -${damage}`);
    } else {
      playerBaseHp -= damage;
      log.push(`AI ${source.card.name} の大貫通攻撃（ATK${damage}）！自陣HP -${damage}`);
    }

    const uses = source.skillUsesRemaining;
    const newUses = uses === 'infinite' ? 'infinite' : uses - 1;
    const board = state.board.map((r) => [...r]);
    const updatedSource: Unit = { ...source, skillUsesRemaining: newUses };
    board[source.position.row][source.position.col] = updatedSource;

    return {
      state: {
        ...state,
        board,
        player: { ...state.player, baseHp: playerBaseHp },
        ai: { ...state.ai, baseHp: aiBaseHp },
        log: [...state.log, ...log],
      },
      log,
    };
  },
};

// counter は攻撃を「受けた時」に発動するためresolveAttackから呼ばれる
// ここではスキルUIのcanActivate（手動発動なし）として登録
const counterResolver: SkillResolver = {
  canActivate() { return false; }, // 自動発動のみ
  getValidTargets() { return []; },
  resolve(state, _source) { return { state, log: [] }; },
};

// buff: 任意の味方ユニット1体のATK+1
const buffResolver: SkillResolver = {
  canActivate(_state, source) {
    const uses = source.skillUsesRemaining;
    return uses === 'infinite' || uses > 0;
  },
  getValidTargets(state, source) {
    const positions: Position[] = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const unit = state.board[r][c];
        if (unit && unit.owner === source.owner && unit.instanceId !== source.instanceId) {
          positions.push({ row: r, col: c });
        }
      }
    }
    return positions;
  },
  resolve(state, source, target) {
    const log: string[] = [];
    if (!target) return { state, log };

    const targetUnit = getUnit(state.board, target);
    if (!targetUnit || targetUnit.owner !== source.owner) return { state, log };

    const board = state.board.map((r) => [...r]);
    const buffed: Unit = {
      ...targetUnit,
      buffs: { atkBonus: targetUnit.buffs.atkBonus + 1 },
    };
    board[target.row][target.col] = buffed;

    const uses = source.skillUsesRemaining;
    const newUses = uses === 'infinite' ? 'infinite' : uses - 1;
    const updatedSource: Unit = { ...source, skillUsesRemaining: newUses };
    board[source.position.row][source.position.col] = updatedSource;

    log.push(`${source.card.name} が ${targetUnit.card.name} を強化！ATK+1`);

    return {
      state: { ...state, board, log: [...state.log, ...log] },
      log,
    };
  },
};

// heal: 隣接する味方ユニット1体のHPを+2
const healResolver: SkillResolver = {
  canActivate(_state, source) {
    const uses = source.skillUsesRemaining;
    return uses === 'infinite' || uses > 0;
  },
  getValidTargets(state, source) {
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    ];
    const positions: Position[] = [];
    for (const d of dirs) {
      const pos: Position = { row: source.position.row + d.dy, col: source.position.col + d.dx };
      if (!isInBounds(pos)) continue;
      const unit = getUnit(state.board, pos);
      if (unit && unit.owner === source.owner) {
        positions.push(pos);
      }
    }
    return positions;
  },
  resolve(state, source, target) {
    const log: string[] = [];
    if (!target) return { state, log };

    const targetUnit = getUnit(state.board, target);
    if (!targetUnit || targetUnit.owner !== source.owner) return { state, log };

    const healAmount = source.card.skill?.effectValue ?? 2;
    const newHp = Math.min(targetUnit.currentHp + healAmount, targetUnit.maxHp);
    const board = state.board.map((r) => [...r]);
    const healed: Unit = { ...targetUnit, currentHp: newHp };
    board[target.row][target.col] = healed;

    const uses = source.skillUsesRemaining;
    const newUses = uses === 'infinite' ? 'infinite' : uses - 1;
    const updatedSource: Unit = { ...source, skillUsesRemaining: newUses };
    board[source.position.row][source.position.col] = updatedSource;

    log.push(`${source.card.name} が ${targetUnit.card.name} を治癒！HP+${healAmount}`);

    return {
      state: { ...state, board, log: [...state.log, ...log] },
      log,
    };
  },
};

// ─── スキルマップ（新スキルはここに登録するだけ） ─────────────────────────

export const SKILL_RESOLVERS: Partial<Record<SkillEffectType, SkillResolver>> = {
  penetrate: penetrateResolver,
  big_penetrate: bigPenetrateResolver,
  counter: counterResolver,
  buff: buffResolver,
  heal: healResolver,
  // 将来の拡張例:
  // teleport: teleportResolver,
  // aoe_attack: aoeAttackResolver,
  // paralyze: paralyzeResolver,
  // invincible: invincibleResolver,
};

// ─── 反撃処理（攻撃解決から呼ばれる） ────────────────────────────────────

export function applyCounterAttack(
  state: GameSession,
  defender: Unit,
  attacker: Unit
): { state: GameSession; log: string[] } {
  const log: string[] = [];
  if (defender.card.skill?.effectType !== 'counter') return { state, log };
  const uses = defender.skillUsesRemaining;
  if (uses !== 'infinite' && uses <= 0) return { state, log };

  const { board, log: combatLog, playerBaseHp, aiBaseHp } = resolveAttack(
    state,
    defender,
    { type: 'unit', unit: attacker }
  );
  log.push(...combatLog);
  log.push(`${defender.card.name} の反撃！`);

  return {
    state: {
      ...state,
      board,
      player: { ...state.player, baseHp: playerBaseHp },
      ai: { ...state.ai, baseHp: aiBaseHp },
      log: [...state.log, ...log],
    },
    log,
  };
}
