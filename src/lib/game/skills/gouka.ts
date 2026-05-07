import { registerSkill } from './registry';
import { getAdjacent8Enemies, getEffectiveAtk } from '@/lib/game/helpers';
import { applyDamage } from '@/lib/game/events/dispatcher';

registerSkill({
  id: 'gouka',
  displayName: '業火',
  description: '召喚時、周囲8マスの敵にATK/2ダメージ',
  triggerKind: 'on_summon',
  maxUsesDefault: 1,

  onTrigger(_ctx, self, state) {
    const enemies = getAdjacent8Enemies(state, self.position, self.owner);
    const dmg = Math.max(1, Math.floor(getEffectiveAtk(self) / 2));
    let workingState = state;
    for (const enemy of enemies) {
      workingState = applyDamage(workingState, { source: self, target: enemy, amount: dmg, tags: ['gouka'] });
    }
    return { state: workingState, log: [`${self.card.name}：業火！周囲${enemies.length}体に${dmg}ダメージ`] };
  },
});
