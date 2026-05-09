import { registerSkill } from './registry';
import { createTokenUnit } from '@/lib/game/helpers';
import { placeUnit } from '@/lib/game/rules';

registerSkill({
  id: 'zankyou',
  displayName: '残響',
  description: '移動するたびに元のマスに1/1トークンを残す',
  triggerKind: 'on_move',
  maxUsesDefault: 'infinite',

  onTrigger(ctx, self, state) {
    const fromPos = ctx.movedFrom!;
    if (state.board[fromPos.row]?.[fromPos.col]) return { state, log: [] };
    const token = createTokenUnit(self.owner, fromPos);
    const board = placeUnit(state.board, token, fromPos);
    return { state: { ...state, board }, log: [`${self.card.name}：残響！元のマスに1/1トークン`] };
  },
});
