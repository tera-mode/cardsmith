'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { PlayerProfile, OwnedCard, OwnedMaterial, Deck } from '@/lib/types/meta';
import { getOrCreateProfile, saveProfile, getCardInventory, saveCardInventory, getMaterialInventory, saveMaterialInventory, getDecks, saveDeck, deleteDeck } from '@/lib/firebase/profile';
import { getQuestProgress, saveQuestProgress, computeQuestStatuses } from '@/lib/firebase/quests';
import { getExpProgress } from '@/lib/server-logic/profile';
import { QuestProgress } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';
import { MATERIALS } from '@/lib/data/materials';
import { INITIAL_PROFILE } from '@/lib/data/economy';
import { buildStandardDeck } from '@/lib/game/decks';

interface ProfileContextType {
  profile: PlayerProfile | null;
  ownedCards: OwnedCard[];
  ownedMaterials: OwnedMaterial[];
  decks: Deck[];
  questProgress: QuestProgress[];
  loading: boolean;
  expProgress: { current: number; required: number; pct: number };
  refreshProfile: () => Promise<void>;
  updateProfile: (p: PlayerProfile) => Promise<void>;
  updateCards: (cards: OwnedCard[]) => Promise<void>;
  updateMaterials: (mats: OwnedMaterial[]) => Promise<void>;
  saveOrUpdateDeck: (deck: Deck) => Promise<void>;
  removeDeck: (deckId: string) => Promise<void>;
  markQuestCleared: (questId: string) => Promise<void>;
  debugMaxOut: () => Promise<void>;
  debugReset: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  ownedCards: [],
  ownedMaterials: [],
  decks: [],
  questProgress: [],
  loading: true,
  expProgress: { current: 0, required: 100, pct: 0 },
  refreshProfile: async () => {},
  updateProfile: async () => {},
  updateCards: async () => {},
  updateMaterials: async () => {},
  saveOrUpdateDeck: async () => {},
  removeDeck: async () => {},
  markQuestCleared: async () => {},
  debugMaxOut: async () => {},
  debugReset: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [ownedMaterials, setOwnedMaterials] = useState<OwnedMaterial[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [p, cards, mats, d, qp] = await Promise.all([
        getOrCreateProfile(uid),
        getCardInventory(uid),
        getMaterialInventory(uid),
        getDecks(uid),
        getQuestProgress(uid),
      ]);
      setProfile(p);
      setOwnedCards(cards);
      setOwnedMaterials(mats);
      setDecks(d);
      setQuestProgress(qp);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        load(user.uid);
      } else {
        setProfile(null);
        setOwnedCards([]);
        setOwnedMaterials([]);
        setDecks([]);
        setLoading(false);
      }
    }
  }, [user, authLoading, load]);

  const refreshProfile = useCallback(async () => {
    if (user) await load(user.uid);
  }, [user, load]);

  const updateProfile = useCallback(async (p: PlayerProfile) => {
    setProfile(p);
    await saveProfile(p);
  }, []);

  const updateCards = useCallback(async (cards: OwnedCard[]) => {
    if (!user) return;
    setOwnedCards(cards);
    await saveCardInventory(user.uid, cards);
  }, [user]);

  const updateMaterials = useCallback(async (mats: OwnedMaterial[]) => {
    if (!user) return;
    setOwnedMaterials(mats);
    await saveMaterialInventory(user.uid, mats);
  }, [user]);

  const saveOrUpdateDeck = useCallback(async (deck: Deck) => {
    if (!user) return;
    setDecks(prev => {
      const idx = prev.findIndex(d => d.deckId === deck.deckId);
      if (idx >= 0) { const next = [...prev]; next[idx] = deck; return next; }
      return [...prev, deck];
    });
    await saveDeck(user.uid, deck);
  }, [user]);

  const removeDeck = useCallback(async (deckId: string) => {
    if (!user) return;
    setDecks(prev => prev.filter(d => d.deckId !== deckId));
    await deleteDeck(user.uid, deckId);
  }, [user]);

  const markQuestCleared = useCallback(async (questId: string) => {
    if (!user) return;
    const updated = computeQuestStatuses(questProgress, questId);
    setQuestProgress(updated);
    for (const p of updated) {
      await saveQuestProgress(user.uid, p);
    }
  }, [user, questProgress]);

  const debugMaxOut = useCallback(async () => {
    if (!user || !profile) return;
    const now = Date.now();
    const maxProfile: typeof profile = {
      ...profile,
      level: 99,
      exp: 9_999_999,
      runes: 999_999,
      updatedAt: now,
    };
    const maxCards: OwnedCard[] = CARDS.map(card => ({
      cardId: card.id,
      count: 10,
      isCrafted: false,
      acquiredAt: now,
    }));
    const maxMaterials: OwnedMaterial[] = MATERIALS.map(mat => ({
      materialId: mat.id,
      count: 99,
    }));
    setProfile(maxProfile);
    setOwnedCards(maxCards);
    setOwnedMaterials(maxMaterials);
    await Promise.all([
      saveProfile(maxProfile),
      saveCardInventory(user.uid, maxCards),
      saveMaterialInventory(user.uid, maxMaterials),
    ]);
  }, [user, profile]);

  const debugReset = useCallback(async () => {
    if (!user || !profile) return;
    const now = Date.now();
    const resetProfile: typeof profile = {
      ...profile,
      ...INITIAL_PROFILE,
      updatedAt: now,
    };
    const resetCards: OwnedCard[] = CARDS.map(card => ({
      cardId: card.id,
      count: 1,
      isCrafted: false,
      acquiredAt: now,
    }));
    const standardCards = buildStandardDeck();
    const cardCounts: Record<string, number> = {};
    for (const card of standardCards) {
      cardCounts[card.id] = (cardCounts[card.id] ?? 0) + 1;
    }
    const defaultDeck: Deck = {
      deckId: 'default',
      name: '標準デッキ',
      entries: Object.entries(cardCounts).map(([cardId, count]) => ({ cardId, count, isCrafted: false })),
      createdAt: now,
      updatedAt: now,
    };
    setProfile(resetProfile);
    setOwnedCards(resetCards);
    setOwnedMaterials([]);
    setDecks([defaultDeck]);
    const deleteOtherDecks = decks
      .filter(d => d.deckId !== 'default')
      .map(d => deleteDeck(user.uid, d.deckId));
    await Promise.all([
      saveProfile(resetProfile),
      saveCardInventory(user.uid, resetCards),
      saveMaterialInventory(user.uid, []),
      saveDeck(user.uid, defaultDeck),
      ...deleteOtherDecks,
    ]);
  }, [user, profile, decks]);

  const expProgress = profile ? getExpProgress(profile) : { current: 0, required: 100, pct: 0 };

  return (
    <ProfileContext.Provider value={{
      profile, ownedCards, ownedMaterials, decks, questProgress, loading, expProgress,
      refreshProfile, updateProfile, updateCards, updateMaterials,
      saveOrUpdateDeck, removeDeck, markQuestCleared,
      debugMaxOut, debugReset,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
