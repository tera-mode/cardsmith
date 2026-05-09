import { registerSkill } from './registry';
import { getAdjacent8Allies, findUnit } from '@/lib/game/helpers';
import { addAuraAtk } from '@/lib/game/aura';

registerSkill({
  id: 'kokou',
  displayName: '孤高',
  description: '周囲8方向に味方がいない時、ATK+3',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  applyAura(state, self) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return state;
    const adjacentAllies = getAdjacent8Allies(state, fresh.position, fresh.owner)
      .filter(u => u.instanceId !== fresh.instanceId);
    if (adjacentAllies.length === 0) return addAuraAtk(state, self.instanceId, 3);
    return state;
  },
});
