'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import { CHAPTERS, getChapterQuests } from '@/lib/data/quests';
import { QuestProgress } from '@/lib/types/meta';

const STATUS_ICON: Record<string, string> = {
  locked: '🔒',
  available: '▶️',
  cleared: '✅',
};

export default function StoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { questProgress, loading } = useProfile();
  const router = useRouter();
  const [chapter, setChapter] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const getProgress = (questId: string): QuestProgress | undefined =>
    questProgress.find(p => p.questId === questId);

  const quests = getChapterQuests(chapter);

  if (loading) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="ストーリー" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="ストーリー" />

      {/* 章タブ */}
      <div style={{ flexShrink: 0, display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-rune)', background: 'rgba(14,10,6,0.85)' }}>
        {CHAPTERS.map(c => (
          <button
            key={c.chapter}
            onClick={() => setChapter(c.chapter)}
            style={{
              flexShrink: 0, padding: '8px 14px',
              fontFamily: 'var(--font-display)', fontSize: 11,
              fontWeight: 600, letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              color: chapter === c.chapter ? 'var(--gold)' : 'var(--text-muted)',
              background: 'none', border: 'none',
              borderBottom: chapter === c.chapter ? '2px solid var(--gold)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* クエスト一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {quests.map((q) => {
          const progress = getProgress(q.questId);
          const status = progress?.status ?? (q.prerequisites.length === 0 ? 'available' : 'locked');
          const isLocked = status === 'locked';
          const isCleared = status === 'cleared';

          return (
            <div
              key={q.questId}
              data-testid={`story-quest-${q.questId}`}
              className="panel--ornate"
              style={{
                padding: '12px 14px',
                opacity: isLocked ? 0.45 : 1,
                borderColor: isCleared ? 'rgba(107,217,152,0.4)' : isLocked ? 'var(--border-rune)' : 'var(--gold-deep)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                  {STATUS_ICON[status] ?? '▶️'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {q.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{q.description}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    <span>+{q.reward.exp} EXP</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <div className="rune-gem" style={{ width: 9, height: 9 }} />
                      +{q.reward.runes}
                    </span>
                    {q.reward.cards && q.reward.cards.length > 0 && (
                      <span style={{ color: 'var(--gold)' }}>◆ カード</span>
                    )}
                  </div>
                </div>
                {!isLocked && (
                  <button
                    data-testid="story-quest-start"
                    onClick={() => router.push(`/play?questId=${q.questId}`)}
                    className={isCleared ? 'btn--ghost' : 'btn--primary'}
                    style={{ flexShrink: 0, padding: '6px 12px', width: 'auto', minHeight: 34, fontSize: 11 }}
                  >
                    {isCleared ? '再挑戦' : '挑戦'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
