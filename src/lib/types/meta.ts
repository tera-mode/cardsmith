import { MovementPattern, AttackRange, Skill } from './game';

// ─── レアリティ ──────────────────────────────────────────────────────────────

export type Rarity = 'C' | 'R' | 'SR' | 'SSR';

export const RARITY_COLORS: Record<Rarity, string> = {
  C: '#6b7280',
  R: '#3b82f6',
  SR: '#a855f7',
  SSR: '#fbbf24',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  C: 'コモン',
  R: 'レア',
  SR: 'スーパーレア',
  SSR: 'SSレア',
};

// ─── アーキタイプ（系統）────────────────────────────────────────────────────

export type Archetype = 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';

// ─── プレイヤープロフィール ───────────────────────────────────────────────────

export interface PlayerProfile {
  userId: string;
  level: number;
  exp: number;
  runes: number;
  createdAt: number;
  updatedAt: number;
  starterArchetype?: Archetype;  // q0_3 クリア後に確定
  schemaVersion?: number;        // データ移行用。現行 = 2
}

// ─── 所持カード ───────────────────────────────────────────────────────────────

export interface OwnedCard {
  cardId: string;
  count: number;
  isCrafted: boolean;
  craftedData?: CraftedCard;
  acquiredAt: number;
}

export interface CraftedCard {
  instanceId: string;
  name: string;
  cost: number;
  movement: MovementPattern;
  attackRange: AttackRange;
  atk: number;
  hp: number;
  skill?: Skill;
  rarity: Rarity;
  iconKey: string;
  imageUrl?: string;  // ユーザーアップロード画像URL（あればiconKeyより優先表示）
  craftedBy: string;
  craftedFrom: string[];
  craftedAt: number;
}

export interface UserImage {
  id: string;
  url: string;
  createdAt: number;
}

// ─── マテリアル ───────────────────────────────────────────────────────────────

export type MaterialCategory = 'stat_hp' | 'stat_atk' | 'movement' | 'attack_range' | 'skill';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  description: string;
  cost: number;
  icon: string;
  effect:
    | { type: 'stat_hp'; value: number }
    | { type: 'stat_atk'; value: number }
    | { type: 'movement'; pattern: MovementPattern }
    | { type: 'attack_range'; range: AttackRange }
    | { type: 'skill'; skill: Skill };
}

export interface OwnedMaterial {
  materialId: string;
  count: number;
}

// ─── デッキ ───────────────────────────────────────────────────────────────────

export interface DeckEntry {
  cardId: string;
  count: number;
  isCrafted: boolean;
}

export interface Deck {
  deckId: string;
  name: string;
  entries: DeckEntry[];
  createdAt: number;
  updatedAt: number;
}

// ─── ガチャ ───────────────────────────────────────────────────────────────────

export interface GachaTable {
  tableId: string;
  name: string;
  pricePerPull: number;
  pullsForBundle: number;
  bundlePrice: number;
  rarityWeights: Record<Rarity, number>;
  guaranteedRarity?: Rarity;
}

// ─── クエスト ─────────────────────────────────────────────────────────────────

export interface DialogueScene {
  speaker: string;
  iconKey?: string;
  text: string;
}

export interface Reward {
  exp: number;
  runes: number;
  cards?: { cardId: string; count: number }[];
  materials?: { materialId: string; count: number }[];
}

export interface TutorialStep {
  targetTestId?: string;
  message: string;
  allowedActions?: string[];
  highlightTestIds?: string[];
}

export interface QuestDefinition {
  questId: string;
  chapter: number;
  order: number;
  title: string;
  description: string;
  prologue?: DialogueScene[];
  epilogue?: DialogueScene[];
  enemyDeckId: string;
  enemyAiLevel: 'tutorial' | 'easy' | 'normal' | 'hard';
  specialRule?: 'use_only_militia' | 'win_in_5_turns' | null;
  reward: Reward;
  rewardReplay?: Reward;
  prerequisites: string[];
  tutorialSteps?: TutorialStep[];
}

export interface QuestProgress {
  questId: string;
  status: 'locked' | 'available' | 'cleared';
  clearedAt?: number;
  attemptCount: number;
}

// ─── Firestore インベントリ ─────────────────────────────────────────────────

export interface CardInventoryDoc {
  ownedCards: OwnedCard[];
}

export interface MaterialInventoryDoc {
  ownedMaterials: OwnedMaterial[];
}
