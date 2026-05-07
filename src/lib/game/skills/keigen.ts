// 軽減は dispatcher.ts の applyDamage 内で直接処理（ダメージ軽減のため）
// ここではオーラ型として登録（triggerKind: 'aura' でフラグ管理）
import { registerSkill } from './registry';

registerSkill({
  id: 'keigen',
  displayName: '軽減',
  description: '受けるダメージを1減らす（最低1）',
  triggerKind: 'aura',
  maxUsesDefault: 'infinite',

  // applyAura は不要。dispatcher.ts 内で id='keigen' をチェックして処理する。
  applyAura(_state, _self) {
    return _state; // 実処理は dispatcher 側
  },
});
