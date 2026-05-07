import { registerSkill } from './registry';
import { getHand, removeFromHand, pickLowestCostCard, getEmptySummonZone } from '@/lib/game/helpers';
import { createUnit, placeUnit } from '@/lib/game/rules';
import { triggerOnSummon } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'shoukanshi',
  displayName: '召喚士',
  description: '手札のコスト6以下のカード1枚を即時召喚（1回）',
  triggerKind: 'activated',
  maxUsesDefault: 1,

  canActivate(state, self, ctx) {
    if (ctx.remainingUses === 0) return false;
    return getHand(state, self.owner).some(c => c.cost <= 6);
  },
  getValidTargets(state, self) {
    return getEmptySummonZone(state, self.owner);
  },
  resolve(state, self, target) {
    if (!target) return { state, log: [] };
    const hand = getHand(state, self.owner);
    const card = pickLowestCostCard(hand, 6);
    if (!card) return { state, log: [] };

    let workingState = removeFromHand(state, self.owner, card.id);
    const newUnit = createUnit(card, self.owner, target);
    workingState = { ...workingState, board: placeUnit(workingState.board, newUnit, target) };
    workingState = triggerOnSummon(workingState, newUnit);
    return { state: workingState, log: [`${self.card.name}：召喚士！${card.name}を即時召喚`] };
  },
});
