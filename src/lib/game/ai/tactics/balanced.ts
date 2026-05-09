import { GameSession, Unit } from '@/lib/types/game';
import { BOARD_ROWS, getLegalAttacks } from '@/lib/game/rules';
import { applyAction } from '@/lib/game/apply';
import { evaluateBoard } from '../evaluator';
import { AIAction, EvalWeights, SearchOptions, TacticStrategy } from '../types';

const DEFAULT_WEIGHTS: EvalWeights = {
  baseHpDiff: 50,
  alliedUnitValue: 5,
  enemyUnitValue: -5,
  alliedAdvance: 3,
  enemyAdvance: -3,
  healerPresence: 8,
  skillPotential: 2,
  enemyAttackThreat: -8,
  alliedAttackThreat: 8,
};

// action typeの優先順位（同点tie-break用）
const ACTION_PRIORITY: Record<AIAction['type'], number> = {
  attack: 5,
  skill: 4,
  move: 3,
  summon: 2,
  end_turn: 1,
};

function roughScore(state: GameSession, action: AIAction, weights: EvalWeights): number {
  switch (action.type) {
    case 'summon': {
      const after = applyAction(state, action, 'ai');
      const allied = 0, adv = 0;
      // 召喚後の味方合計評価
      let s = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < 4; c++) {
          const u = after.board[r][c];
          if (u && u.owner === 'ai') {
            s += (u.currentHp + (u.card.atk ?? 0)) * weights.alliedUnitValue;
            s += r * weights.alliedAdvance;
          }
        }
      }
      return s;
    }
    case 'move': {
      const after = applyAction(state, action, 'ai');
      let s = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < 4; c++) {
          const u = after.board[r][c];
          if (u && u.owner === 'ai') s += r * weights.alliedAdvance;
        }
      }
      return s;
    }
    case 'attack': {
      const target = action.target;
      if (target.type === 'base') return 30;
      const defender = target.unit;
      const attacker = state.board.flatMap(r => r).find(u => u?.instanceId === action.unitId);
      const dmg = attacker ? (attacker.card.atk ?? 0) + (attacker.buffs?.atkBonus ?? 0) : 0;
      const lethal = dmg >= defender.currentHp;
      return dmg + (lethal ? (defender.currentHp + (defender.card.atk ?? 0)) * Math.abs(weights.enemyUnitValue) : 0);
    }
    case 'skill': {
      const unit = state.board.flatMap(r => r).find(u => u?.instanceId === action.unitId);
      const skillId = unit?.card.skill?.id ?? '';
      if (['heal', 'saisei', 'haru_no_ibuki', 'keigan'].includes(skillId)) return 15;
      if (['buff', 'bless'].includes(skillId)) return 12;
      if (['penetrate', 'kamikaze', 'rengeki'].includes(skillId)) return 10;
      if (['freeze'].includes(skillId)) return 8;
      return 5;
    }
    default:
      return 0;
  }
}

export const balanced: TacticStrategy = {
  id: 'balanced',
  defaultWeights: DEFAULT_WEIGHTS,

  prefilterActions(
    state: GameSession,
    actions: AIAction[],
    weights: EvalWeights,
    options: SearchOptions,
  ): AIAction[] {
    const topKSummon = options.topKSummon ?? actions.length;
    const topKAction = options.topKAction ?? actions.length;

    const summons = actions.filter(a => a.type === 'summon');
    const others  = actions.filter(a => a.type !== 'summon' && a.type !== 'end_turn');
    const endTurn = actions.filter(a => a.type === 'end_turn');

    const topSummons = summons
      .map(a => ({ a, s: roughScore(state, a, weights) }))
      .sort((x, y) => y.s - x.s)
      .slice(0, topKSummon)
      .map(x => x.a);

    const topOthers = others
      .map(a => ({ a, s: roughScore(state, a, weights) }))
      .sort((x, y) => y.s - x.s)
      .slice(0, topKAction)
      .map(x => x.a);

    return [...topSummons, ...topOthers, ...endTurn];
  },

  preferAction(a: AIAction, b: AIAction): number {
    return (ACTION_PRIORITY[b.type] ?? 0) - (ACTION_PRIORITY[a.type] ?? 0);
  },
};
