# デッキ編集画面 — Claude Code 実装指示

## 対象
`app/deck/page.tsx`（および付随コンポーネント）を、リファレンス HTML プロトタイプの「デッキ編集」アートボードに置き換える。

## リファレンス
- **モック**: `design_handoff_dungeon_ui/Cardsmith Dungeon Redesign.html`（デッキ編集アートボード）
- **実装ソース**: `design_handoff_dungeon_ui/deck.jsx`（React JSX、そのままロジック移植可）
- **デザイントークン**: `design_handoff_dungeon_ui/styles.css`（`--gold` `--border-rune` `--font-display` 等）
- **共通コンポーネント**: `design_handoff_dungeon_ui/components.jsx`（`screen`, `app-header`, `btn--primary`, `scrollarea` クラス）

## 既存コードとの整合
以下は既存の `src/lib/` から **そのまま流用** すること。新しく定義しない。

| 項目 | 参照元 |
|---|---|
| `DECK_MAX_CARDS = 10` | `src/lib/data/economy.ts` |
| `DECK_MAX_SAME = 2` | 同上 |
| `LEVEL_COST_CAP[level]`（Lv1=80） | 同上 `getCostCapForLevel()` |
| `rarityFromCost(cost)` | 同上（≤6:C, ≤11:R, ≤17:SR, それ以上:SSR） |
| `Card` 型・`Deck` 型 | `src/lib/types/` |
| デッキ保存 | 既存 `GameProvider` / `DeckContext` |

## 画面構造（上から）

### 1. ヘッダー（`app-header`）
- 戻るボタン（←）
- 中央：デッキ名 input（`<input>` でインライン編集、金色ディスプレイフォント、placeholder「BATTLE DECK」サブ）
- 右：「保存」ボタン
  - **無効化条件**: コスト超過 OR 0 枚

### 2. ステータスバー（黒帯）
2 列 flex、各列ゲージ：
- **枚数ゲージ**: `0/10`、満杯時は金色ハイライト
- **コストゲージ**: `0/80`、上限超過で赤＋⚠、85% 超で金、それ以下は緑

ゲージ高さ 5px、現在値%幅でフィル。`box-shadow: 0 0 6px currentColor` でグロー。

### 3. デッキカルーセル（横スクロール）
- 見出し: `⚜ 編成中の戦士 ⚜`（金色ディスプレイ、letter-spacing 0.12em）
- 右側に「全解除」ボタン
- **10 スロットの横並び**（`overflow-x: auto`）
  - 各スロット 70×96px、コスト順自動ソート
  - 埋まっているスロット: `<CardArt size="lg" showStats>`、右上にスロット番号バッジ（金丸）
  - 空きスロット: 点線枠＋中央に「＋」、左上にインデックス番号
  - **タップで除外**: 埋まっているスロットを押すと `removeCard()`

### 4. フィルタバー（8 ボタン＋検索＋ソート）
左から：
- `◆ 全` / `☀ 光` / `☾ 闇` / `✦ 炎` / `❄ 水` / `❦ 森` / `⚡ 雷` / `⚒ 自作`
- 各ボタン 22×22、選択中は属性カラー枠＋内側グロー
- 「⚒ 自作」のみ金グラデ背景で差別化
- 検索 input（カード名 includes）
- ソート select: `コスト順` / `名前順` / `レア順`

「自作」タブ選択時：
- ヘッダーに「⚒ 鍛冶で作成したオリジナルカード — N枚所持」帯を表示
- 標準カードは含めず、`forged: true` のカードのみ表示

### 5. カードリスト（縦スクロール）
各行 = 横並び：
- `<CardArt size="sm">` サムネ（44×60）
- 名前（1 行省略）
- メタ行: レア / `×ATK` / `♥HP` / 属性アイコン＋ラベル
- 自作カードのみ右端に作成日（例: `3日前`）
- 既にデッキにある場合: ×N の所持カウント枠（金色ディスプレイ）
- ＋／− ボタン縦積み（＋は金グラデ、− は赤暗）

**＋ボタン無効化条件**:
- 同名 2 枚到達 → tooltip「MAX」
- デッキ 10 枚到達 → 「満員」
- 追加するとコスト超過 → 「コスト超過」

### 6. 共通カード枠（`<CardArt>` コンポーネント）
新規共通コンポーネント。サイズ `lg` / `sm` の 2 種。

**構造（重ね順）**:
1. レアリティ別グラデ背景（C 茶 / R 青 / SR 紫 / SSR 金）
2. `<img src={card.art}>` で全面イラスト（`object-fit: cover; object-position: center top`）
3. 上下グラデオーバーレイ（読みやすさ用）
4. **左上**: コスト宝玉（青グラデ円、金縁、コスト数値）
5. **右上**: 属性アイコン（属性カラー＋グロー）
6. **右下**: レアリティ表記
7. **左下**: ATK/HP（`showStats` 時のみ）
8. **下部**: 名前帯（`size=lg` のみ）
9. **上部中央**: 「⚒ 自作」金箔バッジ（`forged` カードのみ）

## データ拡張

### Card 型に追加するフィールド
```ts
interface Card {
  // 既存フィールド...
  attr: 'light' | 'dark' | 'fire' | 'water' | 'forest' | 'thunder';
  art: string;       // 画像パス
  forged?: boolean;  // 鍛冶で作成したか
  forgedAt?: string; // 作成日（自作のみ）
}
```

### 6 属性定義（共通）
```ts
const ATTR_INFO = {
  light:   { label: '光', icon: '☀', color: '#ffd54a', glow: 'rgba(255,213,74,0.4)' },
  dark:    { label: '闇', icon: '☾', color: '#c478ff', glow: 'rgba(196,120,255,0.4)' },
  fire:    { label: '炎', icon: '✦', color: '#ff6b5b', glow: 'rgba(255,107,91,0.4)' },
  water:   { label: '水', icon: '❄', color: '#5dc8ff', glow: 'rgba(93,200,255,0.4)' },
  forest:  { label: '森', icon: '❦', color: '#6bd998', glow: 'rgba(107,217,152,0.4)' },
  thunder: { label: '雷', icon: '⚡', color: '#ffb83a', glow: 'rgba(255,184,58,0.4)' },
};
```
これは `src/lib/data/attributes.ts` などに切り出して、バトル・コレクション・鍛冶・ガチャからも参照すること。

### レアリティトーン
```ts
const RARITY_TINT = {
  C:   { bg: 'linear-gradient(180deg, #2a2218, #14100a)', border: '#5a4f3d' },
  R:   { bg: 'linear-gradient(180deg, #1a2a3a, #0a141e)', border: '#3a6a9a' },
  SR:  { bg: 'linear-gradient(180deg, #2a1a3a, #14081e)', border: '#7a4abc' },
  SSR: { bg: 'linear-gradient(180deg, #3a2a14, #2a1808)', border: '#d68a1a' },
};
```

## 状態管理

```ts
type DeckEditState = {
  deck: Deck;                // 名前・エントリ配列
  filterAttr: 'all' | AttrKey | 'forged';
  sortBy: 'cost' | 'name' | 'rarity';
  search: string;
};
```

派生値（useMemo）:
- `totalCount` = エントリの count 合計
- `totalCost` = エントリ毎 (cost × count) の合計
- `overCost` = `totalCost > getCostCapForLevel(profile.level)`
- `isFull` = `totalCount >= DECK_MAX_CARDS`
- `slots[10]` = コスト順にソートしたエントリを 1 枚ずつフラット化、不足は null
- `filtered` = フィルタ + 検索 + ソート適用後のカードリスト

## アクション

```ts
addCard(id):
  const c = pool.find(...);
  const cur = getCount(id);
  if (cur >= DECK_MAX_SAME) return;
  if (totalCount >= DECK_MAX_CARDS) return;
  if (totalCost + c.cost > costCap) return;
  // upsert entry, count++

removeCard(id):
  // count--、0 になったらエントリ削除

clearDeck():
  // entries = []
```

## 推奨実装順
1. `Card` 型・`AttrKey` 型・`ATTR_INFO` を共通化（`src/lib/data/attributes.ts`）
2. `<CardArt>` 共通コンポーネント（`src/components/cards/CardArt.tsx`）
   — バトル・コレクション・ガチャでも再利用するので最初に作る
3. デッキ編集画面 `app/deck/page.tsx` を `deck.jsx` ベースで Next.js 化
4. 既存 `DeckContext` / 保存 API と接続
5. ヘッダーの「保存」を実機能にバインド

## 注意点
- HTML プロトタイプはあくまでビジュアルリファレンス。**ロジック・型は既存コード優先**。
- `src/lib/data/economy.ts` の定数は触らない（rule of single source）。
- 「保存」押下時のバリデーション（10 枚必須・コスト範囲内）はサーバー側でも再チェック。
- カード画像は `public/cards/<id>.png` のように個別ファイル配置を想定。プロトタイプではアセット数の都合で 3 種を使い回しているが、本実装では 1 カード = 1 画像。
- 画像未設定カードのフォールバックは、レアリティグラデ + 属性アイコン大表示で代替。
