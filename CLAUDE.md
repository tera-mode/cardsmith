# ai-tactics — Claude Code 作業ルール

## プロジェクト概要

最強カードを誰でも作れる将棋風タクティクスTCGのMVP実装。6×6盤面でのターン制カード対戦ゲーム。

技術スタック: **Next.js (App Router) + TypeScript + Tailwind CSS + Firebase + Vercel**

---

## 作業ルール

- TypeScript の型エラーはビルド前に必ず解消すること
- 環境変数は `.env.local` で管理。コードにハードコードしない
- セキュアな情報（APIキー等）が公開されないように細心の注意を払うこと
- `docs/` 配下には開発用ドキュメントを設置し、これらは公開しない
- **`git push` は必ずユーザーの明示的な同意を得てから実行する**（commit は自由に行ってよい）
- コミットメッセージは日本語でよい
- プレイテストで出力したファイル（スクリーンショット、レポート等）は `docs/playtest_reports/` に保存し、`.gitignore` に追加してローカルのみで管理する。リポジトリにはプッシュしない

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    ← LP（タイトル画面）
│   ├── login/page.tsx              ← ログイン画面
│   ├── play/page.tsx               ← ゲーム画面
│   ├── result/page.tsx             ← リザルト画面
│   └── history/page.tsx            ← 試合履歴
├── components/
│   ├── game/                       ← ゲームUIコンポーネント
│   ├── auth/                       ← 認証UI（mecraftから流用）
│   └── ui/                         ← 共通UI
├── contexts/
│   ├── AuthContext.tsx             ← mecraftから流用
│   └── GameContext.tsx             ← ゲーム状態管理
└── lib/
    ├── firebase/                   ← mecraftから流用
    ├── game/
    │   ├── cards.ts                ← 13枚カード定義（集中管理）
    │   ├── decks.ts                ← 標準デッキ定義
    │   ├── rules.ts                ← 合法手・戦闘解決ロジック
    │   ├── skills.ts               ← スキル効果実装（抽象化済み）
    │   └── ai.ts                   ← ランダムAI実装
    └── types/game.ts               ← 型定義
docs/
├── requirements.md                 ← 実装要件書
├── playtest_reports/               ← プレイテスト出力（gitignore）
└── screenshots/                    ← 確認用スクリーンショット（gitignore）
```

---

## セキュリティルール

### APIキー・秘匿情報

- Firebase 設定値、Vercel トークン等は必ず `.env.local` に置き、コードに直書きしない
- `.env.local` は `.gitignore` に追加済みであることを常に確認する
- Firestore セキュリティルールでは `request.auth.uid == userId` を必須とする

### Firestore セキュリティルール（厳守）

```
match /users/{userId}/sessions/{sessionId} {
  allow read, write: if request.auth.uid == userId;
}
```

- 匿名認証ユーザーも自分のセッションのみ読み書き可能
- ルールを緩めるプルリクは必ずレビューする

### APIルート保護

- Next.js API ルートは `verifyAuth` ミドルウェアを必ず通すこと
- クライアントサイドに秘密情報を渡さない
- ゲームロジックはサーバーサイドではなくクライアントで完結（将来PvP対応時はサーバー移行）

---

## 画像生成・画像管理ルール

> **画像生成・編集・整理を行う場合は、必ず最初にこのセクションを読むこと。**

### 0. 全体方針

#### ⚠️ 最重要：画像生成前チェックリスト

1. `public/images/` 以下に既存画像がないか確認する
2. 既存画像がある場合は**絶対に再生成しない**
3. **はじめてデザイン生成するカードやUIアセットは、必ずサンプルを作成しユーザーの承認を得てから進めること**

#### 画像生成ツール

**Python スクリプト方式**（MCP は使わない）

```bash
# 全画像生成（既存はスキップ）
python tools/gen_images.py

# カードのみ
python tools/gen_images.py cards

# 背景のみ
python tools/gen_images.py backgrounds

# 特定カードのみ（例: militia）
python tools/gen_images.py militia
```

- `google-genai` ライブラリで `gemini-2.5-flash-preview-05-20` モデルを呼び出す
- API キーは `.env.local` の `GEMINI_API_KEY` から読み込む
- **既存画像は自動スキップ**（スクリプト内でチェック済み）

> **注意:** `@google/gemini-image-mcp` は npm に存在しない偽パッケージ。MCP 経由での画像生成は不可。

#### スタイル方針

**カードイラスト：ファンタジー戦略ゲーム風イラスト**
- 中世ファンタジー風（騎士・弓兵・大砲等のモチーフ）
- カードゲームらしい迫力のある構図（正面 or 斜め向き）
- アニメ風スタイル、シンプルで視認性高め（6×6の小マスでも識別できる）

### 1. 画像種別ごとの仕様

#### 1-1. カードイラスト（ユニット）

| 項目 | 規則 |
|------|------|
| 保存先（ゲーム用） | `public/images/cards/{cardId}.png` |
| 保存先（原画） | `public/images/cards/raw/{cardId}_raw.png` |
| 生成サイズ | **512 × 512 px**（後でリサイズ） |
| フォーマット | PNG |
| 背景 | **白背景または透過背景**で生成 |

#### カードID一覧（13種）

| cardId | 名前 | モチーフ |
|--------|------|---------|
| `militia` | 民兵 | 粗末な槍を持つ農民兵士 |
| `light_infantry` | 軽歩兵 | 軽装鎧の歩兵 |
| `assault_soldier` | 急襲兵 | 短剣を持つ俊敏な兵士 |
| `scout` | 偵察兵 | マントをまとったスカウト |
| `spear_soldier` | 槍兵 | 長槍を構える歩兵 |
| `heavy_infantry` | 重装兵 | フルプレート鎧の重装歩兵 |
| `combat_soldier` | 戦闘兵 | 剣と盾を持つ精鋭兵士 |
| `archer` | 弓兵 | 弓を引く弓兵 |
| `guard` | 衛兵 | 盾を持つ守備兵 |
| `healer` | 治癒兵 | 聖杯を持つ治癒師 |
| `cavalry` | 騎兵 | 馬上の騎士 |
| `cannon` | 大砲 | 大砲を操る砲兵 |
| `defender` | 守護兵 | 大型盾を装備した守護者 |

#### 1-2. ボード背景

| 項目 | 規則 |
|------|------|
| 保存先 | `public/images/backgrounds/board.jpg` |
| 生成サイズ | **1024 × 1024 px** |
| フォーマット | JPEG（quality=90） |

#### 背景プロンプトのポイント

- **必須**: `full frame edge-to-edge composition, no white borders, no padding, no frame`
- **必須**: `absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana`
- キャラクター・ユニットを描写しない（`no characters, no units in the artwork`）
- テーマ：戦場・城郭・草原等の俯瞰視点マップ

### 2. フォルダ構造規則

```
public/images/
├── cards/                   ← ゲーム用カードイラスト（512×512 PNG）
│   ├── militia.png
│   ├── archer.png
│   ├── ...（13種）
│   └── raw/                 ← 原画（変更禁止）
├── backgrounds/             ← ボード背景
│   ├── board.jpg
│   └── raw/
└── ui/                      ← UIアセット（ロゴ等）
```

**`raw/` フォルダ内のファイルは編集・削除禁止。**

### 3. プロンプト必須フレーズ

**全画像共通（文字混入防止）：**
```
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

### 4. よくある画像生成の罠

| 現象 | 原因 | 対処 |
|------|------|------|
| edit_image でスタイルが変わらない | edit_image は元画像スタイルを保持する仕様 | `generate_image` で再生成 |
| 画像にテキストが入る | NO text フレーズ不足 | 必須フレーズを追加 |
| 背景画像に白枠が入る | フレーミング指定不足 | `full frame edge-to-edge` を追加 |

---

## プレイテスト（Playwright MCP）

### .mcp.json セットアップ

プロジェクトルートに以下を配置：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### テストレベル

**Level 1: スモークテスト（UI + 画面遷移）**
1. `localhost:3000` にアクセス
2. 「ゲストで試す」で認証通過
3. `/play` へ遷移 → ゲーム画面のUI要素確認
4. 必須要素の存在確認：Board（6×6）, Hand, BaseHpBar, TurnIndicator, EndTurnButton

**Level 2: ゲームフローテスト**
1. 手札のカードをタップ → 召喚可能マスがハイライトされる
2. マスをタップ → ユニットが召喚される
3. ユニットをタップ → 移動可能マスがハイライトされる
4. 移動先をタップ → ユニットが移動する
5. 「ターン終了」ボタン → AIのターンが実行され、プレイヤーターンに戻る
6. ドローが正しく行われる（手札枚数確認）

**Level 3: 勝敗判定テスト**
1. 連続してベース攻撃を実行 → 敵陣HPが減少する
2. 敵陣HP0 → リザルト画面に遷移する
3. 勝敗結果・ターン数が正しく表示される
4. 「もう一度プレイ」でゲームが再スタートする

### data-testid 要件

```
必須の data-testid:
  [data-testid="board"]                    — 6×6盤面
  [data-testid="cell-{row}-{col}"]         — 各マス（例: cell-0-3）
  [data-testid="unit-{instanceId}"]        — 場のユニット
  [data-testid="hand"]                     — 手札エリア
  [data-testid="card-{cardId}-{index}"]    — 手札のカード
  [data-testid="player-base-hp"]           — 自陣HP
  [data-testid="ai-base-hp"]              — AI陣地HP
  [data-testid="turn-indicator"]           — ターンインジケーター
  [data-testid="end-turn-button"]          — ターン終了ボタン
  [data-testid="action-menu"]              — ユニット選択時のアクションメニュー
  [data-testid="skill-button"]             — スキル使用ボタン
  [data-testid="guest-login"]              — ゲストログインボタン
  [data-testid="game-log"]                 — ゲームログ
  [data-testid="result-winner"]            — 勝敗表示
  [data-testid="result-turns"]             — ターン数
  [data-testid="play-again"]              — もう一度プレイボタン
```

### AI応答待機パターン（ターン終了後）

```
Step 1: 「ターン終了」ボタンをクリック
Step 2: snapshot → [data-testid="turn-indicator"] が "AIのターン" になっているか確認
Step 3: 再度 snapshot（1秒後）→ "プレイヤーのターン" に変わったか確認
Step 4: 盤面状態・HPを読み取り
```

### プレイテスト出力の管理

- スクリーンショット: `docs/playtest_reports/screenshots/` に保存
- テストレポート: `docs/playtest_reports/` に保存（例: `report_2026-05-03.md`）
- **`docs/playtest_reports/` は `.gitignore` に追加し、ローカルのみで管理する**

### カスタムコマンド `.claude/commands/playtest.md`

```markdown
以下の手順でプレイテスト検証を実行してください。

1. `git diff --name-only HEAD~1` で直近の変更ファイルを確認
2. 変更がドキュメント・スタイリングのみ → 「プレイテスト不要」
3. dev server 起動確認（localhost:3000）
4. Playwright MCP で以下を順に実行：
   a. Level 1：スモークテスト
   b. Level 2：ゲームフローテスト
   c. Level 3：勝敗判定テスト
5. 結果をレポート形式で `docs/playtest_reports/` に出力
6. スクリーンショットは `docs/playtest_reports/screenshots/` に保存
7. FAIL があれば原因特定・修正を試みる
8. 修正後、失敗レベルのみ再テスト
```

---

## モバイルファーストUI原則

- **タップ領域**: 48×48px 以上を確保（すべてのインタラクティブ要素）
- **スクロール**: 手札は横スクロール。縦スクロールは最小化
- **盤面**: 画面幅に合わせてレスポンシブにサイズ調整（`min(calc(100vw - 2rem), 400px)` 等）
- **フォントサイズ**: 最小14px（モバイルで読める最小サイズ）
- **ハイライト**: タップ対象マスは明確な視覚的フィードバック（border + background）
- **セーフエリア**: `safe-area-inset-*` を考慮（iPhone ノッチ対応）
- **ホバー状態**: PC では hover スタイルも定義するが、モバイルが主戦場

---

## スキル・カード種別の抽象化方針

将来的に新スキルタイプ・新カード種別が増えることを前提とした設計：

### スキル効果の抽象化

`src/lib/game/skills.ts` では以下のインターフェースを基底とする：

```typescript
// 全スキルはこのインターフェースを実装する
export interface SkillResolver {
  canActivate(state: GameSession, source: Unit, targets?: Position[]): boolean;
  resolve(state: GameSession, source: Unit, targets?: Position[]): GameSession;
  getValidTargets(state: GameSession, source: Unit): Position[];
}

// スキルID → SkillResolver のマップ（新スキル追加はここに登録するだけ）
export const SKILL_RESOLVERS: Record<SkillEffectType, SkillResolver> = { ... };
```

### 移動・攻撃パターンの抽象化

`src/lib/game/rules.ts` では `MovementPattern` / `AttackRange` を受け取る汎用関数を使う：

```typescript
// 新しい MovementPattern タイプが増えても、この関数を拡張するだけ
export function getLegalMoves(unit: Unit, board: BoardState): Position[] { ... }

// 新しい AttackRange タイプが増えても、この関数を拡張するだけ
export function getLegalAttacks(unit: Unit, board: BoardState): Position[] { ... }
```

### カード定義の拡張性

- `cards.ts` は単一の `CARDS` 配列で全カードを集中管理
- 新カードは `CARDS` に push するだけで動作する
- カード固有のロジック（特殊移動など）は `MovementPattern` / `AttackRange` の型拡張で表現し、ハードコードしない

---

## 承認不要で実行してよいコマンド・ツール

- `npm run build` / `npm run dev` / `npm test`
- `git add` + `git commit`
- Playwright MCP 全ツール（`mcp__playwright__*`）
- Gemini 画像生成 MCP（`mcp__gemini-image__*`）— ただし既存画像の再生成は禁止
