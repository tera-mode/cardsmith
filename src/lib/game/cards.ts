import { Card, MovementPattern, AttackRange } from '@/lib/types/game';

// ─── 方向ベクトル定数 ────────────────────────────────────────────────────

const FWD1 = [{ dx: 0, dy: -1 }];                                    // 前1
const FWD2J = [{ dx: 0, dy: -2 }];                                   // 前2J
const DIR4 = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
const FWDBWD = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }];               // 前後1
const DIR8 = [...DIR4, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }];

// ─── パターン生成ヘルパー ─────────────────────────────────────────────────

const step = (dirs: {dx:number;dy:number}[]): MovementPattern => ({ type: 'step', directions: dirs });
const jump = (offsets: {dx:number;dy:number}[]): MovementPattern => ({ type: 'jump', offsets });
const stepAtk = (dirs: {dx:number;dy:number}[]): AttackRange => ({ type: 'step', directions: dirs });
const ranged = (dist: number): AttackRange => ({ type: 'ranged', direction: { dx: 0, dy: -1 }, maxDistance: dist });
const aoe = (pattern: {dx:number;dy:number}[]): AttackRange => ({ type: 'aoe', pattern });
const noAtk: AttackRange = { type: 'none' };

// ─── 60キャラ定義 ─────────────────────────────────────────────────────────

export const CARDS: Card[] = [

  // ════════════════════════════════
  // ⚪ 聖（sei）— 守る・繋ぐ・育てる
  // ════════════════════════════════
  {
    id: 'sei_noa', name: '見習い聖騎士ノア', attribute: 'sei',
    cost: 4, atk: 1, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'sei_eluna', name: '草原の吟遊詩人エルナ', attribute: 'sei',
    cost: 6, atk: 0, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'keigan', uses: 1 },
  },
  {
    id: 'sei_aloyse', name: '誓いの剣士アロイス', attribute: 'sei',
    cost: 10, atk: 2, hp: 3,
    movement: step(DIR4), attackRange: stepAtk(FWD1),
    skill: { id: 'irekae', uses: 1 },
  },
  {
    id: 'sei_liese', name: '黄金の戦乙女リーゼ', attribute: 'sei',
    cost: 9, atk: 3, hp: 3,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'sei_sol', name: '太陽神の巫女ソル', attribute: 'sei',
    cost: 11, atk: 1, hp: 3,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'gaisen', uses: 1 },
  },
  {
    id: 'sei_mireille', name: '白翼の癒し手ミレイユ', attribute: 'sei',
    cost: 12, atk: 0, hp: 3,
    movement: step(FWDBWD), attackRange: noAtk,
    skill: { id: 'heal', uses: 'infinite' },
  },
  {
    id: 'sei_grail', name: '老聖騎士団長グレイル', attribute: 'sei',
    cost: 14, atk: 2, hp: 5,
    movement: step(DIR4), attackRange: stepAtk(DIR4),
    skill: { id: 'junkyou', uses: 1 },
  },
  {
    id: 'sei_alicia', name: '王国の戦姫アリシア', attribute: 'sei',
    cost: 17, atk: 3, hp: 4,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'senki', uses: 'infinite' },
  },
  {
    id: 'sei_seraphim', name: '七光の大天使セラフィム', attribute: 'sei',
    cost: 20, atk: 4, hp: 4,
    movement: jump(FWD2J), attackRange: ranged(2),
    skill: { id: 'fukkatsu', uses: 1 },
  },
  {
    id: 'sei_johannes', name: '救世の聖王ヨハネス', attribute: 'sei',
    cost: 28, atk: 4, hp: 6,
    movement: step(DIR4), attackRange: aoe(DIR8),
    skill: { id: 'seinaru_kago', uses: 'infinite' },
  },

  // ════════════════════════════════
  // ⚫ 冥（mei）— 死を糧にする・じわじわ削る
  // ════════════════════════════════
  {
    id: 'mei_cal', name: '骸骨の見習い剣士カル', attribute: 'mei',
    cost: 4, atk: 1, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'mei_vera', name: '夜の吸血鬼少女ヴェラ', attribute: 'mei',
    cost: 6, atk: 1, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'kyuuketsu', uses: 'infinite' },
  },
  {
    id: 'mei_nox', name: '三日月の暗殺者ノクト', attribute: 'mei',
    cost: 8, atk: 3, hp: 1,
    movement: jump(FWD2J), attackRange: stepAtk(FWD1),
    skill: { id: 'touketsu', uses: 3 },
  },
  {
    id: 'mei_lyca', name: '星詠みのリュカオン', attribute: 'mei',
    cost: 9, atk: 2, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'chinmoku', uses: 3 },
  },
  {
    id: 'mei_milka', name: '黒髪の死霊術師ミルカ', attribute: 'mei',
    cost: 11, atk: 1, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'shoukanshi', uses: 1 },
  },
  {
    id: 'mei_rose', name: '黒薔薇の魔女ローズ', attribute: 'mei',
    cost: 12, atk: 2, hp: 3,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'ikari', uses: 'infinite' },
  },
  {
    id: 'mei_cerberus', name: '冥府の番犬ケルベロス', attribute: 'mei',
    cost: 14, atk: 4, hp: 3,
    movement: step(FWD1), attackRange: aoe(DIR8),
    skill: { id: 'rengeki', uses: 'infinite' },
  },
  {
    id: 'mei_nyx', name: '夜の女王ニュクス', attribute: 'mei',
    cost: 17, atk: 2, hp: 4,
    movement: step(DIR4), attackRange: stepAtk(DIR4),
    skill: { id: 'shi_no_ryouiki', uses: 'infinite' },
  },
  {
    id: 'mei_lucifer', name: '漆黒の堕天使ルキフェル', attribute: 'mei',
    cost: 20, atk: 5, hp: 3,
    movement: jump(FWD2J), attackRange: stepAtk(FWD1),
    skill: { id: 'shinigiwa', uses: 1 },
  },
  {
    id: 'mei_belial', name: '魔界の王ベリアル', attribute: 'mei',
    cost: 28, atk: 5, hp: 6,
    movement: step(DIR4), attackRange: aoe(DIR8),
    skill: { id: 'kagebunshin', uses: 3 },
  },

  // ════════════════════════════════
  // 🟢 森（shin）— 粘る・癒す・共生する
  // ════════════════════════════════
  {
    id: 'shin_hina', name: 'どんぐり拾いの森人ヒナ', attribute: 'shin',
    cost: 4, atk: 1, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'shin_lil', name: '蔓の見習い弓使いリル', attribute: 'shin',
    cost: 6, atk: 1, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
  },
  {
    id: 'shin_lilia', name: '花冠のエルフ娘リリア', attribute: 'shin',
    cost: 8, atk: 1, hp: 3,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'keigen', uses: 'infinite' },
  },
  {
    id: 'shin_kai', name: '白狼の狩人カイ', attribute: 'shin',
    cost: 10, atk: 2, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'zangai', uses: 1 },
  },
  {
    id: 'shin_gai', name: '緑髭のドルイド翁ガイ', attribute: 'shin',
    cost: 11, atk: 1, hp: 3,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'saisei', uses: 'infinite' },
  },
  {
    id: 'shin_arca', name: '森の歌姫アルカ', attribute: 'shin',
    cost: 13, atk: 0, hp: 2,
    movement: step(FWD1), attackRange: noAtk,
    skill: { id: 'heal', uses: 'infinite' },
  },
  {
    id: 'shin_glen', name: '大地の番人グレン', attribute: 'shin',
    cost: 17, atk: 2, hp: 5,
    movement: step(DIR4), attackRange: stepAtk(DIR4),
    skill: { id: 'hansha', uses: 'infinite' },
  },
  {
    id: 'shin_titania', name: '月光のエルフ姫ティターニア', attribute: 'shin',
    cost: 19, atk: 4, hp: 3,
    movement: jump(FWD2J), attackRange: ranged(3),
    skill: { id: 'mahi', uses: 3 },
  },
  {
    id: 'shin_yugdra', name: '太古の樹精ユグドラ', attribute: 'shin',
    cost: 22, atk: 0, hp: 8,
    movement: step(FWD1), attackRange: aoe(DIR8),
    skill: { id: 'haru_no_ibuki', uses: 'infinite' },
  },
  {
    id: 'shin_gaia', name: '緑龍の女神ガイア', attribute: 'shin',
    cost: 28, atk: 5, hp: 6,
    movement: step(DIR4), attackRange: aoe(DIR8),
    skill: { id: 'shoushuu', uses: 1 },
  },

  // ════════════════════════════════
  // 🔴 焔（en）— 壊す・燃え尽きる・殴る
  // ════════════════════════════════
  {
    id: 'en_koko', name: '火打ちのドワーフ娘ココ', attribute: 'en',
    cost: 5, atk: 1, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'en_ron', name: '山岳の見習い戦士ロン', attribute: 'en',
    cost: 5, atk: 2, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'en_garo', name: '岩拳の闘士ガロ', attribute: 'en',
    cost: 8, atk: 3, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'kyousenshi', uses: 'infinite' },
  },
  {
    id: 'en_fai', name: '赤鱗の竜娘ファイ', attribute: 'en',
    cost: 9, atk: 2, hp: 2,
    movement: jump(FWD2J), attackRange: stepAtk(FWD1),
    skill: { id: 'nagibarai', uses: 3 },
  },
  {
    id: 'en_bran', name: '山の老猟師ブラン', attribute: 'en',
    cost: 11, atk: 3, hp: 2,
    movement: step(FWD1), attackRange: ranged(3),
    skill: { id: 'penetrate', uses: 3 },
  },
  {
    id: 'en_val', name: '熔岩の魔導士ヴァル', attribute: 'en',
    cost: 12, atk: 2, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'gouka', uses: 1 },
  },
  {
    id: 'en_asuka', name: '火竜騎士アスカ', attribute: 'en',
    cost: 16, atk: 4, hp: 3,
    movement: jump(FWD2J), attackRange: stepAtk(FWD1),
    skill: { id: 'daishinkan', uses: 1 },
  },
  {
    id: 'en_golda', name: '岩石巨人ゴルダ', attribute: 'en',
    cost: 17, atk: 2, hp: 6,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'koutetsu_no_ishi', uses: 1 },
  },
  {
    id: 'en_kagutsuchi', name: '火竜将軍カグツチ', attribute: 'en',
    cost: 19, atk: 5, hp: 4,
    movement: step(FWDBWD), attackRange: ranged(2),
    skill: { id: 'rengeki', uses: 'infinite' },
  },
  {
    id: 'en_bahamut', name: '焔の古竜バハムート', attribute: 'en',
    cost: 28, atk: 6, hp: 6,
    movement: step(DIR4), attackRange: aoe(DIR8),
    skill: { id: 'hangeki', uses: 'infinite' },
  },

  // ════════════════════════════════
  // 🔵 蒼（sou）— 操る・乱す・読む
  // ════════════════════════════════
  {
    id: 'sou_kaito', name: '見習いの船乗りカイト', attribute: 'sou',
    cost: 5, atk: 1, hp: 2,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'sou_miu', name: '小人魚のミウ', attribute: 'sou',
    cost: 5, atk: 1, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
    skill: { id: 'fukitobashi', uses: 3 },
  },
  {
    id: 'sou_nadja', name: '蒼波の踊り子ナージャ', attribute: 'sou',
    cost: 8, atk: 2, hp: 2,
    movement: step(DIR4), attackRange: stepAtk(FWD1),
  },
  {
    id: 'sou_lin', name: '雲の使者リン', attribute: 'sou',
    cost: 9, atk: 1, hp: 2,
    movement: jump(FWD2J), attackRange: stepAtk(FWD1),
    skill: { id: 'shunkan_idou', uses: 1 },
  },
  {
    id: 'sou_juli', name: '嵐の航海士ジュリ', attribute: 'sou',
    cost: 10, atk: 3, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'rensa_raigeki', uses: 3 },
  },
  {
    id: 'sou_quartz', name: '潮風の船長クォーツ', attribute: 'sou',
    cost: 11, atk: 2, hp: 3,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'shikikan', uses: 'infinite' },
  },
  {
    id: 'sou_aqua', name: '深海の歌姫アクア', attribute: 'sou',
    cost: 14, atk: 1, hp: 4,
    movement: step(FWD1), attackRange: noAtk,
    skill: { id: 'hikiyose', uses: 'infinite' },
  },
  {
    id: 'sou_raika', name: '雷神の巫女ライカ', attribute: 'sou',
    cost: 17, atk: 4, hp: 3,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'touketsu', uses: 3 },
  },
  {
    id: 'sou_triton', name: '海神の使者トリトン', attribute: 'sou',
    cost: 18, atk: 3, hp: 4,
    movement: step(DIR4), attackRange: stepAtk(DIR4),
    skill: { id: 'fukitobashi', uses: 'infinite' },
  },
  {
    id: 'sou_leviathan', name: '大海の主リヴァイアサン', attribute: 'sou',
    cost: 28, atk: 5, hp: 7,
    movement: step(FWDBWD), attackRange: aoe(DIR8),
    skill: { id: 'shoukanshi', uses: 'infinite' },
  },

  // ════════════════════════════════
  // ⚙ 鋼（kou）— 計算する・耐える・支配する
  // ════════════════════════════════
  {
    id: 'kou_mk01', name: '試作機MK-01', attribute: 'kou',
    cost: 4, atk: 1, hp: 1,
    movement: step(FWD1), attackRange: stepAtk(FWD1),
  },
  {
    id: 'kou_kano', name: '見習い技師カノ', attribute: 'kou',
    cost: 6, atk: 0, hp: 2,
    movement: step(FWD1), attackRange: noAtk,
    skill: { id: 'heal', uses: 3 },
  },
  {
    id: 'kou_luna', name: '電脳少女ルナ', attribute: 'kou',
    cost: 8, atk: 2, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'keigan', uses: 1 },
  },
  {
    id: 'kou_cog', name: '歯車の騎士コグ', attribute: 'kou',
    cost: 10, atk: 1, hp: 4,
    movement: step(DIR4), attackRange: stepAtk(FWD1),
    skill: { id: 'keigen', uses: 'infinite' },
  },
  {
    id: 'kou_dorothy', name: '科学者の助手ドロシー', attribute: 'kou',
    cost: 11, atk: 0, hp: 2,
    movement: step(FWD1), attackRange: noAtk,
    skill: { id: 'tenkei', uses: 1 },
  },
  {
    id: 'kou_ares', name: '銀の自律兵装ARES', attribute: 'kou',
    cost: 12, atk: 3, hp: 2,
    movement: step(FWD1), attackRange: ranged(2),
    skill: { id: 'rengeki', uses: 'infinite' },
  },
  {
    id: 'kou_grants', name: '機械戦士グランツ', attribute: 'kou',
    cost: 16, atk: 3, hp: 4,
    movement: step(FWD1), attackRange: aoe(DIR8),
    skill: { id: 'nagibarai', uses: 'infinite' },
  },
  {
    id: 'kou_elsa', name: '雷帝の科学者エルザ', attribute: 'kou',
    cost: 18, atk: 2, hp: 3,
    movement: step(FWD1), attackRange: ranged(4),
    skill: { id: 'rensa_raigeki', uses: 'infinite' },
  },
  {
    id: 'kou_titan', name: '重装機甲タイタン', attribute: 'kou',
    cost: 20, atk: 4, hp: 5,
    movement: step(FWD1), attackRange: ranged(4),
    skill: { id: 'big_penetrate', uses: 3 },
  },
  {
    id: 'kou_zero', name: '超兵器ゼロ', attribute: 'kou',
    cost: 30, atk: 6, hp: 5,
    movement: step(FWD1), attackRange: ranged(5),
    skill: { id: 'jibaku', uses: 1 },
  },
];

export const CARD_MAP: Record<string, Card> = Object.fromEntries(
  CARDS.map((c) => [c.id, c])
);

// デッキ構築ヘルパー: 属性でフィルタ
export function getCardsByAttribute(attr: Card['attribute']): Card[] {
  return CARDS.filter(c => c.attribute === attr);
}
