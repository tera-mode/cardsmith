'use client';

import { useProfile } from '@/contexts/ProfileContext';
import { CARD_MAP } from '@/lib/game/cards';
import { buildStandardDeck, buildStarterDeck } from '@/lib/game/decks';
import type { Archetype } from '@/lib/game/decks';
import type { Card } from '@/lib/types/game';
import type { Deck } from '@/lib/types/meta';

interface Props {
  starterArchetype?: Archetype;
  onSelect: (deck: Card[]) => void;
}

function deckToCards(deck: Deck): Card[] {
  const result: Card[] = [];
  for (const entry of deck.entries) {
    const card = CARD_MAP[entry.cardId];
    if (card) {
      for (let i = 0; i < entry.count; i++) result.push(card);
    }
  }
  return result;
}

export default function DeckSelectModal({ starterArchetype, onSelect }: Props) {
  const { decks } = useProfile();

  // starterArchetype が指定されている場合はその系統のスターターデッキを使う
  const defaultCards = starterArchetype ? buildStarterDeck(starterArchetype) : buildStandardDeck();

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }} />

      <div
        className="fixed z-50"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 96vw)',
          maxHeight: '82dvh',
          overflowY: 'auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-rune)',
          borderRadius: 16,
          padding: '18px 16px 22px',
          boxShadow: 'inset 0 1px 0 rgba(232,192,116,0.15)',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4,
        }}>
          ⚜ デッキを選択 ⚜
        </h2>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 14 }}>
          このバトルで使うデッキを選んでください
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* スターターデッキ */}
          <button
            onClick={() => onSelect(defaultCards)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(30,22,14,0.9)',
              border: '1px solid var(--gold-deep)',
              borderRadius: 10, padding: '12px 14px',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 24 }}>📖</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                スターターデッキ
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {defaultCards.length}枚
              </p>
            </div>
            <span style={{ color: 'var(--gold)', fontSize: 18 }}>›</span>
          </button>

          {/* カスタムデッキ一覧 */}
          {decks.map(deck => {
            const cards = deckToCards(deck);
            if (cards.length === 0) return null;
            return (
              <button
                key={deck.deckId}
                onClick={() => onSelect(cards)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(20,14,8,0.85)',
                  border: '1px solid var(--border-rune)',
                  borderRadius: 10, padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <span style={{ fontSize: 24 }}>🃏</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deck.name}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {cards.length}枚
                  </p>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
