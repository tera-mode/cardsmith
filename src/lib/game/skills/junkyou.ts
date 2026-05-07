import { registerSkill } from './registry';
import { getAlliesOnBoard, healUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'junkyou',
  displayName: '殉教',
  description: '死亡時、味方全員のHPを2回復',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const allies = getAlliesOnBoard(state, self.owner).filter(a => a.instanceId !== self.instanceId);
    let workingState = state;
    for (const ally of allies) {
      workingState = healUnit(workingState, ally.instanceId, 2);
    }
    return { state: workingState, log: [`${self.card.name}：殉教！味方${allies.length}体が2回復`] };
  },
});
