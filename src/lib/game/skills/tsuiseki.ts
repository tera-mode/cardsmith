import { registerSkill } from './registry';
import { findUnit, getNearestEnemy } from '@/lib/game/helpers';

registerSkill({
  id: 'tsuiseki',
  displayName: '追跡',
  description: '移動後、最近接の敵との距離分だけ次攻撃ATKボーナス',
  triggerKind: 'on_move',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const nearest = getNearestEnemy(state, fresh.position, fresh.owner);
    if (!nearest) return { state, log: [] };
    const dist = Math.abs(nearest.position.row - fresh.position.row) +
                 Math.abs(nearest.position.col - fresh.position.col);
    const board = state.board.map(r => [...r]);
    board[fresh.position.row][fresh.position.col] = {
      ...fresh,
      buffs: { ...fresh.buffs, atkBonusOnce: dist },
    };
    return { state: { ...state, board }, log: [`${self.card.name}：追跡！敵との距離${dist}→次攻撃ATK+${dist}`] };
  },
});
