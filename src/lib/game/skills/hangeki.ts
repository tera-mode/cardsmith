import { registerSkill } from './registry';
import { getEffectiveAtk } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'hangeki',
  displayName: '反撃',
  description: '攻撃を受けた直後、攻撃元にATK分のダメージ',
  triggerKind: 'on_damaged',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    // 反撃ループ防止: counter タグのダメージでは発火しない
    return !!ctx.damagedBy;
  },
  onTrigger(ctx, self, state) {
    const attacker = ctx.damagedBy!;
    const dmg = getEffectiveAtk(self);
    const next = applyDamage(state, { source: self, target: attacker, amount: dmg, tags: ['counter'] });
    return { state: next, log: [`${self.card.name}：反撃！${attacker.card.name}に${dmg}ダメージ`] };
  },
});
