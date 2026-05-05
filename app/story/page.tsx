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
    <div className="game-layout flex-col bg-[#0a0e27]">
      <AppHeader backHref="/" title="ストーリー" />

      {/* 章タブ */}
      <div className="flex-shrink-0 flex overflow-x-auto border-b border-[#1e3a5f]/50">
        {CHAPTERS.map(c => (
          <button
            key={c.chapter}
            onClick={() => setChapter(c.chapter)}
            className={`flex-shrink-0 px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
              chapter === c.chapter
                ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                : 'text-[#64748b]'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* クエスト一覧 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {quests.map((q, idx) => {
          const progress = getProgress(q.questId);
          const status = progress?.status ?? (q.prerequisites.length === 0 ? 'available' : 'locked');
          const isLocked = status === 'locked';

          return (
            <div
              key={q.questId}
              data-testid={`story-quest-${q.questId}`}
              className={`rounded-xl p-4 border transition-opacity ${
                isLocked
                  ? 'bg-[#0d1b35] border-[#1e3a5f]/30 opacity-50'
                  : status === 'cleared'
                    ? 'bg-[#16213e]/80 border-[#22d3ee]/20'
                    : 'bg-[#16213e]/80 border-[#3b82f6]/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{STATUS_ICON[status] ?? '▶️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{q.title}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{q.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#64748b]">
                    <span>+{q.reward.exp} EXP</span>
                    <span>+{q.reward.runes} 💎</span>
                    {q.reward.cards && q.reward.cards.length > 0 && (
                      <span className="text-[#fbbf24]">カード報酬あり</span>
                    )}
                  </div>
                  {progress?.attemptCount && progress.attemptCount > 0 && (
                    <p className="text-[10px] text-[#475569] mt-1">挑戦回数: {progress.attemptCount}</p>
                  )}
                </div>
                {!isLocked && (
                  <button
                    data-testid="story-quest-start"
                    onClick={() => router.push(`/play?questId=${q.questId}`)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold ${
                      status === 'cleared'
                        ? 'bg-[#1e3a5f] text-[#94a3b8]'
                        : 'bg-[#3b82f6] text-white'
                    }`}
                  >
                    {status === 'cleared' ? '再挑戦' : '挑戦'}
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
