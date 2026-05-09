import { GameSession, Unit } from '@/lib/types/game';
import { getLegalMoves, getLegalAttacks, getLegalSummonPositions, BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';
import { canAct } from '@/lib/game/helpers';
import { AIAction, EvalWeights, TacticStrategy } from '../types';
import type { Rng } from '../rng';

const SCRIPTED_WEIGHTS: EvalWeights = {
  baseHpDiff: 25,
  alliedUnitValue: 2,
  enemyUnitValue: -2,
  alliedAdvance: 2,
  enemyAdvance: -1,
  healerPresence: 4,
  skillPotential: 0,
  enemyAttackThreat: -2,
  alliedAttackThreat: 2,
};

export const scripted: TacticStrategy = {
  id: 'scripted',
  defaultWeights: SCRIPTED_WEIGHTS,

  scriptedTurn(state: GameSession, _rng: Rng): AIAction[] {
    const actions: AIAction[] = [];

    // 1. 召喚: 最安カードを自陣に最も近い空マスへ
    if (!state.ai.hasSummonedThisTurn && state.ai.hand.length > 0) {
      const positions = getLegalSummonPositions(state.board, 'ai');
      if (positions.length > 0) {
        // 最安カードを選ぶ
        const sorted = [...state.ai.hand].map((c, i) => ({ c, i })).sort((a, b) => a.c.cost - b.c.cost);
        const { i: cardIdx } = sorted[0];
        // AI陣に最も近いマス (row 0 が AI 側前列)
        const pos = positions.slice().sort((a, b) => a.row - b.row)[0];
        actions.push({ type: 'summon', cardIndex: cardIdx, position: pos });
      }
    }

    // 2. ユニット行動: 前列（row小）のユニットから処理
    const units: Unit[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const u = state.board[r][c];
        if (u && u.owner === 'ai' && !u.hasActedThisTurn && canAct(u)) {
          units.push(u);
        }
      }
    }
    // 前列（row昇順）でソート
    units.sort((a, b) => a.position.row - b.position.row);

    // hasAttackedThisTurn をシミュレートするため追跡
    let hasAttacked = state.ai.hasAttackedThisTurn;

    for (const unit of units) {
      // a) 攻撃可能な敵があれば攻撃
      if (!hasAttacked) {
        const attacks = getLegalAttacks(unit, state.board);
        if (attacks.length > 0) {
          actions.push({ type: 'attack', unitId: unit.instanceId, target: attacks[0] });
          hasAttacked = true;
          continue;
        }
      }

      // b) 前進（row番号を減らす方向 = プレイヤー陣地に近づく）
      const moves = getLegalMoves(unit, state.board).filter(p => p.row < unit.position.row);
      if (moves.length > 0) {
        // 最も前進できるマス
        const pos = moves.slice().sort((a, b) => a.row - b.row)[0];
        actions.push({ type: 'move', unitId: unit.instanceId, position: pos });
      }
      // c) 動けなければ何もしない（スキルも使わない）
    }

    return actions;
  },
};
