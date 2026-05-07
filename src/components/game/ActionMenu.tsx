'use client';

import { useGame } from '@/contexts/GameContext';
import { InteractionMode, Unit, GameSession } from '@/lib/types/game';
import { getLegalAttacks } from '@/lib/game/rules';
import { getSkill } from '@/lib/game/skills/index';
import { getEffectiveAtk, isSkillBlocked } from '@/lib/game/helpers';

interface Props {
  mode: InteractionMode;
  session: GameSession;
}

export function SkipMoveButton({ mode }: { mode: InteractionMode }) {
  const { moveUnit, cancelMove } = useGame();
  if (mode.type !== 'unit_moving') return null;
  const unit = mode.unit;

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 12px', flexShrink: 0 }}>
      <button
        onClick={() => moveUnit(unit.position)}
        className="btn--ghost tap-target"
        style={{ flex: 1, fontSize: 12 }}
      >
        その場に留まる
      </button>
      <button
        onClick={cancelMove}
        style={{
          padding: '8px 16px', minHeight: 48,
          background: 'rgba(20,14,8,0.7)',
          border: '1px solid var(--border-rune)',
          borderRadius: 4, color: 'var(--text-muted)',
          fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-display)',
        }}
      >
        ← 戻る
      </button>
    </div>
  );
}

export default function ActionMenu({ mode, session }: Props) {
  const { attackTarget, useSkill, startMove, endUnitAction, cancel } = useGame();

  const isUnitSelected = mode.type === 'unit_selected';
  const isPostMove = mode.type === 'unit_post_move';
  if (!isUnitSelected && !isPostMove) return null;

  const unit: Unit = mode.unit;
  const attacks = getLegalAttacks(unit, session.board);
  const skill = unit.card.skill;
  const skillDef = skill ? getSkill(skill.id) : null;
  const skillName = skillDef?.displayName ?? skill?.id ?? '';
  const isActivated = skillDef?.triggerKind === 'activated';
  const ctx = { remainingUses: unit.skillUsesRemaining, turnCount: session.turnCount, currentTurn: session.currentTurn as 'player' | 'ai' };
  const canUseSkill = isActivated && !isSkillBlocked(unit) && unit.skillUsesRemaining !== 0 &&
    (!skillDef?.canActivate || skillDef.canActivate(session, unit, ctx));
  const canMove = isUnitSelected && !session.player.hasMovedThisTurn;
  const hasAttackOptions = attacks.length > 0 || canUseSkill;

  return (
    <div data-testid="action-menu" className="fixed inset-x-0 bottom-0 z-20 safe-bottom">
      {isUnitSelected && (
        <div className="fixed inset-0 -z-10" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={cancel} />
      )}

      <div style={{
        background: 'linear-gradient(180deg, rgba(30,22,14,0.98) 0%, rgba(14,10,6,0.98) 100%)',
        borderTop: '1px solid var(--border-rune)',
        padding: '12px 14px 14px',
        borderRadius: '12px 12px 0 0',
        maxWidth: 480,
        margin: '0 auto',
        boxShadow: 'inset 0 1px 0 rgba(232,192,116,0.15)',
      }}>
        {/* ユニット情報 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            {unit.card.name}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#ffb44a' }}>
            ATK {getEffectiveAtk(unit)}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--rune-green)' }}>
            HP {unit.currentHp}/{unit.maxHp}
          </span>
          {isPostMove && (
            <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 4 }}>🚶 移動済</span>
          )}
          {skill && (
            <span style={{ fontSize: 10, color: 'var(--rarity-sr)', marginLeft: 'auto' }}>
              ★ {skillName}
              {unit.skillUsesRemaining !== 'infinite' && ` (${unit.skillUsesRemaining}回)`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 移動 */}
          {isUnitSelected && (
            <button
              onClick={() => canMove && startMove(unit)}
              disabled={!canMove}
              style={{
                minHeight: 44, width: '100%', borderRadius: 4,
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
                letterSpacing: '0.04em', cursor: canMove ? 'pointer' : 'not-allowed',
                background: canMove ? 'rgba(30,50,90,0.8)' : 'rgba(14,10,6,0.6)',
                border: `1px solid ${canMove ? 'rgba(93,184,255,0.4)' : 'var(--text-dim)'}`,
                color: canMove ? 'var(--rune-blue)' : 'var(--text-dim)',
              }}
            >
              🚶 移動する{!canMove ? '（移動済）' : ''}
            </button>
          )}

          {/* 攻撃ボタン */}
          {attacks.map((target, i) => (
            <button
              key={i}
              onClick={() => attackTarget(target)}
              style={{
                minHeight: 44, width: '100%', borderRadius: 4,
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
                letterSpacing: '0.04em', cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(120,30,20,0.9) 0%, rgba(60,10,8,0.9) 100%)',
                border: '1px solid rgba(255,107,91,0.4)',
                color: '#ffb0a0',
                boxShadow: '0 0 8px rgba(255,107,91,0.15)',
              }}
            >
              {target.type === 'base' ? '🏰 ベース攻撃' : `⚔ ${target.unit.card.name}を攻撃`}
            </button>
          ))}

          {/* スキル */}
          {skill && canUseSkill && (
            <button
              data-testid="skill-button"
              onClick={() => {
                if (!skillDef) return;
                const targets = skillDef.getValidTargets ? skillDef.getValidTargets(session, unit) : [];
                useSkill(targets.length > 0 ? targets[0] : undefined);
              }}
              style={{
                minHeight: 44, width: '100%', borderRadius: 4,
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
                letterSpacing: '0.04em', cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(80,30,140,0.9) 0%, rgba(40,10,80,0.9) 100%)',
                border: '1px solid rgba(196,120,255,0.4)',
                color: 'var(--rarity-sr)',
                boxShadow: '0 0 8px rgba(196,120,255,0.15)',
              }}
            >
              ★ {skillName}を使用
            </button>
          )}

          {!hasAttackOptions && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0', fontFamily: 'var(--font-display)' }}>
              {isPostMove ? '攻撃できる対象がありません' : '攻撃対象なし（移動して近づこう）'}
            </p>
          )}

          {/* 行動終了 */}
          {isPostMove && (
            <button
              onClick={() => endUnitAction(unit)}
              className="btn--ghost"
              style={{ width: '100%', minHeight: 44, color: 'var(--rune-green)', borderColor: 'rgba(107,217,152,0.4)' }}
            >
              ✅ 行動終了
            </button>
          )}

          {/* キャンセル */}
          {isUnitSelected && (
            <button
              onClick={cancel}
              className="btn--ghost"
              style={{ width: '100%', minHeight: 44, fontSize: 12 }}
            >
              ✕ キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
