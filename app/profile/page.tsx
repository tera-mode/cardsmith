'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useEffect, useState } from 'react';
import AppHeader from '@/components/ui/AppHeader';
import GlassPanel from '@/components/ui/GlassPanel';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, ownedCards, ownedMaterials, decks, loading, debugMaxOut, debugReset } = useProfile();
  const [debugBusy, setDebugBusy] = useState<'maxout' | 'reset' | null>(null);
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-scroll">
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

        {/* ─── デバッグパネル ─── */}
        <GlassPanel className="p-4 space-y-3 border border-yellow-600/40">
          <p className="text-yellow-400 text-xs font-bold tracking-widest">DEBUG</p>
          <button
            disabled={debugBusy !== null}
            onClick={async () => {
              setDebugBusy('maxout');
              try { await debugMaxOut(); } finally { setDebugBusy(null); }
            }}
            className="w-full py-3 rounded-xl bg-yellow-900/30 border border-yellow-600/40 text-yellow-300 text-sm font-bold disabled:opacity-50"
          >
            {debugBusy === 'maxout' ? '適用中...' : '全カード＆全マテリアル最強モード'}
          </button>
          <button
            disabled={debugBusy !== null}
            onClick={async () => {
              if (!confirm('データを初期状態に戻します。よろしいですか？')) return;
              setDebugBusy('reset');
              try {
                await debugReset();
                // ストーリー進行データ（localStorage）もクリア
                localStorage.removeItem('cardsmith_story_ch0_step');
                localStorage.removeItem('cardsmith_story_ch1_step');
                localStorage.removeItem('cardsmith_story_first_card_name');
                router.push('/');
              } finally {
                setDebugBusy(null);
              }
            }}
            className="w-full py-3 rounded-xl bg-gray-900/40 border border-gray-600/40 text-gray-400 text-sm font-bold disabled:opacity-50"
          >
            {debugBusy === 'reset' ? '初期化中...' : '初期化（最初の状態に戻す）'}
          </button>
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
