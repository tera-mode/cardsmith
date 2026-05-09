import { registerSkill } from './registry';
import { healBase } from '@/lib/game/helpers';
import { BOARD_ROWS } from '@/lib/game/rules';

registerSkill({
  id: 'junrei',
  displayName: '巡礼',
  description: '前衛列に到達するたびに自陣HP+1',
  triggerKind: 'on_move',
  maxUsesDefault: 'infinite',

  onTrigger(ctx, self, state) {
    const toPos = ctx.movedTo!;
    const frontRow = self.owner === 'player' ? 0 : BOARD_ROWS - 1;
    if (toPos.row !== frontRow) return { state, log: [] };
    const next = healBase(state, self.owner, 1);
    return { state: next, log: [`${self.card.name}：巡礼！前衛到達で自陣HP+1`] };
  },
});
