'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import { CARDS_WITH_RARITY } from '@/lib/data/cards';
import { Deck, Rarity } from '@/lib/types/meta';
import { DECK_MAX_CARDS, DECK_MAX_SAME, getCostCapForLevel } from '@/lib/data/economy';
import { v4 as uuidv4 } from 'uuid';

const DECK_MAX_COUNT = 5;

const ATTR: Record<string, { label: string; color: string }> = {
  sei:  { label: '聖', color: '#d4af37' },
  mei:  { label: '冥', color: '#9333ea' },
  shin: { label: '森', color: '#22c55e' },
  en:   { label: '焔', color: '#ef4444' },
  sou:  { label: '蒼', color: '#3b82f6' },
  kou:  { label: '鋼', color: '#64748b' },
};

const RARITY_COLOR: Record<Rarity, string> = {
  C: '#6b7280', R: '#3b82f6', SR: '#a855f7', SSR: '#fbbf24',
};
const RARITY_BG: Record<Rarity, string> = {
  C: 'rgba(107,114,128,0.18)',
  R: 'rgba(59,130,246,0.18)',
  SR: 'rgba(168,85,247,0.18)',
  SSR: 'rgba(251,191,36,0.18)',
};

export default function DeckPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedCards, decks, loading, saveOrUpdateDeck, removeDeck } = useProfile();
  const router = useRouter();

  const [editing, setEditing] = useState<Deck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [attrFilter, setAttrFilter] = useState('all');

  useEffect(() => {
    if (!editing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editing]);

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
          <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  // ─── デッキビルダー ───────────────────────────────────────────────────────────
  if (editing) {
    const total = totalCards(editing);
    const totalCost = editing.entries.reduce((sum, e) => {
      const card = CARDS_WITH_RARITY.find(c => c.id === e.cardId);
      return sum + (card?.cost ?? 0) * e.count;
    }, 0);
    const costCap = profile ? getCostCapForLevel(profile.level) : 80;
    const overCap = totalCost > costCap;
    const countPct = Math.min(total / DECK_MAX_CARDS, 1);
    const costPct = Math.min(totalCost / costCap, 1);
    const costColor = overCap ? '#ef4444' : costPct >= 0.85 ? '#d4af37' : '#22c55e';

    // コスト順スロット展開
    const deckSlots = editing.entries
      .flatMap(e => {
        const card = CARDS_WITH_RARITY.find(c => c.id === e.cardId);
        return Array.from({ length: e.count }, (_, i) => ({ cardId: e.cardId, card, idx: i }));
      })
      .sort((a, b) => (a.card?.cost ?? 0) - (b.card?.cost ?? 0));

    // 属性フィルタ
    const visibleCards = CARDS_WITH_RARITY.filter(card =>
      attrFilter === 'all' || card.attribute === attrFilter
    );

    return (
      <div className="game-layout stone-bg flex-col">

        {/* ── ヘッダー ── */}
        <header style={{
          flexShrink: 0, height: 56,
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
          background: 'linear-gradient(180deg, rgba(40,28,16,0.98) 0%, rgba(20,14,8,0.94) 100%)',
          borderBottom: '1px solid var(--border-rune)', position: 'relative',
        }}>
          <div style={{ position: 'absolute', bottom: -1, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.45, pointerEvents: 'none' }} />
          <button
            onClick={() => setShowUnsaved(true)}
            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: 'var(--gold)', background: 'transparent', border: '1px solid var(--border-rune)', borderRadius: 4, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
          >
            ←
          </button>
          <input
            value={editing.name}
            onChange={e => setEditing({ ...editing, name: e.target.value })}
            maxLength={15}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
              color: 'var(--gold)', letterSpacing: '0.06em',
            }}
          />
          <button
            data-testid="deck-builder-save"
            onClick={handleSave}
            disabled={saving || overCap || total === 0}
            style={{
              padding: '7px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--font-display)', cursor: saving || overCap || total === 0 ? 'not-allowed' : 'pointer',
              background: saving || overCap || total === 0 ? 'rgba(30,20,10,0.8)' : 'var(--gold)',
              color: saving || overCap || total === 0 ? 'var(--text-dim)' : '#1a0e00',
              border: '1px solid var(--gold-deep)', letterSpacing: '0.04em', flexShrink: 0,
            }}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </header>

        {/* ── ステータスバー ── */}
        <div style={{ flexShrink: 0, padding: '8px 14px 7px', background: 'rgba(8,5,2,0.9)', borderBottom: '1px solid var(--border-rune)' }}>
          {/* 枚数ゲージ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', width: 32, flexShrink: 0 }}>枚数</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${countPct * 100}%`, height: '100%', borderRadius: 3,
                background: total === DECK_MAX_CARDS ? 'var(--gold)' : '#22c55e',
                boxShadow: `0 0 6px ${total === DECK_MAX_CARDS ? 'rgba(232,192,116,0.7)' : 'rgba(34,197,94,0.6)'}`,
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 32, textAlign: 'right',
              color: total === DECK_MAX_CARDS ? 'var(--gold)' : 'var(--text-primary)',
            }}>
              {total}<span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 10 }}>/{DECK_MAX_CARDS}</span>
            </span>
          </div>
          {/* コストゲージ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', width: 32, flexShrink: 0 }}>コスト</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(costPct, 1) * 100}%`, height: '100%', borderRadius: 3,
                background: costColor,
                boxShadow: `0 0 6px ${overCap ? 'rgba(239,68,68,0.7)' : costPct >= 0.85 ? 'rgba(212,175,55,0.6)' : 'rgba(34,197,94,0.5)'}`,
                transition: 'width 0.3s',
              }} />
            </div>
            <span
              data-testid="cost-cap-warning"
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 32, textAlign: 'right',
                color: costColor,
              }}
            >
              {totalCost}<span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 10 }}>/{costCap}</span>
              {overCap && <span style={{ marginLeft: 2, fontSize: 10 }}>⚠</span>}
            </span>
          </div>
        </div>

        {/* ── 編成中カルーセル ── */}
        <div style={{ flexShrink: 0, background: 'rgba(12,8,4,0.92)', borderBottom: '1px solid var(--border-rune)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--gold)', letterSpacing: '0.14em', textAlign: 'center', padding: '5px 0 3px', opacity: 0.75 }}>
            ⚜ 編成中の戦士 ⚜
          </p>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '0 10px 8px', scrollbarWidth: 'none' }}>
            {deckSlots.map(({ cardId, card, idx }) => {
              const rc = card?.rarity ?? 'C';
              return (
                <button
                  key={`${cardId}-${idx}`}
                  onClick={() => removeCard(cardId)}
                  style={{
                    flexShrink: 0, width: 58, height: 78, borderRadius: 5,
                    background: RARITY_BG[rc],
                    border: `1px solid ${RARITY_COLOR[rc]}55`,
                    boxShadow: `inset 0 0 10px ${RARITY_COLOR[rc]}18`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    padding: '4px 3px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: RARITY_COLOR[rc], opacity: 0.7 }} />
                  <div style={{
                    position: 'absolute', top: 4, left: 4, width: 14, height: 14, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.85)', border: `1px solid ${RARITY_COLOR[rc]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: RARITY_COLOR[rc], fontFamily: 'var(--font-display)',
                  }}>
                    {card?.cost ?? '?'}
                  </div>
                  <div style={{ position: 'absolute', top: 3, right: 3, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>✕</div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, textAlign: 'center', wordBreak: 'break-all', maxWidth: '100%' }}>
                    {card?.name ?? '?'}
                  </p>
                </button>
              );
            })}
            {Array.from({ length: DECK_MAX_CARDS - total }, (_, i) => (
              <div key={`empty-${i}`} style={{
                flexShrink: 0, width: 58, height: 78, borderRadius: 5,
                border: '1px dashed rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'rgba(255,255,255,0.08)',
              }}>
                ＋
              </div>
            ))}
          </div>
        </div>

        {/* ── 属性フィルタ ── */}
        <div style={{
          flexShrink: 0, display: 'flex', gap: 4, padding: '6px 10px',
          background: 'rgba(10,6,2,0.8)', borderBottom: '1px solid var(--border-rune)',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {[{ key: 'all', label: '全', color: 'var(--gold)' }, ...Object.entries(ATTR).map(([k, v]) => ({ key: k, label: v.label, color: v.color }))].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setAttrFilter(key)}
              style={{
                flexShrink: 0, padding: '4px 11px', borderRadius: 3,
                fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', letterSpacing: '0.04em',
                background: attrFilter === key ? `${color}22` : 'rgba(20,14,8,0.9)',
                border: `1px solid ${attrFilter === key ? color : 'var(--border-rune)'}`,
                color: attrFilter === key ? color : 'var(--text-muted)',
                boxShadow: attrFilter === key ? `0 0 8px ${color}40` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── カードリスト ── */}
        <div className="safe-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visibleCards.map(card => {
            const owned = ownedCards.find(c => c.cardId === card.id && !c.isCrafted);
            const inDeck = getEntryCount(editing, card.id);
            const canAdd = !!owned && owned.count > inDeck && inDeck < DECK_MAX_SAME && total < DECK_MAX_CARDS && !overCap;
            const rc = card.rarity;
            const attr = card.attribute ? ATTR[card.attribute] : null;

            return (
              <div
                key={card.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: inDeck > 0 ? RARITY_BG[rc] : 'rgba(18,12,6,0.8)',
                  border: `1px solid ${inDeck > 0 ? `${RARITY_COLOR[rc]}45` : 'var(--border-rune)'}`,
                  borderLeft: `3px solid ${RARITY_COLOR[rc]}`,
                  borderRadius: 4, padding: '7px 10px 7px 9px',
                  opacity: !owned ? 0.38 : 1,
                  transition: 'opacity 0.15s, background 0.15s',
                }}
              >
                {/* カード名 + メタ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.name}
                    </p>
                    {attr && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: attr.color, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                        {attr.label}
                      </span>
                    )}
                    {inDeck > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: RARITY_COLOR[rc],
                        background: `${RARITY_COLOR[rc]}22`, padding: '1px 5px', borderRadius: 2,
                        fontFamily: 'var(--font-display)', flexShrink: 0,
                      }}>
                        ×{inDeck}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                      ATK{card.atk}  HP{card.hp}
                    </span>
                    {card.skill && (
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
                        ✦スキル有
                      </span>
                    )}
                  </div>
                </div>

                {/* コストバッジ */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: `radial-gradient(circle, ${RARITY_COLOR[rc]}28, rgba(0,0,0,0.85))`,
                  border: `1px solid ${RARITY_COLOR[rc]}70`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: RARITY_COLOR[rc],
                }}>
                  {card.cost}
                </div>

                {/* 追加ボタン */}
                <button
                  data-testid={`deck-builder-add-${card.id}`}
                  onClick={() => addCard(card.id)}
                  disabled={!canAdd}
                  style={{
                    width: 34, height: 34, borderRadius: 4, flexShrink: 0,
                    background: canAdd ? 'rgba(34,197,94,0.12)' : 'rgba(20,14,8,0.6)',
                    border: `1px solid ${canAdd ? '#22c55e70' : 'var(--border-rune)'}`,
                    color: canAdd ? '#4ade80' : 'var(--text-dim)',
                    fontSize: 22, lineHeight: 1, cursor: canAdd ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ＋
                </button>
              </div>
            );
          })}
        </div>

        {/* 未保存警告 */}
        <ConfirmSheet
          open={showUnsaved}
          title="未保存の変更があります"
          confirmLabel="破棄して戻る"
          onConfirm={() => { setShowUnsaved(false); setEditing(null); }}
          onCancel={() => setShowUnsaved(false)}
          danger
        >
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            編集内容が保存されていません。<br />破棄して一覧に戻りますか？
          </p>
        </ConfirmSheet>
      </div>
    );
  }

  // ─── デッキ一覧 ───────────────────────────────────────────────────────────────
  return (
    <div className="game-layout stone-bg flex-col">
      <AppHeader backHref="/" title="デッキ編集" />
      <div className="safe-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px' }}>
        {decks.map(deck => {
          const count = totalCards(deck);
          const cost = deck.entries.reduce((s, e) => {
            const c = CARDS_WITH_RARITY.find(cd => cd.id === e.cardId);
            return s + (c?.cost ?? 0) * e.count;
          }, 0);
          const cap = profile ? getCostCapForLevel(profile.level) : 80;
          const over = cost > cap;
          const countPct = Math.min(count / DECK_MAX_CARDS, 1);
          const costPct = Math.min(cost / cap, 1);
          const listCostColor = over ? '#ef4444' : costPct >= 0.85 ? '#d4af37' : '#22c55e';

          return (
            <div key={deck.deckId} className="panel--ornate" style={{ marginBottom: 10, padding: '14px 14px 12px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p
                  data-testid={`deck-list-item-${deck.deckId}`}
                  style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.06em' }}
                >
                  {deck.name}
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setAttrFilter('all'); setEditing({ ...deck }); }}
                    style={{
                      padding: '6px 14px', borderRadius: 4,
                      background: 'rgba(232,192,116,0.1)', border: '1px solid var(--gold-deep)',
                      color: 'var(--gold)', fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-display)', cursor: 'pointer',
                    }}
                  >
                    編集
                  </button>
                  {decks.length > 1 && (
                    <button
                      onClick={() => setDeleteTarget(deck.deckId)}
                      style={{
                        padding: '6px 10px', borderRadius: 4,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171', fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font-display)', cursor: 'pointer',
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>

              {/* 枚数ゲージ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-dim)', width: 32, flexShrink: 0 }}>枚数</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${countPct * 100}%`, height: '100%', borderRadius: 2,
                    background: count === DECK_MAX_CARDS ? 'var(--gold)' : '#22c55e',
                    boxShadow: `0 0 4px ${count === DECK_MAX_CARDS ? 'rgba(232,192,116,0.5)' : 'rgba(34,197,94,0.4)'}`,
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, width: 32, textAlign: 'right', flexShrink: 0, color: count === DECK_MAX_CARDS ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {count}/{DECK_MAX_CARDS}
                </span>
              </div>

              {/* コストゲージ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-dim)', width: 32, flexShrink: 0 }}>コスト</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(costPct, 1) * 100}%`, height: '100%', borderRadius: 2,
                    background: listCostColor,
                    boxShadow: `0 0 4px ${over ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.4)'}`,
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, width: 32, textAlign: 'right', flexShrink: 0, color: listCostColor }}>
                  {cost}/{cap}
                  {over && <span style={{ marginLeft: 2 }}>⚠</span>}
                </span>
              </div>
            </div>
          );
        })}

        {decks.length < DECK_MAX_COUNT && (
          <button
            onClick={startNew}
            style={{
              width: '100%', padding: '16px 0',
              background: 'rgba(20,14,8,0.6)', border: '1px dashed rgba(232,192,116,0.2)',
              borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              color: 'rgba(232,192,116,0.45)', letterSpacing: '0.06em', cursor: 'pointer',
            }}
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
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
          「{decks.find(d => d.deckId === deleteTarget)?.name}」を削除します。
        </p>
      </ConfirmSheet>
    </div>
  );
}
