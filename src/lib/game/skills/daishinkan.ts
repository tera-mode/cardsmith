import { registerSkill } from './registry';
import { getEnemiesOnBoard, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'daishinkan',
  displayName: '大震撼',
  description: '全ての敵に1ダメージ（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  resolve(state, self) {
    const enemies = getEnemiesOnBoard(state, self.owner);
    let workingState = state;
    for (const enemy of enemies) {
      const fresh = findUnit(workingState, enemy.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: 1, tags: ['earthquake'] });
    }
    return { state: workingState, log: [`${self.card.name}：大震撼！敵${enemies.length}体に1ダメージ`] };
  },
});
