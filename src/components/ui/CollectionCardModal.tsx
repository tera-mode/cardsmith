'use client';

import { Card } from '@/lib/types/game';
import { Rarity } from '@/lib/types/meta';
import RangeDiagram from '@/components/game/RangeDiagram';
import { getSkill } from '@/lib/game/skills/index';

const ATTR_GRADIENT: Record<string, [string, string]> = {
  sei:  ['#2a2010', '#6a5a2a'],
  mei:  ['#1a0a2e', '#4a1a4a'],
  shin: ['#0a2a10', '#1a5a1a'],
  en:   ['#2a0a0a', '#6a1a1a'],
  sou:  ['#0a1a3a', '#1a3a7a'],
  kou:  ['#1a1a2a', '#2a2a5a'],
};

const ATTR_LABEL: Record<string, string> = {
  sei: '⚪ 聖', mei: '⚫ 冥', shin: '🟢 森',
  en: '🔴 焔', sou: '🔵 蒼', kou: '⚙️ 鋼',
};

const RARITY_COLOR: Record<Rarity, string> = {
  C: '#9ca3af', R: '#60a5fa', SR: '#a78bfa', SSR: '#fbbf24',
};

interface Props {
  card: Card & { rarity: Rarity };
  count?: number;
  onClose: () => void;
}

export default function CollectionCardModal({ card, count = 0, onClose }: Props) {
  const [gradFrom, gradTo] = ATTR_GRADIENT[card.attribute ?? ''] ?? ['#1a1a2e', '#2a2a4e'];
  const rarityColor = RARITY_COLOR[card.rarity];
  const attrLabel = ATTR_LABEL[card.attribute ?? ''] ?? '';
  const skillDef = card.skill ? getSkill(card.skill.id) : null;

  return (
    <>
      {/* バックドロップ */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      {/* ボトムシート：fixed で画面下部に固定 */}
      <div
        className="fixed z-50 rounded-t-3xl overflow-hidden shadow-2xl"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '95%',
          maxWidth: 480,
          border: `1.5px solid ${rarityColor}50`,
          borderBottom: 'none',
          boxShadow: `0 -4px 40px ${rarityColor}25`,
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── キャラビジュアル（大画像） ── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: '55vw',
            maxHeight: 300,
            background: `linear-gradient(160deg, ${gradFrom}, ${gradTo})`,
          }}
        >
          {/* ドット柄テクスチャ */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* キャラクター画像 */}
          <img
            src={card.imagePath ?? `/images/chars/${card.id}.png`}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 12%' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* 上部バッジ群 */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${rarityColor}25`,
                color: rarityColor,
                border: `1px solid ${rarityColor}70`,
                backdropFilter: 'blur(4px)',
              }}
            >
              {card.rarity}
            </span>
            {attrLabel && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
              >
                {attrLabel}
              </span>
            )}
          </div>
          {/* コストバッジ */}
          <div
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: '#f59e0b', color: '#000', boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {card.cost}
          </div>
          {/* 所持枚数 */}
          <div
            className="absolute bottom-3 right-3 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
          >
            所持 ×{count}
          </div>
          {/* ドラッグハンドル */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/30" />
          {/* 下部グラデーション */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16213e] to-transparent" />
        </div>

        {/* ── テキスト部分 ── */}
        <div className="bg-[#16213e] px-5 pt-4 pb-6 space-y-4">
          {/* カード名 + ATK/HP */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white leading-tight">{card.name}</h2>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className="text-sm font-bold" style={{ color: '#ffb44a' }}>⚔ {card.atk}</span>
              <span className="text-sm font-bold" style={{ color: '#6bd998' }}>♥ {card.hp}</span>
            </div>
          </div>

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
                <span className="text-[11px] text-gray-500 ml-auto">
                  {card.skill!.uses === 'infinite' ? '∞ 無限' : `${card.skill!.uses}回`}
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
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
