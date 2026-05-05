'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { PlayerProfile, OwnedCard, OwnedMaterial, Deck } from '@/lib/types/meta';
import { getOrCreateProfile, saveProfile, getCardInventory, saveCardInventory, getMaterialInventory, saveMaterialInventory, getDecks, saveDeck, deleteDeck } from '@/lib/firebase/profile';
import { getExpProgress } from '@/lib/server-logic/profile';

interface ProfileContextType {
  profile: PlayerProfile | null;
  ownedCards: OwnedCard[];
  ownedMaterials: OwnedMaterial[];
  decks: Deck[];
  loading: boolean;
  expProgress: { current: number; required: number; pct: number };
  refreshProfile: () => Promise<void>;
  updateProfile: (p: PlayerProfile) => Promise<void>;
  updateCards: (cards: OwnedCard[]) => Promise<void>;
  updateMaterials: (mats: OwnedMaterial[]) => Promise<void>;
  saveOrUpdateDeck: (deck: Deck) => Promise<void>;
  removeDeck: (deckId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  ownedCards: [],
  ownedMaterials: [],
  decks: [],
  loading: true,
  expProgress: { current: 0, required: 100, pct: 0 },
  refreshProfile: async () => {},
  updateProfile: async () => {},
  updateCards: async () => {},
  updateMaterials: async () => {},
  saveOrUpdateDeck: async () => {},
  removeDeck: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [ownedMaterials, setOwnedMaterials] = useState<OwnedMaterial[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [p, cards, mats, d] = await Promise.all([
        getOrCreateProfile(uid),
        getCardInventory(uid),
        getMaterialInventory(uid),
        getDecks(uid),
      ]);
      setProfile(p);
      setOwnedCards(cards);
      setOwnedMaterials(mats);
      setDecks(d);
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

  const expProgress = profile ? getExpProgress(profile) : { current: 0, required: 100, pct: 0 };

  return (
    <ProfileContext.Provider value={{
      profile, ownedCards, ownedMaterials, decks, loading, expProgress,
      refreshProfile, updateProfile, updateCards, updateMaterials,
      saveOrUpdateDeck, removeDeck,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
