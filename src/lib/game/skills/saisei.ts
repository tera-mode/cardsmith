import { registerSkill } from './registry';
import { healUnit, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'saisei',
  displayName: '再生',
  description: '自分のターン終了時、自身のHP+1',
  triggerKind: 'on_turn_end',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.currentTurn === self.owner;
  },
  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh || fresh.currentHp >= fresh.maxHp + fresh.buffs.auraMaxHp) return { state, log: [] };
    const next = healUnit(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：再生でHP+1`] };
  },
});
