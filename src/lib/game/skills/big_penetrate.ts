import { registerSkill } from './registry';
import { applyBaseDamage, getEffectiveAtk } from '@/lib/game/helpers';
import { BOARD_ROWS } from '@/lib/game/rules';

registerSkill({
  id: 'big_penetrate',
  displayName: '大貫通',
  description: '最前線からATK分の陣地ダメージ（3回）',
  triggerKind: 'activated',
  maxUsesDefault: 3,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    const frontRow = self.owner === 'player' ? 0 : BOARD_ROWS - 1;
    return self.position.row === frontRow;
  },
  getValidTargets() { return []; },
  resolve(state, self) {
    const dmg = getEffectiveAtk(self);
    const next = applyBaseDamage(state, self.owner, dmg);
    return { state: next, log: [`${self.card.name}：大貫通！陣地に${dmg}ダメージ`] };
  },
});
