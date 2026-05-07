import { registerSkill } from './registry';
import { getAlliesOnBoard, swapPositions } from '@/lib/game/helpers';

registerSkill({
  id: 'irekae',
  displayName: '位置入れ替え',
  description: '任意の味方ユニットと位置を交換（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  getValidTargets(state, self) {
    return getAlliesOnBoard(state, self.owner)
      .filter(a => a.instanceId !== self.instanceId)
      .map(a => a.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const ally = state.board[target.row][target.col];
    if (!ally || ally.owner !== self.owner) return { state, log: [] };
    const next = swapPositions(state, self.instanceId, ally.instanceId);
    return { state: next, log: [`${self.card.name}と${ally.card.name}が位置を交換`] };
  },
});
