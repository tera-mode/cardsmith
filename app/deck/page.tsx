'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import GlassPanel from '@/components/ui/GlassPanel';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import { CARDS_WITH_RARITY } from '@/lib/data/cards';
import { Deck, DeckEntry } from '@/lib/types/meta';
import { v4 as uuidv4 } from 'uuid';

const DECK_MAX_CARDS = 20;
const DECK_MAX_SAME = 2;
const DECK_MAX_COUNT = 5;

export default function DeckPage() {
  const { user, loading: authLoading } = useAuth();
  const { ownedCards, decks, loading, saveOrUpdateDeck, removeDeck } = useProfile();
  const router = useRouter();

  const [editing, setEditing] = useState<Deck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const totalCards = (deck: Deck) => deck.entries.reduce((s, e) => s + e.count, 0);

  const getEntryCount = (deck: Deck, cardId: string) =>
    deck.entries.find(e => e.cardId === cardId)?.count ?? 0;

  const addCard = (cardId: string) => {
    if (!editing) return;
    const total = totalCards(editing);
    const same = getEntryCount(editing, cardId);
    if (total >= DECK_MAX_CARDS || same >= DECK_MAX_SAME) return;
    const owned = ownedCards.find(c => c.cardId === cardId && !c.isCrafted);
    if (!owned || owned.count < same + 1) return;

    const idx = editing.entries.findIndex(e => e.cardId === cardId);
    if (idx >= 0) {
      const next = [...editing.entries];
      next[idx] = { ...next[idx], count: next[idx].count + 1 };
      setEditing({ ...editing, entries: next });
    } else {
      setEditing({ ...editing, entries: [...editing.entries, { cardId, count: 1, isCrafted: false }] });
    }
  };

  const removeCard = (cardId: string) => {
    if (!editing) return;
    const next = editing.entries
      .map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e)
      .filter(e => e.count > 0);
    setEditing({ ...editing, entries: next });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await saveOrUpdateDeck({ ...editing, updatedAt: Date.now() });
    setSaving(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget || decks.length <= 1) return;
    await removeDeck(deleteTarget);
    setDeleteTarget(null);
  };

  const startNew = () => {
    if (decks.length >= DECK_MAX_COUNT) return;
    setEditing({
      deckId: uuidv4(),
      name: `デッキ ${decks.length + 1}`,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  if (loading) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="デッキ編集" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ─── デッキビルダー ───────────────────────────────────────────────────────────
  if (editing) {
    const total = totalCards(editing);
    return (
      <div className="game-layout stone-bg flex-col">
        <header className="flex-shrink-0 h-14 flex items-center px-3 gap-2 border-b  bg-[#0a0e27]/90">
          <button onClick={() => setEditing(null)} className="text-secondary text-xl">←</button>
          <input
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            className="flex-1 bg-transparent text-white font-bold text-sm outline-none"
            maxLength={15}
          />
          <span className={`text-xs ${total === DECK_MAX_CARDS ? 'text-[#22d3ee]' : 'text-secondary'}`}>
            {total}/{DECK_MAX_CARDS}
          </span>
          <button
            data-testid="deck-builder-save"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-rune-blue text-white text-xs font-bold rounded-lg disabled:opacity-50"
          >
            {saving ? '保存中' : '保存'}
          </button>
        </header>

        {/* 現在のデッキ */}
        <div className="flex-shrink-0 p-2 bg-[#0d1b35] border-b  min-h-[80px]">
          <div className="flex flex-wrap gap-1">
            {editing.entries.flatMap(e =>
              Array.from({ length: e.count }, (_, i) => {
                const card = CARDS_WITH_RARITY.find(c => c.id === e.cardId);
                return (
                  <button
                    key={`${e.cardId}-${i}`}
                    onClick={() => removeCard(e.cardId)}
                    className="text-xs bg-[#1e3a5f]/80 text-white px-2 py-1 rounded border border-[#3b82f6]/30"
                  >
                    {card?.name ?? e.cardId}
                  </button>
                );
              })
            )}
            {total === 0 && <p className="text-xs text-[#475569] p-1">カードを追加してください</p>}
          </div>
        </div>

        {/* 所持カード一覧 */}
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-1.5 content-start safe-scroll">
          {CARDS_WITH_RARITY.map(card => {
            const owned = ownedCards.find(c => c.cardId === card.id && !c.isCrafted);
            const inDeck = getEntryCount(editing, card.id);
            const canAdd = !!owned && owned.count > inDeck && inDeck < DECK_MAX_SAME && total < DECK_MAX_CARDS;

            return (
              <button
                key={card.id}
                data-testid={`deck-builder-add-${card.id}`}
                onClick={() => addCard(card.id)}
                disabled={!canAdd}
                className={`rounded-lg p-2 border text-center transition-opacity ${
                  canAdd ? 'bg-[#16213e] border-[#3b82f6]/40 active:opacity-70' : 'bg-[#0d1b35] border-[#1e3a5f]/30 opacity-40'
                }`}
              >
                <div className="text-xs font-bold text-white truncate">{card.name}</div>
                <div className="text-[9px] text-muted">{inDeck > 0 ? `×${inDeck}` : ''} C{card.cost}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── デッキ一覧 ───────────────────────────────────────────────────────────────
  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="デッキ編集" />
      <div className="flex-1 overflow-y-auto p-3 space-y-2 safe-scroll">
        {decks.map(deck => (
          <GlassPanel key={deck.deckId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p data-testid={`deck-list-item-${deck.deckId}`} className="font-bold text-white text-sm">{deck.name}</p>
                <p className="text-xs text-muted">{totalCards(deck)}/{DECK_MAX_CARDS} 枚</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ ...deck })}
                  className="px-3 py-1.5 bg-[#1e3a5f] text-secondary text-xs font-bold rounded-lg"
                >
                  編集
                </button>
                {decks.length > 1 && (
                  <button
                    onClick={() => setDeleteTarget(deck.deckId)}
                    className="px-3 py-1.5 bg-red-900/30 text-red-400 text-xs font-bold rounded-lg border border-red-700/30"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>
        ))}

        {decks.length < DECK_MAX_COUNT && (
          <button
            onClick={startNew}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[#1e3a5f] text-muted text-sm font-bold"
          >
            ＋ 新しいデッキを作成
          </button>
        )}
      </div>

      <ConfirmSheet
        open={!!deleteTarget}
        title="デッキを削除しますか？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="削除する"
        danger
      >
        <p className="text-sm text-secondary text-center">
          「{decks.find(d => d.deckId === deleteTarget)?.name}」を削除します。
        </p>
      </ConfirmSheet>
    </div>
  );
}
