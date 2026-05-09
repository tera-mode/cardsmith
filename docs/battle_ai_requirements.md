# cardsmith バトルAI 改修要件書

## 1. 背景と目的

cardsmith のバトル AI を、長期運用・バランス調整・自動対戦に耐える設計へ刷新する。

現状の AI（`src/lib/game/ai/`）は「難易度」「戦術」「読み手数」が同一の enum (`AIDifficulty`) に詰め込まれており、ステージごとの差別化や、同一難易度での戦術バリエーション、自動バランス検証ができない。本書はこれを「**戦術**」「**先読み手数**」の2軸に分離し、ステージごとに ID で AI を差し替えられる形に再設計するための要件をまとめる。

実装は本書を Claude Code に渡して進める。

## 2. ゴール

バトル AI を以下の性質を持つ仕組みに作り変える：

- ルールベース（外部 LLM 非依存）であり、決定論的に動作する
- バトルルール・ユニット性能・スキル性能・デッキ・戦術を完全把握し、プレイヤーが取れる全行動（召喚・移動・攻撃・**起動型スキル発動**）を AI も選択できる
- AI は「プロファイル ID」単位で扱い、各クエスト／ステージはプロファイル ID を1つ指定するだけで AI が決まる
- 難易度は「先読み手数」で表現する
- 戦術は別軸で差し替え可能にする
- バランス調整時に AI 同士を高速対戦させ勝敗を集計する仕組み（自動対戦ハーネス）を、後から追加できる設計にしておく（実装は本要件のスコープ外）

## 3. 用語

| 用語 | 定義 |
|---|---|
| BattleAIProfile | バトル AI の最小単位。`id` で識別され、戦術・先読み手数・評価重みを保持する |
| TacticStrategy | 戦術モジュール。評価関数のデフォルト重みと、行動候補の絞り込み・優先順位ロジックを定義する |
| searchDepth | AI の先読み手数（0〜3）|
| AIAction | AI の単位行動。召喚／移動／攻撃／スキル発動／ターン終了の5種類 |
| Owner | `'player' \| 'ai'` |

## 4. 全体アーキテクチャ

```
[QuestDefinition] -- enemyAIProfileId --> [BattleAIProfile]
                                              ├── tacticId: 'balanced' | 'scripted'
                                              ├── searchDepth: 0..3
                                              ├── evalWeights: EvalWeights
                                              └── searchOptions?: SearchOptions

[GameContext] --> runAITurn(state, profile, options)
                    ├── enumerateActions(state, 'ai')   全合法AIActionを列挙
                    ├── search(state, profile)          評価駆動の最善手選択
                    │     ├── ply1                      1手読み
                    │     └── plyN                      minimax + αβ
                    ├── applyAction(state, action)      純関数の状態遷移
                    └── evaluator.evaluateBoard         重みは tactic から
```

`runAITurn` は AI の1ターン全体を「複数の AIAction の連続適用」として実行する。途中状態の通知は `onUpdate` callback で行う（UIアニメーション用）。callback と delay を渡さなければ高速モードで動作する（自動対戦・テスト用）。

## 5. 詳細仕様

### 5.1 BattleAIProfile

`src/lib/game/ai/types.ts`：

```ts
export type Owner = 'player' | 'ai';

export type TacticId = 'balanced' | 'scripted';

export interface EvalWeights {
  baseHpDiff: number;
  alliedUnitValue: number;
  enemyUnitValue: number;
  alliedAdvance: number;
  enemyAdvance: number;
  healerPresence: number;
  skillPotential: number;        // 新規
  enemyAttackThreat: number;     // 新規
  alliedAttackThreat: number;    // 新規
}

export interface SearchOptions {
  topKSummon?: number;   // N手読みのとき、召喚候補の上位何件まで深掘りするか
  topKAction?: number;   // N手読みのとき、ユニット行動候補の上位何件まで深掘りするか
}

export interface BattleAIProfile {
  id: string;
  displayName: string;
  description: string;
  tacticId: TacticId;
  searchDepth: 0 | 1 | 2 | 3;
  evalWeights: EvalWeights;       // tactic.defaultWeights を必要に応じて上書き
  searchOptions?: SearchOptions;
  defaultBaseHp: number;          // クエスト側で上書き可能
}
```

### 5.2 プロファイルレジストリ

`src/lib/game/ai/profile_registry.ts`：

```ts
export function registerProfile(p: BattleAIProfile): void;
export function getProfile(id: string): BattleAIProfile;     // 未登録は throw
export function getAllProfiles(): BattleAIProfile[];
```

スキルレジストリ（`src/lib/game/skills/registry.ts`）と同じパターン。

#### 初期プロファイル（4種）

| profile.id | tactic | depth | defaultBaseHp | 用途 |
|---|---|---|---|---|
| `tutorial_scripted` | scripted | 0 | 3 | チュートリアル |
| `easy_balanced` | balanced | 1 | 6 | 易しい敵（重み弱め） |
| `normal_balanced` | balanced | 1 | 8 | 標準 |
| `hard_balanced` | balanced | 2 | 10 | 終盤・章ボス |

`easy_balanced` は `balanced` tactic の `defaultWeights` を弱体化したものを `evalWeights` に持つ（具体値は 5.5 を参照）。

### 5.3 戦術モジュール（TacticStrategy）

`src/lib/game/ai/tactics/` 配下に戦術ごとのファイルを置く。

```ts
export interface TacticStrategy {
  id: TacticId;
  defaultWeights: EvalWeights;

  /**
   * N手読みのとき、全列挙された AIAction の中から
   * 上位候補を粗いスコアで絞り込む。
   * 1手読みでは使わない（全列挙して評価）。
   */
  prefilterActions?(
    state: GameSession,
    actions: AIAction[],
    weights: EvalWeights,
    options: SearchOptions,
  ): AIAction[];

  /**
   * 同点アクションの tie-break。戦術固有の選好を表現する。
   * 戻り値は a-b 形式（負ならa優先, 正ならb優先, 0なら同等）。
   */
  preferAction?(a: AIAction, b: AIAction, state: GameSession): number;

  /**
   * searchDepth=0 専用。固定ルーチンで AIAction 列を生成する。
   * balanced は実装不要。scripted のみ実装する。
   */
  scriptedTurn?(state: GameSession, rng: Rng): AIAction[];
}
```

#### `balanced`（src/lib/game/ai/tactics/balanced.ts）

評価関数を素直に最大化する戦術。`defaultWeights` は 5.5 のとおり。

`prefilterActions` は以下の粗スコアで上位 N 件にカットする：

```
召喚: applySummon 後の (alliedUnitValue + alliedAdvance) を粗評価
移動: 移動後の alliedAdvance のみ
攻撃: ダメージ量 + (倒せるなら enemyUnitValue 分)
スキル: skill種別ごとに固定スコア（治癒15、バフ12、ダメージ10、デバフ8、その他5）
```

`preferAction`: 同点なら攻撃 > スキル > 移動 > 召喚 > end_turn の順で優先（攻撃機会を逃さないため）。

#### `scripted`（src/lib/game/ai/tactics/scripted.ts）

評価関数を使わず、固定ルールで `AIAction[]` を返す戦術。チュートリアル専用。

```
1. 召喚（1ターン1回）：
   手札にあれば最安カードを「自陣に最も近い空マス」に置く

2. ユニット行動（行動順は前列＝盤面奥側のユニットから）：
   a) 攻撃可能な敵があれば攻撃する
   b) なければ前進する（プレイヤー陣地方向）
   c) 動けなければ何もしない

3. 起動型スキル：行わない
```

### 5.4 探索エンジン

`src/lib/game/ai/search/` 配下に置く。

#### `searchDepth=0`

`tactic.scriptedTurn(state, rng)` を呼び、返ってきた `AIAction[]` を順に `applyAction` する。`scripted` 戦術専用。

#### `searchDepth=1`（src/lib/game/ai/search/ply1.ts）

```
while (state にまだ AI の行動余地がある) {
  candidates = enumerateActions(state, 'ai')
  scored = candidates.map(a => ({ a, score: evaluateBoard(applyAction(state, a), 'ai', weights) }))
  best = argmax(scored, tactic.preferAction)
  if (best is end_turn) break
  state = applyAction(state, best)
  await onUpdate(state)
}
```

全列挙して評価。盤面サイズが 4×4 で手札も少ないので問題ない（1ターンあたり数十ms目標）。

#### `searchDepth=2`, `3`（src/lib/game/ai/search/plyN.ts）

minimax＋αβ枝刈り。「自分の1ターン全体（複数の AIAction の連続適用）」を1ノードとして扱う。

```
function searchNode(state, depth, alpha, beta, isMaxNode):
  if (depth == 0 or state.winner) return evaluateBoard(state, 'ai', weights)

  turnSequences = enumerateTurnSequences(state, currentTurn)
  // 1ターン全体の AIAction 列の組み合わせ。tactic.prefilterActions で
  // 各ステップを上位 topKAction 件に絞る。召喚は topKSummon 件に絞る。

  for each seq in turnSequences:
    nextState = applyTurnSequence(state, seq)  // turnSwap も内部で行う
    score = searchNode(nextState, depth - 1, alpha, beta, !isMaxNode)
    update alpha/beta and best
    if alpha >= beta: prune

  return best
```

枝刈りのデフォルト値（`SearchOptions` 未指定時）：

| depth | topKSummon | topKAction |
|---|---|---|
| 1 | 全列挙 | 全列挙 |
| 2 | 5 | 5 |
| 3 | 3 | 3 |

性能目標：

- depth=1：1ターン < 50ms
- depth=2：1ターン < 200ms
- depth=3：1ターン < 1000ms（実プレイでは使わない、自動対戦想定）

実装上の注意：相手ターンを読むときは「相手のデッキ・手札の正確な情報」を持っていない可能性があるが、本要件では**相手の手札も完全可視**として扱う（簡略化）。手札不可視化は将来の拡張とする。

### 5.5 評価関数とデフォルト重み

`src/lib/game/ai/evaluator.ts`：

```ts
export function evaluateBoard(state: GameSession, owner: Owner, weights: EvalWeights): number;

export function evaluateBoardDetailed(
  state: GameSession,
  owner: Owner,
  weights: EvalWeights,
): { total: number; breakdown: Record<keyof EvalWeights, number> };
```

#### 各成分の定義

| 重み | 定義 |
|---|---|
| baseHpDiff | (味方ベースHP − 敵ベースHP) × baseHpDiff |
| alliedUnitValue | Σ(自軍ユニット.currentHp + ATK) × alliedUnitValue |
| enemyUnitValue | Σ(敵軍ユニット.currentHp + ATK) × enemyUnitValue |
| alliedAdvance | Σ(自軍ユニットの前進度) × alliedAdvance（前進度は AI なら row, Playerなら 3-row） |
| enemyAdvance | Σ(敵軍ユニットの前進度・自陣からの近さ) × enemyAdvance |
| healerPresence | 自軍にヒーラー（heal/saisei/haru_no_ibuki/keigan）が存在するなら +healerPresence |
| skillPotential | Σ(自軍ユニットのスキル使用回数残・activated種別のみ) × skillPotential |
| enemyAttackThreat | 次ターンに自陣を直接攻撃できる敵ユニット数 × enemyAttackThreat |
| alliedAttackThreat | 次ターンに敵陣を直接攻撃できる自軍ユニット数 × alliedAttackThreat |

#### `balanced.defaultWeights`

```ts
{
  baseHpDiff: 50,
  alliedUnitValue: 5,
  enemyUnitValue: -5,
  alliedAdvance: 3,
  enemyAdvance: -3,
  healerPresence: 8,
  skillPotential: 2,
  enemyAttackThreat: -8,
  alliedAttackThreat: 8,
}
```

#### `easy_balanced.evalWeights`（弱体化）

```ts
{
  ...balanced.defaultWeights,
  baseHpDiff: 25,
  alliedUnitValue: 2,
  enemyUnitValue: -2,
  enemyAttackThreat: -3,
  alliedAttackThreat: 3,
  // healerPresence と skillPotential は同値
}
```

#### `hard_balanced.evalWeights`（重視ポイント強化）

```ts
{
  ...balanced.defaultWeights,
  healerPresence: 12,
  skillPotential: 4,
  enemyAttackThreat: -12,
}
```

### 5.6 AIAction と純関数 applyXXX

#### AIAction の定義（src/lib/game/ai/types.ts）

```ts
export type AIAction =
  | { type: 'summon';   cardIndex: number; position: Position }
  | { type: 'move';     unitId: string; position: Position }
  | { type: 'attack';   unitId: string; target: AttackTarget }
  | { type: 'skill';    unitId: string; target: Position | null }
  | { type: 'end_turn' };
```

#### 純関数の整備（src/lib/game/rules.ts）

副作用なく `GameSession → GameSession` を返す純関数を整備する：

```ts
export function applySummon(state: GameSession, owner: Owner, cardIdx: number, pos: Position): GameSession;
export function applyMove(state: GameSession, unitId: string, pos: Position): GameSession;
export function applyAttack(state: GameSession, attackerId: string, target: AttackTarget): GameSession;
export function applySkill(state: GameSession, casterId: string, target: Position | null): GameSession;
export function applyEndTurn(state: GameSession): GameSession;

export function applyAction(state: GameSession, action: AIAction, owner: Owner): GameSession;
```

`applyAction` は AIAction.type で分岐して上記の関数を呼ぶ。`applySummon` 等は内部で `triggerOnSummon` / `triggerOnAttack` 等の既存ディスパッチャを呼ぶ。

これらは現状 `strategist.ts` 内の `simulateSummon` / `simulateMove` / `simulateAttack` を一般化・公開化したもの。AI と GameContext と将来のシミュレーターから共用する。

#### enumerateActions

```ts
export function enumerateActions(state: GameSession, owner: Owner): AIAction[];
```

`state` における `owner` の合法な AIAction を全て返す。考慮する制約：

- 既に召喚済みの場合は `summon` を含めない
- 既に攻撃済みの場合は `attack` を含めない（`PlayerState.hasAttackedThisTurn`）
- ユニットが行動済み・状態異常（frozen/paralyzed）の場合はそのユニットの行動を含めない
- スキル `silenced` の場合は `skill` を含めない
- 起動型スキルの `canActivate` を満たすかチェック
- スキルの `getValidTargets` から `target` の候補を生成
- `end_turn` は常に1つ含める

### 5.7 起動型スキルバグの修正

現状、`bestUnitAction1Ply` は起動型スキルを評価するが返り値の AIAction にスキル発動の情報が含まれない（`{ movePos, attack: null }` のみ）。`applyUnitAction` も move と attack しか実行しない。

5.6 の `AIAction` 型に `'skill'` 種別を加え、`enumerateActions` が起動型スキルを候補として返し、`applyAction` が `applySkill` を呼ぶようにすることで構造的に解決する。`bestUnitAction1Ply` 系のレガシーAPIは廃止し、5.4 の汎用探索に置き換える。

### 5.8 ステージとの紐付け（移行）

#### `QuestDefinition` の変更

`src/lib/types/meta.ts`：

```ts
export interface QuestDefinition {
  ...
  enemyAIProfileId: string;     // 旧 enemyAiLevel を完全置換
  enemyDeckId: string;
  enemyBaseHp?: number;         // 任意。プロファイルの defaultBaseHp を上書き
  ...
}
```

`enemyAiLevel` フィールドは完全に削除する。

#### 既存クエストの一括置換

`src/lib/data/quests.ts` の全クエスト（チュートリアル + 各章 ×5 ＝ 30件以上）について、以下のマッピングで置換する：

| 旧 enemyAiLevel | 新 enemyAIProfileId |
|---|---|
| `'tutorial'` | `'tutorial_scripted'` |
| `'easy'` | `'easy_balanced'` |
| `'normal'` | `'normal_balanced'` |
| `'hard'` | `'hard_balanced'` |

#### `resolveEnemyConfig` の改修

`src/contexts/GameContext.tsx`：

```ts
function resolveEnemyConfig(questId?: string): {
  profile: BattleAIProfile;
  enemyDeck: Card[];
  enemyBaseHp: number;
}
```

`enemyBaseHp` は `quest.enemyBaseHp ?? profile.defaultBaseHp` で決定する。現状ハードコードされている `{ tutorial: 3, easy: 6, normal: 8, hard: 10 }` は撤廃する（プロファイルの `defaultBaseHp` で表現済み）。

### 5.9 観測性

`runAITurn` は `options.debug: true` を渡された場合、各 AI 思考の内訳を console.log する：

```
[AI:hard_balanced] turn=5
  candidates (top 5 by score):
    1. summon sei_alicia → (1,2)  score=+34.5
    2. attack sei_grail → ai_baseHp  score=+30.0
    3. skill sei_eluna → (2,1)   score=+28.2
    ...
  selected: summon sei_alicia → (1,2)  score=+34.5
  evaluator breakdown: baseHpDiff=+200, alliedUnit=+45, advance=+12, threat=-16, ...
```

本番ビルドではデフォルト無効。自動対戦・プレイテスト時には有効化できる。

### 5.10 決定論性

- `Math.random` を AI のロジック内で直接使わない。`createRng(seed: number): Rng` で生成した RNG を `runAITurn` に渡し、内部で引き回す
- 同点アクションの tie-break もこの RNG に通す
- `runAITurn(state, profile, options)` の `options` に `seed?: number` を追加。未指定時は `Date.now()` 由来

これにより、自動対戦時に同じシードを与えれば試合が完全再現する。

#### Rng の実装

`src/lib/game/ai/rng.ts`：

```ts
export interface Rng {
  next(): number;          // [0, 1)
  pickIndex(n: number): number;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}

export function createRng(seed: number): Rng;
```

mulberry32 など軽量な疑似乱数で十分。

## 6. 廃止するもの

| ファイル／フィールド | 扱い |
|---|---|
| `src/lib/game/ai/types.ts` の `AIDifficulty` 型 | 削除 |
| `src/lib/game/ai/difficulty.ts` | 削除（中身は profile/tactic/search に分散） |
| `src/lib/game/ai/enemyMP.ts` | **削除（MP制約撤廃）** |
| `bestSummon1Ply` / `bestSummon2Ply` / `bestUnitAction1Ply` / `applyUnitAction` / `getActableAIUnits` | 削除（汎用探索に置換） |
| `simulateSummon` / `simulateMove` / `simulateAttack` | `rules.ts` の `applySummon` / `applyMove` / `applyAttack` に統合・公開 |
| `QuestDefinition.enemyAiLevel` | 削除 |
| `executeAITurn(state, onUpdate, difficulty)` | `runAITurn(state, profile, options)` に置換 |
| `getEnemyMP` / `canEnemySummon` | 削除 |

`canEnemySummon`（MP制約）は廃止する。AI の召喚制限は「手札にある」「空きマスがある」「1ターン1召喚」のみとし、プレイヤーと完全対称にする。

## 7. ファイル構造（改修後）

```
src/lib/game/
├── rules.ts                      ← 純関数 applySummon/applyMove/applyAttack/applySkill/applyEndTurn を追加。applyAction も。
└── ai/
    ├── index.ts                  runAITurn, getProfile, registerProfile を re-export
    ├── types.ts                  BattleAIProfile, AIAction, EvalWeights, SearchOptions, TacticStrategy, Owner
    ├── profile_registry.ts       registerProfile / getProfile / getAllProfiles
    ├── profiles/
    │   ├── index.ts              全プロファイルを registerProfile で登録（副作用 import）
    │   ├── tutorial_scripted.ts
    │   ├── easy_balanced.ts
    │   ├── normal_balanced.ts
    │   └── hard_balanced.ts
    ├── tactics/
    │   ├── index.ts              registerTactic / getTactic
    │   ├── balanced.ts
    │   └── scripted.ts
    ├── search/
    │   ├── enumerate.ts          enumerateActions
    │   ├── ply1.ts               1手読み
    │   └── plyN.ts               N手読み（minimax + αβ）
    ├── runAITurn.ts               state + profile + options を受け取り、AI のターン全体を実行する
    ├── evaluator.ts              evaluateBoard, evaluateBoardDetailed
    └── rng.ts                    createRng（シード可能 RNG, mulberry32）
```

## 8. 自動対戦ハーネス（R6）への設計上の制約

R6（自動対戦ハーネス）は本要件のスコープ外だが、後から追加できる状態にしておく。そのため**以下を必ず守る**：

1. `runAITurn` は `onUpdate` も `delay` も指定しない場合、同期的に高速実行できる（callback が undefined なら呼ばない、delay も 0）
2. `rules.ts` の純関数群（`applySummon` 等）は副作用ゼロで `GameSession → GameSession`。GameContext と切り離して呼び出せる
3. AI ロジック内の乱数は全て `createRng(seed)` 経由
4. `evaluateBoard` の重み・`SearchOptions` は外部から差し込める
5. `executeOpponentTurn`（プレイヤー側を AI として動かす）も `runAITurn` で実現可能（`owner` 引数の対称性を保つ）

これらを守れば、後で `src/lib/game/sim/runMatch.ts` を追加するだけで、AI 同士のヘッドレス対戦が動く。

## 9. 実装フェーズ

| Phase | 内容 | 想定工数 |
|---|---|---|
| P1 | `rng.ts` 追加。`rules.ts` への純関数群追加（`applySummon` 等）と既存 GameContext からの呼び出し置換 | 0.5日 |
| P2 | `AIAction` 型・`enumerateActions` の実装 | 0.5日 |
| P3 | `evaluator.ts` の重み拡張（threat 系・skillPotential の追加）と `evaluateBoardDetailed` | 0.5日 |
| P4 | `tactics/balanced.ts`, `tactics/scripted.ts` の実装 | 0.5日 |
| P5 | `search/ply1.ts`, `search/plyN.ts` の実装（αβ枝刈り含む） | 1日 |
| P6 | `profile_registry.ts` と4つの初期プロファイル登録、`runAITurn.ts` の実装 | 0.5日 |
| P7 | `executeAITurn` 全廃止、GameContext を `runAITurn` に置換 | 0.5日 |
| P8 | `QuestDefinition.enemyAIProfileId` への一括置換、`enemyAiLevel` 削除、`resolveEnemyConfig` 改修 | 0.5日 |
| P9 | プレイテスト（Playwright Level 1〜3）と smoke 動作確認、観測性ログの確認 | 0.5日 |

合計：5日。`balanced` の重み調整・枝刈り定数の調整はプレイテスト後に追加で 1〜2日。

## 10. 受け入れ基準

- [ ] 4プロファイル全てで Playwright Level 1〜3 のプレイテストが PASS する
- [ ] `hard_balanced` 対戦中、AI が起動型スキル（治癒・バフ・遠距離砲・凍結など）を1試合のうちに少なくとも1回発動する場面が観測ログから確認できる
- [ ] `tutorial_scripted` の挙動が現状の `tutorial` 難易度と同等（最安カードを召喚し、前進と攻撃のみ、スキル不使用）
- [ ] 同じ `seed` を渡すと同じ試合結果になる（決定論性の確認）
- [ ] `executeAITurn` への参照が `grep -r "executeAITurn" src/` で1件もヒットしない（完全置換）
- [ ] `enemyAiLevel` への参照が同じく1件もヒットしない
- [ ] `canEnemySummon` / `getEnemyMP` への参照が同じく1件もヒットしない
- [ ] `npm run build` が型エラーなく通る
- [ ] depth=1 の AI ターンが体感即時（< 100ms）、depth=2 が < 300ms

## 11. 残課題（チューニング）

実装後にプレイテストで調整する項目：

- `balanced.defaultWeights` の重み（特に新規追加の `skillPotential` / `enemyAttackThreat` / `alliedAttackThreat` の3つ）
- `SearchOptions` の枝刈り件数（depth=2 で 5×5）
- `easy_balanced` と `hard_balanced` の差分が体感的に難易度差として伝わるか

将来追加予定の戦術（`aggressive` / `defensive` / `controller` / `swarm` / `boss`）は今回追加しないが、`TacticStrategy` インターフェースを変えずに追加できることを `balanced` / `scripted` の実装で確認しておく。

## 12. Claude Code への作業依頼ポイント

実装に着手するときの注意：

- **既存テストが落ちないことを確認**しながら段階的に進める。Phase ごとに `npm run build` を通す
- 既存の `executeAITurn` を残したまま `runAITurn` を並行追加してから一括置換するのは避ける（中途半端な状態になりやすい）。Phase 7 で**一気に置換**する
- スキル発動の修正（5.7）は P2 + P5 で構造的に解決される。個別の hotfix としては作業しない
- プレイテストでスキル発動が観測されない場合は、`enumerateActions` でスキル候補が生成されていない、または `evaluateBoard` でスキル後の盤面スコアが他より低い、のどちらか。観測性ログ（5.9）で内訳を確認すること
- 完了後、本ドキュメント自体を `docs/ai_battle_design.md`（実装後の最終仕様書）として整備する作業は、Claude Code 側で適宜行ってよい

---

**本書バージョン**: v1.0  
**作成日**: 2026-05-09  
**スコープ**: cardsmith のバトル AI 改修 R1〜R5（自動対戦ハーネス R6 は後続）