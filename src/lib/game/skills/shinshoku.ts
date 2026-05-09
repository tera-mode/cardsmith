import { registerSkill } from './registry';
import { incrementAtkBuff, findUnit } from '@/lib/game/helpers';

registerSkill({
  id: 'shinshoku',
  displayName: '侵蝕',
  description: '攻撃時、対象を倒した場合のみATK+1（永続）',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx) {
    return !!ctx.attackTarget && !findUnit({ board: [] } as never, ctx.attackTarget.instanceId);
  },
  onTrigger(ctx, self, state) {
    // 攻撃対象がボードから消えていれば（＝倒した）発動
    if (!ctx.attackTarget) return { state, log: [] };
    const target = ctx.attackTarget;
    const stillAlive = state.board.flat().some(u => u?.instanceId === target.instanceId);
    if (stillAlive) return { state, log: [] };
    const next = incrementAtkBuff(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：侵蝕！ATK+1`] };
  },
});
