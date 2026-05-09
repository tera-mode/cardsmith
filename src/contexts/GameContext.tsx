'use client';

import {
  createContext, useContext, useState, useCallback, useRef,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  GameSession, Unit, Position, Card, InteractionMode, AttackTarget,
} from '@/lib/types/game';
import {
  createEmptyBoard, getLegalMoves, getLegalAttacks,
  getLegalSummonPositions, createUnit, placeUnit, removeUnit, resolveAttack,
  BOARD_ROWS, BOARD_COLS,
} from '@/lib/game/rules';
import {
  buildStandardDeck, buildStarterDeck, buildEnemyDeck, shuffleDeck, INITIAL_HAND_SIZE, BASE_HP,
  Archetype,
} from '@/lib/game/decks';
import { CARD_MAP, getStarterCardsByAttribute } from '@/lib/game/cards';
import {
  applyDamage, triggerOnSummon, triggerOnAttack,
  triggerOnTurnStart, triggerOnTurnEnd, resolveActivatedSkill,
  applyCounterAttack, checkWinner,
} from '@/lib/game/events/dispatcher';
import { getSkill } from '@/lib/game/skills/index';
import { recalculateAuras } from '@/lib/game/aura';
import { canAct, clearTurnStatusEffects, getEffectiveAtk, findUnit } from '@/lib/game/helpers';
import type { GameSessionWithRevival, PendingRevival } from '@/lib/game/helpers';
import { runAITurn, getProfile } from '@/lib/game/ai/index';
import type { BattleAIProfile } from '@/lib/game/ai/index';
import { QUEST_MAP } from '@/lib/data/quests';
import { auth } from '@/lib/firebase/config';
import { useEffectQueueSafe } from '@/contexts/EffectQueueContext';

// スキル登録（全スキルを初期化）
import '@/lib/game/skills/index';

// ─── Firestore保存 ───────────────────────────────────────────────────────

async function saveSession(session: GameSession) {
  try {
    const user = auth?.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    await fetch('/api/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        userId: session.userId,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt ?? Date.now(),
        winner: session.winner ?? 'draw',
        turnCount: session.turnCount,
        finalState: {
          playerBaseHp: session.player.baseHp,
          aiBaseHp: session.ai.baseHp,
        },
        log: session.log.slice(-50),
        playerDeckId: 'standard',
      }),
    });
  } catch {
    // 保存失敗してもゲームは続行
  }
}

// ─── コンテキスト型 ───────────────────────────────────────────────────────

interface GameContextType {
  session: GameSession | null;
  mode: InteractionMode;
  highlightedCells: Position[];
  initGame: (userId: string, questId?: string, playerArchetype?: Archetype, customDeck?: Card[]) => void;
  selectCard: (index: number) => void;
  summonToCell: (pos: Position) => void;
  selectUnit: (unit: Unit) => void;
  startMove: (unit: Unit) => void;
  moveUnit: (pos: Position) => void;
  cancelMove: () => void;
  attackTarget: (target: AttackTarget) => void;
  enterSkillTargeting: (unit: Unit) => void;
  useSkill: (target?: Position) => void;
  endUnitAction: (unit: Unit) => void;
  endTurn: () => void;
  cancel: () => void;
  getSkillTargets: () => Position[];
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export const useGame = () => useContext(GameContext);

// ─── Provider ─────────────────────────────────────────────────────────────

// クエスト定義からAI難易度・敵デッキ・敵HP を導出するヘルパー
const ARCHETYPE_IDS: Archetype[] = ['sei', 'mei', 'shin', 'en', 'sou', 'kou'];

function resolveEnemyConfig(questId?: string): {
  profile: BattleAIProfile;
  enemyDeck: Card[];
  enemyBaseHp: number;
} {
  const defaultProfile = getProfile('normal_balanced');
  const defaults = { profile: defaultProfile, enemyDeck: shuffleDeck(buildStandardDeck()), enemyBaseHp: defaultProfile.defaultBaseHp };
  if (!questId) return defaults;

  const quest = QUEST_MAP[questId];
  if (!quest) return defaults;

  const profile = getProfile(quest.enemyAIProfileId);
  const enemyBaseHp = quest.enemyBaseHp ?? profile.defaultBaseHp;

  // enemyDeckId のパース: "sei_1", "kou_5" など
  const parts = quest.enemyDeckId.split('_');
  const archetype = parts[0] as Archetype;
  const order = parseInt(parts[parts.length - 1]);
  if (ARCHETYPE_IDS.includes(archetype) && order >= 1 && order <= 5) {
    return { profile, enemyDeck: shuffleDeck(buildEnemyDeck(archetype, order as 1|2|3|4|5)), enemyBaseHp };
  }

  // チュートリアル専用デッキ
  const c = (id: string) => CARD_MAP[id]!;
  if (quest.enemyDeckId === 'tutorial_scarecrow') {
    const deck = [
      c('sei_noa'), c('sei_noa'), c('sei_noa'),
      c('mei_cal'), c('mei_cal'),
      c('shin_hina'), c('shin_hina'),
      c('kou_mk01'), c('kou_mk01'), c('kou_mk01'),
    ];
    return { profile, enemyDeck: shuffleDeck(deck), enemyBaseHp };
  }
  if (quest.enemyDeckId === 'tutorial_militia') {
    const deck = ARCHETYPE_IDS.flatMap(attr => {
      const sorted = getStarterCardsByAttribute(attr);
      return [sorted[0], sorted[1]].filter(Boolean) as Card[];
    });
    return { profile, enemyDeck: shuffleDeck(deck), enemyBaseHp };
  }
  if (quest.enemyDeckId === 'tutorial_mentor') {
    const deck = [
      c('sei_noa'), c('sei_noa'),
      c('mei_cal'), c('mei_cal'),
      c('shin_hina'), c('shin_hina'),
      c('sei_eluna'), c('shin_lil'),
      c('kou_luna'), c('shin_lilia'),
    ];
    return { profile, enemyDeck: shuffleDeck(deck), enemyBaseHp };
  }

  return { profile, enemyDeck: shuffleDeck(buildStandardDeck()), enemyBaseHp };
}

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [mode, setMode] = useState<InteractionMode>({ type: 'idle' });
  const [highlightedCells, setHighlightedCells] = useState<Position[]>([]);
  const [aiProfile, setAiProfile] = useState<BattleAIProfile>(getProfile('normal_balanced'));
  const sessionRef = useRef<GameSession | null>(null);
  const effectQueue = useEffectQueueSafe();

  const updateSession = useCallback((s: GameSession) => {
    sessionRef.current = s;
    setSession({ ...s });
  }, []);

  // ─── ゲーム初期化 ───────────────────────────────────────────────────────

  const initGame = useCallback((userId: string, questId?: string, playerArchetype?: Archetype, customDeck?: Card[]) => {
    const { profile: qProfile, enemyDeck, enemyBaseHp } = resolveEnemyConfig(questId);
    setAiProfile(qProfile);

    const playerDeck = customDeck
      ? shuffleDeck(customDeck)
      : playerArchetype
        ? shuffleDeck(buildStarterDeck(playerArchetype))
        : shuffleDeck(buildStandardDeck());

    const newSession: GameSession = {
      sessionId: uuidv4(),
      userId,
      startedAt: Date.now(),
      currentTurn: 'player',
      turnCount: 1,
      phase: 'main',
      board: createEmptyBoard(),
      player: {
        baseHp: BASE_HP,
        deck: playerDeck.slice(INITIAL_HAND_SIZE),
        hand: playerDeck.slice(0, INITIAL_HAND_SIZE),
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
        hasAttackedThisTurn: false,
      },
      ai: {
        baseHp: enemyBaseHp,
        deck: enemyDeck.slice(INITIAL_HAND_SIZE),
        hand: enemyDeck.slice(0, INITIAL_HAND_SIZE),
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
        hasAttackedThisTurn: false,
      },
      log: ['ゲーム開始！プレイヤー先攻'],
    };

    updateSession(newSession);
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [updateSession]);

  // ─── カード選択 → 召喚 ──────────────────────────────────────────────────

  const selectCard = useCallback((index: number) => {
    const s = sessionRef.current;
    if (!s || s.currentTurn !== 'player' || s.player.hasSummonedThisTurn) return;
    const positions = getLegalSummonPositions(s.board, 'player');
    setMode({ type: 'card_selected', cardIndex: index });
    setHighlightedCells(positions);
  }, []);

  const summonToCell = useCallback((pos: Position) => {
    const s = sessionRef.current;
    if (!s || mode.type !== 'card_selected') return;
    const card = s.player.hand[mode.cardIndex];
    if (!card) return;

    // 召喚エフェクト
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    effectQueue?.push({ type: 'summon', cardId: card.id, attribute: card.attribute as any, to: pos, durationMs: 600 } as any);

    const unit = createUnit(card, 'player', pos);
    const newBoard = placeUnit(s.board, unit, pos);
    const newHand = s.player.hand.filter((_, i) => i !== mode.cardIndex);

    let nextState: GameSession = {
      ...s,
      board: newBoard,
      player: { ...s.player, hand: newHand, hasSummonedThisTurn: true },
      log: [...s.log, `${card.name} を召喚`],
    };

    // 召喚時スキル発火
    nextState = triggerOnSummon(nextState, unit);

    // 勝敗チェック
    nextState = checkWinner(nextState);
    if (nextState.winner) {
      updateSession({ ...nextState, finishedAt: Date.now() });
      saveSession({ ...nextState, finishedAt: Date.now() });
    } else {
      updateSession(nextState);
    }

    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── ユニット選択 ────────────────────────────────────────────────────────

  const selectUnit = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s || s.currentTurn !== 'player' || unit.owner !== 'player') return;
    if (!canAct(unit)) return;
    // 召喚ターンに行動不可なトークン・クローンは除外
    if (unit.hasActedThisTurn) return;
    // 移動・攻撃どちらも残っていない場合は選択不可
    if (s.player.hasMovedThisTurn && s.player.hasAttackedThisTurn) return;
    // 移動先を即時ハイライト（移動済みの場合は空）
    const moves = !s.player.hasMovedThisTurn ? getLegalMoves(unit, s.board) : [];
    setMode({ type: 'unit_selected', unit });
    setHighlightedCells(moves);
  }, []);

  const startMove = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s || s.player.hasMovedThisTurn) return;
    const moves = getLegalMoves(unit, s.board);
    setMode({ type: 'unit_moving', unit });
    setHighlightedCells(moves);
  }, []);

  const cancelMove = useCallback(() => {
    if (mode.type !== 'unit_moving') return;
    setMode({ type: 'unit_selected', unit: mode.unit });
    setHighlightedCells([]);
  }, [mode]);

  const moveUnit = useCallback((pos: Position) => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_moving' && mode.type !== 'unit_selected')) return;
    if (s.player.hasMovedThisTurn) return;
    const unit = mode.unit;
    const isSamePos = pos.row === unit.position.row && pos.col === unit.position.col;
    let newBoard = isSamePos ? s.board : removeUnit(s.board, unit.position);
    const moved: Unit = { ...unit, position: pos };
    newBoard = isSamePos ? s.board : placeUnit(newBoard, moved, pos);
    const logEntry = isSamePos ? `${unit.card.name} が待機` : `${unit.card.name} が移動`;
    const newState = { ...s, board: newBoard, player: { ...s.player, hasMovedThisTurn: true }, log: [...s.log, logEntry] };
    updateSession(newState);
    // 攻撃済みor攻撃対象なし → 即 idle（「行動終了」不要）
    const hasAttackOptions = !s.player.hasAttackedThisTurn && getLegalAttacks(moved, newBoard).length > 0;
    if (hasAttackOptions) {
      setMode({ type: 'unit_post_move', unit: moved });
    } else {
      setMode({ type: 'idle' });
    }
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── 行動終了（post-move 中にパスして idle へ戻る） ──────────────────────

  const endUnitAction = useCallback((_unit: Unit) => {
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, []);

  // ─── 攻撃 ────────────────────────────────────────────────────────────────

  const attackTarget = useCallback((target: AttackTarget) => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_selected' && mode.type !== 'unit_post_move')) return;

    const attacker = mode.unit;
    const atk = getEffectiveAtk(attacker);

    // 攻撃エフェクト（AttackTargetにsideはないため、attacker.ownerで判断）
    const attackKind = attacker.card.attackRange.type === 'ranged'
      ? (attacker.card.id.includes('cannon') ? 'ranged_cannon' : 'ranged_arrow')
      : 'melee';
    const targetPos = target.type === 'base'
      ? { row: attacker.owner === 'player' ? 0 : 3, col: 2 }
      : target.unit.position;
    effectQueue?.push([
      { type: 'attack_motion', attacker: attacker.position, target: targetPos, attackKind, durationMs: attackKind === 'melee' ? 250 : 400 },
      { type: 'hit', target: targetPos, damage: atk, attackKind, durationMs: 300 },
      { type: 'damage_number', position: targetPos, value: atk, kind: 'damage', durationMs: 1000 },
    ]);

    let nextState: GameSession;

    if (target.type === 'base') {
      // ベース攻撃（デフォルト1ダメージ）
      const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(s, attacker, target);
      nextState = { ...s, board, player: { ...s.player, baseHp: playerBaseHp }, ai: { ...s.ai, baseHp: aiBaseHp }, log: [...s.log, ...log] };
    } else {
      const defender = target.unit;
      // ダメージ適用（新ディスパッチャー経由）
      nextState = applyDamage(s, { source: attacker, target: defender, amount: atk });

      // 反撃チェック（hangeki スキル）
      const freshDefender = findUnit(nextState, defender.instanceId);
      if (freshDefender && freshDefender.card.skill?.id === 'hangeki') {
        nextState = applyCounterAttack(nextState, freshDefender, attacker);
      }

      // 攻撃後スキル発火（連撃・薙ぎ払い・連鎖雷撃・凍結・沈黙・吹き飛ばし）
      const freshAttacker = findUnit(nextState, attacker.instanceId);
      if (freshAttacker) {
        nextState = triggerOnAttack(nextState, freshAttacker, defender, atk);
      }
    }

    // 攻撃は1ターン1回（hasActedThisTurn はセッションフラグで管理）
    nextState = { ...nextState, player: { ...nextState.player, hasAttackedThisTurn: true } };

    nextState = checkWinner(nextState);
    const finished = !!nextState.winner;
    const result: GameSession = { ...nextState, finishedAt: finished ? Date.now() : undefined };

    updateSession(result);
    if (finished) saveSession(result);
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── スキル ──────────────────────────────────────────────────────────────

  const getSkillTargets = useCallback((): Position[] => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_selected' && mode.type !== 'unit_post_move')) return [];
    const unit = mode.unit;
    const skillDef = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skillDef || skillDef.triggerKind !== 'activated') return [];
    return skillDef.getValidTargets ? skillDef.getValidTargets(s, unit) : [];
  }, [mode]);

  // スキルターゲット選択モードに入る（複数ターゲットがある場合）
  const enterSkillTargeting = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s) return;
    const skillDef = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skillDef || skillDef.triggerKind !== 'activated') return;
    const targets = skillDef.getValidTargets ? skillDef.getValidTargets(s, unit) : [];
    setMode({ type: 'skill_targeting', unit, skillId: unit.card.skill!.id });
    setHighlightedCells(targets);
  }, []);

  const useSkill = useCallback((target?: Position) => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_selected' && mode.type !== 'unit_post_move' && mode.type !== 'skill_targeting')) return;
    const unit = mode.unit;
    const skillDef = unit.card.skill ? getSkill(unit.card.skill.id) : null;
    if (!skillDef || skillDef.triggerKind !== 'activated') return;

    // スキルエフェクト
    const skillId = unit.card.skill?.id ?? '';
    const visualHint =
      ['heal', 'saisei', 'haru_no_ibuki', 'keigan'].includes(skillId) ? 'heal' :
      ['buff', 'bless'].includes(skillId) ? 'buff' :
      ['freeze', 'mafu'].includes(skillId) ? 'debuff' :
      ['penetrate', 'kamikaze', 'rengeki'].includes(skillId) ? 'aoe' : 'generic';
    effectQueue?.push({
      type: 'skill_proc' as const,
      source: unit.position,
      skillId,
      targets: target ? [target] : undefined,
      visualHint,
      durationMs: 600,
    });

    let nextState = resolveActivatedSkill(s, unit, target ?? null);

    nextState = checkWinner(nextState);
    const finished = !!nextState.winner;
    const result: GameSession = { ...nextState, finishedAt: finished ? Date.now() : undefined };

    updateSession(result);
    if (finished) saveSession(result);
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [mode, updateSession, effectQueue]);

  // ─── ターン終了 ──────────────────────────────────────────────────────────

  const endTurn = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || s.currentTurn !== 'player' || s.phase === 'finished') return;

    // ターン終了時スキル発火
    let stateAfterTurnEnd = triggerOnTurnEnd(s, 'player');

    // 全ユニットのステータスリセット（凍結・麻痺はここで消費）
    const resetBoard = stateAfterTurnEnd.board.map((row) =>
      row.map((cell) => cell ? clearTurnStatusEffects(cell) : null)
    );

    // 復活処理
    let stateWithRevivals = { ...stateAfterTurnEnd, board: resetBoard };
    const revivals = (stateAfterTurnEnd as GameSessionWithRevival).pendingRevivals ?? [];
    for (const revival of revivals) {
      if (!stateWithRevivals.board[revival.position.row][revival.position.col]) {
        const revUnit = createUnit(revival.card, revival.owner, revival.position);
        stateWithRevivals = { ...stateWithRevivals, board: placeUnit(stateWithRevivals.board, revUnit, revival.position) };
        stateWithRevivals = { ...stateWithRevivals, log: [...stateWithRevivals.log, `${revival.card.name}：復活！`] };
      }
    }
    (stateWithRevivals as GameSessionWithRevival).pendingRevivals = [];

    // AIドロー
    let aiDeck = [...stateWithRevivals.ai.deck];
    let aiHand = [...stateWithRevivals.ai.hand];
    if (aiDeck.length > 0) {
      aiHand = [...aiHand, aiDeck[0]];
      aiDeck = aiDeck.slice(1);
    }

    const aiTurnState: GameSession = {
      ...stateWithRevivals,
      currentTurn: 'ai',
      turnCount: s.turnCount + 1,
      player: { ...stateWithRevivals.player, hasSummonedThisTurn: false, hasMovedThisTurn: false, hasAttackedThisTurn: false },
      ai: { ...stateWithRevivals.ai, deck: aiDeck, hand: aiHand, hasSummonedThisTurn: false, hasMovedThisTurn: false, hasAttackedThisTurn: false },
      log: [...stateWithRevivals.log, `─── ターン${s.turnCount + 1} (AIのターン) ───`],
    };

    // AIターン開始スキル発火
    let aiTurnWithStart = triggerOnTurnStart(aiTurnState, 'ai');

    // AIターンバナー
    effectQueue?.push({ type: 'turn_banner', side: 'ai', turnCount: s.turnCount + 1, durationMs: 1000 });

    setMode({ type: 'idle' });
    setHighlightedCells([]);
    updateSession(aiTurnWithStart);

    // AI実行
    const afterAI = await runAITurn(aiTurnWithStart, aiProfile, {
      onUpdate: updateSession,
      delay: 600,
    });

    // AIターン終了スキル発火
    let stateAfterAITurnEnd = triggerOnTurnEnd(afterAI, 'ai');

    // 全ユニットリセット
    const nextBoard = stateAfterAITurnEnd.board.map((row) =>
      row.map((cell) => cell ? clearTurnStatusEffects(cell) : null)
    );

    // 復活処理（AIターン後）
    let stateWithAIRevivals = { ...stateAfterAITurnEnd, board: nextBoard };
    const aiRevivals = (stateAfterAITurnEnd as GameSessionWithRevival).pendingRevivals ?? [];
    for (const revival of aiRevivals) {
      if (!stateWithAIRevivals.board[revival.position.row][revival.position.col]) {
        const revUnit = createUnit(revival.card, revival.owner, revival.position);
        stateWithAIRevivals = { ...stateWithAIRevivals, board: placeUnit(stateWithAIRevivals.board, revUnit, revival.position) };
        stateWithAIRevivals = { ...stateWithAIRevivals, log: [...stateWithAIRevivals.log, `${revival.card.name}：復活！`] };
      }
    }
    (stateWithAIRevivals as GameSessionWithRevival).pendingRevivals = [];

    // プレイヤードロー
    let playerDeck = [...stateWithAIRevivals.player.deck];
    let playerHand = [...stateWithAIRevivals.player.hand];
    if (playerDeck.length > 0) {
      playerHand = [...playerHand, playerDeck[0]];
      playerDeck = playerDeck.slice(1);
    }

    // プレイヤーターン開始スキル発火
    const playerTurnBase: GameSession = {
      ...stateWithAIRevivals,
      currentTurn: 'player' as const,
      player: { ...stateWithAIRevivals.player, deck: playerDeck, hand: playerHand, hasSummonedThisTurn: false, hasMovedThisTurn: false, hasAttackedThisTurn: false },
      log: [...stateWithAIRevivals.log, `─── ターン${afterAI.turnCount} (プレイヤーのターン) ───`],
    };

    let finalState = triggerOnTurnStart(playerTurnBase, 'player');
    finalState = checkWinner(finalState);
    const finished = !!finalState.winner;

    const finalSession: GameSession = {
      ...finalState,
      phase: finished ? 'finished' : 'main',
      finishedAt: finished ? Date.now() : undefined,
    };

    // プレイヤーターンバナー or 勝敗エフェクト
    if (finished) {
      effectQueue?.push({
        type: finalState.winner === 'player' ? 'victory' : 'defeat',
        durationMs: finalState.winner === 'player' ? 2500 : 2000,
      });
    } else {
      effectQueue?.push({ type: 'turn_banner', side: 'player', turnCount: afterAI.turnCount, durationMs: 1000 });
    }

    updateSession(finalSession);
    if (finished) saveSession(finalSession);
  }, [updateSession, effectQueue]);

  const cancel = useCallback(() => {
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, []);

  return (
    <GameContext.Provider value={{
      session, mode, highlightedCells,
      initGame, selectCard, summonToCell,
      selectUnit, startMove, cancelMove, moveUnit,
      attackTarget, enterSkillTargeting, useSkill, endUnitAction,
      endTurn, cancel, getSkillTargets,
    }}>
      {children}
    </GameContext.Provider>
  );
};
