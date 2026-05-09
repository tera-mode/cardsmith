import { registerSkill } from './registry';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'kazeyomi',
  displayName: '風読み',
  description: '移動するたびに次の攻撃ATK+1（蓄積）',
  triggerKind: 'on_move',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const newBonus = (fresh.buffs.atkBonusOnce ?? 0) + 1;
    const board = state.board.map(r => [...r]);
    board[fresh.position.row][fresh.position.col] = {
      ...fresh,
      buffs: { ...fresh.buffs, atkBonusOnce: newBonus },
    };
    return { state: { ...state, board }, log: [`${self.card.name}：風読み！次の攻撃ATK+${newBonus}`] };
  },
});
