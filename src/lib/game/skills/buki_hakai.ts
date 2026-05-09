import { registerSkill } from './registry';
import { findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'buki_hakai',
  displayName: '武器破壊',
  description: '攻撃時、対象のATK-1（永続）',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) { return !!ctx.attackTarget; },
  onTrigger(ctx, self, state) {
    const target = ctx.attackTarget!;
    const fresh = findUnit(state, target.instanceId);
    if (!fresh) return { state, log: [] };
    const board = state.board.map(r => [...r]);
    const newAtk = Math.max(0, fresh.buffs.atkBonus - 1);
    board[fresh.position.row][fresh.position.col] = {
      ...fresh,
      buffs: { ...fresh.buffs, atkBonus: fresh.card.atk + newAtk > 0 ? fresh.buffs.atkBonus - 1 : fresh.buffs.atkBonus },
    };
    // より正確な実装: card.atk は変えず buffs に -1 を加算（最低0にならないように card.atk で制限）
    const delta = fresh.card.atk + fresh.buffs.atkBonus + fresh.buffs.auraAtk > 0 ? -1 : 0;
    if (delta === 0) return { state, log: [] };
    const b2 = state.board.map(r => [...r]);
    b2[fresh.position.row][fresh.position.col] = { ...fresh, buffs: { ...fresh.buffs, atkBonus: fresh.buffs.atkBonus + delta } };
    return { state: { ...state, board: b2 }, log: [`${self.card.name}：武器破壊！${fresh.card.name}のATK-1`] };
  },
});
