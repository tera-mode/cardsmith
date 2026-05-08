'use client';

import { useState } from 'react';
import type { DialogueScene } from '@/lib/types/meta';

interface Props {
  scenes: DialogueScene[];
  onDone: () => void;
  label?: string;
}

export default function QuestDialogue({ scenes, onDone, label }: Props) {
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  const isLast = index >= scenes.length - 1;

  const advance = () => {
    if (isLast) onDone();
    else setIndex(i => i + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{
        background: 'rgba(0,0,0,0.80)',
        backdropFilter: 'blur(2px)',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom, 24px))',
      }}
      onClick={advance}
    >
      {/* ラベル（プロローグ / エピローグ） */}
      {label && (
        <div style={{
          position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          color: 'var(--text-muted)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          — {label} —
        </div>
      )}

      {/* ダイアログパネル */}
      <div
        style={{
          width: 'min(480px, 96vw)',
          background: 'linear-gradient(180deg, rgba(30,22,14,0.98) 0%, rgba(14,10,6,0.99) 100%)',
          border: '1px solid var(--border-rune)',
          borderRadius: '16px 16px 12px 12px',
          padding: '16px 20px 18px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(232,192,116,0.18)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={e => { e.stopPropagation(); advance(); }}
      >
        {/* スピーカー名 */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '0.1em',
          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ opacity: 0.6 }}>▌</span>
          {scene.speaker}
        </div>

        {/* セリフ */}
        <p style={{
          fontSize: 14, lineHeight: 1.8,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          minHeight: 52,
        }}>
          {scene.text}
        </p>

        {/* フッター */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 12,
        }}>
          {/* ドットインジケーター */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {scenes.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? 18 : 5, height: 4, borderRadius: 2,
                  background: i === index ? 'var(--gold)' : 'rgba(226,213,176,0.22)',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            color: 'var(--gold-glow)', letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isLast ? '⚔ 開始' : '次へ ▶'}
          </span>
        </div>
      </div>
    </div>
  );
}
