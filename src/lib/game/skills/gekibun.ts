import { registerSkill } from './registry';
import { getAlliesOnBoard, incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'gekibun',
  displayName: '檄文',
  description: '自陣がダメージを受けるたびに味方全員のATK+1',
  triggerKind: 'on_base_damaged',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    let s = state;
    const allies = getAlliesOnBoard(s, self.owner);
    for (const ally of allies) {
      s = incrementAtkBuff(s, ally.instanceId, 1);
    }
    return { state: s, log: allies.length ? [`${self.card.name}：檄文！味方${allies.length}体のATK+1`] : [] };
  },
});
