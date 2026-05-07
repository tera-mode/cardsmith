// 吸血は dispatcher.ts 内で直接処理（攻撃時ダメージ後に自動適用）
// ここではレジストリ登録のみ行う
import { registerSkill } from './registry';

registerSkill({
  id: 'kyuuketsu',
  displayName: '吸血',
  description: '攻撃でダメージを与えた分だけ自身のHPを回復',
  triggerKind: 'on_attack',
  maxUsesDefault: 'infinite',

  // 実際の処理は dispatcher.ts の applyDamage 内で行われる
  shouldTrigger() { return false; },
  onTrigger(_ctx, _self, state) { return { state, log: [] }; },
});
