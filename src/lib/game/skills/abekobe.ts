import { registerSkill } from './registry';
import { findUnit, getEffectiveAtk } from '@/lib/game/helpers';

registerSkill({
  id: 'abekobe',
  displayName: 'あべこべ',
  description: '自分のATKと現在HPを入れ替える（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(_state, _self, ctx) { return ctx.remainingUses !== 0; },
  getValidTargets() { return []; },
  resolve(state, self) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const oldAtk = getEffectiveAtk(fresh);
    const oldHp = fresh.currentHp;
    const newCard = { ...fresh.card, atk: Math.max(1, oldHp) };
    const newHp = Math.max(1, Math.min(oldAtk, fresh.maxHp));
    const newAtkBonus = 0; // reset buffs so effective ATK = card.atk
    const updated = {
      ...fresh,
      card: newCard,
      currentHp: newHp,
      buffs: { ...fresh.buffs, atkBonus: newAtkBonus, atkBonusOnce: 0 },
    };
    const board = state.board.map(r => [...r]);
    board[fresh.position.row][fresh.position.col] = updated;
    return { state: { ...state, board }, log: [`${self.card.name}：あべこべ！ATK${oldAtk}↔HP${oldHp}を入れ替えた`] };
  },
});
