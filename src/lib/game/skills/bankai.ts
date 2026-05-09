import { registerSkill } from './registry';
import { healUnit, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'bankai',
  displayName: '挽回',
  description: '初めてHP半分以下になった瞬間、HP+2回復（1度きり）',
  triggerKind: 'on_damaged',
  maxUsesDefault: 1,

  shouldTrigger(ctx, self, state) {
    if (ctx.remainingUses === 0) return false;
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return false;
    return fresh.currentHp * 2 <= fresh.maxHp;
  },
  onTrigger(_ctx, self, state) {
    const next = healUnit(state, self.instanceId, 2);
    return { state: next, log: [`${self.card.name}：挽回！HP+2`] };
  },
});
