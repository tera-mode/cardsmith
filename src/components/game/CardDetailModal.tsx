'use client';

import { Unit } from '@/lib/types/game';
import RangeDiagram from './RangeDiagram';

const CARD_EMOJI: Record<string, string> = {
  militia: '🪖', light_infantry: '⚔️', assault_soldier: '🗡️',
  scout: '🏃', spear_soldier: '🔱', heavy_infantry: '🛡️',
  combat_soldier: '⚔️', archer: '🏹', guard: '🛡️',
  healer: '✨', cavalry: '🐴', cannon: '💣', defender: '🏰',
};

const CARD_GRADIENT: Record<string, string> = {
  militia: '#4a3510,#7c5a1e',
  light_infantry: '#1a2f5f,#2563a0',
  assault_soldier: '#5a1a1a,#9b2525',
  scout: '#1a3a1a,#2d7a30',
  spear_soldier: '#4a3a10,#8a6a20',
  heavy_infantry: '#2a2a2a,#5a5a5a',
  combat_soldier: '#3a1f0a,#8b4513',
  archer: '#0f3a2a,#1a6a4a',
  guard: '#0a2a3a,#1a5a7a',
  healer: '#3a1a3a,#7a3a7a',
  cavalry: '#3a2a0a,#7a5a0a',
  cannon: '#1a1a2a,#3a3a5a',
  defender: '#1a1a4a,#2a2a8a',
};

const FLAVOR: Record<string, string> = {
  militia: '農民から徴兵された最前線の盾。装備は粗末でも意志は本物だ。',
  light_infantry: '素早い機動で前線を駆け抜ける軽装の歩兵。',
  assault_soldier: '奇襲を得意とする精鋭。接近すれば誰も止められない。',
  scout: '2マス先を跳ぶ偵察兵。戦線を一気に押し上げる速さが武器。',
  spear_soldier: '長槍の間合いを制する者が戦場を制する。',
  heavy_infantry: '鋼鉄の守りに命を預ける重装歩兵。圧倒的な耐久力を誇る。',
  combat_soldier: '鍛え抜かれた精鋭戦士。高い攻撃力で戦場を切り開く。',
  archer: '2マス先まで矢を届ける弓の名手。貫通で陣地を直接狙う。',
  guard: '四方をすべて守る万能の衛兵。どの方向にも即座に対応する。',
  healer: '味方の傷を癒す治癒師。攻めはできないが仲間の命をつなぐ。',
  cavalry: '2マス先へ跳躍する騎兵。強化の鼓舞で味方を奮い立たせる。',
  cannon: '4マス先まで届く砲撃は戦場を一変させる。大貫通が最大の脅威。',
  defender: '周囲8方向を守護し、攻撃を受ければ即座に反撃する鉄壁の守護者。',
};

interface Props {
  unit: Unit;
  onClose: () => void;
}

export default function CardDetailModal({ unit, onClose }: Props) {
  const { card } = unit;
  const isPlayer = unit.owner === 'player';
  const atk = card.atk + unit.buffs.atkBonus;
  const emoji = CARD_EMOJI[card.id] ?? '⚔️';
  const [gradFrom, gradTo] = (CARD_GRADIENT[card.id] ?? '#1a1a2e,#2a2a4e').split(',');
  const flavor = FLAVOR[card.id] ?? '';
  const borderColor = isPlayer ? '#3b82f6' : '#ef4444';
  const hpPct = unit.maxHp > 0 ? (unit.currentHp / unit.maxHp) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* カード本体 */}
      <div
        className="relative w-[272px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: `2px solid ${borderColor}`, boxShadow: `0 0 24px ${borderColor}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 上半分：キャラビジュアル ── */}
        <div
          className="relative w-full h-[180px] flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${gradFrom}, ${gradTo})` }}
        >
          {/* ドット柄テクスチャ */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />

          {/* キャラ画像（存在する場合） */}
          <img
            src={`/images/cards/${card.id}.png`}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* フォールバック絵文字（画像がない場合のみ見える） */}
          <span className="text-[72px] drop-shadow-2xl relative z-10 select-none leading-none">
            {emoji}
          </span>

          {/* コストバッジ */}
          <div
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
            style={{ backgroundColor: '#f59e0b', color: '#000' }}
          >
            {card.cost}
          </div>

          {/* 下部グラデーション */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#16213e] to-transparent" />
        </div>

        {/* ── 下半分：テキスト ── */}
        <div className="bg-[#16213e] px-4 pt-3 pb-4 space-y-2.5">

          {/* カード名 + ATK/HP */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide">{card.name}</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#60a5fa] font-bold">⚔{atk}</span>
              <span className="text-green-400 font-bold">❤{unit.currentHp}/{unit.maxHp}</span>
            </div>
          </div>

          {/* HPバー */}
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${hpPct}%`,
                backgroundColor: hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>

          {/* 区切り */}
          <div className="border-t border-[#1e3a5f]" />

          {/* レンジダイアグラム */}
          <RangeDiagram card={card} />

          {/* 区切り */}
          <div className="border-t border-[#1e3a5f]" />

          {/* スキル */}
          {card.skill ? (
            <div className="bg-[#0f1a2e] rounded-xl px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-xs font-bold">★ {card.skill.name}</span>
                <span className="text-[10px] text-gray-500 ml-auto">
                  {unit.skillUsesRemaining === 'infinite' ? '∞ 無限' : `残${unit.skillUsesRemaining}回`}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{card.skill.description}</p>
            </div>
          ) : (
            <p className="text-[11px] text-gray-600 text-center py-1">スキルなし</p>
          )}

          {/* フレーバーテキスト */}
          {flavor && (
            <p className="text-[10px] text-gray-500 italic text-center leading-relaxed border-t border-[#1e3a5f] pt-2">
              {flavor}
            </p>
          )}

          {/* 閉じるヒント */}
          <p className="text-[10px] text-gray-600 text-center">タップで閉じる</p>
        </div>
      </div>
    </div>
  );
}
