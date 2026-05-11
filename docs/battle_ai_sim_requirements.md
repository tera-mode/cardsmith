# cardsmith バトルAI 自動対戦ハーネス（R6）要件書

## 1. 背景

R1〜R5 でバトル AI が以下の性質を備えた状態で実装済み：

- `runAITurn(state, profile, options)` は `onUpdate`/`delay` 不指定で同期高速実行できる
- `rules.ts` の `applySummon` / `applyMove` / `applyAttack` / `applySkill` / `applyEndTurn` は副作用ゼロの純関数
- AI ロジックの乱数は `createRng(seed)` 経由で決定論的
- `BattleAIProfile` は ID で識別され、レジストリから取得できる

R6 はこれらを活用し、**AI 同士を高速対戦させて勝敗・統計を集計するハーネス**を構築する。狙いは以下の4つ：

1. 新カード追加・既存カード調整時のデッキ強度比較
2. 6種族×各5デッキ（30デッキ）の総当たりによるバランス検証
3. 新 tactic 追加時の既存 tactic との比較評価
4. CI でのリグレッション検知（既存マッチアップの勝率が大きく動いていないか）

## 2. ゴール

以下を満たす自動対戦ハーネスを作る：

- 1試合をヘッドレスで実行する `runMatch` 関数（純関数、副作用は乱数のみ）
- 同じ条件で N 回繰り返して勝率集計する `runBatch`
- プロファイル × デッキの総当たり対戦をする `runMatrix`
- CLI（`npm run sim`）から実行可能
- 結果を Markdown / JSON / CSV で出力
- 単一スレッドで 1試合 < 100ms（depth=1 同士）／< 300ms（depth=2 同士）
- 10,000試合のマトリクス対戦が 30分以内
- 後から `worker_threads` で並列化できる構造

## 3. 用語

| 用語 | 定義 |
|---|---|
| Side | 対戦の片方。`'A' \| 'B'`。GameSession 内の `'player' \| 'ai'` とは独立した呼称 |
| MatchConfig | 1試合の構成情報（AI、デッキ、HP、シード等） |
| MatchResult | 1試合の結果。勝者・ターン数・統計・終了状態を持つ |
| BatchResult | N回の MatchResult を集計したもの |
| MatrixResult | プロファイル × デッキ等の組み合わせごとに BatchResult を持つ |
| Reporter | MatrixResult / BatchResult を Markdown / JSON / CSV に書き出すモジュール |

## 4. 事前確認（R5 実装の前提条件）

R6 の作業に着手する前に以下を確認する。満たしていない場合は R6 の前段で修正する：

1. `runAITurn` が **両 Owner（player / ai）に対応**していること。シミュレーターは両陣営とも AI として駆動するため、`runAITurn(state, profile, { owner: 'player' })` のような形で対称に呼べる必要がある
2. `executeAITurn` への参照が完全に消えていること
3. `rules.ts` の純関数群（applySummon 等）が GameContext から切り離して呼び出せること
4. `Math.random()` への直接依存が AI ロジック・デッキシャッフル・初期手札配布の各所から完全に除去されていること

このうち4. のデッキシャッフル決定論化は、R6 で必須なので**必要なら本要件のスコープに含める**。具体的には `buildStandardDeck`/`buildEnemyDeck`/`shuffleDeck` 周辺の乱数を `createRng(seed)` 経由に統一する。

## 5. 詳細仕様

### 5.1 MatchConfig / MatchResult の型

`src/lib/game/sim/types.ts`：

```ts
export type Side = 'A' | 'B';

export interface SideConfig {
  profileId: string;            // BattleAIProfile.id
  deck: Card[];                 // 10枚のカード
  baseHp: number;
}

export interface MatchConfig {
  seed: number;                 // 試合全体のシード（必須）
  sideA: SideConfig;
  sideB: SideConfig;
  firstSide?: Side;             // デフォルト 'A'
  maxTurns?: number;            // デフォルト 50。超過したらベースHPの高い方の勝ち
  collectFinalState?: boolean;  // デフォルト false（メモリ節約）
  collectLog?: boolean;         // デフォルト false
  collectActionTrace?: boolean; // デフォルト false（解析用、AIActionの全履歴）
}

export interface MatchStats {
  summonsA: number;
  summonsB: number;
  skillUsesA: number;
  skillUsesB: number;
  totalAttacksA: number;
  totalAttacksB: number;
  damageDealtToBaseA: number;   // A が B のベースに与えたダメージ
  damageDealtToBaseB: number;
  unitsKilledA: number;         // A が倒した B の駒数
  unitsKilledB: number;
}

export interface MatchResult {
  matchId: string;              // uuid
  seed: number;
  config: MatchConfig;
  winner: Side | 'draw';
  endReason: 'base_hp_zero' | 'max_turns' | 'no_legal_action';
  turns: number;
  durationMs: number;
  finalBaseHpA: number;
  finalBaseHpB: number;
  stats: MatchStats;
  finalState?: GameSession;     // collectFinalState=true のとき
  log?: string[];               // collectLog=true のとき
  actionTrace?: { side: Side; turn: number; action: AIAction }[];  // collectActionTrace=true
}
```

### 5.2 runMatch（1試合実行）

`src/lib/game/sim/runMatch.ts`：

```ts
export function runMatch(config: MatchConfig): MatchResult;
```

実装要件：

1. `config.seed` から `createRng` で乱数源を作る
2. デッキを乱数源でシャッフルし、初期手札（INITIAL_HAND_SIZE 枚）を配る
3. 初期 `GameSession` を構築（`firstSide` から先攻決定）
4. ループ：
   - 現在の手番側（A or B）に対応する `BattleAIProfile` を取得
   - `runAITurn(state, profile, { owner, rng, debug: false, onUpdate: undefined })` を呼ぶ
   - 終了判定：
     - 勝者確定 → 'base_hp_zero'
     - turns > maxTurns → 'max_turns'（ベースHPの高い方の勝ち、同点なら 'draw'）
     - **進行膠着検知**：3ターン連続で双方とも盤面が変化していない（ユニット破壊もダメージもない）→ 'no_legal_action'
   - ターン交代
5. `MatchStats` を集計して `MatchResult` を返す

#### Side ⇔ player/ai のマッピング

`GameSession` の `currentTurn` と `player`/`ai` フィールドは既存仕様を維持する。`Side` は外側の概念で、`A → player`, `B → ai` のように決め打ちで紐付けるシンプル方式を採る（`firstSide` を変えたい場合は内部的に `currentTurn` と先攻フラグを切り替える）。

#### 統計の収集方法

`MatchStats` は `runAITurn` の前後で `GameSession.log` を diff 解析するのではなく、**`applyAction` を薄くラップした `applyActionWithStats` を用意**して、各 AIAction 種別ごとに stats をインクリメントする方式を推奨する。これは R6 専用の薄いレイヤーで実現できる。

### 5.3 runBatch（N回試行）

`src/lib/game/sim/runBatch.ts`：

```ts
export interface BatchConfig {
  baseConfig: Omit<MatchConfig, 'seed'>;
  count: number;                          // 試合数
  seedStrategy: 'incremental' | 'random'; // デフォルト 'incremental'
  baseSeed?: number;                      // デフォルト Date.now()
  onProgress?: (done: number, total: number) => void;
}

export interface BatchResult {
  config: BatchConfig;
  matches: MatchResult[];                  // collectFinalState 等は baseConfig に従う
  summary: BatchSummary;
}

export interface BatchSummary {
  totalMatches: number;
  winsA: number;
  winsB: number;
  draws: number;
  winRateA: number;                        // wins / total
  winRateB: number;
  drawRate: number;
  avgTurns: number;
  medianTurns: number;
  p95Turns: number;
  avgDurationMs: number;
  totalDurationMs: number;
  avgFinalBaseHpDiff: number;              // (finalBaseHpA - finalBaseHpB) の平均
  avgStats: MatchStats;                    // 各統計値の平均
}

export function runBatch(config: BatchConfig): BatchResult;
```

`seedStrategy='incremental'` のとき、各試合の seed は `baseSeed + i`。`'random'` のとき `Math.random() * 2^31` を都度生成（再現性を捨てる代わりに乱数偏りを避ける）。

`MatchResult` の `finalState` / `log` / `actionTrace` はメモリ消費が大きいので、`baseConfig.collectFinalState` 等が false の場合は保持しない。10000試合でも合計メモリ < 数百 MB に収まるはず。

### 5.4 runMatrix（マトリクス対戦）

`src/lib/game/sim/runMatrix.ts`：

```ts
export interface MatrixAxis {
  label: string;
  cells: { id: string; sideConfig: Omit<SideConfig, 'baseHp'> & { baseHp?: number } }[];
}

export interface MatrixConfig {
  axisA: MatrixAxis;
  axisB: MatrixAxis;
  countPerCell: number;
  baseSeed?: number;
  defaultBaseHp?: number;          // axis 側で指定なければこれ
  firstSide?: Side;
  maxTurns?: number;
  onProgress?: (done: number, total: number) => void;
}

export interface MatrixResult {
  config: MatrixConfig;
  cells: Record<string, BatchSummary>;     // key: "axisA.id__axisB.id"
  generatedAt: string;
  totalDurationMs: number;
}

export function runMatrix(config: MatrixConfig): MatrixResult;
```

`axisA.cells.length × axisB.cells.length × countPerCell` 試合を実行する。各セルの `BatchSummary` のみ保持する（`MatchResult` 配列は保持しない、メモリ節約）。

#### よく使う2軸

- **軸 = AIプロファイル**：`tutorial_scripted` / `easy_balanced` / `normal_balanced` / `hard_balanced`
- **軸 = アーキタイプ別デッキ**：`sei_1`〜`kou_5`（30デッキ）

両方を組み合わせて「AIプロファイル × AIプロファイル」「デッキ × デッキ」「AI×デッキ（クロス）」の3パターンが代表的なユースケース。

### 5.5 Reporter（出力）

`src/lib/game/sim/reporter/` 配下：

```
reporter/
├── markdown.ts    Markdown レポート（人間向け、勝率テーブル + 外れ値ハイライト）
├── json.ts        全データを JSON で保存（後処理用）
└── csv.ts         勝率テーブルを CSV で出力（スプレッドシート連携用）
```

```ts
export function reportMarkdown(result: MatrixResult | BatchResult, opts?: { title?: string }): string;
export function reportJson(result: MatrixResult | BatchResult): string;
export function reportCsv(result: MatrixResult): string;
```

#### Markdown レポートの構造

```markdown
# Battle Sim Report: <title>

Generated: 2026-05-10 22:14:33
Total matches: 10000
Total duration: 4m 12s

## Configuration
- AI A axis: profiles
- AI B axis: profiles
- Decks: standard 30 (sei_1..kou_5)
- Matches per cell: 100
- Base seed: 42

## Win Rate Matrix (A wins %)

|         | sei_1 | sei_2 | ...   | kou_5 |
|---------|-------|-------|-------|-------|
| sei_1   | 50.0% | 48.0% | ...   | 32.0% |
| sei_2   | 51.0% | 50.0% | ...   | 35.0% |
| ...     |       |       |       |       |

## Average Turns Matrix
（同形式）

## Outliers (winRate ≤ 30% or ≥ 70%)

- mei_3 vs en_5 (100 matches): A win rate = 22.0% (en_5 too strong against mei_3)
- shin_4 vs kou_2 (100 matches): A win rate = 78.0% (shin_4 too strong against kou_2)

## Top 5 strongest decks (avg win rate as A across all B cells)
1. en_5: 68.4%
2. kou_5: 65.1%
...

## Bottom 5 weakest decks
1. sei_1: 31.2%
...
```

外れ値の閾値（30% / 70%）はオプションで変更可能にする。

### 5.6 CLI エントリ

`scripts/sim.ts` を作成し、`package.json` に以下を追加：

```json
{
  "scripts": {
    "sim": "tsx scripts/sim.ts"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

`tsx` を使うことで TypeScript を直接実行できる。

#### CLI サブコマンド

```bash
# 単一マッチアップを N 回回す
npm run sim match \
  --aiA hard_balanced --aiB easy_balanced \
  --deckA sei_5 --deckB en_3 \
  --n 100 \
  --output docs/sim_reports/match_2026-05-10.md

# マトリクス対戦：プロファイル × プロファイル（全デッキ標準で固定）
npm run sim matrix \
  --axisA profiles --axisB profiles \
  --deck standard \
  --n 200 \
  --output docs/sim_reports/profile_matrix.md

# マトリクス対戦：デッキ × デッキ（プロファイル固定）
npm run sim matrix \
  --axisA decks --axisB decks \
  --aiA normal_balanced --aiB normal_balanced \
  --n 100 \
  --output docs/sim_reports/deck_balance.md

# プリセット実行
npm run sim preset balance_all
```

#### CLI オプション

| オプション | 説明 |
|---|---|
| `--aiA` / `--aiB` | プロファイル ID |
| `--deckA` / `--deckB` | デッキ ID（`sei_1` など）または `random` / `standard` |
| `--axisA` / `--axisB` | `profiles` / `decks` / `archetypes` |
| `--n` | 試合数（マトリクスならセルごと） |
| `--seed` | 基準シード（未指定なら時刻） |
| `--maxTurns` | 最大ターン数（デフォルト 50） |
| `--output` | 出力先パス（拡張子から形式を推測：.md/.json/.csv） |
| `--verbose` | 個別試合の log と actionTrace を保存 |
| `--quiet` | 進捗表示を抑制 |

CLI 引数のパースは `process.argv` 直接でも `minimist` でも好み。`commander` は重いので避ける。

### 5.7 プリセット

`scripts/presets/` に頻出シナリオをプリセットとして用意：

```
scripts/presets/
├── balance_all.ts          全プロファイル × 全デッキの大規模マトリクス（30分級）
├── deck_balance.ts         normal_balanced ミラー × 30デッキ総当たり（5分級）
├── profile_compare.ts      4プロファイル総当たり × 標準デッキ（1分級）
└── smoke.ts                4プロファイル × 4デッキ × 5試合（数十秒）
```

各プリセットは `MatrixConfig` を組み立てて `runMatrix → reportMarkdown → ファイル保存` を行うだけのファイル。`scripts/sim.ts` の `preset` サブコマンドから呼び出す。

### 5.8 出力先と gitignore

- 出力先：`docs/sim_reports/`（既に gitignore 済みであることを確認）
- ファイル名規約：`{preset_name}_{YYYY-MM-DD}.{md|json|csv}`
- 大規模 JSON はリポジトリにコミットしない（gitignore）
- 重要な計測結果は要約だけ Markdown でリポジトリ内別ディレクトリ（`docs/balance_notes/` など）に手動で残す

### 5.9 並列実行（オプション、初期実装は単一スレッド）

初期実装は単一スレッドで OK。性能目標を満たさない場合に `worker_threads` ベースの並列実行を追加する：

- `runMatrix` に `parallelism?: number` を追加（デフォルト 1）
- 各 worker がセル単位（または batch 単位）を担当
- worker の起動コストを考えると、セルあたり試合数 < 50 なら並列化のメリットが薄い
- 実装は `src/lib/game/sim/parallel/` に分離

これは Phase が後ろなので、本要件では「並列化できる構造を維持する」ことだけ確認する：

- `runMatch` / `runBatch` がどこからもグローバル可変状態に依存しない（純関数）
- `BattleAIProfile` レジストリは worker でも同じ初期化が走るので問題ない（モジュール副作用 import）

### 5.10 進行膠着検知

AI 同士が射程外でにらみ合って永遠に終わらないケース対策：

- `MatchConfig.maxTurns`（デフォルト 50）で必ず打ち切る
- さらに、3ターン連続で「双方とも盤面状態に変化なし（ユニット数・位置・HP が同じ）」なら強制終了 → `endReason: 'no_legal_action'`、ベースHP の高い方の勝ち、同点なら 'draw'
- バトル設計上、4×4 で max 50ターンに到達するのは異常事態。レポートで該当試合数を集計し、警告として出力する

## 6. ファイル構造（新規追加）

```
src/lib/game/sim/
├── index.ts                      runMatch, runBatch, runMatrix, reporter を re-export
├── types.ts                      MatchConfig, MatchResult, BatchConfig/Result, MatrixConfig/Result
├── runMatch.ts                   1試合実行
├── runBatch.ts                   N回繰り返し集計
├── runMatrix.ts                  マトリクス対戦
├── stats.ts                      MatchStats 計算と applyActionWithStats
├── stagnation.ts                 進行膠着検知
└── reporter/
    ├── index.ts
    ├── markdown.ts
    ├── json.ts
    └── csv.ts

scripts/
├── sim.ts                        CLI エントリ（tsx で実行）
└── presets/
    ├── balance_all.ts
    ├── deck_balance.ts
    ├── profile_compare.ts
    └── smoke.ts

docs/
└── sim_reports/                  出力先（gitignore）
```

## 7. 性能目標

| シナリオ | 目標時間 |
|---|---|
| 1試合 depth=1 同士 | < 100ms |
| 1試合 depth=2 同士 | < 300ms |
| 1試合 depth=2 vs depth=1 | < 200ms |
| smoke プリセット（4プロファイル × 4デッキ × 5試合 = 80試合） | < 30秒 |
| profile_compare（4プロファイル総当たり × 100試合 = 1,600試合） | < 5分 |
| deck_balance（30デッキ総当たり × 100試合 = 90,000試合） | < 30分（並列化前提なら可） |

単一スレッド版で deck_balance が制限時間を大きく超える場合（例：60分超）、並列化を必須化する。

## 8. 実装フェーズ

| Phase | 内容 | 想定工数 |
|---|---|---|
| P1 | 事前確認：4. の各項目を grep / 動作確認。デッキシャッフルのシード化が漏れていれば修正 | 0.5日 |
| P2 | `types.ts` 定義、`stats.ts`（MatchStats と applyActionWithStats）、`stagnation.ts` 実装 | 0.5日 |
| P3 | `runMatch.ts` 実装。手動テストで5試合ほど動作確認 | 0.5日 |
| P4 | `runBatch.ts` 実装と統計集計（avg/median/p95） | 0.5日 |
| P5 | `runMatrix.ts` 実装 | 0.5日 |
| P6 | Markdown / JSON / CSV reporter 実装 | 0.5日 |
| P7 | CLI エントリ `scripts/sim.ts` 実装と `tsx` 導入 | 0.5日 |
| P8 | 4つのプリセット実装と smoke 実行 | 0.5日 |
| P9 | （条件付き）並列化 worker_threads。性能目標未達なら実施 | 1日 |

合計：通常 4日、並列化込みで 5日。

## 9. 受け入れ基準

- [ ] `npm run sim preset smoke` が 30秒以内に完了し、Markdown レポートが `docs/sim_reports/smoke_*.md` に出力される
- [ ] `npm run sim preset profile_compare` が 5分以内に完了する
- [ ] 同じ `--seed` で実行した `npm run sim match` の結果が完全一致する（決定論性）
- [ ] `runMatch` の単体テスト：4プロファイルの全組み合わせで「指定 maxTurns 内に必ず終了する」「`finalBaseHpA + finalBaseHpB > 0` のときは勝敗が確定している」
- [ ] Markdown レポートに勝率行列・Outliers セクション・Top/Bottom 5 デッキが正しく出力される
- [ ] `tutorial_scripted` 同士の対戦が、最大ターンに達する前に終わる（バランス検証ではなく動作確認）
- [ ] `applyAction` への参照を維持し、stats 集計のために既存ロジックを書き換えていない（薄いラッパーで実現）
- [ ] `scripts/sim.ts` 実行時に AI レジストリ・スキルレジストリ等の副作用 import が正しく走る
- [ ] `npm run build` に影響を与えない（`scripts/` 配下は本番ビルド対象外）

## 10. 残課題（将来）

- **並列実行の標準化**：`worker_threads` で線形スケール。Phase 9 で必要に応じて
- **CI 統合**：GitHub Actions ナイトリーで profile_compare プリセット実行 → 過去レポートとの diff を artifact 保存
- **/dev/sim Web UI**：開発者がブラウザから simulate を叩けるページ。ただし CLI で十分なら作らない
- **対戦リプレイ機能**：`MatchResult.actionTrace` を `GameSession` 上で巻き戻し再生する UI。バランス検証で異常試合を可視化したいときに必要
- **AI vs プレイヤー実機ログ収集**：本番で実プレイヤーが対戦したログを `MatchResult` 互換形式で取得し、シミュレーション勝率と実プレイヤー勝率を比較してギャップを発見する仕組み
- **遺伝的アルゴリズム的なデッキ最適化**：`runMatrix` の勝率を fitness にして、ランダム生成デッキを進化させる evolutionary search

## 11. Claude Code への作業依頼ポイント

実装に着手するときの注意：

- **Phase 1 の事前確認を必ず最初に**実施する。R5 の実装内容によっては、デッキシャッフルや初期手札のシード化が漏れているケースがあり、これを直さずに進めると `--seed` の決定論性が破綻する
- `runMatch` 内では `runAITurn` を可能な限りそのまま使う。stats 収集のために `applyAction` を直接書き換えるのは避け、`applyActionWithStats` でラップする
- 初期実装は**単一スレッド・単一プロセス**で完結させる。並列化は性能測定を見てから判断
- レポート出力は将来差し替えやすいよう、`MatrixResult` を入力に取る純関数として分離する
- CLI 引数のパースは process.argv 直接 or minimist で。重い CLI フレームワークは導入しない
- `scripts/` 配下を `tsconfig.json` の include に加えるか、scripts 専用の `tsconfig.scripts.json` を別途作るかは、ビルド設定への影響を最小化する方を選ぶ。`tsx` は ts ファイルをそのまま走らせるので、include に加えなくても実行できるはず

---

**本書バージョン**: v1.0  
**作成日**: 2026-05-09  
**前提**: R1〜R5 完了（cardsmith ai_battle_requirements.md v1.0）  
**スコープ**: cardsmith バトル AI R6（自動対戦ハーネス）