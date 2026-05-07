import { registerSkill } from './registry';
import { getEnemiesOnBoard, applyStatusEffect } from '@/lib/game/helpers';

registerSkill({
  id: 'mahi',
  displayName: '麻痺',
  description: '敵ユニット1体を1ターン行動不能にする（3回）',
  triggerKind: 'activated',
  maxUsesDefault: 3,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  getValidTargets(state, self) {
    return getEnemiesOnBoard(state, self.owner).map(e => e.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const enemy = state.board[target.row][target.col];
    if (!enemy) return { state, log: [] };
    const next = applyStatusEffect(state, enemy.instanceId, 'paralyzed', 1);
    return { state: next, log: [`${self.card.name}：麻痺！${enemy.card.name}を1ターン拘束`] };
  },
});
