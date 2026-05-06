'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useEffect } from 'react';
import AppHeader from '@/components/ui/AppHeader';
import GlassPanel from '@/components/ui/GlassPanel';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, ownedCards, ownedMaterials, decks, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  if (loading || !profile) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="プロフィール" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-secondary text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="プロフィール" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <GlassPanel className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-secondary text-sm">レベル</span>
            <span className="text-white font-bold">{profile.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary text-sm">累積EXP</span>
            <span className="text-[#22d3ee] font-bold">{profile.exp.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary text-sm">ルーン</span>
            <span className="text-gold font-bold">💎 {profile.runes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary text-sm">所持カード</span>
            <span className="text-white font-bold">{ownedCards.reduce((s, c) => s + c.count, 0)} 枚</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary text-sm">マテリアル</span>
            <span className="text-white font-bold">{ownedMaterials.reduce((s, m) => s + m.count, 0)} 個</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary text-sm">デッキ数</span>
            <span className="text-white font-bold">{decks.length}</span>
          </div>
        </GlassPanel>

        <button
          onClick={async () => { await signOut(); router.push('/'); }}
          className="w-full py-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-400 text-sm font-bold"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
