import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './config';
import { QuestProgress } from '@/lib/types/meta';
import { QUESTS } from '@/lib/data/quests';

export async function getQuestProgress(userId: string): Promise<QuestProgress[]> {
  const col = collection(db, 'users', userId, 'quests');
  const snap = await getDocs(col);
  const saved: Record<string, QuestProgress> = {};
  snap.docs.forEach(d => { saved[d.id] = d.data() as QuestProgress; });

  return QUESTS.map(q => {
    const savedEntry = saved[q.questId];
    if (!savedEntry) {
      const isAvailable = q.prerequisites.length === 0;
      return { questId: q.questId, status: isAvailable ? 'available' : 'locked', attemptCount: 0 };
    }
    // prerequisites が変更されて条件を満たすようになった locked クエストを再評価
    if (savedEntry.status === 'locked') {
      const allMet = q.prerequisites.length === 0
        || q.prerequisites.every(pid => saved[pid]?.status === 'cleared');
      if (allMet) return { ...savedEntry, status: 'available' };
    }
    return savedEntry;
  });
}

export async function saveQuestProgress(userId: string, progress: QuestProgress): Promise<void> {
  const ref = doc(db, 'users', userId, 'quests', progress.questId);
  await setDoc(ref, progress);
}

export function computeQuestStatuses(
  current: QuestProgress[],
  clearedId: string
): QuestProgress[] {
  const map: Record<string, QuestProgress> = {};
  for (const p of current) map[p.questId] = p;

  // クリアしたクエストを更新
  if (map[clearedId]) {
    map[clearedId] = { ...map[clearedId], status: 'cleared', clearedAt: Date.now() };
  }

  // 前提が満たされたクエストを解放
  for (const q of QUESTS) {
    if (map[q.questId]?.status !== 'locked') continue;
    const allCleared = q.prerequisites.every(
      pid => map[pid]?.status === 'cleared'
    );
    if (allCleared) {
      map[q.questId] = { ...map[q.questId], status: 'available' };
    }
  }

  return Object.values(map);
}
