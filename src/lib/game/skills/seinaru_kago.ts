import { registerSkill } from './registry';
import { getAlliesOnBoard } from '@/lib/game/helpers';
import { addAuraMaxHp } from '@/lib/game/aura';

registerSkill({
  id: 'seinaru_kago',
  displayName: '聖なる加護',
  description: '味方全員のmaxHP+1（常時オーラ）',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  applyAura(state, self) {
    const allies = getAlliesOnBoard(state, self.owner);
    let workingState = state;
    for (const ally of allies) {
      workingState = addAuraMaxHp(workingState, ally.instanceId, 1);
    }
    return workingState;
  },
});
