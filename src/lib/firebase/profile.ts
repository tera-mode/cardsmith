import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { PlayerProfile, OwnedCard, OwnedMaterial, Deck, CardInventoryDoc, MaterialInventoryDoc } from '@/lib/types/meta';
import { createInitialProfile } from '@/lib/server-logic/profile';
import { CARDS } from '@/lib/game/cards';
import { buildStandardDeck } from '@/lib/game/decks';

// ─── プロフィール ─────────────────────────────────────────────────────────────

export async function getOrCreateProfile(userId: string): Promise<PlayerProfile> {
  const ref = doc(db, 'users', userId, 'profile', 'data');
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as PlayerProfile;

  const profile = createInitialProfile(userId);
  await setDoc(ref, profile);

  // 初回：全13カードを1枚ずつ付与
  await initializeInventory(userId);
  // 初回：標準デッキを作成
  await initializeDefaultDeck(userId);

  return profile;
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  const ref = doc(db, 'users', profile.userId, 'profile', 'data');
  await setDoc(ref, profile, { merge: true });
}

// ─── カードインベントリ ──────────────────────────────────────────────────────

export async function getCardInventory(userId: string): Promise<OwnedCard[]> {
  const ref = doc(db, 'users', userId, 'inventory', 'cards');
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data() as CardInventoryDoc).ownedCards ?? [];
}

export async function saveCardInventory(userId: string, ownedCards: OwnedCard[]): Promise<void> {
  const ref = doc(db, 'users', userId, 'inventory', 'cards');
  await setDoc(ref, { ownedCards }, { merge: true });
}

// ─── マテリアルインベントリ ─────────────────────────────────────────────────

export async function getMaterialInventory(userId: string): Promise<OwnedMaterial[]> {
  const ref = doc(db, 'users', userId, 'inventory', 'materials');
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data() as MaterialInventoryDoc).ownedMaterials ?? [];
}

export async function saveMaterialInventory(userId: string, ownedMaterials: OwnedMaterial[]): Promise<void> {
  const ref = doc(db, 'users', userId, 'inventory', 'materials');
  await setDoc(ref, { ownedMaterials }, { merge: true });
}

// ─── デッキ ───────────────────────────────────────────────────────────────────

export async function getDecks(userId: string): Promise<Deck[]> {
  const col = collection(db, 'users', userId, 'decks');
  const snap = await getDocs(col);
  return snap.docs.map(d => d.data() as Deck);
}

export async function saveDeck(userId: string, deck: Deck): Promise<void> {
  const ref = doc(db, 'users', userId, 'decks', deck.deckId);
  await setDoc(ref, deck);
}

export async function deleteDeck(userId: string, deckId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'decks', deckId);
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(ref);
}

// ─── 初期化ヘルパー ───────────────────────────────────────────────────────────

async function initializeInventory(userId: string): Promise<void> {
  const now = Date.now();
  const ownedCards: OwnedCard[] = CARDS.map(card => ({
    cardId: card.id,
    count: 1,
    isCrafted: false,
    acquiredAt: now,
  }));
  await saveCardInventory(userId, ownedCards);
  await saveMaterialInventory(userId, []);
}

async function initializeDefaultDeck(userId: string): Promise<void> {
  const now = Date.now();
  const standardCards = buildStandardDeck();
  const cardCounts: Record<string, number> = {};
  for (const card of standardCards) {
    cardCounts[card.id] = (cardCounts[card.id] ?? 0) + 1;
  }
  const deck: Deck = {
    deckId: 'default',
    name: '標準デッキ',
    entries: Object.entries(cardCounts).map(([cardId, count]) => ({
      cardId,
      count,
      isCrafted: false,
    })),
    createdAt: now,
    updatedAt: now,
  };
  await saveDeck(userId, deck);
}
