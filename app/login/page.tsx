'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      router.push('/');
    } catch {
      setError(tab === 'login' ? 'メールアドレスまたはパスワードが違います' : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch {
      setError('Googleログインに失敗しました');
    }
  };

  return (
    <div className="game-layout stone-bg items-center justify-center" style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360, width: '100%' }}>
        {/* ロゴ */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textShadow: '0 0 12px rgba(232,192,116,0.4)' }}>
            ⚒ CARDSMITH
          </h1>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', border: '1px solid var(--border-rune)', borderRadius: 4, overflow: 'hidden' }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 0',
                fontFamily: 'var(--font-display)', fontSize: 12,
                fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
                background: tab === t
                  ? 'linear-gradient(180deg, #d4942a 0%, #8a5a18 100%)'
                  : 'rgba(14,10,6,0.8)',
                color: tab === t ? '#1a0e02' : 'var(--text-muted)',
                border: 'none',
              }}
            >
              {t === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        {/* フォーム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(['email', 'password'] as const).map(field => (
            <input
              key={field}
              type={field}
              placeholder={field === 'email' ? 'メールアドレス' : 'パスワード'}
              value={field === 'email' ? email : password}
              onChange={e => field === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(20,16,10,0.9)',
                border: '1px solid var(--border-rune)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', fontSize: 13,
                outline: 'none',
              }}
            />
          ))}

          {error && (
            <p style={{ fontSize: 11, color: 'var(--rune-red)', fontFamily: 'var(--font-display)' }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn--primary"
            style={{ minHeight: 46, fontSize: 14 }}
          >
            {loading ? '処理中...' : tab === 'login' ? '⚔ ログイン' : '⚒ 登録する'}
          </button>
        </div>

        {/* 区切り */}
        <div className="divider-rune" style={{ fontSize: 10 }}>または</div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="btn--ghost tap-target"
          style={{ width: '100%', fontSize: 13 }}
        >
          🔵 Google でログイン
        </button>

        {/* ゲスト */}
        <button
          onClick={async () => { await signInAsGuest(); router.push('/'); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)', textDecoration: 'underline',
            textAlign: 'center', letterSpacing: '0.04em',
          }}
        >
          ゲストのままプレイする
        </button>
      </div>
    </div>
  );
}
