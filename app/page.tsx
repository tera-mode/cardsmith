'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading, signInAsGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/play');
    }
  }, [user, loading, router]);

  const handleGuest = async () => {
    await signInAsGuest();
    router.push('/play');
  };

  return (
    <main className="game-layout items-center justify-center bg-[#1a1a2e]">
      <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">⚒️ 最強カード鍛冶師</h1>
          <p className="text-[#94a3b8] text-sm">THE APEX CARDSMITH</p>
        </div>

        <div className="bg-[#16213e] rounded-xl p-4 w-full text-sm text-[#94a3b8] space-y-1">
          <p>• 6×6盤面でのターン制カード対戦</p>
          <p>• 13種類のユニットカードで戦略を組み立てろ</p>
          <p>• ランダムAIと1対1の対決</p>
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

        <p className="text-xs text-[#475569] text-center">
          © 合同会社LAIV
        </p>
      </div>
    </main>
  );
}
