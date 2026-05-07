'use client';

import { Archetype } from '@/lib/game/decks';
import { ARCHETYPES } from '@/lib/game/decks';
import { getStarterCardsByAttribute } from '@/lib/game/cards';

const ATTR_BG: Record<Archetype, string> = {
  sei:  'linear-gradient(135deg, #2a2010, #5a4a1a)',
  mei:  'linear-gradient(135deg, #1a0a2e, #3a1a3a)',
  shin: 'linear-gradient(135deg, #0a2010, #1a4a1a)',
  en:   'linear-gradient(135deg, #2a0a0a, #5a1a0a)',
  sou:  'linear-gradient(135deg, #0a1a3a, #1a3a6a)',
  kou:  'linear-gradient(135deg, #1a1a2a, #2a2a4a)',
};

const ATTR_COLOR: Record<Archetype, string> = {
  sei: '#d4af37', mei: '#9333ea', shin: '#22c55e',
  en: '#ef4444',  sou: '#3b82f6', kou: '#64748b',
};

interface Props {
  onSelect: (archetype: Archetype) => void;
}

export default function ArchetypeSelectModal({ onSelect }: Props) {
  return (
    <>
      {/* バックドロップ */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      />

      {/* モーダル本体 */}
      <div
        data-testid="archetype-select-modal"
        className="fixed z-50"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 96vw)',
          maxHeight: '88dvh',
          overflowY: 'auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-rune)',
          borderRadius: 16,
          padding: '20px 16px 24px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
            letterSpacing: '0.08em', color: 'var(--gold)',
            textAlign: 'center', marginBottom: 4,
          }}
        >
          ⚜ 流派を選べ ⚜
        </h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
          選んだ流派の初期デッキで旅立つ。後から変更はできない。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ARCHETYPES.map(arch => {
            const starters = getStarterCardsByAttribute(arch.id);
            const color = ATTR_COLOR[arch.id];

            return (
              <button
                key={arch.id}
                data-testid={`archetype-option-${arch.id}`}
                onClick={() => onSelect(arch.id)}
                style={{
                  background: ATTR_BG[arch.id],
                  border: `1px solid ${color}40`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.border = `1px solid ${color}80`)}
                onMouseLeave={e => (e.currentTarget.style.border = `1px solid ${color}40`)}
              >
                {/* 左: 系統情報 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 18 }}>{arch.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
                      {arch.name}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                    {arch.tagline}
                  </p>
                  {/* 初期5枚のサムネ */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                    {starters.map(card => (
                      <div
                        key={card.id}
                        style={{
                          width: 32, height: 32,
                          borderRadius: 4,
                          overflow: 'hidden',
                          background: 'rgba(0,0,0,0.4)',
                          border: `1px solid ${color}30`,
                          flexShrink: 0,
                          position: 'relative',
                        }}
                        title={card.name}
                      >
                        <img
                          src={`/images/chars/${card.id}.png`}
                          alt={card.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右: 矢印 */}
                <span style={{ color, fontSize: 20, flexShrink: 0 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
