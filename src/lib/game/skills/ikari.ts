import { registerSkill } from './registry';
import { incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'ikari',
  displayName: '怒り',
  description: '被ダメージ時、自身のATK+1',
  triggerKind: 'on_damaged',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return (ctx.damageAmount ?? 0) > 0;
  },
  onTrigger(_ctx, self, state) {
    const next = incrementAtkBuff(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：怒り！ATK+1`] };
  },
});
