import { registerSkill } from './registry';
import { getEffectiveAtk, getAdjacent4Enemies, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'rensa_raigeki',
  displayName: '連鎖雷撃',
  description: '攻撃時、攻撃対象の隣接敵1体にATK/2の連鎖ダメージ',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    // 攻撃対象の隣接敵を探す（攻撃対象自身を除く）
    const chainTargets = getAdjacent4Enemies(state, target.position, self.owner)
      .filter(e => e.instanceId !== target.instanceId);

    if (chainTargets.length === 0) return { state, log: [] };

    const chainTarget = chainTargets[0];
    const freshChain = findUnit(state, chainTarget.instanceId);
    if (!freshChain) return { state, log: [] };

    const dmg = Math.max(1, Math.floor(getEffectiveAtk(self) / 2));
    const next = applyDamage(state, { source: self, target: freshChain, amount: dmg, tags: ['chain'] });
    return { state: next, log: [`${self.card.name}：連鎖雷撃！${freshChain.card.name}に${dmg}ダメージ`] };
  },
});
