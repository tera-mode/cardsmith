'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { SessionRecord } from '@/lib/types/game';
import AppHeader from '@/components/ui/AppHeader';

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
    (async () => {
      try {
        const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('finishedAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        setRecords(snap.docs.map(d => d.data() as SessionRecord));
      } catch {}
      finally { setFetching(false); }
    })();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="試合履歴" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.08em' }}>LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="試合履歴" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {records.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 60 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>まだ試合履歴がありません</p>
            <button onClick={() => router.push('/play')} className="btn--primary" style={{ width: 160, minHeight: 44, fontSize: 13 }}>
              ⚔ プレイする
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {records.map(r => (
              <div key={r.sessionId} className="panel--ornate" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                    color: r.winner === 'player' ? 'var(--gold)' : r.winner === 'draw' ? 'var(--text-secondary)' : 'var(--rune-red)',
                  }}>
                    {r.winner === 'player' ? '🏆 勝利' : r.winner === 'draw' ? '⚖ 引き分け' : '💀 敗北'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
                    {new Date(r.finishedAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  <span>{r.turnCount} ターン</span>
                  <span style={{ color: 'var(--rune-blue)' }}>自陣 {r.finalState.playerBaseHp} HP</span>
                  <span style={{ color: 'var(--rune-red)' }}>AI {r.finalState.aiBaseHp} HP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
