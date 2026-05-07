import { registerSkill } from './registry';
import { silenceUnit, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'chinmoku',
  displayName: '沈黙',
  description: '攻撃時、対象のスキルを封印',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const fresh = findUnit(state, target.instanceId);
    if (!fresh || !fresh.card.skill) return { state, log: [] };
    const next = silenceUnit(state, fresh.instanceId);
    return { state: next, log: [`${self.card.name}：沈黙！${fresh.card.name}のスキルを封じた`] };
  },
});
