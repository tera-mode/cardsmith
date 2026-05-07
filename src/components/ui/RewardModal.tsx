'use client';

import { Reward } from '@/lib/types/meta';
import { CARDS } from '@/lib/game/cards';
import { RARITY_COLORS } from '@/lib/types/meta';
import { getCardRarity } from '@/lib/data/cards';

interface Props {
  reward: Reward;
  leveledUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

export default function RewardModal({ reward, leveledUp, newLevel, onClose }: Props) {
  const hasCards = reward.cards && reward.cards.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overlay-full"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        data-testid="reward-modal"
        className="panel--ornate"
        style={{ padding: '20px 18px', margin: '0 16px', width: '100%', maxWidth: 380, maxHeight: '88dvh', overflowY: 'auto' }}
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

        {/* ─── 報酬カード演出 ───────────────────────────────────── */}
        {hasCards && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--gold)', textAlign: 'center', marginBottom: 10,
              textShadow: '0 0 8px rgba(232,192,116,0.6)',
            }}>
              ◆ 新カード入手 ◆
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {reward.cards!.map((rc, idx) => {
                const card = CARDS.find(c => c.id === rc.cardId);
                const rarity = card ? getCardRarity(card.id) : 'C';
                const rarityColor = RARITY_COLORS[rarity] ?? '#6b7280';
                return (
                  <div
                    key={rc.cardId}
                    data-testid={`reward-card-${rc.cardId}`}
                    style={{
                      width: 90, flexShrink: 0,
                      animation: `card-forge 0.6s ease-out ${idx * 0.15}s both`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* カード枠 */}
                    <div style={{
                      background: 'linear-gradient(180deg, #3a2c1a 0%, #1a1208 100%)',
                      border: `2px solid ${rarityColor}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      boxShadow: `0 0 16px ${rarityColor}60, 0 4px 12px rgba(0,0,0,0.5)`,
                    }}>
                      {/* 画像 */}
                      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={`/images/chars/${rc.cardId}.png`}
                          alt={card?.name ?? rc.cardId}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                        />
                        {/* レアリティ輝き */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: `radial-gradient(ellipse at center, ${rarityColor}30, transparent 70%)`,
                          pointerEvents: 'none',
                        }} />
                      </div>
                      {/* カード名 + ×枚数 */}
                      <div style={{ padding: '4px 6px', background: 'rgba(0,0,0,0.6)' }}>
                        <p style={{ fontSize: 9, fontFamily: 'var(--font-body)', color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3, fontWeight: 700 }}>
                          {card?.name ?? rc.cardId}
                        </p>
                        <p style={{ fontSize: 9, fontFamily: 'var(--font-display)', color: rarityColor, textAlign: 'center' }}>
                          {rarity} ×{rc.count}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── EXP / Rune / Material ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reward.exp > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.25)',
              borderRadius: 4, padding: '7px 12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--rune-blue)', letterSpacing: '0.04em' }}>経験値</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--rune-blue)', fontSize: 13 }}>+{reward.exp} EXP</span>
            </div>
          )}
          {reward.runes > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(232,192,116,0.1)', border: '1px solid rgba(232,192,116,0.25)',
              borderRadius: 4, padding: '7px 12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.04em' }}>ルーン</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="rune-gem" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>+{reward.runes.toLocaleString()}</span>
              </div>
            </div>
          )}
          {reward.materials && reward.materials.length > 0 && (
            <div style={{ background: 'rgba(196,120,255,0.08)', border: '1px solid rgba(196,120,255,0.2)', borderRadius: 4, padding: '7px 12px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>◆ マテリアル</p>
              {reward.materials.map(rm => (
                <div key={rm.materialId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-primary)' }}>
                  <span>{rm.materialId}</span>
                  <span style={{ color: 'var(--text-muted)' }}>×{rm.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* レベルアップ */}
        {leveledUp && newLevel && (
          <div style={{
            marginTop: 10,
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
          style={{ width: '100%', marginTop: 12, minHeight: 44, fontSize: 12 }}
        >
          タップで閉じる
        </button>
      </div>
    </div>
  );
}
