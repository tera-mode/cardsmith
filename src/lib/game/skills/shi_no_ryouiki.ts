import { registerSkill } from './registry';
import { getEnemiesOnBoard, findUnit } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'shi_no_ryouiki',
  displayName: '死の領域',
  description: '敵のターン開始時、全ての敵に1ダメージ',
  triggerKind: 'on_turn_start',
  maxUsesDefault: 'infinite',

  shouldTrigger(ctx, self) {
    return ctx.currentTurn !== self.owner; // 敵ターン開始時
  },
  onTrigger(_ctx, self, state) {
    const enemies = getEnemiesOnBoard(state, self.owner);
    let workingState = state;
    for (const enemy of enemies) {
      const fresh = findUnit(workingState, enemy.instanceId);
      if (!fresh) continue;
      workingState = applyDamage(workingState, { source: self, target: fresh, amount: 1, tags: ['death_zone'] });
    }
    return { state: workingState, log: [`${self.card.name}：死の領域！敵${enemies.length}体に1ダメージ`] };
  },
});
