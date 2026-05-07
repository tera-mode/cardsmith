'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { GameProvider } from '@/contexts/GameContext';
import { Unit, Card } from '@/lib/types/game';
import Board from '@/components/game/Board';
import Hand from '@/components/game/Hand';
import BaseHpBar from '@/components/game/BaseHpBar';
import TurnIndicator from '@/components/game/TurnIndicator';
import TurnStepBar from '@/components/game/TurnStepBar';
import ActionMenu, { SkipMoveButton } from '@/components/game/ActionMenu';
import HintPanel from '@/components/game/HintPanel';
import GameLog from '@/components/game/GameLog';
import CardModal from '@/components/ui/CardModal';
import ArchetypeSelectModal from '@/components/game/ArchetypeSelectModal';
import type { Archetype } from '@/lib/game/decks';

function GameScreen() {
  const { user, loading } = useAuth();
  const { session, mode, highlightedCells, initGame, endTurn } = useGame();
  const router = useRouter();
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const questId = searchParams.get('questId') ?? undefined;
  const isQ03 = questId === 'q0_3';

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

  useEffect(() => {
    if (!user || session) return;
    // q0_3: 系統選択まではゲームを開始しない
    if (isQ03 && !selectedArchetype) return;
    initGame(user.uid, questId, selectedArchetype ?? undefined);
  }, [user, session, initGame, isQ03, selectedArchetype]);

  useEffect(() => {
    if (session?.phase === 'finished') {
      const params = new URLSearchParams({
        winner: session.winner ?? 'draw',
        turns: String(session.turnCount),
        playerHp: String(session.player.baseHp),
        aiHp: String(session.ai.baseHp),
        ...(questId ? { questId } : {}),
        ...(isQ03 && selectedArchetype ? { archetype: selectedArchetype } : {}),
      });
      setTimeout(() => router.push(`/result?${params}`), 1500);
    }
  }, [session?.phase, session?.winner, session?.turnCount, session?.player.baseHp, session?.ai.baseHp, router]);

  // q0_3: 系統選択モーダル
  if (isQ03 && !selectedArchetype) {
    return (
      <ArchetypeSelectModal onSelect={arch => setSelectedArchetype(arch)} />
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
    <div className="game-layout stone-bg">
      {/* ダンジョン ambient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 10%, rgba(255,180,80,0.07), transparent 50%), radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* 松明装飾 */}
      <div className="torch" style={{ position: 'absolute', top: 56, left: 8, zIndex: 5 }} />
      <div className="torch" style={{ position: 'absolute', top: 56, right: 8, zIndex: 5 }} />

      {/* 縦幅が狭い場合はスクロール可能にする */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col w-full max-w-[480px] mx-auto safe-scroll">

        {/* AI 陣地HP */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0">
          <BaseHpBar owner="ai" hp={session.ai.baseHp} />
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
          <BaseHpBar owner="player" hp={session.player.baseHp} />
        </div>

        {/* ターンインジケーター */}
        <div className="px-3 py-1 flex-shrink-0">
          <TurnIndicator currentTurn={session.currentTurn} turnCount={session.turnCount} />
        </div>

        {/* ヒントパネル */}
        <HintPanel session={session} mode={mode} />

        {/* 移動モード中：その場に留まる / 戻る（インライン表示） */}
        <SkipMoveButton mode={mode} />

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

        {/* 召喚・移動・攻撃 + ターン終了（一体化バー） */}
        <div className="flex-shrink-0 safe-bottom">
          <TurnStepBar
            session={session}
            mode={mode}
            isFinished={isFinished}
            onEndTurn={isPlayerTurn && !isFinished ? endTurn : () => {}}
          />
        </div>
      </div>

      {/* SkipMoveButton は layout 内に移動済み */}

      {/* アクション選択メニュー */}
      {(mode.type === 'unit_selected' || mode.type === 'unit_post_move') && (
        <ActionMenu mode={mode} session={session} />
      )}

      {/* カード詳細モーダル（長押し） */}
      {detailUnit && (
        <CardModal card={detailUnit.card} unit={detailUnit} onClose={() => setDetailUnit(null)} />
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
