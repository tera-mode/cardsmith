import { registerSkill } from './registry';
import { healBase } from '@/lib/game/helpers';

registerSkill({
  id: 'kangei_no_gi',
  displayName: '歓迎の儀',
  description: '味方が召喚されるたびに自陣HP+1',
  triggerKind: 'on_summon_ally',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const next = healBase(state, self.owner, 1);
    return { state: next, log: [`${self.card.name}：歓迎の儀！自陣HP+1`] };
  },
});
