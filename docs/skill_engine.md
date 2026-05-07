# cardsmith — スキルエンジン実装指示書

35スキル（既存5＋新規30）が**疎結合・付け替え可能・デッドロック耐性**を持って動作する実装仕様書。Claude Code向けself-contained。

---

## 1. スコープと前提

### 含むもの
- スキルエンジンのアーキテクチャ設計
- 35スキル全部の実装仕様（疑似コード付き）
- 優先度・リゾルブ順序のルール
- 無限ループ防止メカニズム
- 既存5スキルからの移行手順

### 含まないもの
- カード定義・キャラ設定（別ドキュメント）
- ビジュアルデザイン（別ドキュメント）
- AI（ランダムAIで現状OK、戦略AI実装は別フェーズ）
- マルチプレイ同期（PvP実装時に別ドキュメント）

---

## 2. 設計原則

```
原則① スキルはレジストリでID管理、カードからの参照は文字列のみ
原則② カード ⇄ スキル は疎結合。Cardはskill IDだけ持ち、効果実装は知らない
原則③ すべての効果はイベント駆動。直接state変更は禁止
原則④ イベントは「フェーズ + 優先度 + APNAP」で順序付け
原則⑤ Replacement → Trigger → Aura → State Check の4段階で処理
原則⑥ 再帰深度・イベント数・同一発生源の3軸で無限ループを検知
原則⑦ 副作用（ダメージ・死亡・召喚）は専用ヘルパー経由でしか発生させない
原則⑧ すべての効果は純粋関数：(state, event) => { state, newEvents, log }
```

---

## 3. アーキテクチャ全体図

```
┌─────────────────────────────────────────────────────────────┐
│  Player / AI Action                                         │
│    ↓                                                        │
│  ActionDispatcher (移動 / 攻撃 / 召喚 / スキル発動)          │
│    ↓ creates                                                │
│  GameEvent (e.g., AttackEvent, SummonEvent)                 │
│    ↓ pushed to                                              │
│  EventStack ─── EventDispatcher                             │
│                       ↓                                     │
│   ┌───────────────────┴────────────────────┐                │
│   │ Phase 1: Replacement Window            │                │
│   │   - 鋼鉄の意志 / 軽減 がeventを書き換え │                │
│   ├────────────────────────────────────────┤                │
│   │ Phase 2: Trigger Collection            │                │
│   │   - shouldTrigger() でフィルタ         │                │
│   │   - 優先度 + APNAP でソート             │                │
│   ├────────────────────────────────────────┤                │
│   │ Phase 3: Resolution                    │                │
│   │   - onTrigger() を順次実行             │                │
│   │   - newEvents を再帰的にdispatch       │                │
│   ├────────────────────────────────────────┤                │
│   │ Phase 4: State-Based Actions           │                │
│   │   - HP<=0 のユニットを除去             │                │
│   │   - 勝敗判定                           │                │
│   └────────────────────────────────────────┘                │
│                       ↓                                     │
│   AuraRecalculator (場のオーラを再計算)                       │
│                       ↓                                     │
│   New GameSession state                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. データモデル（types/skills.ts）

```typescript
// === イベントタイプ ===
export type EventPhase =
  | 'replacement'    // 効果置換ウィンドウ
  | 'before'         // X が起きる直前
  | 'resolution'     // X 自体
  | 'after'          // X が起きた直後
  | 'state_check';   // 状態確認・clean up

export type GameEventType =
  // ライフサイクル
  | 'summon'           // ユニット召喚
  | 'death'            // ユニット死亡
  | 'damage'           // ダメージ発生
  | 'heal'             // 回復発生
  // アクション
  | 'attack'           // 攻撃実行
  | 'move'             // 移動実行
  | 'skill_use'        // スキル使用
  // ターン
  | 'turn_start'       // ターン開始
  | 'turn_end'         // ターン終了
  | 'draw'             // ドロー
  // ベース
  | 'base_damage';     // 陣地HP減

export interface GameEvent {
  readonly id: string;              // ユニーク（UUID）
  readonly type: GameEventType;
  readonly phase: EventPhase;
  readonly source: Unit | null;     // 発生源（攻撃した側、死んだ側）
  readonly target: Unit | null;     // 影響対象
  readonly position?: Position;     // 位置情報
  readonly amount?: number;         // ダメージ量・回復量等
  readonly metadata: EventMetadata;
}

export interface EventMetadata {
  readonly causeChain: string[];   // 親イベントID列（循環検出用）
  readonly depth: number;           // 再帰深度
  readonly tags: string[];          // 'reflection', 'aoe', 'token_summon' 等
  readonly preventCascade?: boolean; // 連鎖発火を抑制
}

// === スキル定義 ===
export type SkillTrigger =
  | { kind: 'event'; eventType: GameEventType; phase: EventPhase }
  | { kind: 'activated' }      // プレイヤー起動型
  | { kind: 'permanent' };     // 常時オーラ

export interface SkillDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly trigger: SkillTrigger;
  readonly priority: number;       // 数字が小さいほど早く処理
  readonly costWeight: number;     // バランス用、コスト計算で使用
  readonly maxUsesDefault: number | 'infinite';

  // === 起動型・トリガー型共通 ===
  canActivate?(state: GameSession, source: Unit, ctx: SkillContext): boolean;
  getValidTargets?(state: GameSession, source: Unit, ctx: SkillContext): Position[];

  // === トリガー型 ===
  shouldTrigger?(event: GameEvent, source: Unit, state: GameSession): boolean;
  onTrigger?(event: GameEvent, source: Unit, state: GameSession): SkillResult;

  // === 起動型 ===
  resolve?(state: GameSession, source: Unit, target: Position | null, ctx: SkillContext): SkillResult;

  // === 常時オーラ型 ===
  applyAura?(state: GameSession, source: Unit): GameSession;

  // === Replacement型（特殊） ===
  shouldReplace?(event: GameEvent, source: Unit, state: GameSession): boolean;
  replace?(event: GameEvent, source: Unit, state: GameSession): GameEvent | null; // null = キャンセル
}

export interface SkillContext {
  readonly remainingUses: number | 'infinite';
  readonly turnCount: number;
  readonly currentTurn: 'player' | 'ai';
}

export interface SkillResult {
  readonly state: GameSession;
  readonly newEvents: GameEvent[];   // 結果として発火する後続イベント
  readonly log: string[];
}
```

---

## 5. スキルレジストリパターン

### 5.1 レジストリ実装（lib/game/skills/registry.ts）

```typescript
const REGISTRY = new Map<string, SkillDefinition>();

export function registerSkill(def: SkillDefinition): void {
  if (REGISTRY.has(def.id)) {
    throw new Error(`Skill ID conflict: ${def.id}`);
  }
  REGISTRY.set(def.id, def);
}

export function getSkill(id: string): SkillDefinition | null {
  return REGISTRY.get(id) ?? null;
}

export function getAllSkills(): SkillDefinition[] {
  return Array.from(REGISTRY.values());
}

export function getSkillsByTrigger(
  eventType: GameEventType,
  phase: EventPhase
): SkillDefinition[] {
  return getAllSkills().filter(s =>
    s.trigger.kind === 'event' &&
    s.trigger.eventType === eventType &&
    s.trigger.phase === phase
  );
}
```

### 5.2 スキル登録（lib/game/skills/index.ts）

```typescript
// 35スキル全部をここで登録
import { registerSkill } from './registry';
import { gouka } from './gouka';
import { shoushuu } from './shoushuu';
// ... 33個続く

[
  gouka, shoushuu, keigan, gaisen,
  rengeki, rensa_raigeki, nagibarai, fukitobashi, touketsu, chinmoku, kyuuketsu,
  hansha, ikari, hangeki,
  zangai, fukkatsu, junkyou, shinigiwa,
  shikikan, shi_no_ryouiki, haru_no_ibuki,
  saisei,
  keigen, kyousenshi, seinaru_kago, senki, koutetsu_no_ishi,
  daishinkan, hikiyose, irekae, shunkan_idou, kagebunshin, shoukanshi, tenkei, jibaku, mahi,
  // 既存5
  penetrate, big_penetrate, buff, heal,
].forEach(registerSkill);
```

### 5.3 カード側はIDで参照のみ

```typescript
// cards.ts
{
  id: 'sei_grail',
  name: '老聖騎士団長グレイル',
  // ...
  skill: { id: 'junkyou', uses: 1 },  // ← skill ID と使用回数だけ
}

// ↑ Card は SkillDefinition を直接持たない。
// ↑ skill を別キャラに付け替える時は ID を変えるだけ。
```

---

## 6. イベントシステム

### 6.1 EventDispatcher（lib/game/events/dispatcher.ts）

```typescript
export class EventDispatcher {
  private readonly stack: GameEvent[] = [];
  private depth: number = 0;
  private eventCount: number = 0;

  // === 公開API ===
  dispatch(event: GameEvent, state: GameSession): { state: GameSession; log: string[] } {
    if (!this.checkCanDispatch(event)) {
      return { state, log: ['イベント連鎖が制限を超えたため中断'] };
    }

    this.depth++;
    this.eventCount++;
    let workingState = state;
    const log: string[] = [];

    // === Phase 1: Replacement Window ===
    const replaced = this.processReplacements(event, workingState);
    if (replaced.event === null) {
      // Replacement で完全キャンセルされた
      this.depth--;
      return { state: replaced.state, log: replaced.log };
    }
    workingState = replaced.state;
    const finalEvent = replaced.event;
    log.push(...replaced.log);

    // === Phase 2 & 3: Trigger Collection & Resolution ===
    const triggered = this.processTriggers(finalEvent, workingState);
    workingState = triggered.state;
    log.push(...triggered.log);

    // === Phase 4: State-Based Actions ===
    workingState = this.processStateChecks(workingState);

    // === オーラ再計算 ===
    workingState = recalculateAuras(workingState);

    this.depth--;
    return { state: workingState, log };
  }

  // === デッドロック検出 ===
  private checkCanDispatch(event: GameEvent): boolean {
    if (this.depth > MAX_EVENT_DEPTH) return false;
    if (this.eventCount > MAX_EVENTS_PER_TURN) return false;
    if (this.detectCycle(event)) return false;
    return true;
  }

  private detectCycle(event: GameEvent): boolean {
    // 同じソース×タイプの組み合わせがcauseChainに3回以上出てきたらサイクル
    const key = `${event.source?.instanceId ?? 'null'}:${event.type}`;
    const occurrences = event.metadata.causeChain.filter(c => c === key).length;
    return occurrences >= 3;
  }

  // === ターンリセット ===
  resetForNewTurn(): void {
    this.eventCount = 0;
    this.stack.length = 0;
  }
}

const MAX_EVENT_DEPTH = 50;
const MAX_EVENTS_PER_TURN = 500;
```

### 6.2 Replacement処理

```typescript
private processReplacements(
  event: GameEvent,
  state: GameSession
): { event: GameEvent | null; state: GameSession; log: string[] } {
  const replacers = collectAllUnitsWithSkill(state)
    .filter(({ unit, skill }) =>
      skill.shouldReplace?.(event, unit, state) ?? false
    )
    .sort(byPriorityAndAPNAP(state));

  let currentEvent: GameEvent | null = event;
  let currentState = state;
  const log: string[] = [];

  for (const { unit, skill } of replacers) {
    if (currentEvent === null) break; // すでにキャンセル済み
    currentEvent = skill.replace!(currentEvent, unit, currentState);
    log.push(`${unit.card.name} の ${skill.displayName} が効果を変化させた`);
  }

  return { event: currentEvent, state: currentState, log };
}
```

### 6.3 Trigger処理

```typescript
private processTriggers(
  event: GameEvent,
  state: GameSession
): { state: GameSession; log: string[] } {
  const triggers = collectAllUnitsWithSkill(state)
    .filter(({ unit, skill }) =>
      skill.trigger.kind === 'event' &&
      skill.trigger.eventType === event.type &&
      skill.trigger.phase === event.phase &&
      (skill.shouldTrigger?.(event, unit, state) ?? true)
    )
    .sort(byPriorityAndAPNAP(state));

  let workingState = state;
  const log: string[] = [];

  for (const { unit, skill } of triggers) {
    // ユニットが死んでたらスキップ（除く死亡時スキル）
    if (!isUnitAlive(unit, workingState) && event.type !== 'death') continue;
    
    const result = skill.onTrigger!(event, unit, workingState);
    workingState = result.state;
    log.push(...result.log);

    // newEvents を再帰dispatch
    for (const newEvent of result.newEvents) {
      const childResult = this.dispatch(newEvent, workingState);
      workingState = childResult.state;
      log.push(...childResult.log);
    }
  }

  return { state: workingState, log };
}
```

### 6.4 State-Based Actions

```typescript
private processStateChecks(state: GameSession): GameSession {
  // 1. HP <= 0 のユニットを死亡イベントとして発火
  const dyingUnits = collectAllUnits(state).filter(u => u.currentHp <= 0);
  let workingState = state;

  for (const unit of dyingUnits) {
    const deathEvent: GameEvent = createEvent({
      type: 'death',
      phase: 'after',
      source: unit,
      target: null,
      causeChain: [...workingState.eventChain, `state_check:${unit.instanceId}:death`],
    });
    const result = this.dispatch(deathEvent, workingState);
    workingState = result.state;
    workingState = removeUnitFromBoard(workingState, unit.instanceId);
  }

  // 2. 陣地HP <= 0 で勝敗判定
  if (workingState.player.baseHp <= 0) workingState.winner = 'ai';
  if (workingState.ai.baseHp <= 0) workingState.winner = 'player';

  return workingState;
}
```

---

## 7. 優先度とリゾルブ順序

### 7.1 優先度ティア（priority constants）

```typescript
export const PRIORITY = {
  // === Replacement (最先) ===
  REPLACE_LIFE_PROTECTION: 1000,  // 鋼鉄の意志（致死無効）
  REPLACE_DAMAGE_REDUCTION: 1100, // 軽減
  REPLACE_DAMAGE_AMP: 1200,       // （将来用：ダメージ増幅）

  // === Aura Pre ===
  AURA_PRE_STAT: 2000,            // 戦旗、聖なる加護（攻撃前にATK計算に影響）
  AURA_PRE_HP: 2100,              // maxHP系オーラ

  // === Triggered High ===
  TRIGGER_SUMMON_FIRST: 3000,     // 召喚時の最初に発火（凱旋など）
  TRIGGER_ATTACK_PRE: 3100,       // 攻撃前トリガー（連撃の追加判定など）

  // === Triggered Normal ===
  TRIGGER_DEFAULT: 4000,          // ほとんどのトリガー（業火、連鎖雷撃など）

  // === Triggered Late ===
  TRIGGER_DEATH: 5000,            // 死亡時（殉教、残骸、死に際の咆哮）
  TRIGGER_TURN_START: 5100,       // ターン開始時オーラ系

  // === Aura Post ===
  AURA_POST: 6000,                // 春の息吹（ターン開始時の回復オーラ）
};
```

### 7.2 APNAP（Active Player, Non-Active Player）ルール

複数のスキルが同じ優先度で同時にトリガーした場合、以下の順で処理：

1. **アクティブプレイヤー（現ターンの手番側）の効果が先**
2. 同じプレイヤー内では：盤面の **左上→右下** の順（行優先）
3. 同じ位置内では：**スキルID辞書順**

```typescript
function byPriorityAndAPNAP(state: GameSession) {
  return (a: SkillEntry, b: SkillEntry): number => {
    // 1. 優先度
    if (a.skill.priority !== b.skill.priority) {
      return a.skill.priority - b.skill.priority;
    }
    // 2. APNAP
    const aIsActive = a.unit.owner === state.currentTurn;
    const bIsActive = b.unit.owner === state.currentTurn;
    if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
    // 3. 位置（row * 6 + col）
    const aPos = a.unit.position.row * 6 + a.unit.position.col;
    const bPos = b.unit.position.row * 6 + b.unit.position.col;
    if (aPos !== bPos) return aPos - bPos;
    // 4. スキルID
    return a.skill.id.localeCompare(b.skill.id);
  };
}
```

### 7.3 重要：トリガー発火タイミングの定義

| イベント | `before` で発火 | `after` で発火 |
|---|---|---|
| 召喚 | 召喚配置直前（場には居ない）| 召喚直後（場に居る、自分自身も対象に） |
| 攻撃 | ダメージ計算前（沈黙等が間に合う）| ダメージ確定後（連撃の2撃目はここ）|
| ダメージ | 軽減・反射の判定| 怒り、吸血の効果適用 |
| 死亡 | （ほぼ未使用） | 殉教、残骸、死に際の咆哮 |
| ターン開始 | ドロー前 | ドロー後（指揮官の追加ドロー）|

---

## 8. デッドロック対策

### 8.1 多層防御

```
レイヤー1: 再帰深度制限       MAX_EVENT_DEPTH = 50
レイヤー2: ターン内イベント数  MAX_EVENTS_PER_TURN = 500
レイヤー3: 同一原因サイクル    causeChainで同一キー3回以上なら中断
レイヤー4: イベントタグ抑制    特定タグ付きイベントは特定スキル無視
レイヤー5: 状態スナップショット 異常時は前ターン状態にロールバック
```

### 8.2 危険な相互作用と防御策

| 危険パターン | 例 | 防御策 |
|---|---|---|
| **反射の往復** | A攻撃→Bが反射→Aが反射→B... | 反射ダメージは `tags: ['reflection']` を持ち、反射スキルは反射タグ付きイベントで再トリガーしない |
| **死亡時召喚連鎖** | 残骸でトークン生成→トークン死亡で残骸... | トークンは `tags: ['token']` を持ち、tokenの残骸は無効化 |
| **オーラ再計算ループ** | 戦旗A→戦旗Bが場に来る→Aを強化→Aが新トリガー... | オーラ適用は **必ずstate_checkフェーズ後の1回のみ**。再計算中の発火は禁止 |
| **召喚時の連鎖召喚** | 召喚士で召喚→召喚されたカードも召喚士... | 同一ターン内で同じスキルIDは最大3回まで発火（counterで管理） |
| **無限ターン延長** | 召喚士∞でコスト0をループ召喚 | 1ターン内のスキル発動回数を10回上限 |

### 8.3 タグシステムによる連鎖抑制

```typescript
// イベント生成時にタグを付与
const reflectEvent = createEvent({
  type: 'damage',
  source: defender,
  target: attacker,
  amount: damageReceived,
  tags: ['reflection'],  // ← これを 反射スキル がチェック
});

// 反射スキルの shouldTrigger
shouldTrigger: (event, self, state) => {
  if (event.tags.includes('reflection')) return false; // 反射の連鎖を防止
  return event.target?.instanceId === self.instanceId;
}
```

### 8.4 同一スキル発動カウンタ

```typescript
class TurnCounter {
  private skillUseCount = new Map<string, number>(); // key: `${unitId}:${skillId}`

  canFire(unitId: string, skillId: string): boolean {
    const key = `${unitId}:${skillId}`;
    return (this.skillUseCount.get(key) ?? 0) < 10;
  }

  recordFire(unitId: string, skillId: string): void {
    const key = `${unitId}:${skillId}`;
    this.skillUseCount.set(key, (this.skillUseCount.get(key) ?? 0) + 1);
  }

  resetForNewTurn(): void {
    this.skillUseCount.clear();
  }
}
```

---

## 9. スキル別実装仕様（35種）

各スキルは `lib/game/skills/{id}.ts` として独立ファイル。下記スペック通りに実装する。

### 9.1 Replacement型（2種）

#### S01. 軽減（keigen / damage_reduction）

```typescript
{
  id: 'keigen',
  trigger: { kind: 'permanent' },
  priority: PRIORITY.REPLACE_DAMAGE_REDUCTION,

  shouldReplace: (event, self, state) =>
    event.type === 'damage' &&
    event.target?.instanceId === self.instanceId &&
    !event.tags.includes('reflection'),

  replace: (event, self, state) => ({
    ...event,
    amount: Math.max(1, (event.amount ?? 0) - 1), // 最低1ダメージ
  }),
}
```

#### S02. 鋼鉄の意志（koutetsu_no_ishi / iron_will）

```typescript
{
  id: 'koutetsu_no_ishi',
  trigger: { kind: 'permanent' },
  priority: PRIORITY.REPLACE_LIFE_PROTECTION,
  maxUsesDefault: 1,

  shouldReplace: (event, self, state) => {
    if (event.type !== 'damage' || event.target?.instanceId !== self.instanceId) return false;
    const wouldKill = (event.amount ?? 0) >= self.currentHp;
    const usesLeft = self.skillUsesRemaining;
    return wouldKill && usesLeft !== 0;
  },

  replace: (event, self, state) => ({
    ...event,
    amount: self.currentHp - 1, // HP1で生存
    tags: [...event.tags, 'iron_will_replaced'],
  }),
  // 注：使用回数は別途decrementUses()で減らす
}
```

### 9.2 召喚時発動（4種）

#### S03. 業火（gouka / firestorm）

```typescript
{
  id: 'gouka',
  trigger: { kind: 'event', eventType: 'summon', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) =>
    event.source?.instanceId === self.instanceId, // 自分の召喚時のみ

  onTrigger: (event, self, state) => {
    const enemies = getAdjacent8Enemies(state, self.position);
    const dmg = Math.floor(getEffectiveAtk(self, state) / 2);
    const newEvents = enemies.map(e => createDamageEvent(self, e, dmg, state));
    return { state, newEvents, log: [`${self.card.name}の業火！周囲に${dmg}ダメージ`] };
  },
}
```

#### S04. 召集（shoushuu / rally）

```typescript
{
  id: 'shoushuu',
  trigger: { kind: 'event', eventType: 'summon', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    const emptyAdjacent = getAdjacent4Empty(state, self.position).slice(0, 2);
    const tokenEvents = emptyAdjacent.map(pos =>
      createSummonEvent(self.owner, TOKEN_CARDS.basic_1_1, pos, ['token'])
    );
    return { state, newEvents: tokenEvents, log: [`${self.card.name}が${emptyAdjacent.length}体を召集`] };
  },
}
```

#### S05. 慧眼（keigan / insight）

```typescript
{
  id: 'keigan',
  trigger: { kind: 'event', eventType: 'summon', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    const drawEvent = createDrawEvent(self.owner, 1);
    return { state, newEvents: [drawEvent], log: [`${self.card.name}：慧眼で1ドロー`] };
  },
}
```

#### S06. 凱旋（gaisen / triumph）

```typescript
{
  id: 'gaisen',
  trigger: { kind: 'event', eventType: 'summon', phase: 'after' },
  priority: PRIORITY.TRIGGER_SUMMON_FIRST, // 自分が場に出る前に味方を強化
  maxUsesDefault: 1,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    const allies = getAlliesOnBoard(state, self.owner);
    let workingState = state;
    for (const ally of allies) {
      workingState = increaseMaxHpAndCurrentHp(workingState, ally.instanceId, 1);
    }
    return { state: workingState, newEvents: [], log: [`凱旋！味方全員HP+1`] };
  },
}
```

### 9.3 攻撃時発動（7種）

#### S07. 連撃（rengeki / double_strike）

```typescript
{
  id: 'rengeki',
  trigger: { kind: 'event', eventType: 'attack', phase: 'after' },
  priority: PRIORITY.TRIGGER_ATTACK_PRE,

  shouldTrigger: (event, self) =>
    event.source?.instanceId === self.instanceId &&
    !event.tags.includes('rengeki_2nd'), // ← 2撃目では再発火しない

  onTrigger: (event, self, state) => {
    if (!event.target || !isUnitAlive(event.target, state)) {
      return { state, newEvents: [], log: [] }; // 1撃目で倒した場合は2撃目スキップ
    }
    const dmg = getEffectiveAtk(self, state);
    const secondAttack = createAttackEvent(self, event.target, dmg, ['rengeki_2nd']);
    return { state, newEvents: [secondAttack], log: [`${self.card.name}：連撃の2撃目`] };
  },
}
```

#### S08. 連鎖雷撃（rensa_raigeki / chain_lightning）

```typescript
{
  id: 'rensa_raigeki',
  trigger: { kind: 'event', eventType: 'attack', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) =>
    event.source?.instanceId === self.instanceId &&
    !event.tags.includes('chain'),

  onTrigger: (event, self, state) => {
    if (!event.target) return { state, newEvents: [], log: [] };
    const adjacent = getAdjacentEnemies(state, event.target.position, 4)
      .filter(e => e.instanceId !== event.target.instanceId);
    if (adjacent.length === 0) return { state, newEvents: [], log: [] };
    const chainTarget = adjacent[0];
    const dmg = Math.floor(getEffectiveAtk(self, state) / 2);
    return {
      state,
      newEvents: [createDamageEvent(self, chainTarget, dmg, state, ['chain'])],
      log: [`連鎖雷撃！${chainTarget.card.name}に${dmg}ダメージ`],
    };
  },
}
```

#### S09. 薙ぎ払い（nagibarai / sweep）

```typescript
{
  id: 'nagibarai',
  trigger: { kind: 'event', eventType: 'attack', phase: 'resolution' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    if (!event.target) return { state, newEvents: [], log: [] };
    const sides = getLeftRightTargets(state, event.target.position, self.owner);
    const dmg = getEffectiveAtk(self, state);
    const damageEvents = sides.map(t => createDamageEvent(self, t, dmg, state, ['sweep']));
    return { state, newEvents: damageEvents, log: [`薙ぎ払い！${sides.length}体に追加ダメージ`] };
  },
}
```

#### S10. 吹き飛ばし（fukitobashi / knockback）

```typescript
{
  id: 'fukitobashi',
  trigger: { kind: 'event', eventType: 'attack', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) => 
    event.source?.instanceId === self.instanceId && !!event.target,

  onTrigger: (event, self, state) => {
    const target = event.target!;
    if (!isUnitAlive(target, state)) return { state, newEvents: [], log: [] };
    const direction = getDirectionFromTo(self.position, target.position);
    const newPos = addPosition(target.position, direction);
    if (isOutOfBounds(newPos)) {
      // 盤外撃破
      return {
        state,
        newEvents: [createDamageEvent(self, target, 999, state, ['knockback_kill'])],
        log: [`吹き飛ばし！${target.card.name}を盤外撃破`],
      };
    }
    if (getUnit(state, newPos)) {
      return { state, newEvents: [], log: ['吹き飛ばし先が塞がっていた'] };
    }
    return {
      state: moveUnit(state, target.instanceId, newPos),
      newEvents: [],
      log: [`${target.card.name}を吹き飛ばし`],
    };
  },
}
```

#### S11. 凍結（touketsu / freeze）

```typescript
{
  id: 'touketsu',
  trigger: { kind: 'event', eventType: 'attack', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) => 
    event.source?.instanceId === self.instanceId && !!event.target,

  onTrigger: (event, self, state) => {
    const target = event.target!;
    if (!isUnitAlive(target, state)) return { state, newEvents: [], log: [] };
    return {
      state: applyStatusEffect(state, target.instanceId, 'frozen', 1),
      newEvents: [],
      log: [`凍結！${target.card.name}は次ターン行動不可`],
    };
  },
}
```

#### S12. 沈黙（chinmoku / silence）

```typescript
{
  id: 'chinmoku',
  trigger: { kind: 'event', eventType: 'attack', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) => 
    event.source?.instanceId === self.instanceId && !!event.target,

  onTrigger: (event, self, state) => {
    const target = event.target!;
    if (!isUnitAlive(target, state)) return { state, newEvents: [], log: [] };
    return {
      state: silenceUnit(state, target.instanceId), // skill を null に
      newEvents: [],
      log: [`沈黙！${target.card.name}のスキルを封じた`],
    };
  },
}
```

#### S13. 吸血（kyuuketsu / drain）

```typescript
{
  id: 'kyuuketsu',
  trigger: { kind: 'event', eventType: 'damage', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) => 
    event.source?.instanceId === self.instanceId &&
    !event.tags.includes('reflection') &&
    (event.amount ?? 0) > 0,

  onTrigger: (event, self, state) => {
    const heal = Math.min(event.amount ?? 0, self.maxHp - self.currentHp);
    if (heal === 0) return { state, newEvents: [], log: [] };
    return {
      state: healUnit(state, self.instanceId, heal),
      newEvents: [],
      log: [`吸血！${self.card.name}が${heal}回復`],
    };
  },
}
```

### 9.4 被攻撃時発動（3種）

#### S14. 反射（hansha / thorns）

```typescript
{
  id: 'hansha',
  trigger: { kind: 'event', eventType: 'damage', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self, state) =>
    event.target?.instanceId === self.instanceId &&
    !!event.source &&
    !event.tags.includes('reflection') && // ← 反射ループ防止
    (event.amount ?? 0) > 0,

  onTrigger: (event, self, state) => ({
    state,
    newEvents: [createDamageEvent(self, event.source!, event.amount ?? 0, state, ['reflection'])],
    log: [`反射！${event.source!.card.name}に${event.amount}ダメージ`],
  }),
}
```

#### S15. 怒り（ikari / wrath）

```typescript
{
  id: 'ikari',
  trigger: { kind: 'event', eventType: 'damage', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) =>
    event.target?.instanceId === self.instanceId &&
    !event.tags.includes('wrath_buff'),

  onTrigger: (event, self, state) => ({
    state: incrementAtkBuff(state, self.instanceId, 1),
    newEvents: [],
    log: [`${self.card.name}：怒りでATK+1`],
  }),
}
```

#### S16. 反撃（hangeki / counter） — **既存スキル**

```typescript
// 既存 skills.ts の counterResolver と同じ。新フォーマットへ移植。
{
  id: 'hangeki',
  trigger: { kind: 'event', eventType: 'damage', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self) =>
    event.target?.instanceId === self.instanceId &&
    !!event.source &&
    !event.tags.includes('counter') &&
    !event.tags.includes('reflection'),

  onTrigger: (event, self, state) => {
    const dmg = getEffectiveAtk(self, state);
    return {
      state,
      newEvents: [createDamageEvent(self, event.source!, dmg, state, ['counter'])],
      log: [`反撃！${event.source!.card.name}に${dmg}ダメージ`],
    };
  },
}
```

### 9.5 死亡時発動（4種）

#### S17. 残骸（zangai / legacy）

```typescript
{
  id: 'zangai',
  trigger: { kind: 'event', eventType: 'death', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEATH,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) =>
    event.source?.instanceId === self.instanceId &&
    !self.card.id.startsWith('token_'), // トークンの残骸は無効（連鎖防止）

  onTrigger: (event, self, state) => {
    const tokenEvent = createSummonEvent(
      self.owner, TOKEN_CARDS.basic_1_1, self.position, ['token']
    );
    return { state, newEvents: [tokenEvent], log: [`残骸！${self.card.name}の場所にトークン`] };
  },
}
```

#### S18. 復活（fukkatsu / revive）

```typescript
{
  id: 'fukkatsu',
  trigger: { kind: 'event', eventType: 'death', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEATH,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) =>
    event.source?.instanceId === self.instanceId &&
    !event.tags.includes('revived'), // ← 復活後の死では再発火しない

  onTrigger: (event, self, state) => ({
    state: scheduleRevival(state, self, self.position), // 次ターン開始時に復活
    newEvents: [],
    log: [`${self.card.name}は復活する...`],
  }),
}
```

#### S19. 殉教（junkyou / martyr）

```typescript
{
  id: 'junkyou',
  trigger: { kind: 'event', eventType: 'death', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEATH,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    const allies = getAlliesOnBoard(state, self.owner)
      .filter(a => a.instanceId !== self.instanceId);
    let workingState = state;
    for (const ally of allies) {
      workingState = healUnit(workingState, ally.instanceId, 2);
    }
    return { state: workingState, newEvents: [], log: [`殉教！味方${allies.length}体が回復`] };
  },
}
```

#### S20. 死に際の咆哮（shinigiwa / last_stand）

```typescript
{
  id: 'shinigiwa',
  trigger: { kind: 'event', eventType: 'death', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEATH,
  maxUsesDefault: 1,

  shouldTrigger: (event, self) => event.source?.instanceId === self.instanceId,

  onTrigger: (event, self, state) => {
    const adjacent = getAdjacent8Allies(state, self.position, self.owner);
    let workingState = state;
    for (const ally of adjacent) {
      workingState = incrementAtkBuff(workingState, ally.instanceId, 2);
    }
    return { state: workingState, newEvents: [], log: [`死に際の咆哮！隣接味方ATK+2`] };
  },
}
```

### 9.6 ターン開始時発動（3種）

#### S21. 指揮官（shikikan / commander）

```typescript
{
  id: 'shikikan',
  trigger: { kind: 'event', eventType: 'turn_start', phase: 'after' },
  priority: PRIORITY.TRIGGER_TURN_START,

  shouldTrigger: (event, self, state) => state.currentTurn === self.owner,

  onTrigger: (event, self, state) => ({
    state,
    newEvents: [createDrawEvent(self.owner, 1)],
    log: [`${self.card.name}：指揮官の追加ドロー`],
  }),
}
```

#### S22. 死の領域（shi_no_ryouiki / death_zone）

```typescript
{
  id: 'shi_no_ryouiki',
  trigger: { kind: 'event', eventType: 'turn_start', phase: 'after' },
  priority: PRIORITY.TRIGGER_TURN_START,

  shouldTrigger: (event, self, state) =>
    state.currentTurn !== self.owner, // 敵のターン開始時にのみ発火

  onTrigger: (event, self, state) => {
    const enemies = getAlliesOnBoard(state, opposite(self.owner));
    const damageEvents = enemies.map(e => createDamageEvent(self, e, 1, state, ['death_zone']));
    return { state, newEvents: damageEvents, log: [`死の領域：敵${enemies.length}体に1ダメージ`] };
  },
}
```

#### S23. 春の息吹（haru_no_ibuki / spring）

```typescript
{
  id: 'haru_no_ibuki',
  trigger: { kind: 'event', eventType: 'turn_start', phase: 'after' },
  priority: PRIORITY.AURA_POST,

  shouldTrigger: (event, self, state) => state.currentTurn === self.owner,

  onTrigger: (event, self, state) => {
    const allies = getAlliesOnBoard(state, self.owner);
    let workingState = state;
    for (const ally of allies) {
      workingState = healUnit(workingState, ally.instanceId, 1);
    }
    return { state: workingState, newEvents: [], log: [`春の息吹：味方全員HP+1`] };
  },
}
```

### 9.7 ターン終了時発動（1種）

#### S24. 再生（saisei / regenerate）

```typescript
{
  id: 'saisei',
  trigger: { kind: 'event', eventType: 'turn_end', phase: 'after' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  shouldTrigger: (event, self, state) => state.currentTurn === self.owner,

  onTrigger: (event, self, state) => {
    if (self.currentHp >= self.maxHp) return { state, newEvents: [], log: [] };
    return {
      state: healUnit(state, self.instanceId, 1),
      newEvents: [],
      log: [`${self.card.name}：再生で1回復`],
    };
  },
}
```

### 9.8 常時オーラ（4種）

オーラは `applyAura()` を介して**毎フレーム再計算**する。直接stateを変更しない。

#### S25. 狂戦士化（kyousenshi / berserker）

```typescript
{
  id: 'kyousenshi',
  trigger: { kind: 'permanent' },
  priority: PRIORITY.AURA_PRE_STAT,

  applyAura: (state, self) => {
    if (self.currentHp * 2 > self.maxHp) return state; // HP半分以下のときのみ
    return incrementAtkBuff(state, self.instanceId, 2, 'kyousenshi');
  },
}
```

#### S26. 聖なる加護（seinaru_kago / sacred_aura）

```typescript
{
  id: 'seinaru_kago',
  trigger: { kind: 'permanent' },
  priority: PRIORITY.AURA_PRE_HP,

  applyAura: (state, self) => {
    const allies = getAlliesOnBoard(state, self.owner);
    let workingState = state;
    for (const ally of allies) {
      workingState = incrementMaxHp(workingState, ally.instanceId, 1, 'seinaru_kago');
    }
    return workingState;
  },
}
```

#### S27. 戦旗（senki / war_banner）

```typescript
{
  id: 'senki',
  trigger: { kind: 'permanent' },
  priority: PRIORITY.AURA_PRE_STAT,

  applyAura: (state, self) => {
    const allies = getAlliesOnBoard(state, self.owner)
      .filter(a => a.instanceId !== self.instanceId);
    let workingState = state;
    for (const ally of allies) {
      workingState = incrementAtkBuff(workingState, ally.instanceId, 1, 'senki');
    }
    return workingState;
  },
}
```

#### S28. （Replacement系の鋼鉄の意志・軽減はS01・S02で記述済み）

### 9.9 起動型（9種 + 既存4種）

#### S29. 大震撼（daishinkan / earthquake）

```typescript
{
  id: 'daishinkan',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  canActivate: (state, self, ctx) => ctx.remainingUses !== 0,
  getValidTargets: () => [], // 位置選択不要

  resolve: (state, self) => {
    const enemies = getAlliesOnBoard(state, opposite(self.owner));
    const damageEvents = enemies.map(e => createDamageEvent(self, e, 1, state, ['earthquake']));
    return { state, newEvents: damageEvents, log: [`大震撼！敵${enemies.length}体に1ダメージ`] };
  },
}
```

#### S30. 引き寄せ（hikiyose / drag）

```typescript
{
  id: 'hikiyose',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  canActivate: (state, self, ctx) => ctx.remainingUses !== 0 && hasNearbyEnemy(state, self.position, 3),
  getValidTargets: (state, self) => getEnemiesInRadius(state, self.position, 3).map(e => e.position),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    const enemy = getUnit(state, target);
    if (!enemy) return { state, newEvents: [], log: [] };
    const targetPos = getAdjacentEmptyTowardSelf(state, self.position, enemy.position);
    if (!targetPos) return { state, newEvents: [], log: ['引き寄せ先が確保できない'] };
    return { state: moveUnit(state, enemy.instanceId, targetPos), newEvents: [], log: [`${enemy.card.name}を引き寄せた`] };
  },
}
```

#### S31. 位置入れ替え（irekae / swap）

```typescript
{
  id: 'irekae',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 'infinite',

  getValidTargets: (state, self) =>
    getAlliesOnBoard(state, self.owner)
      .filter(a => a.instanceId !== self.instanceId)
      .map(a => a.position),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    const ally = getUnit(state, target);
    if (!ally) return { state, newEvents: [], log: [] };
    return { state: swapPositions(state, self.instanceId, ally.instanceId), newEvents: [], log: [`${self.card.name}と${ally.card.name}が位置交換`] };
  },
}
```

#### S32. 瞬間移動（shunkan_idou / teleport）

```typescript
{
  id: 'shunkan_idou',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,

  getValidTargets: (state) => getAllEmptyPositions(state),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    return { state: moveUnit(state, self.instanceId, target), newEvents: [], log: [`${self.card.name}：瞬間移動`] };
  },
}
```

#### S33. 影分身（kagebunshin / shadow_clone）

```typescript
{
  id: 'kagebunshin',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 3,

  canActivate: (state, self, ctx) =>
    ctx.remainingUses !== 0 && getAdjacent4Empty(state, self.position).length > 0,

  getValidTargets: (state, self) => getAdjacent4Empty(state, self.position),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    // クローンは元のスキル**を持たない**（無限分身防止）
    const cloneEvent = createCloneEvent(self, target, ['token', 'shadow_clone']);
    return { state, newEvents: [cloneEvent], log: [`${self.card.name}：影分身を生成`] };
  },
}
```

#### S34. 召喚士（shoukanshi / summoner）

```typescript
{
  id: 'shoukanshi',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  canActivate: (state, self, ctx) => 
    ctx.remainingUses !== 0 &&
    getHand(state, self.owner).some(c => c.cost <= 6),

  getValidTargets: (state, self) => getEmptySummonZone(state, self.owner),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    const card = pickLowestCostCard(getHand(state, self.owner), 6);
    if (!card) return { state, newEvents: [], log: [] };
    const summonEvent = createSummonEvent(self.owner, card, target, ['summoned_by_skill']);
    return {
      state: removeFromHand(state, self.owner, card.id),
      newEvents: [summonEvent],
      log: [`召喚士！${card.name}を即時召喚`],
    };
  },
}
```

#### S35. 天啓（tenkei / revelation）

```typescript
{
  id: 'tenkei',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  // UI 側で「手札のどのカードのコストを下げるか」を選ばせる
  getValidTargets: () => [], // 別UIで処理

  resolve: (state, self, _target, ctx: any) => {
    const targetCardId: string = ctx.selectedCardId; // UI から渡される
    return {
      state: applyCostReduction(state, self.owner, targetCardId, 3),
      newEvents: [],
      log: [`天啓：手札のコストを-3`],
    };
  },
}
```

#### S36. 自爆（jibaku / self_destruct）

```typescript
{
  id: 'jibaku',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  canActivate: (state, self, ctx) => ctx.remainingUses !== 0,
  getValidTargets: () => [],

  resolve: (state, self) => {
    const enemies = getAdjacent8Enemies(state, self.position);
    const dmg = getEffectiveAtk(self, state) * 2;
    const damageEvents = enemies.map(e => createDamageEvent(self, e, dmg, state, ['jibaku']));
    const selfDeathEvent = createDeathEvent(self, ['jibaku_source']);
    return { state, newEvents: [...damageEvents, selfDeathEvent], log: [`自爆！周囲に${dmg}ダメージ`] };
  },
}
```

#### S37. 麻痺（mahi / paralyze）

```typescript
{
  id: 'mahi',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 1,

  getValidTargets: (state, self) => 
    getAlliesOnBoard(state, opposite(self.owner)).map(e => e.position),

  resolve: (state, self, target) => {
    if (!target) return { state, newEvents: [], log: [] };
    const enemy = getUnit(state, target);
    if (!enemy) return { state, newEvents: [], log: [] };
    return {
      state: applyStatusEffect(state, enemy.instanceId, 'paralyzed', 1),
      newEvents: [],
      log: [`麻痺！${enemy.card.name}を1ターン拘束`],
    };
  },
}
```

### 9.10 既存スキル（5種・移行版）

既存5スキル（貫通・大貫通・反撃・強化・治癒）も新フォーマットに移行する。**既存skills.tsを破棄して新しい形に書き換え**ること。

#### S38. 貫通（penetrate）

```typescript
{
  id: 'penetrate',
  trigger: { kind: 'activated' },
  priority: PRIORITY.TRIGGER_DEFAULT,
  maxUsesDefault: 3,

  canActivate: (state, self, ctx) => {
    if (ctx.remainingUses === 0) return false;
    const frontRow = self.owner === 'player' ? 0 : BOARD_ROWS - 1;
    return self.position.row === frontRow;
  },
  getValidTargets: () => [],

  resolve: (state, self) => {
    const dmg = 2;
    return {
      state: applyBaseDamage(state, self.owner, dmg),
      newEvents: [],
      log: [`貫通！陣地HP-${dmg}`],
    };
  },
}
```

#### S39. 大貫通（big_penetrate）
同様に移行。`dmg = getEffectiveAtk(self, state)` でATK分のダメージ。

#### S40. 強化（buff）
起動型、対象は味方ユニット1体、ATK恒久+1。

#### S41. 治癒（heal）
起動型、対象は隣接味方、HP+2。既存実装を新フォーマットへ移植。

---

## 10. ヘルパー関数仕様（lib/game/helpers.ts）

各スキルが使うヘルパー関数。**直接stateを変更する関数はここに集約**して、テスト容易性を確保。

```typescript
// 位置・盤面取得
getAdjacent4Empty(state, pos): Position[]
getAdjacent8Empty(state, pos): Position[]
getAdjacent4Enemies(state, pos, owner): Unit[]
getAdjacent8Enemies(state, pos, owner): Unit[]
getAdjacent8Allies(state, pos, owner): Unit[]
getAlliesOnBoard(state, owner): Unit[]
getEnemiesInRadius(state, pos, radius): Unit[]
getAllEmptyPositions(state): Position[]
getEmptySummonZone(state, owner): Position[]
hasNearbyEnemy(state, pos, radius): boolean

// ユニット操作（純関数：新stateを返す）
moveUnit(state, instanceId, newPos): GameSession
swapPositions(state, idA, idB): GameSession
removeUnitFromBoard(state, instanceId): GameSession
healUnit(state, instanceId, amount): GameSession
incrementAtkBuff(state, instanceId, amount, source?): GameSession
incrementMaxHp(state, instanceId, amount, source?): GameSession
silenceUnit(state, instanceId): GameSession
applyStatusEffect(state, instanceId, effect, duration): GameSession
scheduleRevival(state, unit, pos): GameSession
applyBaseDamage(state, owner, amount): GameSession

// 手札・デッキ
getHand(state, owner): Card[]
removeFromHand(state, owner, cardId): GameSession
pickLowestCostCard(hand, maxCost): Card | null
applyCostReduction(state, owner, cardId, amount): GameSession

// 計算
getEffectiveAtk(unit, state): number  // バフ加算後のATK
isUnitAlive(unit, state): boolean
opposite(owner): 'player' | 'ai'

// イベント生成
createEvent(params): GameEvent
createDamageEvent(source, target, amount, state, tags?): GameEvent
createSummonEvent(owner, card, pos, tags?): GameEvent
createAttackEvent(source, target, dmg, tags?): GameEvent
createDrawEvent(owner, count): GameEvent
createDeathEvent(unit, tags?): GameEvent
createCloneEvent(source, pos, tags?): GameEvent
```

---

## 11. テスト戦略

### 11.1 ユニットテスト（vitest推奨）

各スキルに対して最低3つのテストケース：

```typescript
// __tests__/skills/gouka.test.ts
describe('gouka (業火)', () => {
  test('召喚時、隣接8マスの敵にATK/2のダメージ', () => {
    const state = makeState({
      board: place(['enemy', 'goblin', 1, 1], ['enemy', 'goblin', 1, 2]),
    });
    const summonEvent = createSummonEvent('player', GOUKA_CARD, { row: 2, col: 2 });
    const result = dispatcher.dispatch(summonEvent, state);
    expect(getUnit(result.state, { row: 1, col: 1 })?.currentHp).toBe(0); // 死亡
  });

  test('shouldTriggerが他人の召喚で false を返す', () => {
    const skill = getSkill('gouka')!;
    const otherEvent = createSummonEvent('ai', SOMEONE_ELSE, { row: 0, col: 0 });
    const goukaUnit = makeUnit('gouka_user');
    expect(skill.shouldTrigger!(otherEvent, goukaUnit, makeState())).toBe(false);
  });

  test('使用回数が0なら shouldTrigger が false', () => {
    // ... maxUses: 1 のスキルが2回目では発火しないことを確認
  });
});
```

### 11.2 統合テスト（重要なシナリオ）

```typescript
// 反射の往復が無限ループしないこと
test('反射 vs 反撃 が3往復で停止', () => {
  // unitA: 反撃持ち / unitB: 反射持ち
  // unitA → unitB 攻撃で連鎖が始まる
  const result = simulateBattle(unitA, unitB);
  expect(result.log.filter(l => l.includes('反射')).length).toBeLessThan(5);
});

// 召喚士で召喚されたユニットの召喚時スキルが正しく発火
test('召喚士 → 召喚されたユニットの業火が発火', () => {
  // ...
});

// 影分身のクローンには元の影分身スキルが付かない（無限分身防止）
test('影分身のクローンは影分身スキルを持たない', () => {
  // ...
});

// 死の領域 + 春の息吹 が同ターンに発火する場合の優先順位
test('死の領域（敵ターン）と春の息吹（自ターン）は別ターンに分離して発火', () => {
  // ...
});
```

### 11.3 デッドロックテスト

```typescript
test('深度50のイベントチェーンで安全に中断される', () => {
  // 連鎖を意図的に作って、ハングしないことを確認
  const result = simulateInfiniteChain();
  expect(result.completed).toBe(true);
  expect(result.log).toContain('イベント連鎖が制限を超えたため中断');
});
```

---

## 12. 実装フェーズと優先順位

### Phase 0: 基盤（必須）

```
1. types/skills.ts                  → 型定義一式
2. lib/game/skills/registry.ts      → レジストリ
3. lib/game/events/dispatcher.ts    → イベントディスパッチャー
4. lib/game/helpers.ts              → ヘルパー関数群
5. lib/game/aura.ts                 → オーラ再計算
```

### Phase 1: 既存5スキルの移行（移行検証）

```
6. lib/game/skills/penetrate.ts
7. lib/game/skills/big_penetrate.ts
8. lib/game/skills/hangeki.ts (旧 counter)
9. lib/game/skills/buff.ts
10. lib/game/skills/heal.ts
+ skills.ts の旧実装を削除、新フォーマットへ完全移行
+ 既存テストが通ることを確認
```

### Phase 2: 召喚時 + 攻撃時 + 死亡時（コア）

```
11-14. 業火・召集・慧眼・凱旋
15-21. 連撃・連鎖雷撃・薙ぎ払い・吹き飛ばし・凍結・沈黙・吸血
22.    反射
23-26. 残骸・復活・殉教・死に際の咆哮
```

### Phase 3: ターン端 + オーラ（複雑な依存）

```
27-29. 指揮官・死の領域・春の息吹
30.    再生
31-34. 軽減・狂戦士化・聖なる加護・戦旗・鋼鉄の意志
+ オーラの再計算ロジックを徹底テスト
```

### Phase 4: 起動型（UI連動）

```
35-43. 大震撼・引き寄せ・位置入れ替え・瞬間移動・影分身・召喚士・天啓・自爆・麻痺
+ ターゲット選択UIの拡張（getValidTargetsを使う）
+ 怒り（被攻撃時の単純トリガー、漏れ枠）
```

各フェーズ終了時に、Phase 1の既存スキル動作確認を必ず行う（リグレッション検出）。

---

## 13. デバッグツール

```typescript
// dev環境のみ：イベントチェーンを可視化
if (process.env.NODE_ENV === 'development') {
  EventDispatcher.attachLogger((event) => {
    console.log(`[${event.metadata.depth}] ${event.type}/${event.phase}`, {
      source: event.source?.card.name,
      target: event.target?.card.name,
      tags: event.metadata.tags,
    });
  });
}
```

これでブラウザDevToolsで「いつ何のイベントが発火したか」が時系列で見える。バグ修正時の最有力武器。

---

## 14. 完了判定

このドキュメント通りに実装が完了したら、以下が成立すること：

- [ ] 35スキル全部が `lib/game/skills/{id}.ts` として独立ファイルで存在
- [ ] レジストリ経由でID → SkillDefinition が解決できる
- [ ] カードの `skill: { id: 'XXX', uses: N }` を別IDに書き換えるだけで効果が差し替わる（コード変更不要）
- [ ] 反射 vs 反撃 のような連鎖がデッドロックしない
- [ ] 死亡時に複数スキルが APNAP順で正しく発火する
- [ ] オーラ（戦旗・聖なる加護）が場の変化に応じて毎フレーム正しく再計算される
- [ ] 全35スキルそれぞれにユニットテストが存在
- [ ] 主要シナリオ（反射ループ防止、影分身連鎖防止、召喚士からの再帰召喚）の統合テストが通る

---

## 改訂履歴

- v1.0（2026-05-06）：初版。35スキルの実装仕様完備、デッドロック対策込み