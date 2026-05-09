import { registerSkill } from './registry';
import { applyBaseDamage } from '@/lib/game/helpers';
import { BOARD_ROWS } from '@/lib/game/rules';

registerSkill({
  id: 'strong_blow',
  displayName: '強打',
  description: '最前線から敵陣地に3ダメージ（2回）',
  triggerKind: 'activated',
  maxUsesDefault: 2,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    const frontRow = self.owner === 'player' ? 0 : BOARD_ROWS - 1;
    return self.position.row === frontRow;
  },
  getValidTargets() { return []; },
  resolve(state, self) {
    const next = applyBaseDamage(state, self.owner, 3);
    return { state: next, log: [`${self.card.name}：強打！敵陣地に3ダメージ`] };
  },
});
