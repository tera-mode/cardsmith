import { GameSession } from '@/lib/types/game';
import { applyAction } from '@/lib/game/apply';
import { evaluateBoard } from '../evaluator';
import { AIAction, BattleAIProfile, Owner, TacticStrategy } from '../types';
import { enumerateActions } from './enumerate';
import type { Rng } from '../rng';

export interface Ply1Options {
  onUpdate?: (s: GameSession) => void;
  delayFn?: (ms: number) => Promise<void>;
  delay?: number;
  debug?: boolean;
}

function pickBest(
  state: GameSession,
  candidates: AIAction[],
  profile: BattleAIProfile,
  tactic: TacticStrategy,
  owner: Owner,
  rng: Rng,
): { action: AIAction; score: number } {
  const weights = profile.evalWeights;

  const scored = candidates.map(a => ({
    a,
    score: a.type === 'end_turn'
      ? evaluateBoard(state, owner, weights)
      : evaluateBoard(applyAction(state, a, owner), owner, weights),
  }));

  // ソート: スコア降順 → tie-break → RNG
  scored.sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    if (tactic.preferAction) {
      const pref = tactic.preferAction(x.a, y.a, state);
      if (pref !== 0) return pref;
    }
    return rng.next() - 0.5;
  });

  if (profile.evalWeights && scored[0].score === scored[0].score && scored.length > 0) {
    if (process.env.NODE_ENV !== 'production') {
      // デバッグ用（本番では無効）
    }
  }

  return { action: scored[0].a, score: scored[0].score };
}

export async function ply1Search(
  initialState: GameSession,
  profile: BattleAIProfile,
  tactic: TacticStrategy,
  owner: Owner,
  rng: Rng,
  opts: Ply1Options = {},
): Promise<GameSession> {
  let state = initialState;
  const weights = profile.evalWeights;
  const { onUpdate, delayFn, delay = 600, debug = false } = opts;

  let iter = 0;
  const MAX_ITER = 30;

  while (iter++ < MAX_ITER) {
    const candidates = enumerateActions(state, owner);

    // end_turnのみなら終了
    if (candidates.length === 1 && candidates[0].type === 'end_turn') break;

    const { action, score } = pickBest(state, candidates, profile, tactic, owner, rng);

    if (debug) {
      const top5 = candidates
        .map(a => ({ a, score: a.type === 'end_turn' ? evaluateBoard(state, owner, weights) : evaluateBoard(applyAction(state, a, owner), owner, weights) }))
        .sort((x, y) => y.score - x.score)
        .slice(0, 5);
      console.log(`[AI:${profile.id}] iter=${iter} selected:`, action.type, 'score=', score);
      console.log('  top5:', top5.map(x => `${x.a.type}:${x.score.toFixed(1)}`).join(', '));
    }

    if (action.type === 'end_turn') break;

    state = applyAction(state, action, owner);

    if (onUpdate) onUpdate(state);
    if (delayFn && delay > 0) await delayFn(delay);
    if (state.winner) break;
  }

  return state;
}
