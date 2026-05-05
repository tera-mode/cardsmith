'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import { MATERIALS } from '@/lib/data/materials';
import { MaterialCategory } from '@/lib/types/meta';

const TABS: { key: MaterialCategory; label: string }[] = [
  { key: 'stat_hp',      label: 'HP' },
  { key: 'stat_atk',     label: 'ATK' },
  { key: 'movement',     label: '移動' },
  { key: 'attack_range', label: '攻撃' },
  { key: 'skill',        label: 'スキル' },
];

export default function MaterialsPage() {
  const { user, loading: authLoading } = useAuth();
  const { ownedMaterials, loading } = useProfile();
  const router = useRouter();
  const [tab, setTab] = useState<MaterialCategory>('stat_hp');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const getCount = (id: string) =>
    ownedMaterials.find(m => m.materialId === id)?.count ?? 0;

  const filtered = MATERIALS.filter(m => m.category === tab);

  if (loading) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="マテリアル" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader backHref="/" title="マテリアル" />

      {/* タブ */}
      <div className="flex-shrink-0 flex border-b border-[#1e3a5f]/50">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-bold transition-colors ${
              tab === t.key
                ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                : 'text-[#64748b]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(mat => {
            const count = getCount(mat.id);
            return (
              <div
                key={mat.id}
                className={`bg-[#16213e]/80 rounded-xl p-3 border border-[#1e3a5f]/50 transition-opacity ${count > 0 ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{mat.icon}</span>
                  <span className={`text-xs font-bold ${count > 0 ? 'text-white' : 'text-[#64748b]'}`}>
                    ×{count}
                  </span>
                </div>
                <p className="text-xs font-bold text-white">{mat.name}</p>
                <p className="text-[10px] text-[#64748b] mt-0.5">{mat.description}</p>
                <p className="text-[10px] text-[#fbbf24] mt-1">コスト {mat.cost}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
