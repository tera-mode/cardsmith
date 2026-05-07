'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useMemo } from 'react';
import { QUEST_MAP } from '@/lib/data/quests';

const MENU_ITEMS = [
  { key: 'regions',    label: '六領域',     icon: '🗺️',  href: '/regions',    accent: '#d4af37' },
  { key: 'play',       label: '自由対戦',   icon: '⚔️',  href: '/play',       accent: '#e85a4a' },
  { key: 'collection', label: 'コレクション', icon: '🃏', href: '/collection', accent: '#c478ff' },
  { key: 'materials',  label: 'マテリアル', icon: '🔩',  href: '/materials',  accent: '#8a7a5e' },
  { key: 'deck',       label: 'デッキ編集', icon: '📋',  href: '/deck',       accent: '#22d3ee' },
  { key: 'forge',      label: '鍛冶',       icon: '🔨',  href: '/forge',      accent: '#e8a93a' },
  { key: 'shop',       label: 'ショップ',   icon: '🏪',  href: '/shop',       accent: '#6bd998' },
  { key: 'gacha',      label: '召喚',       icon: '✨',  href: '/gacha',      accent: '#ffd54a' },
] as const;

const SUB_ITEMS = [
  { key: 'history',  label: '履歴',        icon: '📜', href: '/history' },
  { key: 'profile',  label: 'プロフィール', icon: '👤', href: '/profile' },
] as const;

function Torch({ style }: { style?: React.CSSProperties }) {
  return <div className="torch" style={style} />;
}

export default function HomePage() {
  const { user, loading: authLoading, signInAsGuest } = useAuth();
  const { profile, questProgress, loading: profileLoading } = useProfile();
  const router = useRouter();

  const nextGoal = useMemo(() => {
    if (!questProgress.length) return { label: 'チュートリアルを始めよう', href: '/play?questId=q0_1', sub: 'Ch.0-1 鍛炉の灯' };
    const available = questProgress.filter(p => p.status === 'available');
    if (available.length > 0) {
      const q = QUEST_MAP[available[0].questId];
      return q ? { label: q.title, href: `/play?questId=${q.questId}`, sub: `Ch.${q.chapter}-${q.order}` } : null;
    }
    return { label: '六領域マップを見る', href: '/regions', sub: '全ての章をクリアした！' };
  }, [questProgress]);

  if (authLoading) {
    return (
      <div className="game-layout stone-bg items-center justify-center">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em' }}>
          LOADING...
        </p>
      </div>
    );
  }

  // ─── 未ログイン：LP ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="game-layout stone-bg items-center justify-center" style={{ position: 'relative' }}>
        {/* 松明装飾 */}
        <Torch style={{ position: 'absolute', top: 20, left: 20 }} />
        <Torch style={{ position: 'absolute', top: 20, right: 20 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: '0 24px', maxWidth: 360, width: '100%' }}>
          {/* ロゴ */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30, fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--gold)',
              textShadow: '0 0 16px rgba(232,192,116,0.5), 0 2px 0 #000',
              marginBottom: 4,
            }}>
              ⚒ CARDSMITH
            </h1>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
              THE APEX RUNESMITH
            </p>
          </div>

          {/* キャッチコピー */}
          <div className="panel--ornate" style={{ padding: '14px 16px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              地下迷宮の奥深く、<br />ルーンを刻み、最強のカードを鍛えよ。<br />4×4の戦場で覇を競え。
            </p>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <button
              data-testid="guest-login"
              onClick={() => signInAsGuest()}
              className="btn--primary"
              style={{ minHeight: 48, fontSize: 15 }}
            >
              ⚔ ゲストでプレイ
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn--ghost tap-target"
              style={{ width: '100%' }}
            >
              ログイン / 新規登録
            </button>
          </div>

          <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>© 合同会社LAIV</p>
        </div>
      </main>
    );
  }

  // ─── ログイン済み：ホームメニュー ─────────────────────────────────────────────
  return (
    <div className="game-layout stone-bg flex-col" style={{ position: 'relative' }}>
      {/* プレイヤーバー */}
      <div style={{
        flexShrink: 0,
        padding: '12px 16px 10px',
        background: 'linear-gradient(180deg, rgba(40,28,16,0.98) 0%, rgba(20,14,8,0.9) 100%)',
        borderBottom: '1px solid var(--border-rune)',
        position: 'relative',
      }}>
        {/* 金グラデ下線 */}
        <div style={{ position: 'absolute', bottom: -1, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.5 }} />

        {/* ロゴ + 松明 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <Torch />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textShadow: '0 0 10px rgba(232,192,116,0.4)' }}>
            CARDSMITH
          </h1>
          <Torch />
        </div>

        {/* Lv バッジ + EXP バー + ルーン */}
        {!profileLoading && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Lv バッジ */}
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: 'var(--gold)', border: '1px solid var(--gold-deep)',
              padding: '2px 8px', borderRadius: 3, background: 'rgba(42,28,12,0.9)',
              flexShrink: 0, letterSpacing: '0.04em',
            }}>
              Lv {profile.level}
            </div>

            {/* EXP バー */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span data-testid="header-level" style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>EXP</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  {(profile.exp - [...Array(profile.level)].reduce((s, _, i) => i < profile.level - 1 ? s + (i + 1) * 100 : s, 0)).toString().slice(0, 6)}
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.8)' }}>
                <div
                  data-testid="header-exp-bar"
                  style={{
                    height: '100%',
                    width: `${(profile.exp % 100) / 100 * 100}%`,
                    background: 'linear-gradient(90deg, #4a9eff, #6ec6ff)',
                    boxShadow: '0 0 6px rgba(74,158,255,0.5)',
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            </div>

            {/* ルーン */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div className="rune-gem" />
              <span
                data-testid="header-runes"
                style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}
              >
                {profile.runes.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px' }}>
        {/* NEXT QUEST */}
        {nextGoal && (
          <div
            data-testid="home-next-goal"
            className="panel--ornate"
            onClick={() => router.push(nextGoal.href)}
            style={{ padding: '12px 14px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{ fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(232,192,116,0.5))' }}>📖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', marginBottom: 2 }}>
                ⚜ NEXT QUEST
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>
                {nextGoal.label}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{nextGoal.sub}</p>
            </div>
            <span style={{ color: 'var(--gold)', fontSize: 16 }}>▶</span>
          </div>
        )}

        {/* 区切り線 */}
        <div className="divider-rune" style={{ marginBottom: 10, fontSize: 10 }}>⚜ メニュー ⚜</div>

        {/* メインメニュー 2×4グリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {MENU_ITEMS.map(item => (
            <button
              key={item.key}
              data-testid={`home-menu-${item.key}`}
              onClick={() => router.push(item.href)}
              className="panel--ornate"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 4, padding: '14px 12px',
                cursor: 'pointer',
                background: `linear-gradient(180deg, rgba(50,36,22,0.96) 0%, rgba(28,20,12,0.96) 100%), radial-gradient(ellipse at top right, ${item.accent}28 0%, transparent 60%)`,
                minHeight: 80,
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
            >
              <div style={{ fontSize: 26, filter: `drop-shadow(0 0 8px ${item.accent}90)` }}>{item.icon}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                color: 'var(--gold-glow)', letterSpacing: '0.04em',
                textShadow: '0 1px 0 #000',
              }}>
                {item.label}
              </div>
            </button>
          ))}
        </div>

        {/* サブメニュー */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {SUB_ITEMS.map(item => (
            <button
              key={item.key}
              data-testid={`home-menu-${item.key}`}
              onClick={() => router.push(item.href)}
              style={{
                flex: 1, padding: '10px 8px',
                background: 'rgba(28,20,12,0.7)',
                border: '1px solid var(--border-rune)',
                borderRadius: 4,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.label}</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', paddingBottom: 4 }}>
          © 合同会社LAIV
        </p>
      </div>
    </div>
  );
}
