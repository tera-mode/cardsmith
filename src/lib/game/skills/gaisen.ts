import { registerSkill } from './registry';
import { getAlliesOnBoard, incrementMaxHpAndCurrentHp } from '@/lib/game/helpers';

registerSkill({
  id: 'gaisen',
  displayName: '凱旋',
  description: '召喚時、味方全員のHP+1',
  triggerKind: 'on_summon',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const allies = getAlliesOnBoard(state, self.owner).filter(a => a.instanceId !== self.instanceId);
    let workingState = state;
    for (const ally of allies) {
      workingState = incrementMaxHpAndCurrentHp(workingState, ally.instanceId, 1);
    }
    return { state: workingState, log: [`${self.card.name}：凱旋！味方${allies.length}体のHP+1`] };
  },
});
