import { registerSkill } from './registry';
import { getEnemiesOnBoard, removeUnitFromBoard } from '@/lib/game/helpers';

registerSkill({
  id: 'soukan',
  displayName: '送還',
  description: '隣接する敵1体を手札に戻す（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    return getEnemiesOnBoard(state, self.owner).some(e => {
      const dr = Math.abs(e.position.row - self.position.row);
      const dc = Math.abs(e.position.col - self.position.col);
      return dr + dc === 1;
    });
  },
  getValidTargets(state, self) {
    return getEnemiesOnBoard(state, self.owner)
      .filter(e => {
        const dr = Math.abs(e.position.row - self.position.row);
        const dc = Math.abs(e.position.col - self.position.col);
        return dr + dc === 1;
      })
      .map(e => e.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const enemy = state.board[target.row][target.col];
    if (!enemy || enemy.owner === self.owner) return { state, log: [] };
    let s = removeUnitFromBoard(state, enemy.instanceId);
    const returnCard = enemy.card;
    if (enemy.owner === 'player') {
      s = { ...s, player: { ...s.player, hand: [...s.player.hand, returnCard] } };
    } else {
      s = { ...s, ai: { ...s.ai, hand: [...s.ai.hand, returnCard] } };
    }
    return { state: s, log: [`${self.card.name}：送還！${enemy.card.name}を手札に戻した`] };
  },
});
