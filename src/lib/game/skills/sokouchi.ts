import { registerSkill } from './registry';
import { getAdjacent4Enemies, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'sokouchi',
  displayName: '伏撃',
  description: '召喚時、隣接する敵ユニット全員に1ダメージ',
  triggerKind: 'on_summon',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const adjacent = getAdjacent4Enemies(state, self.position, self.owner);
    let workingState = state;
    for (const enemy of adjacent) {
      const fresh = findUnit(workingState, enemy.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: 1, tags: ['ambush'] });
    }
    return {
      state: workingState,
      log: adjacent.length > 0 ? [`${self.card.name}：伏撃！隣接敵${adjacent.length}体に1ダメージ`] : [],
    };
  },
});
