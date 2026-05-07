import { registerSkill } from './registry';
import { getAlliesOnBoard } from '@/lib/game/helpers';
import { addAuraAtk } from '@/lib/game/aura';

registerSkill({
  id: 'senki',
  displayName: '戦旗',
  description: '味方全員（自分以外）のATK+1（常時オーラ）',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  applyAura(state, self) {
    const allies = getAlliesOnBoard(state, self.owner).filter(a => a.instanceId !== self.instanceId);
    let workingState = state;
    for (const ally of allies) {
      workingState = addAuraAtk(workingState, ally.instanceId, 1);
    }
    return workingState;
  },
});
