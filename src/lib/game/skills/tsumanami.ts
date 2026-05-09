import { registerSkill } from './registry';
import { getEnemiesOnBoard, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'tsumanami',
  displayName: '津波',
  description: '盤上の敵全員に2ダメージ（2回）',
  triggerKind: 'activated',
  maxUsesDefault: 2,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  resolve(state, self) {
    const enemies = getEnemiesOnBoard(state, self.owner);
    let workingState = state;
    for (const enemy of enemies) {
      const fresh = findUnit(workingState, enemy.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: 2, tags: ['wave'] });
    }
    return { state: workingState, log: [`${self.card.name}：津波！敵${enemies.length}体に2ダメージ`] };
  },
});
