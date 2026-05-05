'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import RewardModal from '@/components/ui/RewardModal';
import { applyReward } from '@/lib/server-logic/reward';
import { BATTLE_REWARDS } from '@/lib/data/economy';
import { QUEST_MAP } from '@/lib/data/quests';
import { Reward } from '@/lib/types/meta';

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { profile, ownedCards, ownedMaterials, updateProfile, updateCards, updateMaterials, markQuestCleared } = useProfile();

  const winner = params.get('winner') as 'player' | 'ai' | 'draw' | null;
  const turns = params.get('turns');
  const playerHp = params.get('playerHp');
  const aiHp = params.get('aiHp');
  const questId = params.get('questId');

  const [rewardApplied, setRewardApplied] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<{ reward: Reward; leveledUp: boolean; newLevel?: number } | null>(null);

  const isWin = winner === 'player';
  const isDraw = winner === 'draw';

  useEffect(() => {
    if (!profile || rewardApplied) return;

    const applyRewards = async () => {
      setRewardApplied(true);

      // 対戦報酬
      let reward: Reward;
      if (isWin && questId) {
        const quest = QUEST_MAP[questId];
        const progress = undefined; // クリア済みかは後で確認
        reward = quest?.reward ?? BATTLE_REWARDS.win;
      } else if (isWin) {
        reward = BATTLE_REWARDS.win;
      } else if (isDraw) {
        reward = BATTLE_REWARDS.draw;
      } else {
        reward = BATTLE_REWARDS.lose;
      }

      const result = applyReward(
        profile,
        { ownedCards, ownedMaterials },
        reward
      );

      await updateProfile(result.profile);
      await updateCards(result.inventory.ownedCards);
      await updateMaterials(result.inventory.ownedMaterials);

      if (isWin && questId) {
        await markQuestCleared(questId);
      }

      setRewardData({
        reward,
        leveledUp: result.leveledUp,
        newLevel: result.leveledUp ? result.profile.level : undefined,
      });
      setShowReward(true);
    };

    applyRewards();
  }, [profile]);

  return (
    <div className="game-layout items-center justify-center bg-[#1a1a2e] px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-center">
          <div className="text-6xl mb-3">
            {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
          </div>
          <div
            data-testid="result-winner"
            className={['text-3xl font-bold',
              isWin ? 'text-[#f59e0b]' : isDraw ? 'text-gray-300' : 'text-[#ef4444]',
            ].join(' ')}
          >
            {isWin ? '勝利！' : isDraw ? '引き分け' : '敗北...'}
          </div>
        </div>

        <div className="bg-[#16213e] rounded-xl p-4 w-full space-y-2">
          <div data-testid="result-turns" className="flex justify-between text-sm">
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
          {profile && (
            <div className="flex justify-between text-sm border-t border-[#1e3a5f]/50 pt-2 mt-2">
              <span className="text-gray-400">ルーン</span>
              <span className="text-[#fbbf24] font-bold">💎 {profile.runes.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            data-testid="play-again"
            onClick={() => questId ? router.push('/story') : router.push('/play')}
            className="tap-target w-full bg-[#3b82f6] text-white font-bold rounded-xl"
          >
            {questId ? 'ストーリーへ戻る' : 'もう一度プレイ'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="tap-target w-full bg-[#16213e] border border-[#3b82f6]/50 text-[#60a5fa] font-bold rounded-xl"
          >
            ホームへ
          </button>
        </div>
      </div>

      {showReward && rewardData && (
        <RewardModal
          reward={rewardData.reward}
          leveledUp={rewardData.leveledUp}
          newLevel={rewardData.newLevel}
          onClose={() => setShowReward(false)}
        />
      )}
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
