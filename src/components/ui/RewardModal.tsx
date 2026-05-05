'use client';

import { Reward } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';

interface Props {
  reward: Reward;
  leveledUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

export default function RewardModal({ reward, leveledUp, newLevel, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        data-testid="reward-modal"
        className="bg-[#0d1b35] border border-[#fbbf24]/30 rounded-2xl p-6 mx-4 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center text-[#fbbf24]">✨ REWARD!</h2>

        <div className="space-y-2">
          {reward.exp > 0 && (
            <div className="flex items-center justify-between bg-[#22d3ee]/10 rounded-lg px-3 py-2">
              <span className="text-sm text-[#22d3ee]">経験値</span>
              <span className="font-bold text-[#22d3ee]">+{reward.exp} EXP</span>
            </div>
          )}
          {reward.runes > 0 && (
            <div className="flex items-center justify-between bg-[#fbbf24]/10 rounded-lg px-3 py-2">
              <span className="text-sm text-[#fbbf24]">ルーン</span>
              <span className="font-bold text-[#fbbf24]">+{reward.runes.toLocaleString()} 💎</span>
            </div>
          )}
          {reward.cards && reward.cards.length > 0 && (
            <div className="bg-[#3b82f6]/10 rounded-lg px-3 py-2 space-y-1">
              <p className="text-xs text-[#94a3b8]">カード</p>
              {reward.cards.map(rc => {
                const card = CARDS.find(c => c.id === rc.cardId);
                return (
                  <div key={rc.cardId} className="flex justify-between text-sm text-white">
                    <span>{card?.name ?? rc.cardId}</span>
                    <span className="text-[#94a3b8]">×{rc.count}</span>
                  </div>
                );
              })}
            </div>
          )}
          {reward.materials && reward.materials.length > 0 && (
            <div className="bg-[#a855f7]/10 rounded-lg px-3 py-2 space-y-1">
              <p className="text-xs text-[#94a3b8]">マテリアル</p>
              {reward.materials.map(rm => (
                <div key={rm.materialId} className="flex justify-between text-sm text-white">
                  <span>{rm.materialId}</span>
                  <span className="text-[#94a3b8]">×{rm.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {leveledUp && newLevel && (
          <div className="bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 border border-[#fbbf24]/40 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-[#fbbf24]">🎉 LEVEL UP!</p>
            <p className="text-sm text-white">Lv {newLevel - 1} → Lv {newLevel}</p>
          </div>
        )}

        <button
          data-testid="reward-modal-close"
          onClick={onClose}
          className="w-full py-3 bg-[#1e3a5f] rounded-xl text-[#94a3b8] text-sm font-bold"
        >
          タップで閉じる
        </button>
      </div>
    </div>
  );
}
