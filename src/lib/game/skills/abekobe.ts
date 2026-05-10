import { registerSkill } from './registry';
import { getEnemiesOnBoard, getEffectiveAtk } from '@/lib/game/helpers';

registerSkill({
  id: 'abekobe',
  displayName: 'あべこべ',
  description: '敵1体のATKと現在HPを入れ替える（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    return ctx.remainingUses !== 0 && getEnemiesOnBoard(state, self.owner).length > 0;
  },
  getValidTargets(state, self) {
    return getEnemiesOnBoard(state, self.owner).map(e => e.position);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const enemy = state.board[target.row][target.col];
    if (!enemy) return { state, log: [] };
    const oldAtk = getEffectiveAtk(enemy);
    const oldHp = enemy.currentHp;
    const newCard = { ...enemy.card, atk: Math.max(1, oldHp) };
    const newHp = Math.max(1, Math.min(oldAtk, enemy.maxHp));
    const updated = {
      ...enemy,
      card: newCard,
      currentHp: newHp,
      buffs: { ...enemy.buffs, atkBonus: 0, atkBonusOnce: 0 },
    };
    const board = state.board.map(r => [...r]);
    board[enemy.position.row][enemy.position.col] = updated;
    return { state: { ...state, board }, log: [`${self.card.name}：あべこべ！${enemy.card.name}のATK${oldAtk}↔HP${oldHp}を入れ替えた`] };
  },
});
