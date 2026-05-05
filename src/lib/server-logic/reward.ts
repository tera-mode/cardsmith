import { PlayerProfile, OwnedCard, OwnedMaterial, Reward } from '@/lib/types/meta';
import { addExp, addRunes } from './profile';

export interface InventorySnapshot {
  ownedCards: OwnedCard[];
  ownedMaterials: OwnedMaterial[];
}

export interface ApplyRewardResult {
  profile: PlayerProfile;
  inventory: InventorySnapshot;
  leveledUp: boolean;
  levelsGained: number;
}

export function applyReward(
  profile: PlayerProfile,
  inventory: InventorySnapshot,
  reward: Reward
): ApplyRewardResult {
  let p = addRunes(profile, reward.runes);
  const { profile: p2, leveledUp, levelsGained } = addExp(p, reward.exp);
  p = p2;

  let cards = [...inventory.ownedCards];
  for (const rc of reward.cards ?? []) {
    const idx = cards.findIndex(c => c.cardId === rc.cardId && !c.isCrafted);
    if (idx >= 0) {
      cards[idx] = { ...cards[idx], count: cards[idx].count + rc.count };
    } else {
      cards.push({ cardId: rc.cardId, count: rc.count, isCrafted: false, acquiredAt: Date.now() });
    }
  }

  let materials = [...inventory.ownedMaterials];
  for (const rm of reward.materials ?? []) {
    const idx = materials.findIndex(m => m.materialId === rm.materialId);
    if (idx >= 0) {
      materials[idx] = { ...materials[idx], count: materials[idx].count + rm.count };
    } else {
      materials.push({ materialId: rm.materialId, count: rm.count });
    }
  }

  return {
    profile: p,
    inventory: { ownedCards: cards, ownedMaterials: materials },
    leveledUp,
    levelsGained,
  };
}
