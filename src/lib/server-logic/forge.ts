import { OwnedCard, OwnedMaterial, CraftedCard } from '@/lib/types/meta';
import { rarityFromCost, getCostCapForLevel } from '@/lib/data/economy';
import { MATERIAL_MAP } from '@/lib/data/materials';
import { Card, MovementPattern, AttackRange, Skill } from '@/lib/types/game';

export interface ForgeSpec {
  name: string;
  iconKey: string;
  imageUrl?: string;  // ユーザーアップロード画像URL
  movementMaterialId: string;
  attackRangeMaterialId: string;
  atkMaterialIds: string[];
  hpMaterialIds: string[];
  skillMaterialId?: string;
}

export interface ForgeValidation {
  valid: boolean;
  totalCost: number;
  atk: number;
  hp: number;
  errors: string[];
}

export function validateForge(spec: Partial<ForgeSpec>, playerLevel: number): ForgeValidation {
  const errors: string[] = [];
  let totalCost = 0;
  let atk = 0;
  let hp = 0;

  if (!spec.name?.trim()) errors.push('カード名を入力してください');
  if (spec.name && spec.name.length > 15) errors.push('カード名は15文字以内です');
  if (!spec.movementMaterialId) errors.push('移動を選択してください');
  if (!spec.attackRangeMaterialId) errors.push('攻撃範囲を選択してください');
  if (!spec.hpMaterialIds?.length) errors.push('HPを1つ以上選択してください');

  const allIds = [
    spec.movementMaterialId,
    spec.attackRangeMaterialId,
    ...(spec.atkMaterialIds ?? []),
    ...(spec.hpMaterialIds ?? []),
    spec.skillMaterialId,
  ].filter(Boolean) as string[];

  for (const id of allIds) {
    const mat = MATERIAL_MAP[id];
    if (mat) totalCost += mat.cost;
  }

  for (const id of spec.atkMaterialIds ?? []) {
    const mat = MATERIAL_MAP[id];
    if (mat?.effect.type === 'stat_atk') atk += mat.effect.value;
  }
  for (const id of spec.hpMaterialIds ?? []) {
    const mat = MATERIAL_MAP[id];
    if (mat?.effect.type === 'stat_hp') hp += mat.effect.value;
  }

  if (hp < 1) errors.push('HP は 1 以上必要です');

  const cap = getCostCapForLevel(playerLevel);
  if (totalCost > cap) errors.push(`コストが上限 ${cap} を超えています（現在 ${totalCost}）`);

  return { valid: errors.length === 0, totalCost, atk, hp, errors };
}

export function buildCraftedCard(
  spec: ForgeSpec,
  userId: string,
  validation: ForgeValidation
): CraftedCard {
  const movMat = MATERIAL_MAP[spec.movementMaterialId];
  const atkRngMat = MATERIAL_MAP[spec.attackRangeMaterialId];
  const skillMat = spec.skillMaterialId ? MATERIAL_MAP[spec.skillMaterialId] : null;

  const movement = movMat?.effect.type === 'movement'
    ? movMat.effect.pattern
    : ({ type: 'step', directions: [{ dx: 0, dy: -1 }] } as MovementPattern);

  const attackRange = atkRngMat?.effect.type === 'attack_range'
    ? atkRngMat.effect.range
    : ({ type: 'step', directions: [{ dx: 0, dy: -1 }] } as AttackRange);

  const skill = skillMat?.effect.type === 'skill' ? skillMat.effect.skill : undefined;

  const craftedFrom = [
    spec.movementMaterialId,
    spec.attackRangeMaterialId,
    ...(spec.atkMaterialIds ?? []),
    ...(spec.hpMaterialIds ?? []),
    ...(spec.skillMaterialId ? [spec.skillMaterialId] : []),
  ];

  const now = Date.now();
  const card: CraftedCard = {
    instanceId: `crafted_${userId}_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: spec.name.trim(),
    cost: validation.totalCost,
    movement,
    attackRange,
    atk: validation.atk,
    hp: Math.max(1, validation.hp),
    rarity: rarityFromCost(validation.totalCost),
    iconKey: spec.iconKey,
    craftedBy: userId,
    craftedFrom,
    craftedAt: now,
  };
  if (spec.imageUrl) card.imageUrl = spec.imageUrl;
  if (skill) card.skill = skill;
  return card;
}

// CraftedCard → ゲーム内 Card 型に変換
export function craftedToGameCard(crafted: CraftedCard): Card {
  const card: Card = {
    id: crafted.instanceId,
    name: crafted.name,
    cost: crafted.cost,
    movement: crafted.movement,
    attackRange: crafted.attackRange,
    atk: crafted.atk,
    hp: crafted.hp,
  };
  if (crafted.skill) card.skill = crafted.skill;
  return card;
}

export function consumeMaterialsForForge(
  ownedMaterials: OwnedMaterial[],
  spec: ForgeSpec
): OwnedMaterial[] {
  const toConsume: Record<string, number> = {};
  const ids = [
    spec.movementMaterialId,
    spec.attackRangeMaterialId,
    ...(spec.atkMaterialIds ?? []),
    ...(spec.hpMaterialIds ?? []),
    ...(spec.skillMaterialId ? [spec.skillMaterialId] : []),
  ];
  for (const id of ids) {
    toConsume[id] = (toConsume[id] ?? 0) + 1;
  }
  return ownedMaterials
    .map(m => ({
      ...m,
      count: m.count - (toConsume[m.materialId] ?? 0),
    }))
    .filter(m => m.count > 0);
}
