# cardsmith — ストーリーキャラ ビジュアルデザイン仕様書 v2

ストーリーモード専用キャラの画像生成仕様。`mcp__gemini-image__generate_image` での画像生成、外注イラスト発注、ファンアート公開時の設定資料、すべてに使える共通仕様書。

> **既存の `chars_visual.md`（60ユニット用）との違い**：背景は完全透過、キャラ絵のみ。**ストーリー進行に必要な表情のみ**生成。ストーリー画面でテキスト枠の上に重ねる用途。

---

## 共通アートディレクション

### スタイル方針：シャドバtier × ストーリー演出特化

ユニットカードと同じ画風で統一感を保ちつつ、立ち絵としての可読性を優先する。

| 項目 | 指定 |
|---|---|
| 画風 | プロのファンタジーTCGイラスト／厚塗り風アニメ画 |
| 頭身 | **6〜7頭身（セミリアル）**／SD・チビは禁止 |
| 構図 | **腰上ショット中心**（顔と表情が読み取れる比率） |
| ポーズ | やや動きのある立ち姿／棒立ち禁止／斜めアングル推奨 |
| 塗り | 厚塗り風／光と影の階調豊か／**ソフトなリムライト** |
| **背景** | **完全透過（PNG透過）**／装飾エフェクトもキャラ近傍のみ |
| 衣装 | 装飾過多／フリル、刺繍、宝石、金属の質感、布の皺 |
| 解像度 | **1024×1024 PNG**（後処理で背景除去） |
| 文字 | **絶対に入れない** |
| 露出 | 中高生向け・控えめ／ただしブリギッタは大人の魅力を強調 |

### 背景透過の処理フロー

```
1. Gemini Imagenで「単色背景」を指定して生成
2. rembg（isnet-animeモデル）で背景除去
3. PNG透過で出力
```

### 必須プロンプト要素（全キャラ共通）

```
square 1:1 aspect ratio,
masterpiece quality professional fantasy character illustration,
Shadowverse Cygames card art style,
detailed painterly anime art with semi-realistic proportions,
six to seven heads tall figure, NOT chibi NOT super deformed,
upper body composition centered, half body or chest up shot,
slight three-quarter angle pose with subtle movement,
soft cinematic lighting with rim light separating subject from background,
expressive detailed face with eyes catching light,
intricate costume details with ornate decorations, embroidery, fabric folds, metal texture,
PLAIN solid color background for easy removal,
official illustration quality, highly detailed,
absolutely NO text NO letters NO words NO numbers
```

---

## 確定済み生成設定（実績ベース・2026-05-10）

> 以下は実際に生成・承認されたスタイル設定。新規キャラを生成する際はこのテンプレートを使うこと。

### 確定プロンプトテンプレート

```
square 1:1 aspect ratio, masterpiece quality professional fantasy character portrait,
semi-realistic anime art style with detailed painterly shading,
anime character proportions combined with realistic lighting and material rendering,
similar to Granblue Fantasy or Fate Grand Order character illustration quality,
NOT western fantasy realism, NOT flat cel-shaded anime,
six to seven heads tall figure NOT chibi,
waist-up half body composition showing from waist or belt area at the bottom edge of frame up to above the head,
character clearly fills the full height of the frame with waist visible at bottom,
soft cinematic lighting with rim light separating character from background,
expressive semi-realistic anime face with detailed eyes catching light,
intricate costume details with fabric folds and material texture,
PLAIN SOLID GRAY background,
official illustration quality highly detailed,
absolutely NO text NO letters NO words NO numbers NO watermark,
{キャラクター固有ENプロンプト},
{表情キーワード}
```

### ポイント（失敗から学んだ注意点）

| 項目 | 正しい設定 | やってはいけない |
|------|-----------|----------------|
| 画風参照 | `Granblue Fantasy or Fate Grand Order` | `Shadowverse Cygames card art style`（アニメ寄りすぎになる） |
| 背景色 | `PLAIN SOLID GRAY background` | `white background`（白キャラで輪郭が取れない） |
| 構図 | `waist-up ... waist or belt area at the bottom edge of frame` | `chest up shot`（下端が胸で切れてしまう） |
| スタイル否定 | `NOT western fantasy realism, NOT flat cel-shaded anime` | なし（どちらかに偏る） |

---

### NGプロンプト

```
chibi, SD, super deformed, three head proportions, child proportions,
flat anime coloring, full body shot only,
busy background, complex scenery, multiple subjects,
text, watermark, signature, low quality,
realistic photo, 3D render, blurry, deformed
```

---

## 表情の方針（v2改訂）

**ストーリー進行に必要な分だけ生成する。** 全表情を一律で揃えるのではなく、各キャラがストーリーで実際に見せる感情のみに絞る。

### キャラ別の必要表情リスト

各キャラの「ストーリーでの登場シーン」から逆算した、最小限の必要表情。

| キャラ | 必要表情 | 表情数 |
|---|---|---|
| **神** | smile（基本・調子よい）／embarrassed（しまった顔）／wink（茶目っ気） | 3 |
| **主人公** | calm／serious（決意）／surprised（驚き）／smile（笑顔） | 4 |
| **ブリギッタ** | calm（職人モード）／strict（ダメ出し）／soft（嫌いじゃない時）／surprised（最高傑作を見た時）／drunk（酔って甘える） | 5 |
| **ニケ** | calm／happy（憧れ満載）／sad（母を思い出す）／determined（弟子になる決意） | 4 |
| **アリエル** | calm（高慢）／angry（悔しがる）／surprised（動揺）／embarrassed（認める時） | 4 |
| **ガロン** | angry（凄む）／surprised（敗北の瞬間）／smile（兄貴分認定） | 3 |
| **クラリス王女** | calm（王族の威厳）／serious（依頼する時）／smile（個人として話す時） | 3 |
| **ザカリア大公** | serious（威圧）／angry（異端と断じる）／defeated（負けを認める） | 3 |
| **フウマ** | calm（虚無）／smile（歪んだ）／surprised（過去を思い出す） | 3 |
| **ガロムおやじ** | smile（陽気）／serious（重い話） | 2 |
| **メリス** | smile（商談）／serious（見極め） | 2 |
| **ガルガン** | serious（戦闘前）／smile（実戦を語る） | 2 |
| **アシュリー** | smile（基本陽気）／surprised（驚き） | 2 |
| **ギルマス** | calm（威厳）／smile（認める時） | 2 |
| **賢者セレス** | calm（神秘的）／serious（伝説を語る時） | 2 |
| **ニケの母** | weak（病弱・基本）／smile（回復後） | 2 |

**合計：50枚** （v1では100枚超だったので半減）

### 表情の英語キーワード

| 表情ID | 英語キーワード |
|---|---|
| `calm` | `neutral calm expression, eyes looking softly forward, mouth closed gently` |
| `smile` | `soft genuine smile, eyes softly squinted, slight upturn of lips` |
| `happy` | `bright joyful smile, teeth showing slightly, eyes shining with happiness` |
| `angry` | `furrowed brows, frowning mouth, intense scowling eyes` |
| `serious` | `determined sharp eyes, mouth set firmly, focused expression` |
| `surprised` | `wide open eyes, raised eyebrows, mouth slightly agape` |
| `sad` | `downcast eyes, slight frown, melancholy expression, glistening eyes` |
| `embarrassed` | `flushed cheeks, eyes darting away, awkward small smile` |
| `determined` | `intense focused gaze, lips pressed firmly, resolute expression` |
| `strict` | `sharp critical gaze, mouth set in disapproving line, arms crossed posture suggested` |
| `soft` | `subtle softening of expression, slight warmth in eyes, almost-smile` |
| `drunk` | `flushed cheeks from alcohol, droopy half-lidded eyes, loose vulnerable smile` |
| `wink` | `playful wink with one eye, mischievous smile, tongue slightly out` |
| `defeated` | `eyes downcast in defeat, mouth slightly open in disbelief, broken expression` |
| `weak` | `tired weakened expression, eyes half-lidded, pale skin, slight smile of endurance` |

---

## 主要ストーリーキャラ仕様

### story_god — 神（プロローグの存在）

**設計方針**：ストーリー冒頭で主人公にカード創造スキルを授ける存在。神の威厳ではなく、「**普通の調子よい天然女子（ただし最強）**」というギャップで序盤のトーンを軽快に。なろう系の典型を踏まえつつ、後半の重厚な展開とのコントラストを作る。

- **核**：21歳ぐらいの見た目／金髪長髪美女／神様らしくない普通のお姉さん／**異常に強い**
- **髪**：**眩い金髪**／**腰まで伸びるロング**／緩やかなウェーブ／時々勝手に風で揺れる
- **目**：**明るい青／猫目寄り**／いたずらっぽい／瞳孔の中に小さな星
- **体型**：標準身長／**スレンダー**だが胸はそこそこある／姿勢はだらしなくも自然
- **服装**：
  - **白いゆったりとしたチュニックドレス**（神様らしい古典衣装だが、本人がだらしなく着崩している）
  - **金の細いベルト**を腰に
  - 肩を片方出していたり、裾が乱れていたり
  - **裸足**または**サンダル**（神様らしくない）
  - 装飾は最小限（神は本来威厳が必要だが、本人は気にしていない）
- **武器・小物**：
  - **特になし**（武器を持つ必要がない強さ）
  - 時々**カラフルな飴**を口に咥えている
  - 手に**カードらしき光るもの**（主人公に渡そうとしている）
- **特徴**：
  - **背中に淡い金の光輪**（ハロー）／消えたり現れたり
  - 周囲に**金と白の光の粒子**
  - **ふわふわと地上から数センチ浮いている**
  - 表情は基本ニコニコ、でも重要な瞬間だけ目の奥に**底知れぬ深さ**が宿る
- **★識別**：金ロング × 白チュニック × ふわふわ浮遊 × 飴
- **EN**：`anime divine young woman appearing 21 years old, long flowing golden hair to waist with gentle waves moved by mysterious breeze, bright playful blue cat-like eyes with tiny stars in pupils, slim figure with natural casual posture, loose white tunic dress carelessly worn with one shoulder slipping, slim gold belt at waist, barefoot, faint golden halo behind head appearing and disappearing, golden and white light particles surrounding, hovering few centimeters above ground, holding glowing card-like light in one hand, colorful candy in other hand, mischievous casual cheerful expression, ethereal yet approachable, plain solid color background`

**表情指定**：
- `smile`：ニコニコ顔／飴を咥える／「やほー、転生してきた子？」感
- `embarrassed`：「あっ、しまった！」／頬を赤らめ目を逸らす／天然のミス
- `wink`：片目を瞑り舌を少し出す／いたずらっ子の顔／「がんばってねー」感

**重要な演出注記**：
- プロローグでは「**神に会ったはずなのに何だこの軽さ**」というプレイヤーの驚きを引き出す
- 神の力の片鱗を見せる場面では、表情は smile のままで周囲のエフェクトだけが派手になる（表情と力のギャップ）
- エピローグでも再登場、最後は wink で送り出す

---

### story_player — 主人公

**設計方針**：寺本さん指示「**個性を出さない普通のイケメン**」。プレイヤーが感情移入しやすいよう、強い特徴は避ける。

- **核**：転生者。普通のイケメン。男性のみ
- **年齢**：見た目16-17歳前後
- **髪**：**黒髪**／**標準的なミディアムショート**／前髪は普通に整っている
- **目**：濃い茶色／普通の二重／目力はあるが派手ではない
- **体型**：標準身長（170cm前後）／華奢でも筋肉質でもない普通の体型
- **服装**：
  - **シンプルな白の長袖シャツ**
  - **黒のベスト**
  - **革のエプロン**（ブリギッタからの借り物、茶色）
  - **革のブーツ**（茶色）
  - 飾り気のない実用的な装い
- **武器・小物**：
  - 右手に**鍛冶用の小ハンマー**
  - 首から下げた**古い指輪**（前世の自分のもの）
- **特徴**：
  - **左手の甲に淡い光の紋章**（白紙のスキルの印）
  - 周囲に時折**半透明の白い光の粒子**（思考の可視化／控えめに）
- **★識別**：黒髪ミディアムショート × 革エプロン × 左手甲の光る紋章
- **EN**：`anime young handsome boy 16-17 years old, plain typical good looks without strong distinctive features, neat black medium-short hair with standard styled bangs, dark brown eyes with normal almond shape, average build at 170cm height, simple white long-sleeve shirt under black vest, brown leather blacksmith apron borrowed and slightly large, brown leather boots, holding small craftsman hammer in right hand, old ring pendant on neck, glowing pale rune mark on left hand back, faint white light particles around hands, calm thoughtful expression, plain solid color background`

**表情指定**：
- `calm`：基本表情／少し考え込んでいる感じ
- `serious`：決意した時／カード融合に集中する時
- `surprised`：神に出会った時／神の正体に気づいた時／大事件に遭遇した時
- `smile`：ニケに教える時／達成感がある時の柔らかい表情

---

### story_brigitta — 師匠ブリギッタ・フォルジエ（v2修正：見た目24歳）

**設計方針**：寺本さん指示「**見た目24歳ぐらい**」。これにより、師匠としての威厳と、主人公にとっての異性としての魅力を両立する。120歳超という設定はそのまま、見た目だけを若く修正。

- **核**：「炉の前の女王」。元エリート鍛冶閥のSランクスミス。**見た目24歳**だが実年齢120歳超。過去に多くの削り屋を死なせた罪を背負う
- **髪**：プラチナブロンド／**サイドアップに編み込んだ太い三つ編み**／後ろに長く垂らす
- **目**：琥珀色／**炉の火を映すと赤く光る**／鋭い眼差しの中に若さも残る
- **体型**：身長178cm／引き締まった上腕／グラマラス／**24歳の若々しさと熟練の所作の同居**
- **服装**：
  - **厚手の黒革エプロン**（胸元から腿まで覆う）
  - その下は**黒のフィットしたボディスーツ的な作業着**（露出は腕と脚）
  - エプロンの下のボディスーツに**Vカット**
  - 太腿に**焼けた革のホルスター**（小型工具）
- **武器**：右手に長柄の鍛冶ハンマー
- **特徴**：
  - **左腕に古い火傷痕**（誇りにしている／ただし24歳の若い肌に古傷というギャップ）
  - **首から下げた小さな鎚のペンダント**（亡き弟子の形見）
  - 右手に細い**パイプ**（薬草、職人の集中促進）
- **★識別**：プラチナのサイドアップ三つ編み × 黒革エプロン × 鎚のペンダント
- **年齢設定の演出方針**：見た目は24歳のお姉さんだが、所作・口調・経験量で「ただ者じゃない」感を出す。これは後の「実は120歳超」の判明シーンで効果を発揮する
- **EN**：`anime master female blacksmith appearing 24 years old, glamorous tall figure 178cm with toned muscular arms, platinum blonde hair in thick side braid falling long behind, fierce amber eyes that catch firelight, youthful beauty combined with experienced presence, heavy black leather forge apron over form-fitting black work outfit with V-neckline exposing collarbone, leather thigh holster with small tools, old burn scars on left arm contrasting with young skin, small hammer pendant on neck, holding long-handled smithing hammer, thin pipe in fingers, dignified yet sensual presence, plain solid color background`

**表情指定**：
- `calm`：職人モード／無表情に近い集中
- `strict`：ダメ出しの時／「重心が浮いてる」と言う時の鋭い目
- `soft`：「嫌いじゃない」と言う時の、ふっと和らぐ表情
- `surprised`：主人公の最高傑作を見た時／珍しく目を見開く
- `drunk`：酔って甘える時／頬を赤らめ、普段の威厳が崩れる／「ぼくはな……」の場面

---

### story_nike — 弟子志望ニケ・ヴィエンタ

- **核**：下層民出身の15歳少女。母は元削り屋（病弱）。コモンスキル「植物の声を聞く」持ち。主人公の鍛冶を見て初めて希望を知る
- **髪**：茶色／**おさげの三つ編みを左右ひとつずつ**／前髪は流す
- **目**：大きな緑の瞳／**そばかすが鼻にちらほら**
- **体型**：少年体型／華奢／低身長（150cm前後）
- **服装**：
  - **薄手のベージュのワンピース**（裾はすり減って色褪せ）
  - その上に**革の鍛冶屋エプロン**（自分用に小さく作り直したもの）
  - **革のサンダル**（つま先がほつれ気味）
- **武器・小物**：
  - 首から下げた**小さな葉のお守り**（母から譲られた）
- **特徴**：
  - 手の指に**植物の汁の汚れ**
- **★識別**：茶色のおさげ × そばかす × 革エプロン（小サイズ）
- **EN**：`anime humble girl 15 years old, brown hair in twin braids with floating bangs, big green eyes with freckles on nose, petite slim build 150cm, beige worn dress under small leather blacksmith apron, weathered leather sandals, leaf charm pendant, plant ink stains on fingers, hopeful innocent expression, plain solid color background`

**表情指定**：
- `calm`：静かに観察する顔
- `happy`：主人公のカードを見て目を輝かせる時／憧れ満載
- `sad`：母を思い出す時／涙ぐむ
- `determined`：弟子になる決意を固めた時

---

### story_ariel — 同期女・アリエル・サリヴァン

- **核**：名門カードスミス家系の長女、19歳。SRスキル「氷魔術」持ち。ツンデレ系ライバル
- **髪**：プラチナブロンド／**腰までのストレートロング**／前髪は揃える
- **目**：澄んだ青／鋭い／長い睫毛
- **体型**：標準身長／グラマラスだが本人が隠しがち
- **服装**：
  - **上品な白の貴族風ジャケット**（金縁、刺繍）
  - 中に**淡い水色のブラウス**
  - **ロング丈のスカート**（深青）
  - **白の絹手袋**
  - **革の編み上げブーツ**
- **武器**：氷の魔導書／詠唱時は周囲に氷の結晶
- **特徴**：
  - **首に青いサファイアのチョーカー**（家紋入り）
- **★識別**：プラチナのストレートロング × 白手袋 × 青サファイアのチョーカー
- **EN**：`anime noble girl 19 years old, platinum blonde long straight hair to waist with even bangs, sharp blue eyes with long lashes, refined glamorous figure with proud posture, white aristocratic jacket with gold trim and embroidery over pale blue blouse, dark blue long skirt with ornate embroidery, white silk gloves, leather lace-up boots, blue sapphire choker with family crest, holding ice grimoire with frost crystals around, condescending uncertain expression, plain solid color background`

**表情指定**：
- `calm`：高慢な貴族の顔
- `angry`：主人公に負けて悔しがる時
- `surprised`：主人公の能力に動揺する時
- `embarrassed`：認める時の頬を赤らめる顔／「悔しいけれど…」の表情

---

### story_garon — 同期男・ガロン・グランツ

- **核**：22歳、庶民出身、Cスキル「鋼の意志」持ち。努力で這い上がった叩き上げ
- **髪**：短髪の赤毛／少し荒れた感じ
- **目**：日に焼けた肌に映える琥珀色／頬の傷跡
- **体型**：高身長（185cm）／筋肉質
- **服装**：
  - **工場ジャンパー**（焦げ穴あり、煤汚れ）
  - **油まみれの茶色のズボン**
  - **金属プレートのついた厚いブーツ**
  - 額に**作業ゴーグル**を上げた状態
- **武器**：肩に担いだ大型の鍛冶ハンマー／腰のベルトに工具多数
- **★識別**：赤毛 × 工場ジャンパー × 額のゴーグル
- **EN**：`anime working class young man 22 years old, short tousled red hair, sun-tanned skin with scar on cheek, amber eyes, tall muscular build 185cm, scorched factory jacket with smudges over bare chest, oil-stained brown pants, heavy metal-plated boots, work goggles pushed up on forehead, large smithing hammer on shoulder, tool belt with various wrenches, gruff expression, plain solid color background`

**表情指定**：
- `angry`：凄む時／「ふん、新参者か？」の時
- `surprised`：主人公に敗北する瞬間
- `smile`：兄貴分として認めた後の豪快な笑み

---

### story_clarice — 王女クラリス・エルナクロス

- **核**：21歳、王国第二王女、SSRスキル「権威の言霊」持ち
- **髪**：銀髪／**ロングストレート**／頭頂に**金の細いティアラ**
- **目**：サファイア色／知的／長い睫毛
- **体型**：標準身長／凛とした姿勢
- **服装**：
  - **白と青の王族ドレスアーマー**
  - 銀の胸当て、青いケープ
  - **金の刺繍が随所に**
  - 革の長ブーツ（白×銀）
- **武器**：背中に**細身の儀礼剣**
- **★識別**：銀ロング × 金のティアラ × 白×青の王族ドレスアーマー
- **EN**：`anime warrior princess 21 years old, silver long straight hair, slim golden tiara on head, intelligent sapphire blue eyes with long lashes, tall regal posture, white and blue royal dress armor, silver chest plate with blue cape, gold embroidery throughout, white silver leather long boots, royal crest pendant, ceremonial sword on back, dignified expression, plain solid color background`

**表情指定**：
- `calm`：王族の威厳ある顔
- `serious`：依頼を持ちかける時の真剣な表情
- `smile`：個人として打ち解けた時の柔らかい表情

---

### story_zacaria — 大公ザカリア・ラルガニア

- **核**：45歳、SSR「契約強制」持ち、最高位の大鍛冶閥の頭目
- **髪**：グレーロング／**髪を後ろに撫でつけた紳士スタイル**／白髪混じり
- **目**：氷のような淡灰／**片眼鏡**
- **体型**：痩身／長身（185cm）
- **服装**：
  - **ダークグレーの貴族長コート**（金釦）
  - 中に**深紅の布地のヴェスト**
  - **黒のシルクの上品なシャツ**
  - **金の懐中時計の鎖**
  - **革の手袋**（黒）
  - **杖**（金の頭、装飾的）
- **★識別**：グレー後撫でつけ × 片眼鏡 × 金の杖
- **EN**：`anime aristocrat man mid-40s, gray slicked-back long hair with white streaks, cold pale gray eyes with monocle, tall slim 185cm with perfect posture, dark gray noble long coat with gold buttons, deep crimson vest, black silk shirt, gold pocket watch chain, black leather gloves, ornate gold-headed cane, intimidating dignified presence, plain solid color background`

**表情指定**：
- `serious`：威圧する時の冷たい目
- `angry`：「異端だ！」と断じる時
- `defeated`：負けを認める瞬間／崩れ落ちる威厳

---

### story_fuma — もう一人の転生者・フウマ

- **核**：30年前にこの世界に転生した日本人。絶望し支配側に転向。中性的
- **髪**：漆黒／**長い後ろ流し**／前髪は片目を隠す
- **目**：見える方の目は深い金色／光のない瞳
- **体型**：高身長（180cm前後）／中性的な細身
- **服装**：
  - **和洋折衷の黒い長衣**
  - 内に黒い裾長のシャツ
  - **黒の幅広帯**
  - **黒の革ブーツ**
  - **金の刺繍が裾と袖口**
- **武器**：日本刀風の**長い柄の鍛冶ハンマー**
- **特徴**：
  - **左手の甲に主人公と同じ光る紋章**（**赤紫色**で歪んでいる）
  - 周囲に半透明の文字（漢字や数字）
- **★識別**：黒の長髪片目隠し × 和洋折衷の黒長衣 × 左手の歪んだ赤紫紋章
- **EN**：`anime androgynous transmigrated person, black long hair flowing back with bangs covering one eye, lifeless deep gold eyes, tall slim androgynous build 180cm, black hybrid Japanese-Western long robe with gold embroidery on hem and cuffs, wide black sash, black leather boots, wielding katana-style long-handled hammer, distorted reddish-purple rune mark on left hand, semi-transparent floating Japanese kanji and numbers around, melancholic expression, plain solid color background`

**表情指定**：
- `calm`：虚無の表情／生気のない顔
- `smile`：歪んだ笑み／支配者の余裕
- `surprised`：主人公を見て自分の30年前を思い出した瞬間／久しぶりに見せる人間らしい表情

---

## サブキャスト仕様

### story_garomu — 酒場の主ガロムおやじ

- **核**：55歳、酒場「金槌亭」の主、ブリギッタの古い友
- **髪**：禿げ上がった頭頂／白髭
- **体型**：太め／恰幅良い
- **服装**：白いシャツ／茶色のベスト／酒で汚れた前掛け
- **★識別**：禿げ × 白髭 × 酒の前掛け
- **EN**：`anime tavern master old man mid-50s, bald head with thick white beard, kindly squinting eyes with wrinkles, plump build, white shirt under brown vest, alcohol-stained apron, wooden mug in hand, warm welcoming expression, plain solid color background`

**表情指定**：
- `smile`：陽気に客を迎える時
- `serious`：重い噂を語る時の引き締まった顔

---

### story_meris — 商人ギルドのメリス

- **核**：38歳、商人ギルドの女傑
- **髪**：黒髪／**シニヨン**／前髪は流す
- **目**：濃いブラウン／鋭い
- **服装**：濃緑のビジネス風ロングドレス／真珠のネックレス／革のグローブ／革のヒール
- **★識別**：黒シニヨン × 真珠のネックレス × 帳簿
- **EN**：`anime mature businesswoman late-30s, black hair in elegant chignon with sweeping bangs, sharp dark brown eyes, mature glamorous figure, dark green business long dress with gold trim, pearl necklace, fingerless leather gloves, leather heels, holding feather pen and ledger, calculating intelligent expression, plain solid color background`

**表情指定**：
- `smile`：商談で機嫌が良い時
- `serious`：価値を見極める時の鋭い目

---

### story_gargan — 冒険者頭領ガルガン

- **核**：30歳、冒険者ギルドの上位
- **髪**：金茶／短髪刈り上げ／日焼け
- **目**：濃緑／傷跡が左目の上
- **体型**：高身長（190cm）／屈強
- **服装**：焦げた革鎧／毛皮のマント／重いブーツ
- **武器**：両手剣（背中）／腰に短剣
- **★識別**：金茶刈り上げ × 焦げた革鎧 × 両手剣
- **EN**：`anime adventurer captain 30 years old, golden-brown short cropped hair, sun-tanned skin with scar above left eye, sharp green eyes, towering muscular build 190cm, scorched leather armor, fur cape, heavy boots, two-handed sword on back, gruff battle-hardened expression, plain solid color background`

**表情指定**：
- `serious`：戦闘前の引き締まった顔
- `smile`：実戦の手応えを語る時の豪快な笑み

---

### story_ashley — ギルド受付嬢アシュリー

- **核**：22歳、カードスミスギルドの受付
- **髪**：オレンジブロンド／肩までのウェーブ／**サイドにリボン**
- **目**：青／明るい
- **服装**：**ギルド制服**（白×紺、金釦）
- **★識別**：オレンジウェーブ × ギルド制服 × サイドリボン
- **EN**：`anime guild receptionist 22 years old, orange blonde shoulder length wavy hair with side ribbon, bright blue smiling eyes, slim build, white and navy guild uniform with gold buttons, white gloves, navy skirt with white tights, black leather shoes, holding registration ledger and feather pen, cheerful welcoming expression, plain solid color background`

**表情指定**：
- `smile`：陽気な基本表情
- `surprised`：主人公の活躍を聞いて驚く時

---

### story_gladius — ギルマス・グレディウス

- **核**：52歳、カードスミスギルドの長
- **髪**：銀グレー／後ろで一つ結びの長髪／白髭（短く整えた）
- **目**：青／渋い
- **体型**：高身長／重厚
- **服装**：深い茶色のロングコート／白いシャツ／革のブーツ／装飾的なベルト
- **★識別**：銀グレー一つ結び × 深い茶のロングコート × 古い鍛冶ハンマー
- **EN**：`anime guild master 52 years old, silver-gray long hair tied back, neatly trimmed beard, weathered blue eyes with wrinkles, tall solid build, deep brown long coat over white shirt, ornate belt, leather boots, holding venerable smithing hammer, dignified veteran craftsman expression, plain solid color background`

**表情指定**：
- `calm`：威厳ある通常の表情
- `smile`：主人公を認めた時の柔らかい微笑

---

### story_seles — 賢者セレス・ルミナ

- **核**：外見25歳・実年齢200歳超のエルフ族
- **髪**：薄い金／**腰までのストレート**／月光のような淡い輝き
- **目**：紫／神秘的／瞳孔が縦長気味
- **服装**：深紫×金の魔導士ローブ／淡い銀のドレス／**エルフ耳**
- **武器・小物**：水晶の杖／古書を浮遊
- **★識別**：金ロング × 紫×金のローブ × 浮遊する古書
- **EN**：`anime elf sage woman appearing mid-20s but ancient, pale gold long straight hair with moonlight glow, mystical purple eyes with slit pupils, slim ethereal figure, deep purple and gold mage robe with constellation embroidery, silver dress beneath, long pointed elven ears with jewel ornaments, crystal staff, ancient book floating beside her, faint glowing ancient runes around, serene mystical expression, plain solid color background`

**表情指定**：
- `calm`：神秘的な基本表情
- `serious`：500年前の伝説を語る時の重い表情

---

### story_nike_mother — ニケの母

- **核**：元削り屋。植物のスキルを売り続けて病弱に
- **髪**：茶色（ニケと同色）／だらりと長く乱れる／白髪混じり
- **目**：くすんだ緑／疲れた／時折温かい
- **体型**：痩せ細った／病弱
- **服装**：**ベージュの簡素な部屋着**／毛布を肩にかける
- **★識別**：茶色の乱れ髪 × 痩せた頬 × 毛布
- **EN**：`anime ailing mother woman late-30s wasted by labor, brown disheveled long hair with gray streaks, tired green eyes, painfully thin build seated, simple beige nightwear, blanket over shoulders, weary but loving expression, plain solid color background`

**表情指定**：
- `weak`：基本の病弱な表情
- `smile`：（救済イベント後の）回復後の柔らかい微笑

---

## 章別必要キャラクター早見表

### 第0章：転生・出会い
- **story_god**（プロローグ・登場）
- story_player
- story_brigitta（出会い）

### 第1章：エルナ街の希望
- story_player, story_brigitta
- story_nike, story_nike_mother
- story_garon（決闘）
- story_garomu（酒場シーン）

### 第2章：ギルド進出
- story_player, story_brigitta, story_nike, story_garon
- story_ariel（初対立）
- story_ashley（受付）
- story_gladius（ギルマス）

### 第3章：街の変革
- 既出キャラに加え：
- story_meris（商人ギルド）
- story_gargan（冒険者）

### 第4章：体制との対決
- story_zacaria（大公）
- story_clarice（王女・初登場）
- story_seles（賢者・ヒント役）

### 第5章：王国の使命
- story_clarice 中心
- 既出キャラ総出演

### 第6章：もう一人の転生者
- story_fuma
- story_player, story_brigitta（クライマックス）

### エピローグ
- **story_god**（エンディング・再登場）
- 既出全キャラ

---

## 画像生成・後処理の手順

### Step 1：Gemini Imagenでベース生成

```
プロンプト = 共通必須要素 + キャラENプロンプト + 表情指定 + plain solid color background + NG
出力先 = public/images/story_chars/raw/{charId}_{expression}.png
```

### Step 2：rembgで背景除去

```python
from rembg import remove, new_session
from PIL import Image

session = new_session("isnet-anime")
input_image = Image.open(f"raw/{char_id}_{expression}.png")
output = remove(input_image, session=session)
output.save(f"story_chars/{char_id}_{expression}.png")
```

### Step 3：検証

**シャドバtier基準**:
- [ ] 頭身が6〜7（SD/チビではない）
- [ ] 厚塗り風の塗り
- [ ] 衣装の装飾が細かい
- [ ] リムライト（背景透過時の輪郭分離）が入っている
- [ ] 表情が指定通り

**透過処理の品質チェック**:
- [ ] 背景が完全透過（PNG透過チャンネル正常）
- [ ] 輪郭にハロー（白い縁）が残っていない
- [ ] 髪の毛先・服のフリンジが綺麗に切り抜かれている
- [ ] 白い衣装のキャラ（神、クラリス王女）で背景と肌の境界が崩れていない
- [ ] 半透明エフェクト（光の粒子等）が適切に処理されているか

---

## ファイル命名規則

```
public/images/story_chars/
├── raw/                              # 後処理前
│   ├── story_god_smile.png
│   ├── story_god_embarrassed.png
│   ├── story_god_wink.png
│   ├── story_brigitta_calm.png
│   └── ...
├── story_god_smile.png               # 後処理後（透過）
├── story_god_embarrassed.png
├── story_god_wink.png
├── story_brigitta_calm.png
├── story_brigitta_strict.png
└── ...
```

---

## サンプル生成順序（推奨）

最初に **重要キャラ4体の代表表情**で画風統一を確認：

1. `story_god_smile`（プロローグ最重要、軽快なトーンの確立）
2. `story_brigitta_calm`（主役級、見た目24歳の確認）
3. `story_player_calm`（主人公の方向性確認）
4. `story_nike_calm`（華奢キャラの透過品質テスト）

→ 4体OKなら、各キャラの全表情を生成 → 計50枚を順次生成

---

## 制作ロードマップ（v2改訂）

### Phase 1（最優先・3-5日）：第0章キャラ
- story_god（3表情）
- story_player（4表情）
- story_brigitta（5表情）
- 計12枚

これでプロローグが画的に完成する。

### Phase 2（5-7日）：第1章キャラ
- story_nike（4表情）
- story_garon（3表情）
- story_garomu（2表情）
- story_nike_mother（2表情）
- 計11枚

第1章が完成。

### Phase 3（7-10日）：第2-3章キャラ
- story_ariel（4表情）
- story_ashley（2表情）
- story_gladius（2表情）
- story_meris（2表情）
- story_gargan（2表情）
- 計12枚

### Phase 4（5-7日）：終盤キャラ
- story_clarice（3表情）
- story_zacaria（3表情）
- story_seles（2表情）
- story_fuma（3表情）
- 計11枚

**累計：46枚**（v1の100枚超から半減）

---

## 完了済みベース画像（2026-05-10時点）

### 透過済み確定ファイル（`public/images/story_chars/`）

| ファイル名 | キャラ | 表情 | 状態 |
|---|---|---|---|
| `story_god_smile.png` | 神 | smile | ✅ 完了 |
| `story_player_calm.png` | 主人公 | calm | ✅ 完了 |
| `story_brigitta_calm.png` | ブリギッタ | calm | ✅ 完了 |
| `story_nike_calm.png` | ニケ | calm | ✅ 完了 |
| `story_garon_angry.png` | ガロン | angry | ✅ 完了 |
| `story_garomu_smile.png` | ガロムおやじ | smile | ✅ 完了 |
| `story_nike_mother_weak.png` | ニケの母 | weak | ✅ 完了 |

### 未着手（表情差分・残キャラ）

- **第0章表情差分**：神（embarrassed/wink）、主人公（serious/surprised/smile）、ブリギッタ（strict/soft/surprised/drunk）
- **第1章表情差分**：ニケ（happy/sad/determined）、ガロン（surprised/smile）、ガロムおやじ（serious）、ニケの母（smile）
- **第2〜6章キャラ**：アリエル、アシュリー、ギルマス、メリス、ガルガン、クラリス、ザカリア、セレス、フウマ

---

## 改訂履歴

- **v2.0**（2026-05-10）：寺本さん指示反映。
  - 神を主要キャラとして詳細設計（金髪長髪美女、調子よい天然、ただし最強）
  - ブリギッタの見た目年齢を24歳に修正
  - 主人公を「個性出さない普通のイケメン男性」に統一
  - 表情数をストーリー進行に必要な分だけに絞り込み（合計46枚に半減）
  - 10年後キャラを今回の対象外に
- v1.0（2026-05-10）：初版