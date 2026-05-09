import { v4 as uuidv4 } from 'uuid';
import { GameSession } from '@/lib/types/game';
import { createEmptyBoard } from '@/lib/game/rules';
import { INITIAL_HAND_SIZE } from '@/lib/game/decks';
import { shuffleDeckWithRng } from '@/lib/game/decks';
import { createRng } from '@/lib/game/ai/rng';
import { getProfile } from '@/lib/game/ai/profile_registry';
import { runAITurn } from '@/lib/game/ai/runAITurn';
import {
  triggerOnTurnStart, triggerOnTurnEnd, checkWinner,
} from '@/lib/game/events/dispatcher';
import { clearTurnStatusEffects } from '@/lib/game/helpers';
import { initStats, applyActionWithStats } from './stats';
import { boardHash, isStagnant } from './stagnation';
import type { MatchConfig, MatchResult, MatchStats, Side } from './types';

// ─── シム専用ターン終了 ────────────────────────────────────────────────────

function simEndTurn(state: GameSession): GameSession {
  const currentOwner = state.currentTurn as 'player' | 'ai';
  const nextOwner: 'player' | 'ai' = currentOwner === 'player' ? 'ai' : 'player';

  // ターン終了スキル
  let s = triggerOnTurnEnd(state, currentOwner);

  // ユニットフラグリセット
  s = {
    ...s,
    board: s.board.map(row => row.map(cell => cell ? clearTurnStatusEffects(cell) : null)),
  };

  // ドロー + ターン切替
  if (nextOwner === 'ai') {
    const [drawn, ...deck] = s.ai.deck;
    s = {
      ...s,
      currentTurn: 'ai',
      turnCount: s.turnCount + 1,
      player: { ...s.player, hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0 },
      ai: {
        ...s.ai,
        deck: drawn ? deck : s.ai.deck,
        hand: drawn ? [...s.ai.hand, drawn] : s.ai.hand,
        hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0,
      },
    };
  } else {
    const [drawn, ...deck] = s.player.deck;
    s = {
      ...s,
      currentTurn: 'player',
      turnCount: s.turnCount + 1,
      ai: { ...s.ai, hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0 },
      player: {
        ...s.player,
        deck: drawn ? deck : s.player.deck,
        hand: drawn ? [...s.player.hand, drawn] : s.player.hand,
        hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0,
      },
    };
  }

  s = triggerOnTurnStart(s, nextOwner);
  return checkWinner(s);
}

// ─── runMatch ──────────────────────────────────────────────────────────────

export async function runMatch(config: MatchConfig): Promise<MatchResult> {
  const t0 = Date.now();
  const rng = createRng(config.seed);

  // デッキをシード付きシャッフルして初期手札を配る
  const deckA = shuffleDeckWithRng([...config.sideA.deck], rng);
  const deckB = shuffleDeckWithRng([...config.sideB.deck], rng);

  const firstSide = config.firstSide ?? 'A';
  // Side A = player, Side B = ai（固定マッピング）
  const firstOwner: 'player' | 'ai' = firstSide === 'A' ? 'player' : 'ai';

  // 後攻側は手札+1（先攻後攻補正）
  const SECOND_HAND_BONUS = 1;
  const isAFirst = firstSide === 'A';
  const handA = isAFirst ? INITIAL_HAND_SIZE : INITIAL_HAND_SIZE + SECOND_HAND_BONUS;
  const handB = isAFirst ? INITIAL_HAND_SIZE + SECOND_HAND_BONUS : INITIAL_HAND_SIZE;
  const hpA = config.sideA.baseHp;
  const hpB = config.sideB.baseHp;

  let state: GameSession = {
    sessionId: uuidv4(),
    userId: 'sim',
    startedAt: Date.now(),
    currentTurn: firstOwner,
    turnCount: 1,
    phase: 'main',
    board: createEmptyBoard(),
    player: {
      baseHp: hpA,
      deck: deckA.slice(handA),
      hand: deckA.slice(0, handA),
      hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0,
    },
    ai: {
      baseHp: hpB,
      deck: deckB.slice(handB),
      hand: deckB.slice(0, handB),
      hasSummonedThisTurn: false, hasMovedThisTurn: false, actionsUsedThisTurn: 0,
    },
    log: [],
  };

  // ターン開始スキル発火（先攻側）
  state = triggerOnTurnStart(state, firstOwner);

  const profileA = getProfile(config.sideA.profileId);
  const profileB = getProfile(config.sideB.profileId);
  const stats: MatchStats = initStats();
  const maxTurns = config.maxTurns ?? 50;
  const hashHistory: string[] = [];
  let endReason: MatchResult['endReason'] = 'max_turns';
  let halfTurns = 0;

  // stats収集のためapplyActionをラップするonUpdate
  const makeSideTrackedOptions = (side: Side) => ({
    owner: side === 'A' ? 'player' as const : 'ai' as const,
    delay: 0,
    debug: false,
    rng,
  });

  while (!state.winner) {
    const currentSide: Side = state.currentTurn === 'player' ? 'A' : 'B';
    const profile = currentSide === 'A' ? profileA : profileB;

    // AIターン実行
    const prevState = state;
    state = await runAITurn(state, profile, makeSideTrackedOptions(currentSide));

    // ハーフターン後の膠着チェック
    const hash = boardHash(state);
    hashHistory.push(hash);
    if (isStagnant(hashHistory, hash)) {
      endReason = 'no_legal_action';
      break;
    }

    if (state.winner) { endReason = 'base_hp_zero'; break; }

    // ターン終了（切替・ドロー・スキル発火）
    state = simEndTurn(state);
    halfTurns++;

    if (state.winner) { endReason = 'base_hp_zero'; break; }

    // ターン数制限チェック（ハーフターン÷2 でフルターン換算）
    if (Math.floor(halfTurns / 2) >= maxTurns) {
      endReason = 'max_turns';
      break;
    }
  }

  // 勝者決定
  let winner: MatchResult['winner'];
  if (state.winner === 'player') winner = 'A';
  else if (state.winner === 'ai') winner = 'B';
  else {
    // max_turns / no_legal_action: HPで判定
    if (state.player.baseHp > state.ai.baseHp) winner = 'A';
    else if (state.ai.baseHp > state.player.baseHp) winner = 'B';
    else winner = 'draw';
  }

  const durationMs = Date.now() - t0;
  const turns = Math.ceil(halfTurns / 2) || state.turnCount;

  return {
    matchId: uuidv4(),
    seed: config.seed,
    config,
    winner,
    endReason,
    turns,
    durationMs,
    finalBaseHpA: state.player.baseHp,
    finalBaseHpB: state.ai.baseHp,
    stats,
    ...(config.collectFinalState ? { finalState: state } : {}),
    ...(config.collectLog ? { log: state.log } : {}),
  };
}
