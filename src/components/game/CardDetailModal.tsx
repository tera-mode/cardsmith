'use client';

import { Unit } from '@/lib/types/game';
import RangeDiagram from './RangeDiagram';
import { getSkill } from '@/lib/game/skills/index';

function SkillDisplay({ skillId, uses }: { skillId: string; uses: number | 'infinite' }) {
  const skillDef = getSkill(skillId);
  const name = skillDef?.displayName ?? skillId;
  const desc = skillDef?.description ?? '';
  return (
    <div className="bg-[#0f1a2e] rounded-xl px-3 py-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-purple-400 text-xs font-bold">★ {name}</span>
        <span className="text-[10px] text-gray-500 ml-auto">
          {uses === 'infinite' ? '∞ 無限' : `残${uses}回`}
        </span>
      </div>
      {desc && <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>}
    </div>
  );
}

// 属性グラデーション
const ATTR_GRADIENT: Record<string, [string, string]> = {
  sei:  ['#2a2010', '#5a4a1a'],  // 金・生成り
  mei:  ['#1a0a2e', '#3a1a3a'],  // 深紫黒
  shin: ['#0a2a10', '#1a4a1a'],  // 深緑
  en:   ['#2a0a0a', '#5a1a1a'],  // 深紅
  sou:  ['#0a1a3a', '#1a3a6a'],  // 深青
  kou:  ['#1a1a2a', '#2a2a4a'],  // 鉄黒
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
  const atk = card.atk + unit.buffs.atkBonus + unit.buffs.auraAtk;
  const [gradFrom, gradTo] = ATTR_GRADIENT[card.attribute ?? ''] ?? ['#1a1a2e', '#2a2a4e'];
  const flavor = FLAVOR[card.id] ?? '';
  const borderColor = isPlayer ? '#3b82f6' : '#ef4444';
  const hpPct = unit.maxHp > 0 ? (unit.currentHp / unit.maxHp) * 100 : 0;

  return (
    <>
      {/* バックドロップ（タップで閉じる） */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* カード本体：fixed で viewport 中央に独立配置 */}
      <div
        className="fixed z-50 w-[272px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 24px ${borderColor}40`,
          maxHeight: '86dvh',
          overflowY: 'auto',
        }}
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

          {/* キャラクター画像 */}
          <img
            src={card.imagePath ?? `/images/chars/${card.id}.png`}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 15%' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

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
            <SkillDisplay skillId={card.skill.id} uses={unit.skillUsesRemaining} />
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
    </>
  );
}
