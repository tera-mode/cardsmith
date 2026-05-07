import { registerSkill } from './registry';
import { healUnit, getAdjacent4Allies } from '@/lib/game/helpers';

registerSkill({
  id: 'heal',
  displayName: '治癒',
  description: '隣接する味方1体のHP+2（無限）',
  triggerKind: 'activated',
  maxUsesDefault: 'infinite',

  canActivate(_state, _self, ctx) {
    return ctx.remainingUses !== 0;
  },
  getValidTargets(state, self) {
    return getAdjacent4Allies(state, self.position, self.owner).map(u => u.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const unit = state.board[target.row][target.col];
    if (!unit || unit.owner !== self.owner) return { state, log: [] };
    const next = healUnit(state, unit.instanceId, 2);
    return { state: next, log: [`${self.card.name}：${unit.card.name}を治癒！HP+2`] };
  },
});
