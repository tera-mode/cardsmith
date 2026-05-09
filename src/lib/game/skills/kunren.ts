import { registerSkill } from './registry';
import { getAdjacent4Allies, incrementAtkBuff, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'kunren',
  displayName: '訓練',
  description: '自ターン開始時、隣接する味方1体（ランダム）のATK+1（永続）',
  triggerKind: 'on_turn_start',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) { return ctx.currentTurn === self.owner; },
  onTrigger(_ctx, self, state) {
    const fresh = findUnit(state, self.instanceId);
    if (!fresh) return { state, log: [] };
    const allies = getAdjacent4Allies(state, fresh.position, fresh.owner);
    if (!allies.length) return { state, log: [] };
    const target = allies[Math.floor(Math.random() * allies.length)];
    const next = incrementAtkBuff(state, target.instanceId, 1);
    return { state: next, log: [`${self.card.name}：訓練！${target.card.name}のATK+1`] };
  },
});
