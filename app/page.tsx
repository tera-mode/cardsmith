'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useEffect } from 'react';
import AppHeader from '@/components/ui/AppHeader';

const MENU_ITEMS = [
  { key: 'story',      label: 'ストーリー', icon: '📖', href: '/story',      accent: '#3b82f6' },
  { key: 'play',       label: '自由対戦',   icon: '⚔️',  href: '/play',       accent: '#ef4444' },
  { key: 'collection', label: 'コレクション', icon: '🃏', href: '/collection', accent: '#a855f7' },
  { key: 'materials',  label: 'マテリアル', icon: '🔩',  href: '/materials',  accent: '#6b7280' },
  { key: 'deck',       label: 'デッキ編集', icon: '📋',  href: '/deck',       accent: '#22d3ee' },
  { key: 'forge',      label: '鍛冶',       icon: '🔨',  href: '/forge',      accent: '#f59e0b' },
  { key: 'shop',       label: 'ショップ',   icon: '🏪',  href: '/shop',       accent: '#10b981' },
  { key: 'gacha',      label: '召喚',       icon: '✨',  href: '/gacha',      accent: '#fbbf24' },
] as const;

const SUB_ITEMS = [
  { key: 'history',  label: '履歴',            icon: '📜', href: '/history' },
  { key: 'profile',  label: 'プロフィール',     icon: '👤', href: '/profile' },
] as const;

export default function HomePage() {
  const { user, loading: authLoading, signInAsGuest } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  // ログイン済みなら何もしない（ホームに留まる）
  // 未ログインかつ読み込み完了していたら LP を表示
  const isLoggedIn = !!user;

  const handleGuest = async () => {
    await signInAsGuest();
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a1a2e]">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  // 未ログイン：LP
  if (!isLoggedIn) {
    return (
      <main className="game-layout items-center justify-center bg-[#1a1a2e]">
        <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">⚒️ 最強カード鍛冶師</h1>
            <p className="text-[#94a3b8] text-sm">THE APEX CARDSMITH</p>
          </div>
          <div className="bg-[#16213e] rounded-xl p-4 w-full text-sm text-[#94a3b8] space-y-1">
            <p>• 4×4盤面でのターン制カード対戦</p>
            <p>• 13種類のユニットカードで戦略を組み立てろ</p>
            <p>• マテリアルを集めてオリジナルカードを鍛えろ</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              data-testid="guest-login"
              onClick={handleGuest}
              className="tap-target w-full bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white font-bold rounded-xl text-base transition-colors"
            >
              ゲストでプレイ
            </button>
            <button
              onClick={() => router.push('/login')}
              className="tap-target w-full bg-[#16213e] border border-[#3b82f6] hover:bg-[#1e3a5f] text-[#3b82f6] font-bold rounded-xl text-base transition-colors"
            >
              ログイン / 新規登録
            </button>
          </div>
          <p className="text-xs text-[#475569] text-center">© 合同会社LAIV</p>
        </div>
      </main>
    );
  }

  // ログイン済み：ホームメニュー
  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 次の目標 */}
        <div
          data-testid="home-next-goal"
          className="bg-gradient-to-r from-[#1e3a5f] to-[#1a1a2e] border border-[#3b82f6]/30 rounded-xl p-4 cursor-pointer active:opacity-80"
          onClick={() => router.push('/story')}
        >
          <p className="text-xs text-[#94a3b8] mb-1">次の目標</p>
          <p className="text-sm font-bold text-white">📖 ストーリーを始めよう</p>
          <p className="text-xs text-[#64748b] mt-0.5">Chapter 1 Quest 1-1</p>
        </div>

        {/* メインメニュー 2列グリッド */}
        <div className="grid grid-cols-2 gap-2">
          {MENU_ITEMS.map(item => (
            <button
              key={item.key}
              data-testid={`home-menu-${item.key}`}
              onClick={() => router.push(item.href)}
              className="bg-[#16213e]/80 border border-[#1e3a5f]/60 rounded-xl p-4 text-left active:opacity-70 transition-opacity"
              style={{ borderColor: `${item.accent}30` }}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-sm font-bold text-white">{item.label}</div>
            </button>
          ))}
        </div>

        {/* サブメニュー */}
        <div className="flex gap-2">
          {SUB_ITEMS.map(item => (
            <button
              key={item.key}
              data-testid={`home-menu-${item.key}`}
              onClick={() => router.push(item.href)}
              className="flex-1 bg-[#16213e]/60 border border-[#1e3a5f]/40 rounded-xl py-3 text-center active:opacity-70"
            >
              <div className="text-lg">{item.icon}</div>
              <div className="text-xs text-[#94a3b8]">{item.label}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-[#475569] text-center pb-2">© 合同会社LAIV</p>
      </div>
    </div>
  );
}
