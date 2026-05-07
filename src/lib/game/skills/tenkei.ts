import { registerSkill } from './registry';
import { applyCostReduction, getHand } from '@/lib/game/helpers';

registerSkill({
  id: 'tenkei',
  displayName: '天啓',
  description: '手札の指定カードのコストを-3（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    return ctx.remainingUses !== 0 && getHand(state, self.owner).length > 0;
  },
  getValidTargets() { return []; }, // UIで手札から選択
  resolve(state, self, _target, extraCtx) {
    const cardId = extraCtx?.selectedCardId as string | undefined;
    if (!cardId) return { state, log: [] };
    const next = applyCostReduction(state, self.owner, cardId, 3);
    return { state: next, log: [`${self.card.name}：天啓！手札のコスト-3`] };
  },
});
