# cardsmith — 60キャラ ビジュアルデザイン仕様書

`mcp__gemini-image__generate_image` での画像生成、外注イラスト発注、ファンアート公開時の設定資料、すべてに使える共通仕様書。各キャラの**識別トライアングル（色×形×小物）**を明示してあるので、シルエットで一発判別可能なデザインに収束する。

---

## 共通アートディレクション

### スタイル方針：シャドバtier

Cygames『Shadowverse』のカードイラストを参考にする。**SD・チビ画風は完全NG**。

| 項目 | 指定 |
|---|---|
| 画風 | プロのファンタジーTCGイラスト／厚塗り風アニメ画 |
| 頭身 | **6〜7頭身（セミリアル）**／SD・チビ・3頭身は禁止 |
| 構図 | **動的なポーズ**（剣を構える、振り向く、跳躍中、魔法詠唱中）／棒立ち禁止／斜めアングル推奨 |
| 塗り | 厚塗り風／光と影の階調豊か／**リムライト**（背後からの輪郭光） |
| 背景 | 奥行き＋被写界深度（DoF）＋粒子エフェクト（光、火花、花びら、雪、煤、雷） |
| 衣装 | 装飾過多／フリル、刺繍、宝石、金属の質感、布の皺 |
| 解像度 | **1024×1024 PNG**（MCP出力固定） |
| 文字 | **絶対に入れない**（NO text, NO letters, NO numbers, NO kanji, NO hiragana, NO katakana） |
| 露出 | 中高生向け・控えめ（武器とコスチュームで個性を立てる） |

### 必須プロンプト要素（全キャラ共通）

```
square 1:1 aspect ratio,
masterpiece quality professional fantasy trading card game illustration,
Shadowverse Cygames card art style, 
detailed painterly anime art with semi-realistic proportions, 
six to seven heads tall figure, NOT chibi NOT super deformed,
dynamic action pose at dramatic three-quarter angle,
cinematic lighting with strong rim light and back light,
atmospheric particles in air (light motes, embers, petals, magic dust),
intricate costume details with ornate decorations, embroidery, fabric folds, metal texture,
rich detailed background with depth of field and atmospheric perspective,
high contrast color grading with deep shadows and glowing highlights,
expressive detailed face with sharp eyes catching light,
official illustration quality, highly detailed,
absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana
```

### NGプロンプト（必ず指定）

```
chibi, SD, super deformed, three head proportions, child proportions,
flat anime coloring, cell shading only, plain background, simple background,
static frontal pose, T-pose, standing still, no atmosphere,
amateur art, low detail, generic RPG art, mobile game art,
realistic photo, 3D render, blurry, deformed, extra limbs, 
text, watermark, signature, low quality
```

### ポーズ・構図のバリエーション指定（重要）

棒立ちを避けるため、各キャラに**動的ポーズ**を1つ指定する：

| ポーズ種別 | 適合キャラ例 | 英語キーワード |
|---|---|---|
| 戦闘構え | 剣士、騎士 | `battle stance, weapon raised, looking forward intensely` |
| 跳躍中 | アサシン、機動兵 | `mid-jump action shot, dynamic motion blur on edges` |
| 詠唱中 | 魔導士、巫女 | `casting spell, magic circle around hands, glowing eyes` |
| 振り向き | 王族、王女 | `turning over shoulder, hair flowing, regal expression` |
| 浮遊 | 天使、精霊 | `floating in air, robes billowing upward, divine light below` |
| 玉座／座位 | 王・魔王 | `seated on throne, one hand on weapon, commanding presence` |
| 走行中 | 速攻型 | `running forward, dust trail behind, weapon in motion` |
| 詠唱完了 | 砲撃手 | `weapon discharge moment, recoil pose, energy release effect` |


---

## 属性別カラーパレット

各属性は3色セットで識別する。背景エフェクトと服装の主色は必ずこれに準拠。

| 属性 | メインカラー | サブカラー | アクセント | 背景モチーフ |
|---|---|---|---|---|
| **⚪︎ 聖** | `#F5F3E0`（生成り） | `#D4AF37`（金） | `#A8C5E0`（淡青） | 黄金の麦畑、ステンドグラス、白い羽根、太陽光 |
| **⚫︎ 冥** | `#1A0A2E`（深紫黒） | `#4A1A4A`（紫） | `#C0C0C0`（銀） | 紫の月、星座、墓地、薔薇、血、儀式の輪 |
| **🟢 森** | `#0A3A1A`（深緑） | `#3A7A3A`（緑） | `#D4AF37`（金） | 古木、苔、葉、花、木漏れ日、蔓 |
| **🔴 焔** | `#3A0A0A`（深紅） | `#8A2020`（赤） | `#F59E0B`（橙） | 溶岩、火花、煤、岩、火竜の影 |
| **🔵 蒼** | `#0A1A3A`（深青） | `#2A5A8A`（青） | `#C0C0C0`（銀） | 海面、波しぶき、雲、雷、貝 |
| **⚙️ 鋼** | `#2A2A3A`（鉄黒） | `#6A6A8A`（銀灰） | `#2EE6FF`（電青） | 歯車、回路、稲妻、煙、機械の都 |

---

## プロンプト構築テンプレート

各キャラのプロンプトは以下のテンプレートに当てはめる：

```
[共通必須要素], 
[キャラタイプ：anime girl/boy/elderly/monster/mecha], 
[年齢・体型], 
[髪：color + length + style], 
[目：color + shape], 
[服装：detailed description], 
[武器・小物：specific items], 
[ポーズ・表情], 
[背景：attribute-themed effects], 
[属性カラーパレット適用], 
[NGプロンプト]
```

---

## ⚪︎ 聖（10体）

世界観：黄金の麦畑、白亜の聖堂、誓約。色彩は **白×金×淡青**。

### sei_noa — 見習い聖騎士ノア
- **核**：田舎から出てきた純朴な少女騎士。ドジで一途
- **髪**：銀髪ショートボブ／前髪パッツン
- **目**：翡翠グリーン／大きく丸い瞳
- **体型**：低身長（150cm）／華奢
- **服装**：簡素な白ローブ＋金縁の胸当て／白マント／革ブーツ
- **武器**：背丈ほどの大盾（白×金紋章）／背中に古い両手剣
- **表情**：緊張気味だが決意を固めた顔
- **★識別**：銀ショート × 大きすぎる白盾 × 銀の十字架ネックレス
- **EN**：`battle stance with shield raised diagonally in front, sword half-drawn from back over shoulder, looking forward with determined expression, anime girl knight 13 years old, six heads tall, silver short bob hair with side fringe, large emerald green eyes catching golden hour light, white robe with gold trim and golden chest plate, white cape flowing in the wind, oversized white round shield with golden cross emblem, longsword hilt visible over shoulder, small silver cross necklace, leather boots, golden wheat field with afternoon sunlight, floating light particles, lens flare, deep depth of field background blur, painterly anime art, Shadowverse Cygames illustration quality, dramatic three-quarter angle from slightly below, rim light from behind, masterpiece, NOT chibi NOT super deformed`

### sei_eluna — 草原の吟遊詩人エルナ
- **核**：戦場で歌い味方を鼓舞する泣き虫の詩人
- **髪**：栗色／長いお下げ三つ編み
- **目**：琥珀色／優しげ
- **体型**：標準身長／華奢
- **服装**：白×淡青のチュニックワンピース／革のショルダーバッグ
- **武器**：金縁の竪琴（メイン）／護身用短剣
- **表情**：歌っている／瞳を閉じて口を開ける
- **★識別**：栗色お下げ × 金縁の竪琴 × 麦畑の風
- **EN**：`anime bard girl, brown braided pigtails, golden lyre, white tunic, eyes closed singing, golden wheat field background`

### sei_aloyse — 誓いの剣士アロイス
- **核**：金髪青年、忠誠心の塊
- **髪**：金髪／さらさらストレート、肩までの長さ
- **目**：青／凛々しい
- **体型**：高身長（180cm）／引き締まった体格
- **服装**：白×金の軽装鎧／青マント／白ガントレット
- **武器**：双剣（細身の長剣2本）／鞘は腰の左右
- **表情**：穏やかだが芯の通った微笑
- **★識別**：金髪青年 × 双剣 × 青マント
- **EN**：`anime knight prince, golden hair shoulder length, blue eyes, white and gold armor, dual rapiers, blue cape, golden sunlight`

### sei_liese — 黄金の戦乙女リーゼ
- **核**：自信家のポニーテール女戦士
- **髪**：金髪／高い位置の長いポニーテール
- **目**：青緑／鋭い
- **体型**：標準身長／引き締まった筋肉質
- **服装**：金鎧（バリキリーモチーフ）／赤マント
- **武器**：自身の身長ほどの大剣／片手で軽々振る
- **表情**：自信に満ちた笑み／ニヤリ
- **★識別**：金ポニテ × 巨大な大剣 × 赤マント
- **EN**：`anime valkyrie warrior, blonde high ponytail, golden armor, oversized greatsword wielded one-handed, red cape, confident smirk, sky background`

### sei_sol — 太陽神の巫女ソル
- **核**：褐色肌の預言者、毅然とした巫女
- **髪**：白金／ロングヘア／太陽の冠飾り
- **目**：金色／神秘的
- **体型**：標準身長／凛とした姿勢
- **服装**：白×金の巫女装束／露出は少なめ／金の腕輪
- **武器**：金の儀式杖（先端に太陽モチーフ）
- **表情**：毅然／無表情だが慈悲深い
- **★識別**：褐色肌 × 額の金の太陽印 × 太陽の冠
- **EN**：`anime priestess, dark skin, white-gold long hair, sun emblem on forehead, golden ceremonial staff, white robe with gold trim, golden sunset background`

### sei_mireille — 白翼の癒し手ミレイユ
- **核**：白翼を持つ無口な修道女
- **髪**：白／腰までのストレートロング
- **目**：薄い水色／物憂げ
- **体型**：細身／神秘的なオーラ
- **服装**：純白の修道服／金の十字架／聖典を抱える
- **武器**：なし（聖典のみ）
- **特徴**：**白い羽根の翼**（重要なシルエット要素）
- **表情**：穏やかな微笑／目を半分閉じる
- **★識別**：白翼 × 白ロングヘア × 純白の修道服
- **EN**：`anime nun healer, six white feathered wings, long white hair, gentle smile, white robe with golden cross, holy book in arms, stained glass background`

### sei_grail — 老聖騎士団長グレイル
- **核**：傷だらけの盾を持つ寡黙な壮年騎士
- **髪**：銀髪／短く刈り上げ／白髭
- **目**：灰色／渋い／皺
- **体型**：高身長／重厚な体格
- **服装**：銀の重装鎧／傷だらけ／白マントは色褪せ
- **武器**：傷だらけの大盾／古い長剣
- **表情**：寡黙／険しい眉／口を閉じる
- **★識別**：銀髪刈り上げ × 傷だらけの大盾 × 白髭
- **EN**：`anime elderly knight commander, gray short hair, gray beard, weathered silver armor, scarred shield, faded white cape, stern face, battlefield background`

### sei_alicia — 王国の戦姫アリシア
- **核**：民を背負う王女兼戦士
- **髪**：プラチナブロンド／ハーフアップ／ロング
- **目**：紫青／高貴
- **体型**：標準身長／凛とした姿勢
- **服装**：白×銀の戦闘ドレスアーマー／青マント／金の王冠
- **武器**：銀の長槍（先端は青く輝く）
- **表情**：高貴／毅然／戦場でも優雅
- **★識別**：プラチナハーフアップ × 銀の長槍 × 金の王冠
- **EN**：`anime warrior princess, platinum blonde half-up hair, silver spear glowing blue, white armor dress, blue royal cape, golden crown, regal expression, kingdom castle background`

### sei_seraphim — 七光の大天使セラフィム
- **核**：6翼・目隠しの神の代行者
- **髪**：金髪／ロング／光輝く
- **目**：**白い布で目隠し**（重要なシルエット）
- **体型**：中性的／高身長
- **服装**：白×金の戦闘装束／神聖な紋様の刺繍
- **武器**：両手で構える光の両手剣（光のオーラ）
- **特徴**：**3対6枚の白翼**／頭上に金の輪
- **表情**：目隠しなので表情は口元のみ／静謐
- **★識別**：6翼 × 目隠し × 光る両手剣
- **EN**：`anime archangel, six white wings, golden hair, white blindfold over eyes, glowing two-handed sword, golden halo, white and gold robes, divine light background`

### sei_johannes — 救世の聖王ヨハネス
- **核**：戦場で剣を抜く老王
- **髪**：白／長く豊かな髪と髭
- **目**：青／深い／皺の多い
- **体型**：高身長／威厳ある体格
- **服装**：白×金の王衣＋金の鎧／白マント／赤と金の刺繍
- **武器**：聖剣（金の柄、銀の刀身、青く光る宝石）
- **特徴**：**金の聖王冠**／背後に光の十字
- **表情**：威厳と慈愛を併せ持つ
- **★識別**：白い長髪と髭 × 金の聖王冠 × 青く光る聖剣
- **EN**：`anime holy king elderly, long white hair and beard, golden crown of light, glowing sacred sword with blue gem, white and gold royal armor, divine cross of light background`

---

## ⚫︎ 冥（10体）

世界観：紫の月、星座、墓地、薔薇、血、儀式の輪。色彩は **黒×紫×銀**。

### mei_cal — 骸骨の見習い剣士カル
- **核**：小さな骸骨少年、健気で実は良い子
- **体**：身長低め（140cm）／骸骨ボディ／**目だけ青く光る**
- **服装**：ボロボロの黒マント／簡素な革のベルト／頭蓋骨が見える
- **武器**：自分の身長ほどの錆びた両手剣
- **表情**：目の光が震える（怖がってる風）
- **★識別**：小さな骸骨 × 大きすぎる剣 × 青く光る目
- **EN**：`anime cute skeleton boy warrior, small skeleton with glowing blue eye sockets, oversized rusty greatsword, tattered black cloak, graveyard background, moonlight`

### mei_vera — 夜の吸血鬼少女ヴェラ
- **核**：血が苦手な黒ロリゴス吸血鬼
- **髪**：漆黒／縦ロール／赤いリボン
- **目**：紅／猫目
- **体型**：低身長（145cm）／華奢
- **服装**：黒×赤のゴシックロリータドレス／黒のニーソ／黒革のチョーカー
- **武器**：黒い小型コウモリ翼／鋭い爪
- **特徴**：**コウモリ羽の翼**（背中から）／八重歯／野菜ジュースのストロー
- **表情**：困り顔／頬を膨らます
- **★識別**：黒縦ロール × コウモリ翼 × 野菜ジュースの紙パック
- **EN**：`floating mid-air with small bat wings spread, leaning forward with bored mischievous smirk, vegetable juice carton held up to mouth with straw, anime gothic vampire girl 14 years old, six heads tall, glossy black drilled curl twin tails with red ribbons, sharp red cat eyes glinting in moonlight, small fangs visible, black and red gothic lolita dress with red corset lacing and frilled hem, black thigh-high stockings, red leather choker with silver buckle, dark gothic castle in background with full moon glowing through dark purple clouds, bats silhouetted against moon, glowing red moonlight rim lighting from behind, floating dust particles in air, painterly anime art, Shadowverse Cygames illustration quality, dramatic three-quarter angle, masterpiece, NOT chibi NOT super deformed`

### mei_nox — 三日月の暗殺者ノクト
- **核**：月夜にしか実体化しない無口な少年
- **髪**：銀髪／前髪が片目を隠す／中性的
- **目**：紫／鋭い／三日月の刺青が頬に
- **体型**：細身／中性的／少年
- **服装**：黒のフード付きローブ／**黒い帯で顔下半分を覆う**／黒手袋
- **武器**：三日月型の鎌（柄は黒、刃は紫に光る）
- **表情**：無表情／瞳だけが見える
- **★識別**：銀髪片目隠し × 顔下半分の黒い覆面 × 三日月の鎌
- **EN**：`anime assassin boy, silver hair covering one eye, purple eyes, black hood, black face wrapping covering lower face, crescent moon scythe glowing purple, full moon background`

### mei_lyca — 星詠みのリュカオン
- **核**：傲慢で美貌の星座占い師
- **髪**：濃紺ストレート／肩まで／前髪は流す
- **目**：銀／知的／長い睫毛
- **体型**：細身／高身長／中性的な美貌
- **服装**：濃紺のローブ／星座柄の刺繍／銀の装飾
- **武器**：**星座地図が浮く魔導書**／銀の杖
- **特徴**：周囲に星座のホログラムが浮遊
- **表情**：見下すような微笑
- **★識別**：濃紺ロング × 浮遊する星座ホログラム × 星座地図の本
- **EN**：`anime astrologer young man, dark blue straight hair, silver eyes, deep blue robe with constellation embroidery, floating constellation hologram, ancient star map book, night sky background`

### mei_milka — 黒髪の死霊術師ミルカ
- **核**：黒人形を従える寂しがり屋
- **髪**：漆黒／縦ロール／長い
- **目**：紫／物憂げ
- **体型**：標準身長／細身
- **服装**：黒×紫のゴシックドレス／黒のレースグローブ
- **武器**：操り糸／**身長半分くらいの黒い人形**（重要シルエット）
- **特徴**：周囲に紫の魂（小さな炎）が漂う
- **表情**：寂しげな微笑／涙を堪えるような目
- **★識別**：黒縦ロール × 黒人形 × 浮遊する紫の魂
- **EN**：`anime necromancer girl, black drilled long hair, purple sad eyes, black gothic dress, holding large black puppet, floating purple soul flames, crying expression, dark cemetery background`

### mei_rose — 黒薔薇の魔女ローズ
- **核**：笑顔が一番怖い棘の鞭使い
- **髪**：深紅／豊かなウェーブ／ロング
- **目**：黒／三白眼／笑っているのに冷たい
- **体型**：標準身長／曲線的
- **服装**：黒×赤のドレス／黒い薔薇のコサージュ／深紅のリップ
- **武器**：**棘の生えた長い鞭**／棘から黒薔薇の花が咲く
- **表情**：満面の笑み／だが目は笑っていない
- **★識別**：深紅ウェーブ × 黒薔薇の鞭 × 不気味な笑顔
- **EN**：`anime witch woman, deep red wavy long hair, black eyes with cold gaze, smiling cruelly, black and red gown, thorned whip with black roses, dark rose garden background`

### mei_cerberus — 冥府の番犬ケルベロス
- **核**：三つ首の黒犬、首輪に骸骨
- **形態**：三つ首の漆黒の巨大犬／中型馬ほどのサイズ
- **目**：6つの紅い瞳／鋭い
- **特徴**：**三つの首** × **首輪に骸骨ペンダント**／背中から紫の炎
- **武器**：鋭い牙と爪／背中の炎
- **表情**：3つの顔それぞれが異なる表情（怒り・無関心・狂気）
- **★識別**：三つ首 × 紫の背中の炎 × 骸骨の首輪
- **EN**：`anime three-headed black dog beast, three heads with different expressions, six red eyes, purple flame from back, skull collar, hellfire background, monstrous`

### mei_nyx — 夜の女王ニュクス
- **核**：銀の星冠を冠した冷酷な美女
- **髪**：濃紺×銀／豊かなロング／星屑が散らばる
- **目**：銀／長い睫毛／冷たく美しい
- **体型**：高身長／曲線的／威厳
- **服装**：黒×紫のドレス／**夜空のような黒い半透明の翼**／銀の星冠
- **武器**：銀の儀式短剣／月のチャーム
- **特徴**：周囲に星座が浮遊／背景は夜空
- **表情**：冷酷な微笑／優雅
- **★識別**：銀の星冠 × 夜空 × 星屑の髪
- **EN**：`anime queen of night, dark blue silver hair with stardust, silver eyes, black gown, translucent black wings showing night sky inside, silver star crown, cold beautiful smile, starry night background`

### mei_lucifer — 漆黒の堕天使ルキフェル
- **核**：片目に星紋の元天使、美貌と狂気
- **髪**：銀髪／長い／一部に黒が混じる
- **目**：左：金／右：紫の星紋（左目を縦に裂く傷）
- **体型**：高身長／中性的／妖艶
- **服装**：黒×銀の堕落した天使の装束／所々破れる
- **武器**：黒い両手剣（炎が燻る）
- **特徴**：**一対の漆黒の翼**（焼け焦げた羽根）／頭上に折れた光輪
- **表情**：狂気じみた美しい笑み
- **★識別**：黒翼 × 折れた光輪 × 右目の星紋
- **EN**：`anime fallen angel young man, silver black hair, golden left eye and purple star scar on right eye, broken halo, two black charred wings, black two-handed sword with smoldering fire, torn black silver robes, mad beautiful smile, dark sky background`

### mei_belial — 魔界の王ベリアル
- **核**：紅瞳の角と尾を持つ全冥族の王
- **髪**：漆黒／後ろに流す／2本の太い角が頭から
- **目**：燃える紅／瞳孔は縦長
- **体型**：高身長／威圧的／筋肉質
- **服装**：黒×紫×金の魔王衣装／露出は控えめ／豪華な刺繍
- **武器**：紅黒の魔剣（炎を纏う）／黒い玉座
- **特徴**：**2本の太い角** × **悪魔の長い尾** × **紅黒の魔王翼**
- **表情**：傲慢／酷薄な微笑
- **★識別**：2本の角 × 悪魔の翼 × 燃える紅瞳
- **EN**：`anime demon king, black hair, two large horns, fiery red eyes vertical pupils, devil tail, black red demonic wings, ornate black purple gold royal armor, demonic flaming sword, hellish throne background`

---

## 🟢 森（10体）

世界観：苔むした古木、花冠、獣たちの仲間、葉の鎧。色彩は **緑×茶×金**。

### shin_hina — どんぐり拾いの森人ヒナ
- **核**：リス耳の幼女、のんびり屋
- **髪**：明るい茶／ふわふわのウェーブ／ショート
- **目**：大きな黒目／きょとん
- **体型**：幼女（130cm）／丸っこい
- **特徴**：**リスのふさふさ茶色い耳**／ふさふさのリスの尻尾
- **服装**：緑のスモック／茶色のオーバーオール／首から木のお守り
- **武器**：どんぐり入りの革ポーチ
- **表情**：頬にどんぐりを詰めている／にこにこ
- **★識別**：リス耳 × リスの尻尾 × どんぐりポーチ
- **EN**：`anime young girl with squirrel ears and tail, fluffy brown short hair, big eyes with acorn in cheek, green smock dress, holding acorn pouch, forest background, cute innocent`

### shin_lil — 蔓の見習い弓使いリル
- **核**：葉っぱの矢を使うツンデレ少女
- **髪**：深緑／ショート／前髪に小さな葉
- **目**：金色／ジト目／ツンとした表情
- **体型**：低身長（150cm）／華奢
- **服装**：緑のチュニック／葉のスカート／革のベルト
- **武器**：木の弓／**葉っぱの矢が緑に光る**
- **表情**：ツン顔／頬を赤くして睨む
- **★識別**：深緑ショート × 葉の矢 × ツンとした顔
- **EN**：`anime tsundere archer girl, dark green short hair with leaf accessory, golden eyes pouting, green tunic with leaf skirt, wooden bow with glowing leaf arrows, embarrassed angry face, deep forest background`

### shin_lilia — 花冠のエルフ娘リリア
- **核**：花冠を被った優しい歌声のエルフ
- **髪**：金髪／緩やかなウェーブ／長い／花冠
- **目**：薄い緑／優しい
- **体型**：標準身長／細身／**長い尖った耳**
- **服装**：緑×白の薄手のドレス／花の刺繍／裸足
- **武器**：木のリュート（花の装飾）
- **特徴**：**頭の花冠**（白い花）／全身に花びらが舞う
- **表情**：穏やかな微笑／瞼を閉じる
- **★識別**：金髪エルフ耳 × 白い花冠 × リュート
- **EN**：`anime elf girl, golden wavy long hair with white flower crown, pointed ears, light green eyes, white green flowing dress, wooden lute with floral decoration, scattered flower petals, peaceful smile, sunlit forest`

### shin_kai — 白狼の狩人カイ
- **核**：銀狼を連れる無口な茶髪青年
- **髪**：茶／少し長め／後ろで一束に結ぶ
- **目**：緑／鋭い／無感情
- **体型**：高身長／引き締まった
- **服装**：茶色の狩人の革鎧／緑のマント／フード
- **武器**：木製の合成弓／矢筒／狩猟ナイフ
- **特徴**：**隣に銀色の狼**（同じくらいのサイズ感）
- **表情**：無口／鋭い視線
- **★識別**：茶ロング × 隣の銀狼 × 革のフード
- **EN**：`anime hunter young man, brown ponytail, green sharp eyes, leather hunter armor, green hooded cape, wooden composite bow, silver wolf companion at his side, deep forest background`

### shin_gai — 緑髭のドルイド翁ガイ
- **核**：白髭・お茶目な森の長老
- **髪**：白／豊かな髪と緑がかった白髭／**頭に小さな葉**
- **目**：緑／皺の多い／優しげ
- **体型**：標準身長／少し前屈み／杖突き
- **服装**：緑×茶のローブ／葉の刺繍／首から木の数珠
- **武器**：**鹿の角がついた長杖**／先端から緑光
- **特徴**：杖の周りを小動物（リス、小鳥）が舞う
- **表情**：にっこり／皺が寄る笑顔
- **★識別**：緑がかった白髭 × 鹿角の杖 × 周囲の小動物
- **EN**：`anime elderly druid wizard, long white green-tinted hair and beard, green eyes, brown green robe with leaf embroidery, wooden staff topped with deer antlers glowing green, forest creatures around him, warm sunlit forest grove`

### shin_arca — 森の歌姫アルカ
- **核**：歌で癒す儚げな緑髪女性
- **髪**：深緑／腰までのストレート／葉の冠
- **目**：金茶／物憂げ／長い睫毛
- **体型**：標準身長／華奢／神秘的
- **服装**：**葉でできたドレス**（複数の葉が重なる）／裸足
- **武器**：なし（声が武器）
- **特徴**：周囲に音符のような光の粒
- **表情**：歌っている／瞼を閉じる／口を開ける
- **★識別**：深緑ロング × 葉のドレス × 光の粒
- **EN**：`anime forest songstress, dark green long hair with leaf crown, golden brown eyes closed singing, dress made of overlapping leaves, glowing light particles around her, ethereal expression, mystical forest grove background`

### shin_glen — 大地の番人グレン
- **核**：岩のような体の角ある巨漢
- **髪**：濃茶／短く後ろで結ぶ／**頭から2本の角**
- **目**：暗い緑／険しい
- **体型**：超高身長（210cm）／巨漢／筋肉質
- **服装**：緑の革鎧／茶のマント／革の腰巻き
- **武器**：**石でできた巨大な戦斧**
- **特徴**：肌に苔のようなテクスチャ／2本の太い角
- **表情**：威厳／怒っていないが厳しい
- **★識別**：2本の角 × 石の戦斧 × 苔のような肌
- **EN**：`anime giant earth guardian man, two horns on head, brown short hair tied back, dark green eyes, mossy textured skin, green leather armor, gigantic stone battle axe, ancient forest stone circle background`

### shin_titania — 月光のエルフ姫ティターニア
- **核**：千年生きる無表情のエルフ女王
- **髪**：銀／腰までのストレート／**頭に銀の月の冠**
- **目**：紫／長い睫毛／無感情／長い尖った耳
- **体型**：高身長／優美／神秘的
- **服装**：銀×淡緑のドレス／流れる衣／白の金属装飾
- **武器**：**月光に輝く銀の長弓**（半透明）／矢は光でできている
- **特徴**：周囲に月光の粒子／背景は満月
- **表情**：完全な無表情／無関心
- **★識別**：銀ロングエルフ耳 × 月の冠 × 光る銀の弓
- **EN**：`anime elf queen, silver long straight hair, silver moon crown, pointed ears, expressionless purple eyes, silver pale green flowing gown, glowing silver longbow with light arrows, full moon background, ancient mystic`

### shin_yugdra — 太古の樹精ユグドラ
- **核**：目だけが動く巨大な優しい樹
- **形態**：**樹そのもの**（ヒト型ではない）／巨木／高さ盤外まで
- **特徴**：幹に**穏やかな2つの目**／枝葉が風に揺れる／苔と花が共生／鳥たちが宿る
- **動き**：根がゆっくり動く
- **背景**：周囲に光る花びら／木漏れ日／時間の経過を感じる
- **★識別**：巨大な樹形 × 穏やかな目 × 共生する小生物
- **EN**：`anime ancient tree spirit, massive ancient oak tree with face, two gentle eyes on trunk, mossy bark with growing flowers, birds nesting in branches, glowing flower petals, dappled sunlight, mystic forest background, towering`

### shin_gaia — 緑龍の女神ガイア
- **核**：自然を統べる慈母、緑の龍人女神
- **髪**：深緑×金／豊かなロングウェーブ／花や葉が編まれる
- **目**：金緑／神々しい／長い睫毛
- **体型**：高身長／曲線的／神秘的
- **服装**：緑×金の女神の衣／葉と花の冠／**腕や足に龍の鱗**
- **武器**：なし（自然そのものが力）／背後に龍の影
- **特徴**：**緑の半透明な龍の翼**／背景に巨大な龍の影／全身から緑光
- **表情**：慈愛の微笑／神々しさ
- **★識別**：緑龍鱗 × 緑龍の翼 × 花と葉の冠
- **EN**：`anime nature goddess, deep green golden long wavy hair with flowers and leaves woven, golden green divine eyes, dragon scales on arms and legs, translucent green dragon wings, green gold flowing gown, large dragon silhouette behind her, divine green light, sacred forest grove`

---

## 🔴 焔（10体）

世界観：溶岩の鍛冶場、山岳、竜の巣、煤と火花。色彩は **赤×橙×黒**。

### en_koko — 火打ちのドワーフ娘ココ
- **核**：煤汚れの小柄な鍛冶見習い
- **髪**：オレンジ赤／ボリュームのある縦ロール／2束に分けて結ぶ
- **目**：黄緑／元気
- **体型**：低身長（135cm）／ドワーフ体型／少しふっくら
- **服装**：煤汚れの茶色エプロン／革のグローブ／鍛冶屋の前掛け
- **武器**：自分くらいの大きさの**鍛冶ハンマー**
- **特徴**：頬に煤汚れ／髪も少し焦げ
- **表情**：にっこり／元気
- **★識別**：オレンジ赤縦ロール × 大きな鍛冶ハンマー × 煤汚れ
- **EN**：`anime dwarf girl blacksmith, short height, orange red drilled twin tails, yellow green energetic eyes, sooty face, brown leather apron, oversized blacksmith hammer, forge fire background, cheerful`

### en_ron — 山岳の見習い戦士ロン
- **核**：褐色肌の元気な山岳少年
- **髪**：燃える赤／短く跳ねる／逆立つ
- **目**：橙／生意気
- **体型**：標準身長（少年）／引き締まった
- **服装**：袖無しの茶皮ベスト／**胸と腕に山の刺青**／毛皮の腰巻き
- **武器**：両手で握る戦斧（鉄の刃に赤い装飾）
- **特徴**：**褐色肌**／傷だらけ
- **表情**：好戦的な笑み／自信過剰
- **★識別**：褐色肌赤髪 × 山の刺青 × 戦斧
- **EN**：`anime mountain boy warrior, dark tan skin, fiery red spiky hair, orange cheeky eyes, mountain tribal tattoos on chest, sleeveless leather vest, fur loincloth, double-handed war axe, mountain peak background, confident grin`

### en_garo — 岩拳の闘士ガロ
- **核**：岩の拳を持つ無口な巨漢
- **髪**：黒／短い／角刈り風
- **目**：濃茶／険しい
- **体型**：超高身長／重戦車のような筋肉
- **服装**：上半身裸（傷だらけ）／黒の腰巻き
- **武器**：**両拳が岩石でできた籠手**（手だけ岩化）
- **特徴**：上半身に古い傷／山岳のタトゥー
- **表情**：無表情／険しい眉
- **★識別**：上半身裸の巨漢 × 岩石の拳 × 古い傷
- **EN**：`anime stone fist brawler, massive muscular man, short black hair, bare scarred chest, tribal tattoos, fists encased in stone gauntlets, dark brown silent eyes, volcanic rocky background`

### en_fai — 赤鱗の竜娘ファイ
- **核**：紅髪・短気な竜人少女
- **髪**：燃える赤／後ろで結ぶ高いポニーテール／**髪に紅の鱗が混じる**
- **目**：金／縦長の瞳孔（竜眼）
- **体型**：標準身長／引き締まった
- **服装**：赤×黒のチャイナドレス風戦闘服／露出は腕と脚少し
- **武器**：曲線的な紅刀（炎を纏う）
- **特徴**：**頭から2本の紅い角** × **紅鱗の尻尾** × **手の甲に鱗**
- **表情**：怒っているような／頬を膨らます／挑発的
- **★識別**：紅角と尻尾 × 髪の鱗 × 紅刀
- **EN**：`anime dragonkin girl, fiery red high ponytail with red scales, golden vertical pupils, two small red horns, red scaled tail, red and black combat dress, curved flaming katana, scaly hands, defiant pouting expression, volcanic background`

### en_val — 熔岩の魔導士ヴァル
- **核**：皮肉屋の赤髪魔導士
- **髪**：深紅／中性的なミディアム／前髪が片目を隠す
- **目**：橙／怪しく光る
- **体型**：細身／中性的／青年
- **服装**：黒×赤のローブ／フード／首にルビーのペンダント
- **武器**：先端が燃える**炎の魔導杖**／杖の先で火球を生成中
- **表情**：皮肉な微笑／斜め見下ろす
- **★識別**：深紅ミディアム × 燃える魔導杖 × フード付きローブ
- **EN**：`anime fire mage young man, deep red medium hair covering one eye, glowing orange eyes, black red hooded robe, ruby pendant, magical flame staff, fireball magic, sarcastic smirk, lava field background`

### en_bran — 山の老猟師ブラン
- **核**：百発百中の寡黙な老猟師
- **髪**：白／長く後ろで結ぶ／白い豊かな髭
- **目**：暗い茶／鋭い／皺の多い
- **体型**：標準身長／引き締まったまま
- **服装**：茶色の毛皮コート／革のブーツ／ベルトに弾薬
- **武器**：**長銃（マスケット風、装飾的）**／背中に短剣
- **特徴**：足元に**茶色い猟犬**
- **表情**：寡黙／瞼を細める集中
- **★識別**：白髭ロング × 装飾的な長銃 × 茶色の猟犬
- **EN**：`anime elderly hunter, long white hair tied back, white long beard, dark brown sharp eyes, brown fur coat, ornate musket-style long rifle, brown hunting dog at feet, mountain forest background, focused expression`

### en_asuka — 火竜騎士アスカ
- **核**：戦場大好きな紅鎧の女騎士
- **髪**：紅／ロング／高く結ぶ／**先端だけ炎のように燃える**
- **目**：金／鋭い／戦闘的な笑み
- **体型**：標準身長／引き締まった筋肉質
- **服装**：紅×金の重装鎧／黒のマント／露出少なめ
- **武器**：紅炎の長剣（柄から炎が上がる）
- **特徴**：**背後に小型の火竜**（目線の高さに浮く）／鎧から火花
- **表情**：好戦的な笑み／戦場に陶酔
- **★識別**：燃える紅髪 × 紅炎の長剣 × 背後の火竜
- **EN**：`anime dragon knight woman, red long hair tied high with flaming tips, golden battle eyes, red gold heavy armor, black cape, flaming longsword, small fire dragon companion behind her, battlefield with sparks, warrior grin`

### en_golda — 岩石巨人ゴルダ
- **核**：山そのものの体を持つゆっくり喋る巨人
- **形態**：**全身が岩石でできた巨人**／高さ盤外
- **特徴**：**苔と小さな草花が体に生える**／関節から赤い溶岩光／顔は岩に刻まれた目と口
- **武器**：拳が武器／時々岩を投げる
- **背景**：火山地帯／溶岩
- **表情**：穏やかだが大きな存在感
- **★識別**：岩石の体 × 苔の生えた肩 × 関節の溶岩光
- **EN**：`anime giant rock golem, towering stone body, mossy plants growing on shoulders, glowing red lava cracks at joints, simple carved stone face, volcanic landscape background, slow ancient power`

### en_kagutsuchi — 火竜将軍カグツチ
- **核**：紅炎の剣を持つ威圧の竜人将軍
- **髪**：黒×赤／短く逆立つ／燃える髪先
- **目**：燃える金／瞳孔は縦長
- **体型**：高身長／威圧的／筋肉質
- **服装**：黒×紅金の重装鎧／黒紅のマント
- **武器**：**紅炎の太刀**（刀身全体が燃える）
- **特徴**：**背中に2本の竜翼**（燃える） × **頭に2本の黒角** × 燃える尻尾
- **表情**：威圧／傲慢／戦の神
- **★識別**：黒角＋竜翼 × 紅炎の太刀 × 燃える髪
- **EN**：`anime fire dragon general man, black red spiky hair with burning tips, golden dragon eyes vertical pupils, two black horns, two burning dragon wings, black red gold armor, flaming katana, intimidating war god expression, hellfire background`

### en_bahamut — 焔の古竜バハムート
- **核**：紅瞳・盤外まで首が出る黒赤の巨竜
- **形態**：**完全な竜形態**（ヒト型ではない）／巨大／黒鱗に紅赤の差し色
- **特徴**：**4枚の巨大な竜翼** × **太い長い尾** × **頭の角は4本** × 紅瞳
- **武器**：牙、爪、ブレス
- **背景**：火山の頂、雷雲、稲妻、灼熱の煙
- **★識別**：4本の角 × 4枚の翼 × 紅黒の鱗
- **EN**：`anime ancient fire dragon, massive black scaled body with red highlights, four huge dragon wings, long thick tail, four horns, glowing red eyes, fierce predator, volcanic peak with lightning storm background, legendary`

---

## 🔵 蒼（10体）

世界観：青い水平線、ゆれる波、雲海、海賊船、深淵。色彩は **青×白×銀**。

### sou_kaito — 見習いの船乗りカイト
- **核**：青いバンダナの元気な少年船乗り
- **髪**：栗色／短くフリーフォール／前髪に動きがある
- **目**：明るい青／元気
- **体型**：標準少年／健康的
- **服装**：白の半袖シャツ／青のバンダナ／革のベルトにロープ／青の半ズボン
- **武器**：船員用の短剣／**結ばれていないロープ**
- **特徴**：頬にそばかす／日焼け
- **表情**：にっこり／元気な笑顔
- **★識別**：青バンダナ × ロープ × そばかす
- **EN**：`anime sailor boy, brown short messy hair, bright blue eyes, freckles, white t-shirt with blue bandana, leather belt with rope, sailor's dagger, ocean ship deck background, cheerful smile`

### sou_miu — 小人魚のミウ
- **核**：怖がりな銀髪の小人魚
- **髪**：銀／ふわふわ／ショート／**両側に貝のヘアピン**
- **目**：青／大きく丸い／怯える
- **体型**：低身長（140cm）／華奢／**腰から下が魚の尾**
- **服装**：上半身は貝とサンゴで作った装飾／銀の薄いヴェール
- **特徴**：**人魚の銀色の尾** × 貝のお守りネックレス
- **武器**：護身用の貝の短剣
- **表情**：怖がっている／涙目／頬を赤らめる
- **★識別**：銀色の人魚尾 × 貝のヘアピン × 怖がる表情
- **EN**：`anime small mermaid girl, silver fluffy short hair with shell hair pins, big scared blue eyes, silver fish tail, shell coral upper body decoration, holding shell pendant, underwater bubbles background, timid expression`

### sou_nadja — 蒼波の踊り子ナージャ
- **核**：戦場でも踊る蒼髪の踊り子
- **髪**：海の青／長いポニーテール／揺れる
- **目**：水色／妖艶
- **体型**：標準身長／曲線的
- **服装**：**貝とサンゴでできたビキニアーマー**／水色のヴェール／装飾的
- **武器**：両手の波打つ刀（青く光る）
- **特徴**：周囲に水の渦が舞う／髪が水のように揺れる
- **表情**：恍惚／踊りの最中／微笑
- **★識別**：青ポニテ × 貝のビキニアーマー × 周囲の水の渦
- **EN**：`anime dancer woman, ocean blue long ponytail, light blue alluring eyes, shell coral bikini armor with veil, twin curved blades glowing blue, water swirls around her, ecstatic dance pose, ocean wave background`

### sou_lin — 雲の使者リン
- **核**：白×水色の無垢な空飛ぶ少女
- **髪**：水色／ふわふわロング／**雲のようにふんわり浮く**
- **目**：白に近い水色／純真
- **体型**：低身長／華奢／**裸足**（地面に触れない）
- **服装**：白×水色の薄いドレス／雲のような布が流れる
- **特徴**：**背中から半透明の白い羽根** × 浮遊状態 × 周囲に小さな雲
- **武器**：白い杖（先端に風の渦）
- **表情**：穏やか／きょとん／純真
- **★識別**：水色ふわふわロング × 白い半透明の羽根 × 浮遊
- **EN**：`anime cloud maiden, light blue fluffy long floating hair, pale blue innocent eyes, white light blue flowing dress, translucent white wings, floating barefoot, small clouds around her, white wind staff, sky cloud background`

### sou_juli — 嵐の航海士ジュリ
- **核**：片目隠しの豪快な女海賊
- **髪**：プラチナブロンド／三つ編み／一部は緩い
- **目**：左目：紫／右目：**黒い眼帯**
- **体型**：標準身長／引き締まった
- **服装**：紺×白の海賊コート／黒のロングブーツ／首に金のネックレス
- **武器**：**フリントロック式拳銃** × **片刃のサーベル**
- **特徴**：肩に**白いオウム**／コートに金ボタン
- **表情**：豪快な笑み／自信
- **★識別**：眼帯 × 銃と剣の二刀流 × 肩のオウム
- **EN**：`anime female pirate captain, platinum blonde braid, purple left eye black eyepatch on right, navy white pirate coat, flintlock pistol, curved saber, white parrot on shoulder, golden necklace, stormy sea background, bold grin`

### sou_quartz — 潮風の船長クォーツ
- **核**：信念の塊・義手の中年船長
- **髪**：白髪混じりの濃紺／後ろで結ぶ／白い髭
- **目**：暗い青／鋭い／皺
- **体型**：高身長／渋い体格
- **服装**：紺×金の正装船長コート／三角帽（船長帽）／**右腕が銀の義手**
- **武器**：宝石の付いたサーベル／古い羅針盤
- **特徴**：**右腕が機械的な銀の義手** × 三角帽
- **表情**：渋い／信念に満ちる
- **★識別**：船長帽 × 銀の義手 × 白髭
- **EN**：`anime middle-aged sea captain, dark blue gray streaked hair, white beard, dark blue sharp eyes, navy gold formal captain coat, tricorn hat, silver mechanical right arm prosthetic, jeweled saber, ancient compass, ship deck background, stoic determined expression`

### sou_aqua — 深海の歌姫アクア
- **核**：声で海を制する銀髪人魚
- **髪**：銀×青のグラデ／腰までのストレート／**鰭のような耳飾り**
- **目**：深い青／長い睫毛／神秘的
- **体型**：高身長／優美／**腰から下は深青の魚尾**
- **服装**：銀×深青のドレス（上半身のみ、下は尾）／真珠の装飾
- **武器**：声（歌が武器）／真珠の杖
- **特徴**：周囲に水のリング／泡／**鰭のような耳**
- **表情**：歌っている／瞼を閉じる／優雅
- **★識別**：銀青のグラデ × 鰭の耳 × 真珠の装飾
- **EN**：`anime deep sea siren, silver blue gradient long straight hair, fish-fin shaped ears, deep blue mystical eyes singing, dark blue mermaid tail, silver pearl decorated dress, water rings around her, deep sea coral background, ethereal`

### sou_raika — 雷神の巫女ライカ
- **核**：紫雷を纏う赤縄の巫女
- **髪**：黒／豊かなロング／高く結ぶ／**赤いリボン**
- **目**：紫／鋭い／神秘的
- **体型**：標準身長／凛とした姿勢
- **服装**：白×赤の巫女装束／**赤い縄（しめなわ）が腰に巻かれる**／露出は手首と足首
- **武器**：白い扇／**紫の雷が周囲に走る**
- **特徴**：周囲に**紫の雷の輪**／浮遊する紙のお札
- **表情**：神聖／集中／無感情
- **★識別**：黒髪赤リボン × 赤い縄 × 周囲の紫雷
- **EN**：`anime thunder shrine maiden, black long hair high ponytail with red ribbon, sharp purple eyes, white red miko shrine outfit, red rope sash around waist, white folding fan, purple lightning around her, floating paper talismans, sacred thunderstorm background`

### sou_triton — 海神の使者トリトン
- **核**：高潔な貝の鎧の海王子
- **髪**：濃青／長く流れる／海から上がったような濡れ髪
- **目**：海緑／高貴
- **体型**：高身長／引き締まった筋肉質
- **服装**：**貝とサンゴで作った青金の鎧**／白い腰布／裸足
- **武器**：**金の三叉の槍（トライデント）**／柄に貝
- **特徴**：周囲に水の渦／背景に大きな波
- **表情**：高潔／威厳／戦士
- **★識別**：濡れた濃青ロング × 三叉の金槍 × 貝の鎧
- **EN**：`anime sea god prince, dark blue long flowing wet hair, sea green noble eyes, blue gold shell coral armor, white waist cloth, golden trident with shell decoration, water swirls, large ocean wave background, regal warrior`

### sou_leviathan — 大海の主リヴァイアサン
- **核**：盤外まで体が出る蒼鱗の海蛇神
- **形態**：**巨大な蛇のような海竜**（ヒト型ではない）／長い体／鱗
- **特徴**：**蒼く輝く鱗** × **背中に7枚のヒレ** × **金の瞳** × 巨大な顎と牙
- **武器**：牙、尾、海そのもの
- **背景**：嵐の海、稲妻、巨大な渦巻き
- **★識別**：蒼鱗の長い蛇体 × 7枚のヒレ × 金の双眼
- **EN**：`anime sea serpent dragon, massive snake-like body, glowing blue scales, seven dorsal fins, golden eyes, large maw with fangs, stormy ocean with massive whirlpool background, lightning, legendary leviathan`

---

## ⚙️ 鋼（10体）

世界観：歯車の都、稲妻の研究所、量産工場、回路盤、義眼。色彩は **銀×青白×黒**。

### kou_mk01 — 試作機MK-01
- **核**：片目だけ点灯する小型ロボ
- **形態**：丸い小型ロボ／高さ100cm／二足歩行
- **特徴**：**ボディは銀×青白の球体** × **片目だけ点灯（青）**他方は閉じる × 短い腕
- **武器**：簡素な腕の先のクロー／時々バチッと電撃
- **背景**：研究所の床、配線が散らばる
- **表情**：機械的／光だけが揺れる
- **★識別**：丸い小型ボディ × 片目だけ青く点灯 × 短いクロー
- **EN**：`anime small prototype robot, rounded silver blue chassis, one glowing blue eye one closed eye, short clawed arms, simple bipedal, electrical sparks, laboratory background, cute mechanical`

### kou_kano — 見習い技師カノ
- **核**：好奇心旺盛な眼鏡少女
- **髪**：栗茶／**ツインテール**／前髪パッツン
- **目**：緑／**丸い銀縁眼鏡**／好奇心
- **体型**：標準少女／華奢
- **服装**：**茶色の作業オーバーオール**／白シャツ／**腰に工具ベルト**
- **武器**：レンチ／工具
- **特徴**：頬に油汚れ／指に絆創膏
- **表情**：にっこり／好奇心満載
- **★識別**：茶ツインテ × 丸眼鏡 × 工具ベルト
- **EN**：`anime engineer apprentice girl, brown twintails, round silver glasses, green curious eyes, brown overalls white shirt, tool belt with wrenches, smudged cheek with oil, workshop background, eager smile`

### kou_luna — 電脳少女ルナ
- **核**：無表情な義体少女
- **髪**：明るい水色／ボブ／均一なカット／前髪パッツン
- **目**：青／無感情／**右目だけ赤い回路ライン**が走る
- **体型**：低身長（150cm）／華奢
- **服装**：**白×青の未来的セーラー服**／**右腕は銀色の機械腕**／**左脚も部分的に機械化**
- **武器**：機械腕から発射されるパルスビーム
- **特徴**：**機械の右腕** × **回路の右目** × 表情は変わらない
- **表情**：無表情／視線は遠い
- **★識別**：水色ボブ × 機械の右腕 × 右目の赤い回路
- **EN**：`anime cyborg schoolgirl, light blue bob hair, blue eyes with red circuit lines on right eye, expressionless, white blue futuristic sailor uniform, silver mechanical right arm, partially mechanical left leg, pulse beam weapon, neon city background`

### kou_cog — 歯車の騎士コグ
- **核**：忠実な蒸気立ち昇る全身鎧
- **形態**：**全身鎧（中身は不明）**／高身長／騎士のシルエット
- **特徴**：**鎧の関節から白い蒸気** × **胸に大きな歯車** × ヴァイザー越しに**赤い目の光**
- **武器**：銀のロングソード／円形の盾（歯車模様）
- **背景**：歯車の都、稼働する機械
- **表情**：見えない／ヴァイザー
- **★識別**：白蒸気 × 胸の歯車 × ヴァイザーの赤い光
- **EN**：`anime steam knight armor, full plate armor, white steam from joints, large gear emblem on chest, red glowing eyes through visor, silver longsword, gear-decorated round shield, clockwork city background, mechanical loyalty`

### kou_dorothy — 科学者の助手ドロシー
- **核**：優しい先輩の白衣女性
- **髪**：明るい茶／低い位置のサイドポニー／少しウェーブ
- **目**：黒緑／優しい／**メガネ**
- **体型**：標準身長／華奢
- **服装**：**白衣**（袖をまくる）／黒いベスト／黒のスカート／黒のニーソ
- **武器**：**フラスコ**（カラフルな液体）／注射器
- **特徴**：**白衣のポケットに鉛筆と試験管**
- **表情**：優しい微笑／首をかしげる
- **★識別**：茶サイドポニー × 白衣 × カラフルなフラスコ
- **EN**：`anime scientist assistant, brown side ponytail wavy, kind black green eyes with glasses, white lab coat over black vest, black skirt with knee high socks, holding colorful flask, pencil in pocket, laboratory background, gentle smile`

### kou_ares — 銀の自律兵装ARES
- **核**：銀色の人型兵装、命令のみ動く
- **形態**：**完全な人型機械**／高身長／引き締まったシルエット
- **特徴**：**全身銀×黒のメタリック装甲** × **片腕が大型砲身** × **額に赤い単眼レンズ**
- **武器**：**右腕が砲身**／左手は普通の機械の手
- **背景**：軍事工場／コンテナ
- **表情**：機械（顔はあるが感情なし）
- **★識別**：銀×黒のボディ × 右腕砲身 × 額の赤い単眼
- **EN**：`anime humanoid combat android, sleek silver black metallic body, single red optic on forehead, right arm replaced by large cannon, left mechanical hand, military factory background, autonomous weapon`

### kou_grants — 機械戦士グランツ
- **核**：ガトリング搭載の巨大戦闘ロボ
- **形態**：**重戦闘ロボ**（高身長／巨漢／重厚）／二足歩行
- **特徴**：**胸にガトリング砲** × **両肩にミサイルポッド** × **重厚な装甲（銀×黒）**
- **武器**：胸のガトリング／肩のミサイル
- **背景**：戦場／煙／瓦礫
- **表情**：機械（赤い目の光のみ）
- **★識別**：胸のガトリング × 肩のミサイル × 重装甲
- **EN**：`anime heavy combat mech, massive silver black armored bipedal robot, chest-mounted gatling gun, dual shoulder missile pods, glowing red eye visor, battlefield smoke and rubble background, intimidating war machine`

### kou_elsa — 雷帝の科学者エルザ
- **核**：天才で奇人の白衣女博士
- **髪**：白／ボサボサのロング／時々雷で逆立つ
- **目**：紫／狂気的な輝き／**メガネ**
- **体型**：標準身長／華奢
- **服装**：**白衣**（焦げ穴あり）／黒の研究服／黒のロングブーツ
- **武器**：**先端から紫の雷を放つ電撃の杖**
- **特徴**：周囲に**紫の雷の輪** × 研究所の機械
- **表情**：狂気じみた笑み／うっとり
- **★識別**：白ボサボサロング × 電撃の杖 × 周囲の紫雷
- **EN**：`anime mad scientist woman, white messy long hair sometimes static-charged, purple gleaming eyes with glasses, scorched white lab coat, black research dress, electric staff with purple lightning, lightning ring around her, electrical laboratory background, manic grin`

### kou_titan — 重装機甲タイタン
- **核**：二足歩行戦車のミサイル砲撃要塞
- **形態**：**超大型の戦車・人型ハイブリッド**（人型じゃない／戦車要素強め）
- **特徴**：**4本脚** × **背に主砲（巨大な砲身）** × **胴体に複数のミサイルランチャー** × 装甲は黒鉄
- **武器**：主砲、ミサイル、サブ機関砲
- **背景**：戦場、煙、軍事
- **★識別**：4本脚 × 背の主砲 × 多数のミサイル
- **EN**：`anime walker tank mech, massive black iron armored quadrupedal walker, large cannon on back, multiple missile launchers, sub-machine guns, fortress-like, military battlefield background, walking artillery platform`

### kou_zero — 超兵器ゼロ
- **核**：両肩に主砲を持つ伝説の機神
- **形態**：**完全な人型機神**（巨大／高身長／神々しい）
- **特徴**：**黒銀の装甲** × **両肩に巨大な主砲** × **胸に青い大型コア（光る）** × **背中から青い光のエネルギー翼**
- **武器**：両肩の主砲／背中のエネルギー砲／剣
- **背景**：荒廃した都市／青い光／伝説
- **表情**：機械（顔は単純な単眼か仮面）
- **★識別**：両肩の主砲 × 胸のコア × エネルギー翼
- **EN**：`anime ultimate war machine, towering black silver humanoid mech, dual massive shoulder cannons, glowing blue core in chest, blue energy wings on back, single optic mask, ruined city blue light background, legendary destroyer`

---

## 画像生成メモ

### mcp__gemini-image__generate_image の使い方

各キャラの英文プロンプト（**EN**:）に共通必須要素・属性カラーパレット・NGプロンプトを結合して渡す。

**プロンプト構成:**

```
{COMMON_PROMPT} + {キャラ EN プロンプト} + {属性カラーパレット} + {NEGATIVE}
```

**属性カラーパレット:**

| 属性プレフィックス | パレット指定 |
|---|---|
| `sei` | `cream and gold and pale blue color palette with golden hour lighting` |
| `mei` | `deep purple black and silver color palette with moonlit purple atmosphere` |
| `shin` | `forest green and brown and gold color palette with dappled sunlight through leaves` |
| `en` | `crimson and orange and black color palette with ember sparks and lava glow` |
| `sou` | `deep blue and white and silver color palette with water mist and aurora light` |
| `kou` | `iron black and silver and electric blue color palette with neon glow and circuit lights` |

**生成・保存の手順:**

1. `mcp__gemini-image__generate_image` で生成（`saveToFilePath` に保存先を指定）
   - MCPは常に **1024×1024 正方形** で出力する（プロンプトの解像度指定は無効）
2. 既存ファイルがある場合は `_1.png` サフィックスで保存される
3. 画像確認後、問題なければ `_1.png` → `{charId}.png` にリネームして置き換える

```python
import os
os.replace("chars/sei_noa_1.png", "chars/sei_noa.png")
```

**保存先:** `public/images/chars/{charId}.png`（1024×1024 PNG）

> ⚠️ MCPはサイズ指定不可。出力は常に 1024×1024 固定。プロンプトへの解像度指定は無効。

### サンプル生成順序

最初に **6属性の代表1体ずつ**を生成して画風の一貫性を確認することを推奨：

1. `sei_noa`（聖の代表・低コスト・少女）
2. `mei_belial`（冥の代表・極コスト・男性）
3. `shin_titania`（森の代表・高コスト・女王）
4. `en_bahamut`（焔の代表・極コスト・モンスター）
5. `sou_juli`（蒼の代表・中コスト・女性）
6. `kou_zero`（鋼の代表・極コスト・機械）

→ 6体OKなら全60体生成へ進む。

### 検証ポイント

各キャラ生成後、以下をチェック：

**シャドバtier基準（最重要）**:
- [ ] **頭身が6〜7（SD/チビではない）**
- [ ] **動的なポーズ**（棒立ちではなく、戦闘構え／動作中）
- [ ] **厚塗り風の塗り**（フラットアニメではなく、光の階調が豊か）
- [ ] **背景に奥行きと粒子**（のっぺりした背景ではなく、被写界深度＋エフェクト）
- [ ] **衣装の装飾が細かい**（フリル・刺繍・宝石・布の皺が描き込まれている）
- [ ] **リムライト**（背後からの輪郭光）が入っている

**仕様準拠**:
- [ ] **識別トライアングルが視認できる**（指定3要素が画面上で確認可能）
- [ ] **属性カラーパレットに収まっている**
- [ ] **小さく縮小（96×96）してもシルエットでキャラを判別できる**
- [ ] 画面に文字が紛れ込んでいない
- [ ] 中高生向けのデザインに収まっている

→ 上記**シャドバtier基準**6項目のうち**5項目以上**満たさない場合は再生成。プロンプトに具体的な不足要素（"more dynamic pose"、"more detail on costume"、"more atmospheric particles"等）を足す。

---

## 改訂履歴

- v1.1（2026-05-06）：シャドバtierへスタイル方針を更新。チビ/SD回避のための頭身・ポーズ・塗り・背景指定を追加
- v1.0（2026-05-06）：初版。60キャラのビジュアル仕様完備