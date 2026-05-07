import { registerSkill } from './registry';
import { scheduleRevival } from '@/lib/game/helpers';

registerSkill({
  id: 'fukkatsu',
  displayName: '復活',
  description: '死亡時、次のターン開始時に同じ場所で復活する（1回）',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const next = scheduleRevival(state, self.instanceId);
    return { state: next, log: [`${self.card.name}：復活の予約...次ターンに蘇る`] };
  },
});
