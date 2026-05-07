'use client';

import { Reward } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';

interface Props {
  reward: Reward;
  leveledUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

export default function RewardModal({ reward, leveledUp, newLevel, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overlay-full"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        data-testid="reward-modal"
        className="panel--ornate"
        style={{ padding: '20px 18px', margin: '0 16px', width: '100%', maxWidth: 360 }}
        onClick={e => e.stopPropagation()}
      >
        {/* タイトル */}
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          letterSpacing: '0.12em', color: 'var(--gold)',
          textAlign: 'center', marginBottom: 14,
          textShadow: '0 0 12px rgba(232,192,116,0.5)',
          animation: 'gold-pulse 2s ease-in-out infinite',
        }}>
          ⚜ REWARD! ⚜
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reward.exp > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.25)',
              borderRadius: 4, padding: '8px 12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--rune-blue)', letterSpacing: '0.04em' }}>経験値</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--rune-blue)', fontSize: 14 }}>+{reward.exp} EXP</span>
            </div>
          )}
          {reward.runes > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(232,192,116,0.1)', border: '1px solid rgba(232,192,116,0.25)',
              borderRadius: 4, padding: '8px 12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.04em' }}>ルーン</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="rune-gem" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>+{reward.runes.toLocaleString()}</span>
              </div>
            </div>
          )}
          {reward.cards && reward.cards.length > 0 && (
            <div style={{
              background: 'rgba(93,184,255,0.08)', border: '1px solid rgba(93,184,255,0.2)',
              borderRadius: 4, padding: '8px 12px',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em' }}>◆ カード</p>
              {reward.cards.map(rc => {
                const card = CARDS.find(c => c.id === rc.cardId);
                return (
                  <div key={rc.cardId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-primary)' }}>
                    <span style={{ fontFamily: 'var(--font-body)' }}>{card?.name ?? rc.cardId}</span>
                    <span style={{ color: 'var(--text-muted)' }}>×{rc.count}</span>
                  </div>
                );
              })}
            </div>
          )}
          {reward.materials && reward.materials.length > 0 && (
            <div style={{
              background: 'rgba(196,120,255,0.08)', border: '1px solid rgba(196,120,255,0.2)',
              borderRadius: 4, padding: '8px 12px',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em' }}>◆ マテリアル</p>
              {reward.materials.map(rm => (
                <div key={rm.materialId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-primary)' }}>
                  <span>{rm.materialId}</span>
                  <span style={{ color: 'var(--text-muted)' }}>×{rm.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {leveledUp && newLevel && (
          <div style={{
            marginTop: 12,
            background: 'rgba(232,192,116,0.15)',
            border: '1px solid rgba(232,192,116,0.4)',
            borderRadius: 4, padding: '10px 14px', textAlign: 'center',
            animation: 'levelup 0.6s ease-out',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em' }}>🎉 LEVEL UP!</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Lv {newLevel - 1} → Lv {newLevel}
            </p>
          </div>
        )}

        <button
          data-testid="reward-modal-close"
          onClick={onClose}
          className="btn--ghost"
          style={{ width: '100%', marginTop: 14, minHeight: 44, fontSize: 12 }}
        >
          タップで閉じる
        </button>
      </div>
    </div>
  );
}
