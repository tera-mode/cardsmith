'use client';

import { useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/ProfileContext';

interface Props {
  backHref?: string;
  title?: string;
  showLvBar?: boolean;
}

export default function AppHeader({ backHref, title, showLvBar = true }: Props) {
  const router = useRouter();
  const { profile, expProgress, loading } = useProfile();

  return (
    <header
      className="flex-shrink-0 flex items-center gap-2 relative"
      style={{
        padding: '10px 14px',
        background: 'linear-gradient(180deg, rgba(40,28,16,0.97) 0%, rgba(20,14,8,0.92) 100%)',
        borderBottom: '1px solid var(--border-rune)',
      }}
    >
      {/* 金グラデ下線装飾 */}
      <div style={{
        position: 'absolute', bottom: -1, left: '10%', right: '10%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      {/* 左：戻るボタン */}
      <div style={{ width: 32, flexShrink: 0 }}>
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            aria-label="戻る"
            style={{
              width: 32, height: 32,
              display: 'grid', placeItems: 'center',
              color: 'var(--gold)',
              background: 'transparent',
              border: '1px solid var(--border-rune)',
              borderRadius: 4,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ←
          </button>
        )}
      </div>

      {/* 中央：タイトル or Lv/EXP */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        {title ? (
          <button
            onClick={() => router.push('/')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16, fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--gold)',
              textShadow: '0 0 10px rgba(232,192,116,0.4)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            {title}
          </button>
        ) : loading || !profile ? (
          <div style={{ width: 140, height: 28, background: 'rgba(42,32,18,0.6)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        ) : showLvBar ? (
          <button
            onClick={() => router.push('/')}
            className="w-full max-w-[200px]"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12, fontWeight: 700,
                color: 'var(--gold)',
                border: '1px solid var(--gold-deep)',
                padding: '1px 6px',
                borderRadius: 3,
                background: 'rgba(42,28,12,0.8)',
                letterSpacing: '0.04em',
              }}>
                Lv {profile.level}
              </span>
              <span
                data-testid="header-level"
                style={{ fontSize: 10, color: 'var(--text-muted)' }}
              >
                {expProgress.current}/{expProgress.required} EXP
              </span>
            </div>
            {/* EXP バー */}
            <div style={{
              width: '100%', height: 5,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(0,0,0,0.8)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div
                data-testid="header-exp-bar"
                style={{
                  width: `${expProgress.pct * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4a9eff, #6ec6ff)',
                  borderRadius: 1,
                  boxShadow: '0 0 6px rgba(74,158,255,0.5)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </button>
        ) : null}
      </div>

      {/* 右：ルーン残高 */}
      <div style={{ width: 72, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        {!loading && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="rune-gem" />
            <span
              data-testid="header-runes"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13, fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '0.02em',
              }}
            >
              {profile.runes.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
