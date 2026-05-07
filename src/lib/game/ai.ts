import { GameSession, Unit } from '@/lib/types/game';
import {
  getLegalMoves, getLegalAttacks, getLegalSummonPositions,
  createUnit, placeUnit, removeUnit, resolveAttack,
  BOARD_ROWS, BOARD_COLS,
} from '@/lib/game/rules';
import {
  applyDamage, triggerOnSummon, triggerOnAttack,
  applyCounterAttack, resolveActivatedSkill, checkWinner,
} from '@/lib/game/events/dispatcher';
import { getSkill } from '@/lib/game/skills/index';
import { getEffectiveAtk, findUnit, canAct } from '@/lib/game/helpers';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DELAY_MS = 600;
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeAITurn(
  session: GameSession,
  onUpdate: (session: GameSession) => void
): Promise<GameSession> {
  let state = { ...session };

  // 1. 召喚（80%確率）
  if (Math.random() < 0.8 && !state.ai.hasSummonedThisTurn && state.ai.hand.length > 0) {
    const summonPositions = getLegalSummonPositions(state.board, 'ai');
    if (summonPositions.length > 0) {
      const card = pickRandom(state.ai.hand);
      const pos = pickRandom(summonPositions);
      const unit = createUnit(card, 'ai', pos);
      const newBoard = placeUnit(state.board, unit, pos);
      const idx = state.ai.hand.findIndex((c) => c.id === card.id);
      const newHand = state.ai.hand.filter((_, i) => i !== idx);
      state = { ...state, board: newBoard, ai: { ...state.ai, hand: newHand, hasSummonedThisTurn: true }, log: [...state.log, `AI: ${card.name} を召喚`] };
      state = triggerOnSummon(state, unit);
      onUpdate(state);
      await delay(DELAY_MS);
    }
  }

  // 2. 全ユニット行動（95%確率）
  if (Math.random() < 0.95) {
    const aiUnits: Unit[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const unit = state.board[r][c];
        if (unit && unit.owner === 'ai' && !unit.hasActedThisTurn && canAct(unit)) {
          aiUnits.push(unit);
        }
      }
    }

    if (aiUnits.length > 0) {
      const unit = pickRandom(aiUnits);

      // 移動
      const moves = getLegalMoves(unit, state.board);
      const forwardMoves = moves.filter((p) => p.row > unit.position.row);
      const lateralMoves = moves.filter((p) => p.row === unit.position.row);
      const priorityMoves = forwardMoves.length > 0 ? forwardMoves : lateralMoves;

      let movedUnit = unit;
      if (priorityMoves.length > 0) {
        const chosenPos = pickRandom(priorityMoves);
        const newBoard = removeUnit(state.board, unit.position);
        movedUnit = { ...unit, position: chosenPos };
        state = { ...state, board: placeUnit(newBoard, movedUnit, chosenPos), log: [...state.log, `AI: ${unit.card.name} が移動`] };
        onUpdate(state);
        await delay(DELAY_MS);
      }

      // 攻撃/スキル
      const attacks = getLegalAttacks(movedUnit, state.board);
      const baseAttack = attacks.find((a) => a.type === 'base');
      const unitAttacks = attacks.filter((a) => a.type === 'unit');
      const frontRow = BOARD_ROWS - 1;

      if (baseAttack && movedUnit.position.row === frontRow) {
        // ベース攻撃
        const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, movedUnit, baseAttack);
        let nextState: GameSession = { ...state, board, player: { ...state.player, baseHp: playerBaseHp }, ai: { ...state.ai, baseHp: aiBaseHp }, log: [...state.log, ...log] };
        const finalBoard = nextState.board.map((r) => [...r]);
        const u = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
        if (u) finalBoard[movedUnit.position.row][movedUnit.position.col] = { ...u, hasActedThisTurn: true };
        state = checkWinner({ ...nextState, board: finalBoard });

      } else if (unitAttacks.length > 0 && Math.random() < 0.7) {
        // ユニット攻撃
        const target = pickRandom(unitAttacks);
        if (target.type === 'unit') {
          const defender = target.unit;
          const atk = getEffectiveAtk(movedUnit);
          let nextState = applyDamage(state, { source: movedUnit, target: defender, amount: atk });

          // 反撃
          const freshDefender = findUnit(nextState, defender.instanceId);
          if (freshDefender && freshDefender.card.skill?.id === 'hangeki') {
            nextState = applyCounterAttack(nextState, freshDefender, movedUnit);
          }

          // 攻撃後スキル
          const freshAttacker = findUnit(nextState, movedUnit.instanceId);
          if (freshAttacker) {
            nextState = triggerOnAttack(nextState, freshAttacker, defender, atk);
          }

          const finalBoard = nextState.board.map((r) => [...r]);
          const u = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
          if (u) finalBoard[movedUnit.position.row][movedUnit.position.col] = { ...u, hasActedThisTurn: true };
          state = checkWinner({ ...nextState, board: finalBoard });
        }

      } else if (Math.random() < 0.4) {
        // 起動型スキル使用
        const skill = movedUnit.card.skill;
        if (skill) {
          const skillDef = getSkill(skill.id);
          if (skillDef?.triggerKind === 'activated') {
            const ctx = { remainingUses: movedUnit.skillUsesRemaining, turnCount: state.turnCount, currentTurn: state.currentTurn as 'player' | 'ai' };
            if (!skillDef.canActivate || skillDef.canActivate(state, movedUnit, ctx)) {
              const targets = skillDef.getValidTargets ? skillDef.getValidTargets(state, movedUnit) : [];
              const target = targets.length > 0 ? pickRandom(targets) : null;
              state = resolveActivatedSkill(state, movedUnit, target);

              const finalBoard = state.board.map((r) => [...r]);
              const u = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
              if (u) finalBoard[movedUnit.position.row][movedUnit.position.col] = { ...u, hasActedThisTurn: true };
              state = { ...state, board: finalBoard };
            }
          }
        }
      }

      onUpdate(state);
      await delay(DELAY_MS);

      if (state.winner) return state;
    }
  }

  return state;
}
