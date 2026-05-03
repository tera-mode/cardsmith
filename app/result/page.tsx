'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();

  const winner = params.get('winner') as 'player' | 'ai' | 'draw' | null;
  const turns = params.get('turns');
  const playerHp = params.get('playerHp');
  const aiHp = params.get('aiHp');

  const isWin = winner === 'player';
  const isDraw = winner === 'draw';

  return (
    <div className="game-layout items-center justify-center bg-[#1a1a2e] px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        {/* 勝敗表示 */}
        <div className="text-center">
          <div className="text-6xl mb-3">
            {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
          </div>
          <div
            data-testid="result-winner"
            className={[
              'text-3xl font-bold',
              isWin ? 'text-[#f59e0b]' : isDraw ? 'text-gray-300' : 'text-[#ef4444]',
            ].join(' ')}
          >
            {isWin ? '勝利！' : isDraw ? '引き分け' : '敗北...'}
          </div>
        </div>

        {/* 統計 */}
        <div className="bg-[#16213e] rounded-xl p-4 w-full space-y-2">
          <div
            data-testid="result-turns"
            className="flex justify-between text-sm"
          >
            <span className="text-gray-400">ターン数</span>
            <span className="text-white font-bold">{turns ?? '--'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">自陣残HP</span>
            <span className="text-[#60a5fa] font-bold">{playerHp ?? '--'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">AI陣地残HP</span>
            <span className="text-[#f87171] font-bold">{aiHp ?? '--'}</span>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex flex-col gap-3 w-full">
          <button
            data-testid="play-again"
            onClick={() => router.push('/play')}
            className="tap-target w-full bg-[#3b82f6] text-white font-bold rounded-xl"
          >
            もう一度プレイ
          </button>
          <button
            onClick={() => router.push('/history')}
            className="tap-target w-full bg-[#16213e] border border-[#3b82f6]/50 text-[#60a5fa] font-bold rounded-xl"
          >
            履歴を見る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="game-layout items-center justify-center"><p className="text-gray-400">読み込み中...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
