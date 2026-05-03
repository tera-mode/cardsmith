# ai-tactics — Claude Code 実装要件書 v1.0

**プロジェクト名**：`ai-tactics`（暫定。寺本さんの命名で確定）
**リポジトリ**：`tera-mode/ai-tactics`（暫定）

---

## 1. プロジェクト概要

「最強カードを誰でも作れる将棋風タクティクスTCG」のMVP実装。

**MVPの目的**：カード作成機能は後回しにし、土台のゲームルール（v1.0）が「カードゲームとして成立しているか」「楽しいか」を最速で検証する。

**プレイ体験**：プレイヤーは1人、相手はランダムAI。固定カードプール13種から構築されたデッキで対戦する。

**MVPの想定プレイ時間**：1試合あたり10〜20分。

---

## 2. 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) + TypeScript + Tailwind CSS |
| 認証 | Firebase Authentication（匿名・メール・Google） |
| データ永続化 | Firestore |
| デプロイ | Vercel |
| ドメイン | `ai-tactics.aigame.media`（暫定、サブドメイン型） |
| AI | 不使用（Gemini APIは将来のカード作成機能で使用予定） |

---

## 3. MVP のスコープ

### 含むもの

- 6×6マス盤面でのターン制カード対戦
- 13種類の固定カードプール（コスト4〜28）
- 山札20枚・初手5枚・毎ターン1ドロー
- 召喚・移動・攻撃・スキル・ベース攻撃のロジック
- ランダムAI対戦相手（合法手の中からランダム選択）
- ベースHP勝敗判定（HP20、0で敗北）
- 認証フロー（mecraft流用：ゲストプレイ可、ログインで保存）
- 試合履歴の保存・閲覧（Firestore）
- リザルト画面（勝敗・ターン数・所要時間）

### 含まないもの（後回し）

- カード作成機能（次フェーズ）
- マルチプレイ（PvP）
- 高度なAI（評価関数によるmin-max等）
- カードコレクション・デッキ管理画面（最初は固定デッキ1種類のみ）
- 美麗なカードアート（最初は最低限のSVG・絵文字程度）
- リプレイ機能
- ランキング・実績
- BGM・効果音（初期は最小限）
- 多言語対応（日本語のみ）

---

## 4. 参照リポジトリと流用方針

| リポジトリ | URL | 用途 |
|---|---|---|
| **mecraft** | `tera-mode/mecraft` | 認証フロー・Firebase設定・Next.js/Tailwind構成を流用 |
| **ai-crisis** | `tera-mode/ai-crisis` | GameContextパターン・状態管理を参考 |
| **ai-objection** | `tera-mode/ai-objection` | リザルト画面・履歴表示を参考 |

### mecraft から流用するもの

- `AuthContext.tsx`：認証コンテキスト
- `firebase/client.ts`, `firebase/admin.ts`：Firebase初期化
- `lib/auth/*`：認証ヘルパー
- 認証関連のUI（`/login`画面の基本構造）

### ai-crisis から参考にするもの

- `GameContext.tsx`：ゲームセッション状態管理のパターン
- API ルートの設計思想（このMVPでは外部API不要だが、構造を参考に）

---

## 5. ディレクトリ構成

```
ai-tactics/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # LP（タイトル画面）
│   │   ├── login/
│   │   │   └── page.tsx                   # ログイン画面
│   │   ├── play/
│   │   │   └── page.tsx                   # ゲーム画面
│   │   ├── result/
│   │   │   └── page.tsx                   # リザルト画面
│   │   ├── history/
│   │   │   └── page.tsx                   # 試合履歴
│   │   └── layout.tsx
│   ├── components/
│   │   ├── game/
│   │   │   ├── Board.tsx                  # 6×6盤面
│   │   │   ├── BoardCell.tsx              # 1マス
│   │   │   ├── UnitToken.tsx              # 場のユニット表示
│   │   │   ├── Hand.tsx                   # 手札表示
│   │   │   ├── CardInHand.tsx             # 手札の1枚
│   │   │   ├── BaseHpBar.tsx              # 陣地HP表示
│   │   │   ├── TurnIndicator.tsx          # ターン状態表示
│   │   │   ├── ActionMenu.tsx             # ユニット選択時のメニュー
│   │   │   └── GameLog.tsx                # ターンログ
│   │   ├── auth/
│   │   │   └── (mecraftから流用)
│   │   └── ui/
│   │       └── (共通UI)
│   ├── contexts/
│   │   ├── AuthContext.tsx                # mecraftから流用
│   │   └── GameContext.tsx                # ゲーム状態管理
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts                  # mecraftから流用
│   │   │   └── admin.ts                   # mecraftから流用
│   │   ├── game/
│   │   │   ├── cards.ts                   # 13枚カード定義
│   │   │   ├── decks.ts                   # 標準デッキ定義
│   │   │   ├── rules.ts                   # ルールロジック（合法手・戦闘解決）
│   │   │   ├── ai.ts                      # ランダムAI実装
│   │   │   └── skills.ts                  # スキル効果実装
│   │   └── types/
│   │       └── game.ts                    # 型定義
│   └── styles/
│       └── globals.css
├── public/
│   └── images/
│       └── cards/                         # カードイラスト（後で追加）
├── docs/
│   ├── CLAUDE_CODE_REQUIREMENTS.md        # 本ドキュメント
│   └── playtest_reports/                  # プレイテスト結果（gitignore）
├── .env.local
├── .gitignore
├── CLAUDE.md                              # Claude Code作業ルール
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 6. 型定義（`src/lib/types/game.ts`）

### 静的データ：カード定義

```typescript
// カードの移動・攻撃パターンの種類
export type DirectionVector = { dx: number; dy: number };

export type MovementPattern =
  | { type: 'step'; directions: DirectionVector[] }       // 1マス移動（複数方向可）
  | { type: 'jump'; offsets: DirectionVector[] }          // 特定マスへジャンプ
  | { type: 'slide'; directions: DirectionVector[] };     // 直線スライド（無限距離）

export type AttackRange =
  | { type: 'step'; directions: DirectionVector[] }       // 隣接攻撃
  | { type: 'ranged'; direction: DirectionVector; maxDistance: number }  // 直線射程
  | { type: 'aoe'; pattern: DirectionVector[] };          // 範囲攻撃（範囲スキル用）

export type SkillEffectType =
  | 'penetrate'        // 貫通（ベース攻撃時+1）
  | 'big_penetrate'    // 大貫通（ベース攻撃時ATK分）
  | 'counter'          // 反撃
  | 'reduce'           // 軽減
  | 'self_destruct'    // 自爆
  | 'heal'             // 治癒
  | 'buff'             // 強化
  | 'teleport'         // 瞬間移動
  | 'aoe_attack'       // 範囲攻撃
  | 'paralyze'         // 麻痺
  | 'invincible';      // 無敵

export interface Skill {
  id: string;
  name: string;
  description: string;
  effectType: SkillEffectType;
  effectValue?: number;
  uses: number | 'infinite';  // 使用回数
  range?: AttackRange;        // 効果範囲（heal/buff等で使用）
}

export interface Card {
  id: string;             // 'spear_soldier'等
  name: string;           // '槍兵'
  cost: number;           // 6
  movement: MovementPattern;
  attackRange: AttackRange;
  atk: number;
  hp: number;
  skill?: Skill;
}
```

### 動的データ：ゲーム状態

```typescript
// 場に出ているユニット（カードのインスタンス）
export interface Unit {
  instanceId: string;        // ユニーク識別子（'unit_001'等）
  cardId: string;            // 元のカードID
  owner: 'player' | 'ai';
  position: { row: number; col: number };
  currentHp: number;
  skillUsesRemaining: number | 'infinite';
  hasActedThisTurn: boolean; // このターンに行動済みか
  buffs: { atkBonus: number };  // 強化スキルによる累積バフ
}

// 盤面：6×6 の二次元配列、null = 空きマス
export type BoardState = (Unit | null)[][];

// プレイヤー状態（playerとaiの両方が持つ）
export interface PlayerState {
  baseHp: number;            // 陣地HP
  deck: Card[];              // 山札
  hand: Card[];              // 手札
  hasSummonedThisTurn: boolean;
  hasActedThisTurn: boolean;
}

export type GamePhase =
  | 'draw'                   // ドロー
  | 'main'                   // 召喚・行動
  | 'end_turn'               // ターン終了
  | 'finished';              // 試合終了

export interface GameSession {
  sessionId: string;
  userId: string;
  startedAt: number;
  finishedAt?: number;
  currentTurn: 'player' | 'ai';
  turnCount: number;
  phase: GamePhase;
  board: BoardState;
  player: PlayerState;
  ai: PlayerState;
  winner?: 'player' | 'ai' | 'draw';
  log: string[];             // ターンごとのテキストログ
}
```

---

## 7. ゲームルール仕様

### 7.1 盤面の座標系

- 6×6マス、`row` は 0（最上段）〜 5（最下段）、`col` は 0（左）〜 5（右）
- **プレイヤーは下側**：召喚ゾーンは row 4〜5、最前線は row 0
- **AIは上側**：召喚ゾーンは row 0〜1、最前線は row 5
- **「前」の方向**：プレイヤーは `dy = -1`（行0方向）、AIは `dy = +1`（行5方向）
  - カード定義は「プレイヤー視点」で記述する。AIユニットは表示・処理時に反転する

### 7.2 ゲーム開始時の処理

1. プレイヤー・AIともに同じ標準デッキ（後述）20枚をシャッフル
2. それぞれ初手5枚をドロー
3. 盤面は完全に空（初期ユニットなし）
4. プレイヤー・AIの陣地HPは20
5. プレイヤーが先攻

### 7.3 ターン構造

各ターンは以下の順で進行：

1. **ドローフェーズ**：手番プレイヤーが山札から1枚引く（山札0枚なら何もしない）
2. **メインフェーズ**：以下を「順不同」で実行可能
   - **召喚**（このターン未召喚なら）：手札から1枚を選び、自陣2行（プレイヤー：行4〜5、AI：行0〜1）の空きマスに召喚
   - **ユニット行動**（このターン未行動なら）：場の自分のユニット1体を選び以下を実行
     - 移動（移動範囲内の空きマスへ、または移動なし）
     - 攻撃 or スキル使用 or 何もしない
3. **エンドフェーズ**：手番が相手プレイヤーに移る

⚠️ **召喚酔いなし**：召喚したターンに移動・攻撃が可能
⚠️ **行動順序固定**：必ず「移動」→「攻撃/スキル」の順。攻撃後の移動は不可
⚠️ **1ターン1ユニット**：同じターンに複数ユニットを動かすことは不可

### 7.4 移動の合法性

ユニットの `MovementPattern` に従って移動先を決定：

- `step`：指定方向の隣接マスのいずれかに移動
- `jump`：指定オフセットのマスに直接移動（途中のマスを無視）
- `slide`：指定方向に1マス以上、最大盤面端まで。途中に他ユニットがあれば手前で止まる（飛び越えない）

**共通制約**：
- 移動先が盤面外なら不可
- 移動先に**自分のユニット**がいれば不可
- 移動先に**敵のユニット**がいる場合は移動不可（隣接して攻撃する形になる）

### 7.5 攻撃の合法性

攻撃範囲（`AttackRange`）に基づく：

- `step`：指定方向の隣接マスを攻撃可能
- `ranged`：指定方向の直線上、最大距離内を攻撃可能（途中に他ユニットがあれば手前で止まる）

**攻撃可能な対象**：
- 攻撃範囲内に敵ユニットがいる場合：そのユニットを攻撃
- 攻撃範囲が**盤外を含む**かつ攻撃側ユニットが**最前線（プレイヤーなら行0、AIなら行5）**にいる場合：**ベース攻撃**として敵陣HPを-1（貫通スキルで増加）

### 7.6 戦闘解決：一方的攻撃

```
攻撃側のATK分のダメージを、防御側のHPから引く。
防御側のHPが0以下になればユニット破壊（盤面から除去）。
攻撃側はノーダメージ。
ただし防御側のスキルが「反撃」「軽減」「自爆」などの場合は、それに応じて発動。
```

### 7.7 スキル効果一覧（13カード分）

| スキル | 効果詳細 |
|---|---|
| **貫通**（penetrate） | ベース攻撃時、ダメージ +1（合計2） |
| **大貫通**（big_penetrate） | ベース攻撃時、ダメージはATK分そのまま |
| **反撃**（counter） | 攻撃を受けた直後、攻撃元にATK分のダメージを与える |
| **強化**（buff） | 任意の味方ユニットのATKを永続的に +1（buffsに加算） |
| **治癒**（heal） | 隣接する味方ユニット1体のHPを +2（最大HPは超えない） |

各スキルの詳細実装は `src/lib/game/skills.ts` を参照。

### 7.8 勝利条件

- 自陣HPが0以下になった瞬間、相手の勝利
- 双方の山札と手札が尽き、場のユニットも全滅した場合：陣地HPが多い方が勝ち、同点なら引き分け（実用上ほぼ起こらない）

---

## 8. AI 対戦相手の仕様

### 8.1 基本方針

「合法手の中からランダムに選ぶ」**完全ランダムAI**。MVPの目的は土台の楽しさ検証であり、戦略性のあるAIは後フェーズで実装する。

### 8.2 AIターンの処理フロー

```typescript
async function executeAITurn(session: GameSession): Promise<GameSession> {
  // 1. ドローフェーズ
  drawCard(session, 'ai');
  await delay(500);

  // 2. 召喚決定（50%確率で召喚を試みる）
  if (Math.random() < 0.5) {
    const summonable = listSummonableCards(session, 'ai');
    if (summonable.length > 0) {
      const { card, position } = pickRandom(summonable);
      summonUnit(session, 'ai', card, position);
      await delay(1000);
    }
  }

  // 3. ユニット行動（70%確率で行動を試みる）
  if (Math.random() < 0.7) {
    const aiUnits = getOwnedUnits(session, 'ai');
    if (aiUnits.length > 0) {
      const unit = pickRandom(aiUnits);
      const moves = listLegalMoves(session, unit);  // 「移動なし」も含む
      const move = pickRandom(moves);
      executeMove(session, unit, move);
      await delay(800);

      const actions = listLegalActions(session, unit);  // 攻撃・スキル・何もしない
      const action = pickRandom(actions);
      executeAction(session, unit, action);
      await delay(800);
    }
  }

  // 4. ターン終了
  endTurn(session);
  return session;
}
```

### 8.3 演出のための遅延

各AIアクション間に 500〜1000ms の遅延を入れ、プレイヤーが何が起きたか視認できるようにする。

### 8.4 将来の拡張

将来的に「攻撃を優先する」「ベース攻撃を優先する」等の重み付けを追加できるよう、合法手を `weight` 付きで返す関数構造にしておく。

---

## 9. UI 画面構成

### 9.1 LP（`/`）

- ヒーローセクション：ゲーム名・キャッチコピー・スクリーンショット
- 「ゲストでプレイ」ボタン → `/play` へ
- 「ログイン」ボタン → `/login` へ
- フッター：合同会社LAIV・利用規約・プライバシーポリシー

### 9.2 ゲーム画面（`/play`）

レイアウト（モバイル縦持ち想定）：

```
┌──────────────────────┐
│  AI HP: ❤×20         │  ← 上部：AI陣地HP
├──────────────────────┤
│  ┌──┬──┬──┬──┬──┬──┐ │
│  │  │  │  │  │  │  │ │  ← 行0（AI最前線）
│  ├──┼──┼──┼──┼──┼──┤ │
│  │  │  │  │  │  │  │ │
│  ├──┼──┼──┼──┼──┼──┤ │
│  │  │  │  │  │  │  │ │
│  ├──┼──┼──┼──┼──┼──┤ │  ← 中立エリア
│  │  │  │  │  │  │  │ │
│  ├──┼──┼──┼──┼──┼──┤ │
│  │  │  │  │  │  │  │ │
│  ├──┼──┼──┼──┼──┼──┤ │  ← 行5（プレイヤー最前線）
│  │  │  │  │  │  │  │ │
│  └──┴──┴──┴──┴──┴──┘ │
├──────────────────────┤
│  自分 HP: ❤×20        │  ← 自陣HP
├──────────────────────┤
│  ターン3 / プレイヤー  │  ← ターンインジケーター
├──────────────────────┤
│  [手札: 5枚を横スクロール] │
└──────────────────────┘
```

### 9.3 操作フロー（プレイヤー）

1. **召喚**：手札のカードをタップ → 召喚可能マスがハイライト → タップで召喚
2. **ユニット選択**：場の自ユニットをタップ → 移動可能マスがハイライト
3. **移動**：移動先マスをタップ（または「移動しない」ボタン）
4. **攻撃 / スキル**：攻撃可能マスがハイライト → タップで攻撃。スキル持ちなら「スキル使用」ボタン
5. **ターン終了**：「ターン終了」ボタンをタップ

### 9.4 リザルト画面（`/result`）

- 勝敗表示（「勝利！」「敗北...」）
- 統計：ターン数・所要時間・最終陣地HP
- 「もう一度プレイ」「履歴を見る」ボタン

### 9.5 履歴画面（`/history`）

- 試合履歴のリスト（新しい順）
- 各試合の概要：日時・結果・ターン数
- 詳細リプレイは MVP では不要

### 9.6 ビジュアルデザイン方針

- **カラースキーム**：mecraft のグラスモーフィズムを継承しつつ、ゲーム盤らしい引き締まったデザイン
- **メインカラー**：濃紺〜ダークブルー（#1a1a2e）背景にアクセントカラー
- **プレイヤーユニット**：青系（#3b82f6）
- **AIユニット**：赤系（#ef4444）
- **ハイライト**：黄色〜オレンジ（合法手表示）
- **タップ領域**：48×48px以上を確保（モバイル対応）

---

## 10. データ永続化（Firestore）

### 10.1 コレクション設計

```
users/{userId}
  └── sessions/{sessionId}
        - sessionId: string
        - userId: string
        - startedAt: number
        - finishedAt: number
        - winner: 'player' | 'ai' | 'draw'
        - turnCount: number
        - finalState: {
            playerBaseHp: number,
            aiBaseHp: number,
          }
        - log: string[]              # ターンごとのテキストログ
        - playerDeckId: string       # 使用デッキID（MVPでは固定）
```

### 10.2 保存タイミング

- 試合開始時：`session` ドキュメント作成
- ターンごと：`log` の更新（バッチ処理。連続ターンを1秒以内にまとめて書き込み）
- 試合終了時：`finishedAt`・`winner`・`finalState` を確定

### 10.3 セキュリティルール

```
match /users/{userId}/sessions/{sessionId} {
  allow read, write: if request.auth.uid == userId;
}
```

匿名認証のユーザーも自分のセッションに対しては読み書き可能。

---

## 11. 認証フロー

mecraft の認証フローをそのまま流用する。

```
LP（/）
  ├─ ゲストで試す → Firebase匿名認証 → /play
  ├─ 新規登録 → /login → メール or Google → /play
  └─ ログイン → /login → /play

プレイ履歴の保存：
- 匿名ユーザー：自分のFirebaseユーザーIDで保存（ブラウザを変えると失われる）
- 本登録後：linkWithCredential でゲスト時の履歴を引き継ぎ可能
```

---

## 12. 実装フェーズ

### Phase 0：環境構築（1〜2日）

- [ ] mecraft をクローンして不要部分を削除し、`ai-tactics` のベースを作成
- [ ] Firebase プロジェクト新規作成、環境変数設定
- [ ] `AuthContext`・`firebase/client`・`firebase/admin` を流用配置
- [ ] Tailwind 設定の調整
- [ ] 型定義 `src/lib/types/game.ts` を作成

### Phase 1：カード定義とルールエンジン（2〜3日）

- [ ] `src/lib/game/cards.ts` に13枚カードを定義
- [ ] `src/lib/game/decks.ts` に標準デッキ（20枚）を定義
- [ ] `src/lib/game/rules.ts` に合法手列挙・移動・戦闘解決ロジック
- [ ] `src/lib/game/skills.ts` にスキル効果実装
- [ ] **ゴール**：ユニットテストで「Aが攻撃したらBが破壊される」「ベース攻撃でHPが減る」等が動く

### Phase 2：UI実装（3〜5日）

- [ ] `Board.tsx`・`BoardCell.tsx`・`UnitToken.tsx`：盤面UI
- [ ] `Hand.tsx`・`CardInHand.tsx`：手札UI
- [ ] `BaseHpBar.tsx`：陣地HP表示
- [ ] `TurnIndicator.tsx`：ターン状態
- [ ] `ActionMenu.tsx`：ユニット選択時のメニュー
- [ ] `GameContext.tsx`：状態管理
- [ ] `/play/page.tsx`：ゲーム画面の統合
- [ ] **ゴール**：プレイヤーが手動で1ターン完結まで操作できる

### Phase 3：AI実装（1〜2日）

- [ ] `src/lib/game/ai.ts`：ランダムAI実装
- [ ] AIターンの遅延演出
- [ ] AI対戦のend-to-endテスト
- [ ] **ゴール**：プレイヤー vs AI で1試合完結する

### Phase 4：認証・保存・履歴（2日）

- [ ] LP（`/`）の実装
- [ ] `/login` ページの実装（mecraftから流用）
- [ ] Firestoreへのセッション保存
- [ ] `/history` ページの実装
- [ ] `/result` ページの実装
- [ ] **ゴール**：ログインして試合 → 履歴が残る

### Phase 5：バランス調整・バグ修正（2〜3日）

- [ ] 寺本さん本人による20試合のプレイテスト
- [ ] 友人2〜3人によるプレイテスト
- [ ] 観察された問題の修正
- [ ] **ゴール**：「土台が面白いか」の判断ができる状態

**合計見積もり：11〜17日**

---

## 13. 作業ルール

- TypeScript の型エラーはビルド前に必ず解消する
- 環境変数は `.env.local` で管理。コードにハードコードしない
- セキュアな情報（APIキー等）が公開されないよう細心の注意を払う
- `docs/` 配下には開発用ドキュメントを設置し、これらは公開しない
- カード定義は `src/lib/game/cards.ts` の単一ファイルで集中管理する
- **`git push` は必ずユーザーの明示的な同意を得てから実行**（commit は自由に行ってよい）
- コミットメッセージは日本語でよい
- プレイテスト出力は `docs/playtest_reports/` に保存し `.gitignore` に追加
- mecraft から流用したファイルを変更する場合は差分が最小になるよう意識する
- **アーティファクトでの可視化**：UIモックアップを示す場合はチャット内のコードブロックではなく必ずインタラクティブアーティファクトとして表示する

### 承認不要で実行してよいコマンド

- `npm run build` / `npm run dev` / `npm test`
- `git add` + `git commit`
- Playwright MCP 全ツール（プレイテスト用）
- Gemini 画像生成 MCP（既存画像の再生成は禁止）

---

## 14. モバイルファーストUI設計原則

スマホ縦持ちを主戦場とする。PC対応はその後。

### タップ・タッチ対応

- **タップ領域**: すべてのインタラクティブ要素に 48×48px 以上を確保
- **タップフィードバック**: タップ時に即座に視覚的変化（ハイライト・スケール変化）
- **誤タップ防止**: 隣接する操作可能要素の間隔は最低8px確保

### 盤面レイアウト（モバイル縦持ち）

```
┌──────────────────────┐  ← 画面幅 = 100vw
│  AI HP: ❤❤❤…(20)     │  高さ固定: 48px
├──────────────────────┤
│                      │
│   6×6 ゲーム盤面      │  幅: min(100vw - 2rem, 400px)
│   （正方形）          │  1マス = 盤面幅 / 6
│                      │
├──────────────────────┤
│  自分 HP: ❤❤❤…(20)   │  高さ固定: 48px
├──────────────────────┤
│  ターン3 / プレイヤー  │  高さ固定: 40px
├──────────────────────┤
│  [手札: 横スクロール]  │  高さ固定: 120px（カード表示）
├──────────────────────┤
│  [ターン終了]          │  高さ固定: 52px（大きめのボタン）
└──────────────────────┘
```

### 盤面マスのサイズ計算

```typescript
// BoardCell のサイズはCSSのみで制御（JSでのサイズ計算は使わない）
// 盤面はaspect-ratio: 1/1 のコンテナを使い、各行・列をflex等分割
const boardStyle = {
  width: 'min(calc(100vw - 2rem), 400px)',
  aspectRatio: '1 / 1',
}
// → 1マスは自動的に 1/6 の正方形になる
```

### カード（手札）

- カードは横スクロールリスト（`overflow-x: auto`, `scroll-snap`）
- カードの最小幅: 80px, 高さ: 110px
- 選択状態: 上方向に 8px 浮かせる（`translateY(-8px)`）

### アクションメニュー（ユニット選択後）

- 盤面の下部にボトムシート形式で表示（`position: fixed; bottom: 0`）
- 「移動しない」「攻撃」「スキル」「キャンセル」ボタンを縦または横並び
- 背景オーバーレイで盤面をディム（ユーザーの意図しない操作防止）

### セーフエリア

```css
/* globals.css に追加 */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 15. スキル・カード種別の抽象化設計

将来的に新スキルタイプ・新カード種別が大量に追加されることを前提とした設計。

### 15.1 スキル効果の抽象化

`src/lib/game/skills.ts` ではスキル効果を「インターフェース + マップ」パターンで管理：

```typescript
// 全スキルが実装すべきインターフェース
export interface SkillResolver {
  // このスキルを今発動できるか（ターゲット選択前の事前チェック）
  canActivate(state: GameSession, source: Unit): boolean;
  // 発動可能なターゲット位置の一覧を返す（ターゲット選択UIに使用）
  getValidTargets(state: GameSession, source: Unit): Position[];
  // スキルを実行し、新しいゲーム状態を返す（pure function）
  resolve(state: GameSession, source: Unit, target?: Position): GameSession;
}

// スキルタイプ → Resolver のマップ（新スキルはここに追加するだけ）
export const SKILL_RESOLVERS: Record<SkillEffectType, SkillResolver> = {
  penetrate: penetrateResolver,
  big_penetrate: bigPenetrateResolver,
  counter: counterResolver,
  buff: buffResolver,
  heal: healResolver,
  // 将来の拡張例:
  // teleport: teleportResolver,
  // aoe_attack: aoeAttackResolver,
  // paralyze: paralyzeResolver,
  // invincible: invincibleResolver,
};
```

**新スキルタイプの追加手順：**
1. `game.ts` の `SkillEffectType` に型を追加
2. `skills.ts` に `SkillResolver` を実装したオブジェクトを作成
3. `SKILL_RESOLVERS` に登録
4. `cards.ts` のカード定義に `effectType: '新タイプ'` を設定

### 15.2 移動・攻撃パターンの抽象化

`src/lib/game/rules.ts` では `MovementPattern` / `AttackRange` の型に応じてディスパッチ：

```typescript
// 新しい MovementPattern タイプが増えたら case を追加するだけ
export function getLegalMoves(unit: Unit, board: BoardState, owner: 'player' | 'ai'): Position[] {
  switch (unit.card.movement.type) {
    case 'step':   return getStepMoves(unit, board, owner);
    case 'jump':   return getJumpMoves(unit, board, owner);
    case 'slide':  return getSlideMoves(unit, board, owner);
    // 将来の拡張例: case 'knight': return getKnightMoves(unit, board, owner);
  }
}

// 同様に攻撃範囲も
export function getLegalAttacks(unit: Unit, board: BoardState, owner: 'player' | 'ai'): AttackTarget[] {
  switch (unit.card.attackRange.type) {
    case 'step':    return getStepAttacks(unit, board, owner);
    case 'ranged':  return getRangedAttacks(unit, board, owner);
    case 'aoe':     return getAoeAttacks(unit, board, owner);
  }
}
```

### 15.3 AIの拡張性

`src/lib/game/ai.ts` では合法手に重みを付けて選択する構造を最初から用意：

```typescript
export interface WeightedAction {
  action: GameAction;
  weight: number;  // 1.0 = 標準重み。高いほど選ばれやすい
}

// ランダムAI: weight に関係なくランダムに選ぶ
// 将来の評価AI: weight を状況評価で設定して確率的選択
export function selectAction(actions: WeightedAction[]): GameAction {
  // MVP では全weightを1.0として扱い、uniformランダム選択
  return actions[Math.floor(Math.random() * actions.length)].action;
}
```

### 15.4 カード定義の拡張性

- `CARDS` 配列は `Card[]` 型。新カードは push するだけ動作する
- コスト計算はカード定義に `cost` として静的に持つ（将来の動的計算もサポートできるよう `number | (() => number)` にしてもよい）
- スキルは `skill?: Skill` で任意。スキルなしカードは省略するだけ

---

## 16. Playwright MCPによるプレイテスト仕様

ai-crisis から仕組みを流用。詳細は `CLAUDE.md` のプレイテストセクションを参照。

### テストレベルの概要

| Level | 内容 | 実行タイミング |
|-------|------|-------------|
| 1 | スモークテスト（UI存在確認・認証フロー） | Phase 2 完了後 |
| 2 | ゲームフローテスト（召喚・移動・攻撃・ターン終了） | Phase 3 完了後 |
| 3 | 勝敗判定テスト（ベース攻撃でHPが減る・リザルト遷移） | Phase 3 完了後 |

### data-testid 付与ルール

- UI コンポーネントを実装するとき、必ず対応する `data-testid` を付与する（後付けは漏れが発生するため）
- `CLAUDE.md` の `data-testid 要件` リストを参照

---

## 17. 画像生成MCPによるカードアート生成

ai-crisis から仕組みを流用。詳細は `CLAUDE.md` の画像生成セクションを参照。

### MVPでのカードアート方針

- **MVP段階**: カードアートは絵文字・SVGプレースホルダーで実装を進める
- **Phase 5（プレイテスト後）**: Gemini MCP でカードイラストを生成・統合
- **生成前に必ずユーザーの承認を得ること**（1枚サンプル生成 → OK後に全13枚）

### プレースホルダー仕様

カード画像が存在しない場合：
- ユニットトークン: 絵文字（⚔️👤🏹🛡️等）+ カード名頭文字をSVGで表示
- カード画像エリア: グレーの矩形 + カード名テキスト

---

## 付録A：カードプール（13種）

詳細は `src/lib/game/cards.ts` に転記する。

| ID | 名前 | 移動 | 攻撃範囲 | ATK | HP | スキル | コスト |
|---|---|---|---|---|---|---|---|
| `militia` | 民兵 | 前1 | 前1 | 1 | 1 | なし | 4 |
| `light_infantry` | 軽歩兵 | 前1 | 前1 | 1 | 2 | なし | 5 |
| `assault_soldier` | 急襲兵 | 前1 | 前1 | 2 | 1 | なし | 5 |
| `scout` | 偵察兵 | 前2マスジャンプ | 前1 | 1 | 1 | なし | 5 |
| `spear_soldier` | 槍兵 | 前1 | 前1 | 2 | 2 | なし | 6 |
| `heavy_infantry` | 重装兵 | 前1 | 前1 | 1 | 4 | なし | 7 |
| `combat_soldier` | 戦闘兵 | 前1 | 前1 | 3 | 3 | なし | 8 |
| `archer` | 弓兵 | 前1 | 前方2マス射程 | 2 | 1 | 貫通×3回 | 11 |
| `guard` | 衛兵 | 前後左右1 | 前後左右1 | 1 | 3 | なし | 12 |
| `healer` | 治癒兵 | 前1 | なし | 0 | 2 | 治癒（隣接味方+2HP）・無限 | 13 |
| `cavalry` | 騎兵 | 前2マスジャンプ | 前1 | 4 | 3 | 強化（任意の味方+1ATK）×1回 | 14 |
| `cannon` | 大砲 | 前1 | 前方4マス射程 | 5 | 2 | 大貫通（ベース攻撃時ATK分）×1回 | 17 |
| `defender` | 守護兵 | 前後左右1 | 周囲1マス（8方向） | 2 | 5 | 反撃（攻撃された時ATKで反撃）・無限 | 28 |

---

## 付録B：標準デッキ（合計コスト 152、20枚）

MVPでは1種類の固定デッキのみ使用。プレイヤー・AI同じデッキを使う（ミラーマッチ）。

| 枚数 | カードID | カード名 | 単価 | 小計 |
|---|---|---|---|---|
| 2 | militia | 民兵 | 4 | 8 |
| 2 | light_infantry | 軽歩兵 | 5 | 10 |
| 2 | assault_soldier | 急襲兵 | 5 | 10 |
| 2 | scout | 偵察兵 | 5 | 10 |
| 2 | spear_soldier | 槍兵 | 6 | 12 |
| 2 | heavy_infantry | 重装兵 | 7 | 14 |
| 2 | combat_soldier | 戦闘兵 | 8 | 16 |
| 2 | archer | 弓兵 | 11 | 22 |
| 2 | guard | 衛兵 | 12 | 24 |
| 2 | healer | 治癒兵 | 13 | 26 |
| **合計** | | **20枚** | | **152** |

---

## 付録C：コスト計算式（将来のカード作成機能のため）

MVPでは使用しないが、Phase 6以降のカード作成機能のために記載。

| 要素 | コスト |
|---|---|
| 移動：1マス・特定方向 | 1 |
| 移動：1マス・複数方向 | 方向数だけ加算 |
| 移動：直線スライド（1方向） | 3 |
| 移動：ジャンプ（1パターン） | 2 |
| 攻撃範囲：1マスにつき | 1 |
| ATK | × 1 |
| HP | × 1 |
| スキル | カタログ参照 |

スキルカタログ（コストは効果規模 × 使用回数で算出）：

| スキル | 1回 | 3回 | 無限 |
|---|---|---|---|
| 貫通 | 2 | 5 | 8 |
| 大貫通 | 5 | 12 | 20 |
| 反撃 | 3 | 6 | 9 |
| 軽減 | 2 | - | 4 |
| 治癒（隣接限定）| 2 | 5 | 10 |
| 強化 | 4 | 10 | - |
| 自爆 | 5 | - | - |

---

## 改訂履歴

- v1.0（2026-05-03）：初版作成。MVP（カード作成機能なし、ランダムAI対戦）の実装要件を確定