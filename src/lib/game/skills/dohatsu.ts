import { registerSkill } from './registry';
import { incrementAtkBuff, incrementMaxHpAndCurrentHp } from '@/lib/game/helpers';

registerSkill({
  id: 'dohatsu',
  displayName: '怒髪',
  description: '自陣がダメージを受けるたびに自分のHP+1、ATK+1',
  triggerKind: 'on_base_damaged',
  maxUsesDefault: 'infinite',

  onTrigger(_ctx, self, state) {
    let s = incrementAtkBuff(state, self.instanceId, 1);
    s = incrementMaxHpAndCurrentHp(s, self.instanceId, 1);
    return { state: s, log: [`${self.card.name}：怒髪！ATK+1、HP+1`] };
  },
});
