import { QuestDefinition } from '@/lib/types/meta';

// ─── Chapter 0: チュートリアル ────────────────────────────────────────────────

const TUTORIAL: QuestDefinition[] = [
  {
    questId: 'q0_1',
    chapter: 0, order: 1,
    title: '鍛炉の灯',
    description: '召喚・移動・ベース攻撃の基本を学ぼう。',
    prologue: [
      { speaker: '師匠オルブ', text: 'よく来た、見習いよ。まずは鍛炉の使い方を見せよう。' },
      { speaker: '師匠オルブ', text: '試練用の案山子を置いた。カードを召喚し、前進して攻撃するだけでいい。' },
    ],
    epilogue: [
      { speaker: '師匠オルブ', text: 'うむ。基本はつかんだな。次は実戦的な使い方を教えよう。' },
    ],
    enemyDeckId: 'tutorial_scarecrow',
    enemyAIProfileId: 'tutorial_scripted',
    reward: { exp: 30, runes: 50 },
    prerequisites: [],
    tutorialSteps: [
      { message: '手札のカードをタップして召喚場所を選ぼう', targetTestId: 'hand' },
      { message: '召喚したユニットをタップして移動先を選ぼう' },
      { message: '敵陣（最前列）に到達したらベースを攻撃できる' },
    ],
  },
  {
    questId: 'q0_2',
    chapter: 0, order: 2,
    title: '初めての鍛造',
    description: '攻撃射程とスキルの使い方を覚えよう。',
    prologue: [
      { speaker: '師匠オルブ', text: '今度は動く相手だ。弱い民兵を相手に、攻撃とスキルの感覚をつかめ。' },
    ],
    epilogue: [
      { speaker: '師匠オルブ', text: '良い。スキルの使いどころを見極める眼が育ってきた。' },
      { speaker: '師匠オルブ', text: '次が本当の試練だ。自分だけの流派を選べ。' },
    ],
    enemyDeckId: 'tutorial_militia',
    enemyAIProfileId: 'tutorial_scripted',
    reward: { exp: 30, runes: 50 },
    prerequisites: ['q0_1'],
    tutorialSteps: [
      { message: 'ユニットを選んでスキルボタンをタップしてみよう', targetTestId: 'skill-button' },
    ],
  },
  {
    questId: 'q0_3',
    chapter: 0, order: 3,
    title: '旅立ち',
    description: '6つの流派から1つを選び、師匠との模擬戦に挑め。',
    prologue: [
      { speaker: '師匠オルブ', text: '修業の旅に出る前に、お前の流派を決めよ。' },
      { speaker: '師匠オルブ', text: '⚪聖・⚫冥・🟢森・🔴焔・🔵蒼・⚙鋼——それぞれに哲学がある。よく考えて選べ。' },
    ],
    epilogue: [
      { speaker: '師匠オルブ', text: '見事だ。その流派の初期デッキを授けよう。' },
      { speaker: '師匠オルブ', text: '六つの領域が待っている。どこから攻略するかはお前次第だ。' },
    ],
    enemyDeckId: 'tutorial_mentor',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 90, runes: 100 },
    prerequisites: ['q0_2'],
  },
];

// ─── ⚪ Chapter 1: 聖の領域（黎明都市エルナ）────────────────────────────────

const SEI: QuestDefinition[] = [
  {
    questId: 'qsei_1',
    chapter: 1, order: 1,
    title: 'エルナの入口',
    description: '白亜の都市エルナへの門番を倒せ。',
    prologue: [
      { speaker: '門番騎士', text: '聖都エルナへようこそ。……だが、通すわけにはいかない。実力を見せよ。' },
    ],
    epilogue: [
      { speaker: '門番騎士', text: '通れ。貴様には資格がある。' },
    ],
    enemyDeckId: 'sei_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'sei_mireille', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qsei_2',
    chapter: 1, order: 2,
    title: '巡礼の途上',
    description: '巡礼路を守る聖騎士団の分隊に挑め。',
    prologue: [
      { speaker: '聖騎士', text: '修業の旅人か。我らの試練を越えられるか見せてもらおう。' },
    ],
    epilogue: [
      { speaker: '聖騎士', text: 'なかなかやるな。エルナ大聖堂へ続く道を開けよう。' },
    ],
    enemyDeckId: 'sei_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'sei_grail', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qsei_1'],
  },
  {
    questId: 'qsei_3',
    chapter: 1, order: 3,
    title: '試練の社',
    description: '大聖堂の試練の間で待つ守護者を倒せ。',
    prologue: [
      { speaker: '守護者', text: 'この社に踏み込む者よ。光と影、どちらの側に立つのか証明せよ。' },
    ],
    epilogue: [
      { speaker: '守護者', text: '光の意志、確かに感じた。先へ進むがよい。' },
    ],
    enemyDeckId: 'sei_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'sei_alicia', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qsei_2'],
  },
  {
    questId: 'qsei_4',
    chapter: 1, order: 4,
    title: '領主の使い',
    description: '聖王の使者、白翼の守護天使に打ち勝て。',
    prologue: [
      { speaker: '白翼天使', text: '貴様の魂を鍛えた者がいるな。だが聖王ヨハネスの御前に立つ資格があるか確かめよう。' },
    ],
    epilogue: [
      { speaker: '白翼天使', text: '……認めよう。聖王の御前へと案内しよう。' },
    ],
    enemyDeckId: 'sei_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'sei_seraphim', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qsei_3'],
  },
  {
    questId: 'qsei_5',
    chapter: 1, order: 5,
    title: '救世の聖王との対決',
    description: '黎明都市の領主、救世の聖王ヨハネスに挑め。',
    prologue: [
      { speaker: '救世の聖王ヨハネス', text: '修業の旅人よ。鍛炉の師の弟子か……ならば、私自身が相手をしよう。' },
      { speaker: '救世の聖王ヨハネス', text: '光の恵みと剣の冴えを示してみせよ。' },
    ],
    epilogue: [
      { speaker: '救世の聖王ヨハネス', text: 'みごとだ。聖の流派の精髄を理解しつつある。' },
      { speaker: '救世の聖王ヨハネス', text: '私の魂魄をカードに刻め。それがお前の礎となろう。' },
    ],
    enemyDeckId: 'sei_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'sei_johannes', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qsei_4'],
  },
];

// ─── ⚫ Chapter 2: 冥の領域（黄昏墓地ノクス）────────────────────────────────

const MEI: QuestDefinition[] = [
  {
    questId: 'qmei_1',
    chapter: 2, order: 1,
    title: 'ノクスの入口',
    description: '紫月の墓所ノクスの霧の門を守る番人を倒せ。',
    prologue: [
      { speaker: '霧の番人', text: 'ここは黄昏の地、ノクス。生ける者はそうそう足を踏み入れぬ……なぜ来た。' },
    ],
    epilogue: [
      { speaker: '霧の番人', text: '……面白い。通してやる。先に何があるかは知らぬがな。' },
    ],
    enemyDeckId: 'mei_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'mei_rose', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qmei_2',
    chapter: 2, order: 2,
    title: '巡礼の途上',
    description: '骨の回廊を闊歩する不死の戦士たちに勝て。',
    prologue: [
      { speaker: '不死の戦士', text: '我らは死んでもまた蘇る。お前の骨はコレクションに加えてやろう。' },
    ],
    epilogue: [
      { speaker: '不死の戦士', text: 'ぐっ……魂が揺らぐ。お前は本物だ。' },
    ],
    enemyDeckId: 'mei_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'mei_cerberus', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qmei_1'],
  },
  {
    questId: 'qmei_3',
    chapter: 2, order: 3,
    title: '試練の社',
    description: '黒薔薇の魔女が守る霊廟に踏み込め。',
    prologue: [
      { speaker: '黒薔薇の魔女ローズ', text: '興味深い魂魄をお持ちで。ではその魂、私がいただきましょうか。' },
    ],
    epilogue: [
      { speaker: '黒薔薇の魔女ローズ', text: '……ふふ。この魂は奪えない。先へどうぞ。' },
    ],
    enemyDeckId: 'mei_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'mei_nyx', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qmei_2'],
  },
  {
    questId: 'qmei_4',
    chapter: 2, order: 4,
    title: '領主の使い',
    description: '漆黒の堕天使が貴様の実力を試す。',
    prologue: [
      { speaker: '漆黒の堕天使ルキフェル', text: 'ここまで来たか。では私が夜の女王への道を阻もう。' },
    ],
    epilogue: [
      { speaker: '漆黒の堕天使ルキフェル', text: '……我が翼も砕けるか。ニュクスのもとへ行くがいい。' },
    ],
    enemyDeckId: 'mei_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'mei_lucifer', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qmei_3'],
  },
  {
    questId: 'qmei_5',
    chapter: 2, order: 5,
    title: '魔界の王との対決',
    description: '冥の領域を統べる魔界の王ベリアルに挑め。',
    prologue: [
      { speaker: '魔界の王ベリアル', text: '鍛冶師の弟子よ。死と生の境界を理解せぬ者に、私は打ち負かせぬぞ。' },
    ],
    epilogue: [
      { speaker: '魔界の王ベリアル', text: '……冥の理をつかみかけているな。この魂魄、持って行け。' },
    ],
    enemyDeckId: 'mei_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'mei_belial', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qmei_4'],
  },
];

// ─── 🟢 Chapter 3: 森の領域（古樹郷シルウィア）─────────────────────────────

const SHIN: QuestDefinition[] = [
  {
    questId: 'qshin_1',
    chapter: 3, order: 1,
    title: 'シルウィアの入口',
    description: '古樹郷の梢の守り人を越えよ。',
    prologue: [
      { speaker: '梢の守り人', text: 'この森に踏み込むか。木々は全て見ている。お前の心が試されるぞ。' },
    ],
    epilogue: [
      { speaker: '梢の守り人', text: 'ほう。森の息吹が乱れなかった。中へ入れ。' },
    ],
    enemyDeckId: 'shin_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'shin_arca', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qshin_2',
    chapter: 3, order: 2,
    title: '巡礼の途上',
    description: '古樹の根道を守るエルフ族の戦士に挑め。',
    prologue: [
      { speaker: 'エルフ戦士', text: '旅人よ。この根道は我らの聖域だ。敬意を示してみせろ。' },
    ],
    epilogue: [
      { speaker: 'エルフ戦士', text: 'お前の戦い方には敬意がある。大樹の中へ進め。' },
    ],
    enemyDeckId: 'shin_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'shin_glen', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qshin_1'],
  },
  {
    questId: 'qshin_3',
    chapter: 3, order: 3,
    title: '試練の社',
    description: '月光のエルフ姫が守る聖木の洞を突破せよ。',
    prologue: [
      { speaker: '月光のエルフ姫ティターニア', text: 'ここは命の揺り籠。壊しに来た者には容赦しない。' },
    ],
    epilogue: [
      { speaker: '月光のエルフ姫ティターニア', text: '……共生の心を感じた。大地の番人のもとへ行くがいい。' },
    ],
    enemyDeckId: 'shin_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'shin_titania', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qshin_2'],
  },
  {
    questId: 'qshin_4',
    chapter: 3, order: 4,
    title: '領主の使い',
    description: '太古の樹精ユグドラが貴様の覚悟を問う。',
    prologue: [
      { speaker: '太古の樹精ユグドラ', text: 'カードスミスよ……森の魂魄を刻む覚悟があるか、この身で感じてみよ。' },
    ],
    epilogue: [
      { speaker: '太古の樹精ユグドラ', text: 'ふむ……。ガイアへの道が開いた。' },
    ],
    enemyDeckId: 'shin_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'shin_yugdra', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qshin_3'],
  },
  {
    questId: 'qshin_5',
    chapter: 3, order: 5,
    title: '緑龍の女神との対決',
    description: '古樹郷の守護神、緑龍の女神ガイアに挑め。',
    prologue: [
      { speaker: '緑龍の女神ガイア', text: '大地の声が聞こえるか？鍛冶師よ、この森の全ての命が見守っている。' },
    ],
    epilogue: [
      { speaker: '緑龍の女神ガイア', text: '……大地はお前を認めた。私の魂魄、刻んでいくがよい。' },
    ],
    enemyDeckId: 'shin_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'shin_gaia', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qshin_4'],
  },
];

// ─── 🔴 Chapter 4: 焔の領域（灼炎砂漠アルダ）──────────────────────────────

const EN: QuestDefinition[] = [
  {
    questId: 'qen_1',
    chapter: 4, order: 1,
    title: 'アルダの入口',
    description: '砂嵐の入口でくすぶる傭兵崩れを倒せ。',
    prologue: [
      { speaker: '砂漠の傭兵', text: 'この荒野に迷い込んだか。せめて俺との戦いで骨を温めていけ。' },
    ],
    epilogue: [
      { speaker: '砂漠の傭兵', text: '燃えるような戦い方をするな。先を見せてやる。' },
    ],
    enemyDeckId: 'en_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'en_val', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qen_2',
    chapter: 4, order: 2,
    title: '巡礼の途上',
    description: '溶岩台地を縄張りとする蛮族の戦士と戦え。',
    prologue: [
      { speaker: '蛮族の戦士', text: '強さこそすべて！お前の力を俺に見せろ！' },
    ],
    epilogue: [
      { speaker: '蛮族の戦士', text: 'ぬあっ……！強い！炎の竜騎士への道を教えてやる。' },
    ],
    enemyDeckId: 'en_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'en_asuka', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qen_1'],
  },
  {
    questId: 'qen_3',
    chapter: 4, order: 3,
    title: '試練の社',
    description: '火山口の試練場に潜む岩石巨人に打ち勝て。',
    prologue: [
      { speaker: '岩石巨人ゴルダ', text: '炎に鍛えられた肉体があるなら、私の拳に耐えてみよ。' },
    ],
    epilogue: [
      { speaker: '岩石巨人ゴルダ', text: 'おぬしには炎の意志がある……先へ行け。' },
    ],
    enemyDeckId: 'en_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'en_golda', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qen_2'],
  },
  {
    questId: 'qen_4',
    chapter: 4, order: 4,
    title: '領主の使い',
    description: '焔の軍将カグツチが最後の関門に立ちはだかる。',
    prologue: [
      { speaker: '火竜将軍カグツチ', text: '古竜バハムートの御前に立とうというのか。この炎を越えてみせろ。' },
    ],
    epilogue: [
      { speaker: '火竜将軍カグツチ', text: '……炎に飲まれなかった。バハムートのもとへ行くがいい。' },
    ],
    enemyDeckId: 'en_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'en_kagutsuchi', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qen_3'],
  },
  {
    questId: 'qen_5',
    chapter: 4, order: 5,
    title: '焔の古竜との対決',
    description: '灼炎砂漠の支配者、焔の古竜バハムートに挑め。',
    prologue: [
      { speaker: '焔の古竜バハムート', text: 'ちっぽけな鍛冶師が……。だが、この炎に焼かれても立つ魂魄を見た。' },
      { speaker: '焔の古竜バハムート', text: '全力で燃やし尽くしてやろう！' },
    ],
    epilogue: [
      { speaker: '焔の古竜バハムート', text: '……俺の炎さえ超えたか。この魂魄を刻む資格がある。' },
    ],
    enemyDeckId: 'en_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'en_bahamut', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qen_4'],
  },
];

// ─── 🔵 Chapter 5: 蒼の領域（凍湖郷アズリア）──────────────────────────────

const SOU: QuestDefinition[] = [
  {
    questId: 'qsou_1',
    chapter: 5, order: 1,
    title: 'アズリアの入口',
    description: '凍りついた湖畔の見張り番を倒せ。',
    prologue: [
      { speaker: '湖畔の見張り', text: 'アズリアの氷宮に来たか。まず俺の水槍を受けてみろ。' },
    ],
    epilogue: [
      { speaker: '湖畔の見張り', text: 'ふむ。流れを読む目があるな。進んでいい。' },
    ],
    enemyDeckId: 'sou_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'sou_quartz', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qsou_2',
    chapter: 5, order: 2,
    title: '巡礼の途上',
    description: '凍結の廻廊を守る海の精霊使いに挑め。',
    prologue: [
      { speaker: '精霊使い', text: '流れに従うも逆らうも、お前の心次第。その意志を見せてもらおう。' },
    ],
    epilogue: [
      { speaker: '精霊使い', text: '……潮目が読めているな。氷宮の奥へどうぞ。' },
    ],
    enemyDeckId: 'sou_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'sou_aqua', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qsou_1'],
  },
  {
    questId: 'qsou_3',
    chapter: 5, order: 3,
    title: '試練の社',
    description: '雷神の巫女ライカが嵐の試練を課す。',
    prologue: [
      { speaker: '雷神の巫女ライカ', text: '嵐の中心を見極められるか？その眼力、試してあげる。' },
    ],
    epilogue: [
      { speaker: '雷神の巫女ライカ', text: 'さすが……嵐さえ読む目がある。先へ行って。' },
    ],
    enemyDeckId: 'sou_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'sou_raika', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qsou_2'],
  },
  {
    questId: 'qsou_4',
    chapter: 5, order: 4,
    title: '領主の使い',
    description: '海神の使者トリトンが氷宮の扉を守る。',
    prologue: [
      { speaker: '海神の使者トリトン', text: 'リヴァイアサンに会いたいか。ならば私の怒涛を受け止めてみせよ。' },
    ],
    epilogue: [
      { speaker: '海神の使者トリトン', text: '……波を制した。リヴァイアサンのもとへ案内しよう。' },
    ],
    enemyDeckId: 'sou_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'sou_triton', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qsou_3'],
  },
  {
    questId: 'qsou_5',
    chapter: 5, order: 5,
    title: '大海の主との対決',
    description: '凍湖郷を統べる大海の主リヴァイアサンに挑め。',
    prologue: [
      { speaker: '大海の主リヴァイアサン', text: 'カードスミスよ……深海の静けさと嵐の荒々しさ、両方を知ってこそ蒼の流派だ。' },
    ],
    epilogue: [
      { speaker: '大海の主リヴァイアサン', text: '……深淵まで届く意志だ。この魂魄を受け取れ。' },
    ],
    enemyDeckId: 'sou_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'sou_leviathan', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qsou_4'],
  },
];

// ─── ⚙ Chapter 6: 鋼の領域（機甲坑道クロムト）─────────────────────────────

const KOU: QuestDefinition[] = [
  {
    questId: 'qkou_1',
    chapter: 6, order: 1,
    title: 'クロムトの入口',
    description: '蒸気管の迷宮に配備された試作機を倒せ。',
    prologue: [
      { speaker: '工場監督', text: '生身の人間がここまで来るとは。まずテスト機の相手をしてもらおうか。' },
    ],
    epilogue: [
      { speaker: '工場監督', text: 'データ収集完了。奥の工廠へ通行証を渡そう。' },
    ],
    enemyDeckId: 'kou_1',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 60, runes: 100, cards: [{ cardId: 'kou_ares', count: 2 }] },
    rewardReplay: { exp: 12, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'qkou_2',
    chapter: 6, order: 2,
    title: '巡礼の途上',
    description: '精錬炉の番人、機械戦士グランツに挑め。',
    prologue: [
      { speaker: '機械戦士グランツ', text: '侵入者確認。排除プログラム起動。……感情なき言葉だ、すまないね。' },
    ],
    epilogue: [
      { speaker: '機械戦士グランツ', text: '戦闘データを更新した。貴君の強さは誤差の範囲外だ。先へどうぞ。' },
    ],
    enemyDeckId: 'kou_2',
    enemyAIProfileId: 'easy_balanced',
    reward: { exp: 70, runes: 120, cards: [{ cardId: 'kou_grants', count: 2 }] },
    rewardReplay: { exp: 14, runes: 36 },
    prerequisites: ['qkou_1'],
  },
  {
    questId: 'qkou_3',
    chapter: 6, order: 3,
    title: '試練の社',
    description: '雷帝の科学者エルザが極限試験を課す。',
    prologue: [
      { speaker: '雷帝の科学者エルザ', text: '最適解を出せるか確かめたい。ここは私の実験場よ。' },
    ],
    epilogue: [
      { speaker: '雷帝の科学者エルザ', text: '……計算外の解を出した。興味深い。タイタンへの道を開けるわ。' },
    ],
    enemyDeckId: 'kou_3',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 90, runes: 150, cards: [{ cardId: 'kou_elsa', count: 2 }] },
    rewardReplay: { exp: 18, runes: 45 },
    prerequisites: ['qkou_2'],
  },
  {
    questId: 'qkou_4',
    chapter: 6, order: 4,
    title: '領主の使い',
    description: '重装機甲タイタンが最終防衛ラインに立つ。',
    prologue: [
      { speaker: '重装機甲タイタン', text: '超兵器ゼロへのアクセスコードは渡せない。実力で奪ってみせろ。' },
    ],
    epilogue: [
      { speaker: '重装機甲タイタン', text: 'アクセス許可。……お前のロジックは予測不能だ。' },
    ],
    enemyDeckId: 'kou_4',
    enemyAIProfileId: 'normal_balanced',
    reward: { exp: 110, runes: 180, cards: [{ cardId: 'kou_titan', count: 2 }] },
    rewardReplay: { exp: 22, runes: 54 },
    prerequisites: ['qkou_3'],
  },
  {
    questId: 'qkou_5',
    chapter: 6, order: 5,
    title: '超兵器ゼロとの対決',
    description: '機甲坑道の頂点、超兵器ゼロに挑め。',
    prologue: [
      { speaker: '超兵器ゼロ', text: '全データ解析完了。お前の勝率は3.7%。それでも挑むか？' },
      { speaker: '超兵器ゼロ', text: '……面白い。では予測不能な動きを見せてもらおう。' },
    ],
    epilogue: [
      { speaker: '超兵器ゼロ', text: 'データ更新。お前の存在は私の計算を超えた。魂魄データを転送する。' },
    ],
    enemyDeckId: 'kou_5',
    enemyAIProfileId: 'hard_balanced',
    reward: { exp: 150, runes: 300, cards: [{ cardId: 'kou_zero', count: 2 }] },
    rewardReplay: { exp: 30, runes: 90 },
    prerequisites: ['qkou_4'],
  },
];

// ─── ストーリーバトル（第0〜1章） ─────────────────────────────────────────────

const STORY_BATTLES: QuestDefinition[] = [
  {
    questId: 'story_0_4',
    chapter: 0, order: 10,
    title: '野盗との戦闘（第0章シーン4）',
    description: '野盗を撃退せよ。',
    enemyDeckId: 'story_bandit_easy',
    enemyAIProfileId: 'tutorial_scripted',
    enemyBaseHp: 5,
    reward: { exp: 10, runes: 20 },
    prerequisites: [],
  },
  {
    questId: 'story_1_2',
    chapter: 1, order: 10,
    title: '街道の野盗戦（第1章シーン2）',
    description: '街道の野盗を撃退せよ。',
    enemyDeckId: 'story_bandit_easy',
    enemyAIProfileId: 'tutorial_scripted',
    enemyBaseHp: 5,
    reward: { exp: 20, runes: 30 },
    prerequisites: [],
  },
  {
    questId: 'story_1_4',
    chapter: 1, order: 11,
    title: 'ゴロツキ撃退（第1章シーン4）',
    description: '写畜を守れ。',
    enemyDeckId: 'story_thug',
    enemyAIProfileId: 'easy_balanced',
    enemyBaseHp: 5,
    reward: { exp: 30, runes: 40 },
    prerequisites: [],
  },
  {
    questId: 'story_1_5',
    chapter: 1, order: 12,
    title: '子供たちの挑戦（第1章シーン5）',
    description: 'ニケをいじめる子供たちを退けろ。',
    enemyDeckId: 'story_kids',
    enemyAIProfileId: 'tutorial_scripted',
    enemyBaseHp: 5,
    reward: { exp: 25, runes: 35 },
    prerequisites: [],
  },
];

// ─── エクスポート ─────────────────────────────────────────────────────────────

export const QUESTS: QuestDefinition[] = [
  ...TUTORIAL,
  ...STORY_BATTLES,
  ...SEI,
  ...MEI,
  ...SHIN,
  ...EN,
  ...SOU,
  ...KOU,
];

export const QUEST_MAP: Record<string, QuestDefinition> = Object.fromEntries(
  QUESTS.map(q => [q.questId, q])
);

export function getChapterQuests(chapter: number): QuestDefinition[] {
  return QUESTS.filter(q => q.chapter === chapter).sort((a, b) => a.order - b.order);
}

export const CHAPTERS = [
  { chapter: 0, title: 'Chapter 0: チュートリアル' },
  { chapter: 1, title: 'Chapter 1: ⚪ 黎明都市〈エルナ〉' },
  { chapter: 2, title: 'Chapter 2: ⚫ 黄昏墓地〈ノクス〉' },
  { chapter: 3, title: 'Chapter 3: 🟢 古樹郷〈シルウィア〉' },
  { chapter: 4, title: 'Chapter 4: 🔴 灼炎砂漠〈アルダ〉' },
  { chapter: 5, title: 'Chapter 5: 🔵 凍湖郷〈アズリア〉' },
  { chapter: 6, title: 'Chapter 6: ⚙️ 機甲坑道〈クロムト〉' },
];
