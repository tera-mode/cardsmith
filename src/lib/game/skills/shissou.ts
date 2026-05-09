import { registerSkill } from './registry';
import { incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'shissou',
  displayName: '疾走',
  description: '移動するたびにATK+1（最大3回）',
  triggerKind: 'on_move',
  maxUsesDefault: 3,

  onTrigger(_ctx, self, state) {
    const next = incrementAtkBuff(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：疾走！ATK+1`] };
  },
});
