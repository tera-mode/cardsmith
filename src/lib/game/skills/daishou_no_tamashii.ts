import { registerSkill } from './registry';
import { healBase } from '@/lib/game/helpers';

registerSkill({
  id: 'daishou_no_tamashii',
  displayName: '代償の魂',
  description: '死亡時、自陣HP+2回復',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const next = healBase(state, self.owner, 2);
    return { state: next, log: [`${self.card.name}：代償の魂！自陣HP+2`] };
  },
});
