import { registerSkill } from './registry';
import { createTokenUnit } from '@/lib/game/helpers';
import { placeUnit } from '@/lib/game/rules';

registerSkill({
  id: 'zangai',
  displayName: '残骸',
  description: '死亡時、その場に1/1トークンを残す',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  shouldTrigger(_ctx, self) {
    return !self.isToken; // トークンの残骸は無限ループ防止のため禁止
  },
  onTrigger(_ctx, self, state) {
    const token = createTokenUnit(self.owner, self.position);
    const board = placeUnit(state.board, token, self.position);
    return { state: { ...state, board }, log: [`${self.card.name}：残骸！トークンを残した`] };
  },
});
