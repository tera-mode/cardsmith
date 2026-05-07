import { registerSkill } from './registry';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'hansha',
  displayName: '反射',
  description: '被ダメージ時、同量のダメージを攻撃元に返す',
  triggerKind: 'on_damaged',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    // 反射ダメージによる再トリガーを防止
    return !!ctx.damagedBy && (ctx.damageAmount ?? 0) > 0;
  },
  onTrigger(ctx, self, state) {
    const attacker = ctx.damagedBy!;
    const dmg = ctx.damageAmount!;
    const next = applyDamage(state, { source: self, target: attacker, amount: dmg, tags: ['reflection'] });
    return { state: next, log: [`${self.card.name}：反射！${attacker.card.name}に${dmg}ダメージ`] };
  },
});
