import { registerSkill } from './registry';
import { getEnemiesOnBoard, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

// "behind" an enemy: if owner=player, attacker must be north of target (row <); if owner=ai, south (row >)
function isBehind(selfRow: number, targetRow: number, owner: 'player' | 'ai'): boolean {
  return owner === 'player' ? selfRow < targetRow : selfRow > targetRow;
}

registerSkill({
  id: 'ansatsu',
  displayName: '暗殺',
  description: '背後にいる敵を即死させる（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    return getEnemiesOnBoard(state, self.owner)
      .some(e => isBehind(self.position.row, e.position.row, self.owner));
  },
  getValidTargets(state, self) {
    return getEnemiesOnBoard(state, self.owner)
      .filter(e => isBehind(self.position.row, e.position.row, self.owner))
      .map(e => e.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const enemy = state.board[target.row][target.col];
    if (!enemy || enemy.owner === self.owner) return { state, log: [] };
    const next = applyDamage(state, { source: fresh, target: enemy, amount: 9999, tags: ['instant_kill'] });
    return { state: next, log: [`${self.card.name}：暗殺！${enemy.card.name}を即死させた`] };
  },
});
