'use client';

import { useGame } from '@/contexts/GameContext';
import { InteractionMode, Unit, GameSession } from '@/lib/types/game';
import { getLegalAttacks } from '@/lib/game/rules';
import { SKILL_RESOLVERS } from '@/lib/game/skills';

interface Props {
  mode: InteractionMode;
  session: GameSession;
}

// unit_selected 中は盤面操作を優先するため、
// 「移動しない」ボタンだけを小さなフローティングとして表示する
export function SkipMoveButton({ mode }: { mode: InteractionMode }) {
  const { moveUnit, cancel } = useGame();
  if (mode.type !== 'unit_selected') return null;
  const unit = mode.unit;

  return (
    <div className="fixed bottom-[76px] inset-x-0 flex justify-center gap-2 z-10 pointer-events-none">
      <button
        onClick={() => moveUnit(unit.position)}
        className="pointer-events-auto px-4 py-2 bg-[#0f3460]/90 text-white text-sm rounded-full border border-[#3b82f6]/40 backdrop-blur-sm shadow-lg"
      >
        その場に留まる
      </button>
      <button
        onClick={cancel}
        className="pointer-events-auto px-4 py-2 bg-[#0f1a2e]/90 text-gray-400 text-sm rounded-full border border-gray-600/40 backdrop-blur-sm shadow-lg"
      >
        キャンセル
      </button>
    </div>
  );
}

// unit_moved 後の攻撃・スキル選択メニュー（オーバーレイ付き）
export default function ActionMenu({ mode, session }: Props) {
  const { attackTarget, useSkill, cancel } = useGame();

  if (mode.type !== 'unit_moved') return null;

  const unit: Unit = mode.unit;
  const attacks = getLegalAttacks(unit, session.board);
  const skill = unit.card.skill;
  const skillResolver = skill ? SKILL_RESOLVERS[skill.effectType] : null;
  const canUseSkill = skillResolver ? skillResolver.canActivate(session, unit) : false;

  const hasActions = attacks.length > 0 || canUseSkill;

  return (
    <div data-testid="action-menu" className="fixed inset-x-0 bottom-0 z-20 safe-bottom">
      {/* 背景オーバーレイ（タップでキャンセル） */}
      <div className="fixed inset-0 bg-black/40 -z-10" onClick={cancel} />

      <div className="bg-[#16213e] border-t border-[#1e3a5f] px-3 py-3 rounded-t-2xl max-w-[480px] mx-auto">
        {/* ユニット情報 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-white">{unit.card.name}</span>
          <span className="text-xs text-[#60a5fa]">ATK {unit.card.atk + unit.buffs.atkBonus}</span>
          <span className="text-xs text-green-400">HP {unit.currentHp}/{unit.maxHp}</span>
          {skill && (
            <span className="text-xs text-purple-400 ml-auto">
              ★ {skill.name}
              {unit.skillUsesRemaining !== 'infinite' && ` (${unit.skillUsesRemaining}回)`}
            </span>
          )}
        </div>

        {!hasActions && (
          <p className="text-xs text-gray-500 mb-3 text-center">行動できる対象がありません</p>
        )}

        <div className="flex gap-2 flex-wrap">
          {/* 攻撃ボタン */}
          {attacks.map((target, i) => {
            const label = target.type === 'base'
              ? '🏰 ベース攻撃'
              : `⚔ ${target.unit.card.name}を攻撃`;
            return (
              <button
                key={i}
                onClick={() => attackTarget(target)}
                className="tap-target flex-1 min-w-[120px] bg-[#7f1d1d] hover:bg-[#991b1b] text-white text-sm rounded-xl border border-[#ef4444]/30"
              >
                {label}
              </button>
            );
          })}

          {/* スキルボタン */}
          {skill && canUseSkill && (
            <button
              data-testid="skill-button"
              onClick={() => {
                if (!skillResolver) return;
                const targets = skillResolver.getValidTargets(session, unit);
                useSkill(targets.length > 0 ? targets[0] : undefined);
              }}
              className="tap-target flex-1 min-w-[120px] bg-[#4c1d95] hover:bg-[#5b21b6] text-white text-sm rounded-xl border border-purple-500/30"
            >
              ★ {skill.name}
            </button>
          )}

          {/* 何もしない / キャンセル */}
          <button
            onClick={cancel}
            className="tap-target flex-1 min-w-[80px] bg-[#0f1a2e] text-gray-400 text-sm rounded-xl border border-gray-600"
          >
            {hasActions ? '✕' : '閉じる'}
          </button>
        </div>
      </div>
    </div>
  );
}
