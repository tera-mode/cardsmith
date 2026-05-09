// 全スキルをここでインポートして登録する
// インポート順は依存関係に注意（dispatcher.ts は循環参照しないよう後に読まれる）

// 既存5スキル
import './penetrate';
import './big_penetrate';
import './hangeki';
import './buff';
import './heal';

// 召喚時
import './gouka';
import './shoushuu';
import './keigan';
import './gaisen';
import './sokouchi';

// 攻撃時
import './rengeki';
import './rensa_raigeki';
import './nagibarai';
import './fukitobashi';
import './touketsu';
import './chinmoku';
import './kyuuketsu';

// 被攻撃時
import './hansha';
import './ikari';

// 死亡時
import './zangai';
import './fukkatsu';
import './junkyou';
import './shinigiwa';

// ターン端
import './shikikan';
import './shi_no_ryouiki';
import './haru_no_ibuki';
import './saisei';

// オーラ
import './keigen';
import './koutetsu_no_ishi';
import './kyousenshi';
import './seinaru_kago';
import './senki';

// 起動型
import './strong_blow';
import './juugeki';
import './tsumanami';
import './daishinkan';
import './hikiyose';
import './irekae';
import './shunkan_idou';
import './kagebunshin';
import './shoukanshi';
import './tenkei';
import './jibaku';
import './mahi';

// ── 攻撃時スキル (v2) ────────────────────────────────────────────────────
import './shinshoku';
import './chodan';
import './mujihi';
import './buki_hakai';

// ── 被ダメージ時スキル (v2) ──────────────────────────────────────────────
import './teni';
import './touketsu_hansha';
import './bankai';

// ── 死亡時スキル (v2) ────────────────────────────────────────────────────
import './eiyou';
import './daishou_no_tamashii';
import './saikouchiku';
import './hatsuga';

// ── ターン端スキル (v2) ──────────────────────────────────────────────────
import './dokumu';
import './kunren';

// ── オーラスキル (v2) ────────────────────────────────────────────────────
import './shireijutsu';
import './mure';
import './kokou';

// ── 起動型スキル (v2) ────────────────────────────────────────────────────
import './ansatsu';
import './kakusei';
import './abekobe';
import './soukan';

// ── on_move スキル ───────────────────────────────────────────────────────
import './shissou';
import './zankyou';
import './junrei';
import './kazeyomi';
import './tsuiseki';

// ── on_skill_used スキル ─────────────────────────────────────────────────
import './maryoku_zoufuku';
import './rendou';
import './shokubai';
import './kyuushuu';
import './rensajumon';

// ── on_summon_ally スキル ────────────────────────────────────────────────
import './shukufuku';
import './kobu_summon';
import './kangei_no_gi';
import './kyoumei';
import './summon_chain';

// ── on_base_damaged スキル ───────────────────────────────────────────────
import './chuusei';
import './houfuku_no_yaiba';
import './douin';
import './dohatsu';
import './gekibun';

export { getSkill, getAllSkills, getSkillsByTrigger } from './registry';
