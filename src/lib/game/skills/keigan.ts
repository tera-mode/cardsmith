import { registerSkill } from './registry';

registerSkill({
  id: 'keigan',
  displayName: '慧眼',
  description: '召喚時、カードを1枚ドロー',
  triggerKind: 'on_summon',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    // ドロー処理: デッキからランダムに1枚手札へ
    const owner = self.owner;
    const playerState = owner === 'player' ? state.player : state.ai;
    if (playerState.deck.length === 0) return { state, log: [`${self.card.name}：慧眼 - デッキが空`] };

    const idx = Math.floor(Math.random() * playerState.deck.length);
    const drawn = playerState.deck[idx];
    const newDeck = playerState.deck.filter((_, i) => i !== idx);
    const newHand = [...playerState.hand, drawn];

    const next = owner === 'player'
      ? { ...state, player: { ...state.player, deck: newDeck, hand: newHand } }
      : { ...state, ai: { ...state.ai, deck: newDeck, hand: newHand } };

    return { state: next, log: [`${self.card.name}：慧眼！${drawn.name}をドロー`] };
  },
});
