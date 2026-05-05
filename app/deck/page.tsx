'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/ui/AppHeader';

export default function DeckPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push('/'); }, [user, loading, router]);
  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader backHref="/" title="デッキ編集" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#94a3b8] text-sm">準備中...</p>
      </div>
    </div>
  );
}
