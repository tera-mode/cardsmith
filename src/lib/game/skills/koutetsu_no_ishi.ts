// 鋼鉄の意志は dispatcher.ts の applyDamage 内で直接処理
import { registerSkill } from './registry';

registerSkill({
  id: 'koutetsu_no_ishi',
  displayName: '鋼鉄の意志',
  description: '致死ダメージを受けてもHP1で生き残る（1回）',
  triggerKind: 'aura',
  maxUsesDefault: 1,

  applyAura(state, _self) {
    return state; // 実処理は dispatcher 側
  },
});
