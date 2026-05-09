import { registerSkill } from './registry';

registerSkill({
  id: 'douin',
  displayName: '動員',
  description: '自陣がダメージを受けるたびにカードを1枚ドロー',
  triggerKind: 'on_base_damaged',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const ps = self.owner === 'player' ? state.player : state.ai;
    if (ps.deck.length === 0) return { state, log: [`${self.card.name}：動員 - デッキが空`] };
    const idx = Math.floor(Math.random() * ps.deck.length);
    const drawn = ps.deck[idx];
    const newDeck = ps.deck.filter((_, i) => i !== idx);
    const newHand = [...ps.hand, drawn];
    const next = self.owner === 'player'
      ? { ...state, player: { ...state.player, deck: newDeck, hand: newHand } }
      : { ...state, ai: { ...state.ai, deck: newDeck, hand: newHand } };
    return { state: next, log: [`${self.card.name}：動員！${drawn.name}をドロー`] };
  },
});
