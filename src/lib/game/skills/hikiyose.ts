import { registerSkill } from './registry';
import { getEnemiesInRadius, getAdjacentEmptyTowardSelf, moveUnitTo } from '@/lib/game/helpers';

registerSkill({
  id: 'hikiyose',
  displayName: '引き寄せ',
  description: '射程3以内の敵1体を自分の隣接マスに引き寄せる',
  triggerKind: 'activated',
  maxUsesDefault: 'infinite',

  canActivate(state, self, ctx) {
    return ctx.remainingUses !== 0 && getEnemiesInRadius(state, self.position, 3, self.owner).length > 0;
  },
  getValidTargets(state, self) {
    return getEnemiesInRadius(state, self.position, 3, self.owner).map(e => e.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const enemy = state.board[target.row][target.col];
    if (!enemy) return { state, log: [] };
    const destPos = getAdjacentEmptyTowardSelf(state, self.position, enemy.position);
    if (!destPos) return { state, log: [`引き寄せ先が確保できなかった`] };
    const next = moveUnitTo(state, enemy.instanceId, destPos);
    return { state: next, log: [`${self.card.name}：引き寄せ！${enemy.card.name}を手前に`] };
  },
});
