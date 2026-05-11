'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import { getChapterQuests } from '@/lib/data/quests';
import type { QuestDefinition } from '@/lib/types/meta';
import type { QuestProgress } from '@/lib/types/meta';

// ─── 領域データ ───────────────────────────────────────────────────────────────

const REGION = {
  1: { emoji: '⚪', name: '黎明都市', kana: 'エルナ',    color: '#d4a93a', accent: 'rgba(212,169,58,0.15)',  border: 'rgba(212,169,58,0.35)' },
  2: { emoji: '⚫', name: '黄昏墓地', kana: 'ノクス',   color: '#a855f7', accent: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)' },
  3: { emoji: '🟢', name: '古樹郷',   kana: 'シルウィア', color: '#22c55e', accent: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)' },
  4: { emoji: '🔴', name: '灼炎砂漠', kana: 'アルダ',   color: '#ef4444', accent: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)' },
  5: { emoji: '🔵', name: '凍湖郷',   kana: 'アズリア', color: '#3b82f6', accent: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)' },
  6: { emoji: '⚙️', name: '機甲坑道', kana: 'クロムト', color: '#94a3b8', accent: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.35)' },
} as const;

// ─── クエストカード ────────────────────────────────────────────────────────────

function QuestCard({
  quest,
  progress,
  regionColor,
  onStart,
}: {
  quest: QuestDefinition;
  progress: QuestProgress | undefined;
  regionColor: string;
  onStart: () => void;
}) {
  const status = progress?.status ?? (quest.prerequisites.length === 0 ? 'available' : 'locked');
  const isLocked   = status === 'locked';
  const isCleared  = status === 'cleared';
  const isAvailable = status === 'available';
  const isBoss = quest.order === 5;
  const reward = isCleared ? quest.rewardReplay : quest.reward;

  return (
    <div
      style={{
        background: isLocked
          ? 'rgba(14,10,6,0.6)'
          : isBoss
            ? `linear-gradient(135deg, rgba(20,14,8,0.97) 0%, rgba(30,20,8,0.97) 100%)`
            : 'rgba(20,14,8,0.92)',
        border: `1px solid ${
          isCleared ? 'rgba(34,197,94,0.5)'
          : isAvailable ? (isBoss ? regionColor : 'rgba(196,154,90,0.45)')
          : 'rgba(255,255,255,0.06)'
        }`,
        borderRadius: 10,
        padding: '14px 14px 12px',
        opacity: isLocked ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ボスクエストの光彩 */}
      {isBoss && isAvailable && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9,
          boxShadow: `inset 0 0 20px ${regionColor}25`,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* 番号 / アイコン */}
        <div style={{
          flexShrink: 0, width: 32, height: 32,
          borderRadius: '50%',
          background: isCleared
            ? 'rgba(34,197,94,0.2)'
            : isLocked
              ? 'rgba(255,255,255,0.05)'
              : isBoss ? `${regionColor}25` : 'rgba(196,154,90,0.12)',
          border: `1px solid ${
            isCleared ? 'rgba(34,197,94,0.5)'
            : isLocked ? 'rgba(255,255,255,0.1)'
            : isBoss ? regionColor : 'rgba(196,154,90,0.3)'
          }`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isLocked ? 14 : 12,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: isCleared ? '#22c55e' : isLocked ? 'rgba(255,255,255,0.3)' : isBoss ? regionColor : 'var(--gold)',
        }}>
          {isLocked ? '🔒' : isCleared ? '✓' : quest.order}
        </div>

        {/* テキスト */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            {isBoss && <span style={{ fontSize: 10, color: regionColor, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>BOSS</span>}
            <p style={{
              fontSize: 13, fontWeight: 700,
              color: isLocked ? 'rgba(255,255,255,0.35)' : 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {quest.title}
            </p>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--text-secondary)',
            lineHeight: 1.45, marginBottom: 6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {quest.description}
          </p>

          {/* 報酬 */}
          {!isLocked && reward && (
            <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              <span>+{reward.exp} EXP</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 8 }}>💎</span>
                +{reward.runes}
              </span>
              {quest.reward.cards && quest.reward.cards.length > 0 && !isCleared && (
                <span style={{ color: regionColor }}>◆ 新カード</span>
              )}
            </div>
          )}
        </div>

        {/* ボタン */}
        {!isLocked && (
          <button
            onClick={onStart}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: 'pointer',
              background: isCleared
                ? 'rgba(255,255,255,0.08)'
                : isBoss
                  ? `linear-gradient(180deg, ${regionColor}, ${regionColor}99)`
                  : 'linear-gradient(180deg, #d4af37, #a87a36)',
              color: isCleared ? 'var(--text-secondary)' : '#0a0600',
              boxShadow: isAvailable && !isCleared ? `0 0 10px ${isBoss ? regionColor : '#d4af37'}40` : 'none',
            }}
          >
            {isCleared ? '再挑戦' : '挑戦'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── メインコンテンツ ──────────────────────────────────────────────────────────

function QuestContent() {
  const { user, loading: authLoading } = useAuth();
  const { questProgress, loading } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();

  const chapter = Math.max(1, Math.min(6, parseInt(searchParams.get('region') ?? '1') || 1)) as 1|2|3|4|5|6;
  const region = REGION[chapter];

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const quests = getChapterQuests(chapter).filter(q => !q.questId.startsWith('story_'));
  const getProgress = (questId: string) => questProgress.find(p => p.questId === questId);
  const cleared = quests.filter(q => getProgress(q.questId)?.status === 'cleared').length;

  if (loading || authLoading) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/regions" title="クエスト" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader
        backHref="/regions"
        title={`${region.emoji} ${region.name}〈${region.kana}〉`}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>

        {/* 進捗サマリー */}
        <div style={{
          background: `linear-gradient(135deg, ${region.accent}, rgba(14,10,6,0.8))`,
          border: `1px solid ${region.border}`,
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ fontSize: 36 }}>{region.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: region.color, letterSpacing: '0.04em' }}>
              {region.name}〈{region.kana}〉
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${(cleared / quests.length) * 100}%`,
                  background: cleared === quests.length ? '#22c55e' : region.color,
                  transition: 'width 0.5s',
                }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: cleared === quests.length ? '#22c55e' : region.color, flexShrink: 0, fontWeight: 700 }}>
                {cleared} / {quests.length}
              </span>
            </div>
          </div>
        </div>

        {/* クエストリスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quests.map(quest => (
            <QuestCard
              key={quest.questId}
              quest={quest}
              progress={getProgress(quest.questId)}
              regionColor={region.color}
              onStart={() => router.push(`/play?questId=${quest.questId}`)}
            />
          ))}
        </div>

        {cleared === quests.length && quests.length > 0 && (
          <div style={{
            marginTop: 20, padding: '14px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#22c55e', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
              ⚜ この領域を制覇しました！ ⚜
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense fallback={
      <div className="game-layout stone-bg flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuestContent />
    </Suspense>
  );
}
