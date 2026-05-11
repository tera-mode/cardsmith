'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import StoryPlayer from '@/components/story/StoryPlayer';
import { CHAPTER0 } from '@/lib/story/chapter0';
import type { StoryContext } from '@/lib/story/types';

function Chapter0Content() {
  const { user, loading } = useAuth();
  const { ownedCards, updateCards } = useProfile();
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
    const savedStep = parseInt(localStorage.getItem('cardsmith_story_ch0_step') ?? '0', 10);

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
      chapter={CHAPTER0}
      chapterKey="ch0"
      initialEventIndex={initialStep}
      context={context}
      onBattle={(questId, eventIndex) => {
        localStorage.setItem('cardsmith_story_ch0_step', String(eventIndex));
        router.push(`/play?questId=${questId}&returnTo=${encodeURIComponent('/story/0?battleDone=' + questId)}`);
      }}
      onCardCreate={(eventIndex, _cardName) => {
        localStorage.setItem('cardsmith_story_ch0_step', String(eventIndex));
        // player_first カードを所持カードに追加（5枚）
        const now = Date.now();
        const existing = ownedCards.filter(c => c.cardId !== 'player_first');
        updateCards([...existing, { cardId: 'player_first', count: 5, isCrafted: true, acquiredAt: now }]);
      }}
      onComplete={(chapterNum, nextChapter) => {
        localStorage.removeItem('cardsmith_story_ch0_step');
        if (nextChapter === 1) {
          router.push('/story/1');
        } else {
          router.push('/');
        }
      }}
    />
  );
}

export default function Chapter0Page() {
  return (
    <Suspense fallback={<div style={{ background: '#000', position: 'fixed', inset: 0 }} />}>
      <Chapter0Content />
    </Suspense>
  );
}
