import { registerSkill } from './registry';
import { getAdjacent8Allies, incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'shinigiwa',
  displayName: '死に際の咆哮',
  description: '死亡時、隣接する味方全員のATK+2',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const allies = getAdjacent8Allies(state, self.position, self.owner);
    let workingState = state;
    for (const ally of allies) {
      workingState = incrementAtkBuff(workingState, ally.instanceId, 2);
    }
    return { state: workingState, log: [`${self.card.name}：死に際の咆哮！隣接味方${allies.length}体のATK+2`] };
  },
});
