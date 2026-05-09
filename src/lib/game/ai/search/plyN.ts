import { GameSession } from '@/lib/types/game';
import { applyAction, applyEndTurn } from '@/lib/game/apply';
import { evaluateBoard } from '../evaluator';
import { AIAction, BattleAIProfile, EvalWeights, Owner, SearchOptions, TacticStrategy } from '../types';
import { enumerateActions } from './enumerate';
import type { Rng } from '../rng';

const DEFAULT_OPTS: Record<number, Required<SearchOptions>> = {
  2: { topKSummon: 5, topKAction: 5 },
  3: { topKSummon: 3, topKAction: 3 },
};

function getSearchOptions(profile: BattleAIProfile): Required<SearchOptions> {
  const depth = profile.searchDepth as 2 | 3;
  return {
    ...DEFAULT_OPTS[depth] ?? { topKSummon: 5, topKAction: 5 },
    ...profile.searchOptions,
  };
}

function opponent(o: Owner): Owner { return o === 'ai' ? 'player' : 'ai'; }

/**
 * 現在のownerのターンをgreedyに完了させる。
 * rootOwner = 評価関数の視点（最大化したい側）。
 */
function completeTurnGreedy(
  state: GameSession,
  owner: Owner,
  rootOwner: Owner,
  weights: EvalWeights,
  rng: Rng,
): GameSession {
  let s = state;
  const isMaximizer = owner === rootOwner;
  let iter = 0;
  while (iter++ < 20) {
    const candidates = enumerateActions(s, owner);
    const nonEnd = candidates.filter(a => a.type !== 'end_turn');
    if (nonEnd.length === 0) break;

    const best = nonEnd.reduce((b, a) => {
      const sa = evaluateBoard(applyAction(s, a, owner), rootOwner, weights);
      const sb = evaluateBoard(applyAction(s, b, owner), rootOwner, weights);
      return isMaximizer ? (sa > sb ? a : b) : (sa < sb ? a : b);
    });

    s = applyAction(s, best, owner);
    if (s.winner) break;
  }
  return s;
}

/**
 * αβ枝刈り付き minimax。
 * rootOwner = 評価関数の最大化側（呼び出しルートのowner）。
 * isMaxNode = rootOwner のターンかどうか。
 */
function minimaxNode(
  state: GameSession,
  depth: number,
  alpha: number,
  beta: number,
  isMaxNode: boolean,
  rootOwner: Owner,
  profile: BattleAIProfile,
  tactic: TacticStrategy,
  opts: Required<SearchOptions>,
  rng: Rng,
): number {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, rootOwner, profile.evalWeights);
  }

  // isMaxNode = rootOwner の手番, !isMaxNode = 相手の手番
  const owner: Owner = isMaxNode ? rootOwner : opponent(rootOwner);
  const allActions = enumerateActions(state, owner);

  let candidates: AIAction[];
  if (tactic.prefilterActions) {
    candidates = tactic.prefilterActions(state, allActions, profile.evalWeights, opts);
  } else {
    candidates = allActions.filter(a => a.type !== 'end_turn').slice(0, opts.topKAction);
    candidates.push({ type: 'end_turn' });
  }

  const nonEnd = candidates.filter(a => a.type !== 'end_turn');
  if (nonEnd.length === 0) {
    const next = applyEndTurn(state);
    return minimaxNode(next, depth - 1, alpha, beta, !isMaxNode, rootOwner, profile, tactic, opts, rng);
  }

  let best = isMaxNode ? -Infinity : Infinity;

  for (const firstAction of nonEnd) {
    let s = applyAction(state, firstAction, owner);
    if (s.winner) {
      const score = evaluateBoard(s, rootOwner, profile.evalWeights);
      if (isMaxNode) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
      else           { best = Math.min(best, score); beta  = Math.min(beta, best);  }
      if (alpha >= beta) return best;
      continue;
    }

    s = completeTurnGreedy(s, owner, rootOwner, profile.evalWeights, rng);
    const next = applyEndTurn(s);
    const score = minimaxNode(next, depth - 1, alpha, beta, !isMaxNode, rootOwner, profile, tactic, opts, rng);

    if (isMaxNode) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
    else           { best = Math.min(best, score); beta  = Math.min(beta, best);  }
    if (alpha >= beta) break;
  }

  return best;
}

export interface PlyNOptions {
  onUpdate?: (s: GameSession) => void;
  delayFn?: (ms: number) => Promise<void>;
  delay?: number;
  debug?: boolean;
}

export async function plyNSearch(
  initialState: GameSession,
  profile: BattleAIProfile,
  tactic: TacticStrategy,
  owner: Owner,
  rng: Rng,
  opts: PlyNOptions = {},
): Promise<GameSession> {
  const searchOpts = getSearchOptions(profile);
  const weights = profile.evalWeights;
  const depth = profile.searchDepth as 2 | 3;
  const { onUpdate, delayFn, delay = 600, debug } = opts;
  const rootOwner = owner; // 評価関数の最大化側

  const allActions = enumerateActions(initialState, owner);
  let candidates: AIAction[];
  if (tactic.prefilterActions) {
    candidates = tactic.prefilterActions(initialState, allActions, weights, searchOpts);
  } else {
    candidates = allActions.filter(a => a.type !== 'end_turn').slice(0, searchOpts.topKAction);
  }

  let bestAction: AIAction = { type: 'end_turn' };
  let bestScore = -Infinity;

  for (const firstAction of candidates) {
    if (firstAction.type === 'end_turn') continue;

    let s = applyAction(initialState, firstAction, owner);
    if (!s.winner) s = completeTurnGreedy(s, owner, rootOwner, weights, rng);
    const next = applyEndTurn(s);

    // 相手ターンから始まるminimax (isMaxNode=false)
    const score = minimaxNode(next, depth - 1, -Infinity, Infinity, false, rootOwner, profile, tactic, searchOpts, rng);

    if (debug) {
      console.log(`[AI:${profile.id}] candidate: ${firstAction.type} score=${score.toFixed(1)}`);
    }

    if (score > bestScore) {
      bestScore = score;
      bestAction = firstAction;
    }
  }

  // 最善first-actionを実行してからgreedyで残りを完了
  let state = initialState;
  if (bestAction.type !== 'end_turn') {
    state = applyAction(state, bestAction, owner);
    if (onUpdate) onUpdate(state);
    if (delayFn && delay > 0) await delayFn(delay);
  }

  if (!state.winner) {
    let iter = 0;
    while (iter++ < 20 && !state.winner) {
      const acts = enumerateActions(state, owner);
      const nonEnd = acts.filter(a => a.type !== 'end_turn');
      if (nonEnd.length === 0) break;

      const best = nonEnd.reduce((b, a) => {
        const sa = evaluateBoard(applyAction(state, a, owner), rootOwner, weights);
        const sb = evaluateBoard(applyAction(state, b, owner), rootOwner, weights);
        return sa > sb ? a : b;
      });

      state = applyAction(state, best, owner);
      if (onUpdate) onUpdate(state);
      if (delayFn && delay > 0) await delayFn(delay);
    }
  }

  return state;
}
