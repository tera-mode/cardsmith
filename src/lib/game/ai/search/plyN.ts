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

/**
 * 現在のownerのターンをgreedyに完了させる（UI更新なし・高速）。
 * plyNの内部評価用。
 */
function completeTurnGreedy(
  state: GameSession,
  owner: Owner,
  weights: EvalWeights,
  rng: Rng,
): GameSession {
  let s = state;
  let iter = 0;
  while (iter++ < 20) {
    const candidates = enumerateActions(s, owner);
    const nonEnd = candidates.filter(a => a.type !== 'end_turn');
    if (nonEnd.length === 0) break;

    const best = nonEnd.reduce((b, a) => {
      const sa = evaluateBoard(applyAction(s, a, owner), 'ai', weights);
      const sb = evaluateBoard(applyAction(s, b, owner), 'ai', weights);
      if (owner === 'ai') return sa > sb ? a : b;
      return sa < sb ? a : b; // 相手はAIスコアを最小化
    });

    s = applyAction(s, best, owner);
    if (s.winner) break;
  }
  return s;
}

/**
 * αβ枝刈り付き minimax。
 * 1ノード = 1ターン全体（候補first-actionを起点にgreedyで完了）。
 */
function minimaxNode(
  state: GameSession,
  depth: number,
  alpha: number,
  beta: number,
  isMaxNode: boolean,
  profile: BattleAIProfile,
  tactic: TacticStrategy,
  opts: Required<SearchOptions>,
  rng: Rng,
): number {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, 'ai', profile.evalWeights);
  }

  const owner: Owner = isMaxNode ? 'ai' : 'player';
  const allActions = enumerateActions(state, owner);

  // 候補をtopKに絞る
  let candidates: AIAction[];
  if (tactic.prefilterActions) {
    candidates = tactic.prefilterActions(state, allActions, profile.evalWeights, opts);
  } else {
    candidates = allActions.filter(a => a.type !== 'end_turn').slice(0, opts.topKAction);
    candidates.push({ type: 'end_turn' });
  }

  // end_turnのみなら評価して返す
  const nonEnd = candidates.filter(a => a.type !== 'end_turn');
  if (nonEnd.length === 0) {
    const next = applyEndTurn(state);
    return minimaxNode(next, depth - 1, alpha, beta, !isMaxNode, profile, tactic, opts, rng);
  }

  let best = isMaxNode ? -Infinity : Infinity;

  for (const firstAction of nonEnd) {
    // first actionを適用
    let s = applyAction(state, firstAction, owner);
    if (s.winner) {
      const score = evaluateBoard(s, 'ai', profile.evalWeights);
      if (isMaxNode) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
      else           { best = Math.min(best, score); beta  = Math.min(beta, best);  }
      if (alpha >= beta) return best;
      continue;
    }

    // 残りのターンをgreedyで完了
    s = completeTurnGreedy(s, owner, profile.evalWeights, rng);

    // ターン終了（相手ターンへ）
    const next = applyEndTurn(s);

    // 再帰
    const score = minimaxNode(next, depth - 1, alpha, beta, !isMaxNode, profile, tactic, opts, rng);

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

  // 候補first-actions
  const allActions = enumerateActions(initialState, owner);
  let candidates: AIAction[];
  if (tactic.prefilterActions) {
    candidates = tactic.prefilterActions(initialState, allActions, weights, searchOpts);
  } else {
    candidates = allActions.filter(a => a.type !== 'end_turn').slice(0, searchOpts.topKAction);
  }

  // 各候補のminimax評価
  let bestAction: AIAction = { type: 'end_turn' };
  let bestScore = -Infinity;

  for (const firstAction of candidates) {
    if (firstAction.type === 'end_turn') continue;

    let s = applyAction(initialState, firstAction, owner);
    if (!s.winner) s = completeTurnGreedy(s, owner, weights, rng);
    const next = applyEndTurn(s);

    const score = minimaxNode(next, depth - 1, -Infinity, Infinity, false, profile, tactic, searchOpts, rng);

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
    // 残りをply1 greedyで完了（UI更新あり）
    let iter = 0;
    while (iter++ < 20 && !state.winner) {
      const acts = enumerateActions(state, owner);
      const nonEnd = acts.filter(a => a.type !== 'end_turn');
      if (nonEnd.length === 0) break;

      const best = nonEnd.reduce((b, a) => {
        const sa = evaluateBoard(applyAction(state, a, owner), 'ai', weights);
        const sb = evaluateBoard(applyAction(state, b, owner), 'ai', weights);
        return sa > sb ? a : b;
      });

      state = applyAction(state, best, owner);
      if (onUpdate) onUpdate(state);
      if (delayFn && delay > 0) await delayFn(delay);
    }
  }

  return state;
}
