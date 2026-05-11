# cardsmith — スキル拡張 v2 実装要件書

## 1. 概要

既存のスキルレジストリ機構（`SkillDefinition` / `SkillTriggerKind`）を活用して、**新規スキル40種**と**新規トリガー4種**を追加する。本ドキュメントはClaude Codeへの実装指示書として作成。

### 1.1 ゴール

- 既存の8種トリガーに沿った新規スキル20種を追加
- 新規トリガー4種（`on_move` / `on_skill_used` / `on_summon_ally` / `on_base_damaged`）をディスパッチャに追加
- 新規トリガーごとに5種ずつ、計20種のスキルを追加
- 各スキルに対応する `Material` を `src/lib/data/materials.ts` に登録
- Type errorゼロ・既存テストが通る状態でPRをまとめる

### 1.2 作業順序

```
Phase 1: 既存トリガー向けスキル20種実装（registryに追加するだけ）
  ↓
Phase 2: 新規トリガー4種をregistry.ts/dispatcher.ts/apply.tsに追加
  ↓
Phase 3: 新規トリガー向けスキル20種実装
  ↓
Phase 4: materials.ts への素材登録、コスト調整
  ↓
Phase 5: シミュレーター（npm run sim）でバランス確認
```

---

## 2. 採用スキル一覧（既存トリガー向け：20種）

### 2.1 攻撃時 (on_attack) — 4種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `shinshoku` | 侵蝕 | 攻撃時、対象を倒した場合のみATK+1（永続） | 冥/鋼 | 6 |
| `chodan` | 跳弾 | 攻撃時、ATK÷2（切り捨て）のダメージがランダムな別の敵1体にも飛ぶ | 鋼/蒼 | 6 |
| `mujihi` | 無慈悲 | 攻撃時、対象のHPが既に半分以下なら即破壊 | 冥 | 8 |
| `buki_hakai` | 武器破壊 | 攻撃時、対象のATK-1（永続バフ） | 焔/鋼 | 6 |

### 2.2 被ダメージ時 (on_damaged) — 3種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `teni` | 転移 | 被ダメ時、ランダムな空きマスに瞬間移動（回避ではなくダメージは確定後に移動） | 蒼 | 6 |
| `touketsu_hansha` | 凍結反射 | 被ダメ時、攻撃元を1ターン凍結 | 蒼 | 7 |
| `bankai` | 挽回 | 被ダメで初めてHP半分以下になった瞬間、HP+2回復（1度きり） | 聖 | 5 |

### 2.3 死亡時 (on_death) — 4種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `eiyou` | 栄養 | 死亡時、味方全員（場のユニットのみ）ATK+1（永続バフ） | 森 | 6 |
| `daishou_no_tamashii` | 代償の魂 | 死亡時、自陣HP+2回復 | 聖/森 | 5 |
| `saikouchiku` | 再構築 | 死亡時、手札の最低コストカードを即召喚（自分のいたマス） | 鋼 | 7 |
| `hatsuga` | 発芽 | 死亡時、自分のいたマスに1/1の苗トークン生成 | 森 | 4 |

### 2.4 ターン端 (on_turn_start / on_turn_end) — 2種

| ID | 表示名 | トリガー | 効果 | 流派 | 想定cost |
|---|---|---|---|---|---|
| `dokumu` | 毒霧 | on_turn_end | 自ターン終了時、隣接全敵に1ダメージ | 冥/森 | 7 |
| `kunren` | 訓練 | on_turn_start | 自ターン開始時、隣接する味方1体（ランダム）のATK+1（永続） | 聖/鋼 | 7 |

### 2.5 オーラ (aura) — 3種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `shireijutsu` | 死霊術 | 自分以外の味方が死ぬたびに自身ATK+1（場に存在し続ける限り蓄積） | 冥 | 8 |
| `mure` | 群れ | 同流派の味方（自分含む）が3体以上場にいる時、自身ATK+2 | 全流派 | 6 |
| `kokou` | 孤高 | 周囲8方向に味方がいない時、自身ATK+3 | 焔/鋼 | 7 |

> ⚠️ `shireijutsu` は厳密には `aura` ではなく「他者の `on_death` を観測する」型。**実装上は新規トリガー `on_ally_death` を追加するか、`on_death` ディスパッチ時に「死亡したユニットの味方側スキャン」をフックする**かのどちらか。後者を推奨（軽量）。

### 2.6 起動型 (activated) — 4種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `ansatsu` | 暗殺 | 対象の1マス後方（対象から見た自陣側）に自分がいる場合のみ発動可。対象は即死 | 冥/焔 | 8 |
| `kakusei` | 覚醒 | 味方1体のATK+2, HP+2（対象は永続、本スキルは1度のみ） | 聖/森 | 7 |
| `abekobe` | あべこべ | 対象（敵味方問わず）のATK（baseのみ）と現在HPを入れ替える | 蒼 | 6 |
| `soukan` | 送還 | 対象（敵）をその所有者の手札に戻す | 蒼 | 8 |

---

## 3. 新規トリガー仕様

### 3.1 追加するトリガー種別

`src/lib/game/skills/registry.ts` の `SkillTriggerKind` に以下を追加：

```typescript
export type SkillTriggerKind =
  | 'on_summon'
  | 'on_attack'
  | 'on_damaged'
  | 'on_death'
  | 'on_turn_start'
  | 'on_turn_end'
  | 'activated'
  | 'aura'
  // ▼ 以下を追加
  | 'on_move'           // 自分が移動した直後
  | 'on_skill_used'     // 場の他ユニットがスキルを使用した直後
  | 'on_summon_ally'    // 味方ユニット（自分以外）が召喚された直後
  | 'on_base_damaged';  // 自陣HPが減った直後
```

### 3.2 SkillContext の拡張

```typescript
export interface SkillContext {
  remainingUses: number | 'infinite';
  turnCount: number;
  currentTurn: 'player' | 'ai';
  damagedBy?: Unit;
  damageAmount?: number;
  killedBy?: Unit;
  attackTarget?: Unit;
  // ▼ 以下を追加
  movedFrom?: Position;        // on_move: 移動元の位置
  movedTo?: Position;          // on_move: 移動先の位置
  skillUser?: Unit;            // on_skill_used: スキルを使用したユニット
  skillUsedId?: string;        // on_skill_used: 使用されたスキルID
  summonedAlly?: Unit;         // on_summon_ally: 召喚された味方
  baseDamageAmount?: number;   // on_base_damaged: 自陣HPの減少量
}
```

### 3.3 ディスパッチャ実装

`src/lib/game/events/dispatcher.ts` に以下の関数を追加。**全関数とも `MAX_DISPATCH_DEPTH` チェック・`recalculateAuras` を含めること。**

#### 3.3.1 `triggerOnMove(state, unit, fromPos, toPos)`

- 移動したユニット自身の `on_move` スキルを発火
- 呼び出し場所: `src/lib/game/apply.ts` の `applyMove` 関数の最後
- 既存実装の参考: `triggerOnSummon` をベースに

#### 3.3.2 `triggerOnSkillUsed(state, skillUser, skillId)`

- **場上の全ユニット（`skillUser` 自身を除く）** をスキャンし、`on_skill_used` トリガーを発火
- 呼び出し場所:
  - `triggerOnSummon` の最後
  - `triggerOnAttack` の最後
  - `triggerOnTurnStart` 内の各スキル発火後
  - `triggerOnTurnEnd` 内の各スキル発火後
  - `processDeath` 内の発火後（on_death）
  - `resolveActivatedSkill` の最後
  - `applyDamage` 内の `on_damaged` 発火後
- ⚠️ **無限ループ防止**: `eventDepth` チェックで再帰を抑制（既存の `MAX_DISPATCH_DEPTH=20` で十分）

#### 3.3.3 `triggerOnSummonAlly(state, summonedUnit)`

- `summonedUnit.owner` と同じ陣営の場上ユニット（`summonedUnit` 自身を除く）をスキャンし、`on_summon_ally` を発火
- 呼び出し場所: `src/lib/game/apply.ts` の `applySummon` 内、`triggerOnSummon(s, unit)` の**直後**

#### 3.3.4 `triggerOnBaseDamaged(state, damagedOwner, amount)`

- `damagedOwner` 陣営の場上ユニット全てをスキャンし、`on_base_damaged` を発火
- 呼び出し場所: `src/lib/game/helpers.ts` の `applyBaseDamage` 関数の最後
- ⚠️ `applyBaseDamage` は既存ヘルパー。シグネチャ変更が必要なら必ず**全呼び出し元を確認**して整合させる

### 3.4 dispatcher.ts への変更例（on_move）

```typescript
// dispatcher.ts に追加
export function triggerOnMove(
  state: GameSession,
  unit: Unit,
  fromPos: Position,
  toPos: Position
): GameSession {
  if (getDepth(state) >= MAX_DISPATCH_DEPTH) return state;

  const skill = unit.card.skill ? getSkill(unit.card.skill.id) : null;
  if (!skill || skill.triggerKind !== 'on_move') return state;
  if (isSkillBlocked(unit) || unit.skillUsesRemaining === 0) return state;

  let workingState = enterDispatch(state);
  const ctx = makeCtx(unit, workingState, { movedFrom: fromPos, movedTo: toPos });

  if (!skill.shouldTrigger || skill.shouldTrigger(ctx, unit, workingState)) {
    const result = skill.onTrigger!(ctx, unit, workingState);
    workingState = result.state;
    workingState = appendLog(workingState, ...result.log);
    workingState = decrementUses(workingState, unit);
  }

  // on_skill_used 連動発火
  workingState = triggerOnSkillUsed(workingState, unit, skill.id);

  workingState = exitDispatch(workingState);
  workingState = recalculateAuras(workingState);
  return workingState;
}
```

### 3.5 apply.ts への変更例（on_move 連動）

```typescript
// apply.ts の applyMove を以下に差し替え
export function applyMove(
  state: GameSession,
  unitId: string,
  pos: Position,
): GameSession {
  const unit = findUnit(state, unitId);
  if (!unit) return state;

  const fromPos = unit.position;
  const cleared = removeUnit(state.board, fromPos);
  const moved: Unit = { ...unit, position: pos, hasMovedThisTurn: true };
  const board = placeUnit(cleared, moved, pos);
  let s: GameSession = { ...state, board, log: [...state.log, `${unit.card.name} が移動`] };

  // ▼ 追加
  s = triggerOnMove(s, moved, fromPos, pos);

  return s;
}
```

---

## 4. 新規トリガー向けスキル一覧（20種）

### 4.1 on_move（移動時）— 5種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `shissou` | 疾走 | 移動するたびに自身ATK+1（永続、最大+3まで） | 焔/蒼 | 6 |
| `zankyou` | 残響 | 移動した元のマスに「踏むと敵に1ダメ・1度発動」のトラップトークン生成（最大3個） | 鋼/冥 | 6 |
| `junrei` | 巡礼 | 移動先が敵陣最前列なら、自陣HP+1回復 | 聖 | 5 |
| `kazeyomi` | 風読み | 移動するたびに「次の自分の攻撃ダメ+1」を1スタック付与（重ねがけ可、攻撃で消費） | 蒼/鋼 | 5 |
| `tsuiseki` | 追跡 | 移動するたびに、移動した距離（マンハッタン距離）分、次の攻撃のATK+1（移動するごとにリセット） | 焔 | 5 |

#### 実装上の注意

- **疾走**: `unit.buffs.atkBonus` を直接加算。上限管理のため `customCounters` のような新フィールドは追加せず、`atkBonus` の上限を「カードのbase ATK + 3」に制限すれば十分（再生スキル `saisei` の参考実装と同様）
- **残響**: トラップトークンは既存の `isToken` フラグを活用。専用カード `trap_token` を `cards.ts` に追加し、`movement: { type: 'step', directions: [] }`（移動不可）、`atk: 0, hp: 1` で実装。トラップ発動はマス侵入時のフックが必要なため、`applyMove` 内で「移動先がトークン `trap_token` なら、そのトークンの所有者と異なる陣営のユニットに1ダメ + トークン消滅」を追加
- **巡礼**: `applyBaseDamage` の逆方向ヘルパー `healBase(state, owner, amount)` を `helpers.ts` に追加（既存になければ）
- **風読み**: 一時バフ用に `unit.buffs.atkBonusOnce: number` を `UnitBuffs` に追加。攻撃解決時に消費し0に戻す
- **追跡**: 同上の `atkBonusOnce` を流用

### 4.2 on_skill_used（他ユニットのスキル使用時）— 5種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `maryoku_zoufuku` | 魔力増幅 | 自分以外がスキル使用時、自身ATK+1（永続） | 全流派 | 8 |
| `rendou` | 連動 | 味方（自分以外）のスキル使用時、自身のスキル使用回数+1（無限） | 鋼/聖 | 9 |
| `shokubai` | 触媒 | 味方のスキル使用時、自陣HP+1（最大HPは超えない） | 聖 | 8 |
| `kyuushuu` | 吸収 | 敵のスキル使用時、自身HP+1回復 | 冥/森 | 7 |
| `rensajumon` | 連鎖呪文 | 味方のスキル使用時、ランダムな敵1体に1ダメ | 焔/蒼 | 8 |

#### 実装上の注意

- 全スキルとも `ctx.skillUser` の `owner` を見て「自陣 or 敵陣 or 自分以外」を判定する
- 自分自身のスキル使用では発火しない（`triggerOnSkillUsed` が `skillUser` を除外するため自動で担保される）
- **連動** の使用回数+1は無限スキルでもアップキャストするか要検討。`infinite` のままにする実装が無難

### 4.3 on_summon_ally（味方召喚時）— 5種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `shukufuku` | 祝福 | 味方が召喚されるたびにその味方のmaxHP+1, currentHP+1 | 聖 | 7 |
| `kobu_summon` | 鼓舞召喚 | 味方が召喚されるたびにその味方のATK+1（永続） | 焔/聖 | 7 |
| `kangei_no_gi` | 歓迎の儀 | 味方が召喚されるたびに自陣HP+1 | 聖/森 | 8 |
| `kyoumei` | 共鳴 | 味方が召喚されるたびに自身ATK+1（永続） | 全流派 | 8 |
| `summon_chain` | 召喚連鎖 | 味方が召喚されるたびに、その味方の `hasSummonedThisTurn` を false にする（=同ターンで行動可能にする） | 鋼/焔 | 9 |

#### 実装上の注意

- **祝福・鼓舞召喚**: `ctx.summonedAlly` が対象。新規召喚されたユニットを `findUnit` で探して `buffs.atkBonus` または `maxHp/currentHp` を直接加算
- **召喚連鎖**: `hasSummonedThisTurn` は移動・攻撃を制御する重要フラグ。これをfalseにすると同ターン行動可能になる。バランス的に強力なのでcostは高めに。`hasActedThisTurn`, `hasMovedThisTurn` も同時にfalseにする実装で統一

### 4.4 on_base_damaged（自陣HPが減った時）— 5種

| ID | 表示名 | 効果 | 流派 | 想定cost |
|---|---|---|---|---|
| `chuusei` | 忠誠 | 自陣HPが減った時、自身ATK+2（永続、累積可） | 聖/鋼 | 8 |
| `houfuku_no_yaiba` | 報復の刃 | 自陣HPが減った時、最も近い敵（マンハッタン距離）に1ダメ | 焔 | 7 |
| `douin` | 動員 | 自陣HPが減った時、デッキトップを手札に加える（手札上限8まで） | 鋼/聖 | 8 |
| `dohatsu` | 怒髪 | 自陣HPが減った時、自身HP+1, ATK+1（永続、累積可） | 焔/冥 | 8 |
| `gekibun` | 檄文 | 自陣HPが減った時、味方全員のATK+1（永続） | 聖 | 10 |

#### 実装上の注意

- **動員**: 既存の `keigan`（慧眼）スキル（`src/lib/game/skills/keigan.ts`）を参考にデッキドローのヘルパーを使用
- **檄文**: コスト高めにすること。10コストでもバランス次第で要再調整
- **報復の刃**: マンハッタン距離計算ヘルパーを追加。`getNearestEnemy(state, fromPos, owner)` を `helpers.ts` に追加するのが綺麗

---

## 5. 型定義の変更

### 5.1 `src/lib/types/game.ts`

```typescript
export interface UnitBuffs {
  atkBonus: number;
  auraAtk: number;
  auraMaxHp: number;
  // ▼ 追加
  atkBonusOnce: number;  // 次の攻撃のみ有効なATKボーナス（風読み・追跡用）
}
```

### 5.2 `getEffectiveAtk` の修正

`src/lib/game/helpers.ts` の `getEffectiveAtk` 内で `atkBonusOnce` を加算。攻撃解決後（`resolveAttack` 完了後）に `atkBonusOnce = 0` にリセットする処理を追加。

---

## 6. cards.ts への新規トークン追加

`src/lib/game/cards.ts` に以下を追加（残響スキル用）：

```typescript
{
  id: 'trap_token',
  name: '罠',
  cost: 0,  // 召喚不可（手札に入らないため実質的にcost不問）
  atk: 0,
  hp: 1,
  movement: { type: 'step', directions: [] },
  attackRange: { type: 'none' },
  // skill 不要
},
```

`isToken: true` で配置すること。`developmentBlocking`（既存があれば）と同様の挙動。

---

## 7. materials.ts への登録

各スキルに対応する `Material` を `src/lib/data/materials.ts` の `MATERIALS` 配列に追加。命名規則：

- 単発系: `skill_{id}_{uses}`（例: `skill_shinshoku_inf`）
- 既存スキルに合わせ、costはスキルそのもののパワーレベルに準拠

例：

```typescript
{ id: 'skill_shinshoku_inf', name: '侵蝕・無限', category: 'skill',
  description: '攻撃時、対象を倒した場合のみATK+1（永続）',
  cost: 6, icon: '🦠',
  effect: { type: 'skill', skill: { id: 'shinshoku', uses: 'infinite' } } },
```

**全40スキル分のマテリアル登録が必要**。アイコン候補：

| ID | icon |
|---|---|
| shinshoku | 🦠 |
| chodan | 🎯 |
| mujihi | 💀 |
| buki_hakai | 🔨 |
| teni | 🌀 |
| touketsu_hansha | 🧊 |
| bankai | 💖 |
| eiyou | 🍃 |
| daishou_no_tamashii | 🕊️ |
| saikouchiku | 🏗️ |
| hatsuga | 🌱 |
| dokumu | ☠️ |
| kunren | 🎓 |
| shireijutsu | 👻 |
| mure | 🐺 |
| kokou | 🗻 |
| ansatsu | 🗡️ |
| kakusei | ✨ |
| abekobe | 🔄 |
| soukan | 📤 |
| shissou | 💨 |
| zankyou | 🌫️ |
| junrei | ⛪ |
| kazeyomi | 🍃 |
| tsuiseki | 🐾 |
| maryoku_zoufuku | 🔮 |
| rendou | 🔗 |
| shokubai | ⚗️ |
| kyuushuu | 🌑 |
| rensajumon | ⚡ |
| shukufuku | 🌟 |
| kobu_summon | 📯 |
| kangei_no_gi | 🎉 |
| kyoumei | 🔔 |
| summon_chain | ⛓️ |
| chuusei | 🛡️ |
| houfuku_no_yaiba | ⚔️ |
| douin | 📜 |
| dohatsu | 🔥 |
| gekibun | 📢 |

---

## 8. skills/index.ts への登録

```typescript
// ▼ 追加（既存トリガー）
import './shinshoku';
import './chodan';
import './mujihi';
import './buki_hakai';
import './teni';
import './touketsu_hansha';
import './bankai';
import './eiyou';
import './daishou_no_tamashii';
import './saikouchiku';
import './hatsuga';
import './dokumu';
import './kunren';
import './shireijutsu';
import './mure';
import './kokou';
import './ansatsu';
import './kakusei';
import './abekobe';
import './soukan';

// ▼ 追加（新トリガー）
import './shissou';
import './zankyou';
import './junrei';
import './kazeyomi';
import './tsuiseki';
import './maryoku_zoufuku';
import './rendou';
import './shokubai';
import './kyuushuu';
import './rensajumon';
import './shukufuku';
import './kobu_summon';
import './kangei_no_gi';
import './kyoumei';
import './summon_chain';
import './chuusei';
import './houfuku_no_yaiba';
import './douin';
import './dohatsu';
import './gekibun';
```

---

## 9. 実装パターン参考

| やりたいこと | 参考にすべき既存スキル |
|---|---|
| ATK永続バフ | `buff.ts`, `gaisen.ts` |
| HP回復 | `heal.ts`, `haru_no_ibuki.ts` |
| ダメージ与える | `gouka.ts`, `hansha.ts`, `daishinkan.ts` |
| トークン生成 | `shoushuu.ts`, `kagebunshin.ts` |
| 範囲攻撃 | `nagibarai.ts`, `gouka.ts`, `daishinkan.ts` |
| 状態異常付与 | `touketsu.ts`, `chinmoku.ts`, `mahi.ts` |
| デッキ操作 | `keigan.ts` |
| 自陣HP操作 | `strong_blow.ts`, `juugeki.ts`, `penetrate.ts` |
| 起動型・対象指定 | `mahi.ts`, `hikiyose.ts`, `irekae.ts` |
| 死亡時効果 | `zangai.ts`, `fukkatsu.ts`, `junkyou.ts`, `shinigiwa.ts` |
| オーラ系 | `senki.ts`, `keigen.ts`, `kyousenshi.ts` |
| 復活 | `fukkatsu.ts`（`pendingRevival` フラグ参照） |

---

## 10. テスト・検証方針

### 10.1 型チェック

```bash
npx tsc --noEmit
```

エラーゼロを確認。

### 10.2 シミュレーター

各スキルを含むカードを `cards.ts` のテスト用カード（または既存カードの `skill` フィールドの差し替え）に組み込み、`scripts/sim.ts` で対戦シミュレートを実行：

```bash
npm run sim match --aiA normal_balanced --aiB normal_balanced --deckA sei_3 --deckB en_3
npm run sim batch --aiA normal_balanced --aiB normal_balanced --deckA sei_3 --deckB en_3 -n 100
```

主要バランス指標：
- 勝率が極端に偏るスキルがないこと（一方50%±10%以内）
- ターン数中央値が10〜25に収まること
- スキル使用回数のばらつきが妥当なこと

### 10.3 単体プレイテスト

- Phase 1完了時点で `localhost:3000` で各スキルを含むカードを召喚し、ログで効果発動を確認
- Playwright MCPによるスモークテスト（`docs/playtest_reports/` に出力）

### 10.4 既存スキルのリグレッション

- 全38既存スキル（既存5+召喚時5+攻撃時7+被攻撃時2+死亡時4+ターン端4+オーラ5+起動型12）が壊れていないことを確認
- 既存の `sim batch` ベースラインと比較

---

## 11. 留意事項

### 11.1 死霊術 (`shireijutsu`) の特殊実装

`triggerKind` を `aura` ではなく **`on_death` の他者観測フック**として実装する。具体的には：

```typescript
// dispatcher.ts の processDeath 内、死亡したユニットの陣営の他ユニットをスキャン
// 各ユニットのスキルが shireijutsu なら、buffs.atkBonus を +1
```

または `on_death` トリガーを「自分の死亡 or 味方の死亡」両方で発火するように拡張し、`shireijutsu` の `shouldTrigger` で `self.instanceId !== deadUnit.instanceId` を判定する設計でも可。

### 11.2 無限ループ防止

- `on_skill_used` を実装する際、スキル発火 → on_skill_used 発火 → そのスキルが他のスキル発火 → さらに on_skill_used... という連鎖が起きうる
- `MAX_DISPATCH_DEPTH = 20` の既存ガードで十分だが、特に `rendou`（連動：使用回数+1）と他のスキルの組み合わせで暴走しないかをsimで確認すること

### 11.3 永続バフの上限

`shissou`（疾走）の +3 上限のように、無限累積するスキルには明示的な上限を設けること。理由：
- 単一ユニットがゲームを破壊するほど強くなるのを防ぐ
- 既存の `ikari`（怒り）も累積するが暗黙的な上限なし → 本拡張を機に統一ルールを検討（別タスク）

### 11.4 atkBonusOnce の追加に伴う影響範囲

- `helpers.ts` の `getEffectiveAtk`
- `rules.ts` の `resolveAttack`（攻撃解決後にリセット）
- 全ユニット生成箇所での初期化（`createUnit`）
- 既存テスト・simの結果に影響がないこと

---

## 12. 完了の定義 (DoD)

- [ ] `SkillTriggerKind` に4種類を追加し型エラーゼロ
- [ ] `dispatcher.ts` に `triggerOnMove` / `triggerOnSkillUsed` / `triggerOnSummonAlly` / `triggerOnBaseDamaged` を実装
- [ ] `apply.ts` / `helpers.ts` の呼び出し箇所を改修
- [ ] スキル40種が `src/lib/game/skills/` に個別ファイルとして実装され、`index.ts` でimport登録済み
- [ ] `materials.ts` に40種のMaterial登録完了
- [ ] `cards.ts` に `trap_token` 追加（残響スキル用）
- [ ] `UnitBuffs` に `atkBonusOnce` 追加し全箇所で初期化
- [ ] `tsc --noEmit` エラーゼロ
- [ ] `npm run sim batch` で各新規スキルを含むデッキの動作確認（最低各スキル1回は発動するログを確認）
- [ ] 既存全スキルのリグレッションなし（既存simベースラインと比較）

---

## 13. 推奨着手順

1. **registry.ts 拡張**（型追加のみ、5分）
2. **dispatcher.ts 改修**（`triggerOnMove` 等の関数追加、30分）
3. **apply.ts / helpers.ts の呼び出し追加**（30分）
4. **UnitBuffs に atkBonusOnce 追加**（影響箇所全置換、20分）
5. **既存トリガー向けスキル20種の実装**（1スキル平均10〜15分、合計4〜5時間）
6. **新規トリガー向けスキル20種の実装**（同上、4〜5時間）
7. **materials.ts への登録**（30分）
8. **skills/index.ts へのimport追加**（5分）
9. **シミュレーターでバランス確認**（1〜2時間）
10. **修正・調整**（適宜）

合計見積もり：**12〜15時間**