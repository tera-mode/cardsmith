# cardsmith バランス調整テスト 要件書（汎用フレームワーク）

## 1. 背景

R6 の自動対戦ハーネスにより 750試合/2秒（≒ 0.4試合/ms）の高速対戦が可能になった。これを活用し、cardsmith のバランス調整を「**測定 → 仮説 → 調整 → 再測定**」の PDCA で回す。

本書は今回1回だけのバランス調整ではなく、**今後何度でも同じプロセスを再実行できる運用フレームワーク**として整備する。具体的な測定値や調整内容は実行のたびに変わるが、フレームワーク（テストスイート構成・調整レバーの優先順位・スナップショット形式・PDCA運用）は固定する。

## 2. ゴール

- 4種類の標準テストスイートをコマンド一発で実行できる
- 実行結果はスナップショットとして `docs/balance/snapshots/<timestamp>/` に保存される
- 任意の2スナップショット間で Before/After 比較レポートを生成できる
- 調整レバーが優先順位付きで定義されており、Claude Code はライトな調整から順に試す
- ゲームルール変更時は影響範囲チェックリストに従って AI・UI・テストを同時更新する
- PDCA サイクルの意思決定が `docs/balance/notes/` に蓄積される

## 3. 調整レバーの優先順位

バランス調整は以下のレイヤーで段階的に行う。**L0 から順に試し、目標に届かない場合のみ次レベルへ進む**。

| Level | 名称 | 内容 | 承認 |
|---|---|---|---|
| L0 | 環境調整 | ステージごとの敵 `baseHp`、`enemyAIProfileId`（既存4プロファイル内で変更）、敵デッキ構成（既存カードの組み合わせ変更） | 不要 |
| L1 | 数値調整 | 既存ユニットの HP / ATK / コスト、既存スキルの数値（ダメージ量・回復量・使用回数） | 不要 |
| L2 | メカニクス調整 | スキルの効果範囲・発動条件・対象指定ロジック | 不要 |
| L3 | 拡張 | 新規ユニット追加、新規スキル追加、新規 AIプロファイル / Tactic 追加 | 不要 |
| L4 | ルール変更 | ターン構造、先攻後攻補正、盤面サイズ、召喚ルール、ベースHP判定、ターン制限 | **必須** |

### カスケード方針

- L0 で目標達成できるならそこで止める（最小侵襲）
- L1〜L3 を試す順は、目標とのギャップが大きいほど高 Level を選んでよい
- L4 は最後の手段。ただし「先攻後攻バランス」は構造的に L4 でしか解決できないため、初期段階で承認を取って L4 に踏み込む
- 同じ調整サイクル内で L1 と L3 を混在させてもよい（例：既存ユニット弱体化 + 新規対抗ユニット追加）
- L4 を実施した場合、**全テストスイートのスナップショットを再取得**する（過去比較が無効化される）

### 各 Level での Claude Code 自動実行範囲

- L0〜L3：仮説立案・実装・再テストまで自律実行可。ただし1サイクルごとに `docs/balance/notes/` に意思決定ログを残す
- L4：仮説立案までは自律。承認を待ってから実装に着手

## 4. 標準テストスイート

すべて `npm run sim suite <name>` で実行できるようにする。

### 4.1 Progression Curve（進行カーブテスト）

**目的**：プレイヤーがクエストを順にクリアしていくときの勝率カーブを測定し、序盤は勝てて終盤は適度に難しい体験になっているかを検証する。

**手法**：

- ステージ N の敵と「ステージ N より一段階前のプレイヤーデッキ（ペルソナ）」を対戦させる
- ペルソナデッキは `src/lib/game/sim/decks/personas/` に定義
- 各ステージ × 500試合
- プレイヤー側 AI は `normal_balanced` 固定（実プレイヤーのスキル中央値を仮定）

**目標カーブ**（数値はチューナブル、初期値）：

| 進行度 | プレイヤーデッキ | 目標勝率 |
|---|---|---|
| 序盤（章1〜2 / stage 1〜2） | 1段階前 | 75〜85% |
| 中盤（章3〜4 / stage 3〜4） | 1段階前 | 50〜65% |
| 終盤（章5+ / stage 5） | 1段階前 | 25〜35% |
| 章ボス | 1段階前 | 20〜30% |

**判定**：各ステージの勝率が目標範囲に収まる。範囲外のステージは "outlier" としてレポートに列挙。

**運用**：ペルソナ定義の更新は明示的なバージョン管理対象とし、変更時は全スナップショットを取り直す。

### 4.2 Element Balance（系統バランステスト）

**目的**：6系統の標準デッキ（単色染め）の総合バランスを検証する。

**手法**：

- 6系統 × 1デッキ = 6デッキの標準単色染めデッキを `decks/monocolor/<element>.ts` に定義
- 全ペア対戦：6 × 6 = 36ペア（同色ミラーは先攻後攻テストへ流用）
- 各セル × 250試合（先攻 A 125 + 先攻 B 125、外乱排除）
- AI は両側 `normal_balanced` 固定

**目標**：

- **総合勝率**：各系統が他5系統に対する平均勝率 = 50% ± 5%
- **対戦相性**：個別ペア勝率は 30〜70% に収まる（極端な相性は許さない）
- **循環構造**：相性は循環していてよい（例：sei → ai → mei → kou → en → shin → sei のような）

**判定**：

- 総合勝率が範囲外の系統 → 該当系統の調整候補
- 個別ペア勝率が範囲外 → 該当ペアの片側を調整候補

### 4.3 Turn Order（先攻後攻テスト）

**目的**：先攻後攻の有利不利を測定し、必要なルール調整を検証する。

**手法**：

- 同一デッキでのミラー対戦
- 6系統 × 単色ミラー × 500試合 = 3,000試合
- AI は両側 `normal_balanced` 固定

**目標**：

- 先攻勝率 = 48〜52%（5割誤差 ±2%）
- 6系統すべてで範囲内に収まる

**ルール変更候補**（L4、要承認）：

- 後攻のみ初期手札 +1
- 後攻のみ初期 baseHp +1
- 先攻1ターン目の制約（直接攻撃不可、召喚位置制限など）
- 先攻1ターン目の召喚回数制限
- 後攻ボーナス：使用しなかった召喚権を次ターンに繰り越し

L4 ルール変更を行った後は、**Element Balance / Progression Curve も全実行**して副作用がないか確認する。

### 4.4 Regression（リグレッションテスト）

**目的**：直近の変更が、過去のスナップショットと比較して想定外の方向に動いていないかを検知する。

**手法**：

- 直前のスナップショットと最新スナップショットを diff
- 各セルの勝率変化を ±N% でハイライト
- N の閾値は 5%（重要セル）/ 10%（一般セル）

**判定**：

- 「想定通りの方向で動いた」セル：意図した調整。OK
- 「想定外の方向 or 過剰に動いた」セル：副作用。要再調整
- 想定外セルがゼロになるまで PDCA を継続

## 5. 効率化ツール

### 5.1 デッキライブラリ

`src/lib/game/sim/decks/`：

```ts
export interface DeckTemplate {
  id: string;
  category: 'monocolor' | 'archetype' | 'persona' | 'quest_enemy' | 'custom';
  element?: ElementType;
  description: string;
  cards: string[];                  // カードID配列（10枚）
  meta?: { stage?: string; version?: string };
}

export function registerDeck(t: DeckTemplate): void;
export function getDeck(id: string): Card[];
export function listDecks(filter?: { category?: string; element?: ElementType }): DeckTemplate[];
```

ファイル構成：

```
src/lib/game/sim/decks/
├── index.ts                  全デッキを registerDeck で登録
├── library.ts                registry の実装
├── monocolor/                単色染めデッキ（系統バランス用）
│   ├── sei.ts
│   ├── ai.ts
│   ├── mei.ts
│   ├── kou.ts
│   ├── en.ts
│   └── shin.ts
├── archetype/                戦略アーキタイプ（aggro / control / midrange など）
├── personas/                 進行カーブ用プレイヤーデッキ
│   ├── persona_sei_1.ts
│   ├── persona_sei_2.ts
│   └── ...
└── quest_enemy/              既存30クエストの敵デッキを移植
```

### 5.2 ペルソナデッキの定義原則

進行カーブテストの再現性を保つため、ペルソナデッキは以下の原則で定義：

1. **入手可能性**：ステージ N までで入手可能なカードのみで構成
2. **典型性**：実際のプレイヤーが選びそうなアーキタイプを優先（最強構築ではなく中央値）
3. **バージョン管理**：`persona_sei_2` のような ID は「バージョン」を持ち、ペルソナ自体を更新したらバージョンを上げる（`persona_sei_2_v2`）。比較時は同一バージョン同士で比較する
4. **ドキュメント**：各ペルソナは `description` フィールドに「想定される入手経路」「採用思想」を明記する

### 5.3 ターゲット定義

`src/lib/game/sim/targets/`：

```ts
export interface BalanceTarget {
  id: string;
  description: string;
  metric: (snapshot: SuiteSnapshot) => number;     // 抽出関数
  goal: { min: number; max: number };
  severity: 'critical' | 'warning' | 'info';
}
```

例：

```ts
{
  id: 'progression_chapter1_stage1',
  description: '章1ステージ1：序盤体験',
  metric: s => s.cells['persona_sei_0__quest_sei_1'].winRateA,
  goal: { min: 75, max: 85 },
  severity: 'critical',
}
```

ターゲット定義ファイルは `targets/progression.ts` / `targets/element.ts` / `targets/turn_order.ts` に分割。

### 5.4 スナップショット

実行ごとに以下を保存：

```
docs/balance/snapshots/<timestamp>_<label>/
├── manifest.json             # git commit, timestamp, suite version, deck library version
├── progression.json          # 4.1 の生データ
├── element_balance.json      # 4.2 の生データ
├── turn_order.json           # 4.3 の生データ
├── targets_evaluation.json   # ターゲット達成状況
└── report.md                 # 人間向け要約
```

`manifest.json` の例：

```json
{
  "timestamp": "2026-05-10T14:23:45Z",
  "label": "baseline",
  "gitCommit": "abc1234",
  "suiteVersion": "1.0",
  "deckLibraryVersion": "1.2",
  "totalMatches": 12000,
  "durationSec": 16,
  "notes": "初回ベースライン取得"
}
```

スナップショットは Git にコミットせず gitignore する。重要なものは `docs/balance/milestones/` に手動でコピーして長期保存する。

### 5.5 比較レポート

```ts
export function compareSnapshots(beforeDir: string, afterDir: string, opts?: {
  threshold?: number;          // 重要差分の閾値（デフォルト 5）
}): ComparisonReport;
```

出力 Markdown 例：

```markdown
# Comparison Report: baseline → after_sei_atk_buff

Generated: 2026-05-10 18:30
Before: 2026-05-10_baseline (commit abc1234)
After:  2026-05-10_after_sei_atk_buff (commit def5678)

## Summary
- Total cells: 234
- Improved (target達成セルが増えた): 12
- Regressed (target達成セルが減った): 3
- Unchanged: 219

## Notable Changes (|Δ| ≥ 5%)

### Improved
| Cell | Before | After | Δ | Target | Status |
|---|---|---|---|---|---|
| sei vs ai | 38.0% | 47.5% | +9.5 | 50±5 | ❌→✅ |
| persona_sei_1 vs quest_sei_2 | 65.0% | 78.0% | +13.0 | 75±5 | ❌→✅ |

### Regressed
| Cell | Before | After | Δ | Target | Status |
|---|---|---|---|---|---|
| sei vs kou | 72.0% | 81.0% | +9.0 | 50±5 | ❌→❌(悪化) |

## Target Achievement Rate
- Critical targets: 18/24 (75%) [+3 from baseline]
- Warning targets: 42/55 (76%) [+5]
- Info targets: 88/95 (93%) [+1]
```

### 5.6 CLI 拡張

```bash
# 標準スイート実行
npm run sim suite progression           # 4.1
npm run sim suite element               # 4.2
npm run sim suite turn_order            # 4.3
npm run sim suite all                   # 4.1+4.2+4.3 を並列実行

# スナップショット保存つき
npm run sim suite all --label baseline

# 比較
npm run sim compare \
  --before docs/balance/snapshots/2026-05-10_baseline \
  --after docs/balance/snapshots/2026-05-11_after_buff \
  --output docs/balance/notes/comparison_2026-05-11.md

# ターゲット達成状況のみ
npm run sim evaluate --snapshot docs/balance/snapshots/latest

# デッキライブラリ確認
npm run sim decks list --category monocolor
npm run sim decks show sei_aggro_v1

# クイック実行（小サンプルで実装の動作確認）
npm run sim suite all --quick           # 各セル50試合のみ
```

## 6. PDCA サイクル運用

### 6.1 1サイクルの流れ

```
[Plan]  仮説立案
   ↓
[Do]    実装（L0〜L3 は自律、L4 は承認待ち）
   ↓
[Check] スナップショット取得 + 比較レポート生成
   ↓
[Act]   ノート記録 + 次サイクルの方針決定
```

### 6.2 ノート記録形式

`docs/balance/notes/<YYYY-MM-DD>_<topic>.md`：

```markdown
# 2026-05-11 sei系統の弱体化対応

## Plan（仮説）
- 系統バランステストで sei 総合勝率 = 38%（目標 50±5）
- 原因仮説：sei_alicia の ATK が他系統エースより低い
- 調整案：sei_alicia ATK 4 → 5（L1）

## Do（実装）
- src/lib/data/cards/sei.ts の sei_alicia.atk を 5 に変更
- commit: abc1234

## Check（測定）
- baseline: docs/balance/snapshots/2026-05-10_baseline
- after:    docs/balance/snapshots/2026-05-11_sei_atk_buff
- 比較レポート: docs/balance/notes/comparison_2026-05-11.md
- 結果：
  - sei 総合勝率 38% → 47%（改善、目標未達）
  - sei vs kou 72% → 81%（悪化、目標範囲外）

## Act（次の方針）
- sei_alicia は維持
- sei vs kou の対策として kou 側に何らかの対 sei カードを追加するか、
  sei の他のカードを微弱体化するか
- 次サイクル：kou 系統に「魔法ダメージ軽減」スキル持ちを1枚追加（L3）
```

### 6.3 サイクル終了条件

以下のすべてを満たしたらバランス調整を完了とする：

- Critical ターゲット達成率 ≥ 90%
- Warning ターゲット達成率 ≥ 80%
- 直近2サイクルで重要 regression がない
- 主要シナリオ（Progression / Element / Turn Order）すべてで概ね目標達成

未達成のまま終了する場合は、未達ターゲットを `docs/balance/known_issues.md` に明示し、優先度と次回着手予定を記録する。

### 6.4 1サイクルあたりの想定時間

- スナップショット取得：1〜2分（全スイート、各セル500試合）
- 比較レポート：< 1秒
- 実装作業：レバーレベルによる（L0 数分、L1 数十分、L3 数時間、L4 半日〜）

PDCA を高速に回すため、**実装作業時間が長くなる L3 / L4 では、その仮説の効果サイズを事前に小サンプル（50試合）で見積もってから本実装に入る**ことを推奨する。

## 7. ゲームルール変更時の影響範囲チェックリスト

L4 ルール変更を行うときは、以下の全項目を確認する。チェックリストは `docs/balance/rule_change_checklist.md` として整備し、ルール変更ごとに新しいチェックリストインスタンスを作る。

### 影響範囲

- [ ] **ルール定義**：`src/lib/game/rules.ts`、関連定数
- [ ] **AI 行動列挙**：`src/lib/game/ai/search/enumerate.ts`（新ルールで合法手が変わるか）
- [ ] **AI 評価関数**：`src/lib/game/ai/evaluator.ts`（threat 計算等が変わるか）
- [ ] **AI 戦術**：`src/lib/game/ai/tactics/balanced.ts`（prefilter 基準が変わるか）
- [ ] **AI シミュレーション**：`src/lib/game/sim/runMatch.ts`（ターン処理ループが変わるか）
- [ ] **Stats 集計**：`src/lib/game/sim/stats.ts`（新指標が必要か）
- [ ] **GameContext**：`src/contexts/GameContext.tsx`（プレイヤー操作との整合）
- [ ] **UI コンポーネント**：盤面表示・手札表示・ベースHP表示
- [ ] **チュートリアル**：新ルールの説明スクリーン追加
- [ ] **Playwright E2E**：既存テストが通るか
- [ ] **既存スナップショット**：再取得が必要（旧ルール下のデータは無効化）
- [ ] **デッキライブラリ**：新ルールで戦略が変わるカードがないか
- [ ] **AI プロファイル定義**：重みが新ルールに適しているか

### 推奨手順

1. ルール変更案を `docs/balance/notes/<date>_<rule_change>.md` に記述（ユーザー承認）
2. ルール定義変更（`rules.ts`）
3. AI レイヤー全体を見直し、必要箇所を更新
4. シミュレーター動作確認（smoke プリセット）
5. UI 更新
6. Playwright E2E 修正
7. 全スイート実行 → 新しいベースライン取得
8. ターゲット定義の見直し（新ルール下で過去ターゲット値が妥当か）

## 8. ファイル構造（追加分）

```
src/lib/game/sim/
├── decks/                                # 5.1
│   ├── index.ts
│   ├── library.ts
│   ├── monocolor/
│   ├── archetype/
│   ├── personas/
│   └── quest_enemy/
├── targets/                              # 5.3
│   ├── index.ts
│   ├── progression.ts
│   ├── element.ts
│   └── turn_order.ts
├── suites/                               # 4.x
│   ├── index.ts
│   ├── progression.ts
│   ├── element.ts
│   ├── turn_order.ts
│   └── all.ts
├── snapshot/                             # 5.4
│   ├── save.ts
│   ├── load.ts
│   └── manifest.ts
└── compare/                              # 5.5
    ├── compare.ts
    └── reportMarkdown.ts

scripts/
├── sim.ts                                # 既存。サブコマンド拡張
└── balance/
    ├── run_suite.ts
    ├── run_compare.ts
    └── run_evaluate.ts

docs/balance/
├── snapshots/                            # gitignore（量が多い）
│   └── <timestamp>_<label>/
├── milestones/                           # 重要な節目を手動コピー
│   └── 2026-05-10_v1_baseline/
├── notes/                                # PDCAサイクルログ
│   └── <date>_<topic>.md
├── rule_change_checklist.md              # 7. のテンプレート
└── known_issues.md                       # 終了時の未達ターゲット
```

## 9. 統計的信頼性の指針

750試合/2秒の性能を活用し、以下のサンプル数を標準とする：

| シナリオ | 標準サンプル数 | 信頼区間（勝率 ±%） |
|---|---|---|
| 個別セル（探索的） | 100 | ±5 |
| 個別セル（標準） | 250 | ±3 |
| 個別セル（精査） | 1,000 | ±1.5 |
| ターゲット判定 | 500 | ±2 |
| Quick mode（動作確認） | 50 | ±7 |

ターゲット判定は ±2% の誤差で判定するため、500試合/セルが標準。これは Element Balance 18ペアで合計 9,000試合 ≒ 12秒、Progression 30ステージで 15,000試合 ≒ 20秒、Turn Order 6デッキで 3,000試合 ≒ 4秒。**全スイート合計でも1分以内**で完了する。

外れ値検出のため、各セルで以下も併せて記録する：

- 勝率の標準偏差（500試合を50試合×10バッチに分けて算出）
- 平均ターン数の中央値・p95
- ベースHP差の分布

## 10. 実装フェーズ

| Phase | 内容 | 想定工数 |
|---|---|---|
| P1 | デッキライブラリ実装（既存30クエスト敵デッキ + 6系統単色染め + ペルソナ初版） | 1日 |
| P2 | ターゲット定義（progression / element / turn_order の3ファイル） | 0.5日 |
| P3 | 4テストスイート実装（共通ランナー + 各 suite ファイル） | 1日 |
| P4 | スナップショット保存・読み込み実装 | 0.5日 |
| P5 | 比較レポート実装（Markdown 出力） | 0.5日 |
| P6 | CLI サブコマンド拡張（`suite` / `compare` / `evaluate` / `decks`） | 0.5日 |
| P7 | 初回ベースライン取得 + 結果分析 + ノート記録 | 0.5日 |
| P8 | （実調整サイクル開始）PDCA第1ループ：Element Balance 調整 | 1日 |
| P9 | PDCA第2ループ：Turn Order 調整（L4 含む可能性） | 1〜2日 |
| P10 | PDCA第3ループ：Progression Curve 調整 | 1日〜 |

P1〜P7 が運用基盤の整備（4日）。P8 以降は実調整サイクルで、目標達成までの繰り返し回数で工数が変動。

## 11. 受け入れ基準（運用基盤側）

- [ ] `npm run sim suite all --quick` が30秒以内に完了する
- [ ] `npm run sim suite all` が3分以内に完了する
- [ ] スナップショットが `docs/balance/snapshots/<timestamp>_<label>/` に5ファイル（manifest + 3データ + report）で保存される
- [ ] `npm run sim compare` で2スナップショット間の差分 Markdown が生成される
- [ ] デッキライブラリに 6系統 × 1単色染め + 30クエスト敵 + 章ごとのペルソナ各1〜2 が登録されている
- [ ] ターゲット定義が3ファイルで合計 50項目以上（critical / warning / info の混在）
- [ ] ルール変更チェックリストが `docs/balance/rule_change_checklist.md` に存在する
- [ ] `quick` モードと標準モードがオプションで切り替えられる
- [ ] 同じシードで2回実行した結果が完全一致する（決定論性、R6 の確認）
- [ ] gitignore が適切に設定されている（snapshots は ignore、milestones と notes はコミット対象）

## 12. 残課題（将来）

- **多デッキ × 多AIプロファイル の総当たり**：今は AI を `normal_balanced` 固定にしているが、将来は AI プロファイル軸も含めた3次元マトリクスが取りたい
- **デッキ進化（GA）**：runMatrix の勝率を fitness に、ランダム生成デッキを進化させて「上限性能」を測る。バランス上の天井を発見できる
- **チュートリアル AI ペルソナ**：チュートリアル時の演出が伝わるか、特定の AI 動作を意図的に組み込めるかの検証
- **実プレイヤーログとの照合**：プレイテストで集めた実プレイヤーの操作ログを「ペルソナ AI」として再現し、シミュレーション勝率と実プレイヤー勝率のギャップを発見する
- **ストーリーモード以外のバランス**：ランダムモード・カスタマイズモードでも同様のフレームワークを適用

## 13. Claude Code への作業依頼ポイント

- **Phase の順序を守る**：P1（デッキライブラリ）が最重要。これがないと他のスイートが書けない
- **ペルソナデッキの初版は最小限でよい**：各章 stage 1 直後とボス直後の 2 ペルソナ × 6章 = 12ペルソナ程度から始める
- **既存30クエストの敵デッキは `quest_enemy/` 以下に移植する**：既存のデッキ定義をそのまま再利用できるよう薄いアダプタを書く
- **ターゲット数値は本書の値を初期値として採用**：実測後にユーザーと相談して調整する
- **L4 ルール変更を提案する場合は事前承認**：仮説と影響範囲チェックリストを `docs/balance/notes/` に書いてから着手
- **L0〜L3 の調整は自律実行**：1サイクルごとに必ずノート記録を残す。ノートなしの commit はしない
- **PDCA 第1ループは Element Balance から開始**を推奨：Turn Order より影響範囲が小さく、6系統という明確な対象があるため成功体験を得やすい
- **比較レポートの「想定外 regression」は止めて報告**：小さな regression は許容するが、Critical ターゲットの悪化は AI 自律で進めず Plan 段階に戻る

---

**本書バージョン**: v1.0  
**前提**: R1〜R6 完了（750試合/2秒の自動対戦ハーネス稼働中）  
**スコープ**: cardsmith バランス調整 PDCA フレームワーク（汎用・継続運用）

---

## 重要ポイントまとめ

**汎用フレームワークとしての設計**

特定の今回限りの調整内容ではなく、「**測定 → 仮説 → 調整 → 再測定**」のループを今後何度でも回せる運用基盤として書きました。スナップショットとノートが蓄積されることで、半年後に同じプロセスを再実行しても「過去の調整経緯」が追えます。

**調整レバー L0〜L4 の階層化**

「L0 から順に試して、目標未達なら次へ」というカスケード方針を明示。Claude Code が無駄に大改修に走らず、L0 で済むものは L0 で止められます。L4 のみ承認必須で、それ以外は自律実行可。

**先攻後攻問題は L4 不可避と先回り**

ご指摘の通り構造的にルール変更が必要なので、4.3 の Turn Order テストの中に L4 ルール変更候補を5つ列挙しました。最初のサイクルで承認を取ってから L4 に踏み込む流れ。

**「1段階前のデッキ」概念の汎用化**

進行カーブテスト（4.1）で「ステージ N の敵 vs 1段階前のペルソナデッキ」という形で汎用化しました。ペルソナはバージョン管理対象なので、ペルソナを更新するときは明示的に v2 に上げる運用ルールも入れています。

**Regression テスト**

毎サイクルで前回比較を取り、想定外の方向に動いたセルを検知する仕組みを 4.4 に。比較レポート出力の例も具体的に書きました。

**性能を活かした統計設計**

全スイート1分以内で完了する設計（500試合/セル × 18+30+6 ≒ 27,000試合 ≒ 36秒）。Quick mode（50試合/セル）は実装の動作確認用。サンプル数と信頼区間の対応表も入れました。
