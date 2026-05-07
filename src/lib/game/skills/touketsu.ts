import { registerSkill } from './registry';
import { applyStatusEffect, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'touketsu',
  displayName: '凍結',
  description: '攻撃時、対象を凍結（次ターン行動不可）',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const fresh = findUnit(state, target.instanceId);
    if (!fresh) return { state, log: [] };
    const next = applyStatusEffect(state, fresh.instanceId, 'frozen', 1);
    return { state: next, log: [`${self.card.name}：凍結！${fresh.card.name}は次ターン行動不可`] };
  },
});
