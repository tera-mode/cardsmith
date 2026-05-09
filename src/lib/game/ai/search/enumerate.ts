import { GameSession, Unit } from '@/lib/types/game';
import {
  getLegalMoves, getLegalAttacks, getLegalSummonPositions,
  BOARD_ROWS, BOARD_COLS,
} from '@/lib/game/rules';
import { canAct } from '@/lib/game/helpers';
import { getSkill } from '@/lib/game/skills/index';
import { AIAction, Owner } from '../types';

export function enumerateActions(state: GameSession, owner: Owner): AIAction[] {
  const actions: AIAction[] = [{ type: 'end_turn' }];
  const ownerState = owner === 'ai' ? state.ai : state.player;

  // ── 召喚 ──────────────────────────────────────────────────────────────
  if (!ownerState.hasSummonedThisTurn && ownerState.hand.length > 0) {
    const positions = getLegalSummonPositions(state.board, owner);
    for (let i = 0; i < ownerState.hand.length; i++) {
      for (const pos of positions) {
        actions.push({ type: 'summon', cardIndex: i, position: pos });
      }
    }
  }

  // ── ユニット行動 ───────────────────────────────────────────────────────
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const unit = state.board[r][c];
      if (!unit || unit.owner !== owner) continue;
      if (unit.hasActedThisTurn || !canAct(unit)) continue;

      // 移動（このターンに移動済みでなければ）
      if (!unit.hasMovedThisTurn) {
        const moves = getLegalMoves(unit, state.board);
        for (const pos of moves) {
          actions.push({ type: 'move', unitId: unit.instanceId, position: pos });
        }
      }

      // 攻撃（1ターン1回制限）
      if (!ownerState.hasAttackedThisTurn) {
        const attacks = getLegalAttacks(unit, state.board);
        for (const target of attacks) {
          actions.push({ type: 'attack', unitId: unit.instanceId, target });
        }
      }

      // 起動型スキル
      if (!unit.statusEffects.silenced) {
        const skillDef = unit.card.skill ? getSkill(unit.card.skill.id) : null;
        if (skillDef?.triggerKind === 'activated' && unit.skillUsesRemaining !== 0) {
          const ctx = {
            remainingUses: unit.skillUsesRemaining,
            turnCount: state.turnCount,
            currentTurn: owner,
          };
          if (!skillDef.canActivate || skillDef.canActivate(state, unit, ctx)) {
            const targets = skillDef.getValidTargets
              ? skillDef.getValidTargets(state, unit)
              : [];
            if (targets.length > 0) {
              for (const target of targets) {
                actions.push({ type: 'skill', unitId: unit.instanceId, target });
              }
            } else {
              actions.push({ type: 'skill', unitId: unit.instanceId, target: null });
            }
          }
        }
      }
    }
  }

  return actions;
}
