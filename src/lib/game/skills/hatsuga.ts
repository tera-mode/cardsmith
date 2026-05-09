import { registerSkill } from './registry';
import { placeUnit } from '@/lib/game/rules';
import { createTokenUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'hatsuga',
  displayName: '発芽',
  description: '死亡時、自分のいたマスに1/1の苗トークン生成',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const pos = self.position;
    if (state.board[pos.row]?.[pos.col]) return { state, log: [] };
    const token = createTokenUnit(self.owner, pos);
    const board = placeUnit(state.board, token, pos);
    return { state: { ...state, board }, log: [`${self.card.name}：発芽！苗トークンを残した`] };
  },
});
