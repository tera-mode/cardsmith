import { registerSkill } from './registry';

// shireijutsu (死霊術): 味方が死ぬたびATK+1
// 実際の発火ロジックは dispatcher.ts の processDeath 内で直接処理
registerSkill({
  id: 'shireijutsu',
  displayName: '死霊術',
  description: '味方が死ぬたびにATK+1（場にいる限り蓄積）',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  // オーラとして登録するが実処理は processDeath フックで行う
  applyAura(state, _self) { return state; },
});
