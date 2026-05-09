import { registerSkill } from './registry';
import { incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'chuusei',
  displayName: '忠誠',
  description: '自陣がダメージを受けるたびに自分のATK+2',
  triggerKind: 'on_base_damaged',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const next = incrementAtkBuff(state, self.instanceId, 2);
    return { state: next, log: [`${self.card.name}：忠誠！自陣ダメージに呼応しATK+2`] };
  },
});
