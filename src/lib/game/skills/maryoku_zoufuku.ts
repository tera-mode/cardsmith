import { registerSkill } from './registry';
import { incrementAtkBuff } from '@/lib/game/helpers';

registerSkill({
  id: 'maryoku_zoufuku',
  displayName: '魔力増幅',
  description: '場のいずれかのユニットがスキルを使うたびにATK+1',
  triggerKind: 'on_skill_used',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    const next = incrementAtkBuff(state, self.instanceId, 1);
    return { state: next, log: [`${self.card.name}：魔力増幅！ATK+1`] };
  },
});
