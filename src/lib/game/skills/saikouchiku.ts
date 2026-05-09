import { registerSkill } from './registry';
import { getHand } from '@/lib/game/helpers';
import { createUnit, placeUnit } from '@/lib/game/rules';
import { triggerOnSummon } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'saikouchiku',
  displayName: '再構築',
  description: '死亡時、手札の最低コストカードを即召喚（自分のいたマス）',
  triggerKind: 'on_death',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const hand = getHand(state, self.owner);
    if (!hand.length) return { state, log: [] };
    const card = hand.reduce((a, b) => a.cost <= b.cost ? a : b);
    const pos = self.position;
    if (state.board[pos.row]?.[pos.col]) return { state, log: [] };
    const newUnit = createUnit(card, self.owner, pos);
    const board = placeUnit(state.board, newUnit, pos);
    const ownerState = self.owner === 'player' ? state.player : state.ai;
    const newHand = ownerState.hand.filter(c => c !== card);
    let s = self.owner === 'player'
      ? { ...state, board, player: { ...state.player, hand: newHand } }
      : { ...state, board, ai: { ...state.ai, hand: newHand } };
    s = triggerOnSummon(s, newUnit);
    return { state: s, log: [`${self.card.name}：再構築！${card.name}を即召喚`] };
  },
});
