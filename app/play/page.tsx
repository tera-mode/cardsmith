'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { GameProvider } from '@/contexts/GameContext';
import { Unit, Card } from '@/lib/types/game';
import Board from '@/components/game/Board';
import Hand from '@/components/game/Hand';
import BaseHpBar from '@/components/game/BaseHpBar';
import TurnStepBar from '@/components/game/TurnStepBar';
import ActionMenu, { SkipMoveButton } from '@/components/game/ActionMenu';
import GameLog from '@/components/game/GameLog';
import HintPanel from '@/components/game/HintPanel';
import QuestDialogue from '@/components/game/QuestDialogue';
import CardModal from '@/components/ui/CardModal';
import ArchetypeSelectModal from '@/components/game/ArchetypeSelectModal';
import DeckSelectModal from '@/components/game/DeckSelectModal';
import type { Archetype } from '@/lib/game/decks';
import { getArchetypeFromQuestId, getBattleBgUrl } from '@/lib/utils/archetype';
import { QUEST_MAP } from '@/lib/data/quests';
import { useProfile } from '@/contexts/ProfileContext';

function GameScreen() {
  const { user, loading } = useAuth();
  const { decks } = useProfile();
  const { session, mode, highlightedCells, initGame, endTurn, cancel } = useGame();
  const router = useRouter();
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Card[] | null>(null);
  const [prologueDone, setPrologueDone] = useState(false);
  const [showEpilogue, setShowEpilogue] = useState(false);
  const initialAiHpRef = useRef<number | null>(null);
  const initialPlayerHpRef = useRef<number | null>(null);
  const finishHandledRef = useRef(false);

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const questId = searchParams.get('questId') ?? undefined;
  const isQ03 = questId === 'q0_3';
  const questArchetype = getArchetypeFromQuestId(questId) ?? (selectedArchetype ?? undefined);
  const bgUrl = getBattleBgUrl(questArchetype ?? null);
  const questDef = questId ? QUEST_MAP[questId] : undefined;
  const hasPrologue = !!(questDef?.prologue?.length);
  // カスタムデッキが1つ以上あればデッキ選択を挟む（q0_3のアーキタイプ選択後も含む）
  const hasSavedDecks = decks.length > 0;
  const needsDeckSelect = hasSavedDecks && selectedDeck === null;

  const openCardPreview = (card: Card) => {
    setDetailUnit({
      instanceId: 'preview',
      cardId: card.id,
      card,
      owner: 'player',
      position: { row: -1, col: -1 },
      currentHp: card.hp,
      maxHp: card.hp,
      skillUsesRemaining: card.skill ? card.skill.uses : 0,
      hasActedThisTurn: false,
      hasSummonedThisTurn: false,
      buffs: { atkBonus: 0, auraAtk: 0, auraMaxHp: 0 },
      statusEffects: { frozen: false, paralyzed: false, silenced: false },
    });
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // 初期HP記録（BaseHpBar の maxHp 表示正確化）
  useEffect(() => {
    if (session && !initialAiHpRef.current) {
      initialAiHpRef.current = session.ai.baseHp;
      initialPlayerHpRef.current = session.player.baseHp;
    }
  }, [session]);

  // ゲーム初期化（q0_3 は onSelect で直接呼ぶ。それ以外はプロローグ+デッキ選択完了後）
  useEffect(() => {
    if (!user || session) return;
    if (isQ03) return; // q0_3 は ArchetypeSelectModal の onSelect で initGame を呼ぶ
    if (hasPrologue && !prologueDone) return;
    if (needsDeckSelect) return; // デッキ選択待ち
    initGame(user.uid, questId, undefined, selectedDeck ?? undefined);
  }, [user, session, initGame, isQ03, questId, hasPrologue, prologueDone, needsDeckSelect, selectedDeck]);

  // リザルトURLパラメータ構築（session ref 経由でstale closure回避）
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const buildResultParams = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return '';
    return new URLSearchParams({
      winner: s.winner ?? 'draw',
      turns: String(s.turnCount),
      playerHp: String(s.player.baseHp),
      aiHp: String(s.ai.baseHp),
      ...(questId ? { questId } : {}),
      ...(isQ03 && selectedArchetype ? { archetype: selectedArchetype } : {}),
    }).toString();
  }, [questId, isQ03, selectedArchetype]);

  // ゲーム終了 → エピローグ or リザルト遷移
  useEffect(() => {
    if (session?.phase === 'finished' && !finishHandledRef.current) {
      finishHandledRef.current = true;
      if (questDef?.epilogue?.length && session?.winner === 'player') {
        const t = setTimeout(() => setShowEpilogue(true), 900);
        return () => clearTimeout(t);
      } else {
        const params = buildResultParams();
        const t = setTimeout(() => router.push(`/result?${params}`), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [session?.phase, session?.winner, session?.turnCount, session?.player.baseHp, session?.ai.baseHp, router, buildResultParams]);

  const handleEpilogueDone = useCallback(() => {
    setShowEpilogue(false);
    const params = buildResultParams();
    router.push(`/result?${params}`);
  }, [buildResultParams, router]);

  // プロローグ（ゲーム開始前、系統選択より先に表示）
  if (hasPrologue && !prologueDone) {
    return (
      <div className="game-layout stone-bg" style={{ position: 'relative' }}>
        <QuestDialogue
          scenes={questDef!.prologue!}
          onDone={() => setPrologueDone(true)}
          label="プロローグ"
        />
      </div>
    );
  }

  // q0_3: 系統選択（プロローグ後）
  if (isQ03 && !selectedArchetype) {
    return (
      <ArchetypeSelectModal
        onSelect={arch => setSelectedArchetype(arch)}
      />
    );
  }

  // デッキ選択（カスタムデッキがある場合）
  if (needsDeckSelect) {
    return (
      <DeckSelectModal
        starterArchetype={selectedArchetype ?? undefined}
        onSelect={deck => {
          setSelectedDeck(deck);
          // q0_3 は選択アーキタイプ+カスタムデッキで initGame
          if (isQ03 && selectedArchetype && user) {
            initGame(user.uid, questId, selectedArchetype, deck);
          }
        }}
      />
    );
  }

  if (loading || !session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a1a2e]">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  const isPlayerTurn = session.currentTurn === 'player';
  const isFinished = session.phase === 'finished';

  return (
    <div className="game-layout stone-bg" data-theme={questArchetype ?? undefined}>
      {/* バトル背景画像 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url('${bgUrl}'), url('/images/backgrounds/board.jpg')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.18,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 10%, var(--theme-glow, rgba(255,180,80,0.07)), transparent 50%), radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
      }} />

      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col w-full max-w-[480px] mx-auto safe-scroll">

        {/* AI 陣地HP */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0">
          <BaseHpBar
            owner="ai"
            hp={session.ai.baseHp}
            maxHp={initialAiHpRef.current ?? undefined}
          />
        </div>

        {/* 盤面 */}
        <div className="flex justify-center items-center flex-shrink-0">
          <Board
            board={session.board}
            mode={mode}
            highlightedCells={highlightedCells}
            onUnitLongPress={setDetailUnit}
          />
        </div>

        {/* プレイヤー陣地HP */}
        <div className="px-3 py-1 flex-shrink-0">
          <BaseHpBar
            owner="player"
            hp={session.player.baseHp}
            maxHp={initialPlayerHpRef.current ?? undefined}
          />
        </div>

        {/* ヒントパネル（状況に応じたガイド） */}
        <HintPanel session={session} mode={mode} />

        {/* 移動モード中：その場に留まる / 戻る */}
        <SkipMoveButton mode={mode} />

        {/* スキルターゲット選択中：キャンセルボタン */}
        {mode.type === 'skill_targeting' && (
          <div style={{ padding: '4px 12px', flexShrink: 0 }}>
            <button
              onClick={cancel}
              className="btn--ghost tap-target"
              style={{ width: '100%', fontSize: 12 }}
            >
              ✕ キャンセル
            </button>
          </div>
        )}

        {/* ゲームログ */}
        <div style={{ flexShrink: 0, height: 52, overflow: 'hidden', borderTop: '1px solid var(--border-rune)' }}>
          <GameLog log={session.log} />
        </div>

        {/* 手札 */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-rune)', paddingTop: 4, paddingBottom: 4 }}>
          <Hand
            hand={session.player.hand}
            mode={mode}
            hasSummonedThisTurn={session.player.hasSummonedThisTurn}
            isPlayerTurn={isPlayerTurn}
            onCardLongPress={openCardPreview}
          />
        </div>

        {/* ターン終了バー */}
        <div className="flex-shrink-0 safe-bottom">
          <TurnStepBar
            session={session}
            mode={mode}
            isFinished={isFinished}
            onEndTurn={isPlayerTurn && !isFinished ? endTurn : () => {}}
          />
        </div>
      </div>

      {/* アクション選択メニュー */}
      {(mode.type === 'unit_selected' || mode.type === 'unit_post_move') && (
        <ActionMenu mode={mode} session={session} />
      )}

      {/* カード詳細モーダル（長押し） */}
      {detailUnit && (
        <CardModal card={detailUnit.card} unit={detailUnit} onClose={() => setDetailUnit(null)} />
      )}

      {/* エピローグ（ゲーム終了後） */}
      {showEpilogue && questDef?.epilogue?.length && (
        <QuestDialogue
          scenes={questDef.epilogue}
          onDone={handleEpilogueDone}
          label="エピローグ"
        />
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}
