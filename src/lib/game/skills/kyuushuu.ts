import { registerSkill } from './registry';
import { healUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'kyuushuu',
  displayName: '吸収',
  description: '敵がスキルを使うたびにHP+1',
  triggerKind: 'on_skill_used',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.skillUser?.owner !== self.owner;
  },
  onTrigger(_ctx, self, state) {
    const next = healUnit(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：吸収！敵スキルに反応してHP+1`] };
  },
});
