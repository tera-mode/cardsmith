import { registerSkill } from './registry';
import { getEffectiveAtk, getLeftRightTargets, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'nagibarai',
  displayName: '薙ぎ払い',
  description: '攻撃時、攻撃対象の左右にいる敵にもATKダメージ',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const sideTargets = getLeftRightTargets(state, target.position, self);
    const dmg = getEffectiveAtk(self);

    let workingState = state;
    for (const t of sideTargets) {
      const fresh = findUnit(workingState, t.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: dmg, tags: ['sweep'] });
    }
    return { state: workingState, log: sideTargets.length > 0 ? [`${self.card.name}：薙ぎ払い！${sideTargets.length}体に追加ダメージ`] : [] };
  },
});
