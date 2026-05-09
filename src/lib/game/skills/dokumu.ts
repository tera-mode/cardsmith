import { registerSkill } from './registry';
import { getAdjacent4Enemies, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'dokumu',
  displayName: '毒霧',
  description: '自ターン終了時、隣接全敵に1ダメージ',
  triggerKind: 'on_turn_end',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) { return ctx.currentTurn === self.owner; },
  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const enemies = getAdjacent4Enemies(state, fresh.position, fresh.owner);
    let s = state;
    for (const e of enemies) {
      const fe = findUnit(s, e.instanceId);
      if (fe) s = applyDamage(s, { source: fresh, target: fe, amount: 1, tags: ['poison'] });
    }
    return { state: s, log: enemies.length ? [`${self.card.name}：毒霧！隣接敵${enemies.length}体に1ダメ`] : [] };
  },
});
