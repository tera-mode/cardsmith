'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import { QUESTS, getChapterQuests } from '@/lib/data/quests';
import type { QuestProgress } from '@/lib/types/meta';

// ─── 領域データ ───────────────────────────────────────────────────────────────

const REGION_DATA = [
  { chapter: 1, emoji: '⚪', name: '黎明都市', kana: 'エルナ',    color: '#d4af37', bg: 'linear-gradient(135deg,#2a2010,#5a4a1a)' },
  { chapter: 2, emoji: '⚫', name: '黄昏墓地', kana: 'ノクス',   color: '#9333ea', bg: 'linear-gradient(135deg,#1a0a2e,#3a1a3a)' },
  { chapter: 3, emoji: '🟢', name: '古樹郷',   kana: 'シルウィア', color: '#22c55e', bg: 'linear-gradient(135deg,#0a2010,#1a4a1a)' },
  { chapter: 4, emoji: '🔴', name: '灼炎砂漠', kana: 'アルダ',   color: '#ef4444', bg: 'linear-gradient(135deg,#2a0a0a,#5a1a0a)' },
  { chapter: 5, emoji: '🔵', name: '凍湖郷',   kana: 'アズリア', color: '#3b82f6', bg: 'linear-gradient(135deg,#0a1a3a,#1a3a6a)' },
  { chapter: 6, emoji: '⚙️', name: '機甲坑道', kana: 'クロムト', color: '#64748b', bg: 'linear-gradient(135deg,#1a1a2a,#2a2a4a)' },
] as const;

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function getProgress(chapter: number, questProgress: QuestProgress[]) {
  const quests = getChapterQuests(chapter);
  const cleared = quests.filter(q => questProgress.find(p => p.questId === q.questId && p.status === 'cleared')).length;
  return { cleared, total: quests.length };
}


// ─── ページ ───────────────────────────────────────────────────────────────────

export default function RegionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { questProgress, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);



  if (loading || authLoading) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="領域探索" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col" data-testid="region-map">
      <AppHeader backHref="/" title="領域探索" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>


        {/* 領域グリッド */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8, textAlign: 'center' }}>
            ⚔ SIX REALMS ⚔
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {REGION_DATA.map(region => {
            const prog = getProgress(region.chapter, questProgress);
            const allCleared = prog.cleared === prog.total && prog.total > 0;

            return (
              <div
                key={region.chapter}
                data-testid={`region-card-${region.chapter}`}
                onClick={() => router.push(`/quest?region=${region.chapter}`)}
                style={{
                  background: region.bg,
                  border: `1px solid ${region.color}50`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: 'pointer',
                  opacity: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                  minHeight: 120,
                }}
              >

                {/* 全クリアバッジ */}
                {allCleared && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: 16,
                  }}>✅</div>
                )}

                <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{region.emoji}</span>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: region.color, letterSpacing: '0.04em' }}>
                  {region.name}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  〈{region.kana}〉
                </p>

                {/* プログレス */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${(prog.cleared / prog.total) * 100}%`,
                      background: `linear-gradient(90deg, ${region.color}80, ${region.color})`,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: region.color, flexShrink: 0 }}>
                    {prog.cleared}/{prog.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
