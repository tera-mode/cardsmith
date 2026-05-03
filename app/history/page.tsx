'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { SessionRecord } from '@/lib/types/game';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'sessions'),
          orderBy('finishedAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setRecords(snap.docs.map((d) => d.data() as SessionRecord));
      } catch {
        // Firestoreが未設定でもクラッシュしない
      } finally {
        setFetching(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="game-layout items-center justify-center bg-[#1a1a2e]">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="game-layout bg-[#1a1a2e]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e3a5f]">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <h1 className="text-base font-bold text-white">試合履歴</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <p className="text-sm">まだ試合履歴がありません</p>
            <button
              onClick={() => router.push('/play')}
              className="tap-target px-6 bg-[#3b82f6] text-white text-sm font-bold rounded-xl"
            >
              プレイする
            </button>
          </div>
        ) : (
          records.map((r) => (
            <div key={r.sessionId} className="bg-[#16213e] rounded-xl p-3 border border-[#1e3a5f]">
              <div className="flex items-center justify-between mb-1">
                <span className={[
                  'text-sm font-bold',
                  r.winner === 'player' ? 'text-[#f59e0b]' : r.winner === 'draw' ? 'text-gray-300' : 'text-[#ef4444]',
                ].join(' ')}>
                  {r.winner === 'player' ? '勝利' : r.winner === 'draw' ? '引き分け' : '敗北'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(r.finishedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{r.turnCount} ターン</span>
                <span>自陣 {r.finalState.playerBaseHp} HP</span>
                <span>AI {r.finalState.aiBaseHp} HP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
