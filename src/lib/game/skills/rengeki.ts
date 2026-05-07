import { registerSkill } from './registry';
import { getEffectiveAtk, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'rengeki',
  displayName: '連撃',
  description: '攻撃時、同じ相手にもう1回ダメージ',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const freshTarget = findUnit(state, target.instanceId);
    if (!freshTarget) return { state, log: [] };

    const dmg = getEffectiveAtk(self);
    const next = applyDamage(state, { source: self, target: freshTarget, amount: dmg, tags: ['rengeki_2nd'] });
    return { state: next, log: [`${self.card.name}：連撃！2撃目 ${dmg} ダメージ`] };
  },
});
