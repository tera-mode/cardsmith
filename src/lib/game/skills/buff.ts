import { registerSkill } from './registry';
import { incrementAtkBuff, getAlliesOnBoard } from '@/lib/game/helpers';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/game/rules';

registerSkill({
  id: 'buff',
  displayName: '強化',
  description: '任意の味方ユニット1体のATK永続+1（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) {
    return ctx.remainingUses !== 0;
  },
  getValidTargets(state, self) {
    return getAlliesOnBoard(state, self.owner)
      .filter(u => u.instanceId !== self.instanceId)
      .map(u => u.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const unit = state.board[target.row][target.col];
    if (!unit || unit.owner !== self.owner) return { state, log: [] };
    const next = incrementAtkBuff(state, unit.instanceId, 1);
    return { state: next, log: [`${self.card.name}：${unit.card.name}を強化！ATK+1`] };
  },
});
