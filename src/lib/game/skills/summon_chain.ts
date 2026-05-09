import { registerSkill } from './registry';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'summon_chain',
  displayName: '召喚連鎖',
  description: '味方召喚時、その味方が即座に行動可能になる（3回）',
  triggerKind: 'on_summon_ally',
  maxUsesDefault: 3,

  onTrigger(ctx, self, state) {
    const ally = ctx.summonedAlly!;
    const fresh = findUnit(state, ally.instanceId);
    if (!fresh) return { state, log: [] };
    const board = state.board.map(r => [...r]);
    board[fresh.position.row][fresh.position.col] = {
      ...fresh,
      hasActedThisTurn: false,
      hasSummonedThisTurn: false,
    };
    return { state: { ...state, board }, log: [`${self.card.name}：召喚連鎖！${fresh.card.name}が即座に行動可能`] };
  },
});
