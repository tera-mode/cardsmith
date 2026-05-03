'use client';

import { useGame } from '@/contexts/GameContext';
import { InteractionMode, Unit } from '@/lib/types/game';
import { getLegalAttacks } from '@/lib/game/rules';
import { SKILL_RESOLVERS } from '@/lib/game/skills';

interface Props {
  mode: InteractionMode;
  session: import('@/lib/types/game').GameSession;
}

export default function ActionMenu({ mode, session }: Props) {
  const { moveUnit, attackTarget, useSkill, cancel } = useGame();

  if (mode.type !== 'unit_selected' && mode.type !== 'unit_moved') return null;

  const unit: Unit = mode.unit;
  const attacks = getLegalAttacks(unit, session.board);
  const skill = unit.card.skill;
  const skillResolver = skill ? SKILL_RESOLVERS[skill.effectType] : null;
  const canUseSkill = skillResolver ? skillResolver.canActivate(session, unit) : false;

  const hasMoved = mode.type === 'unit_moved';

  return (
    <div
      data-testid="action-menu"
      className="fixed inset-x-0 bottom-0 z-20 safe-bottom"
    >
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/40 -z-10"
        onClick={cancel}
      />

      <div className="bg-[#16213e] border-t border-[#1e3a5f] px-3 py-3 rounded-t-2xl">
        {/* ユニット情報 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-white">{unit.card.name}</span>
          <span className="text-xs text-[#60a5fa]">ATK {unit.card.atk + unit.buffs.atkBonus}</span>
          <span className="text-xs text-green-400">HP {unit.currentHp}/{unit.maxHp}</span>
          {unit.card.skill && (
            <span className="text-xs text-purple-400 ml-auto">
              ★ {unit.card.skill.name}
              {unit.skillUsesRemaining !== 'infinite' && ` (${unit.skillUsesRemaining}回)`}
            </span>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          {/* 移動しない（まだ移動してない場合） */}
          {!hasMoved && (
            <button
              onClick={() => moveUnit(unit.position)}
              className="tap-target flex-1 bg-[#0f3460] text-white text-sm rounded-xl border border-[#1e3a5f]"
            >
              その場に留まる
            </button>
          )}

          {/* 攻撃 */}
          {attacks.map((target, i) => {
            const label = target.type === 'base'
              ? '🏰 ベース攻撃'
              : `⚔ ${target.unit.card.name}を攻撃`;
            return (
              <button
                key={i}
                onClick={() => attackTarget(target)}
                className="tap-target flex-1 bg-[#7f1d1d] hover:bg-[#991b1b] text-white text-sm rounded-xl border border-[#ef4444]/30"
              >
                {label}
              </button>
            );
          })}

          {/* スキル */}
          {skill && canUseSkill && (
            <button
              data-testid="skill-button"
              onClick={() => {
                if (!skillResolver) return;
                const targets = skillResolver.getValidTargets(session, unit);
                if (targets.length === 0) {
                  useSkill(undefined);
                }
                // ターゲット選択が必要な場合は GameContext 側でハイライト表示
                // TODO: ターゲット選択UI（Phase 2.5で対応）
                if (targets.length > 0) {
                  useSkill(targets[0]); // 暫定: 最初の対象を自動選択
                }
              }}
              className="tap-target flex-1 bg-[#4c1d95] hover:bg-[#5b21b6] text-white text-sm rounded-xl border border-purple-500/30"
            >
              ★ {skill.name}
            </button>
          )}

          {/* キャンセル */}
          <button
            onClick={cancel}
            className="tap-target w-12 bg-[#0f1a2e] text-gray-400 text-sm rounded-xl border border-gray-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
