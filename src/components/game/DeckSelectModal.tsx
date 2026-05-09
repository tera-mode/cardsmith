'use client';

import { useProfile } from '@/contexts/ProfileContext';
import { CARD_MAP } from '@/lib/game/cards';
import { craftedToGameCard } from '@/lib/server-logic/forge';
import type { Card } from '@/lib/types/game';
import type { Deck, OwnedCard } from '@/lib/types/meta';

interface Props {
  onSelect: (deck: Card[]) => void;
}

function deckToCards(deck: Deck, ownedCards: OwnedCard[]): Card[] {
  const result: Card[] = [];
  for (const entry of deck.entries) {
    if (entry.isCrafted) {
      // 鍛造カード：ownedCards から craftedData を参照
      const owned = ownedCards.find(c => c.cardId === entry.cardId && c.isCrafted);
      if (owned?.craftedData) {
        const gameCard = craftedToGameCard(owned.craftedData);
        for (let i = 0; i < entry.count; i++) result.push(gameCard);
      }
    } else {
      const card = CARD_MAP[entry.cardId];
      if (card) {
        for (let i = 0; i < entry.count; i++) result.push(card);
      }
    }
  }
  return result;
}

export default function DeckSelectModal({ onSelect }: Props) {
  const { decks, ownedCards } = useProfile();

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
          {/* カスタムデッキ一覧（更新日時の新しい順） */}
          {[...decks].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).map(deck => {
            const cards = deckToCards(deck, ownedCards);
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
