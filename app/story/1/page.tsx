'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StoryPlayer from '@/components/story/StoryPlayer';
import { CHAPTER1 } from '@/lib/story/chapter1';
import type { StoryContext } from '@/lib/story/types';

function Chapter1Content() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [context, setContext] = useState<StoryContext>({ firstCardName: '私の最初のカード', playerName: '冒険者' });
  const [initialStep, setInitialStep] = useState<number | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    // ローカルストレージから保存済みカード名を読み込む
    const savedName = localStorage.getItem('cardsmith_story_first_card_name');
    if (savedName) setContext(c => ({ ...c, firstCardName: savedName }));

    // バトルから戻った場合の処理
    const battleDone = searchParams.get('battleDone');
    const savedStep = parseInt(localStorage.getItem('cardsmith_story_ch1_step') ?? '0', 10);

    if (battleDone) {
      // バトルイベントの次へ進む
      setInitialStep(isNaN(savedStep) ? 1 : savedStep + 1);
    } else {
      setInitialStep(isNaN(savedStep) ? 0 : savedStep);
    }
    setReady(true);
  }, [searchParams]);

  if (!ready || loading || !user) {
    return (
      <div style={{ background: '#000', inset: 0, position: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4af37', fontFamily: 'serif' }}>Loading...</div>
      </div>
    );
  }

  return (
    <StoryPlayer
      chapter={CHAPTER1}
      chapterKey="ch1"
      initialEventIndex={initialStep}
      context={context}
      onBattle={(questId, eventIndex) => {
        localStorage.setItem('cardsmith_story_ch1_step', String(eventIndex));
        router.push(`/play?questId=${questId}&returnTo=${encodeURIComponent('/story/1?battleDone=' + questId)}`);
      }}
      onCardCreate={(eventIndex) => {
        localStorage.setItem('cardsmith_story_ch1_step', String(eventIndex));
      }}
      onComplete={(_chapterNum, _nextChapter) => {
        localStorage.removeItem('cardsmith_story_ch1_step');
        // 第2章は未実装のためホームへ
        router.push('/');
      }}
    />
  );
}

export default function Chapter1Page() {
  return (
    <Suspense fallback={<div style={{ background: '#000', position: 'fixed', inset: 0 }} />}>
      <Chapter1Content />
    </Suspense>
  );
}
