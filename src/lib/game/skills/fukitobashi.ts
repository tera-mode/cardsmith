import { registerSkill } from './registry';
import { getDirectionFromTo, findUnit, moveUnitTo } from '@/lib/game/helpers';
import { isInBounds } from '@/lib/game/rules';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'fukitobashi',
  displayName: '吹き飛ばし',
  description: '攻撃時、対象を1マス吹き飛ばす。盤外なら即撃破。',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget;
  },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const fresh = findUnit(state, target.instanceId);
    if (!fresh) return { state, log: [] };

    const dir = getDirectionFromTo(self.position, fresh.position);
    const newPos = { row: fresh.position.row + dir.row, col: fresh.position.col + dir.col };

    if (!isInBounds(newPos)) {
      // 盤外撃破
      const next = applyDamage(state, { source: self, target: fresh, amount: 999, tags: ['knockback_kill'] });
      return { state: next, log: [`${self.card.name}：吹き飛ばし！${fresh.card.name}を盤外撃破`] };
    }

    if (state.board[newPos.row][newPos.col]) {
      return { state, log: [`${fresh.card.name}：吹き飛ばし先が塞がっていた`] };
    }

    const next = moveUnitTo(state, fresh.instanceId, newPos);
    return { state: next, log: [`${self.card.name}：吹き飛ばし！${fresh.card.name}を1マス押し出し`] };
  },
});
