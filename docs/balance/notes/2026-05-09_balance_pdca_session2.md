# Balance PDCA Session 2 — 2026-05-09

## セッション概要

2時間の自律バランス調整セッション。Cycle 7〜21にわたって21サイクルのPDCAを実施。

## 初期状態（Cycle 6終了時）

| 系統 | 平均勝率 | ミラー先攻 |
|------|---------|-----------|
| sei  | 75.8%   | 67%       |
| en   | 70.5%   | 54%       |
| sou  | 69.2%   | 70%       |
| kou  | 57.0%   | 89%       |
| mei  | 54.0%   | 57%       |
| shin | 49.8%   | 71%       |

## 最終状態（Cycle 21 / 300試合精度）

| 系統 | 平均勝率 | ミラー先攻 |
|------|---------|-----------|
| sei  | 59.8%   | 56%       |
| mei  | 61.0%   | 56%       |
| shin | 61.3%   | 66%       |
| en   | 66.1%   | 63%       |
| sou  | 64.8%   | 61%       |
| kou  | 69.8%   | 68%       |

## 目標達成状況

| 目標 | 設定 | 達成 |
|------|------|------|
| 平均勝率 45-55% | 未達 (59-70%) | ✗ (改善: 49-76% → 59-70%) |
| ミラー先攻 48-52% | 部分達成 | sei/mei/en は近い |
| ペア勝率 30-70% | 部分達成 | 多くのペアが改善 |

## 主要な改善

- **mei**: 75.8% → 61.0%（最大の問題だったshi_no_ryouikiスキルの削除）
- **shin**: 49.8% → 61.3%（ATK強化により戦闘力改善）
- **kou mirror**: 89% → 68%（kou_luna ATK 2→1で過剰な先攻優位を解消）

## カード変更一覧（最終状態）

### ⚪ sei
- `sei_noa`: strong_blow 2 uses → **1 use**
- `sei_eluna`: keigan 1 use → 変更なし
- `sei_liese`: ATK 3 → **2**, HP 3 → **2**
- `sei_aloyse`: HP 3 → **2**
- `sei_sol`: HP 3 → **2**、gaisen スキル **削除**
- `sei_mireille`: heal infinite → **3 uses**
- `sei_alicia`: ATK 3 → **2**, HP 4 → **1**、senki スキル **削除**

### ⚫ mei
- `mei_cal`: HP 1 → **2**、strong_blow 2 → **1 use**
- `mei_vera`: HP 1 → **2**
- `mei_nyx`: ATK 3, HP 3 → 変更なし
- `mei_nyx`から先のカード: 変更なし

### 🟢 shin
- `shin_hina`: strong_blow 2 → **1 use**
- `shin_hina/lil/gai/lilia/kai/lilia`: ATK +1バフ（前セッション）
- `shin_kai`: movement FWD1 → **DIR4**（前セッション）
- `shin_titania`: HP 3 → **4**

### 🔴 en
- `en_ron`: strong_blow 2 → **1 use**
- `en_garo`: kyousenshi スキル **削除**
- `en_fai`: nagibarai 3 → **1 use**
- `en_bran`: ATK 3 → **2**、penetrate スキル **削除**
- `en_golda`: HP 4 → **3**

### 🔵 sou
- `sou_miu`: fukitobashi 3 → **1 use**
- `sou_nadja`: strong_blow **削除**
- `sou_raika`: ATK 4 → **2**、HP 3 → **2**、touketsu スキル **削除**
- `sou_juli`: ATK 3 → **2**

### ⚙ kou
- `kou_mk01`: strong_blow 2 → **1 use**
- `kou_luna`: ATK 2 → **1**、keigan スキル **削除**
- `kou_elsa`: ATK 2 → **1**、ranged 4 → **2**

## 発見した根本原因

### 1. strong_blow 2 uses の過剰なbase damage bypass
低コストスターターカード（sei_noa, mei_cal, shin_hina, kou_mk01）がstrong_blow 2 usesを持つと、先攻プレイヤーが前線に到達した際に6 base damage（= 5 HPの基地を確殺）を叩き出せる。全て1 useに統一することで解決。

### 2. aura型スキルの uses 制限が機能しない
`triggerKind: 'aura'`のスキルはusesの値に関わらず毎ターン`recalculateAuras`で再計算される。senki（全味方ATK+1）やkyousenshi（半HP以下でATK+2）は`uses: 'infinite'`として設計されており、数値変更では制限できない。

**解決策**: senki（sei_alicia）、kyousenshi（en_garo）のスキルを完全削除。

### 3. ranged attacks の友軍LoS遮蔽問題
rules.tsのgetLegalAttacks実装（line 127）: ranged射撃は友軍ユニットにも遮蔽される。shin_titania（ranged 3, ATK 4）が自軍の前線ユニットに視線を塞がれ、sou/kouのバックラインを攻撃できない。

**構造的問題**: AI検索深度が低いため、shin_titaniaが最適な動作（前進してLoS確保 → mahi使用 → 攻撃）を発見できない。

### 4. 先攻有利の構造的問題
- ranged(2-4)を持つデッキ（kou, sou）は先攻時に盤面先制権を取りやすい
- 後攻の手札+1補正では完全に相殺できない
- kou mirror 68%、sou mirror 61%は構造的限界

### 5. stage 3デッキの組み合わせ方
`buildEnemyDeck(a, 3)`の実装: 報酬カード = sorted[7]（コスト8位）× 2 + スターター上位5種 × 2 = 12枚から最安値2種を1枚ずつ削除 = 10枚。これにより各系統の「stage 3デッキ」が確定。

## 構造的限界（stat変更のみでは解決困難）

1. **sou vs shin 76%**: sou_raika/juliのranged攻撃がshinの前進メレーを一方的に削る。shinのmahi（麻痺）やsaisei（HP再生）はユニット防衛のみでbase保護なし
2. **kou vs shin 74%**: kou_elsa(ranged 2) + kou_cog(HP 4, keigen)の「sniper + wall」パターン
3. **全ミラー先攻有利**: ranged/step型の非対称盤面で先手が前線確保

## 推奨追加施策（実装未）

1. **AI評価関数の改善**: mahi/touketsuなどのコントロールスキルの価値を正しく評価できるよう evaluator.ts を調整
2. **友軍LoS問題の解決**: getLegalAttacksで友軍は遮蔽しない（敵のみ遮蔽）に変更すると、shin_titaniaが活躍できる
3. **後攻補正の強化**: 手札+1に加えてHP+1を後攻に付与（全対戦共通）
4. **デッキ再設計**: stage 3デッキの報酬カードのコストバランスを見直し、全6系統の「index 7」カードが近い強度になるよう調整
