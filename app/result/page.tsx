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
      let reward: Reward;
      if (isWin && questId) {
        const quest = QUEST_MAP[questId];
        reward = quest?.reward ?? BATTLE_REWARDS.win;
      } else {
        reward = isWin ? BATTLE_REWARDS.win : isDraw ? BATTLE_REWARDS.draw : BATTLE_REWARDS.lose;
      }

      const result = applyReward(profile, { ownedCards, ownedMaterials }, reward);
      await updateProfile(result.profile);
      await updateCards(result.inventory.ownedCards);
      await updateMaterials(result.inventory.ownedMaterials);

      if (isWin && questId) await markQuestCleared(questId);

      setRewardData({ reward, leveledUp: result.leveledUp, newLevel: result.leveledUp ? result.profile.level : undefined });
      setShowReward(true);
    };

    applyRewards();
  }, [profile]);

  const statRow = (label: string, value: string, color: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(90,79,61,0.2)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</span>
    </div>
  );

  return (
    <div className="game-layout stone-bg items-center justify-center" style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 360, width: '100%' }}>
        {/* 勝敗アイコン */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8, filter: isWin ? 'drop-shadow(0 0 16px rgba(232,192,116,0.6))' : 'none' }}>
            {isWin ? '🏆' : isDraw ? '⚖' : '💀'}
          </div>
          <div
            data-testid="result-winner"
            style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
              letterSpacing: '0.1em',
              color: isWin ? 'var(--gold)' : isDraw ? 'var(--text-secondary)' : 'var(--rune-red)',
              textShadow: isWin ? '0 0 16px rgba(232,192,116,0.5)' : 'none',
            }}
          >
            {isWin ? '勝利！' : isDraw ? '引き分け' : '敗北...'}
          </div>
        </div>

        {/* 統計パネル */}
        <div className="panel--ornate" style={{ padding: '14px 16px', width: '100%' }}>
          <div data-testid="result-turns">
            {statRow('ターン数', turns ?? '—', 'var(--text-primary)')}
          </div>
          {statRow('自陣残HP', playerHp ?? '—', 'var(--rune-blue)')}
          {statRow('AI陣地残HP', aiHp ?? '—', 'var(--rune-red)')}
          {profile && statRow('現在のルーン', `💎 ${profile.runes.toLocaleString()}`, 'var(--gold)')}
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            data-testid="play-again"
            onClick={() => questId ? router.push('/story') : router.push('/play')}
            className="btn--primary"
            style={{ minHeight: 48, fontSize: 14 }}
          >
            {questId ? '📖 ストーリーへ戻る' : '⚔ もう一度プレイ'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn--ghost tap-target"
            style={{ width: '100%', fontSize: 13 }}
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
    <Suspense fallback={
      <div className="game-layout stone-bg items-center justify-center">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.08em' }}>LOADING...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
