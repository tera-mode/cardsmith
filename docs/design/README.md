# Handoff: Cardsmith — Dungeon Fantasy UI リデザイン

## 概要
既存の cardsmith（Next.js / React / Tailwind）の各画面を、`docs/design/battle_image.png` の世界観（地下迷宮・ルーン石・松明・金縁装飾）に揃えて作り替えるためのデザイン仕様。

対象画面：ホーム / ストーリー / バトル / コレクション / 鍛冶 / 召喚

## このバンドルについて
このフォルダの HTML / JSX / CSS は **デザインリファレンス** であって、そのままコピーして使う本番コードではありません。`tera-mode/cardsmith` の既存環境（Next.js 14 App Router + React 18 + Tailwind + Firebase）に **同じ見た目と挙動を再実装** してください。

## Fidelity
**Hi-fi（高忠実度）**。色・タイポ・余白・装飾・状態遷移まで本実装相当に詰めてあります。pixel-perfect での再現を想定。

ただしバトルの**ゲームロジックは簡易版**で、本物の `src/lib/game/rules.ts` `ai.ts` `skills.ts` をそのまま使ってください — 本ハンドオフはあくまで**ビジュアル/UX の指示書**です。

## トーン（採用：重厚）
このプロジェクトでは `tone = "heavy"` を採用します（地下迷宮・夜・松明）。`派手 / 渋い` のバリアントもプロトタイプ内 Tweaks に残してあるので、A/B で再考したい時の参考用に。

---

## デザイントークン（最終）

### Colors（採用：重厚 heavy）
```css
--bg-deep:      #0d0a06;   /* ページ最深部 */
--bg-stone:     #1a1410;   /* 石壁ベース */
--bg-panel:     rgba(28, 22, 16, 0.92);   /* パネル */
--bg-panel-soft:rgba(38, 30, 22, 0.85);

--border-rune:        rgba(196, 154, 90, 0.45);
--border-rune-bright: rgba(232, 192, 116, 0.85);

--gold:       #e8c074;   /* 金枠主色 */
--gold-deep:  #a87a36;   /* 金縁影 */
--gold-glow:  #ffd98a;   /* 発光ハイライト */

--rune-blue:  #5db8ff;   /* 自陣・移動可能ハイライト類 */
--rune-red:   #ff6b5b;   /* 敵陣・攻撃可能 */
--rune-green: #6bd998;   /* OK / cleared */

--text-primary:   #f4e9d4;
--text-secondary: #c5b294;
--text-muted:     #8a7a5e;
--text-dim:       #5a4f3d;

--hp-red:  #e85a4a;
--mp-blue: #4a9eff;

/* レアリティ */
--rarity-c:   #8a7a5e;
--rarity-r:   #5db8ff;
--rarity-sr:  #c478ff;
--rarity-ssr: #ff9d3a;
```

### Typography
- **Display**（章名・ボタン・ステータス・ロゴ）: `Cinzel` 400/500/600/700 — 大文字＋ letter-spacing 0.04〜0.12em で「碑文/巻物」感
- **Body**（カード名・本文・物語）: `Noto Serif JP` 400/700/900 — 重厚な明朝
- **UI**（フォーム・小さな注釈）: `Noto Sans JP` 400/500/700

Google Fonts での読み込み:
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;500;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

### Spacing / Radius / Shadow
- 基本余白: 4 / 6 / 8 / 10 / 12 / 14 / 16
- パネル radius: **4px**（角は鋭く＝石・金属の質感のため、丸めすぎない）
- カード radius: 6px
- パネル shadow: `inset 0 1px 0 rgba(232,192,116,0.2), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.5)`
- 金枠の発光: `0 0 16px rgba(232,192,116,0.5)`

---

## 共通ビジュアル要素

### 1. 石壁背景 `.stone-bg`
```css
background:
  radial-gradient(ellipse at 50% 30%, rgba(80, 60, 40, 0.4), transparent 70%),
  linear-gradient(180deg, #1a1410 0%, #0d0a06 100%);
/* + ::after で repeating-linear-gradient による石目地パターン */
```
全画面の地として使用。ページ全体に薄くかぶせる ambient overlay（radial gradient で四隅を暗くする）も併用。

### 2. 装飾パネル `.panel--ornate`
- 木目調グラデ背景＋金縁ボーダー（1px solid var(--gold-deep)）
- `::before` `::after` で**左上 / 右下のフィリグリー L 字**を描画（14×14、border-top+left のみ等）
- inset highlight + drop shadow で立体感

### 3. 松明 `.torch`
- 18×26px 装飾要素。`::before` で柄、`::after` で炎を radial gradient で描画
- `flicker` keyframes（0.4s alternate）で揺らぐ
- 画面の四隅・盤面サイドに配置

### 4. 金縁ボタン `.btn--primary`
- `linear-gradient(180deg, #d4942a → #8a5a18)`
- 1px solid var(--gold), inset highlight + drop shadow
- 文字色 `#1a0e02`（暗い金）、Cinzel 600
- hover で発光リング、disabled で錆色

### 5. ルーンタイル `.rune-tile`
- aspect-ratio: 1
- `radial-gradient + linear-gradient(160deg, #6a5e48 → #3a3224)` で石の凹凸
- 2px solid #2a2218、 inset で凸エッジ
- 中央に Cinzel の F/R/K/M/N/U/T/I/Æ/Þ 文字をうっすらレリーフで配置（透明度 0.55）
- バリアント: `--enemy`（赤）, `--player`（青）, `--highlight-{move|attack|summon}`, `--selected`

### 6. ハート `<Heart>`
- SVG path で実描画（絵文字は使わない）
- アクティブ時 `drop-shadow(0 0 3px #ff5a4a)`、非アクティブはグレースケール

### 7. ルーンジェム（通貨アイコン）
```css
clip-path: polygon(50% 0, 100% 35%, 80% 100%, 20% 100%, 0 35%);
background: linear-gradient(135deg, #6ec6ff, #2a6fdb);
filter: drop-shadow(0 0 4px rgba(74, 158, 255, 0.6));
```

### 8. 区切り線 `.divider-rune`
flex で `⚜ ラベル ⚜` 両側に金グラデーションの 1px ライン。

---

## 画面別仕様

### 01 ホーム (`app/page.tsx`)
**レイアウト**：縦スクロール、phone width。
1. ロゴヘッダー（`CARDSMITH` Cinzel 20px、サブタイトル `THE APEX RUNESMITH`）両脇に松明
2. プレイヤーバー：丸枠 Lv バッジ（金枠＋内側発光）/ EXP バー（青グラデ＋発光）/ ルーン残高
3. NEXT QUEST パネル — `panel--ornate`、左に絵文字、右に矢印
4. `⚜ メニュー ⚜` divider
5. メニュー 2列グリッド × 4行（ストーリー/自由対戦/コレクション/マテリアル/デッキ編集/鍛冶/ショップ/召喚）
   - 各タイル：ornate panel + accent カラー（メニュー固有）の右上 radial glow
6. サブメニュー（履歴・プロフィール）2列、軽いパネル

**メニュー accent color**：
- ストーリー `#5db8ff` / 自由対戦 `#e85a4a` / コレクション `#c478ff` / マテリアル `#8a7a5e`
- デッキ編集 `#22d3ee` / 鍛冶 `#e8a93a` / ショップ `#6bd998` / 召喚 `#ffd54a`

### 02 ストーリー (`app/story/page.tsx`)
- ヘッダー（戻る / 「ストーリー」 / ルーン残高）
- 章タブ（3章、Cinzel、`CHAPTER 1` ＋章名 2行、選択時は金下線＋発光）
- クエスト一覧：各クエストはパネル
  - 状態アイコン：`🔒 locked` / `▶ available`（金背景＋枠）/ `✓ cleared`（緑）
  - タイトル（Cinzel/Noto Serif）+ 説明 + 報酬（`+50 EXP` `+100 💎` `◆ 報酬カード`）
  - 右に「挑戦」ボタン（available は primary 金、cleared は ghost）

### 03 バトル (`app/play/page.tsx` + `src/components/game/*`)
**最重要画面**。レイアウトは縦に：
1. AI陣地 HP（赤グラデ + ハート3 + 数字）
2. 4×5 のルーンタイル盤面、上1行 enemy 赤・下1行 player 青、中3行 neutral
   - 四隅に小さな松明（横は壁のディテールとして）
3. 自陣 HP（青）
4. ターンインジケーター（`ターン N` ／ `▶ あなたのターン`）
5. ステップバー `◇ 召喚 — ◇ 移動 — ◇ 攻撃`（active / done で色変化）
6. ゲームログ（半透明、最新4行）
7. 選択中ユニット操作行（治癒兵なら ✨ 治癒 ボタン / 戻る ボタン）
8. 手札（横スクロール、card 100×140px、cost を右上の青いコイン）
9. ターン終了ボタン（金 primary 全幅）

**ユニット駒**：盤面セルに inset 配置、`.unit--player|enemy` で枠色。`hasActed` 時は opacity 0.5 + grayscale 0.5。アイコン＋名前＋ATK/HP の縦積み。

**操作フロー**：
- 手札カードタップ → `mode=summon`、自陣空きセルに金破線で召喚可能ハイライト → セルタップで召喚
- 自ユニットタップ → `mode=move`、移動可能セル緑、移動後 `mode=attack`、攻撃可能セル赤
- セルクリック → 行動実行

実装時は **既存の `GameProvider` / `rules.ts` / `ai.ts` をそのまま使い、見た目だけ差し替え** でOK。

### 04 コレクション (`app/collection/page.tsx`)
- ヘッダー
- カウンター行 `所持 N 種 / 全 13 種`
- 2列グリッド、各セル `.coll-card`：
  - レアリティバッジ（左上、レアリティ色の枠）
  - カウント `×N`（右上、金）
  - ポートレート（所持時）or 絵文字（未所持はグレースケール）
  - 名前 + `ATK N ・ HP N ・ CN`
  - 所持時のみ `抽出` ghost ボタン

### 05 鍛冶 (`app/forge/page.tsx`)
- ヘッダー右に `Lv1 ・ 上限 6`
- 中央に**プレビューカード**：下に radial glow（金床の熱）、未入力時は `?` 赤大文字
- フォーム行（パネル風、左ラベル幅70 + 右に選択肢）：
  - カード名（input）
  - 移動：前進1 / 跳躍2 / 十字1（segmented）
  - 攻撃範囲：近接 / 射程2 / 全方位
  - ATK：+1 / +2 / +3
  - HP：+1 / +2 / +3
  - スキル：任意
- 選択時のセグメントは金グラデ背景＋黒文字
- バリデーションエラー（赤字 bullet）
- `🔨 カードを鍛造する` 金 primary 全幅

cost = atk + hp×2 + (move?1:0) + (range?1:0)、`> 6` で COST が赤に。

### 06 召喚 (`app/gacha/page.tsx`)
- ヘッダー
- **魔法陣エリア**（高さ 180）：
  - 中央 ✨ アイコン、`標準召喚` Cinzel 18px 金、サブ「ルーンを捧げ、戦士を呼び出せ」
  - 後ろに 160×160 SVG（金 stroke の同心円＋五芒星＋8方向ルーン文字）— `animation: spin 30s linear infinite`
- 結果表示パネル（`pulled` 時のみ）：左に小カード、右にレアリティ色のテキスト（drop-shadow 発光）
- 単発召喚パネル（ornate）：200💎、金 primary
- 10連召喚パネル：1800💎、足りない時はディスエーブル＋赤字
- 排出率：`C 70% ・ R 22% ・ SR 7% ・ SSR 1%`（最下部 muted）

---

## アニメーション
- `flicker` 0.4s alternate — 松明の炎
- `pulse-summon` 1.4s ease-in-out — 召喚可能セル
- `spin` 30s linear — 魔法陣
- `fadein` 0.4s — 召喚結果出現
- 全 hover/active は 0.15s transition

---

## アセット
- `assets/p_healer.png` — 治癒兵（battle_image.png から切り出し）
- 他の12種カードは AI イラスト等で**同タッチ**を別途作る必要あり（プレースホルダーは絵文字で代用済み）
- `docs/design/battle_image.png` — 全体のトンマナ参照画像

---

## このバンドルの中身
- `Cardsmith Dungeon Redesign.html` — 全体ホスト
- `styles.css` — トークン＋共通スタイル（500行弱）
- `data.js` — 13種カードデータ＋移動/攻撃パターン＋初期バトル状態
- `components.jsx` — AppHeader / Heart / BaseHpBar / HandCard / MenuTile / Torch
- `battle.jsx` — 完全動作するバトル実装（移動/攻撃/AI 簡易ロジック）
- `screens.jsx` — Home / Story / Collection / Forge / Summon
- `assets/` — 切り出した画像
- `design-canvas.jsx` `tweaks-panel.jsx` — プロト用シェル（**実装不要**）

## 推奨実装順
1. **トークン整備** — `app/globals.css` に CSS 変数を移植、Tailwind config に色追加
2. **共通コンポーネント** — `<RunePanel>` `<RuneButton>` `<Torch>` `<HpBar>` `<Heart>` `<RuneTile>` を `src/components/ui/` に新規
3. **ホーム → ストーリー → コレクション → 召喚 → 鍛冶** の順（バトル以外）でビジュアル差し替え
4. **バトル**：`Board` `Hand` `BaseHpBar` `TurnIndicator` `TurnStepBar` `GameLog` を順次差し替え。ロジックは触らない
5. **カードイラスト**：13種を別途用意（AI 生成 or イラストレータ手配）
