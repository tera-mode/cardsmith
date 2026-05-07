import { registerSkill } from './registry';
import { addAuraAtk } from '@/lib/game/aura';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'kyousenshi',
  displayName: '狂戦士化',
  description: 'HPが半分以下の時、ATK+2',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  applyAura(state, self) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return state;
    if (fresh.currentHp * 2 > fresh.maxHp) return state; // HP半分超なら無効
    return addAuraAtk(state, self.instanceId, 2);
  },
});
