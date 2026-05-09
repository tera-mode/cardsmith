import { registerSkill } from './registry';
import { healUnit, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'shukufuku',
  displayName: '祝福',
  description: '味方が召喚されるたびに、その味方のHP+1',
  triggerKind: 'on_summon_ally',
  maxUsesDefault: 'infinite',

  onTrigger(ctx, self, state) {
    const ally = ctx.summonedAlly!;
    const fresh = findUnit(state, ally.instanceId);
    if (!fresh) return { state, log: [] };
    const next = healUnit(state, fresh.instanceId, 1);
    return { state: next, log: [`${self.card.name}：祝福！${fresh.card.name}のHP+1`] };
  },
});
