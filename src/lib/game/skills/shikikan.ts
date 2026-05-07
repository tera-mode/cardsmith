import { registerSkill } from './registry';

registerSkill({
  id: 'shikikan',
  displayName: '指揮官',
  description: '自分のターン開始時、カードを1枚追加ドロー',
  triggerKind: 'on_turn_start',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.currentTurn === self.owner;
  },
  onTrigger(_ctx, self, state) {
    const owner = self.owner;
    const ps = owner === 'player' ? state.player : state.ai;
    if (ps.deck.length === 0) return { state, log: [] };

    const idx = Math.floor(Math.random() * ps.deck.length);
    const drawn = ps.deck[idx];
    const newDeck = ps.deck.filter((_, i) => i !== idx);
    const newHand = [...ps.hand, drawn];

    const next = owner === 'player'
      ? { ...state, player: { ...state.player, deck: newDeck, hand: newHand } }
      : { ...state, ai: { ...state.ai, deck: newDeck, hand: newHand } };

    return { state: next, log: [`${self.card.name}：指揮官の追加ドロー！${drawn.name}を獲得`] };
  },
});
