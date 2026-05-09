import { registerSkill } from './registry';
import { incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'kyoumei',
  displayName: '共鳴',
  description: '味方が召喚されるたびに自分のATK+1',
  triggerKind: 'on_summon_ally',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const next = incrementAtkBuff(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：共鳴！ATK+1`] };
  },
});
