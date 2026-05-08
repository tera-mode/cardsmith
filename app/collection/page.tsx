'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import RarityBadge from '@/components/ui/RarityBadge';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import CardModal from '@/components/ui/CardModal';
import { CARDS_WITH_RARITY } from '@/lib/data/cards';
import { PRESET_CARD_MATERIALS, getMaterial } from '@/lib/data/materials';
import { RARITY_COLORS, OwnedCard, Rarity, CraftedCard } from '@/lib/types/meta';
import { applyReward } from '@/lib/server-logic/reward';
import { craftedToGameCard } from '@/lib/server-logic/forge';
import { Card } from '@/lib/types/game';

// ─── 統合カードエントリー型 ──────────────────────────────────────────────────

type CollectionEntry = {
  key: string;
  type: 'preset' | 'crafted';
  count: number;
  acquiredAt: number;
  // 表示用
  name: string;
  rarity: Rarity;
  color: string;
  imageId: string;        // preset: cardId / crafted: instanceId (for fallback)
  imageUrl?: string;      // crafted 専用カスタム画像URL
  iconKey?: string;       // crafted 専用絵文字フォールバック
  atk: number;
  hp: number;
  cost: number;
  // カード詳細用
  gameCard: Card & { rarity: Rarity };
  craftedData?: CraftedCard;
  // 抽出素材
  extractMaterialIds: string[];
};

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedCards, ownedMaterials, loading, updateProfile, updateCards, updateMaterials } = useProfile();
  const router = useRouter();

  const [extractTarget, setExtractTarget] = useState<CollectionEntry | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [detailEntry, setDetailEntry] = useState<CollectionEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // ─── カードエントリーを組み立て ────────────────────────────────────────────

  const presetEntries: CollectionEntry[] = CARDS_WITH_RARITY.map(card => {
    const owned = ownedCards.find(c => c.cardId === card.id && !c.isCrafted);
    const count = owned?.count ?? 0;
    const matIds = PRESET_CARD_MATERIALS[card.id] ?? [];
    return {
      key: card.id,
      type: 'preset',
      count,
      acquiredAt: owned?.acquiredAt ?? 0,
      name: card.name,
      rarity: card.rarity,
      color: RARITY_COLORS[card.rarity],
      imageId: card.id,
      atk: card.atk,
      hp: card.hp,
      cost: card.cost,
      gameCard: card,
      extractMaterialIds: matIds,
    };
  });

  const craftedEntries: CollectionEntry[] = ownedCards
    .filter(c => c.isCrafted && c.craftedData)
    .map(c => {
      const cd = c.craftedData!;
      const gameCard = { ...craftedToGameCard(cd), rarity: cd.rarity };
      const matCounts: Record<string, number> = {};
      for (const id of cd.craftedFrom) matCounts[id] = (matCounts[id] ?? 0) + 1;
      return {
        key: c.cardId,
        type: 'crafted' as const,
        count: c.count,
        acquiredAt: c.acquiredAt,
        name: cd.name,
        rarity: cd.rarity,
        color: RARITY_COLORS[cd.rarity],
        imageId: cd.instanceId,
        imageUrl: cd.imageUrl,
        iconKey: cd.iconKey,
        atk: cd.atk,
        hp: cd.hp,
        cost: cd.cost,
        gameCard,
        craftedData: cd,
        extractMaterialIds: cd.craftedFrom,
      };
    });

  // 所持→未所持の順。所持内は acquiredAt 降順（新着優先）
  const sortedEntries: CollectionEntry[] = [
    ...craftedEntries.sort((a, b) => b.acquiredAt - a.acquiredAt),
    ...presetEntries.filter(e => e.count > 0).sort((a, b) => b.acquiredAt - a.acquiredAt),
    ...presetEntries.filter(e => e.count === 0),
  ];

  // ─── 抽出処理 ─────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!extractTarget || !profile) return;
    setExtracting(true);
    try {
      const { key, type } = extractTarget;

      // カードを1枚減らす
      const newCards = ownedCards
        .map(c => c.cardId === key ? { ...c, count: c.count - 1 } : c)
        .filter(c => c.count > 0);

      // 抽出マテリアル（crafted: craftedFrom から、preset: PRESET_CARD_MATERIALS）
      const matIds = extractTarget.extractMaterialIds;
      const matCounts: Record<string, number> = {};
      for (const id of matIds) matCounts[id] = (matCounts[id] ?? 0) + 1;
      const matReward = Object.entries(matCounts).map(([materialId, count]) => ({ materialId, count }));

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

  // ─── ローディング ─────────────────────────────────────────────────────────

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

  const ownedCount = ownedCards.filter(c => !c.isCrafted).reduce((s, c) => s + c.count, 0);
  const craftedCount = ownedCards.filter(c => c.isCrafted).length;

  // ─── 描画 ─────────────────────────────────────────────────────────────────

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="コレクション" />

      <div className="flex-1 overflow-y-auto p-3 safe-scroll">
        <p className="text-xs text-muted mb-3">
          所持 {ownedCount} 枚 / 全{CARDS_WITH_RARITY.length} 種
          {craftedCount > 0 && <span className="ml-2 text-gold">＋鍛造 {craftedCount} 枚</span>}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {sortedEntries.map(entry => {
            const { key, count, color, rarity, name, atk, hp, cost, type } = entry;
            const isOwned = count > 0;

            return (
              <div
                key={key}
                data-testid={`collection-card-${key}`}
                className="panel--ornate p-3 border transition-opacity cursor-pointer active:scale-95"
                style={{
                  borderColor: isOwned ? `${color}40` : 'rgba(90,79,61,0.2)',
                  opacity: isOwned ? 1 : 0.45,
                }}
                onClick={() => setDetailEntry(entry)}
              >
                <div className="flex items-start justify-between mb-1">
                  <RarityBadge rarity={rarity} size="xs" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {type === 'crafted' && (
                      <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>鍛</span>
                    )}
                    <span className="text-xs text-muted">×{count}</span>
                  </div>
                </div>

                {/* カード画像エリア */}
                <div style={{
                  width: '100%', height: 80,
                  borderRadius: 6, overflow: 'hidden',
                  marginBottom: 4, position: 'relative',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {type === 'crafted' && entry.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt={name}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center 20%', display: 'block',
                      }}
                    />
                  ) : type === 'crafted' && entry.iconKey ? (
                    <span style={{ fontSize: 32 }}>{entry.iconKey}</span>
                  ) : (
                    <img
                      src={`/images/chars/${key}.png`}
                      alt={name}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center 20%', display: 'block',
                        filter: !isOwned ? 'grayscale(100%)' : 'none',
                        opacity: !isOwned ? 0.5 : 1,
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                <div className="text-xs font-bold text-white leading-tight truncate">{name}</div>
                <div className="text-[10px] text-muted">ATK{atk} HP{hp} C{cost}</div>

                {isOwned && (
                  <button
                    data-testid="collection-extract-button"
                    onClick={(e) => { e.stopPropagation(); setExtractTarget(entry); }}
                    className="w-full mt-2 py-1.5 rounded-lg bg-[#0d2137] border border-[#1e3a5f] text-secondary text-xs font-bold"
                  >
                    抽出
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* カード詳細モーダル */}
      {detailEntry && (
        <CardModal
          card={detailEntry.gameCard}
          count={detailEntry.count}
          customImage={detailEntry.imageUrl}
          onClose={() => setDetailEntry(null)}
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
                <p className="text-white font-bold">{extractTarget.name} ×1</p>
              </div>
              <div className="text-muted self-center text-lg">→</div>
              <div className="text-center">
                <p className="text-secondary text-xs mb-1">得るもの</p>
                <div className="space-y-0.5">
                  {(() => {
                    const matCounts: Record<string, number> = {};
                    for (const id of extractTarget.extractMaterialIds) matCounts[id] = (matCounts[id] ?? 0) + 1;
                    return Object.entries(matCounts).map(([id, cnt], i) => (
                      <p key={i} className="text-[#22d3ee] text-xs">
                        {getMaterial(id)?.name ?? id}
                        {cnt > 1 ? ` ×${cnt}` : ''}
                      </p>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmSheet>
    </div>
  );
}
