import { registerSkill } from './registry';
import { getAlliesOnBoard } from '@/lib/game/helpers';
import { addAuraAtk } from '@/lib/game/aura';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'mure',
  displayName: '群れ',
  description: '同流派の味方（自分含む）が3体以上の時、ATK+2',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  applyAura(state, self) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return state;
    const attr = fresh.card.attribute;
    const allies = getAlliesOnBoard(state, fresh.owner).filter(u => u.card.attribute === attr);
    if (allies.length >= 3) return addAuraAtk(state, self.instanceId, 2);
    return state;
  },
});
