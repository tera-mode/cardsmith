import { GachaTable, Rarity } from '@/lib/types/meta';
import { GACHA_PRICE_SINGLE, GACHA_PRICE_TEN } from './economy';

export const STANDARD_GACHA: GachaTable = {
  tableId: 'standard',
  name: '標準召喚',
  pricePerPull: GACHA_PRICE_SINGLE,
  pullsForBundle: 10,
  bundlePrice: GACHA_PRICE_TEN,
  rarityWeights: { C: 70, R: 22, SR: 7, SSR: 1 },
  guaranteedRarity: 'R',
};

// レアリティ別のカードID
export const GACHA_POOL: Record<Rarity, string[]> = {
  C:   ['militia', 'light_infantry', 'assault_soldier', 'scout', 'spear_soldier'],
  R:   ['heavy_infantry', 'combat_soldier', 'archer'],
  SR:  ['guard', 'healer', 'cavalry', 'cannon'],
  SSR: ['defender'],
};
