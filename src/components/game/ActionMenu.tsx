'use client';

import { useGame } from '@/contexts/GameContext';
import { InteractionMode, Unit, GameSession } from '@/lib/types/game';
import { getLegalAttacks } from '@/lib/game/rules';
import { SKILL_RESOLVERS } from '@/lib/game/skills';

interface Props {
  mode: InteractionMode;
  session: GameSession;
}

// unit_moving 中に表示するインラインボタン（レイアウト内に配置）
export function SkipMoveButton({ mode }: { mode: InteractionMode }) {
  const { moveUnit, cancelMove } = useGame();
  if (mode.type !== 'unit_moving') return null;
  const unit = mode.unit;

  return (
    <div className="flex justify-center gap-2 px-3 py-1.5 flex-shrink-0">
      <button
        onClick={() => moveUnit(unit.position)}
        className="tap-target flex-1 bg-[#0f3460] text-white text-sm rounded-xl border border-[#3b82f6]/40 shadow-lg active:scale-95"
      >
        その場に留まる
      </button>
      <button
        onClick={cancelMove}
        className="tap-target px-5 bg-[#0f1a2e] text-gray-400 text-sm rounded-xl border border-gray-600/40 shadow-lg active:scale-95"
      >
        ← 戻る
      </button>
    </div>
  );
}

// ─── メインのアクションメニュー ───────────────────────────────────────────
// unit_selected: ユニット選択直後（移動 / 攻撃 / スキル / キャンセル）
// unit_post_move: 移動完了後（攻撃 / スキル / 行動終了）

export default function ActionMenu({ mode, session }: Props) {
  const { attackTarget, useSkill, startMove, endUnitAction, cancel } = useGame();

  const isUnitSelected = mode.type === 'unit_selected';
  const isPostMove = mode.type === 'unit_post_move';
  if (!isUnitSelected && !isPostMove) return null;

  const unit: Unit = mode.unit;
  const attacks = getLegalAttacks(unit, session.board);
  const skill = unit.card.skill;
  const skillResolver = skill ? SKILL_RESOLVERS[skill.effectType] : null;
  const canUseSkill = skillResolver ? skillResolver.canActivate(session, unit) : false;
  const canMove = isUnitSelected && !session.player.hasMovedThisTurn;
  const hasAttackOptions = attacks.length > 0 || canUseSkill;

  return (
    <div data-testid="action-menu" className="fixed inset-x-0 bottom-0 z-20 safe-bottom">
      {/* 背景オーバーレイ（unit_selected のみ：クリックでキャンセル可） */}
      {isUnitSelected && (
        <div className="fixed inset-0 bg-black/40 -z-10" onClick={cancel} />
      )}

      <div className="bg-[#16213e] border-t border-[#1e3a5f] px-3 py-3 rounded-t-2xl max-w-[480px] mx-auto">
        {/* ユニット情報 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-white">{unit.card.name}</span>
          <span className="text-xs text-[#60a5fa]">ATK {unit.card.atk + unit.buffs.atkBonus}</span>
          <span className="text-xs text-green-400">HP {unit.currentHp}/{unit.maxHp}</span>
          {isPostMove && (
            <span className="text-xs text-yellow-400 ml-1">🚶 移動済</span>
          )}
          {skill && (
            <span className="text-xs text-purple-400 ml-auto">
              ★ {skill.name}
              {unit.skillUsesRemaining !== 'infinite' && ` (${unit.skillUsesRemaining}回)`}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* 【移動する】 unit_selected のみ */}
          {isUnitSelected && (
            <button
              onClick={() => canMove && startMove(unit)}
              disabled={!canMove}
              className={[
                'tap-target w-full text-sm rounded-xl border font-medium',
                canMove
                  ? 'bg-[#1e3a5f] hover:bg-[#254d7a] text-[#60a5fa] border-[#3b82f6]/40 active:scale-95'
                  : 'bg-[#0f1a2e] text-gray-600 border-gray-700 cursor-not-allowed',
              ].join(' ')}
            >
              🚶 移動する{!canMove ? '（このターン移動済）' : ''}
            </button>
          )}

          {/* 攻撃ボタン（各ターゲット） */}
          {attacks.map((target, i) => {
            const label = target.type === 'base'
              ? '🏰 ベース攻撃'
              : `⚔ ${target.unit.card.name}を攻撃`;
            return (
              <button
                key={i}
                onClick={() => attackTarget(target)}
                className="tap-target w-full bg-[#7f1d1d] hover:bg-[#991b1b] text-white text-sm rounded-xl border border-[#ef4444]/30 font-medium active:scale-95"
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
              className="tap-target w-full bg-[#4c1d95] hover:bg-[#5b21b6] text-white text-sm rounded-xl border border-purple-500/30 font-medium active:scale-95"
            >
              ★ {skill.name}を使用
            </button>
          )}

          {!hasAttackOptions && (
            <p className="text-xs text-gray-500 text-center py-1">
              {isPostMove ? '攻撃できる対象がありません' : '攻撃対象なし（移動して近づこう）'}
            </p>
          )}

          {/* 【行動終了】 unit_post_move のみ */}
          {isPostMove && (
            <button
              onClick={() => endUnitAction(unit)}
              className="tap-target w-full bg-[#1a3a1a] hover:bg-[#1f4a1f] text-green-400 text-sm rounded-xl border border-green-700/40 font-medium active:scale-95"
            >
              ✅ 行動終了
            </button>
          )}

          {/* 【キャンセル】 unit_selected のみ */}
          {isUnitSelected && (
            <button
              onClick={cancel}
              className="tap-target w-full bg-[#0f1a2e] text-gray-400 text-sm rounded-xl border border-gray-600 active:scale-95"
            >
              ✕ キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
