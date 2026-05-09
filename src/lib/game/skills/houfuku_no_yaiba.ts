import { registerSkill } from './registry';
import { getNearestEnemy, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'houfuku_no_yaiba',
  displayName: '報復の刃',
  description: '自陣がダメージを受けるたびに最近接の敵に1ダメージ',
  triggerKind: 'on_base_damaged',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const enemy = getNearestEnemy(state, fresh.position, fresh.owner);
    if (!enemy) return { state, log: [] };
    const next = applyDamage(state, { source: fresh, target: enemy, amount: 1, tags: ['retaliation'] });
    return { state: next, log: [`${self.card.name}：報復の刃！${enemy.card.name}に1ダメ`] };
  },
});
