import { registerSkill } from './registry';
import { getAlliesOnBoard, healUnit, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'haru_no_ibuki',
  displayName: '春の息吹',
  description: '自分のターン開始時、味方全員のHP+1',
  triggerKind: 'on_turn_start',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.currentTurn === self.owner;
  },
  onTrigger(_ctx, self, state) {
    const allies = getAlliesOnBoard(state, self.owner);
    let workingState = state;
    for (const ally of allies) {
      const fresh = findUnit(workingState, ally.instanceId);
      if (!fresh) continue;
      workingState = healUnit(workingState, fresh.instanceId, 1);
    }
    return { state: workingState, log: [`${self.card.name}：春の息吹！味方全員HP+1`] };
  },
});
