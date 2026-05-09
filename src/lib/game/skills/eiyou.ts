import { registerSkill } from './registry';
import { getAlliesOnBoard, incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'eiyou',
  displayName: '栄養',
  description: '死亡時、味方全員のATK+1（永続バフ）',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const allies = getAlliesOnBoard(state, self.owner);
    let s = state;
    for (const ally of allies) s = incrementAtkBuff(s, ally.instanceId, 1);
    return { state: s, log: [`${self.card.name}：栄養！味方${allies.length}体のATK+1`] };
  },
});
