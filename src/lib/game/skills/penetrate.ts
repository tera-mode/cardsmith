import { registerSkill } from './registry';
import { applyBaseDamage } from '@/lib/game/helpers';
import { BOARD_ROWS } from '@/lib/game/rules';

registerSkill({
  id: 'penetrate',
  displayName: '貫通',
  description: '最前線から陣地に2ダメージ（3回）',
  triggerKind: 'activated',
  maxUsesDefault: 3,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    const frontRow = self.owner === 'player' ? 0 : BOARD_ROWS - 1;
    return self.position.row === frontRow;
  },
  getValidTargets() { return []; },
  resolve(state, self) {
    const next = applyBaseDamage(state, self.owner, 2);
    return { state: next, log: [`${self.card.name}：貫通攻撃！陣地に2ダメージ`] };
  },
});
