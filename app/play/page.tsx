'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { GameProvider } from '@/contexts/GameContext';
import { Unit } from '@/lib/types/game';
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
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundImage: "url('/images/backgrounds/board.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1a1a2e',
      }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-[#1a1a2e]/85 pointer-events-none" />

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
        <div className="border-t border-[#1e3a5f]/40 h-16 overflow-hidden flex-shrink-0">
          <GameLog log={session.log} />
        </div>

        {/* 手札 */}
        <div className="flex-shrink-0 border-t border-[#1e3a5f]/40 py-1">
          <Hand
            hand={session.player.hand}
            mode={mode}
            hasSummonedThisTurn={session.player.hasSummonedThisTurn}
            isPlayerTurn={isPlayerTurn}
          />
        </div>

        {/* ターン終了ボタン */}
        <div className="px-3 pb-3 pt-1 flex-shrink-0 safe-bottom">
          <button
            data-testid="end-turn-button"
            onClick={isPlayerTurn && !isFinished ? endTurn : undefined}
            disabled={!isPlayerTurn || isFinished}
            className={[
              'tap-target w-full rounded-xl text-base font-bold transition-all duration-150',
              isPlayerTurn && !isFinished
                ? 'bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isFinished
              ? (session.winner === 'player' ? '🎉 勝利！' : session.winner === 'ai' ? '😢 敗北...' : '🤝 引き分け')
              : isPlayerTurn ? 'ターン終了' : '⏳ AI思考中...'}
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
