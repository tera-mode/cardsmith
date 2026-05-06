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
import CardDetailModal from '@/components/game/CardDetailModal';

function GameScreen() {
  const { user, loading } = useAuth();
  const { session, mode, highlightedCells, initGame, endTurn } = useGame();
  const router = useRouter();
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

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
      buffs: { atkBonus: 0 },
    });
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !session) initGame(user.uid);
  }, [user, session, initGame]);

  useEffect(() => {
    if (session?.phase === 'finished') {
      const params = new URLSearchParams({
        winner: session.winner ?? 'draw',
        turns: String(session.turnCount),
        playerHp: String(session.player.baseHp),
        aiHp: String(session.ai.baseHp),
        ...(searchParams.get('questId') ? { questId: searchParams.get('questId')! } : {}),
      });
      setTimeout(() => router.push(`/result?${params}`), 1500);
    }
  }, [session?.phase, session?.winner, session?.turnCount, session?.player.baseHp, session?.ai.baseHp, router]);

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
    <div
      className="fixed inset-0 flex flex-col stone-bg"
      style={{ position: 'relative' }}
    >
      {/* ダンジョン ambient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 10%, rgba(255,180,80,0.07), transparent 50%), radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* 松明装飾 */}
      <div className="torch" style={{ position: 'absolute', top: 56, left: 8, zIndex: 5 }} />
      <div className="torch" style={{ position: 'absolute', top: 56, right: 8, zIndex: 5 }} />

      <div className="relative z-10 flex flex-col h-full w-full max-w-[480px] mx-auto">

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

        {/* ターンステップバー */}
        <div className="flex-shrink-0">
          <TurnStepBar session={session} mode={mode} />
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

        {/* ターン終了ボタン */}
        <div style={{ padding: '6px 12px 10px', flexShrink: 0 }} className="safe-bottom">
          <button
            data-testid="end-turn-button"
            onClick={isPlayerTurn && !isFinished ? endTurn : undefined}
            disabled={!isPlayerTurn || isFinished}
            className={isPlayerTurn && !isFinished ? 'btn--primary' : 'btn--primary'}
            style={!isPlayerTurn || isFinished ? {
              background: 'linear-gradient(180deg, #3a3024 0%, #1e180f 100%)',
              borderColor: 'var(--text-dim)',
              color: 'var(--text-dim)',
              cursor: 'not-allowed',
              boxShadow: 'none',
              minHeight: 48,
            } : { minHeight: 48, fontSize: 15 }}
          >
            {isFinished
              ? (session.winner === 'player' ? '🏆 勝利！' : session.winner === 'ai' ? '💀 敗北...' : '⚖ 引き分け')
              : isPlayerTurn ? '⚔ ターン終了' : '⏳ AI思考中...'}
          </button>
        </div>
      </div>

      {/* SkipMoveButton は layout 内に移動済み */}

      {/* アクション選択メニュー */}
      {(mode.type === 'unit_selected' || mode.type === 'unit_post_move') && (
        <ActionMenu mode={mode} session={session} />
      )}

      {/* カード詳細モーダル（長押し） */}
      {detailUnit && (
        <CardDetailModal unit={detailUnit} onClose={() => setDetailUnit(null)} />
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
