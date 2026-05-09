import { GameSession, Unit, Position } from '@/lib/types/game';
import {
  getAllUnitsOnBoard,
  getAlliesOnBoard,
  getEffectiveAtk,
  damageUnit,
  removeUnitFromBoard,
  findUnit,
  appendLog,
  healUnit,
  isSkillBlocked,
} from '@/lib/game/helpers';
import {
  getSkill,
  SkillContext,
  SkillTriggerKind,
} from '@/lib/game/skills/registry';
import { recalculateAuras } from '@/lib/game/aura';

// ─── デッドロック防止定数 ─────────────────────────────────────────────────

const MAX_DISPATCH_DEPTH = 20;

// ─── スキルコンテキスト生成ヘルパー ──────────────────────────────────────

function makeCtx(unit: Unit, state: GameSession, extra: Partial<SkillContext> = {}): SkillContext {
  return {
    remainingUses: unit.skillUsesRemaining,
    turnCount: state.turnCount,
    currentTurn: state.currentTurn,
    ...extra,
  };
}

// ─── 深度チェック ─────────────────────────────────────────────────────────

function getDepth(state: GameSession): number {
  return state.eventDepth ?? 0;
}

function enterDispatch(state: GameSession): GameSession {
  return { ...state, eventDepth: getDepth(state) + 1 };
}

function exitDispatch(state: GameSession): GameSession {
  return { ...state, eventDepth: Math.max(0, getDepth(state) - 1) };
}

// ─── スキル使用回数消費 ───────────────────────────────────────────────────

function decrementUses(state: GameSession, unit: Unit): GameSession {
  if (unit.skillUsesRemaining === 'infinite') return state;
  const updated = findUnit(state, unit.instanceId);
  if (!updated) return state;
  const board = state.board.map(r => [...r]);
  board[updated.position.row][updated.position.col] = {
    ...updated,
    skillUsesRemaining: Math.max(0, (updated.skillUsesRemaining as number) - 1),
  };
  return { ...state, board };
}

// ─── 死亡処理 ─────────────────────────────────────────────────────────────

function processDeath(state: GameSession, deadUnit: Unit): GameSession {
  if (getDepth(state) >= MAX_DISPATCH_DEPTH) return state;

  let workingState = enterDispatch(state);

  // 死亡時スキル発火
  const skill = deadUnit.card.skill ? getSkill(deadUnit.card.skill.id) : null;
  if (
    skill &&
    skill.triggerKind === 'on_death' &&
    !isSkillBlocked(deadUnit) &&
    deadUnit.skillUsesRemaining !== 0
  ) {
    const ctx = makeCtx(deadUnit, workingState);
    if (!skill.shouldTrigger || skill.shouldTrigger(ctx, deadUnit, workingState)) {
      const result = skill.onTrigger!(ctx, deadUnit, workingState);
      workingState = result.state;
      workingState = appendLog(workingState, ...result.log);
    }
  }

  // ボードから除去
  workingState = removeUnitFromBoard(workingState, deadUnit.instanceId);
  workingState = exitDispatch(workingState);
  return workingState;
}

// ─── ダメージ適用（メイン処理） ───────────────────────────────────────────

export interface DamageEvent {
  source: Unit | null;
  target: Unit;
  amount: number;
  tags?: string[];    // 'reflection', 'chain', etc.
}

export function applyDamage(
  state: GameSession,
  event: DamageEvent
): GameSession {
  if (getDepth(state) >= MAX_DISPATCH_DEPTH) return state;

  let workingState = enterDispatch(state);
  const { source, target, amount, tags = [] } = event;

  // 軽減スキルチェック（keigen）
  let finalAmount = amount;
  const targetSkill = target.card.skill ? getSkill(target.card.skill.id) : null;
  if (
    targetSkill?.triggerKind === 'aura' &&
    targetSkill.id === 'keigen' &&
    !isSkillBlocked(target)
  ) {
    finalAmount = Math.max(1, finalAmount - 1);
    workingState = appendLog(workingState, `${target.card.name}：軽減！ダメージ-1`);
  }

  // 鋼鉄の意志チェック（koutetsu_no_ishi）
  if (
    targetSkill?.id === 'koutetsu_no_ishi' &&
    !isSkillBlocked(target) &&
    target.skillUsesRemaining !== 0 &&
    finalAmount >= target.currentHp
  ) {
    finalAmount = target.currentHp - 1;
    workingState = decrementUses(workingState, target);
    workingState = appendLog(workingState, `${target.card.name}：鋼鉄の意志！致死ダメージ無効`);
  }

  // ダメージ適用
  workingState = damageUnit(workingState, target.instanceId, finalAmount);
  const updatedTarget = findUnit(workingState, target.instanceId);
  workingState = appendLog(workingState, `${target.card.name} が ${finalAmount} ダメージ`);

  // 被ダメージ時スキル（反射・怒り・吸血）
  if (updatedTarget && finalAmount > 0 && !tags.includes('reflection')) {
    const tSkill = updatedTarget.card.skill ? getSkill(updatedTarget.card.skill.id) : null;
    if (
      tSkill &&
      tSkill.triggerKind === 'on_damaged' &&
      !isSkillBlocked(updatedTarget) &&
      updatedTarget.skillUsesRemaining !== 0
    ) {
      const ctx = makeCtx(updatedTarget, workingState, {
        damagedBy: source ?? undefined,
        damageAmount: finalAmount,
      });
      if (!tSkill.shouldTrigger || tSkill.shouldTrigger(ctx, updatedTarget, workingState)) {
        const result = tSkill.onTrigger!(ctx, updatedTarget, workingState);
        workingState = result.state;
        workingState = appendLog(workingState, ...result.log);
      }
    }
  }

  // 攻撃者の吸血スキル
  if (source && finalAmount > 0) {
    const freshSource = findUnit(workingState, source.instanceId);
    if (freshSource) {
      const sSkill = freshSource.card.skill ? getSkill(freshSource.card.skill.id) : null;
      if (sSkill?.id === 'kyuuketsu' && !isSkillBlocked(freshSource)) {
        workingState = healUnit(workingState, freshSource.instanceId, finalAmount);
        workingState = appendLog(workingState, `${freshSource.card.name}：吸血で ${finalAmount} 回復`);
      }
    }
  }

  // HP <= 0 で死亡処理
  const afterDamage = findUnit(workingState, target.instanceId);
  if (afterDamage && afterDamage.currentHp <= 0) {
    workingState = processDeath(workingState, afterDamage);
    workingState = appendLog(workingState, `${target.card.name} が倒れた`);
  }

  // 勝敗判定
  workingState = checkWinner(workingState);
  workingState = exitDispatch(workingState);

  // オーラ再計算
  workingState = recalculateAuras(workingState);

  return workingState;
}

// ─── 召喚時スキル発火 ─────────────────────────────────────────────────────

export function triggerOnSummon(state: GameSession, unit: Unit): GameSession {
  if (getDepth(state) >= MAX_DISPATCH_DEPTH) return state;

  const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
  if (!skill || skill.triggerKind !== 'on_summon') return state;
  if (isSkillBlocked(unit) || unit.skillUsesRemaining === 0) return state;

  let workingState = enterDispatch(state);
  const ctx = makeCtx(unit, workingState);

  if (!skill.shouldTrigger || skill.shouldTrigger(ctx, unit, workingState)) {
    const result = skill.onTrigger!(ctx, unit, workingState);
    workingState = result.state;
    workingState = appendLog(workingState, ...result.log);
    workingState = decrementUses(workingState, unit);
  }

  workingState = exitDispatch(workingState);
  workingState = recalculateAuras(workingState);
  return workingState;
}

// ─── 攻撃時スキル発火 ─────────────────────────────────────────────────────

export function triggerOnAttack(
  state: GameSession,
  attacker: Unit,
  target: Unit,
  damageDealt: number
): GameSession {
  if (getDepth(state) >= MAX_DISPATCH_DEPTH) return state;

  const skill = attacker.card.skill ? getSkill(attacker.card.skill.id) : null;
  if (!skill || skill.triggerKind !== 'on_attack') return state;
  if (isSkillBlocked(attacker) || attacker.skillUsesRemaining === 0) return state;

  let workingState = enterDispatch(state);
  const freshAttacker = findUnit(workingState, attacker.instanceId) ?? attacker;
  const freshTarget = findUnit(workingState, target.instanceId);
  // 攻撃対象が死亡してボードから除去済みでも、位置情報のために元のUnit参照を渡す
  const ctx = makeCtx(freshAttacker, workingState, {
    attackTarget: freshTarget ?? target,
    damageAmount: damageDealt,
  });

  if (!skill.shouldTrigger || skill.shouldTrigger(ctx, freshAttacker, workingState)) {
    const result = skill.onTrigger!(ctx, freshAttacker, workingState);
    workingState = result.state;
    workingState = appendLog(workingState, ...result.log);
  }

  workingState = exitDispatch(workingState);
  workingState = recalculateAuras(workingState);
  return workingState;
}

// ─── ターン開始時スキル発火 ───────────────────────────────────────────────

export function triggerOnTurnStart(state: GameSession, currentTurn: 'player' | 'ai'): GameSession {
  let workingState = state;
  const units = getAllUnitsOnBoard(workingState);

  for (const unit of units) {
    const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skill || skill.triggerKind !== 'on_turn_start') continue;
    if (isSkillBlocked(unit)) continue;
    const freshUnit = findUnit(workingState, unit.instanceId);
    if (!freshUnit || freshUnit.skillUsesRemaining === 0) continue;

    const ctx = makeCtx(freshUnit, workingState);
    if (skill.shouldTrigger && !skill.shouldTrigger(ctx, freshUnit, workingState)) continue;

    const result = skill.onTrigger!(ctx, freshUnit, workingState);
    workingState = result.state;
    workingState = appendLog(workingState, ...result.log);
    workingState = decrementUses(workingState, freshUnit);
  }

  // 勝敗判定
  workingState = checkWinner(workingState);
  workingState = recalculateAuras(workingState);
  return workingState;
}

// ─── ターン終了時スキル発火 ───────────────────────────────────────────────

export function triggerOnTurnEnd(state: GameSession, currentTurn: 'player' | 'ai'): GameSession {
  let workingState = state;
  const units = getAllUnitsOnBoard(workingState).filter(u => u.owner === currentTurn);

  for (const unit of units) {
    const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skill || skill.triggerKind !== 'on_turn_end') continue;
    if (isSkillBlocked(unit)) continue;

    const freshUnit = findUnit(workingState, unit.instanceId);
    if (!freshUnit || freshUnit.skillUsesRemaining === 0) continue;

    const ctx = makeCtx(freshUnit, workingState);
    if (skill.shouldTrigger && !skill.shouldTrigger(ctx, freshUnit, workingState)) continue;

    const result = skill.onTrigger!(ctx, freshUnit, workingState);
    workingState = result.state;
    workingState = appendLog(workingState, ...result.log);
    workingState = decrementUses(workingState, freshUnit);
  }

  workingState = recalculateAuras(workingState);
  return workingState;
}

// ─── 起動型スキル実行 ─────────────────────────────────────────────────────

export function resolveActivatedSkill(
  state: GameSession,
  unit: Unit,
  target: Position | null,
  extraCtx?: Record<string, unknown>
): GameSession {
  const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
  if (!skill || skill.triggerKind !== 'activated') return state;
  if (isSkillBlocked(unit)) return state;

  const ctx = makeCtx(unit, state);
  if (skill.canActivate && !skill.canActivate(state, unit, ctx)) return state;

  const result = skill.resolve!(state, unit, target, extraCtx);
  let workingState = result.state;
  workingState = appendLog(workingState, ...result.log);
  workingState = decrementUses(workingState, unit);
  workingState = checkWinner(workingState);
  workingState = recalculateAuras(workingState);
  return workingState;
}

// ─── 勝敗判定 ─────────────────────────────────────────────────────────────

export function checkWinner(state: GameSession): GameSession {
  if (state.winner) return state;
  if (state.player.baseHp <= 0) return { ...state, winner: 'ai', phase: 'finished' };
  if (state.ai.baseHp <= 0) return { ...state, winner: 'player', phase: 'finished' };
  return state;
}

// ─── 反撃処理（互換性維持） ───────────────────────────────────────────────

export function applyCounterAttack(
  state: GameSession,
  defender: Unit,
  attacker: Unit
): GameSession {
  const skill = defender.card.skill ? getSkill(defender.card.skill.id) : null;
  if (skill?.id !== 'hangeki') return state;
  if (isSkillBlocked(defender)) return state;
  if (defender.skillUsesRemaining === 0) return state;

  const dmg = getEffectiveAtk(defender);
  const freshAttacker = findUnit(state, attacker.instanceId);
  if (!freshAttacker) return state;

  let workingState = appendLog(state, `${defender.card.name}：反撃！${attacker.card.name} に ${dmg} ダメージ`);
  workingState = applyDamage(workingState, { source: defender, target: freshAttacker, amount: dmg, tags: ['counter'] });
  return workingState;
}
