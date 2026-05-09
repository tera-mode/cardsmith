import { registerSkill } from './registry';
import { getAlliesOnBoard, findUnit, incrementAtkBuff, incrementMaxHpAndCurrentHp } from '@/lib/game/helpers';

registerSkill({
  id: 'kakusei',
  displayName: '覚醒',
  description: '味方1体のATK+2、HP+2（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    return getAlliesOnBoard(state, self.owner).some(a => a.instanceId !== self.instanceId);
  },
  getValidTargets(state, self) {
    return getAlliesOnBoard(state, self.owner)
      .filter(a => a.instanceId !== self.instanceId)
      .map(a => a.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const ally = state.board[target.row][target.col];
    if (!ally || ally.owner !== self.owner) return { state, log: [] };
    let s = incrementAtkBuff(state, ally.instanceId, 2);
    s = incrementMaxHpAndCurrentHp(s, ally.instanceId, 2);
    const fresh = findUnit(s, ally.instanceId);
    return { state: s, log: [`${self.card.name}：覚醒！${fresh?.card.name ?? ally.card.name} ATK+2, HP+2`] };
  },
});
