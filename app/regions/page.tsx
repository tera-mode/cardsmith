'use client';

import { useEffect, useMemo } from 'react';
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

function isChapterUnlocked(chapter: number, questProgress: QuestProgress[]) {
  if (chapter === 0) return true;
  // ch 1-6: requires q0_3 cleared
  return questProgress.some(p => p.questId === 'q0_3' && p.status === 'cleared');
}

// ─── ページ ───────────────────────────────────────────────────────────────────

export default function RegionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { questProgress, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const tutorialProgress = useMemo(() => {
    const quests = getChapterQuests(0);
    const cleared = quests.filter(q => questProgress.find(p => p.questId === q.questId && p.status === 'cleared')).length;
    return { cleared, total: quests.length };
  }, [questProgress]);

  const q03Cleared = questProgress.some(p => p.questId === 'q0_3' && p.status === 'cleared');

  if (loading || authLoading) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="クエスト" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col" data-testid="region-map">
      <AppHeader backHref="/" title="クエスト" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>

        {/* チュートリアル */}
        <div
          className="panel--ornate"
          style={{ padding: '12px 14px', marginBottom: 14, cursor: 'pointer', opacity: 1 }}
          onClick={() => router.push('/story')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📖</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                CHAPTER 0 チュートリアル
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                鍛炉の灯から旅立ちまで — 3話
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: tutorialProgress.cleared === tutorialProgress.total ? '#22c55e' : 'var(--gold)',
              }}>
                {tutorialProgress.cleared}/{tutorialProgress.total}
              </span>
              {!q03Cleared && (
                <p style={{ fontSize: 9, color: 'var(--rune-red)', marginTop: 1 }}>未完了</p>
              )}
            </div>
          </div>

          {/* プログレスバー */}
          <div style={{ marginTop: 8, height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${(tutorialProgress.cleared / tutorialProgress.total) * 100}%`,
              background: 'linear-gradient(90deg, #d4af37, #f8d878)',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>

        {/* 領域グリッド */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8, textAlign: 'center' }}>
            ⚔ SIX REALMS ⚔
          </div>
          {!q03Cleared && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' }}>
              チュートリアルをクリアするとクエストが解放される
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {REGION_DATA.map(region => {
            const prog = getProgress(region.chapter, questProgress);
            const unlocked = q03Cleared;
            const allCleared = prog.cleared === prog.total && prog.total > 0;

            return (
              <div
                key={region.chapter}
                data-testid={`region-card-${region.chapter}`}
                onClick={() => unlocked && router.push(`/story?chapter=${region.chapter}`)}
                style={{
                  background: region.bg,
                  border: `1px solid ${region.color}${unlocked ? '50' : '20'}`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: unlocked ? 'pointer' : 'default',
                  opacity: unlocked ? 1 : 0.45,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                  minHeight: 120,
                }}
              >
                {/* ロック表示 */}
                {!unlocked && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    fontSize: 28, borderRadius: 11,
                  }}>🔒</div>
                )}

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
