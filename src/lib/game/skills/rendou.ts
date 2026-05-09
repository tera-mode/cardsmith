import { registerSkill } from './registry';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'rendou',
  displayName: '連動',
  description: '味方がスキルを使うたびに、そのユニットのスキル使用回数+1（5回）',
  triggerKind: 'on_skill_used',
  maxUsesDefault: 5,

  shouldTrigger(ctx, self) {
    return ctx.skillUser?.owner === self.owner;
  },
  onTrigger(ctx, _self, state) {
    const skillUser = ctx.skillUser!;
    const fresh = findUnit(state, skillUser.instanceId);
    if (!fresh || fresh.skillUsesRemaining === 'infinite') return { state, log: [] };
    const board = state.board.map(r => [...r]);
    board[fresh.position.row][fresh.position.col] = {
      ...fresh,
      skillUsesRemaining: (fresh.skillUsesRemaining as number) + 1,
    };
    return { state: { ...state, board }, log: [`連動！${fresh.card.name}のスキル回数+1`] };
  },
});
