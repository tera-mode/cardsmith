import { GameSession, Unit, Position, AttackTarget } from '@/lib/types/game';
import {
  getLegalMoves, getLegalAttacks, getLegalSummonPositions,
  createUnit, placeUnit, removeUnit, resolveAttack, BOARD_ROWS, BOARD_COLS,
} from '@/lib/game/rules';
import {
  applyDamage, triggerOnSummon, triggerOnAttack, applyCounterAttack, checkWinner,
  resolveActivatedSkill,
} from '@/lib/game/events/dispatcher';
// resolveAttack is imported from rules.ts above
import { getEffectiveAtk, findUnit, canAct } from '@/lib/game/helpers';
import { getSkill } from '@/lib/game/skills/index';
import { evaluateBoard } from './evaluator';
import { canEnemySummon } from './enemyMP';
import { EvalWeights, DEFAULT_WEIGHTS } from './types';

// ─── ディレイ ─────────────────────────────────────────────────────────────────

export function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 状態シミュレーション ─────────────────────────────────────────────────────

function simulateSummon(state: GameSession, cardIdx: number, pos: Position): GameSession {
  const card = state.ai.hand[cardIdx];
  if (!card) return state;
  const unit = createUnit(card, 'ai', pos);
  const board = placeUnit(state.board, unit, pos);
  const newHand = state.ai.hand.filter((_, i) => i !== cardIdx);
  let s: GameSession = { ...state, board, ai: { ...state.ai, hand: newHand, hasSummonedThisTurn: true } };
  s = triggerOnSummon(s, unit);
  return checkWinner(s);
}

function simulateMove(state: GameSession, unit: Unit, pos: Position): GameSession {
  const cleared = removeUnit(state.board, unit.position);
  const moved: Unit = { ...unit, position: pos };
  const board = placeUnit(cleared, moved, pos);
  return { ...state, board };
}

function simulateAttack(state: GameSession, attacker: Unit, target: AttackTarget): GameSession {
  if (target.type === 'base') {
    const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, attacker, target);
    const s: GameSession = {
      ...state, board,
      player: { ...state.player, baseHp: playerBaseHp },
      ai: { ...state.ai, baseHp: aiBaseHp },
      log: [...state.log, ...log],
    };
    return checkWinner(s);
  }

  // unit attack
  const defender = target.unit;
  const atk = getEffectiveAtk(attacker);
  let s = applyDamage(state, { source: attacker, target: defender, amount: atk });

  const freshDef = findUnit(s, defender.instanceId);
  if (freshDef?.card.skill?.id === 'hangeki') {
    s = applyCounterAttack(s, freshDef, attacker);
  }
  const freshAtk = findUnit(s, attacker.instanceId);
  if (freshAtk) s = triggerOnAttack(s, freshAtk, defender, atk);

  return checkWinner(s);
}

function markActed(state: GameSession, unit: Unit): GameSession {
  const board = state.board.map(row => [...row]);
  const u = board[unit.position.row]?.[unit.position.col];
  if (u) board[unit.position.row][unit.position.col] = { ...u, hasActedThisTurn: true };
  return { ...state, board };
}

// ─── 1手読み：最良召喚を選ぶ ─────────────────────────────────────────────────

export function bestSummon1Ply(
  state: GameSession,
  weights: EvalWeights = DEFAULT_WEIGHTS
): { cardIdx: number; pos: Position } | null {
  const positions = getLegalSummonPositions(state.board, 'ai');
  if (positions.length === 0 || state.ai.hand.length === 0) return null;

  let best: { cardIdx: number; pos: Position } | null = null;
  let bestScore = evaluateBoard(state, 'ai', weights); // baseline: don't summon

  for (let i = 0; i < state.ai.hand.length; i++) {
    const card = state.ai.hand[i];
    if (!canEnemySummon(card, state.turnCount, 0)) continue;
    for (const pos of positions) {
      const s = simulateSummon(state, i, pos);
      const score = evaluateBoard(s, 'ai', weights);
      if (score > bestScore) {
        bestScore = score;
        best = { cardIdx: i, pos };
      }
    }
  }

  return best;
}

// ─── 1手読み：最良ユニット行動を選ぶ ─────────────────────────────────────────

interface UnitActionResult {
  movePos: Position | null;
  attack: AttackTarget | null;
}

export function bestUnitAction1Ply(
  state: GameSession,
  unit: Unit,
  weights: EvalWeights = DEFAULT_WEIGHTS,
  skillBonus = 0
): UnitActionResult {
  const moveCandidates: (Position | null)[] = [null, ...getLegalMoves(unit, state.board)];

  let best: UnitActionResult = { movePos: null, attack: null };
  let bestScore = -Infinity;

  for (const movePos of moveCandidates) {
    let s = state;
    let u = unit;

    if (movePos) {
      s = simulateMove(s, u, movePos);
      const fresh = findUnit(s, u.instanceId);
      if (!fresh) continue;
      u = fresh;
    }

    // 攻撃しない場合も評価
    const noAttackScore = evaluateBoard(s, 'ai', weights);
    if (noAttackScore > bestScore) {
      bestScore = noAttackScore;
      best = { movePos, attack: null };
    }

    // 攻撃候補を評価
    const attacks = getLegalAttacks(u, s.board);
    for (const atk of attacks) {
      const afterAtk = simulateAttack(s, u, atk);
      const score = evaluateBoard(afterAtk, 'ai', weights);
      if (score > bestScore) {
        bestScore = score;
        best = { movePos, attack: atk };
      }
    }

    // 起動型スキル評価
    const skillDef = u.card.skill ? getSkill(u.card.skill.id) : null;
    if (skillDef?.triggerKind === 'activated' && u.skillUsesRemaining !== 0) {
      const ctx = { remainingUses: u.skillUsesRemaining, turnCount: s.turnCount, currentTurn: 'ai' as const };
      if (!skillDef.canActivate || skillDef.canActivate(s, u, ctx)) {
        const targets = skillDef.getValidTargets ? skillDef.getValidTargets(s, u) : [];
        const target = targets.length > 0 ? targets[0] : null;
        const afterSkill = resolveActivatedSkill(s, u, target);
        const score = evaluateBoard(afterSkill, 'ai', weights) + skillBonus;
        if (score > bestScore) {
          bestScore = score;
          // skill use is handled separately; mark as null attack for now
          best = { movePos, attack: null };
        }
      }
    }
  }

  return best;
}

// ─── 2手読み：召喚フェーズ ────────────────────────────────────────────────────

export function bestSummon2Ply(
  state: GameSession,
  weights: EvalWeights = DEFAULT_WEIGHTS
): { cardIdx: number; pos: Position } | null {
  const positions = getLegalSummonPositions(state.board, 'ai');
  if (positions.length === 0 || state.ai.hand.length === 0) return null;

  const baseline = evaluateBoard(state, 'ai', weights);
  let best: { cardIdx: number; pos: Position } | null = null;
  let bestScore = baseline;

  // AI召喚候補を評価
  const aiCandidates: { cardIdx: number; pos: Position; score: number }[] = [];

  for (let i = 0; i < state.ai.hand.length; i++) {
    const card = state.ai.hand[i];
    if (!canEnemySummon(card, state.turnCount, 0)) continue;
    for (const pos of positions) {
      const s = simulateSummon(state, i, pos);
      aiCandidates.push({ cardIdx: i, pos, score: evaluateBoard(s, 'ai', weights) });
    }
  }

  // 上位3候補のみ2手読み
  aiCandidates.sort((a, b) => b.score - a.score);
  const topCandidates = aiCandidates.slice(0, 3);

  for (const cand of topCandidates) {
    const s1 = simulateSummon(state, cand.cardIdx, cand.pos);

    // 敵（プレイヤー）の最善手を推定してminimaxスコアを得る
    const playerScore = estimatePlayerBestScore(s1, weights);
    // 2手読み後のAIスコア（プレイヤーに最善手打たれた後の評価）
    if (playerScore > bestScore || best === null) {
      bestScore = playerScore;
      best = { cardIdx: cand.cardIdx, pos: cand.pos };
    }
  }

  return best;
}

// ─── プレイヤーの最善召喚を推定（AI視点でのmin評価）─────────────────────────

function estimatePlayerBestScore(state: GameSession, weights: EvalWeights): number {
  const playerPositions = getLegalSummonPositions(state.board, 'player');
  let worstForAI = evaluateBoard(state, 'ai', weights);

  for (let i = 0; i < Math.min(state.player.hand.length, 3); i++) {
    const card = state.player.hand[i];
    for (const pos of playerPositions.slice(0, 3)) {
      const unit = createUnit(card, 'player', pos);
      const board = placeUnit(state.board, unit, pos);
      const newHand = state.player.hand.filter((_, idx) => idx !== i);
      const s: GameSession = {
        ...state,
        board,
        player: { ...state.player, hand: newHand, hasSummonedThisTurn: true },
      };
      const score = evaluateBoard(checkWinner(s), 'ai', weights);
      // プレイヤーはAIスコアを最小化する
      if (score < worstForAI) worstForAI = score;
    }
  }

  return worstForAI;
}

// ─── 全ユニット取得 ───────────────────────────────────────────────────────────

export function getActableAIUnits(state: GameSession): Unit[] {
  const units: Unit[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const u = state.board[r][c];
      if (u && u.owner === 'ai' && !u.hasActedThisTurn && canAct(u)) {
        units.push(u);
      }
    }
  }
  // 射程の狭いユニット（前方1マスのみ）を先に行動させる
  return units.sort((a, b) => {
    const aRange = a.card.attackRange.type === 'ranged' ? a.card.attackRange.maxDistance : 1;
    const bRange = b.card.attackRange.type === 'ranged' ? b.card.attackRange.maxDistance : 1;
    return aRange - bRange;
  });
}

// ─── ユニット行動の実行 ───────────────────────────────────────────────────────

export function applyUnitAction(
  state: GameSession,
  unit: Unit,
  action: UnitActionResult
): GameSession {
  let s = state;
  let u = unit;

  if (action.movePos) {
    s = simulateMove(s, u, action.movePos);
    const fresh = findUnit(s, u.instanceId);
    if (!fresh) return markActed(s, u);
    u = fresh;
  }

  if (action.attack) {
    s = simulateAttack(s, u, action.attack);
    const freshU = findUnit(s, u.instanceId);
    if (freshU) u = freshU;
  }

  return markActed(s, u);
}
