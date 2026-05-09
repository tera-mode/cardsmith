import { registerSkill } from './registry';
import { getEnemiesOnBoard, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'rensajumon',
  displayName: '連鎖呪文',
  description: '味方がスキルを使うたびにランダムな敵に1ダメージ',
  triggerKind: 'on_skill_used',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.skillUser?.owner === self.owner;
  },
  onTrigger(_ctx, self, state) {
    const enemies = getEnemiesOnBoard(state, self.owner);
    if (!enemies.length) return { state, log: [] };
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const fresh = findUnit(state, self.instanceId);
    const next = applyDamage(state, { source: fresh, target, amount: 1, tags: ['spell'] });
    return { state: next, log: [`${self.card.name}：連鎖呪文！${target.card.name}に1ダメ`] };
  },
});
