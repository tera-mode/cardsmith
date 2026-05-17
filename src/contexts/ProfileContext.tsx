'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { PlayerProfile, OwnedCard, OwnedMaterial, Deck, UserImage } from '@/lib/types/meta';
import { getOrCreateProfile, saveProfile, getCardInventory, saveCardInventory, getMaterialInventory, saveMaterialInventory, getDecks, saveDeck, deleteDeck } from '@/lib/firebase/profile';
import { listUserImages } from '@/lib/firebase/imageStorage';
import { getQuestProgress, saveQuestProgress, computeQuestStatuses } from '@/lib/firebase/quests';
import { getExpProgress } from '@/lib/server-logic/profile';
import { QuestProgress } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';
import { MATERIALS } from '@/lib/data/materials';
import { INITIAL_PROFILE } from '@/lib/data/economy';
import { QUESTS } from '@/lib/data/quests';

interface ProfileContextType {
  profile: PlayerProfile | null;
  ownedCards: OwnedCard[];
  ownedMaterials: OwnedMaterial[];
  decks: Deck[];
  questProgress: QuestProgress[];
  userImages: UserImage[];
  loading: boolean;
  expProgress: { current: number; required: number; pct: number };
  refreshProfile: () => Promise<void>;
  updateProfile: (p: PlayerProfile) => Promise<void>;
  updateCards: (cards: OwnedCard[]) => Promise<void>;
  updateMaterials: (mats: OwnedMaterial[]) => Promise<void>;
  saveOrUpdateDeck: (deck: Deck) => Promise<void>;
  removeDeck: (deckId: string) => Promise<void>;
  markQuestCleared: (questId: string) => Promise<void>;
  addUserImage: (img: UserImage) => void;
  removeUserImage: (imageId: string) => void;
  debugMaxOut: () => Promise<void>;
  debugReset: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  ownedCards: [],
  ownedMaterials: [],
  decks: [],
  questProgress: [],
  userImages: [],
  loading: true,
  expProgress: { current: 0, required: 100, pct: 0 },
  refreshProfile: async () => {},
  updateProfile: async () => {},
  updateCards: async () => {},
  updateMaterials: async () => {},
  saveOrUpdateDeck: async () => {},
  removeDeck: async () => {},
  markQuestCleared: async () => {},
  addUserImage: () => {},
  removeUserImage: () => {},
  debugMaxOut: async () => {},
  debugReset: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

const CURRENT_SCHEMA_VERSION = 2;

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [ownedMaterials, setOwnedMaterials] = useState<OwnedMaterial[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [p, cards, mats, d, qp, imgs] = await Promise.all([
        getOrCreateProfile(uid),
        getCardInventory(uid),
        getMaterialInventory(uid),
        getDecks(uid),
        getQuestProgress(uid),
        listUserImages(uid).catch(() => [] as UserImage[]), // 失敗しても他のロードを止めない
      ]);

      // スキーマバージョンチェック — 古いデータは強制リセット
      if (!p.schemaVersion || p.schemaVersion < CURRENT_SCHEMA_VERSION) {
        setShowMigrationModal(true);
        // リセットを非同期で実行（UIをブロックしない）
        const now = Date.now();
        // starterArchetype を除いた既存フィールドに INITIAL_PROFILE + schemaVersion を上書き
        const { starterArchetype: _sa, ...profileRest } = p;
        const resetProfile: PlayerProfile = {
          ...profileRest, ...INITIAL_PROFILE, updatedAt: now, schemaVersion: CURRENT_SCHEMA_VERSION,
        };
        const resetCards: OwnedCard[] = [];
        const defaultDeck: Deck = {
          deckId: 'default', name: 'マイデッキ',
          entries: [],
          createdAt: now, updatedAt: now,
        };
        const initialQuests: QuestProgress[] = QUESTS.map(q => ({
          questId: q.questId, status: q.prerequisites.length === 0 ? 'available' : 'locked', attemptCount: 0,
        }));
        setProfile(resetProfile);
        setOwnedCards(resetCards);
        setOwnedMaterials([]);
        setDecks([defaultDeck]);
        setQuestProgress(initialQuests);
        await Promise.all([
          saveProfile(resetProfile),
          saveCardInventory(uid, resetCards),
          saveMaterialInventory(uid, []),
          saveDeck(uid, defaultDeck),
          ...initialQuests.map(q => saveQuestProgress(uid, q)),
        ]);
        return;
      }

      setProfile(p);
      setOwnedCards(cards);
      setOwnedMaterials(mats);
      setDecks(d);
      setQuestProgress(qp);
      setUserImages(imgs);
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

  const addUserImage = useCallback((img: UserImage) => {
    setUserImages(prev => [img, ...prev]);
  }, []);

  const removeUserImage = useCallback((imageId: string) => {
    setUserImages(prev => prev.filter(i => i.id !== imageId));
  }, []);

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
    const resetCards: OwnedCard[] = [];
    const defaultDeck: Deck = {
      deckId: 'default',
      name: 'マイデッキ',
      entries: [],
      createdAt: now,
      updatedAt: now,
    };
    const initialQuests: QuestProgress[] = QUESTS.map(q => ({
      questId: q.questId,
      status: q.prerequisites.length === 0 ? 'available' : 'locked',
      attemptCount: 0,
    }));
    setProfile(resetProfile);
    setOwnedCards(resetCards);
    setOwnedMaterials([]);
    setDecks([defaultDeck]);
    setQuestProgress(initialQuests);
    const deleteOtherDecks = decks
      .filter(d => d.deckId !== 'default')
      .map(d => deleteDeck(user.uid, d.deckId));
    await Promise.all([
      saveProfile(resetProfile),
      saveCardInventory(user.uid, resetCards),
      saveMaterialInventory(user.uid, []),
      saveDeck(user.uid, defaultDeck),
      ...deleteOtherDecks,
      ...initialQuests.map(q => saveQuestProgress(user.uid, q)),
    ]);
  }, [user, profile, decks]);

  const expProgress = profile ? getExpProgress(profile) : { current: 0, required: 100, pct: 0 };

  return (
    <ProfileContext.Provider value={{
      profile, ownedCards, ownedMaterials, decks, questProgress, userImages, loading, expProgress,
      refreshProfile, updateProfile, updateCards, updateMaterials,
      saveOrUpdateDeck, removeDeck, markQuestCleared,
      addUserImage, removeUserImage,
      debugMaxOut, debugReset,
    }}>
      {children}
      {showMigrationModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px',
        }}>
          <div style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border-rune)',
            borderRadius: 16, padding: '24px 20px', maxWidth: 320, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚒</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 10, letterSpacing: '0.06em' }}>
              バージョンアップ
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              ゲームの仕様が大幅に更新されました。<br />
              データをリセットして再スタートします。
            </p>
            <button
              onClick={() => setShowMigrationModal(false)}
              className="btn--primary"
              style={{ width: '100%', minHeight: 44, fontSize: 13 }}
            >
              了解しました
            </button>
          </div>
        </div>
      )}
    </ProfileContext.Provider>
  );
};
