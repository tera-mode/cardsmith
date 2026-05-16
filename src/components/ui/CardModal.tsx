'use client';

import { Card, Unit } from '@/lib/types/game';
import { Rarity } from '@/lib/types/meta';
import RangeDiagram from '@/components/game/RangeDiagram';
import { getSkill } from '@/lib/game/skills/index';

// ─── 定数 ────────────────────────────────────────────────────────────────────

const ATTR_GRADIENT: Record<string, [string, string]> = {
  sei:  ['#2a2010', '#5a4a1a'],
  mei:  ['#1a0a2e', '#3a1a3a'],
  shin: ['#0a2a10', '#1a4a1a'],
  en:   ['#2a0a0a', '#5a1a1a'],
  sou:  ['#0a1a3a', '#1a3a6a'],
  kou:  ['#1a1a2a', '#2a2a4a'],
};

const ATTR_COLOR: Record<string, string> = {
  sei: '#d4af37', mei: '#9333ea', shin: '#22c55e',
  en: '#ef4444',  sou: '#3b82f6', kou: '#64748b',
};

const ATTR_LABEL: Record<string, string> = {
  sei: '⚪ 聖', mei: '⚫ 冥', shin: '🟢 森',
  en: '🔴 焔', sou: '🔵 蒼', kou: '⚙️ 鋼',
};

const RARITY_COLOR: Record<string, string> = {
  C: '#9ca3af', R: '#60a5fa', SR: '#a78bfa', SSR: '#fbbf24',
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CardModalProps {
  card: Card & { rarity?: Rarity };
  /** バトル画面：ユニットがあれば現在HP・バフ後ATK・残スキル回数を表示 */
  unit?: Unit;
  /** コレクション画面：所持枚数 */
  count?: number;
  /** 鍛造カード等のカスタム画像URL（/images/chars/{id}.png より優先） */
  customImage?: string;
  onClose: () => void;
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

export default function CardModal({ card, unit, count, customImage, onClose }: CardModalProps) {
  const [gradFrom, gradTo] = ATTR_GRADIENT[card.attribute ?? ''] ?? ['#1a1a2e', '#2a2a4e'];
  const attrColor  = ATTR_COLOR[card.attribute ?? ''] ?? '#4b5563';
  const attrLabel  = ATTR_LABEL[card.attribute ?? ''] ?? '';
  const rarityColor = card.rarity ? RARITY_COLOR[card.rarity] ?? '#9ca3af' : attrColor;

  // ATK: バフ込みか基本値か
  const atk = unit
    ? card.atk + unit.buffs.atkBonus + unit.buffs.auraAtk
    : card.atk;

  // HP: 現在値/最大値か基本値か
  const currentHp = unit ? unit.currentHp : card.hp;
  const maxHp     = unit ? unit.maxHp     : card.hp;
  const hpPct     = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;

  // スキル残回数: ユニットがあれば残回数、なければカード定義の使用回数
  const skillUses: number | 'infinite' = unit
    ? unit.skillUsesRemaining
    : (card.skill?.uses ?? 0);

  const skillDef = card.skill ? getSkill(card.skill.id) : null;

  // ボーダー色: 属性色を基本に、バトル画面ではオーナー色を加味
  const borderColor = unit
    ? (unit.owner === 'player' ? '#3b82f6' : '#ef4444')
    : rarityColor;

  // 未所持（count=0）はイラストをグレーアウト
  const isUnowned = count !== undefined && count === 0;
  const imageSrc = customImage ?? card.imagePath ?? `/images/chars/${card.id}.png`;

  return (
    <>
      {/* バックドロップ */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      />

      {/* カード本体：viewport 中央に独立配置 */}
      <div
        className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, 92vw)',
          maxHeight: '88dvh',
          overflowY: 'auto',
          border: `2px solid ${borderColor}80`,
          boxShadow: `0 0 40px ${borderColor}35`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── キャラクター画像エリア ── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: 'min(260px, 56vw)',
            background: `linear-gradient(160deg, ${gradFrom}, ${gradTo})`,
          }}
        >
          {/* ドット柄テクスチャ */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />

          {/* キャラクター画像（未所持時はグレーアウト） */}
          <img
            src={imageSrc}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: 'center 15%',
              filter: isUnowned ? 'grayscale(100%)' : undefined,
              opacity: isUnowned ? 0.5 : 1,
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* 左上バッジ群 */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {card.rarity && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${rarityColor}25`,
                  color: rarityColor,
                  border: `1px solid ${rarityColor}60`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {card.rarity}
              </span>
            )}
            {attrLabel && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
              >
                {attrLabel}
              </span>
            )}
          </div>

          {/* コストバッジ：バトル中（unit あり）は小さく目立たなく */}
          {unit ? (
            <div
              className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-display)' }}
            >
              {card.cost}
            </div>
          ) : (
            <div
              className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg"
              style={{ backgroundColor: '#f59e0b', color: '#000' }}
            >
              {card.cost}
            </div>
          )}

          {/* 所持枚数（コレクション画面） */}
          {count !== undefined && (
            <div
              className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
            >
              所持 ×{count}
            </div>
          )}

          {/* 下部グラデーション */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#16213e] to-transparent" />
        </div>

        {/* ── テキストエリア ── */}
        <div className="bg-[#16213e] px-5 pt-4 pb-5 space-y-3">

          {/* カード名 + ATK/HP */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white leading-tight">{card.name}</h2>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span className="font-bold" style={{ color: '#ffb44a' }}>⚔ {atk}</span>
              <span className="font-bold" style={{ color: '#6bd998' }}>
                ♥ {unit ? `${currentHp}/${maxHp}` : maxHp}
              </span>
            </div>
          </div>

          {/* HP バー（ユニットがある場合のみ） */}
          {unit && (
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hpPct}%`,
                  backgroundColor: hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          )}

          {/* 区切り */}
          <div className="border-t border-[#1e3a5f]" />

          {/* レンジダイアグラム */}
          <RangeDiagram card={card} />

          {/* 区切り */}
          <div className="border-t border-[#1e3a5f]" />

          {/* スキル */}
          {skillDef ? (
            <div className="bg-[#0f1a2e] rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-sm font-bold">★ {skillDef.displayName}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {skillUses === 'infinite' ? '∞ 無限' : `${unit ? '残' : ''}${skillUses}回`}
                </span>
              </div>
              {skillDef.description && (
                <p className="text-xs text-gray-400 leading-relaxed">{skillDef.description}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-1">スキルなし</p>
          )}

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
