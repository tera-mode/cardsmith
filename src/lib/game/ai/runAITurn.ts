import { GameSession } from '@/lib/types/game';
import { applyAction } from '@/lib/game/apply';
import { BattleAIProfile, Owner } from './types';
import { getTactic } from './tactics/index';
import { createRng } from './rng';
import { ply1Search } from './search/ply1';
import { plyNSearch } from './search/plyN';

// プロファイル・タクティクスの登録を保証
import './profiles/index';
import './tactics/index';

export interface RunAITurnOptions {
  onUpdate?: (s: GameSession) => void;
  delay?: number;
  debug?: boolean;
  seed?: number;
}

function delayFn(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function runAITurn(
  state: GameSession,
  profile: BattleAIProfile,
  options: RunAITurnOptions = {},
): Promise<GameSession> {
  const {
    onUpdate,
    delay = 600,
    debug = false,
    seed = Date.now(),
  } = options;

  const rng = createRng(seed);
  const tactic = getTactic(profile.tacticId);
  const owner: Owner = 'ai';
  const delayFunc = delay > 0 ? delayFn : undefined;

  if (debug) {
    console.log(`[AI:${profile.id}] turn=${state.turnCount} depth=${profile.searchDepth}`);
  }

  // searchDepth=0: スクリプト実行
  if (profile.searchDepth === 0) {
    if (!tactic.scriptedTurn) {
      throw new Error(`Tactic "${profile.tacticId}" has no scriptedTurn for depth=0`);
    }
    const actions = tactic.scriptedTurn(state, rng);
    let s = state;
    for (const action of actions) {
      s = applyAction(s, action, owner);
      if (onUpdate) onUpdate(s);
      if (delayFunc && delay > 0) await delayFunc(action.type === 'summon' ? Math.floor(delay * 0.7) : delay);
      if (s.winner) break;
    }
    return s;
  }

  // searchDepth=1: greedy ply1
  if (profile.searchDepth === 1) {
    return ply1Search(state, profile, tactic, owner, rng, {
      onUpdate,
      delayFn: delayFunc,
      delay,
      debug,
    });
  }

  // searchDepth>=2: minimax plyN
  return plyNSearch(state, profile, tactic, owner, rng, {
    onUpdate,
    delayFn: delayFunc,
    delay,
    debug,
  });
}
