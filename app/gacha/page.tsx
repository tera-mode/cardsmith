'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import RarityBadge from '@/components/ui/RarityBadge';
import { STANDARD_GACHA } from '@/lib/data/gacha';
import { CARDS } from '@/lib/game/cards';
import { rollGacha, applyGachaResult, getCardRarityFromPool } from '@/lib/server-logic/gacha';
import { consumeRunes } from '@/lib/server-logic/profile';
import { Rarity, RARITY_COLORS } from '@/lib/types/meta';

type PullCount = 1 | 10;

export default function GachaPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedCards, loading, updateProfile, updateCards } = useProfile();
  const router = useRouter();

  const [confirmPull, setConfirmPull] = useState<PullCount | null>(null);
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<{ cardId: string; rarity: Rarity }[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const price = (count: PullCount) =>
    count === 1 ? STANDARD_GACHA.pricePerPull : STANDARD_GACHA.bundlePrice;

  const handlePull = async () => {
    if (!confirmPull || !profile) return;
    const cost = price(confirmPull);
    const newProfile = consumeRunes(profile, cost);
    if (!newProfile) return;

    setPulling(true);
    setConfirmPull(null);
    try {
      const cardIds = rollGacha(STANDARD_GACHA, confirmPull);
      const newCards = applyGachaResult(ownedCards, cardIds);
      await updateProfile(newProfile);
      await updateCards(newCards);
      setResults(cardIds.map(id => ({ cardId: id, rarity: getCardRarityFromPool(id) })));
    } finally {
      setPulling(false);
    }
  };

  const canAfford = (count: PullCount) => (profile?.runes ?? 0) >= price(count);

  if (loading || !profile) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="召喚" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // 結果画面
  if (results) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="召喚結果" />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {results.map((r, i) => {
              const card = CARDS.find(c => c.id === r.cardId);
              const color = RARITY_COLORS[r.rarity];
              return (
                <div
                  key={i}
                  data-testid={`gacha-result-card-${i}`}
                  className="rounded-xl p-3 border text-center"
                  style={{ borderColor: `${color}50`, background: `${color}10` }}
                >
                  <RarityBadge rarity={r.rarity} />
                  <div className="text-2xl my-2">
                    {r.cardId === 'archer' ? '🏹' : r.cardId === 'cavalry' ? '🐎' : r.cardId === 'cannon' ? '💣' : r.cardId === 'healer' ? '💚' : r.cardId === 'defender' ? '🛡️' : '⚔️'}
                  </div>
                  <div className="text-xs font-bold text-white">{card?.name}</div>
                  <div className="text-[10px] text-[#64748b]">C{card?.cost}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setResults(null)}
              className="flex-1 py-3 bg-[#fbbf24] text-black font-bold rounded-xl text-sm"
            >
              もう一度引く
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 bg-[#1e3a5f] text-[#94a3b8] font-bold rounded-xl text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader backHref="/" title="召喚" />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <div className="text-6xl mb-3">✨</div>
          <h2 className="text-xl font-bold text-white mb-1">標準召喚</h2>
          <p className="text-sm text-[#94a3b8]">カードを召喚して戦力を強化しよう</p>
        </div>

        <div className="w-full space-y-3 max-w-sm">
          {/* 単発 */}
          <div className="bg-[#16213e]/80 rounded-xl p-4 border border-[#fbbf24]/20">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-bold text-white">単発召喚</p>
                <p className="text-xs text-[#64748b]">1枚を召喚する</p>
              </div>
              <span className="text-[#fbbf24] font-bold">💎 {STANDARD_GACHA.pricePerPull}</span>
            </div>
            <button
              data-testid="gacha-pull-single"
              onClick={() => setConfirmPull(1)}
              disabled={!canAfford(1) || pulling}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-bold text-sm disabled:opacity-50 disabled:grayscale"
            >
              {pulling ? '召喚中...' : '召喚する'}
            </button>
            {!canAfford(1) && <p className="text-xs text-red-400 text-center mt-1">ルーンが足りません</p>}
          </div>

          {/* 10連 */}
          <div className="bg-[#16213e]/80 rounded-xl p-4 border border-[#fbbf24]/30">
            <div className="flex justify-between items-center mb-1">
              <div>
                <p className="text-sm font-bold text-white">10連召喚</p>
                <p className="text-xs text-[#64748b]">10枚を召喚（R以上1枚保証）</p>
              </div>
              <span className="text-[#fbbf24] font-bold">💎 {STANDARD_GACHA.bundlePrice}</span>
            </div>
            <p className="text-[10px] text-[#fbbf24] mb-3">通常より10%お得</p>
            <button
              data-testid="gacha-pull-ten"
              onClick={() => setConfirmPull(10)}
              disabled={!canAfford(10) || pulling}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-bold text-sm disabled:opacity-50 disabled:grayscale"
            >
              {pulling ? '召喚中...' : '10連召喚する'}
            </button>
            {!canAfford(10) && <p className="text-xs text-red-400 text-center mt-1">ルーンが足りません</p>}
          </div>
        </div>

        <div className="text-xs text-[#475569] text-center space-y-0.5">
          <p>排出率：C 70% / R 22% / SR 7% / SSR 1%</p>
          <p>所持ルーン: 💎 {profile.runes.toLocaleString()}</p>
        </div>
      </div>

      <ConfirmSheet
        open={!!confirmPull}
        title={`${confirmPull}枚召喚しますか？`}
        onConfirm={handlePull}
        onCancel={() => setConfirmPull(null)}
        confirmLabel="召喚する"
        loading={pulling}
      >
        <div className="flex justify-center gap-8 text-sm">
          <div className="text-center">
            <p className="text-xs text-[#94a3b8] mb-1">消費ルーン</p>
            <p className="text-[#fbbf24] font-bold">💎 {confirmPull ? price(confirmPull) : 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#94a3b8] mb-1">残ルーン</p>
            <p className="text-white font-bold">
              💎 {confirmPull ? (profile.runes - price(confirmPull)).toLocaleString() : profile.runes}
            </p>
          </div>
        </div>
      </ConfirmSheet>
    </div>
  );
}
