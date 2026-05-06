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
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="召喚" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* 魔法陣エリア */}
        <div style={{ height: 180, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* 魔法陣 SVG */}
          <svg
            width="160" height="160"
            viewBox="0 0 160 160"
            style={{ position: 'absolute', animation: 'spin 30s linear infinite', opacity: 0.25 }}
          >
            <circle cx="80" cy="80" r="75" fill="none" stroke="#e8c074" strokeWidth="1" />
            <circle cx="80" cy="80" r="55" fill="none" stroke="#e8c074" strokeWidth="0.5" />
            <circle cx="80" cy="80" r="35" fill="none" stroke="#e8c074" strokeWidth="0.5" />
            {/* 五芒星 */}
            <polygon points="80,8 95,55 145,55 105,83 120,130 80,100 40,130 55,83 15,55 65,55"
              fill="none" stroke="#e8c074" strokeWidth="1" opacity="0.6" />
            {/* 8方向ルーン文字 */}
            {['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ'].map((r, i) => {
              const angle = (i * 45 - 90) * Math.PI / 180;
              const x = 80 + 65 * Math.cos(angle);
              const y = 80 + 65 * Math.sin(angle);
              return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fill="#e8c074" fontFamily="serif">{r}</text>;
            })}
          </svg>
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6, filter: 'drop-shadow(0 0 12px rgba(232,192,116,0.6))' }}>✨</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 4 }}>
              標準召喚
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              ルーンを捧げ、戦士を呼び出せ
            </p>
          </div>
        </div>

        {/* 単発 */}
        <div className="panel--ornate" style={{ width: '100%', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>単発召喚</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>1枚を召喚する</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="rune-gem" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                {STANDARD_GACHA.pricePerPull}
              </span>
            </div>
          </div>
          <button
            data-testid="gacha-pull-single"
            onClick={() => setConfirmPull(1)}
            disabled={!canAfford(1) || pulling}
            className="btn--primary"
            style={{ minHeight: 44, fontSize: 14 }}
          >
            {pulling ? '召喚中...' : '⚔ 召喚する'}
          </button>
          {!canAfford(1) && <p style={{ fontSize: 11, color: 'var(--rune-red)', textAlign: 'center', marginTop: 6 }}>ルーンが足りません</p>}
        </div>

        {/* 10連 */}
        <div className="panel--ornate" style={{ width: '100%', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>10連召喚</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>10枚（R以上1枚保証）</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="rune-gem" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                {STANDARD_GACHA.bundlePrice}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: 'var(--gold-deep)', marginBottom: 10 }}>通常より10%お得</p>
          <button
            data-testid="gacha-pull-ten"
            onClick={() => setConfirmPull(10)}
            disabled={!canAfford(10) || pulling}
            className="btn--primary"
            style={{ minHeight: 44, fontSize: 14 }}
          >
            {pulling ? '召喚中...' : '✨ 10連召喚する'}
          </button>
          {!canAfford(10) && <p style={{ fontSize: 11, color: 'var(--rune-red)', textAlign: 'center', marginTop: 6 }}>ルーンが足りません</p>}
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          <p>C 70% ・ R 22% ・ SR 7% ・ SSR 1%</p>
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
