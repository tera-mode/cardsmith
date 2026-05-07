import { GameSession } from '@/lib/types/game';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';
import { EvalWeights, DEFAULT_WEIGHTS } from './types';

const HEALER_SKILLS = new Set(['heal', 'saisei', 'haru_no_ibuki', 'keigan']);

export function evaluateBoard(
  state: GameSession,
  owner: 'player' | 'ai',
  weights: EvalWeights = DEFAULT_WEIGHTS
): number {
  const allied = owner;
  const enemy = owner === 'ai' ? 'player' : 'ai';

  // 勝敗が確定していたら最大/最小スコア
  if (state.winner === allied) return 100000;
  if (state.winner === enemy) return -100000;

  const alliedBase = owner === 'ai' ? state.ai.baseHp : state.player.baseHp;
  const enemyBase  = owner === 'ai' ? state.player.baseHp : state.ai.baseHp;

  let score = (alliedBase - enemyBase) * weights.baseHpDiff;
  let hasHealer = false;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const unit = state.board[r][c];
      if (!unit) continue;

      const unitValue = unit.currentHp + (unit.card.atk ?? 0);

      if (unit.owner === allied) {
        score += unitValue * weights.alliedUnitValue;
        // 前進度: AI→row が大きいほど前進, Player→row が小さいほど前進
        const advance = owner === 'ai' ? r : (BOARD_ROWS - 1 - r);
        score += advance * weights.alliedAdvance;
        if (unit.card.skill && HEALER_SKILLS.has(unit.card.skill.id)) {
          hasHealer = true;
        }
      } else {
        score += unitValue * weights.enemyUnitValue;
        // 敵の前進度（高いほど自陣に近い → 悪い）
        const enemyAdv = owner === 'ai' ? (BOARD_ROWS - 1 - r) : r;
        score += enemyAdv * weights.enemyAdvance;
      }
    }
  }

  if (hasHealer) score += weights.healerPresence;

  // 手札の多さをわずかに評価（行動選択肢の豊富さ）
  const alliedHand = owner === 'ai' ? state.ai.hand.length : state.player.hand.length;
  score += alliedHand * 0.5;

  return score;
}
