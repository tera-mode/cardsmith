import { registerSkill } from './registry';
import { applyStatusEffect } from '@/lib/game/helpers';

registerSkill({
  id: 'touketsu_hansha',
  displayName: '凍結反射',
  description: '被ダメ時、攻撃元を1ターン凍結',
  triggerKind: 'on_damaged',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) { return !!ctx.damagedBy && (ctx.damageAmount ?? 0) > 0; },
  onTrigger(ctx, self, state) {
    const attacker = ctx.damagedBy!;
    const next = applyStatusEffect(state, attacker.instanceId, 'frozen', 1);
    return { state: next, log: [`${self.card.name}：凍結反射！${attacker.card.name}を凍結`] };
  },
});
