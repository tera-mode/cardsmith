import { GameSession, Unit } from '@/lib/types/game';
import { BOARD_ROWS, BOARD_COLS, getLegalAttacks } from '@/lib/game/rules';
import { EvalWeights, Owner } from './types';

const HEALER_SKILLS = new Set(['heal', 'saisei', 'haru_no_ibuki', 'keigan']);
const ACTIVATED_SKILLS = new Set(['penetrate', 'freeze', 'buff', 'heal', 'saisei', 'keigan', 'haru_no_ibuki', 'kamikaze', 'rengeki', 'swap', 'bless']);

function getAllUnits(state: GameSession): Unit[] {
  const units: Unit[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const u = state.board[r][c];
      if (u) units.push(u);
    }
  }
  return units;
}

function frontRow(owner: Owner): number {
  return owner === 'ai' ? 0 : BOARD_ROWS - 1;
}

export function evaluateBoard(
  state: GameSession,
  owner: Owner,
  weights: EvalWeights,
): number {
  return evaluateBoardDetailed(state, owner, weights).total;
}

export function evaluateBoardDetailed(
  state: GameSession,
  owner: Owner,
  weights: EvalWeights,
): { total: number; breakdown: Record<keyof EvalWeights, number> } {
  const enemy: Owner = owner === 'ai' ? 'player' : 'ai';

  if (state.winner === owner) return { total: 100000, breakdown: {} as Record<keyof EvalWeights, number> };
  if (state.winner === enemy)  return { total: -100000, breakdown: {} as Record<keyof EvalWeights, number> };

  const alliedBase = owner === 'ai' ? state.ai.baseHp : state.player.baseHp;
  const enemyBase  = owner === 'ai' ? state.player.baseHp : state.ai.baseHp;

  const breakdown: Record<keyof EvalWeights, number> = {
    baseHpDiff: (alliedBase - enemyBase) * weights.baseHpDiff,
    alliedUnitValue: 0,
    enemyUnitValue: 0,
    alliedAdvance: 0,
    enemyAdvance: 0,
    healerPresence: 0,
    skillPotential: 0,
    enemyAttackThreat: 0,
    alliedAttackThreat: 0,
  };

  let hasHealer = false;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const unit = state.board[r][c];
      if (!unit) continue;

      const unitValue = unit.currentHp + (unit.card.atk ?? 0);

      if (unit.owner === owner) {
        breakdown.alliedUnitValue += unitValue * weights.alliedUnitValue;
        // 前進度: AI → row大きい, Player → row小さい
        const advance = owner === 'ai' ? r : (BOARD_ROWS - 1 - r);
        breakdown.alliedAdvance += advance * weights.alliedAdvance;

        if (unit.card.skill && HEALER_SKILLS.has(unit.card.skill.id)) {
          hasHealer = true;
        }

        // スキルポテンシャル（activated種別で残回数あり）
        if (
          unit.card.skill &&
          ACTIVATED_SKILLS.has(unit.card.skill.id) &&
          unit.skillUsesRemaining !== 0
        ) {
          const uses = unit.skillUsesRemaining === 'infinite' ? 3 : unit.skillUsesRemaining;
          breakdown.skillPotential += uses * weights.skillPotential;
        }

        // 自軍の攻撃脅威（次ターン敵陣を攻撃可能なユニット数）
        const attacks = getLegalAttacks(unit, state.board);
        const baseRow = owner === 'ai' ? 0 : BOARD_ROWS - 1;
        const canHitBase = attacks.some(a =>
          a.type === 'base' ||
          (a.type === 'unit' && a.unit.owner === enemy && a.unit.position.row === baseRow)
        );
        if (canHitBase || attacks.some(a => a.type === 'base')) {
          breakdown.alliedAttackThreat += weights.alliedAttackThreat;
        }
      } else {
        breakdown.enemyUnitValue += unitValue * weights.enemyUnitValue;
        const enemyAdv = owner === 'ai' ? (BOARD_ROWS - 1 - r) : r;
        breakdown.enemyAdvance += enemyAdv * weights.enemyAdvance;

        // 敵の攻撃脅威
        const attacks = getLegalAttacks(unit, state.board);
        if (attacks.some(a => a.type === 'base')) {
          breakdown.enemyAttackThreat += weights.enemyAttackThreat;
        }
      }
    }
  }

  if (hasHealer) breakdown.healerPresence = weights.healerPresence;

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}
