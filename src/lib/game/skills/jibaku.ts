import { registerSkill } from './registry';
import { getAdjacent8Enemies, getEffectiveAtk, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'jibaku',
  displayName: '自爆',
  description: '自分を犠牲に周囲8マスの敵にATK×2ダメージ（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  resolve(state, self) {
    const enemies = getAdjacent8Enemies(state, self.position, self.owner);
    const dmg = getEffectiveAtk(self) * 2;
    let workingState = state;
    for (const enemy of enemies) {
      const fresh = findUnit(workingState, enemy.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: dmg, tags: ['jibaku'] });
    }
    // 自分自身も死亡
    const selfFresh = findUnit(workingState, self.instanceId);
    if (selfFresh) {
      workingState = applyDamage(workingState, { source: null, target: selfFresh, amount: 999, tags: ['jibaku_source'] });
    }
    return { state: workingState, log: [`${self.card.name}：自爆！周囲に${dmg}ダメージ`] };
  },
});
