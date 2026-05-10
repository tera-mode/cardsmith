import { registerSkill } from './registry';
import { getAdjacent4Empty, createCloneUnit } from '@/lib/game/helpers';
import { placeUnit } from '@/lib/game/rules';

registerSkill({
  id: 'kagebunshin',
  displayName: '影分身',
  description: '隣接する空きマスにスキルなしのクローンを生成（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    return ctx.remainingUses !== 0 && getAdjacent4Empty(state, self.position).length > 0;
  },
  getValidTargets(state, self) {
    return getAdjacent4Empty(state, self.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const clone = createCloneUnit(self, target);
    const board = placeUnit(state.board, clone, target);
    return { state: { ...state, board }, log: [`${self.card.name}：影分身を生成`] };
  },
});
