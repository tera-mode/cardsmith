'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import { MATERIALS } from '@/lib/data/materials';
import { getMaterialPrice } from '@/lib/data/economy';
import { consumeRunes } from '@/lib/server-logic/profile';
import { Material, MaterialCategory, OwnedMaterial } from '@/lib/types/meta';

const TABS: { key: MaterialCategory; label: string }[] = [
  { key: 'stat_hp',      label: 'HP' },
  { key: 'stat_atk',     label: 'ATK' },
  { key: 'movement',     label: '移動' },
  { key: 'attack_range', label: '攻撃' },
  { key: 'skill',        label: 'スキル' },
];

export default function ShopPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedMaterials, loading, updateProfile, updateMaterials } = useProfile();
  const router = useRouter();

  const [tab, setTab] = useState<MaterialCategory>('stat_hp');
  const [buyTarget, setBuyTarget] = useState<Material | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const getCount = (id: string) =>
    ownedMaterials.find(m => m.materialId === id)?.count ?? 0;

  const handleBuy = async () => {
    if (!buyTarget || !profile) return;
    const cost = getMaterialPrice(buyTarget.cost);
    const newProfile = consumeRunes(profile, cost);
    if (!newProfile) return;

    setBuying(true);
    try {
      const idx = ownedMaterials.findIndex(m => m.materialId === buyTarget.id);
      let next: OwnedMaterial[];
      if (idx >= 0) {
        next = ownedMaterials.map((m, i) => i === idx ? { ...m, count: m.count + 1 } : m);
      } else {
        next = [...ownedMaterials, { materialId: buyTarget.id, count: 1 }];
      }
      await updateProfile(newProfile);
      await updateMaterials(next);
    } finally {
      setBuying(false);
      setBuyTarget(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="ショップ" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const filtered = MATERIALS.filter(m => m.category === tab);

  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader backHref="/" title="ショップ" />

      {/* タブ */}
      <div className="flex-shrink-0 flex border-b border-[#1e3a5f]/50">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-bold transition-colors ${
              tab === t.key ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-[#64748b]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map(mat => {
          const price = getMaterialPrice(mat.cost);
          const canBuy = profile.runes >= price;
          const owned = getCount(mat.id);

          return (
            <div
              key={mat.id}
              data-testid={`shop-material-${mat.id}`}
              className="flex items-center gap-3 bg-[#16213e]/80 rounded-xl p-3 border border-[#1e3a5f]/50"
            >
              <span className="text-2xl">{mat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{mat.name}</p>
                <p className="text-[10px] text-[#64748b] truncate">{mat.description}</p>
                <p className="text-xs text-[#64748b]">所持 ×{owned}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={`text-sm font-bold ${canBuy ? 'text-[#fbbf24]' : 'text-red-400'}`}>
                  💎 {price}
                </p>
                <button
                  onClick={() => setBuyTarget(mat)}
                  disabled={!canBuy}
                  className="mt-1 px-3 py-1.5 bg-[#10b981] text-black text-xs font-bold rounded-lg disabled:opacity-40 disabled:grayscale"
                >
                  購入
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmSheet
        open={!!buyTarget}
        title="マテリアルを購入しますか？"
        onConfirm={handleBuy}
        onCancel={() => setBuyTarget(null)}
        confirmLabel="購入する"
        loading={buying}
      >
        {buyTarget && (
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-xs text-[#94a3b8] mb-1">購入するもの</p>
              <p className="text-white font-bold">{buyTarget.icon} {buyTarget.name}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#94a3b8] mb-1">消費ルーン</p>
              <p className="text-[#fbbf24] font-bold">💎 {getMaterialPrice(buyTarget.cost)}</p>
            </div>
          </div>
        )}
      </ConfirmSheet>
    </div>
  );
}
