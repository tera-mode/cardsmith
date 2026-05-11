# Cardsmith 再設計 v2 — 要件書（Claude Code 用）

最終更新: 2026-05-07
スコープ: オンボーディング刷新 + 系統別ステージ構造 + プレイヤーレベル進行 + 敵AIアルゴリズム化
対象リポジトリ: `tera-mode/cardsmith`

---

## 0. 設計思想（最重要・冒頭で読むこと）

このリリースは「**既存60カードはそのまま流用しつつ、ゲーム体験を根本から再設計する**」もの。
コードの大半は新規追加で、既存カードロジック・スキルエンジンは温存する。

3つの体験原則：

1. **「強いカードを手に入れる気持ちよさ」と「すぐに使えない悔しさ」の両立**
   入手したカードはコスト上限の壁ですぐにはデッキ入りしない。レベルアップで解禁される。
2. **「順番を選べる自由」と「明確なゴール感」の両立**
   チュートリアル3話の後、6系統30話を好きな順で攻略できる。系統ごとの世界観で「巡礼」感を出す。
3. **「AIが弱すぎないが、理不尽でもない」**
   ランダムAIではなく、評価関数ベースの1〜2手読みアルゴリズムでプレイヤーの上達を促す。

---

## 1. 既存実装の前提（変更しないもの）

以下は**今回スコープ外、変更しない**：

- 4×4 盤面ロジック（`src/lib/game/rules.ts`）
- スキルエンジン（`src/lib/game/skills/*`）
- カード定義 `src/lib/game/cards.ts` の **構造**（`Card` 型・60枚の存在）
  - ※ 個別カードの **`cost` 値の微調整**だけは許可（後述）
- Firebase Auth / Firestore のスキーマ
- 画像生成 MCP の使い方（`CLAUDE.md` 「画像生成・画像管理ルール」参照）

破壊的変更を加える領域：

- `src/lib/data/economy.ts`（コスト上限・EXPテーブル）
- `src/lib/data/quests.ts`（全置き換え）
- `src/lib/game/decks.ts`（標準デッキ廃止 → 系統別初期デッキへ）
- `src/lib/game/ai.ts`（廃止 → `src/lib/game/ai/` 配下にモジュール化）

---

## 2. 主人公・世界観設定

### 2-1. 主人公

| 項目 | 設定 |
|---|---|
| 名前 | **レン**（プレイヤー名は変更可、デフォルト「レン」） |
| 肩書 | 鍛冶師ギルド〈鍛炉(ロウフ)〉の見習いカードスミス |
| 加護 | 鍛冶神 **オルブ** の加護を受け、対戦相手の魂魄を「写し取り」、ルーン鋼に焼き付けて**カード化**する |
| 動機 | 師匠から放浪修業を命じられ、6つの領域を巡って自分のカード帳を完成させる |
| 最終目標 | 伝説の称号 **APEX CARDSMITH** に到達する |

### 2-2. ストーリー上のメカニクス対応

| ゲーム要素 | フィクション上の意味 |
|---|---|
| ステージ勝利でカード入手 | 相手の魂魄を写し取り、鍛炉でカードに鍛造する |
| 弱い相手から順に挑む | 「魂の格」が上がっていく修業の流儀 |
| プレイヤーレベル | 鍛炉の **コア容量** が拡張される |
| デッキ総コスト上限 | コアが許容できる魂魄の総量 |
| 6系統 | 6つの領域・流派 |

### 2-3. 6領域マッピング

| 系統 | 領域名 | 風景・色調 | 住人 |
|---|---|---|---|
| ⚪ 聖(sei) | **黎明都市〈エルナ〉** | 白亜の神殿・朝日・金 | 騎士団・聖職者・天使 |
| ⚫ 冥(mei) | **黄昏墓地〈ノクス〉** | 紫月の墓所・霧・漆黒 | 不死者・吸血鬼・暗殺者 |
| 🟢 森(shin) | **古樹郷〈シルウィア〉** | 巨樹の森・木漏れ日・緑 | エルフ・狼・ドルイド |
| 🔴 焔(en) | **灼炎砂漠〈アルダ〉** | 砂嵐と熔岩・橙赤 | 戦士・蛮族・火竜 |
| 🔵 蒼(sou) | **凍湖郷〈アズリア〉** | 氷の湖と城・青白・オーロラ | 魔導士・氷の精霊 |
| ⚙ 鋼(kou) | **機甲坑道〈クロムト〉** | 蒸気管と歯車・鋼灰・銅 | 技師・自動人形 |

各領域に「**領主(ボス)**」がいて、5話目で対決する。

---

## 3. データモデル変更

### 3-1. 定数の更新（`src/lib/data/economy.ts`）

```typescript
// デッキ枚数: 20 → 10
export const DECK_MAX_CARDS = 10;
export const DECK_MAX_SAME = 2;          // 同名カード上限（既存維持）

// 初期手札・先攻
export const INITIAL_HAND_SIZE = 3;       // 既存維持（要確認）

// プレイヤー初期値
export const INITIAL_PROFILE = {
  level: 1,
  exp: 0,
  runes: 0,
  // 注: starterArchetypeId は q0_3 クリア時に決定。初期値は null
};
```

### 3-2. レベルとコスト上限のテーブル

`getCostCapForLevel(level)` と `getExpToNextLevel(level)` を以下の表に従って実装。

| Lv | 次LvまでのEXP | 累計EXP | コスト上限 | 設計意図 |
|----|--------------|---------|------------|---------|
| 1  | 100  | 0     | **80**  | 初期デッキ（低5枚×2）がちょうど収まる |
| 2  | 150  | 100   | 90      | チュートリアル完了直後 |
| 3  | 200  | 250   | 100     | 各系統1話クリア程度 |
| 4  | 200  | 450   | 115     | 各系統2話クリア程度 |
| 5  | 250  | 700   | 130     | 各系統3話クリア程度 |
| 6  | 300  | 1000  | 150     | 各系統4話クリア程度 |
| 7  | 400  | 1400  | 170     | 各系統5話クリア程度 |
| 8  | 500  | 1900  | 185     | 自由対戦・リプレイ用 |
| 9  | 700  | 2600  | 200     | 上限解放 |
| 10 | -    | 3500  | 220     | 最大Lv |

> **設計根拠**: 全6系統5話制覇で約 3030 EXP獲得（後述報酬テーブル）→ Lv7〜8 到達。
> 1系統だけ集中攻略では Lv4〜5 までしか上がらず、強カードを使いきれない → 他系統に行く動機が生まれる。

### 3-3. ステージ報酬EXP

| ステージ種別 | EXP | ルーン |
|---|---|---|
| q0_1 / q0_2（チュートリアル） | 30 | 50 |
| q0_3（系統選択戦） | 90 | 100 |
| 系統 N-1（1話） | 60 | 100 |
| 系統 N-2（2話） | 70 | 120 |
| 系統 N-3（3話） | 90 | 150 |
| 系統 N-4（4話） | 110 | 180 |
| 系統 N-5（5話/章ボス） | 150 | 300 |
| リプレイ（既クリア再挑戦） | 元の20% | 元の30% |

**累計EXPシミュレーション:**
- チュートリアル完了: 30+30+90 = 150 EXP → Lv2
- 1系統制覇: 150 + 60+70+90+110+150 = 630 EXP → Lv4
- 3系統制覇: 150 + 480×3 = 1590 EXP → Lv7突入
- 全6系統制覇: 150 + 480×6 = 3030 EXP → Lv8

---

## 4. カード再分類ルール

### 4-1. 系統別「初期5 / 報酬5」の自動分類

`src/lib/game/cards.ts` の各系統10枚を **`cost` 昇順** に並べ、

- **インデックス 0〜4 = 初期デッキ候補**（低コスト5種）
- **インデックス 5〜9 = ステージ報酬**（高コスト5種、1〜5話で各1種ずつ報酬）

ヘルパー関数を追加：

```typescript
// src/lib/game/cards.ts に追記
export function getStarterCardsByAttribute(attr: Card['attribute']): Card[] {
  return getCardsByAttribute(attr).sort((a, b) => a.cost - b.cost).slice(0, 5);
}

export function getRewardCardsByAttribute(attr: Card['attribute']): Card[] {
  return getCardsByAttribute(attr).sort((a, b) => a.cost - b.cost).slice(5, 10);
}
```

### 4-2. 既存カードのコスト棚卸し（必須作業）

現状 `cards.ts` をコスト昇順で並べたとき、各系統の **「初期5枚の合計コスト × 2 ≤ 80」** を満たしているか確認すること。

確認済み（参照コードから）：

| 系統 | 初期5枚コスト合計 | ×2 | Lv1上限80 |
|---|---|---|---|
| 聖 | 4+6+9+10+11 = 40 | 80 | ✅ ピッタリ |
| 冥 | 4+6+8+9+11 = 38 | 76 | ✅ |
| 鋼 | 4+6+8+10+11 = 39 | 78 | ✅ |
| 森 | 4+6+8+10+11 = 39 | 78 | ✅ |
| 焔 | 要確認 | 要確認 | ? |
| 蒼 | 要確認 | 要確認 | ? |

**焔・蒼は必ず確認**。80を超える場合、いずれかのカードの cost を 1〜2 下げて 80 以内に収める。

### 4-3. 系統別初期デッキ定義（`src/lib/game/decks.ts` 全置き換え）

```typescript
// 旧 buildStandardDeck() は削除
// 新規: 6系統の初期デッキ
import { Card } from '@/lib/types/game';
import { getStarterCardsByAttribute } from './cards';

export type Archetype = 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';

export const ARCHETYPES: { id: Archetype; name: string; emoji: string; tagline: string }[] = [
  { id: 'sei',  name: '聖の流派',  emoji: '⚪', tagline: '守る・繋ぐ・育てる' },
  { id: 'mei',  name: '冥の流派',  emoji: '⚫', tagline: '死を糧にする・じわじわ削る' },
  { id: 'shin', name: '森の流派',  emoji: '🟢', tagline: '粘る・癒す・共生する' },
  { id: 'en',   name: '焔の流派',  emoji: '🔴', tagline: '攻め込む・燃やし尽くす' },
  { id: 'sou',  name: '蒼の流派',  emoji: '🔵', tagline: '凍らせる・足止めする' },
  { id: 'kou',  name: '鋼の流派',  emoji: '⚙️', tagline: '計算する・耐える・支配する' },
];

export function buildStarterDeck(archetype: Archetype): Card[] {
  const starters = getStarterCardsByAttribute(archetype);
  // 各2枚ずつで10枚
  return starters.flatMap(c => [c, c]);
}
```

---

## 5. ステージ構造（`src/lib/data/quests.ts` 全置き換え）

### 5-1. 全体構造

```
[Prologue / Chapter 0：チュートリアル — 一本道3話]
  q0_1 「鍛炉の灯」     → 召喚と移動を学ぶ
  q0_2 「初めての鍛造」 → 攻撃とスキルを学ぶ
  q0_3 「旅立ち」       → 6系統から初期デッキを選択 + 模擬戦

[Chapter 1〜6：六領域 — 並行解放（順不同）]
  各章 5話、合計30話

[Chapter 7：APEX CARDSMITH（最終決戦）— ★今回スコープ外]
```

### 5-2. チュートリアル3話の詳細

| ID | タイトル | 学習目的 | 敵デッキ | AI Lv | 報酬 |
|----|---------|---------|---------|-------|------|
| q0_1 | 鍛炉の灯 | 召喚→移動→ベース攻撃 | 案山子1体（HP3, ATK0, 動かない） | tutorial | EXP30, 何も入手しない |
| q0_2 | 初めての鍛造 | 攻撃射程・スキル発動 | 民兵2体（弱いランダム） | tutorial | EXP30, 何も入手しない |
| q0_3 | 旅立ち | **系統選択** → その系統の初期デッキで模擬戦 | 師匠（汎用デッキ） | easy | EXP90, **初期デッキ確定 + 選択系統の全カードを所持** |

> q0_3 の挙動詳細は [Section 6](#6-初期デッキ選択フロー) を参照。

### 5-3. 系統章ステージのジェネリック定義

各系統 N（sei / mei / shin / en / sou / kou）について、以下の5話を生成する：

```
ID: q{N}_1 〜 q{N}_5
```

| 話 | タイトルテンプレ | 敵AI Lv | 報酬カード | 報酬EXP |
|----|----------------|---------|-----------|---------|
| 1 | 〈領域〉の入口 | easy | 系統Nのcost昇順で6番目のカード ×2 | 60 |
| 2 | 巡礼の途上 | easy | 系統Nのcost昇順で7番目のカード ×2 | 70 |
| 3 | 試練の社 | normal | 系統Nのcost昇順で8番目のカード ×2 | 90 |
| 4 | 領主の使い | normal | 系統Nのcost昇順で9番目のカード ×2 | 110 |
| 5 | 領主との対決 | hard | 系統Nのcost昇順で10番目のカード ×2 | 150 |

**前提条件:**
- q0_3 クリア後、6系統すべて並行解放（`prerequisites: ['q0_3']`）
- 同一系統内は順番制（`prerequisites: ['q{N}_{order-1}']`）

### 5-4. 領域別タイトル・テキスト

各系統5話の `title` / `description` / `prologue` / `epilogue` は領域世界観に合わせて差別化する。
最低限、以下のテーブルに従って固有名詞を当てはめる：

| 系統 | 領域名 | 5話ボスのキャラ名（提案） |
|---|---|---|
| sei | エルナ大聖堂 | 大聖騎士グレイル |
| mei | ノクス墓所 | 夜の女王ニュクス |
| shin | シルウィアの大樹 | 大地の番人グレン |
| en | アルダ火山口 | （焔系統の最高コストキャラ名を使用） |
| sou | アズリア氷宮 | （蒼系統の最高コストキャラ名を使用） |
| kou | クロムト工場 | 重装機甲タイタン |

> `cards.ts` の最高コストキャラと一致させると、報酬カードとボスキャラが同一でストーリー的に綺麗。

各話に `prologue` / `epilogue` を1〜3メッセージずつ用意する。冗長にしない（既存 q1_1 程度の分量）。

---

## 6. 初期デッキ選択フロー

### 6-1. q0_3 の特殊挙動

q0_3 「旅立ち」の prologue 終了後、戦闘開始前に **系統選択モーダル**を表示する：

```
画面遷移：
  [q0_3 prologue 表示]
    ↓
  [系統選択モーダル]
    ⚪聖 / ⚫冥 / 🟢森 / 🔴焔 / 🔵蒼 / ⚙鋼 の6カード表示
    各カードに tagline と「含まれるカード5種のサムネ」
    ↓ プレイヤー選択
  [選択した系統の初期デッキで戦闘開始]
    ↓ 勝利
  [epilogue 表示] → 報酬適用
```

### 6-2. 報酬適用ロジック

q0_3 クリア時：

1. プロファイルに `starterArchetype: Archetype` を保存
2. 選択系統の **初期5枚を各2枚** 所持カードに追加（合計10枚）
3. **初期デッキを自動構築** して `decks` に「starter」名で保存
4. 通常のEXP/ルーン報酬を適用

```typescript
// src/lib/types/meta.ts に追記
export interface PlayerProfile {
  // ...既存フィールド
  starterArchetype?: Archetype;  // q0_3 クリア後に確定
}
```

### 6-3. デッキ編集の制約

- 初期デッキ作成後、プレイヤーは自由にデッキを編集できる（既存 `app/deck/page.tsx` のフロー）
- 他系統のカードを入手して混ぜることも可能（系統縛りなし）
- ただしコスト上限のチェックは厳格に行う

---

## 7. 敵デッキ構成

### 7-1. 構成式（決定版）

> **「ステージNの敵デッキ = 報酬カード(その話の高コスト) ×2 + その系統の初期5種を各2枚」 = 計12枚**

ただし**手札補充上の理由で 10枚に圧縮**する場合は、初期5種から2枚（最低コスト2種を1枚ずつ）を間引く。

実装例（pseudo）：

```typescript
function buildEnemyDeck(archetype: Archetype, stageOrder: 1|2|3|4|5): Card[] {
  const sorted = getCardsByAttribute(archetype).sort((a,b) => a.cost - b.cost);
  const reward = sorted[5 + stageOrder - 1];   // 6番目〜10番目
  const starters = sorted.slice(0, 5);

  // 高コスト報酬2枚 + 初期5種から各2枚のうち、合計10枚に調整
  const deck = [reward, reward, ...starters.flatMap(c => [c, c])];
  // 初期12枚 → 最低コスト2種を1枚ずつ削って10枚に
  deck.splice(2, 1);  // 最低コストカード1枚削除
  deck.splice(3, 1);  // 2番目に低いカード1枚削除
  return deck;
}
```

### 7-2. 敵プレイヤーの召喚制約（重要）

**プレイヤー側にはMP概念を入れない**（デッキ総コスト上限のみ）が、
**敵側には「ターン制MP」を導入**して、序盤に高コストカードが出ない調整をする：

```typescript
// 敵が使えるMP
function getEnemyMP(turnCount: number): number {
  return Math.min(8 + turnCount * 2, 30);
}

// 敵の召喚判定
function canEnemySummon(card: Card, turnCount: number, alreadySummonedCost: number): boolean {
  return card.cost + alreadySummonedCost <= getEnemyMP(turnCount);
}
```

> ターン1: MP10、ターン2: MP12、…、ターン6: MP20、ターン10: MP28、ターン12+: MP30
> これにより、`sei_johannes(C28)` などの大物は最速でもターン10前後にしか出てこない。

### 7-3. 敵ベースHP

| AI Lv | 敵ベースHP | プレイヤーベースHP |
|-------|-----------|------------------|
| tutorial | 3 | 10 |
| easy | 6 | 10 |
| normal | 8 | 10 |
| hard | 10 | 10 |

`enemyAiLevel` フィールドに `'tutorial'` を追加する（既存の easy/normal/hard と並列）。

---

## 8. AI 設計（アルゴリズムベース）

### 8-1. ファイル構成

```
src/lib/game/ai/
  ├── index.ts          ← executeAITurn のエントリポイント（外部公開）
  ├── evaluator.ts      ← evaluateBoard(state, owner): number
  ├── moveGenerator.ts  ← 全合法手の列挙
  ├── strategist.ts     ← 1手読み / 2手読み実装
  ├── difficulty.ts     ← tutorial/easy/normal/hard の分岐
  ├── enemyMP.ts        ← 敵のターン制MP管理
  └── types.ts          ← AI内部の型定義
```

旧 `src/lib/game/ai.ts` は削除。`GameContext.tsx` からの import 先を `@/lib/game/ai` に変更。

### 8-2. AI意思決定パイプライン

```
executeAITurn(state, updateSession):
  1. 召喚フェーズ
     a. 手札 × 召喚可能位置 の全組み合わせを列挙
     b. enemyMP 制約でフィルタ
     c. 各組み合わせで仮想ボードを生成 → evaluator でスコア
     d. 最高スコアの召喚を実行（または「召喚しない」もスコア対象）

  2. 行動フェーズ（自軍ユニット全員、行動順最適化）
     a. 「射程の狭いユニット」から行動順を決定
     b. 各ユニットについて (移動先 × 攻撃対象 or スキル使用) の全合法手を列挙
     c. evaluator で最高スコアの手を採用
     d. 「行動しない」も合法手の1つに含める

  3. ターン終了
```

### 8-3. 評価関数（`evaluator.ts`）

```typescript
interface EvalWeights {
  baseHpDiff: number;
  alliedUnitValue: number;
  enemyUnitValue: number;
  alliedAdvance: number;
  enemyAdvance: number;
  healerPresence: number;
  highCostKill: number;
}

const DEFAULT_WEIGHTS: EvalWeights = {
  baseHpDiff: 50,        // (自陣HP - 敵陣HP) × 50
  alliedUnitValue: 5,    // Σ (atk + hp) × 5
  enemyUnitValue: -5,    // 敵軍ユニットの (atk + hp) × -5
  alliedAdvance: 3,      // 自軍ユニットが敵陣に近いほど +3 × distance
  enemyAdvance: -3,      // 敵軍ユニットが自陣に近いほど -3 × distance
  healerPresence: 8,     // 自軍にヒーラー系がいれば +8
  highCostKill: 20,      // 高コスト(cost>=15)を倒す手は +20
};

export function evaluateBoard(
  state: GameSession,
  owner: 'player' | 'ai',
  weights: EvalWeights = DEFAULT_WEIGHTS
): number;
```

評価関数は**owner視点**で計算する。AIから見るときは `owner='ai'` で呼び出す。

### 8-4. 難易度別挙動（`difficulty.ts`）

| 難易度 | 召喚 | 行動 | 評価関数 |
|--------|-----|-----|---------|
| **tutorial** | 1手読み（最低コストカードを優先） | 前進のみ、攻撃可能ならする | デフォルト×0.5（弱い手も選ぶ） |
| **easy** | 50%でランダム、50%で1手読み | 50%でランダム、50%で1手読み | デフォルト |
| **normal** | 1手読み（常に最善） | 1手読み（常に最善） | デフォルト |
| **hard** | 2手読み（自分の手→敵の最善手） | 2手読み | デフォルト + スキル使用ボーナス |

### 8-5. 計算量見積

- 4×4盤面、最大手札5枚 → 召喚の全組合せ ≈ 5枚 × 4位置 = 20通り
- 場のユニット最大4体 × 移動候補5マス × 攻撃候補3 = 60通り/ユニット
- 1手読み: 数百通り / 2手読み: 数万通り
- ターンあたり計算時間目標: **easy/normal で 50ms以内、hard で 200ms以内**

### 8-6. プレイヤーへの「読まれてる感」演出

AIの行動には**0.4〜0.8秒のディレイ**を挟む：

```typescript
// strategist.ts
async function executeWithDelay(action: () => void, ms = 600) {
  await new Promise(r => setTimeout(r, ms));
  action();
}
```

「考えている」感を出すと同時に、プレイヤーがAIの動きを目で追える。

---

## 9. UI / UX 変更

### 9-1. 新規画面

| 画面 | パス | 役割 |
|------|------|------|
| 領域マップ | `/regions` | 6系統の領域を地図風に表示。各系統の進捗(0/5)を表示 |
| 系統選択モーダル | （q0_3 内） | 6系統の中から1つ選ぶ |

### 9-2. 既存画面の改修

| 画面 | 変更内容 |
|------|---------|
| `/`（タイトル） | 「次にやること」リンクを領域マップへ。q0_3 未完なら「旅立ち」へ |
| `/play` | バトル背景を `bg_{archetype}.jpg` に動的切り替え |
| `/deck` | デッキ枚数表示を `?/10` に変更。コスト上限超過時の警告UI |
| `/result` | 報酬カード入手演出を追加（鍛炉に新カードが焼き付けられる演出） |

### 9-3. 系統別テーマ

CSS変数で系統色を切り替え：

```css
[data-theme='sei']  { --theme-color: #d4af37; --theme-frame: url('/images/ui/frame_sei.png');  }
[data-theme='mei']  { --theme-color: #9333ea; --theme-frame: url('/images/ui/frame_mei.png');  }
[data-theme='shin'] { --theme-color: #22c55e; --theme-frame: url('/images/ui/frame_shin.png'); }
[data-theme='en']   { --theme-color: #ef4444; --theme-frame: url('/images/ui/frame_en.png');   }
[data-theme='sou']  { --theme-color: #3b82f6; --theme-frame: url('/images/ui/frame_sou.png');  }
[data-theme='kou']  { --theme-color: #64748b; --theme-frame: url('/images/ui/frame_kou.png');  }
```

`<body data-theme="sei">` のように動的にスイッチ。

> ※ frame_*.png は今回**必須ではない**。色のみの切り替えでもOK。フレーム画像は後フェーズ。

### 9-4. data-testid 追加要件

CLAUDE.md の data-testid 一覧に以下を追加：

```
[data-testid="region-map"]                      — 領域マップ画面
[data-testid="region-card-{archetype}"]         — 領域マップ上の各系統カード
[data-testid="archetype-select-modal"]          — q0_3 の系統選択モーダル
[data-testid="archetype-option-{archetype}"]    — 系統選択肢
[data-testid="cost-cap-warning"]                — コスト上限超過警告
[data-testid="reward-card-{cardId}"]            — リザルト画面の入手カード
```

---

## 10. 画像生成タスク

### 10-1. 必須生成（リリース前）

**バトル背景 6種** (`public/images/backgrounds/bg_{archetype}.jpg`、1024×1024、JPEG q90)

| ファイル | プロンプト要点 |
|---------|---------------|
| `bg_sei.jpg`  | white marble cathedral plaza at dawn, golden sunlight, holy emblems on the floor, full frame edge-to-edge composition |
| `bg_mei.jpg`  | misty graveyard under a purple moon, crumbling tombstones, scattered bones, ancient altar |
| `bg_shin.jpg` | mossy clearing surrounded by giant ancient tree roots, dappled sunlight, glowing fireflies |
| `bg_en.jpg`   | volcanic lava plains, cracked black rocks, embers in the air, scorching heat haze |
| `bg_sou.jpg`  | frozen lake arena, ice crystals, aurora in the sky, blue-white palette |
| `bg_kou.jpg`  | industrial factory floor with brass gears and steam pipes, copper-grey tones |

**全画像共通の必須フレーズ:**
```
no characters, no units in the artwork, top-down battlefield view,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana,
full frame edge-to-edge composition, no white borders, no padding, no frame
```

**生成順序の遵守:**

1. まず1枚（例: `bg_sei.jpg`）だけ生成 → ユーザー承認を得る（CLAUDE.md「画像生成・画像管理ルール」の鉄則）
2. 承認後、残り5枚を一括生成
3. 既存 `board.jpg` は削除せず、チュートリアル用に温存

### 10-2. 不要

- カード画像: 既存60枚を流用（追加生成しない）
- キャラ画像: 既存を流用
- フレーム画像: 今フェーズではスコープ外

---

## 11. マイグレーション戦略

### 11-1. 既存ユーザーデータ

ユーザー方針: **「リセットする」**

実装:
1. `PlayerProfile` に `schemaVersion: number` を追加（新規 = 2）
2. ロード時に `schemaVersion < 2` または未定義なら **強制リセット**を実行
3. リセット時に「ゲームの仕様が大幅に更新されました。データをリセットして再スタートします」のモーダルを表示
4. `debugReset` ロジックを流用、ただし `starterArchetype` は未設定にする（q0_3 で確定）

### 11-2. データ整合性チェック

リリース前テスト：

- [ ] 全60カードのコストを取得 → 各系統の初期5枚×2の合計が **80以下** であることを確認
- [ ] 焔・蒼系統のコストを実機確認
- [ ] q0_1 のチュートリアルが、初期デッキなしの状態（プロファイル新規作成直後）でも進行可能か
- [ ] q0_3 の系統選択で、6系統すべてが選択可能で、初期デッキが正しく構築されるか

---

## 12. 実装フェーズ・タスク分解

各フェーズで commit する。Claude Code は git commit までは自由、push はユーザー確認後。

### Phase 1: データ層の刷新（コードのみ、UIなし）

- [ ] `src/lib/data/economy.ts` のコスト上限テーブル・EXPテーブル更新、`DECK_MAX_CARDS=10`
- [ ] `src/lib/game/cards.ts` に `getStarterCardsByAttribute` / `getRewardCardsByAttribute` 追加
- [ ] `src/lib/game/cards.ts` の焔・蒼系統を確認、コスト超過があれば調整（変更ログを残す）
- [ ] `src/lib/game/decks.ts` を全置き換え（旧 `buildStandardDeck` 削除、`buildStarterDeck(archetype)` 追加）
- [ ] `src/lib/types/meta.ts` に `starterArchetype` と `schemaVersion` を追加
- [ ] `src/lib/data/quests.ts` を全置き換え（チュートリアル3 + 6系統×5 = 33話）

**Phase 1 完了基準:** `npm run build` が通り、型エラーがないこと。

### Phase 2: AI モジュール化

- [ ] `src/lib/game/ai/` ディレクトリ作成、6ファイル新設（Section 8-1）
- [ ] 旧 `src/lib/game/ai.ts` 削除、import 先を `@/lib/game/ai` に統一
- [ ] `evaluator.ts` の評価関数実装
- [ ] `moveGenerator.ts` の合法手列挙（既存 `rules.ts` のヘルパーを活用）
- [ ] `strategist.ts` の1手読み・2手読み実装
- [ ] `difficulty.ts` で tutorial/easy/normal/hard 分岐
- [ ] `enemyMP.ts` でターン制MP管理
- [ ] AI判定単体のユニットテスト追加（`src/lib/game/ai/__tests__/evaluator.test.ts`）

**Phase 2 完了基準:** Playwright Level 2 (ゲームフロー) でAIが妥当な手を打つこと。`game-log` でAIの召喚・移動・攻撃が確認できること。

### Phase 3: チュートリアル + 系統選択フロー

- [ ] q0_1, q0_2, q0_3 の戦闘実装（特に q0_1 の案山子AI = 動かない・攻撃しない）
- [ ] q0_3 の系統選択モーダル実装（`src/components/game/ArchetypeSelectModal.tsx`）
- [ ] q0_3 クリア時の報酬適用ロジック（初期デッキ自動構築）
- [ ] `data-testid="archetype-select-modal"` 等のテストID付与

**Phase 3 完了基準:** 新規ユーザーが q0_1 → q0_2 → q0_3 → 系統選択 → 戦闘勝利 まで通せること。

### Phase 4: 領域マップ + 系統章ステージ

- [ ] `/regions` 画面実装（領域マップ）
- [ ] q0_3 完了後、領域マップに6系統が解放される
- [ ] 系統章ステージ30話の動作確認（敵デッキの自動構築含む）
- [ ] 系統別バトル背景の動的切り替え

**Phase 4 完了基準:** 全30話が進行可能。報酬カードが正しく入手できる。

### Phase 5: UI整備・系統テーマ

- [ ] CSS変数による系統テーマ切り替え
- [ ] デッキ編集画面の `?/10` 表示・コスト上限警告
- [ ] リザルト画面の報酬カード演出

### Phase 6: 画像生成

- [ ] `bg_sei.jpg` を1枚だけ生成、ユーザー承認を取得
- [ ] 残り5系統の背景を生成
- [ ] q0_1 の案山子用画像（必要なら）

### Phase 7: マイグレーション + リリース前チェック

- [ ] `schemaVersion` ロジック実装、リセットモーダル
- [ ] Section 11-2 のデータ整合性チェック全項目を実施
- [ ] Playwright Level 1〜3 全パス
- [ ] プレイテストレポートを `docs/playtest_reports/redesign_v2.md` に保存

---

## 13. 受け入れ基準（Definition of Done）

リリース判定時に以下をすべて満たすこと：

### ゲーム体験

- [ ] 新規ユーザーが3分以内にチュートリアル q0_1 を完了できる
- [ ] q0_3 で6系統の特徴がプレイヤーに伝わる（tagline + サムネ）
- [ ] 系統章 1〜3話までは初心者でも勝てる（プレイテスト3名で2/3勝率）
- [ ] 系統章 5話（章ボス）はある程度の戦略が必要（初見で1〜2敗する難易度）

### 数値バランス

- [ ] 1系統制覇でちょうど Lv4〜5 に到達する
- [ ] 全6系統制覇で Lv7〜8 に到達する
- [ ] 入手した報酬カードのうち、低コスト2話分(6番目・7番目)はクリア時点でデッキに入れられる
- [ ] 高コスト3話分(8〜10番目)はクリア時点ではコスト超過で入れられない（=次の戦いでLvアップ後に解禁）

### AI 品質

- [ ] easy AI: 初期デッキ持ったプレイヤーが7割勝てる
- [ ] normal AI: 初期デッキでは勝率5割前後
- [ ] hard AI: 初期デッキでは勝率3割以下、編成を工夫して5割
- [ ] AIターンが3秒以上止まらない（計算量上限）

### 技術品質

- [ ] `npm run build` 警告なし
- [ ] TypeScript型エラーなし
- [ ] Playwright Level 1〜3 全パス
- [ ] 新規ユーザー登録から q0_3 クリアまでの一貫したスモークテストが通る
- [ ] 既存ユーザーのリセットフローが動作（`schemaVersion` チェック）

---

## 14. 今後の拡張ポイント（v3 以降、本要件外）

- **Chapter 7：APEX CARDSMITH 最終決戦**（全系統踏破で解放）
- **プレイヤー側のMP制**導入で1試合の戦略性向上
- **デイリー対戦**（既存自由対戦を強化）
- **称号システム**（系統制覇報酬、無敗クリア報酬）
- **PvP 対戦**（既存「サーバー移行」コメントの実現）

---

## 付録 A: 既存ファイルとの対応表

| 既存ファイル | 変更種別 | 主な変更 |
|---|---|---|
| `src/lib/data/economy.ts` | 修正 | `DECK_MAX_CARDS=10`、上限テーブル更新 |
| `src/lib/game/cards.ts` | 微修正 | ヘルパー関数追加、コスト微調整 |
| `src/lib/game/decks.ts` | 全置き換え | `buildStarterDeck` |
| `src/lib/data/quests.ts` | 全置き換え | チュートリアル3 + 系統別30 |
| `src/lib/game/ai.ts` | **削除** | `src/lib/game/ai/` に置き換え |
| `src/lib/types/meta.ts` | 追記 | `starterArchetype`, `schemaVersion` |
| `src/contexts/ProfileContext.tsx` | 修正 | リセットフロー、starterArchetype管理 |
| `src/contexts/GameContext.tsx` | 修正 | AI import 先変更、敵デッキ動的構築 |
| `src/app/page.tsx` | 修正 | 「次にやること」リンク改修 |
| `src/app/regions/page.tsx` | 新規 | 領域マップ |
| `src/components/game/ArchetypeSelectModal.tsx` | 新規 | 系統選択モーダル |

## 付録 B: 用語集

| 用語 | 意味 |
|------|------|
| アーキタイプ (Archetype) | 6系統の識別子 (`'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou'`) |
| 初期デッキ | 系統選択時に自動構築される、その系統の低コスト5種×2枚=10枚のデッキ |
| 報酬カード | 系統章の各話クリア時に入手する、その系統の高コスト1種×2枚 |
| 系統章 | チュートリアル後に解放される、各系統5話のストーリー（合計30話） |
| 領域 | 系統章のフィクション上の舞台。例: 黎明都市〈エルナ〉 |
| 領主 | 系統章5話のボスキャラ |
| コスト上限 | プレイヤーレベルに応じた、デッキ全カードの合計コスト上限 |
| 鍛炉 (ロウフ) | 主人公が所属する鍛冶師ギルドの名称。ストーリー上の舞台 |