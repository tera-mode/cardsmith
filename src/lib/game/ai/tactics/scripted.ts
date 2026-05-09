import { GameSession, Unit } from '@/lib/types/game';
import { getLegalMoves, getLegalAttacks, getLegalSummonPositions, BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';
import { canAct } from '@/lib/game/helpers';
import { AIAction, EvalWeights, Owner, TacticStrategy } from '../types';
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
    // state.currentTurn でアクティブな owner を決定（シム・通常ゲーム両対応）
    const owner: Owner = state.currentTurn as Owner;
    const ownerState = owner === 'ai' ? state.ai : state.player;

    // AI陣（row0）から前進 = row増加、Player陣（row3）から前進 = row減少
    const isForward = owner === 'ai'
      ? (p: { row: number }, cur: { row: number }) => p.row > cur.row
      : (p: { row: number }, cur: { row: number }) => p.row < cur.row;

    // 前列の判定（より前線に近い）
    const frontRow = (a: Unit, b: Unit) =>
      owner === 'ai'
        ? b.position.row - a.position.row  // AI: row大きい方が前線
        : a.position.row - b.position.row; // Player: row小さい方が前線

    const actions: AIAction[] = [];

    // 1. 召喚: 最安カードを前線に最も近い空マスへ
    if (!ownerState.hasSummonedThisTurn && ownerState.hand.length > 0) {
      const positions = getLegalSummonPositions(state.board, owner);
      if (positions.length > 0) {
        const sorted = [...ownerState.hand].map((c, i) => ({ c, i })).sort((a, b) => a.c.cost - b.c.cost);
        const { i: cardIdx } = sorted[0];
        // 前線（相手に近い）マスを選ぶ
        const sortedPos = positions.slice().sort((a, b) =>
          owner === 'ai' ? b.row - a.row : a.row - b.row  // AI: row大きい方、Player: row小さい方
        );
        actions.push({ type: 'summon', cardIndex: cardIdx, position: sortedPos[0] });
      }
    }

    // 2. ユニット行動: 前線のユニットから処理
    const units: Unit[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const u = state.board[r][c];
        if (u && u.owner === owner && !u.hasActedThisTurn && canAct(u)) {
          units.push(u);
        }
      }
    }
    units.sort(frontRow);

    const MAX_ACTIONS = 2;
    let actionsUsed = ownerState.actionsUsedThisTurn;

    for (const unit of units) {
      // a) 攻撃可能なら攻撃（1ターン最大2回）
      if (actionsUsed < MAX_ACTIONS) {
        const attacks = getLegalAttacks(unit, state.board);
        if (attacks.length > 0) {
          actions.push({ type: 'attack', unitId: unit.instanceId, target: attacks[0] });
          actionsUsed++;
          continue;
        }
      }

      // b) 前進（owner に応じた方向）
      const moves = getLegalMoves(unit, state.board).filter(p => isForward(p, unit.position));
      if (moves.length > 0) {
        const pos = moves.slice().sort((a, b) =>
          owner === 'ai' ? b.row - a.row : a.row - b.row
        )[0];
        actions.push({ type: 'move', unitId: unit.instanceId, position: pos });
      }
      // c) 動けなければ何もしない
    }

    return actions;
  },
};
