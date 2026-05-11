# cardsmith エフェクト・アニメーション 実装指示書

> **対象リポジトリ**: `tera-mode/cardsmith`
> **目的**: ゲーム全体にアニメーション/エフェクトを実装し、Steam参入に耐える視覚品質に到達させる
> **対象範囲**: P0（MVP必須）+ P1（体験向上）約60項目
> **見積もり**: 4〜6日（フェーズ分割）

---

## 0. 設計原則

### 0-1. 三層アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  Game Logic Layer（既存・変更しない）         │
│  GameContext / dispatcher / skills / rules  │
└──────────────────┬──────────────────────────┘
                   │ effectQueue.push()
                   ▼
┌─────────────────────────────────────────────┐
│  Effect Queue Layer（新規）                   │
│  - キューの管理                               │
│  - イベント発生 → アニメーション再生 → 完了通知 │
└──────────────────┬──────────────────────────┘
                   │ subscribe
                   ▼
┌─────────────────────────────────────────────┐
│  Animation Layer（新規）                      │
│  Motion / canvas-confetti / SVG / Lottie    │
└─────────────────────────────────────────────┘
```

**鉄則**：
- ゲームロジックは「何が起きたか」だけを `effectQueue` に積む
- アニメーション層は「どう見せるか」だけを担当
- `triggerOnAttack` 等の既存関数のシグネチャは絶対に変更しない
- 全アニメーションは `prefers-reduced-motion` で短縮 or 無効化される

### 0-2. パフォーマンス目標

- モバイル（iPhone SE 3rd gen）で 60fps 維持
- 同時表示パーティクル数 100 以下
- バンドル増分 100KB 以下（gzip）

### 0-3. 採用ライブラリ

| 用途 | ライブラリ | バンドルサイズ(gzip) |
|---|---|---|
| 宣言的アニメーション | `motion` | ~32KB |
| 紙吹雪 | `canvas-confetti` | ~5KB |
| 軽量SVGアニメーション | 自作（CSS keyframes） | 0KB |
| 凝ったエフェクト（Phase 2以降） | `lottie-react` | ~50KB |

```bash
npm install motion canvas-confetti
npm install -D @types/canvas-confetti
```

---

## 1. effectQueue 設計

### 1-1. 型定義

`src/lib/types/effects.ts` を新規作成：

```typescript
import { Position, Unit } from './game';

export type EffectId = string; // uuid

export type GameEffect =
  // ─── 召喚 ──────────────────────
  | {
      id: EffectId;
      type: 'summon';
      cardId: string;
      attribute?: 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';
      from: 'hand_player' | 'hand_ai' | 'hand_index';
      handIndex?: number; // playerHandの場合のインデックス
      to: Position;
      durationMs: number; // default 600
    }
  // ─── 移動 ──────────────────────
  | {
      id: EffectId;
      type: 'move';
      instanceId: string;
      from: Position;
      to: Position;
      durationMs: number; // default 350
    }
  // ─── 攻撃モーション ──────────────
  | {
      id: EffectId;
      type: 'attack_motion';
      attacker: Position;
      target: Position;
      attackKind: 'melee' | 'ranged_arrow' | 'ranged_cannon' | 'aoe';
      durationMs: number; // default 500
    }
  // ─── ヒット（着弾） ──────────────
  | {
      id: EffectId;
      type: 'hit';
      target: Position;
      damage: number;
      isCritical?: boolean;
      attackKind: 'melee' | 'ranged_arrow' | 'ranged_cannon' | 'aoe';
      durationMs: number; // default 300
    }
  // ─── 撃破 ──────────────────────
  | {
      id: EffectId;
      type: 'death';
      instanceId: string;
      position: Position;
      attribute?: 'sei' | 'mei' | 'shin' | 'en' | 'sou' | 'kou';
      durationMs: number; // default 700
    }
  // ─── ベース攻撃 ──────────────────
  | {
      id: EffectId;
      type: 'base_attack';
      attacker: Position;
      targetSide: 'player' | 'ai';
      damage: number;
      durationMs: number; // default 800
    }
  // ─── 状態異常 ────────────────────
  | {
      id: EffectId;
      type: 'status_apply';
      target: Position;
      status: 'frozen' | 'paralyzed' | 'silenced';
      durationMs: number; // default 400
    }
  // ─── スキル発動 ──────────────────
  | {
      id: EffectId;
      type: 'skill_proc';
      source: Position;
      skillId: string;
      targets?: Position[]; // 効果を受ける対象
      visualHint?: 'heal' | 'buff' | 'debuff' | 'aoe' | 'aura' | 'generic';
      durationMs: number; // default 600
    }
  // ─── HPバー変化 ──────────────────
  | {
      id: EffectId;
      type: 'hp_change';
      side: 'player' | 'ai' | 'unit';
      instanceId?: string; // unit の場合のみ
      from: number;
      to: number;
      durationMs: number; // default 400
    }
  // ─── ダメージ数字 ────────────────
  | {
      id: EffectId;
      type: 'damage_number';
      position: Position | { side: 'player' | 'ai' };
      value: number;
      kind: 'damage' | 'heal' | 'block' | 'miss';
      durationMs: number; // default 1000
    }
  // ─── ターン開始 ──────────────────
  | {
      id: EffectId;
      type: 'turn_banner';
      side: 'player' | 'ai';
      turnCount: number;
      durationMs: number; // default 1200
    }
  // ─── 勝敗 ──────────────────────
  | {
      id: EffectId;
      type: 'victory';
      durationMs: number; // default 3000
    }
  | {
      id: EffectId;
      type: 'defeat';
      durationMs: number; // default 2500
    };
```

### 1-2. キュー実装

`src/contexts/EffectQueueContext.tsx` を新規作成：

```typescript
'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameEffect, EffectId } from '@/lib/types/effects';

interface EffectQueueContextValue {
  // 現在再生中のエフェクト（複数同時OK）
  activeEffects: GameEffect[];
  // キューに積む（一括も可）
  push: (effects: Omit<GameEffect, 'id'>[] | Omit<GameEffect, 'id'>) => EffectId[];
  // エフェクトの完了を通知（アニメーション層から呼ぶ）
  complete: (id: EffectId) => void;
  // 全消し（リトライ・画面遷移時）
  clear: () => void;
  // 「全エフェクト完了」を待つPromise
  awaitDrain: () => Promise<void>;
  // モーション軽減フラグ
  reduceMotion: boolean;
}

const EffectQueueContext = createContext<EffectQueueContextValue | null>(null);

export function EffectQueueProvider({ children }: { children: React.ReactNode }) {
  const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const drainResolversRef = useRef<Array<() => void>>([]);

  // prefers-reduced-motion の検出
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const push = useCallback(
    (input: Omit<GameEffect, 'id'>[] | Omit<GameEffect, 'id'>) => {
      const arr = Array.isArray(input) ? input : [input];
      const withIds = arr.map(e => ({ ...e, id: uuidv4() } as GameEffect));
      setActiveEffects(prev => [...prev, ...withIds]);
      return withIds.map(e => e.id);
    },
    []
  );

  const complete = useCallback((id: EffectId) => {
    setActiveEffects(prev => {
      const next = prev.filter(e => e.id !== id);
      if (next.length === 0 && drainResolversRef.current.length > 0) {
        const resolvers = drainResolversRef.current;
        drainResolversRef.current = [];
        // 次のtickで解決（state更新後に確実に呼ぶため）
        queueMicrotask(() => resolvers.forEach(r => r()));
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setActiveEffects([]);
    drainResolversRef.current.forEach(r => r());
    drainResolversRef.current = [];
  }, []);

  const awaitDrain = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (activeEffects.length === 0) {
        resolve();
        return;
      }
      drainResolversRef.current.push(resolve);
    });
  }, [activeEffects.length]);

  return (
    <EffectQueueContext.Provider
      value={{ activeEffects, push, complete, clear, awaitDrain, reduceMotion }}
    >
      {children}
    </EffectQueueContext.Provider>
  );
}

export function useEffectQueue() {
  const ctx = useContext(EffectQueueContext);
  if (!ctx) throw new Error('useEffectQueue must be used within EffectQueueProvider');
  return ctx;
}
```

### 1-3. GameContext との接続

`src/contexts/GameContext.tsx` の各アクションでエフェクトをプッシュする。**既存ロジックは変更せず、エフェクトのpushだけ追加する**：

```typescript
// 例: summonToCell の中
const summonToCell = useCallback((pos: Position) => {
  const s = sessionRef.current;
  if (!s || mode.type !== 'card_selected') return;
  const card = s.player.hand[mode.cardIndex];
  if (!card) return;

  // ▼▼▼ ここから追加 ▼▼▼
  effectQueue.push({
    type: 'summon',
    cardId: card.id,
    attribute: card.attribute,
    from: 'hand_player',
    handIndex: mode.cardIndex,
    to: pos,
    durationMs: 600,
  });
  // ▲▲▲ ここまで追加 ▲▲▲

  // 既存ロジックそのまま
  const unit = createUnit(card, 'player', pos);
  const newBoard = placeUnit(s.board, unit, pos);
  // ...
}, [mode, updateSession, effectQueue]);
```

### 1-4. AIターンの間延ばし

AIの行動は現状即時実行されるため、視覚的にわかりにくい。**P1で対応**：

```typescript
// AI のターン処理ループで
async function executeAIAction(action: AIAction) {
  effectQueue.push({...}); // 該当エフェクト
  await effectQueue.awaitDrain();
  await sleep(200); // アクション間の余韻
  applyAction(action); // 既存ロジック
}
```

`reduceMotion === true` の時は `awaitDrain` をスキップして即時実行。

---

## 2. アニメーションレイヤー実装

### 2-1. ディレクトリ構成

```
src/components/effects/
├── EffectLayer.tsx              ← 全エフェクトのオーケストレーター
├── SummonEffect.tsx             ← 召喚アニメ
├── MoveEffect.tsx               ← 移動アニメ
├── AttackMotion.tsx             ← 攻撃モーション
├── HitEffect.tsx                ← ヒット時の閃光
├── DeathEffect.tsx              ← 撃破エフェクト
├── BaseAttackEffect.tsx         ← ベース攻撃の特別演出
├── StatusOverlay.tsx            ← 凍結・麻痺などの常時表示
├── SkillProcEffect.tsx          ← スキル発動演出
├── DamageNumber.tsx             ← ダメージ数字ポップアップ
├── TurnBanner.tsx               ← ターン開始バナー
├── VictoryEffect.tsx            ← 勝利演出（confetti込み）
├── DefeatEffect.tsx             ← 敗北演出
├── CellHighlight.tsx            ← セルハイライト（既存改修）
└── particles/
    ├── BurstParticles.tsx       ← 汎用爆散パーティクル
    ├── SparkParticles.tsx       ← 火花
    └── attribute-presets.ts     ← 属性別パーティクル設定
```

### 2-2. EffectLayer

`src/components/effects/EffectLayer.tsx`：

```typescript
'use client';

import { useEffectQueue } from '@/contexts/EffectQueueContext';
import { SummonEffect } from './SummonEffect';
import { HitEffect } from './HitEffect';
import { DeathEffect } from './DeathEffect';
// ... 他

export function EffectLayer() {
  const { activeEffects, complete } = useEffectQueue();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {activeEffects.map(effect => {
        switch (effect.type) {
          case 'summon':
            return <SummonEffect key={effect.id} effect={effect} onComplete={() => complete(effect.id)} />;
          case 'hit':
            return <HitEffect key={effect.id} effect={effect} onComplete={() => complete(effect.id)} />;
          case 'death':
            return <DeathEffect key={effect.id} effect={effect} onComplete={() => complete(effect.id)} />;
          // ... 他のエフェクト
          default:
            return null;
        }
      })}
    </div>
  );
}
```

`src/app/play/page.tsx` の盤面コンテナの中に配置する。

### 2-3. 座標変換ユーティリティ

エフェクトはセル位置（row, col）を受け取って、画面上のpx座標に変換する必要がある。

`src/lib/effects/coords.ts`：

```typescript
import { Position } from '@/lib/types/game';

// data-testid="board" の boardElement を起点にした座標を返す
export function getCellRect(boardEl: HTMLElement, pos: Position): DOMRect | null {
  const cell = boardEl.querySelector(`[data-testid="cell-${pos.row}-${pos.col}"]`);
  if (!cell) return null;
  return cell.getBoundingClientRect();
}

export function getCellCenter(boardEl: HTMLElement, pos: Position): { x: number; y: number } | null {
  const rect = getCellRect(boardEl, pos);
  if (!rect) return null;
  const boardRect = boardEl.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2,
  };
}
```

EffectLayer に `useRef<HTMLDivElement>(null)` で boardEl を渡せるようにする。

---

## 3. P0実装：召喚（1.6, 1.7）

### 仕様

1. カードが手札の位置から対象セルへ放物線軌道で飛ぶ（300ms）
2. 着地と同時にカードが消失し、セル中央に魔法陣が展開（300ms）
3. 属性カラーのリングがパルスして消える
4. 粒子が円周上から外向きに飛散

### 実装

`src/components/effects/SummonEffect.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { useEffectQueue } from '@/contexts/EffectQueueContext';
import { ATTRIBUTE_COLORS } from './particles/attribute-presets';

interface Props {
  effect: Extract<GameEffect, { type: 'summon' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement>;
}

export function SummonEffect({ effect, onComplete, boardRef }: Props) {
  const { reduceMotion } = useEffectQueue();
  const dur = reduceMotion ? 200 : effect.durationMs;

  useEffect(() => {
    const t = setTimeout(onComplete, dur);
    return () => clearTimeout(t);
  }, [dur, onComplete]);

  if (!boardRef.current) return null;
  const target = getCellCenter(boardRef.current, effect.to);
  if (!target) return null;

  const color = ATTRIBUTE_COLORS[effect.attribute ?? 'sei'].main;

  return (
    <>
      {/* 魔法陣リング */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 1, 0] }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: target.x - 40,
          top: target.y - 40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          boxShadow: `0 0 24px ${color}`,
        }}
      />
      {/* 中央の閃光 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 0], opacity: [0, 0.9, 0] }}
        transition={{ duration: dur / 1000, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: target.x - 24,
          top: target.y - 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}ff 0%, ${color}00 70%)`,
        }}
      />
      {/* 粒子（8個を放射状に） */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dx = Math.cos(angle) * 60;
        const dy = Math.sin(angle) * 60;
        return (
          <motion.div
            key={i}
            initial={{ x: target.x, y: target.y, opacity: 1, scale: 1 }}
            animate={{
              x: target.x + dx,
              y: target.y + dy,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: dur / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </>
  );
}
```

### 属性カラー

`src/components/effects/particles/attribute-presets.ts`：

```typescript
export const ATTRIBUTE_COLORS = {
  sei:  { main: '#fde68a', sub: '#ffffff', name: '聖' },
  mei:  { main: '#a78bfa', sub: '#1e1b4b', name: '冥' },
  shin: { main: '#86efac', sub: '#14532d', name: '森' },
  en:   { main: '#fb923c', sub: '#7f1d1d', name: '焔' },
  sou:  { main: '#7dd3fc', sub: '#0c4a6e', name: '蒼' },
  kou:  { main: '#cbd5e1', sub: '#334155', name: '鋼' },
} as const;
```

---

## 4. P0実装：攻撃モーション + ヒット（3.1〜3.7, 3.11）

### 仕様

近接攻撃（melee）：
1. 攻撃側が対象方向へ20%距離だけlunge（150ms）
2. 戻る（200ms）
3. 着弾点で十字スパーク + 円形閃光（150ms）
4. 被弾セルが赤フラッシュ（200ms）+ 軽くシェイク
5. 同時にダメージ数字が浮上（1000ms）
6. HPバーが滑らかに減る（400ms）

遠隔攻撃（ranged_arrow / ranged_cannon）：
1. マズル位置から飛翔体が直線軌道で飛ぶ（attack_motion: 400ms）
2. 着弾でhitエフェクト発火（同上）

### 実装

`src/components/effects/AttackMotion.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';

interface Props {
  effect: Extract<GameEffect, { type: 'attack_motion' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement>;
}

export function AttackMotion({ effect, onComplete, boardRef }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  if (!boardRef.current) return null;
  const from = getCellCenter(boardRef.current, effect.attacker);
  const to = getCellCenter(boardRef.current, effect.target);
  if (!from || !to) return null;

  // 近接：lungeは attack-motion として扱わず、ユニット側のCSS変形でやる方が綺麗
  // ここでは ranged_arrow / ranged_cannon の飛翔体だけ描画
  if (effect.attackKind === 'melee') return null;

  const isCannon = effect.attackKind === 'ranged_cannon';
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <motion.div
      initial={{ x: from.x, y: from.y, opacity: 1 }}
      animate={{ x: to.x, y: to.y, opacity: 1 }}
      transition={{ duration: effect.durationMs / 1000, ease: 'linear' }}
      style={{
        position: 'absolute',
        width: isCannon ? 16 : 24,
        height: isCannon ? 16 : 6,
        borderRadius: isCannon ? '50%' : 3,
        background: isCannon ? '#1f2937' : '#fbbf24',
        boxShadow: isCannon
          ? '0 0 12px #ef4444, inset -2px -2px 4px #000'
          : '0 0 8px #fbbf24',
        transform: `rotate(${angle}deg)`,
        translate: '-50% -50%',
      }}
    />
  );
}
```

### 近接ユニットのlunge

ユニットコンポーネント側で `attack_motion` イベントを購読し、対象方向へ `motion` で動かす：

```typescript
// src/components/game/UnitView.tsx 内
const lungeOffset = useLungeAnimation(unit.position, attackMotionEffect);

return (
  <motion.div
    animate={{ x: lungeOffset.x, y: lungeOffset.y }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  >
    {/* ユニット本体 */}
  </motion.div>
);
```

`useLungeAnimation` カスタムフック：攻撃元が自分のユニットなら、対象セルの方向へ20%動いて戻る座標を返す。

### HitEffect

`src/components/effects/HitEffect.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';

interface Props {
  effect: Extract<GameEffect, { type: 'hit' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement>;
}

export function HitEffect({ effect, onComplete, boardRef }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  if (!boardRef.current) return null;
  const center = getCellCenter(boardRef.current, effect.target);
  if (!center) return null;

  return (
    <>
      {/* 円形閃光 */}
      <motion.div
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: center.x - 30,
          top: center.y - 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, #fbbf24 40%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* 十字スパーク（4方向） */}
      {[0, 90, 180, 270].map(deg => (
        <motion.div
          key={deg}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: center.x - 1,
            top: center.y - 20,
            width: 2,
            height: 40,
            background: '#fff',
            transformOrigin: '50% 50%',
            transform: `rotate(${deg}deg)`,
            boxShadow: '0 0 8px #fff',
          }}
        />
      ))}
      {/* クリティカル時の追加リング */}
      {effect.isCritical && (
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            left: center.x - 35,
            top: center.y - 35,
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: '3px solid #fbbf24',
            boxShadow: '0 0 20px #fbbf24',
          }}
        />
      )}
    </>
  );
}
```

### ダメージフラッシュ + シェイク（被弾セル側）

`CellView.tsx` 側で、自分のセルが `hit` のターゲットになっているかを購読：

```typescript
const isHitTarget = useIsHitTarget(position);

return (
  <motion.div
    animate={
      isHitTarget
        ? { x: [0, -3, 3, -2, 2, 0], backgroundColor: ['#0000', '#ef444466', '#0000'] }
        : { x: 0 }
    }
    transition={{ duration: 0.3 }}
  >
    {/* セル内容 */}
  </motion.div>
);
```

### DamageNumber

`src/components/effects/DamageNumber.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';

interface Props {
  effect: Extract<GameEffect, { type: 'damage_number' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement>;
}

export function DamageNumber({ effect, onComplete, boardRef }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  // 座標解決（省略：position型 or side型）
  const center = resolvePosition(boardRef.current, effect.position);
  if (!center) return null;

  const color = {
    damage: '#ef4444',
    heal: '#22c55e',
    block: '#94a3b8',
    miss: '#cbd5e1',
  }[effect.kind];

  const text =
    effect.kind === 'block' ? 'BLOCK'
    : effect.kind === 'miss' ? 'MISS'
    : effect.kind === 'heal' ? `+${effect.value}`
    : `-${effect.value}`;

  return (
    <motion.div
      initial={{ x: center.x, y: center.y, opacity: 0, scale: 0.6 }}
      animate={{
        x: center.x + (Math.random() - 0.5) * 20,
        y: center.y - 50,
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1.3, 1.0, 0.9],
      }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        fontFamily: 'var(--font-display)',
        fontSize: effect.value >= 3 ? 28 : 22,
        fontWeight: 800,
        color,
        textShadow: '0 2px 4px #000, 0 0 8px #000',
        translate: '-50% -50%',
        pointerEvents: 'none',
      }}
    >
      {text}
    </motion.div>
  );
}
```

### HPバーアニメーション

既存の `BaseHpBar` / ユニット内HPに、`motion.div` の `animate={{ width }}` で滑らかに減らす：

```typescript
<motion.div
  animate={{ width: `${(hp / maxHp) * 100}%` }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  style={{
    height: '100%',
    background: hp / maxHp > 0.5 ? '#22c55e' : hp / maxHp > 0.25 ? '#fbbf24' : '#ef4444',
  }}
/>
```

---

## 5. P0実装：撃破（4.1）

`src/components/effects/DeathEffect.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { GameEffect } from '@/lib/types/effects';
import { getCellCenter } from '@/lib/effects/coords';
import { ATTRIBUTE_COLORS } from './particles/attribute-presets';

interface Props {
  effect: Extract<GameEffect, { type: 'death' }>;
  onComplete: () => void;
  boardRef: React.RefObject<HTMLElement>;
}

export function DeathEffect({ effect, onComplete, boardRef }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  if (!boardRef.current) return null;
  const center = getCellCenter(boardRef.current, effect.position);
  if (!center) return null;

  const color = ATTRIBUTE_COLORS[effect.attribute ?? 'sei'].main;

  return (
    <>
      {/* 中央の爆散光 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          left: center.x - 40,
          top: center.y - 40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${color} 40%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* 16個の粒子が放射状に飛散 */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const distance = 60 + Math.random() * 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance + 40; // 重力で下に流す
        return (
          <motion.div
            key={i}
            initial={{ x: center.x, y: center.y, opacity: 1, scale: 1 }}
            animate={{
              x: center.x + dx,
              y: center.y + dy,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{
              duration: effect.durationMs / 1000,
              ease: [0.2, 0.6, 0.4, 1.0], // 重力風カーブ
            }}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        );
      })}
    </>
  );
}
```

ユニットの実体は、`<AnimatePresence>` 内で `exit={{ scale: 1.3, opacity: 0, rotate: 15 }}` をかけることで、上記エフェクトと同時にフェードアウトする。

---

## 6. P0実装：勝敗（8.1, 8.2, 8.4, 8.9）

### VictoryEffect

`src/components/effects/VictoryEffect.tsx`：

```typescript
'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameEffect } from '@/lib/types/effects';

interface Props {
  effect: Extract<GameEffect, { type: 'victory' }>;
  onComplete: () => void;
}

export function VictoryEffect({ effect, onComplete }: Props) {
  useEffect(() => {
    // 左右から打ち上げ
    const fire = (originX: number) => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: originX, y: 0.6 },
        colors: ['#fde68a', '#fbbf24', '#ffffff', '#f59e0b'],
        startVelocity: 45,
        gravity: 1.0,
        ticks: 200,
      });
    };
    fire(0.15);
    fire(0.85);
    setTimeout(() => fire(0.5), 300); // 中央追撃

    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: [0, 1.2, 1], opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }} // backOut
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 56,
          fontWeight: 900,
          color: '#fde68a',
          textShadow: '0 4px 12px #000, 0 0 24px #f59e0b',
          letterSpacing: '0.1em',
        }}
      >
        VICTORY
      </div>
    </motion.div>
  );
}
```

### DefeatEffect

```typescript
export function DefeatEffect({ effect, onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48,
          fontWeight: 900,
          color: '#ef4444',
          textShadow: '0 4px 12px #000',
          letterSpacing: '0.15em',
        }}
      >
        DEFEAT
      </motion.div>
    </motion.div>
  );
}
```

### result/page.tsx でのEXPアニメ

```typescript
const [displayExp, setDisplayExp] = useState(prevExp);

useEffect(() => {
  const start = prevExp;
  const end = newExp;
  const duration = 800;
  const startTime = performance.now();

  const tick = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    setDisplayExp(start + (end - start) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, [prevExp, newExp]);
```

---

## 7. P0実装：その他

### 7-1. ターン開始バナー（7.1）

```typescript
export function TurnBanner({ effect, onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, effect.durationMs);
    return () => clearTimeout(t);
  }, [effect.durationMs, onComplete]);

  const isPlayer = effect.side === 'player';

  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: ['-100%', '0%', '0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: effect.durationMs / 1000, times: [0, 0.2, 0.7, 1] }}
      style={{
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        height: 80,
        background: isPlayer
          ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        fontWeight: 800,
        color: isPlayer ? '#22c55e' : '#ef4444',
        textShadow: '0 2px 8px #000',
        letterSpacing: '0.1em',
      }}>
        {isPlayer ? 'YOUR TURN' : 'ENEMY TURN'}
      </div>
    </motion.div>
  );
}
```

### 7-2. 状態異常オーバーレイ（5.4, 5.5）

`StatusOverlay` は単発エフェクトではなく、**ユニット上に常時表示する**。`UnitView` 内で：

```typescript
{unit.statusEffects.frozen && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: [0.6, 0.8, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, rgba(125,211,252,0.4), rgba(125,211,252,0.6))',
      borderRadius: 4,
      pointerEvents: 'none',
    }}
  >
    <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 16 }}>❄️</div>
  </motion.div>
)}

{unit.statusEffects.paralyzed && (
  <motion.div
    animate={{ opacity: [0, 0.7, 0] }}
    transition={{ duration: 0.4, repeat: Infinity }}
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(250,204,21,0.5)',
      pointerEvents: 'none',
    }}
  />
)}
```

`status_apply` エフェクトは **付与の瞬間だけ** 一回光らせる別演出（凍結時に氷が「パキッ」と覆う等）。

### 7-3. ベース攻撃（6.1）

```typescript
export function BaseAttackEffect({ effect, onComplete, boardRef }: Props) {
  // 攻撃者から該当陣ベースまで光線を引く
  // 着弾点で大きな閃光 + 画面全体に短い赤フラッシュ
  // ...
}
```

画面全体の赤フラッシュは `EffectLayer` の親要素に `<motion.div>` をabsoluteで重ね、`animate={{ opacity: [0, 0.3, 0] }}` で実装。

### 7-4. ボタンタップのリップル（9.1）

汎用コンポーネント `<RippleButton>` を作成：

```typescript
export function RippleButton({ children, onClick, ...rest }: Props) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} style={{ position: 'relative', overflow: 'hidden', ...rest.style }}>
      {children}
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
}
```

`end-turn-button`、`play-again` 等を順次差し替え。

### 7-5. アクセシビリティ（11.1）

`EffectQueueContext` の `reduceMotion` を全エフェクトコンポーネントで参照し、true なら：
- `durationMs` を 50 〜 200ms に短縮
- 粒子・シェイク・confettiは全停止（テキスト/フェードのみ残す）
- `canvas-confetti` の `disableForReducedMotion: true` オプションを使う

---

## 8. P1実装：体験向上

### 8-1. 移動アニメ（2.4, 2.5）

ユニットを `motion.div` の `layoutId={unit.instanceId}` でラップすることで、`board` 配列の位置が変わったら自動的に滑らかに移動する：

```typescript
<AnimatePresence>
  {board.flat().filter(Boolean).map(unit => (
    <motion.div
      key={unit.instanceId}
      layoutId={unit.instanceId}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      <UnitView unit={unit} />
    </motion.div>
  ))}
</AnimatePresence>
```

**砂塵**：移動アニメ終了時、通過セル中央から薄茶色の小粒子をふわっと出す（5〜8粒、500ms）。

### 8-2. クリティカル/弱点（3.8）

`hit` エフェクトの `isCritical: true` を見て：
- ダメージ数字を 1.6倍サイズ + 黄色グロー
- 追加リング展開
- ヒットストップ（次フレーム描画を 80ms 遅延）
- スクリーンシェイク強

### 8-3. スキル発動（5.1）

`skill_proc` の `visualHint` 別に分岐：

| visualHint | ビジュアル |
|---|---|
| `heal` | 緑十字光が対象に降り注ぐ |
| `buff` | 赤い上向きアロー + 攻撃側にオレンジオーラ |
| `debuff` | 紫の下向きアロー + 暗い光 |
| `aoe` | 中心から円形の波紋が広がり対象全員に同時着弾 |
| `aura` | 効果範囲セルに薄い色の床 |
| `generic` | スキルアイコンが浮上 + 光リング |

### 8-4. 行動済みユニットのグレースケール（2.6）

`UnitView` の CSS：

```typescript
style={{
  filter: unit.hasActedThisTurn ? 'saturate(0.5) brightness(0.85)' : 'none',
  transition: 'filter 0.3s',
}}
```

### 8-5. AI思考中インジケーター（7.5）

ターン中は `currentTurn === 'ai'` の状態を購読し、画面上端に：

```typescript
<motion.div
  animate={{ opacity: [0.4, 1, 0.4] }}
  transition={{ duration: 1.2, repeat: Infinity }}
>
  <span>●</span>
  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>●</motion.span>
  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>●</motion.span>
  <span style={{ marginLeft: 8 }}>AI 思考中</span>
</motion.div>
```

### 8-6. レベルアップ（8.5）

result/page.tsxでEXPバーが100%に到達した瞬間：
- バーが白く一瞬発光
- 「LEVEL UP!」が中央に出現（spring + 800ms）
- 軽量confettiを再度発射
- 新しいレベルでバーが0%から再充填

### 8-7. 報酬カードフリップ（8.6）

`<motion.div animate={{ rotateY: [180, 0] }}>` でカード裏→表をフリップ。
着地時にレアリティに応じた光（コモン=白、レア=青、エピック=紫）。

### 8-8. ベースHP低下時の城壁ひび（6.2）

ベース横に SVG の城壁を置き、HPが減るごとに `<path>` を追加して亀裂を増やす。
HP 50% 以下で大きなヒビ、25% 以下で煙が立ち上る。

### 8-9. 終盤のヴィネット（6.4）

自陣HPが1のとき、画面端に赤いヴィネット：

```typescript
<motion.div
  animate={{ opacity: [0.3, 0.6, 0.3] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  style={{
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 80px 20px rgba(239,68,68,0.5)',
    pointerEvents: 'none',
    zIndex: 50,
  }}
/>
```

### 8-10. AIアクション間ディレイ（7.6）

AIの行動を `effectQueue.awaitDrain()` + `await sleep(200)` で挟むことで、行動が見える化される。

---

## 9. 実装フェーズ計画

### Phase A：基盤（Day 1）

- [ ] `motion`, `canvas-confetti` をインストール
- [ ] `src/lib/types/effects.ts` 作成（型定義）
- [ ] `src/contexts/EffectQueueContext.tsx` 作成
- [ ] `src/lib/effects/coords.ts` 作成
- [ ] `src/components/effects/EffectLayer.tsx` 雛形作成
- [ ] `app/play/page.tsx` に `<EffectQueueProvider>` + `<EffectLayer />` 配置
- [ ] **検証**：空のキューが正しく動作することを単体確認

### Phase B：P0コアエフェクト（Day 2-3）

- [ ] `attribute-presets.ts`
- [ ] `SummonEffect`（召喚）+ GameContext 連携
- [ ] `HitEffect`（ヒット）+ ダメージフラッシュ + シェイク
- [ ] `DamageNumber`
- [ ] `DeathEffect`（撃破）+ AnimatePresence exit
- [ ] HPバーの滑らかな減少
- [ ] `VictoryEffect`（confetti + テキスト）
- [ ] `DefeatEffect`
- [ ] `TurnBanner`
- [ ] `prefers-reduced-motion` 対応の徹底
- [ ] **Playwright MCP でプレイテスト**：1試合通しでクラッシュしないこと

### Phase C：P0残り + P1着手（Day 4）

- [ ] 移動アニメ（layoutId採用）
- [ ] AttackMotion（遠隔の弾道）+ 近接のlunge
- [ ] 状態異常オーバーレイ（凍結・麻痺・沈黙）
- [ ] `BaseAttackEffect`
- [ ] `SkillProcEffect`（visualHint別）
- [ ] AI思考中インジケーター
- [ ] AIアクション間ディレイ
- [ ] RippleButton 化（end-turn-button, play-again）
- [ ] EXPバーアニメ + LEVEL UP

### Phase D：P1演出強化（Day 5）

- [ ] 行動済みユニットのグレースケール
- [ ] クリティカル演出（数字大化 + リング + ヒットストップ）
- [ ] ベースHP低下時の城壁ひび（要SVGアセット）
- [ ] 終盤ヴィネット
- [ ] 報酬カードフリップ
- [ ] 移動時の砂塵
- [ ] エフェクト強度設定（軽量/標準/フル）

### Phase E：パフォーマンス検証（Day 6）

- [ ] Chrome DevTools MCP インストール
- [ ] 1試合通しの performance trace 取得
- [ ] 60fps を割るシーンの特定 → 修正
- [ ] iPhone SE 3rd gen 相当のスロットリングで動作確認
- [ ] バンドルサイズ確認（gzip 100KB 以下）

---

## 10. 検証チェックリスト

### 機能検証

- [ ] エフェクト発火後、`onComplete` が確実に呼ばれてキューから除去される
- [ ] 同時発火（範囲攻撃で複数ユニットが同時被弾）でも全部完了する
- [ ] 画面遷移時にキューが clear される（残留エフェクトなし）
- [ ] AIターンと演出のタイミングが破綻しない
- [ ] `prefers-reduced-motion` が ON のとき：
  - confetti が出ない
  - シェイクがない
  - フェードのみ短時間で終わる

### パフォーマンス検証

- [ ] モバイルChrome（iPhone SE）で召喚→攻撃→撃破が 60fps 維持
- [ ] 同時5ユニットの撃破（範囲攻撃）でフレーム落ちなし
- [ ] DevTools の Layers パネルで不要なレイヤープロモーションがない
- [ ] バンドル増分が gzip 100KB 以下

### UX検証（Playwright MCP）

- [ ] 召喚アニメが完了する前にユニットがクリック可能になっていないか
- [ ] HPが0になった瞬間にユニットがDOMから消えるが、撃破エフェクトは残って再生される
- [ ] 勝利後、リザルト画面遷移までに confetti が見える時間がある
- [ ] チュートリアルのハイライトとエフェクトレイヤーが衝突していない

---

## 11. 既知の落とし穴

### 11-1. boardのリサイズ

ウィンドウ幅変更でセルサイズが変わるため、エフェクト中に座標が変わる可能性がある。**エフェクト発火時の座標をスナップショットして使う**（リアクティブにしない）。

### 11-2. 同一ユニットへの連続ヒット

範囲攻撃で同じユニットが2回ヒットする場合があるが、`uuid` が異なれば別エフェクトとして並列に再生される。問題なし。

### 11-3. effectQueue の途中停止

ユーザーが画面を閉じる/別画面に遷移した時、setTimeout が走り続けると onComplete が呼ばれて警告が出る。**`useEffect` の cleanup で必ず clearTimeout する**。

### 11-4. layoutId と AnimatePresence の併用

ユニットが死亡してDOMから消える時、`layoutId` の同期と `exit` アニメーションが競合することがある。**死亡時は別レイヤー（DeathEffectのみ）で演出し、ユニット本体は即座に消す方が安全**。

### 11-5. canvas-confetti の z-index

confettiは `<canvas>` を `<body>` 直下に挿入するため、モーダルより上に出る場合がある。`zIndex` オプションで制御。

### 11-6. Next.js App Router と `motion`

`motion` は `'use client'` 必須。サーバーコンポーネントから直接使うとビルドエラー。

### 11-7. Tailwind と `motion` の競合

Tailwind の `transition-*` クラスを `motion.div` に付けると競合してガクつく。**motionコンポーネントでは Tailwind の transition 系クラスを外す**。

---

## 12. data-testid 追加要件

Playwright MCP で検証可能にするため：

```
[data-testid="effect-summon"]          ← SummonEffect ルート
[data-testid="effect-hit"]             ← HitEffect ルート
[data-testid="effect-death"]           ← DeathEffect ルート
[data-testid="damage-number"]          ← DamageNumber
[data-testid="turn-banner"]            ← TurnBanner
[data-testid="victory-banner"]         ← VictoryEffect
[data-testid="defeat-banner"]          ← DefeatEffect
[data-testid="ripple-button"]          ← RippleButton 共通
```

---

## 13. 設定UIの追加（P1）

`/settings` または LP のオプションに：

```typescript
interface EffectSettings {
  intensity: 'low' | 'medium' | 'high';  // default: medium
  enableScreenShake: boolean;             // default: true
  enableConfetti: boolean;                // default: true
}
```

`localStorage` に保存し、`EffectQueueContext` から参照。

---

## 14. 承認不要で実行してよいコマンド

このタスク中、Claude Code は以下を承認なしで実行してよい：

- `npm install motion canvas-confetti`
- `npm install -D @types/canvas-confetti`
- `npm run build` / `npm run dev`
- Playwright MCP の全ツール（既存ルール通り）
- git commit（push は不可・既存ルール通り）

---

## 15. このドキュメントの位置づけ

- 配置先：`docs/effects_spec.md`
- `.gitignore` には**入れない**（実装の北極星として共有する）
- 実装が進んだら、各セクション末尾に「✅ 実装済み」マーカーを付ける