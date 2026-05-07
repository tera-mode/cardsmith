import { GameSession, Unit, Position } from '@/lib/types/game';
import {
  getLegalMoves, getLegalAttacks, getLegalSummonPositions,
  createUnit, placeUnit, removeUnit, resolveAttack, BOARD_ROWS,
} from '@/lib/game/rules';
import {
  triggerOnSummon, checkWinner, applyDamage, applyCounterAttack,
  triggerOnAttack,
} from '@/lib/game/events/dispatcher';
import { getEffectiveAtk, findUnit, canAct } from '@/lib/game/helpers';
import { canEnemySummon } from './enemyMP';
import {
  delay, bestSummon1Ply, bestSummon2Ply, bestUnitAction1Ply,
  getActableAIUnits, applyUnitAction,
} from './strategist';
import { AIDifficulty, DEFAULT_WEIGHTS, TUTORIAL_WEIGHTS, HARD_WEIGHTS } from './types';

const DELAY_ACTION = 600;
const DELAY_SUMMON = 400;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── チュートリアル ────────────────────────────────────────────────────────────
// 前進のみ・攻撃可能なら攻撃・召喚は最安コスト

async function executeTutorial(
  state: GameSession,
  onUpdate: (s: GameSession) => void
): Promise<GameSession> {
  let s = state;

  // 召喚: 最安カードを前列に出す
  if (!s.ai.hasSummonedThisTurn && s.ai.hand.length > 0) {
    const positions = getLegalSummonPositions(s.board, 'ai');
    if (positions.length > 0) {
      const sorted = [...s.ai.hand].sort((a, b) => a.cost - b.cost);
      const card = sorted[0];
      const cardIdx = s.ai.hand.findIndex(c => c.id === card.id);
      const pos = positions[0];
      if (canEnemySummon(card, s.turnCount, 0)) {
        const unit = createUnit(card, 'ai', pos);
        const board = placeUnit(s.board, unit, pos);
        const newHand = s.ai.hand.filter((_, i) => i !== cardIdx);
        s = { ...s, board, ai: { ...s.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...s.log, `AI: ${card.name} を召喚`] };
        s = triggerOnSummon(s, unit);
        s = checkWinner(s);
        onUpdate(s);
        await delay(DELAY_SUMMON);
        if (s.winner) return s;
      }
    }
  }

  // ユニット行動: 前進のみ、攻撃可能なら攻撃
  const units = getActableAIUnits(s);
  for (const unit of units) {
    const fresh = findUnit(s, unit.instanceId);
    if (!fresh) continue;

    const moves = getLegalMoves(fresh, s.board).filter(p => p.row > fresh.position.row);
    if (moves.length > 0) {
      const pos = moves[0];
      const cleared = removeUnit(s.board, fresh.position);
      const moved: Unit = { ...fresh, position: pos };
      s = { ...s, board: placeUnit(cleared, moved, pos), log: [...s.log, `AI: ${fresh.card.name} が前進`] };
    }

    const fresh2 = findUnit(s, unit.instanceId);
    if (!fresh2) continue;

    // 攻撃は1ターン1回まで（プレイヤー側と同じルール）
    if (!s.ai.hasAttackedThisTurn) {
      const attacks = getLegalAttacks(fresh2, s.board);
      if (attacks.length > 0) {
        const target = attacks[0];
        if (target.type === 'base') {
          const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(s, fresh2, target);
          s = checkWinner({ ...s, board, player: { ...s.player, baseHp: playerBaseHp }, ai: { ...s.ai, baseHp: aiBaseHp }, log: [...s.log, ...log] });
        } else if (target.type === 'unit') {
          const atk = getEffectiveAtk(fresh2);
          s = applyDamage(s, { source: fresh2, target: target.unit, amount: atk });
          s = checkWinner(s);
        }
        s = { ...s, ai: { ...s.ai, hasAttackedThisTurn: true } };
      }
    }

    // mark acted
    const b = s.board.map(r => [...r]);
    const u = b[fresh2.position.row]?.[fresh2.position.col];
    if (u) b[fresh2.position.row][fresh2.position.col] = { ...u, hasActedThisTurn: true };
    s = { ...s, board: b };

    onUpdate(s);
    await delay(DELAY_ACTION);
    if (s.winner) return s;
  }

  return s;
}

// ─── イージー ──────────────────────────────────────────────────────────────────
// 50% ランダム、50% 1手読み

async function executeEasy(
  state: GameSession,
  onUpdate: (s: GameSession) => void
): Promise<GameSession> {
  let s = state;

  // 召喚
  if (!s.ai.hasSummonedThisTurn && s.ai.hand.length > 0) {
    const positions = getLegalSummonPositions(s.board, 'ai');
    if (positions.length > 0) {
      let best = Math.random() < 0.5 ? null : bestSummon1Ply(s, DEFAULT_WEIGHTS);

      if (!best) {
        // ランダム: MP制約下でランダムに選ぶ
        const candidates: { cardIdx: number; pos: Position }[] = [];
        for (let i = 0; i < s.ai.hand.length; i++) {
          if (canEnemySummon(s.ai.hand[i], s.turnCount, 0)) {
            for (const pos of positions) candidates.push({ cardIdx: i, pos });
          }
        }
        if (candidates.length > 0) best = pickRandom(candidates);
      }

      if (best) {
        const card = s.ai.hand[best.cardIdx];
        const unit = createUnit(card, 'ai', best.pos);
        const board = placeUnit(s.board, unit, best.pos);
        const newHand = s.ai.hand.filter((_, i) => i !== best!.cardIdx);
        s = { ...s, board, ai: { ...s.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...s.log, `AI: ${card.name} を召喚`] };
        s = triggerOnSummon(s, unit);
        s = checkWinner(s);
        onUpdate(s);
        await delay(DELAY_SUMMON);
        if (s.winner) return s;
      }
    }
  }

  // ユニット行動
  const units = getActableAIUnits(s);
  for (const unit of units) {
    const fresh = findUnit(s, unit.instanceId);
    if (!fresh) continue;

    let action;
    if (Math.random() < 0.5) {
      // ランダム
      const moves = getLegalMoves(fresh, s.board);
      const movePos = moves.length > 0 && Math.random() < 0.6 ? pickRandom(moves) : null;

      let tempS = s;
      let tempU = fresh;
      if (movePos) {
        const cleared = removeUnit(tempS.board, tempU.position);
        tempU = { ...tempU, position: movePos };
        tempS = { ...tempS, board: placeUnit(cleared, tempU, movePos) };
      }

      // 攻撃は1ターン1回まで
      const canAttack = !s.ai.hasAttackedThisTurn;
      const attacks = canAttack ? getLegalAttacks(tempU, tempS.board) : [];
      const attack = attacks.length > 0 && Math.random() < 0.7 ? pickRandom(attacks) : null;
      action = { movePos, attack };
    } else {
      action = bestUnitAction1Ply(s, fresh, DEFAULT_WEIGHTS);
    }

    s = applyUnitAction(s, fresh, action);
    onUpdate(s);
    await delay(DELAY_ACTION);
    if (s.winner) return s;
  }

  return s;
}

// ─── ノーマル ──────────────────────────────────────────────────────────────────
// 常に1手読みで最善手を選ぶ

async function executeNormal(
  state: GameSession,
  onUpdate: (s: GameSession) => void
): Promise<GameSession> {
  let s = state;

  // 召喚
  if (!s.ai.hasSummonedThisTurn) {
    const best = bestSummon1Ply(s, DEFAULT_WEIGHTS);
    if (best) {
      const card = s.ai.hand[best.cardIdx];
      const unit = createUnit(card, 'ai', best.pos);
      const board = placeUnit(s.board, unit, best.pos);
      const newHand = s.ai.hand.filter((_, i) => i !== best.cardIdx);
      s = { ...s, board, ai: { ...s.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...s.log, `AI: ${card.name} を召喚`] };
      s = triggerOnSummon(s, unit);
      s = checkWinner(s);
      onUpdate(s);
      await delay(DELAY_SUMMON);
      if (s.winner) return s;
    }
  }

  // ユニット行動
  const units = getActableAIUnits(s);
  for (const unit of units) {
    const fresh = findUnit(s, unit.instanceId);
    if (!fresh) continue;

    const action = bestUnitAction1Ply(s, fresh, DEFAULT_WEIGHTS);
    s = applyUnitAction(s, fresh, action);
    onUpdate(s);
    await delay(DELAY_ACTION);
    if (s.winner) return s;
  }

  return s;
}

// ─── ハード ────────────────────────────────────────────────────────────────────
// 2手読み召喚 + 1手読み行動 + スキル使用ボーナス

async function executeHard(
  state: GameSession,
  onUpdate: (s: GameSession) => void
): Promise<GameSession> {
  let s = state;

  // 召喚: 2手読み
  if (!s.ai.hasSummonedThisTurn) {
    const best = bestSummon2Ply(s, HARD_WEIGHTS);
    if (best) {
      const card = s.ai.hand[best.cardIdx];
      const unit = createUnit(card, 'ai', best.pos);
      const board = placeUnit(s.board, unit, best.pos);
      const newHand = s.ai.hand.filter((_, i) => i !== best.cardIdx);
      s = { ...s, board, ai: { ...s.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...s.log, `AI: ${card.name} を召喚`] };
      s = triggerOnSummon(s, unit);
      s = checkWinner(s);
      onUpdate(s);
      await delay(DELAY_SUMMON);
      if (s.winner) return s;
    }
  }

  // ユニット行動: 1手読み + スキルボーナス
  const units = getActableAIUnits(s);
  for (const unit of units) {
    const fresh = findUnit(s, unit.instanceId);
    if (!fresh) continue;

    const action = bestUnitAction1Ply(s, fresh, HARD_WEIGHTS, 15);
    s = applyUnitAction(s, fresh, action);
    onUpdate(s);
    await delay(DELAY_ACTION);
    if (s.winner) return s;
  }

  return s;
}

// ─── エントリポイント ─────────────────────────────────────────────────────────

export async function executeAITurn(
  state: GameSession,
  onUpdate: (s: GameSession) => void,
  difficulty: AIDifficulty = 'normal'
): Promise<GameSession> {
  switch (difficulty) {
    case 'tutorial': return executeTutorial(state, onUpdate);
    case 'easy':     return executeEasy(state, onUpdate);
    case 'normal':   return executeNormal(state, onUpdate);
    case 'hard':     return executeHard(state, onUpdate);
    default:         return executeNormal(state, onUpdate);
  }
}
