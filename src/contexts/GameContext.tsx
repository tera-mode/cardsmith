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
} from '@/lib/game/rules';
import { buildStandardDeck, shuffleDeck, INITIAL_HAND_SIZE, BASE_HP } from '@/lib/game/decks';
import { applyCounterAttack, SKILL_RESOLVERS } from '@/lib/game/skills';
import { executeAITurn } from '@/lib/game/ai';
import { auth } from '@/lib/firebase/config';

// ─── Firestoreへのセッション保存 ─────────────────────────────────────────

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
  initGame: (userId: string) => void;
  selectCard: (index: number) => void;
  summonToCell: (pos: Position) => void;
  // ユニット選択 → アクション選択メニューへ
  selectUnit: (unit: Unit) => void;
  // 「移動する」ボタン → 移動ハイライト表示
  startMove: (unit: Unit) => void;
  // 移動先タップ or 「その場に留まる」
  moveUnit: (pos: Position) => void;
  // 「戻る」（移動選択をキャンセルしてアクションメニューへ戻る）
  cancelMove: () => void;
  // 攻撃
  attackTarget: (target: AttackTarget) => void;
  // スキル使用
  useSkill: (target?: Position) => void;
  // 「行動終了」（移動後に攻撃もスキルも使わずに行動を終了）
  endUnitAction: (unit: Unit) => void;
  // ターン終了
  endTurn: () => void;
  // キャンセル（unit_selected → idle）
  cancel: () => void;
  getSkillTargets: () => Position[];
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export const useGame = () => useContext(GameContext);

// ─── Provider ─────────────────────────────────────────────────────────────

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [mode, setMode] = useState<InteractionMode>({ type: 'idle' });
  const [highlightedCells, setHighlightedCells] = useState<Position[]>([]);
  const sessionRef = useRef<GameSession | null>(null);

  const updateSession = useCallback((s: GameSession) => {
    sessionRef.current = s;
    setSession({ ...s });
  }, []);

  // ─── ゲーム初期化 ───────────────────────────────────────────────────────

  const initGame = useCallback((userId: string) => {
    const playerDeck = shuffleDeck(buildStandardDeck());
    const aiDeck = shuffleDeck(buildStandardDeck());

    const playerHand = playerDeck.slice(0, INITIAL_HAND_SIZE);
    const aiHand = aiDeck.slice(0, INITIAL_HAND_SIZE);

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
        hand: playerHand,
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
      },
      ai: {
        baseHp: BASE_HP,
        deck: aiDeck.slice(INITIAL_HAND_SIZE),
        hand: aiHand,
        hasSummonedThisTurn: false,
        hasMovedThisTurn: false,
      },
      log: ['ゲーム開始！プレイヤー先攻'],
    };

    updateSession(newSession);
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [updateSession]);

  // ─── カード選択 → 召喚ゾーンハイライト ──────────────────────────────────

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

    const unit = createUnit(card, 'player', pos);
    const newBoard = placeUnit(s.board, unit, pos);
    const newHand = s.player.hand.filter((_, i) => i !== mode.cardIndex);

    updateSession({
      ...s,
      board: newBoard,
      player: { ...s.player, hand: newHand, hasSummonedThisTurn: true },
      log: [...s.log, `${card.name} を召喚`],
    });
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── Step 1: ユニットタップ → アクション選択メニュー ────────────────────

  const selectUnit = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s || s.currentTurn !== 'player' || unit.owner !== 'player') return;
    if (unit.hasActedThisTurn) return;
    // アクションメニューを表示（ボードハイライトなし）
    setMode({ type: 'unit_selected', unit });
    setHighlightedCells([]);
  }, []);

  // ─── Step 2a: 「移動する」ボタン → 移動ハイライト表示 ───────────────────

  const startMove = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s || s.player.hasMovedThisTurn) return;
    const moves = getLegalMoves(unit, s.board);
    setMode({ type: 'unit_moving', unit });
    setHighlightedCells(moves);
  }, []);

  // unit_moving 中に「戻る」→ unit_selected（アクション選択メニュー）へ
  const cancelMove = useCallback(() => {
    const s = sessionRef.current;
    if (!s || mode.type !== 'unit_moving') return;
    setMode({ type: 'unit_selected', unit: mode.unit });
    setHighlightedCells([]);
  }, [mode]);

  // ─── Step 2b: 移動先タップ or 「その場に留まる」 ────────────────────────

  const moveUnit = useCallback((pos: Position) => {
    const s = sessionRef.current;
    if (!s || mode.type !== 'unit_moving') return;
    const unit = mode.unit;

    const isSamePos = pos.row === unit.position.row && pos.col === unit.position.col;
    let newBoard = isSamePos ? s.board : removeUnit(s.board, unit.position);
    const moved: Unit = { ...unit, position: pos };
    newBoard = isSamePos ? s.board : placeUnit(newBoard, moved, pos);

    const logEntry = isSamePos ? `${unit.card.name} が待機` : `${unit.card.name} が移動`;

    updateSession({
      ...s,
      board: newBoard,
      player: { ...s.player, hasMovedThisTurn: true },
      log: [...s.log, logEntry],
    });
    // 移動後は unit_post_move へ（ボードハイライトなし、攻撃/スキル/行動終了メニュー）
    setMode({ type: 'unit_post_move', unit: moved });
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── Step 3a: 「行動終了」ボタン（移動のみで攻撃しない） ─────────────────

  const endUnitAction = useCallback((unit: Unit) => {
    const s = sessionRef.current;
    if (!s) return;
    const finalBoard = s.board.map((r) => [...r]);
    const u = finalBoard[unit.position.row]?.[unit.position.col];
    if (u) finalBoard[unit.position.row][unit.position.col] = { ...u, hasActedThisTurn: true };
    updateSession({ ...s, board: finalBoard, log: [...s.log, `${unit.card.name} が行動終了`] });
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [updateSession]);

  // ─── Step 3b: 攻撃（unit_selected または unit_post_move から） ───────────

  const attackTarget = useCallback((target: AttackTarget) => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_selected' && mode.type !== 'unit_post_move')) return;

    const attacker = mode.unit;
    const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(s, attacker, target);

    let nextState: GameSession = {
      ...s,
      board,
      player: { ...s.player, baseHp: playerBaseHp },
      ai: { ...s.ai, baseHp: aiBaseHp },
      log: [...s.log, ...log],
    };

    // 反撃チェック
    if (target.type === 'unit') {
      const defender = target.unit;
      if (defender.card.skill?.effectType === 'counter') {
        const currentDefender = board[defender.position.row]?.[defender.position.col];
        if (currentDefender) {
          const { state: afterCounter } = applyCounterAttack(nextState, currentDefender, attacker);
          nextState = afterCounter;
        }
      }
    }

    // 行動済みフラグ
    const finalBoard = nextState.board.map((r) => [...r]);
    const pos = attacker.position;
    const updatedAttacker = finalBoard[pos.row]?.[pos.col];
    if (updatedAttacker) {
      finalBoard[pos.row][pos.col] = { ...updatedAttacker, hasActedThisTurn: true };
    }

    // 勝敗チェック
    const winner = checkWinner(nextState.player.baseHp, nextState.ai.baseHp);
    const finished = winner !== null;
    const finishedAt = finished ? Date.now() : undefined;

    const result: GameSession = {
      ...nextState,
      board: finalBoard,
      phase: finished ? 'finished' : nextState.phase,
      winner: winner ?? undefined,
      finishedAt,
    };

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
    const skill = unit.card.skill;
    if (!skill) return [];
    const resolver = SKILL_RESOLVERS[skill.effectType];
    if (!resolver) return [];
    return resolver.getValidTargets(s, unit);
  }, [mode]);

  const useSkill = useCallback((target?: Position) => {
    const s = sessionRef.current;
    if (!s || (mode.type !== 'unit_selected' && mode.type !== 'unit_post_move')) return;
    const unit = mode.unit;
    const skill = unit.card.skill;
    if (!skill) return;
    const resolver = SKILL_RESOLVERS[skill.effectType];
    if (!resolver || !resolver.canActivate(s, unit)) return;

    const { state: afterSkill } = resolver.resolve(s, unit, target);

    // 行動済みフラグ
    const finalBoard = afterSkill.board.map((r) => [...r]);
    const pos = unit.position;
    const updatedUnit = finalBoard[pos.row]?.[pos.col];
    if (updatedUnit) {
      finalBoard[pos.row][pos.col] = { ...updatedUnit, hasActedThisTurn: true };
    }

    // 勝敗チェック（スキルでHPが0になる場合を考慮）
    const winner = checkWinner(afterSkill.player.baseHp, afterSkill.ai.baseHp);
    const finished = winner !== null;
    const result: GameSession = {
      ...afterSkill,
      board: finalBoard,
      phase: finished ? 'finished' : afterSkill.phase,
      winner: winner ?? undefined,
      finishedAt: finished ? Date.now() : undefined,
    };

    updateSession(result);
    if (finished) saveSession(result);
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, [mode, updateSession]);

  // ─── ターン終了 ──────────────────────────────────────────────────────────

  const endTurn = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || s.currentTurn !== 'player' || s.phase === 'finished') return;

    // 全ユニットのフラグリセット・AIターンへ
    const resetBoard = s.board.map((row) =>
      row.map((cell) => (cell ? { ...cell, hasActedThisTurn: false, hasSummonedThisTurn: false } : null))
    );

    // AIドロー
    let aiDeck = [...s.ai.deck];
    let aiHand = [...s.ai.hand];
    if (aiDeck.length > 0) {
      aiHand = [...aiHand, aiDeck[0]];
      aiDeck = aiDeck.slice(1);
    }

    const aiTurnState: GameSession = {
      ...s,
      board: resetBoard,
      currentTurn: 'ai',
      turnCount: s.turnCount + 1,
      player: { ...s.player, hasSummonedThisTurn: false, hasMovedThisTurn: false },
      ai: { ...s.ai, deck: aiDeck, hand: aiHand, hasSummonedThisTurn: false, hasMovedThisTurn: false },
      log: [...s.log, `─── ターン${s.turnCount + 1} (AIのターン) ───`],
    };

    setMode({ type: 'idle' });
    setHighlightedCells([]);
    updateSession(aiTurnState);

    // AI実行
    const afterAI = await executeAITurn(aiTurnState, updateSession);

    // プレイヤードロー
    let playerDeck = [...afterAI.player.deck];
    let playerHand = [...afterAI.player.hand];
    if (playerDeck.length > 0) {
      playerHand = [...playerHand, playerDeck[0]];
      playerDeck = playerDeck.slice(1);
    }

    // 全ユニットのhasActedThisTurnリセット
    const nextBoard = afterAI.board.map((row) =>
      row.map((cell) => (cell ? { ...cell, hasActedThisTurn: false, hasSummonedThisTurn: false } : null))
    );

    // 勝敗チェック
    const winner = checkWinner(afterAI.player.baseHp, afterAI.ai.baseHp);
    const finished = winner !== null;
    const finishedAt = finished ? Date.now() : undefined;

    const finalSession: GameSession = {
      ...afterAI,
      board: nextBoard,
      currentTurn: 'player' as const,
      player: { ...afterAI.player, deck: playerDeck, hand: playerHand, hasSummonedThisTurn: false, hasMovedThisTurn: false },
      phase: finished ? ('finished' as const) : ('main' as const),
      winner: winner ?? undefined,
      finishedAt,
      log: [...afterAI.log, `─── ターン${afterAI.turnCount + 1} (プレイヤーのターン) ───`],
    };

    updateSession(finalSession);
    if (finished) saveSession(finalSession);
  }, [updateSession]);

  const cancel = useCallback(() => {
    setMode({ type: 'idle' });
    setHighlightedCells([]);
  }, []);

  return (
    <GameContext.Provider value={{
      session, mode, highlightedCells,
      initGame, selectCard, summonToCell,
      selectUnit, startMove, cancelMove, moveUnit,
      attackTarget, useSkill, endUnitAction,
      endTurn, cancel, getSkillTargets,
    }}>
      {children}
    </GameContext.Provider>
  );
};

// ─── 勝敗チェック ─────────────────────────────────────────────────────────

function checkWinner(playerBaseHp: number, aiBaseHp: number): 'player' | 'ai' | 'draw' | null {
  if (playerBaseHp <= 0 && aiBaseHp <= 0) return 'draw';
  if (playerBaseHp <= 0) return 'ai';
  if (aiBaseHp <= 0) return 'player';
  return null;
}
