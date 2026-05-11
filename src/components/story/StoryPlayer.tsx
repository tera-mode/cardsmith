'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { StoryChapter, StoryEvent, StoryContext, StoryCharId, CharPosition } from '@/lib/story/types';

// ─── 背景マッピング ──────────────────────────────────────────────────────────

const BG_GRADIENTS: Record<string, string> = {
  divine:       'radial-gradient(ellipse at 50% 30%, #2a1040 0%, #08001a 60%, #000000 100%)',
  field_day:    'linear-gradient(180deg, #87ceeb 0%, #a8d8a8 55%, #228b22 100%)',
  field_dusk:   'linear-gradient(180deg, #ff6b35 0%, #c44e1a 35%, #8b5e3c 60%, #2d5016 100%)',
  road_forest:  'linear-gradient(180deg, #4a7a3a 0%, #2d5220 50%, #1a3010 100%)',
  elna_city:    'linear-gradient(180deg, #87ceeb 0%, #d4c9a8 50%, #c8a870 100%)',
  elna_alley:   'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  elna_square:  'linear-gradient(180deg, #87ceeb 0%, #d4c9a8 40%, #c09060 100%)',
  nike_home:    'linear-gradient(180deg, #1a1025 0%, #120d1a 100%)',
  forge_morning:'linear-gradient(180deg, #e8a050 0%, #c07038 30%, #4a2810 70%, #1e1008 100%)',
  forge_evening:'linear-gradient(180deg, #2a1e14 0%, #1a0e08 100%)',
  tavern_night: 'linear-gradient(180deg, #1a0a00 0%, #0d0500 100%)',
};

// 実画像がある背景ID → ファイルパスのマッピング（生成済みのみ追加）
const BG_IMAGES: Record<string, string> = {
  divine:        '/images/backgrounds/story_divine.jpg',
  field_day:     '/images/backgrounds/story_field_day.jpg',
  field_dusk:    '/images/backgrounds/story_field_dusk.jpg',
  road_forest:   '/images/backgrounds/story_road_forest.jpg',
  elna_city:     '/images/backgrounds/story_elna_city.jpg',
  elna_alley:    '/images/backgrounds/story_elna_alley.jpg',
  elna_square:   '/images/backgrounds/story_elna_square.jpg',
  forge_morning: '/images/backgrounds/story_forge_morning.jpg',
};

function getBg(id: string): string {
  return BG_GRADIENTS[id] ?? '#000';
}

function getBgImage(id: string): string | null {
  return BG_IMAGES[id] ?? null;
}

// ─── キャラクター画像マッピング ────────────────────────────────────────────────

function getCharImage(_charId: StoryCharId, _expr: string): string {
  const map: Record<StoryCharId, string> = {
    god:        '/images/story_chars/story_god_smile.png',
    player:     '/images/story_chars/story_player_calm.png',
    brigitta:   '/images/story_chars/story_brigitta_calm.png',
    nike:       '/images/story_chars/story_nike_calm.png',
    nike_mother:'/images/story_chars/story_nike_mother_weak.png',
    garon:      '/images/story_chars/story_garon_angry.png',
    baramu:     '/images/story_chars/story_baramu_smile.png',
  };
  return map[_charId];
}

// ─── 型定義 ────────────────────────────────────────────────────────────────────

type CharSlot = { id: StoryCharId; expr: string } | undefined;

interface StoryState {
  eventIndex: number;
  chars: { left: CharSlot; center: CharSlot; right: CharSlot };
  background: string;
  dialogue?: { type: 'say' | 'think' | 'narrate'; speaker?: string; text: string };
  systemText?: string;
  awaiting: 'dialogue' | 'system' | 'battle' | 'card_create' | 'end' | null;
  battleQuestId?: string;
  endData?: { chapterNum: number; nextChapter?: number };
  transition?: 'whiteout' | 'blackout';
}

interface Props {
  chapter: StoryChapter;
  chapterKey: string;
  initialEventIndex?: number;
  context: StoryContext;
  onBattle: (questId: string, eventIndex: number) => void;
  onCardCreate: (eventIndex: number) => void;
  onComplete: (chapterNum: number, nextChapter?: number) => void;
}

// ─── processEvents: 自動進行イベントを処理し、待機状態まで進める ──────────────

function processEvents(
  events: StoryEvent[],
  startIdx: number,
  prevState: Omit<StoryState, 'eventIndex' | 'awaiting' | 'dialogue' | 'systemText' | 'battleQuestId' | 'endData' | 'transition'>
): StoryState {
  let chars = { ...prevState.chars };
  let background = prevState.background;
  let i = startIdx;
  let pendingTransition: 'whiteout' | 'blackout' | undefined;

  while (i < events.length) {
    const ev = events[i];

    if (ev.type === 'bg') {
      background = ev.id;
      i++;
      continue;
    }
    if (ev.type === 'enter') {
      chars = { ...chars, [ev.pos]: { id: ev.char, expr: ev.expr ?? 'default' } };
      i++;
      continue;
    }
    if (ev.type === 'exit') {
      const newChars = { ...chars };
      for (const pos of ['left', 'center', 'right'] as CharPosition[]) {
        if (newChars[pos]?.id === ev.char) {
          newChars[pos] = undefined;
        }
      }
      chars = newChars;
      i++;
      continue;
    }
    if (ev.type === 'expr') {
      const newChars = { ...chars };
      for (const pos of ['left', 'center', 'right'] as CharPosition[]) {
        if (newChars[pos]?.id === ev.char) {
          newChars[pos] = { id: ev.char, expr: ev.expr };
        }
      }
      chars = newChars;
      i++;
      continue;
    }
    if (ev.type === 'transition') {
      // 視覚エフェクトのみ記録して自動進行（ユーザータップ不要）
      pendingTransition = ev.effect;
      i++;
      continue;
    }

    // Wait events
    if (ev.type === 'say') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'dialogue',
        dialogue: { type: 'say', speaker: ev.speaker, text: ev.text },
        transition: pendingTransition,
      };
    }
    if (ev.type === 'think') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'dialogue',
        dialogue: { type: 'think', text: ev.text },
        transition: pendingTransition,
      };
    }
    if (ev.type === 'narrate') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'dialogue',
        dialogue: { type: 'narrate', text: ev.text },
        transition: pendingTransition,
      };
    }
    if (ev.type === 'system') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'system',
        systemText: ev.text,
        transition: pendingTransition,
      };
    }
    if (ev.type === 'battle') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'battle',
        battleQuestId: ev.questId,
        transition: pendingTransition,
      };
    }
    if (ev.type === 'card_create') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'card_create',
        transition: pendingTransition,
      };
    }
    if (ev.type === 'end') {
      return {
        eventIndex: i, chars, background,
        awaiting: 'end',
        endData: { chapterNum: ev.chapterNum, nextChapter: ev.nextChapter },
        transition: pendingTransition,
      };
    }

    i++;
  }

  // All events consumed
  return {
    eventIndex: i, chars, background,
    awaiting: null,
    transition: pendingTransition,
  };
}

// ─── replayToIndex: インデックスまでの状態を再構築 ───────────────────────────

function replayToIndex(
  events: StoryEvent[],
  targetIdx: number
): { chars: { left: CharSlot; center: CharSlot; right: CharSlot }; background: string } {
  let chars: { left: CharSlot; center: CharSlot; right: CharSlot } = { left: undefined, center: undefined, right: undefined };
  let background = '';

  for (let i = 0; i < targetIdx && i < events.length; i++) {
    const ev = events[i];
    if (ev.type === 'bg') {
      background = ev.id;
    } else if (ev.type === 'enter') {
      chars = { ...chars, [ev.pos]: { id: ev.char, expr: ev.expr ?? 'default' } };
    } else if (ev.type === 'exit') {
      const newChars = { ...chars };
      for (const pos of ['left', 'center', 'right'] as CharPosition[]) {
        if (newChars[pos]?.id === ev.char) {
          newChars[pos] = undefined;
        }
      }
      chars = newChars;
    } else if (ev.type === 'expr') {
      const newChars = { ...chars };
      for (const pos of ['left', 'center', 'right'] as CharPosition[]) {
        if (newChars[pos]?.id === ev.char) {
          newChars[pos] = { id: ev.char, expr: ev.expr };
        }
      }
      chars = newChars;
    }
  }

  return { chars, background };
}

// ─── テキスト内の{firstCardName}を置換 ──────────────────────────────────────

function interpolate(text: string, ctx: StoryContext): string {
  return text
    .replace(/\{firstCardName\}/g, ctx.firstCardName)
    .replace(/\{playerName\}/g, ctx.playerName);
}

// ─── キャラクタースプライト ───────────────────────────────────────────────────

interface SpriteProps {
  slot: CharSlot;
  position: CharPosition;
}

function CharSprite({ slot, position }: SpriteProps) {
  const [visible, setVisible] = useState(false);
  const prevSlotRef = useRef<CharSlot>(undefined);

  useEffect(() => {
    if (slot && !prevSlotRef.current) {
      // fade in
      const t = setTimeout(() => setVisible(true), 20);
      prevSlotRef.current = slot;
      return () => clearTimeout(t);
    } else if (!slot && prevSlotRef.current) {
      setVisible(false);
      prevSlotRef.current = undefined;
    } else if (slot) {
      prevSlotRef.current = slot;
      setVisible(true);
    }
  }, [slot]);

  if (!slot) return null;

  const posStyles: Record<CharPosition, React.CSSProperties> = {
    left:   { left: '-2%' },
    center: { left: '50%', transform: 'translateX(-50%)' },
    right:  { right: '-2%' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 140,
        ...posStyles[position],
        // コンテナに明示サイズを与えて objectFit: contain でアスペクト比を保持
        width: position === 'center' ? 'min(92vw, 480px)' : 'min(64vw, 320px)',
        height: 'calc(100% - 155px)',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getCharImage(slot.id, slot.expr)}
        alt={slot.id}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'bottom center',
          display: 'block',
        }}
      />
    </div>
  );
}

// ─── カード創造UI ────────────────────────────────────────────────────────────

interface CardCreateProps {
  onSubmit: (name: string) => void;
}

function CardCreateOverlay({ onSubmit }: CardCreateProps) {
  const [name, setName] = useState('');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(42,28,16,0.98) 0%, rgba(20,12,6,0.98) 100%)',
          border: '2px solid var(--gold-deep)',
          borderRadius: 12,
          padding: '28px 24px',
          maxWidth: 340,
          width: '100%',
          boxShadow: '0 0 32px rgba(212,175,55,0.25)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--gold)',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          カードを創造しよう！
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          あなたの最初のカードに名前をつけましょう
        </p>
        <input
          type="text"
          maxLength={20}
          placeholder="カードの名前を入力"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 6,
            border: '1px solid var(--border-rune-bright)',
            background: 'rgba(0,0,0,0.5)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            outline: 'none',
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
          autoFocus
        />
        <button
          onClick={() => { if (name.trim()) onSubmit(name.trim()); }}
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 6,
            background: name.trim()
              ? 'linear-gradient(180deg, #d4af37, #a87a36)'
              : 'rgba(80,70,50,0.5)',
            border: 'none',
            color: name.trim() ? '#1a1208' : 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: name.trim() ? 'pointer' : 'default',
          }}
        >
          完成！
        </button>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export default function StoryPlayer({
  chapter,
  chapterKey,
  initialEventIndex,
  context,
  onBattle,
  onCardCreate,
  onComplete,
}: Props) {
  const lsKey = `cardsmith_story_${chapterKey}_step`;

  const [storyState, setStoryState] = useState<StoryState>({
    eventIndex: 0,
    chars: { left: undefined, center: undefined, right: undefined },
    background: '',
    awaiting: null,
  });

  const [showTransition, setShowTransition] = useState<'whiteout' | 'blackout' | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [internalCtx, setInternalCtx] = useState<StoryContext>(context);

  // ─── 初期化 ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialized) return;

    let startIdx: number;
    if (initialEventIndex !== undefined) {
      startIdx = initialEventIndex;
    } else {
      const saved = parseInt(localStorage.getItem(lsKey) ?? '0', 10);
      startIdx = isNaN(saved) ? 0 : saved;
    }

    const { chars, background } = replayToIndex(chapter.events, startIdx);
    const newState = processEvents(chapter.events, startIdx, { chars, background });
    setStoryState(newState);
    setInitialized(true);
  }, [chapter, lsKey, initialEventIndex, initialized]);

  // ─── 次へ進む ───────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setStoryState(prev => {
      if (prev.awaiting !== 'dialogue') return prev;

      const nextIdx = prev.eventIndex + 1;
      localStorage.setItem(lsKey, String(nextIdx));

      const newState = processEvents(chapter.events, nextIdx, {
        chars: prev.chars,
        background: prev.background,
      });

      // Handle transition visual
      if (newState.transition) {
        setShowTransition(newState.transition);
        setTimeout(() => setShowTransition(null), 800);
      }

      return newState;
    });
  }, [chapter, lsKey]);

  // ─── システムメッセージ dismiss ──────────────────────────────────────────────

  const dismissSystem = useCallback(() => {
    setStoryState(prev => {
      if (prev.awaiting !== 'system') return prev;
      const nextIdx = prev.eventIndex + 1;
      localStorage.setItem(lsKey, String(nextIdx));
      return processEvents(chapter.events, nextIdx, {
        chars: prev.chars,
        background: prev.background,
      });
    });
  }, [chapter, lsKey]);

  // ─── バトル開始 ─────────────────────────────────────────────────────────────

  const handleBattle = useCallback(() => {
    if (storyState.awaiting !== 'battle' || !storyState.battleQuestId) return;
    localStorage.setItem(lsKey, String(storyState.eventIndex));
    onBattle(storyState.battleQuestId, storyState.eventIndex);
  }, [storyState, lsKey, onBattle]);

  // ─── カード創造 ─────────────────────────────────────────────────────────────

  const handleCardCreate = useCallback((cardName: string) => {
    localStorage.setItem('cardsmith_story_first_card_name', cardName);
    setInternalCtx(prev => ({ ...prev, firstCardName: cardName }));
    onCardCreate(storyState.eventIndex);
    setStoryState(prev => {
      const nextIdx = prev.eventIndex + 1;
      localStorage.setItem(lsKey, String(nextIdx));
      return processEvents(chapter.events, nextIdx, {
        chars: prev.chars,
        background: prev.background,
      });
    });
  }, [storyState, chapter, lsKey, onCardCreate]);

  // ─── チャプター完了 ─────────────────────────────────────────────────────────

  const handleComplete = useCallback(() => {
    if (!storyState.endData) return;
    onComplete(storyState.endData.chapterNum, storyState.endData.nextChapter);
  }, [storyState, onComplete]);

  // ─── render ─────────────────────────────────────────────────────────────────

  if (!initialized) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const bg = storyState.background ? getBg(storyState.background) : '#000';
  const bgImage = storyState.background ? getBgImage(storyState.background) : null;
  const dlg = storyState.dialogue;
  const ctx = internalCtx;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* 背景レイヤー（画像 or グラデーション） */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        {bgImage ? (
          <Image
            src={bgImage}
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: bg, transition: 'background 0.8s ease' }} />
        )}
      </div>

      {/* 全画面タップ層（ダイアログ進行用） */}
      {storyState.awaiting === 'dialogue' && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer' }}
          onClick={advance}
        />
      )}

      {/* キャラクタースプライト（overflow: hidden でサイドへの溢れをクリップ） */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
        <CharSprite slot={storyState.chars.left} position="left" />
        <CharSprite slot={storyState.chars.center} position="center" />
        <CharSprite slot={storyState.chars.right} position="right" />
      </div>

      {/* トランジション効果 */}
      {showTransition && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: showTransition === 'whiteout' ? '#fff' : '#000',
            animation: 'storyFade 0.8s ease forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ダイアログボックス */}
      {storyState.awaiting === 'dialogue' && dlg && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {dlg.type === 'narrate' ? (
            // ナレーション: 上部に表示
            <div
              style={{
                position: 'absolute',
                top: 'auto',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(8,4,2,0.75)',
                backdropFilter: 'blur(4px)',
                borderTop: '1px solid rgba(196,154,90,0.3)',
                padding: '14px 18px 18px',
                minHeight: 80,
                textAlign: 'center',
              }}
            >
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.8,
                fontStyle: 'italic',
              }}>
                {interpolate(dlg.text, ctx)}
              </p>
              <div style={{ position: 'absolute', bottom: 8, right: 14, fontSize: 10, color: 'var(--gold)', opacity: 0.6 }}>
                次へ ▶
              </div>
            </div>
          ) : (
            // セリフ / 心内語
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(16,10,6,0.93) 0%, rgba(8,5,2,0.97) 100%)',
                backdropFilter: 'blur(6px)',
                borderTop: '1px solid var(--border-rune-bright)',
                padding: '12px 16px 16px',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                position: 'relative',
              }}
            >
              {dlg.type === 'say' && dlg.speaker && (
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '0.08em',
                  marginBottom: 2,
                }}>
                  {dlg.speaker}
                </p>
              )}
              <p style={{
                fontSize: dlg.type === 'think' ? 13 : 15,
                color: dlg.type === 'think' ? 'var(--text-muted)' : 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.75,
                fontStyle: dlg.type === 'think' ? 'italic' : 'normal',
                flex: 1,
              }}>
                {dlg.type === 'think'
                  ? `（${interpolate(dlg.text, ctx)}）`
                  : interpolate(dlg.text, ctx)
                }
              </p>
              <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: 'var(--gold)', opacity: 0.7 }}>
                次へ ▶
              </div>
            </div>
          )}
        </div>
      )}

      {/* システムメッセージ */}
      {storyState.awaiting === 'system' && storyState.systemText && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={dismissSystem}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(42,28,16,0.98) 0%, rgba(20,12,6,0.98) 100%)',
              border: '2px solid var(--gold-deep)',
              borderRadius: 10,
              padding: '20px 24px',
              maxWidth: 340,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 24px rgba(212,175,55,0.3)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', marginBottom: 10 }}>
              ⚜ アイテム入手 ⚜
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
              {storyState.systemText}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>タップして続ける</p>
          </div>
        </div>
      )}

      {/* バトル待機 */}
      {storyState.awaiting === 'battle' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: '16px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
          }}
        >
          <button
            onClick={handleBattle}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 8,
              background: 'linear-gradient(180deg, #c0392b, #922b21)',
              border: '2px solid #e74c3c',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(231,76,60,0.5)',
            }}
          >
            ⚔ バトル開始！
          </button>
        </div>
      )}

      {/* カード創造 */}
      {storyState.awaiting === 'card_create' && (
        <CardCreateOverlay onSubmit={handleCardCreate} />
      )}

      {/* チャプター終了 */}
      {storyState.awaiting === 'end' && storyState.endData && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            padding: '0 24px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em', marginBottom: 12 }}>
              ⚜ CHAPTER COMPLETE ⚜
            </p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
              textShadow: '0 0 20px rgba(232,192,116,0.4)',
            }}>
              第{storyState.endData.chapterNum}章 クリア！
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
            {storyState.endData.nextChapter !== undefined && (
              <button
                onClick={handleComplete}
                style={{
                  padding: '15px 0',
                  borderRadius: 8,
                  background: 'linear-gradient(180deg, #d4af37, #a87a36)',
                  border: 'none',
                  color: '#1a1208',
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                次の章へ ▶
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '13px 0',
                borderRadius: 8,
                background: 'rgba(30,20,10,0.8)',
                border: '1px solid var(--border-rune)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ホームへ戻る
            </button>
          </div>
        </div>
      )}

      {/* トランジション CSS */}
      <style>{`
        @keyframes storyFade {
          0%   { opacity: 1; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
