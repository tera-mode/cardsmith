import type { Archetype } from '@/lib/game/decks';
import { QUEST_MAP } from '@/lib/data/quests';

export function getArchetypeFromQuestId(questId?: string): Archetype | null {
  if (!questId) return null;
  const match = questId.match(/^q(sei|mei|shin|en|sou|kou)_/);
  return match ? (match[1] as Archetype) : null;
}

// chapter 番号 → archetype
const CHAPTER_ARCHETYPE: Record<number, Archetype> = {
  1: 'sei', 2: 'mei', 3: 'shin', 4: 'en', 5: 'sou', 6: 'kou',
};

export function getArchetypeFromChapter(chapter: number): Archetype | null {
  return CHAPTER_ARCHETYPE[chapter] ?? null;
}

export function getBattleBgUrl(archetype: Archetype | null): string {
  if (archetype) return `/images/backgrounds/bg_${archetype}.jpg`;
  return '/images/backgrounds/board.jpg';
}
