import { registerSkill } from './registry';
import { getEnemiesOnBoard, getEffectiveAtk, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'chodan',
  displayName: '跳弾',
  description: '攻撃時、ATK÷3のダメージがランダムな別の敵1体にも飛ぶ',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) { return !!ctx.attackTarget; },
  onTrigger(ctx, self, state) {
    const chainDmg = Math.floor(getEffectiveAtk(self) / 3);
    if (chainDmg <= 0) return { state, log: [] };
    const enemies = getEnemiesOnBoard(state, self.owner)
      .filter(e => e.instanceId !== ctx.attackTarget?.instanceId);
    if (!enemies.length) return { state, log: [] };
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const fresh = findUnit(state, target.instanceId);
    if (!fresh) return { state, log: [] };
    const next = applyDamage(state, { source: self, target: fresh, amount: chainDmg, tags: ['chain'] });
    return { state: next, log: [`${self.card.name}：跳弾！${fresh.card.name}に${chainDmg}ダメージ`] };
  },
});
