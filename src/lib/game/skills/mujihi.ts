import { registerSkill } from './registry';
import { findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'mujihi',
  displayName: '無慈悲',
  description: '攻撃時、対象のHPが既に半分以下なら即破壊',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) { return !!ctx.attackTarget; },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const fresh = findUnit(state, target.instanceId);
    if (!fresh) return { state, log: [] };
    if (fresh.currentHp * 2 > fresh.maxHp) return { state, log: [] };
    const next = applyDamage(state, { source: self, target: fresh, amount: 999, tags: ['execute'] });
    return { state: next, log: [`${self.card.name}：無慈悲！${fresh.card.name}を即破壊`] };
  },
});
