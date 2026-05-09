import { registerSkill } from './registry';
import { healBase } from '@/lib/game/helpers';

registerSkill({
  id: 'shokubai',
  displayName: '触媒',
  description: '味方がスキルを使うたびに自陣HP+1（無限）',
  triggerKind: 'on_skill_used',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.skillUser?.owner === self.owner;
  },
  onTrigger(_ctx, self, state) {
    const next = healBase(state, self.owner, 1);
    return { state: next, log: [`${self.card.name}：触媒！自陣HP+1`] };
  },
});
