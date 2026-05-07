import { Material } from '@/lib/types/meta';

export const MATERIALS: Material[] = [
  // ─── ステータス：HP ──────────────────────────────────────────────────────────
  { id: 'stat_hp_1', name: 'HP+1', category: 'stat_hp', description: 'HP を 1 増やす', cost: 1, icon: '❤️',
    effect: { type: 'stat_hp', value: 1 } },
  { id: 'stat_hp_2', name: 'HP+2', category: 'stat_hp', description: 'HP を 2 増やす', cost: 2, icon: '❤️',
    effect: { type: 'stat_hp', value: 2 } },
  { id: 'stat_hp_3', name: 'HP+3', category: 'stat_hp', description: 'HP を 3 増やす', cost: 3, icon: '❤️',
    effect: { type: 'stat_hp', value: 3 } },
  { id: 'stat_hp_5', name: 'HP+5', category: 'stat_hp', description: 'HP を 5 増やす', cost: 5, icon: '❤️',
    effect: { type: 'stat_hp', value: 5 } },

  // ─── ステータス：ATK ─────────────────────────────────────────────────────────
  { id: 'stat_atk_1', name: 'ATK+1', category: 'stat_atk', description: '攻撃力を 1 増やす', cost: 1, icon: '⚔️',
    effect: { type: 'stat_atk', value: 1 } },
  { id: 'stat_atk_2', name: 'ATK+2', category: 'stat_atk', description: '攻撃力を 2 増やす', cost: 2, icon: '⚔️',
    effect: { type: 'stat_atk', value: 2 } },
  { id: 'stat_atk_3', name: 'ATK+3', category: 'stat_atk', description: '攻撃力を 3 増やす', cost: 3, icon: '⚔️',
    effect: { type: 'stat_atk', value: 3 } },
  { id: 'stat_atk_5', name: 'ATK+5', category: 'stat_atk', description: '攻撃力を 5 増やす', cost: 5, icon: '⚔️',
    effect: { type: 'stat_atk', value: 5 } },

  // ─── 移動 ────────────────────────────────────────────────────────────────────
  { id: 'move_forward_1', name: '歩兵（前1）', category: 'movement', description: '前方 1 マスに移動', cost: 1, icon: '👣',
    effect: { type: 'movement', pattern: { type: 'step', directions: [{ dx: 0, dy: -1 }] } } },
  { id: 'move_omni_1', name: '機動（前後左右1）', category: 'movement', description: '前後左右 1 マスに移動', cost: 4, icon: '🎯',
    effect: { type: 'movement', pattern: { type: 'step', directions: [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }] } } },
  { id: 'move_jump_2', name: '騎馬（前2ジャンプ）', category: 'movement', description: '前方 2 マスにジャンプ移動', cost: 2, icon: '🐎',
    effect: { type: 'movement', pattern: { type: 'jump', offsets: [{ dx: 0, dy: -2 }] } } },
  { id: 'move_slide', name: 'スライド', category: 'movement', description: '前方任意距離に移動', cost: 3, icon: '💨',
    effect: { type: 'movement', pattern: { type: 'slide', directions: [{ dx: 0, dy: -1 }] } } },

  // ─── 攻撃範囲 ────────────────────────────────────────────────────────────────
  { id: 'range_melee_1', name: '近接（前1）', category: 'attack_range', description: '前方 1 マスに攻撃', cost: 1, icon: '🗡️',
    effect: { type: 'attack_range', range: { type: 'step', directions: [{ dx: 0, dy: -1 }] } } },
  { id: 'range_omni_1', name: '周辺攻撃（前後左右1）', category: 'attack_range', description: '前後左右 1 マスに攻撃', cost: 4, icon: '💢',
    effect: { type: 'attack_range', range: { type: 'step', directions: [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }] } } },
  { id: 'range_around_1', name: '全周（8方向1マス）', category: 'attack_range', description: '周囲 8 方向 1 マスに攻撃', cost: 8, icon: '🌀',
    effect: { type: 'attack_range', range: { type: 'aoe', pattern: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }] } } },
  { id: 'range_shoot_2', name: '射撃（前2）', category: 'attack_range', description: '前方 2 マス射程で攻撃', cost: 2, icon: '🏹',
    effect: { type: 'attack_range', range: { type: 'ranged', direction: { dx: 0, dy: -1 }, maxDistance: 2 } } },
  { id: 'range_shoot_4', name: '大砲（前4）', category: 'attack_range', description: '前方 4 マス射程で攻撃', cost: 4, icon: '💣',
    effect: { type: 'attack_range', range: { type: 'ranged', direction: { dx: 0, dy: -1 }, maxDistance: 4 } } },

  // ─── スキル ──────────────────────────────────────────────────────────────────
  { id: 'skill_pen_3', name: '貫通×3', category: 'skill', description: '3回まで、前方の敵を貫通して攻撃', cost: 5, icon: '✨',
    effect: { type: 'skill', skill: { id: 'penetrate', uses: 3 } } },
  { id: 'skill_big_pen_1', name: '大貫通×1', category: 'skill', description: '1回だけ、盤面全貫通で攻撃', cost: 5, icon: '⚡',
    effect: { type: 'skill', skill: { id: 'big_penetrate', uses: 1 } } },
  { id: 'skill_counter_inf', name: '反撃・無限', category: 'skill', description: '攻撃を受けるたびに反撃する', cost: 9, icon: '🔄',
    effect: { type: 'skill', skill: { id: 'hangeki', uses: 'infinite' } } },
  { id: 'skill_buff_1', name: '強化×1', category: 'skill', description: '1回だけ、ATKを+2する', cost: 4, icon: '💪',
    effect: { type: 'skill', skill: { id: 'buff', uses: 1 } } },
  { id: 'skill_heal_inf', name: '治癒・無限', category: 'skill', description: '毎ターン HP を 1 回復する', cost: 10, icon: '💚',
    effect: { type: 'skill', skill: { id: 'heal', uses: 'infinite' } } },
];

export const MATERIAL_MAP: Record<string, Material> = Object.fromEntries(
  MATERIALS.map(m => [m.id, m])
);

export function getMaterial(id: string): Material | undefined {
  return MATERIAL_MAP[id];
}

// preset カードの構成マテリアルマップ（抽出時に返すマテリアル）
export const PRESET_CARD_MATERIALS: Record<string, string[]> = {
  militia:         ['move_forward_1', 'range_melee_1', 'stat_atk_1', 'stat_hp_1'],
  light_infantry:  ['move_forward_1', 'range_melee_1', 'stat_atk_1', 'stat_hp_2'],
  assault_soldier: ['move_forward_1', 'range_melee_1', 'stat_atk_2', 'stat_hp_1'],
  scout:           ['move_jump_2',    'range_melee_1', 'stat_atk_1', 'stat_hp_1'],
  spear_soldier:   ['move_forward_1', 'range_melee_1', 'stat_atk_2', 'stat_hp_2'],
  heavy_infantry:  ['move_forward_1', 'range_melee_1', 'stat_atk_1', 'stat_hp_3', 'stat_hp_2'],
  combat_soldier:  ['move_forward_1', 'range_melee_1', 'stat_atk_3', 'stat_hp_3'],
  archer:          ['move_forward_1', 'range_shoot_2', 'stat_atk_2', 'stat_hp_1', 'skill_pen_3'],
  guard:           ['move_omni_1',    'range_omni_1',  'stat_atk_2', 'stat_hp_3'],
  healer:          ['move_forward_1', 'range_melee_1', 'stat_atk_1', 'stat_hp_3', 'skill_heal_inf'],
  cavalry:         ['move_jump_2',    'range_omni_1',  'stat_atk_3', 'stat_hp_3'],
  cannon:          ['move_forward_1', 'range_shoot_4', 'stat_atk_3', 'stat_hp_3', 'skill_big_pen_1'],
  defender:        ['move_omni_1',    'range_around_1','stat_atk_3', 'stat_hp_5', 'stat_hp_3', 'skill_counter_inf'],
};
