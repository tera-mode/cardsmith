import { GameSession, Unit } from '@/lib/types/game';
import { getAllUnitsOnBoard, findUnit } from '@/lib/game/helpers';
import { getSkill } from '@/lib/game/skills/registry';

// ─── オーラ再計算 ─────────────────────────────────────────────────────────
//
// 戦旗・聖なる加護などオーラ型スキルは毎回このルートで再計算する。
// 直接 buffs.auraAtk / buffs.auraMaxHp を変更しないこと。

export function recalculateAuras(state: GameSession): GameSession {
  // 1. 全ユニットのオーラバフをリセット
  let workingState = resetAuras(state);

  // 2. 各ユニットのオーラスキルを適用
  const units = getAllUnitsOnBoard(workingState);
  for (const unit of units) {
    const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skill || skill.triggerKind !== 'aura') continue;
    if (unit.statusEffects.silenced) continue;
    if (!skill.applyAura) continue;

    workingState = skill.applyAura(workingState, unit);
  }

  return workingState;
}

function resetAuras(state: GameSession): GameSession {
  const board = state.board.map(row =>
    row.map(unit => {
      if (!unit) return null;
      return {
        ...unit,
        buffs: { ...unit.buffs, auraAtk: 0, auraMaxHp: 0 },
      };
    })
  );
  return { ...state, board };
}

// ─── オーラ適用ヘルパー ───────────────────────────────────────────────────

export function addAuraAtk(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  const board = state.board.map(r => [...r]);
  board[unit.position.row][unit.position.col] = {
    ...unit,
    buffs: { ...unit.buffs, auraAtk: unit.buffs.auraAtk + amount },
  };
  return { ...state, board };
}

export function addAuraMaxHp(state: GameSession, instanceId: string, amount: number): GameSession {
  const unit = findUnit(state, instanceId);
  if (!unit) return state;
  const board = state.board.map(r => [...r]);
  board[unit.position.row][unit.position.col] = {
    ...unit,
    buffs: { ...unit.buffs, auraMaxHp: unit.buffs.auraMaxHp + amount },
    maxHp: unit.card.hp + unit.buffs.auraMaxHp + amount,
  };
  return { ...state, board };
}
