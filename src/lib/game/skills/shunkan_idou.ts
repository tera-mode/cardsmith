import { registerSkill } from './registry';
import { getAllEmptyPositions, moveUnitTo } from '@/lib/game/helpers';

registerSkill({
  id: 'shunkan_idou',
  displayName: '瞬間移動',
  description: '空きマス任意の場所へ瞬間移動（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  getValidTargets(state) { return getAllEmptyPositions(state); },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const next = moveUnitTo(state, self.instanceId, target);
    return { state: next, log: [`${self.card.name}：瞬間移動！`] };
  },
});
