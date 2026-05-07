import { registerSkill } from './registry';
import { getAdjacent4Empty, createTokenUnit } from '@/lib/game/helpers';
import { placeUnit } from '@/lib/game/rules';

registerSkill({
  id: 'shoushuu',
  displayName: '召集',
  description: '召喚時、隣接する空きマスに1/1トークンを最大2体配置',
  triggerKind: 'on_summon',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const empty = getAdjacent4Empty(state, self.position).slice(0, 2);
    let workingState = state;
    for (const pos of empty) {
      const token = createTokenUnit(self.owner, pos);
      workingState = { ...workingState, board: placeUnit(workingState.board, token, pos) };
    }
    return { state: workingState, log: [`${self.card.name}：召集！${empty.length}体のトークンを召喚`] };
  },
});
