import { registerSkill } from './registry';
import { incrementAtkBuff, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'kobu_summon',
  displayName: '鼓舞召喚',
  description: '味方が召喚されるたびに、その味方のATK+1',
  triggerKind: 'on_summon_ally',
  maxUsesDefault: 'infinite',

  onTrigger(ctx, self, state) {
    const ally = ctx.summonedAlly!;
    const fresh = findUnit(state, ally.instanceId);
    if (!fresh) return { state, log: [] };
    const next = incrementAtkBuff(state, fresh.instanceId, 1);
    return { state: next, log: [`${self.card.name}：鼓舞召喚！${fresh.card.name}のATK+1`] };
  },
});
