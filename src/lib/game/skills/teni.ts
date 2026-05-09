import { registerSkill } from './registry';
import { getAllEmptyPositions, findUnit } from '@/lib/game/helpers';
import { moveUnitTo } from '@/lib/game/helpers';

registerSkill({
  id: 'teni',
  displayName: '転移',
  description: '被ダメ時、ランダムな空きマスに瞬間移動',
  triggerKind: 'on_damaged',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) { return (ctx.damageAmount ?? 0) > 0; },
  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const empties = getAllEmptyPositions(state);
    if (!empties.length) return { state, log: [] };
    const dest = empties[Math.floor(Math.random() * empties.length)];
    const next = moveUnitTo(state, fresh.instanceId, dest);
    return { state: next, log: [`${self.card.name}：転移！`] };
  },
});
