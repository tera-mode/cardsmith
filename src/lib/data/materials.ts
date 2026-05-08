import { Material } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';
import { Card } from '@/lib/types/game';

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
  // 既存5種
  { id: 'skill_pen_3', name: '貫通×3', category: 'skill', description: '3回まで、前方の敵を貫通して攻撃', cost: 5, icon: '✨',
    effect: { type: 'skill', skill: { id: 'penetrate', uses: 3 } } },
  { id: 'skill_big_pen_1', name: '大貫通×1', category: 'skill', description: '1回だけ、盤面全貫通で攻撃', cost: 5, icon: '⚡',
    effect: { type: 'skill', skill: { id: 'big_penetrate', uses: 1 } } },
  { id: 'skill_counter_inf', name: '反撃・無限', category: 'skill', description: '攻撃を受けるたびに反撃する', cost: 9, icon: '🔄',
    effect: { type: 'skill', skill: { id: 'hangeki', uses: 'infinite' } } },
  { id: 'skill_buff_1', name: '強化×1', category: 'skill', description: '1回だけ、ATKを+2する', cost: 4, icon: '💪',
    effect: { type: 'skill', skill: { id: 'buff', uses: 1 } } },
  { id: 'skill_heal_inf', name: '治癒・無限', category: 'skill', description: '隣接する味方1体のHP+2（無限）', cost: 10, icon: '💚',
    effect: { type: 'skill', skill: { id: 'heal', uses: 'infinite' } } },

  // 攻撃時スキル
  { id: 'skill_rengeki_inf', name: '連撃・無限', category: 'skill', description: '攻撃命中時、同じ対象に再度ATKダメージ', cost: 8, icon: '⚔️',
    effect: { type: 'skill', skill: { id: 'rengeki', uses: 'infinite' } } },
  { id: 'skill_nagibarai_inf', name: '薙ぎ払い・無限', category: 'skill', description: '攻撃時、左右の敵にもATKダメージを与える', cost: 7, icon: '🌊',
    effect: { type: 'skill', skill: { id: 'nagibarai', uses: 'infinite' } } },
  { id: 'skill_touketsu_inf', name: '凍結・無限', category: 'skill', description: '攻撃命中時、対象を次ターン行動不能にする', cost: 7, icon: '❄️',
    effect: { type: 'skill', skill: { id: 'touketsu', uses: 'infinite' } } },
  { id: 'skill_chinmoku_inf', name: '沈黙・無限', category: 'skill', description: '攻撃命中時、対象のスキルを封印する', cost: 6, icon: '🤫',
    effect: { type: 'skill', skill: { id: 'chinmoku', uses: 'infinite' } } },
  { id: 'skill_fukitobashi_inf', name: '吹き飛ばし・無限', category: 'skill', description: '攻撃命中時、対象を1マス吹き飛ばす（盤外で即死）', cost: 6, icon: '💨',
    effect: { type: 'skill', skill: { id: 'fukitobashi', uses: 'infinite' } } },
  { id: 'skill_kyuuketsu_inf', name: '吸血・無限', category: 'skill', description: '攻撃命中時、与えたダメージ分HP回復', cost: 8, icon: '🩸',
    effect: { type: 'skill', skill: { id: 'kyuuketsu', uses: 'infinite' } } },
  { id: 'skill_rensa_3', name: '連鎖雷撃×3', category: 'skill', description: '攻撃時、対象の隣接敵1体にATK/2の連鎖ダメージ（3回）', cost: 6, icon: '⛓️',
    effect: { type: 'skill', skill: { id: 'rensa_raigeki', uses: 3 } } },

  // 被ダメージ時スキル
  { id: 'skill_hansha_inf', name: '反射・無限', category: 'skill', description: 'ダメージを受けたとき、同量を攻撃者に返す', cost: 7, icon: '🪞',
    effect: { type: 'skill', skill: { id: 'hansha', uses: 'infinite' } } },
  { id: 'skill_ikari_inf', name: '怒り・無限', category: 'skill', description: 'ダメージを受けるたびに自分のATK+1', cost: 6, icon: '😡',
    effect: { type: 'skill', skill: { id: 'ikari', uses: 'infinite' } } },

  // 死亡時スキル
  { id: 'skill_junkyou_1', name: '殉教×1', category: 'skill', description: '死亡時、味方全員のHPを2回復（1回）', cost: 6, icon: '🕊️',
    effect: { type: 'skill', skill: { id: 'junkyou', uses: 1 } } },
  { id: 'skill_shinigiwa_1', name: '死に際の咆哮×1', category: 'skill', description: '死亡時、隣接する味方のATK+2（1回）', cost: 6, icon: '💀',
    effect: { type: 'skill', skill: { id: 'shinigiwa', uses: 1 } } },
  { id: 'skill_fukkatsu_1', name: '復活×1', category: 'skill', description: '死亡した次のターン、同じ場所に復活（1回）', cost: 9, icon: '🔮',
    effect: { type: 'skill', skill: { id: 'fukkatsu', uses: 1 } } },
  { id: 'skill_zangai_1', name: '残骸×1', category: 'skill', description: '死亡時、その場所に1/1トークンを残す（1回）', cost: 4, icon: '🪨',
    effect: { type: 'skill', skill: { id: 'zangai', uses: 1 } } },

  // ターン終了時スキル
  { id: 'skill_saisei_inf', name: '再生・無限', category: 'skill', description: 'ターン終了時、自分のHPを1回復', cost: 6, icon: '♻️',
    effect: { type: 'skill', skill: { id: 'saisei', uses: 'infinite' } } },

  // ターン開始時スキル
  { id: 'skill_haru_inf', name: '春の息吹・無限', category: 'skill', description: 'ターン開始時、味方全員のHP+1回復', cost: 10, icon: '🌸',
    effect: { type: 'skill', skill: { id: 'haru_no_ibuki', uses: 'infinite' } } },
  { id: 'skill_shikikan_inf', name: '指揮官・無限', category: 'skill', description: 'ターン開始時、カードを1枚追加ドロー', cost: 8, icon: '👑',
    effect: { type: 'skill', skill: { id: 'shikikan', uses: 'infinite' } } },
  { id: 'skill_shi_no_ryouiki_inf', name: '死の領域・無限', category: 'skill', description: '敵ターン開始時、全敵に1ダメージ', cost: 9, icon: '☠️',
    effect: { type: 'skill', skill: { id: 'shi_no_ryouiki', uses: 'infinite' } } },

  // 召喚時スキル
  { id: 'skill_keigan_1', name: '慧眼×1', category: 'skill', description: '召喚時、カードを1枚ドロー（1回）', cost: 4, icon: '👁️',
    effect: { type: 'skill', skill: { id: 'keigan', uses: 1 } } },
  { id: 'skill_gaisen_1', name: '凱旋×1', category: 'skill', description: '召喚時、味方全員のHP+1（1回）', cost: 5, icon: '🏆',
    effect: { type: 'skill', skill: { id: 'gaisen', uses: 1 } } },
  { id: 'skill_gouka_1', name: '業火×1', category: 'skill', description: '召喚時、周囲8方向の敵にATK/2ダメージ（1回）', cost: 5, icon: '🔥',
    effect: { type: 'skill', skill: { id: 'gouka', uses: 1 } } },
  { id: 'skill_shoushuu_1', name: '召集×1', category: 'skill', description: '召喚時、隣接する空きマスに1/1トークン最大2体（1回）', cost: 5, icon: '🐣',
    effect: { type: 'skill', skill: { id: 'shoushuu', uses: 1 } } },

  // オーラスキル
  { id: 'skill_senki_inf', name: '戦旗・無限', category: 'skill', description: '味方全員（自分以外）ATK+1オーラ', cost: 9, icon: '🚩',
    effect: { type: 'skill', skill: { id: 'senki', uses: 'infinite' } } },
  { id: 'skill_keigen_inf', name: '軽減・無限', category: 'skill', description: '受けるダメージを1軽減（最小1）', cost: 7, icon: '🛡️',
    effect: { type: 'skill', skill: { id: 'keigen', uses: 'infinite' } } },
  { id: 'skill_koutetsu_1', name: '鋼鉄の意志×1', category: 'skill', description: '致死ダメージを1度だけHP1で耐える（1回）', cost: 7, icon: '🦾',
    effect: { type: 'skill', skill: { id: 'koutetsu_no_ishi', uses: 1 } } },
  { id: 'skill_kyousenshi_inf', name: '狂戦士化・無限', category: 'skill', description: 'HP50%以下のとき自分ATK+2オーラ', cost: 7, icon: '🩹',
    effect: { type: 'skill', skill: { id: 'kyousenshi', uses: 'infinite' } } },
  { id: 'skill_seinaru_inf', name: '聖なる加護・無限', category: 'skill', description: '味方全員の最大HP+1オーラ', cost: 9, icon: '⭐',
    effect: { type: 'skill', skill: { id: 'seinaru_kago', uses: 'infinite' } } },

  // 起動型スキル
  { id: 'skill_mahi_3', name: '麻痺×3', category: 'skill', description: '敵1体を次ターン行動不能に（3回）', cost: 5, icon: '💫',
    effect: { type: 'skill', skill: { id: 'mahi', uses: 3 } } },
  { id: 'skill_hikiyose_inf', name: '引き寄せ・無限', category: 'skill', description: '3射程内の敵を隣接マスに引き寄せる', cost: 5, icon: '🧲',
    effect: { type: 'skill', skill: { id: 'hikiyose', uses: 'infinite' } } },
  { id: 'skill_irekae_1', name: '位置入れ替え×1', category: 'skill', description: '味方ユニットと位置を交換（1回）', cost: 4, icon: '🔀',
    effect: { type: 'skill', skill: { id: 'irekae', uses: 1 } } },
  { id: 'skill_shunkan_idou_1', name: '瞬間移動×1', category: 'skill', description: '任意の空きマスへ瞬間移動（1回）', cost: 5, icon: '🌀',
    effect: { type: 'skill', skill: { id: 'shunkan_idou', uses: 1 } } },
  { id: 'skill_jibaku_1', name: '自爆×1', category: 'skill', description: '自身を犠牲に周囲8方向にATK×2ダメージ（1回）', cost: 5, icon: '💥',
    effect: { type: 'skill', skill: { id: 'jibaku', uses: 1 } } },
  { id: 'skill_kagebunshin_3', name: '影分身×3', category: 'skill', description: '隣接する空きマスに能力なしの分身を生成（3回）', cost: 7, icon: '👥',
    effect: { type: 'skill', skill: { id: 'kagebunshin', uses: 3 } } },
  { id: 'skill_shoukanshi_1', name: '召喚士×1', category: 'skill', description: 'コスト6以下のカードを手札から即召喚（1回）', cost: 5, icon: '📜',
    effect: { type: 'skill', skill: { id: 'shoukanshi', uses: 1 } } },
  { id: 'skill_tenkei_1', name: '天啓×1', category: 'skill', description: '手札1枚のコストを3減らす（1回）', cost: 4, icon: '💡',
    effect: { type: 'skill', skill: { id: 'tenkei', uses: 1 } } },
  { id: 'skill_daishinkan_1', name: '大震撼×1', category: 'skill', description: '全敵に1ダメージ（1回）', cost: 5, icon: '⚡',
    effect: { type: 'skill', skill: { id: 'daishinkan', uses: 1 } } },
];

export const MATERIAL_MAP: Record<string, Material> = Object.fromEntries(
  MATERIALS.map(m => [m.id, m])
);

export function getMaterial(id: string): Material | undefined {
  return MATERIAL_MAP[id];
}

// ─── カードからマテリアルを自動生成 ──────────────────────────────────────────

function moveMaterial(card: Card): string {
  const m = card.movement;
  if (m.type === 'jump') return 'move_jump_2';
  if (m.type === 'step' && m.directions.length >= 4) return 'move_omni_1';
  return 'move_forward_1';
}

function rangeMaterial(card: Card): string {
  const r = card.attackRange;
  if (r.type === 'none') return '';
  if (r.type === 'ranged') return r.maxDistance >= 4 ? 'range_shoot_4' : 'range_shoot_2';
  if (r.type === 'aoe')    return 'range_around_1';
  if (r.type === 'step' && r.directions.length >= 4) return 'range_omni_1';
  return 'range_melee_1';
}

function atkMaterials(atk: number): string[] {
  if (atk <= 0) return [];
  if (atk <= 1) return ['stat_atk_1'];
  if (atk <= 2) return ['stat_atk_2'];
  if (atk <= 4) return ['stat_atk_3'];
  return ['stat_atk_3', 'stat_atk_2'];
}

function hpMaterials(hp: number): string[] {
  if (hp <= 1) return ['stat_hp_1'];
  if (hp <= 2) return ['stat_hp_2'];
  if (hp <= 3) return ['stat_hp_3'];
  if (hp <= 5) return ['stat_hp_3', 'stat_hp_2'];
  return ['stat_hp_5', 'stat_hp_2'];
}

const SKILL_TO_MATERIAL: Record<string, string> = {
  penetrate:       'skill_pen_3',
  big_penetrate:   'skill_big_pen_1',
  hangeki:         'skill_counter_inf',
  buff:            'skill_buff_1',
  heal:            'skill_heal_inf',
  rengeki:         'skill_rengeki_inf',
  nagibarai:       'skill_nagibarai_inf',
  touketsu:        'skill_touketsu_inf',
  chinmoku:        'skill_chinmoku_inf',
  fukitobashi:     'skill_fukitobashi_inf',
  kyuuketsu:       'skill_kyuuketsu_inf',
  rensa_raigeki:   'skill_rensa_3',
  hansha:          'skill_hansha_inf',
  ikari:           'skill_ikari_inf',
  junkyou:         'skill_junkyou_1',
  shinigiwa:       'skill_shinigiwa_1',
  fukkatsu:        'skill_fukkatsu_1',
  zangai:          'skill_zangai_1',
  saisei:          'skill_saisei_inf',
  haru_no_ibuki:   'skill_haru_inf',
  shikikan:        'skill_shikikan_inf',
  shi_no_ryouiki:  'skill_shi_no_ryouiki_inf',
  keigan:          'skill_keigan_1',
  gaisen:          'skill_gaisen_1',
  gouka:           'skill_gouka_1',
  shoushuu:        'skill_shoushuu_1',
  senki:           'skill_senki_inf',
  keigen:          'skill_keigen_inf',
  koutetsu_no_ishi: 'skill_koutetsu_1',
  kyousenshi:      'skill_kyousenshi_inf',
  seinaru_kago:    'skill_seinaru_inf',
  mahi:            'skill_mahi_3',
  hikiyose:        'skill_hikiyose_inf',
  irekae:          'skill_irekae_1',
  shunkan_idou:    'skill_shunkan_idou_1',
  jibaku:          'skill_jibaku_1',
  kagebunshin:     'skill_kagebunshin_3',
  shoukanshi:      'skill_shoukanshi_1',
  tenkei:          'skill_tenkei_1',
  daishinkan:      'skill_daishinkan_1',
};

function skillMaterial(card: Card): string {
  if (!card.skill) return '';
  return SKILL_TO_MATERIAL[card.skill.id] ?? '';
}

function cardToMaterials(card: Card): string[] {
  return [
    moveMaterial(card),
    rangeMaterial(card),
    ...atkMaterials(card.atk),
    ...hpMaterials(card.hp),
    skillMaterial(card),
  ].filter(Boolean);
}

// preset カードの構成マテリアルマップ（抽出時に返すマテリアル）
export const PRESET_CARD_MATERIALS: Record<string, string[]> = Object.fromEntries(
  CARDS.map(card => [card.id, cardToMaterials(card)])
);
