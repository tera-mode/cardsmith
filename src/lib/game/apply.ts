/**
 * 純関数アクション適用層
 * rules.ts と events/dispatcher の両方を使うため、循環依存を避けてここに置く。
 * AI・GameContext・将来のシミュレーターから共用する。
 */
import { GameSession, Unit, Position, AttackTarget } from '@/lib/types/game';
import { createUnit, placeUnit, removeUnit, resolveAttack, BOARD_ROWS } from '@/lib/game/rules';
import {
  applyDamage, triggerOnSummon, triggerOnAttack,
  applyCounterAttack, checkWinner, resolveActivatedSkill,
} from '@/lib/game/events/dispatcher';
import { getEffectiveAtk, findUnit } from '@/lib/game/helpers';
import type { AIAction, Owner } from '@/lib/game/ai/types';

// ─── 内部ユーティリティ ────────────────────────────────────────────────────

function updateUnitOnBoard(state: GameSession, unit: Unit): GameSession {
  const board = state.board.map(r => [...r]);
  board[unit.position.row][unit.position.col] = unit;
  return { ...state, board };
}

// ─── 純関数群 ─────────────────────────────────────────────────────────────

export function applySummon(
  state: GameSession,
  owner: Owner,
  cardIdx: number,
  pos: Position,
): GameSession {
  const ownerState = owner === 'ai' ? state.ai : state.player;
  const card = ownerState.hand[cardIdx];
  if (!card) return state;

  const unit = createUnit(card, owner, pos);
  const board = placeUnit(state.board, unit, pos);
  const newHand = ownerState.hand.filter((_, i) => i !== cardIdx);
  const logMsg = owner === 'ai' ? `AI: ${card.name} を召喚` : `${card.name} を召喚`;

  let s: GameSession;
  if (owner === 'ai') {
    s = { ...state, board, ai: { ...state.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...state.log, logMsg] };
  } else {
    s = { ...state, board, player: { ...state.player, hand: newHand, hasSummonedThisTurn: true }, log: [...state.log, logMsg] };
  }

  s = triggerOnSummon(s, unit);
  return checkWinner(s);
}

export function applyMove(
  state: GameSession,
  unitId: string,
  pos: Position,
): GameSession {
  const unit = findUnit(state, unitId);
  if (!unit) return state;

  const cleared = removeUnit(state.board, unit.position);
  const moved: Unit = { ...unit, position: pos, hasMovedThisTurn: true };
  const board = placeUnit(cleared, moved, pos);
  return { ...state, board, log: [...state.log, `${unit.card.name} が移動`] };
}

export function applyAttack(
  state: GameSession,
  attackerId: string,
  target: AttackTarget,
): GameSession {
  const attacker = findUnit(state, attackerId);
  if (!attacker) return state;

  const owner = attacker.owner;
  let s: GameSession;

  if (target.type === 'base') {
    const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, attacker, target);
    s = {
      ...state, board,
      player: { ...state.player, baseHp: playerBaseHp },
      ai: { ...state.ai, baseHp: aiBaseHp },
      log: [...state.log, ...log],
    };
  } else {
    const defender = target.unit;
    const atk = getEffectiveAtk(attacker);
    s = applyDamage(state, { source: attacker, target: defender, amount: atk });

    const freshDef = findUnit(s, defender.instanceId);
    if (freshDef?.card.skill?.id === 'hangeki') {
      s = applyCounterAttack(s, freshDef, attacker);
    }
    const freshAtk = findUnit(s, attacker.instanceId);
    if (freshAtk) s = triggerOnAttack(s, freshAtk, defender, atk);
  }

  // 攻撃者を行動済みにマーク
  const freshAtk = findUnit(s, attackerId);
  if (freshAtk) s = updateUnitOnBoard(s, { ...freshAtk, hasActedThisTurn: true });

  // 行動カウンタを増分（上限2）
  if (owner === 'ai') {
    s = { ...s, ai: { ...s.ai, actionsUsedThisTurn: s.ai.actionsUsedThisTurn + 1 } };
  } else {
    s = { ...s, player: { ...s.player, actionsUsedThisTurn: s.player.actionsUsedThisTurn + 1 } };
  }

  return checkWinner(s);
}

export function applySkill(
  state: GameSession,
  casterId: string,
  target: Position | null,
): GameSession {
  const caster = findUnit(state, casterId);
  if (!caster) return state;

  const owner = caster.owner;
  let s = resolveActivatedSkill(state, caster, target);

  // スキル発動後、ユニットを行動済みにマーク
  const fresh = findUnit(s, casterId);
  if (fresh) s = updateUnitOnBoard(s, { ...fresh, hasActedThisTurn: true });

  // 行動カウンタを増分（攻撃と合算）
  if (owner === 'ai') {
    s = { ...s, ai: { ...s.ai, actionsUsedThisTurn: s.ai.actionsUsedThisTurn + 1 } };
  } else {
    s = { ...s, player: { ...s.player, actionsUsedThisTurn: s.player.actionsUsedThisTurn + 1 } };
  }

  return checkWinner(s);
}

/**
 * シミュレーション用ターン終了（ドロー・スキル発火なし、ターン切替のみ）
 */
export function applyEndTurn(state: GameSession): GameSession {
  const nextTurn = state.currentTurn === 'ai' ? 'player' : 'ai';

  // 盤面ユニットのターンフラグをリセット
  const board = state.board.map(row =>
    row.map(cell => cell ? { ...cell, hasActedThisTurn: false, hasMovedThisTurn: false } : null)
  );

  // 次の手番のドロー（シミュレーション用：簡易版）
  let s: GameSession = { ...state, board };
  if (nextTurn === 'ai') {
    const [drawn, ...deck] = s.ai.deck;
    s = {
      ...s,
      currentTurn: 'ai',
      turnCount: s.turnCount + 1,
      ai: {
        ...s.ai,
        deck: drawn ? deck : s.ai.deck,
        hand: drawn ? [...s.ai.hand, drawn] : s.ai.hand,
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
        actionsUsedThisTurn: 0,
      },
    };
  } else {
    const [drawn, ...deck] = s.player.deck;
    s = {
      ...s,
      currentTurn: 'player',
      turnCount: s.turnCount + 1,
      player: {
        ...s.player,
        deck: drawn ? deck : s.player.deck,
        hand: drawn ? [...s.player.hand, drawn] : s.player.hand,
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
        actionsUsedThisTurn: 0,
      },
    };
  }

  return s;
}

export function applyAction(
  state: GameSession,
  action: AIAction,
  owner: Owner,
): GameSession {
  switch (action.type) {
    case 'summon':   return applySummon(state, owner, action.cardIndex, action.position);
    case 'move':     return applyMove(state, action.unitId, action.position);
    case 'attack':   return applyAttack(state, action.unitId, action.target);
    case 'skill':    return applySkill(state, action.unitId, action.target);
    case 'end_turn': return state;
  }
}
