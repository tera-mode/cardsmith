'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import RarityBadge from '@/components/ui/RarityBadge';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import CollectionCardModal from '@/components/ui/CollectionCardModal';
import { CARDS_WITH_RARITY } from '@/lib/data/cards';
import { PRESET_CARD_MATERIALS, getMaterial } from '@/lib/data/materials';
import { RARITY_COLORS, OwnedCard, Rarity } from '@/lib/types/meta';
import { applyReward } from '@/lib/server-logic/reward';
import { Card } from '@/lib/types/game';

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedCards, ownedMaterials, loading, updateProfile, updateCards, updateMaterials } = useProfile();
  const router = useRouter();

  const [extractTarget, setExtractTarget] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [detailCard, setDetailCard] = useState<(Card & { rarity: Rarity }) | null>(null);
  const [detailCount, setDetailCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const getOwned = (cardId: string) =>
    ownedCards.find(c => c.cardId === cardId && !c.isCrafted);

  const extractMaterialIds = extractTarget
    ? (PRESET_CARD_MATERIALS[extractTarget] ?? [])
    : [];

  const handleExtract = async () => {
    if (!extractTarget || !profile) return;
    setExtracting(true);
    try {
      const owned = getOwned(extractTarget);
      if (!owned || owned.count < 1) return;

      // カードを1枚減らす
      const newCards = ownedCards.map(c =>
        c.cardId === extractTarget && !c.isCrafted
          ? { ...c, count: c.count - 1 }
          : c
      ).filter(c => c.count > 0);

      // マテリアルを付与
      const matReward = extractMaterialIds.map(id => ({ materialId: id, count: 1 }));
      const { inventory } = applyReward(
        profile,
        { ownedCards: newCards, ownedMaterials },
        { exp: 0, runes: 0, materials: matReward }
      );

      await updateCards(inventory.ownedCards);
      await updateMaterials(inventory.ownedMaterials);
    } finally {
      setExtracting(false);
      setExtractTarget(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="コレクション" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="コレクション" />

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-muted mb-3">
          所持 {ownedCards.reduce((s, c) => s + c.count, 0)} 枚 / 全{CARDS_WITH_RARITY.length} 種
        </p>

        <div className="grid grid-cols-2 gap-2">
          {CARDS_WITH_RARITY.map(card => {
            const owned = getOwned(card.id);
            const count = owned?.count ?? 0;
            const color = RARITY_COLORS[card.rarity];

            return (
              <div
                key={card.id}
                data-testid={`collection-card-${card.id}`}
                className={`panel--ornate p-3 border transition-opacity cursor-pointer active:scale-95 transition-transform ${count > 0 ? 'opacity-100' : 'opacity-40'}`}
                style={{ borderColor: `${color}40` }}
                onClick={() => { setDetailCard(card); setDetailCount(count); }}
              >
                <div className="flex items-start justify-between mb-1">
                  <RarityBadge rarity={card.rarity} size="xs" />
                  <span className="text-xs text-muted">×{count}</span>
                </div>
                <div className="text-center py-1">
                  {/* キャラクター画像サムネイル */}
                  <div style={{
                    width: '100%', height: 80,
                    borderRadius: 6, overflow: 'hidden',
                    marginBottom: 4, position: 'relative',
                    background: 'rgba(0,0,0,0.3)',
                  }}>
                    <img
                      src={`/images/chars/${card.id}.png`}
                      alt={card.name}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 20%',
                        display: 'block',
                        filter: count === 0 ? 'grayscale(100%)' : 'none',
                        opacity: count === 0 ? 0.5 : 1,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-xs font-bold text-white leading-tight">{card.name}</div>
                  <div className="text-[10px] text-muted">ATK{card.atk} HP{card.hp} C{card.cost}</div>
                </div>
                {count > 0 && (
                  <button
                    data-testid="collection-extract-button"
                    onClick={() => setExtractTarget(card.id)}
                    className="w-full mt-2 py-1.5 rounded-lg bg-[#0d2137] border border-[#1e3a5f] text-secondary text-xs font-bold"
                  >
                    抽出
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 生成カード */}
        {ownedCards.filter(c => c.isCrafted).map(c => (
          <div key={c.cardId} className="mt-2 panel--ornate p-3 border border-[#fbbf24]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gold">{c.craftedData?.name ?? '生成カード'}</span>
              <span className="text-xs text-muted">×{c.count}</span>
            </div>
            <div className="text-[10px] text-muted mt-0.5">
              ATK{c.craftedData?.atk} HP{c.craftedData?.hp} C{c.craftedData?.cost}
            </div>
          </div>
        ))}
      </div>

      {/* カード詳細モーダル */}
      {detailCard && (
        <CollectionCardModal
          card={detailCard}
          count={detailCount}
          onClose={() => setDetailCard(null)}
        />
      )}

      {/* 抽出確認シート */}
      <ConfirmSheet
        open={!!extractTarget}
        title="カードを抽出しますか？"
        onConfirm={handleExtract}
        onCancel={() => setExtractTarget(null)}
        confirmLabel="抽出する"
        danger
        loading={extracting}
      >
        {extractTarget && (
          <div className="space-y-3">
            <div className="flex gap-4 justify-center text-sm">
              <div className="text-center">
                <p className="text-secondary text-xs mb-1">失うもの</p>
                <p className="text-white font-bold">
                  {CARDS_WITH_RARITY.find(c => c.id === extractTarget)?.name} ×1
                </p>
              </div>
              <div className="text-muted self-center text-lg">→</div>
              <div className="text-center">
                <p className="text-secondary text-xs mb-1">得るもの</p>
                <div className="space-y-0.5">
                  {extractMaterialIds.map((id, i) => (
                    <p key={i} className="text-[#22d3ee] text-xs">{getMaterial(id)?.name ?? id}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmSheet>
    </div>
  );
}
