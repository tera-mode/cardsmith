import { QuestDefinition } from '@/lib/types/meta';

export const QUESTS: QuestDefinition[] = [
  // ─── Chapter 1：鍛冶師見習い ──────────────────────────────────────────────
  {
    questId: 'q1_1',
    chapter: 1, order: 1,
    title: '第1話：最初の一歩',
    description: '基本操作を覚えよう。召喚・移動・攻撃を体験する。',
    prologue: [
      { speaker: '師匠', text: 'よし、まずは基本から教えよう。カードを召喚して、敵を倒すんだ。' },
      { speaker: '見習い', text: 'はい！やってみます！' },
    ],
    epilogue: [
      { speaker: '師匠', text: 'よくやった！その調子だ。次はスキルを使ってみよう。' },
    ],
    enemyDeckId: 'enemy_easy_1',
    enemyAiLevel: 'easy',
    reward: { exp: 50, runes: 100, cards: [{ cardId: 'archer', count: 1 }] },
    prerequisites: [],
  },
  {
    questId: 'q1_2',
    chapter: 1, order: 2,
    title: '第2話：スキルの力',
    description: '弓兵の「貫通」スキルを使って敵を倒せ。',
    prologue: [
      { speaker: '師匠', text: '弓兵には「貫通」というスキルがある。前方の敵を貫いて攻撃できるぞ。' },
    ],
    epilogue: [
      { speaker: '師匠', text: 'スキルを使いこなせたな。これで戦術の幅が広がる。' },
    ],
    enemyDeckId: 'enemy_easy_2',
    enemyAiLevel: 'easy',
    reward: { exp: 50, runes: 100, cards: [{ cardId: 'healer', count: 1 }] },
    prerequisites: ['q1_1'],
  },
  {
    questId: 'q1_3',
    chapter: 1, order: 3,
    title: '第3話：敵陣を崩せ',
    description: '敵の本陣を攻撃して HP を 0 にしろ。',
    prologue: [
      { speaker: '師匠', text: '最前線まで進軍して、敵陣に直接攻撃を叩き込め！' },
    ],
    epilogue: [
      { speaker: '師匠', text: '完璧な戦術だ。お前はもう見習いではないかもしれない。' },
    ],
    enemyDeckId: 'enemy_easy_3',
    enemyAiLevel: 'easy',
    reward: { exp: 50, runes: 100, materials: [{ materialId: 'move_forward_1', count: 1 }, { materialId: 'range_melee_1', count: 1 }] },
    prerequisites: ['q1_2'],
  },
  {
    questId: 'q1_4',
    chapter: 1, order: 4,
    title: '第4話：本気の戦い',
    description: '油断のない相手に勝て。',
    prologue: [
      { speaker: '師匠', text: '今度はこちらも本気で戦う。実力を見せてもらうぞ。' },
    ],
    epilogue: [
      { speaker: '師匠', text: '素晴らしい！お前の成長は目覚ましい。' },
    ],
    enemyDeckId: 'enemy_normal_1',
    enemyAiLevel: 'normal',
    reward: { exp: 100, runes: 200, materials: [{ materialId: 'stat_atk_1', count: 2 }, { materialId: 'stat_hp_1', count: 2 }] },
    prerequisites: ['q1_3'],
  },
  {
    questId: 'q1_5',
    chapter: 1, order: 5,
    title: '第5話：章のボス',
    description: 'Chapter 1 最強の敵に挑め。',
    prologue: [
      { speaker: '師匠', text: 'これが Chapter 1 の最終試練だ。全力で挑め！' },
    ],
    epilogue: [
      { speaker: '師匠', text: '見事だ！お前は一人前の鍛冶師への道を歩み始めた。' },
      { speaker: '師匠', text: '次は南の砦へ向かうがよい。新たな試練が待っている。' },
    ],
    enemyDeckId: 'enemy_hard_1',
    enemyAiLevel: 'hard',
    reward: { exp: 300, runes: 500, cards: [{ cardId: 'cavalry', count: 1 }] },
    rewardReplay: { exp: 30, runes: 50 },
    prerequisites: ['q1_4'],
  },
  // ─── Chapter 2：南の砦 ────────────────────────────────────────────────────
  {
    questId: 'q2_1',
    chapter: 2, order: 1,
    title: '第1話：砦への道',
    description: '南の砦に向かう途中の敵を排除せよ。',
    prologue: [
      { speaker: '斥候', text: '南の砦に敵が集結しています。まず偵察部隊を倒してください。' },
    ],
    epilogue: [{ speaker: '斥候', text: 'よし、道が開けた。砦へ向かいましょう。' }],
    enemyDeckId: 'enemy_normal_1',
    enemyAiLevel: 'normal',
    reward: { exp: 150, runes: 300, materials: [{ materialId: 'move_jump_2', count: 1 }] },
    prerequisites: ['q1_5'],
  },
  {
    questId: 'q2_2',
    chapter: 2, order: 2,
    title: '第2話：砦の守兵',
    description: '砦を守る精鋭部隊を撃破せよ。',
    prologue: [{ speaker: '砦守兵', text: 'この砦は渡さん！全員、迎撃準備！' }],
    epilogue: [{ speaker: '斥候', text: '砦の守りを突破しました！' }],
    enemyDeckId: 'enemy_normal_2',
    enemyAiLevel: 'normal',
    reward: { exp: 150, runes: 300, materials: [{ materialId: 'range_shoot_2', count: 1 }] },
    prerequisites: ['q2_1'],
  },
  {
    questId: 'q2_3',
    chapter: 2, order: 3,
    title: '第3話：砦の奥地',
    description: '砦の奥深くに潜む敵を倒せ。',
    prologue: [{ speaker: '謎の声', text: 'ここまで来たか。だが、この先は通さぬ。' }],
    epilogue: [{ speaker: '斥候', text: '奥の部屋も制圧しました！' }],
    enemyDeckId: 'enemy_normal_2',
    enemyAiLevel: 'normal',
    reward: { exp: 150, runes: 300, materials: [{ materialId: 'skill_pen_3', count: 1 }] },
    prerequisites: ['q2_2'],
  },
  {
    questId: 'q2_4',
    chapter: 2, order: 4,
    title: '第4話：砦の将軍',
    description: '砦を統率する将軍に挑め。',
    prologue: [{ speaker: '将軍', text: 'よくここまで来た。だが私の前では、誰も勝てない！' }],
    epilogue: [{ speaker: '将軍', text: '……参った。お前の腕は本物だ。' }],
    enemyDeckId: 'enemy_hard_1',
    enemyAiLevel: 'hard',
    reward: { exp: 200, runes: 400, materials: [{ materialId: 'stat_hp_2', count: 2 }, { materialId: 'stat_atk_2', count: 2 }] },
    prerequisites: ['q2_3'],
  },
  {
    questId: 'q2_5',
    chapter: 2, order: 5,
    title: '第5話：南の砦・章ボス',
    description: 'Chapter 2 の真の支配者を倒せ。',
    prologue: [
      { speaker: '影の者', text: '将軍を倒したとは……あなたは強い。では私が相手しましょう。' },
    ],
    epilogue: [
      { speaker: '影の者', text: '……負けた。北の山岳へ行けば、さらなる強敵が待っている。' },
    ],
    enemyDeckId: 'enemy_hard_2',
    enemyAiLevel: 'hard',
    reward: { exp: 500, runes: 800, cards: [{ cardId: 'cannon', count: 1 }] },
    rewardReplay: { exp: 50, runes: 80 },
    prerequisites: ['q2_4'],
  },
  // ─── Chapter 3：北の山岳 ──────────────────────────────────────────────────
  {
    questId: 'q3_1',
    chapter: 3, order: 1,
    title: '第1話：山岳の入口',
    description: '険しい山道の番人を倒せ。',
    prologue: [{ speaker: '番人', text: 'この山に来たか。通るなら俺を倒してみろ。' }],
    epilogue: [{ speaker: '番人', text: 'お見事……。先へ進め。' }],
    enemyDeckId: 'enemy_normal_2',
    enemyAiLevel: 'normal',
    reward: { exp: 200, runes: 350, materials: [{ materialId: 'move_omni_1', count: 1 }] },
    prerequisites: ['q2_5'],
  },
  {
    questId: 'q3_2',
    chapter: 3, order: 2,
    title: '第2話：山の民',
    description: '山に住む戦士たちの挑戦を受けよ。',
    prologue: [{ speaker: '山の戦士', text: '我々は強者しか認めない。実力を見せろ！' }],
    epilogue: [{ speaker: '山の戦士', text: 'ふむ、認めよう。この先へ進む資格がある。' }],
    enemyDeckId: 'enemy_hard_1',
    enemyAiLevel: 'hard',
    reward: { exp: 200, runes: 350, materials: [{ materialId: 'range_omni_1', count: 1 }] },
    prerequisites: ['q3_1'],
  },
  {
    questId: 'q3_3',
    chapter: 3, order: 3,
    title: '第3話：山頂の神殿',
    description: '古代の神殿を守る番人を撃破せよ。',
    prologue: [{ speaker: '神殿の声', text: '汝、真の鍛冶師か？ならば試練を受けよ。' }],
    epilogue: [{ speaker: '神殿の声', text: '合格だ。神殿の奥へ進む許可を与えよう。' }],
    enemyDeckId: 'enemy_hard_2',
    enemyAiLevel: 'hard',
    reward: { exp: 200, runes: 400, materials: [{ materialId: 'skill_counter_inf', count: 1 }] },
    prerequisites: ['q3_2'],
  },
  {
    questId: 'q3_4',
    chapter: 3, order: 4,
    title: '第4話：伝説の鍛冶師',
    description: '伝説の鍛冶師が遺した最強の戦略を超えろ。',
    prologue: [
      { speaker: '幻影', text: '私は過去の鍛冶師の幻影。あなたが最強の後継者かどうか確かめましょう。' },
    ],
    epilogue: [
      { speaker: '幻影', text: 'あなたが真の後継者です。最後の試練へ。' },
    ],
    enemyDeckId: 'enemy_hard_2',
    enemyAiLevel: 'hard',
    reward: { exp: 300, runes: 500, materials: [{ materialId: 'skill_heal_inf', count: 1 }] },
    prerequisites: ['q3_3'],
  },
  {
    questId: 'q3_5',
    chapter: 3, order: 5,
    title: '第5話：APEX CARDSMITH',
    description: '最強の称号を賭けた最終決戦！',
    prologue: [
      { speaker: '???', text: '君が最強カード鍛冶師を目指す者か。ならば……私が相手だ。' },
      { speaker: '???', text: '私はかつての「APEX CARDSMITH」。君の全力を見せてみろ。' },
    ],
    epilogue: [
      { speaker: 'APEX', text: '……素晴らしい。君は真の APEX CARDSMITH だ。' },
      { speaker: 'APEX', text: '自分だけの最強カードを鍛え続けろ。それがこのゲームの本質だ。' },
    ],
    enemyDeckId: 'enemy_hard_2',
    enemyAiLevel: 'hard',
    reward: { exp: 800, runes: 1500, cards: [{ cardId: 'defender', count: 1 }] },
    rewardReplay: { exp: 80, runes: 150 },
    prerequisites: ['q3_4'],
  },
];

export const QUEST_MAP: Record<string, QuestDefinition> = Object.fromEntries(
  QUESTS.map(q => [q.questId, q])
);

export function getChapterQuests(chapter: number): QuestDefinition[] {
  return QUESTS.filter(q => q.chapter === chapter).sort((a, b) => a.order - b.order);
}

export const CHAPTERS = [
  { chapter: 1, title: 'Chapter 1：鍛冶師見習い' },
  { chapter: 2, title: 'Chapter 2：南の砦' },
  { chapter: 3, title: 'Chapter 3：北の山岳' },
];
