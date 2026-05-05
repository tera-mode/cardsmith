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
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.push('/play');
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
      router.push('/play');
    } catch {
      setError('Googleログインに失敗しました');
    }
  };

  return (
    <div className="game-layout items-center justify-center bg-[#1a1a2e] px-6">
      <div className="flex flex-col gap-4 max-w-sm w-full">
        <h1 className="text-xl font-bold text-white text-center">⚒️ 最強カード鍛冶師</h1>

        {/* タブ */}
        <div className="flex rounded-xl overflow-hidden border border-[#1e3a5f]">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-2 text-sm font-bold transition-colors',
                tab === t ? 'bg-[#3b82f6] text-white' : 'bg-[#16213e] text-gray-400',
              ].join(' ')}
            >
              {t === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        {/* フォーム */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#16213e] border border-[#1e3a5f] rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-[#3b82f6]"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 bg-[#16213e] border border-[#1e3a5f] rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-[#3b82f6]"
          />

          {error && <p className="text-[#f87171] text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="tap-target w-full bg-[#3b82f6] text-white font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? '処理中...' : tab === 'login' ? 'ログイン' : '登録'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-[#1e3a5f]" />
          <span className="text-xs text-gray-500">または</span>
          <hr className="flex-1 border-[#1e3a5f]" />
        </div>

        <button
          onClick={handleGoogle}
          className="tap-target w-full bg-[#16213e] border border-[#1e3a5f] text-white font-bold rounded-xl text-sm"
        >
          🔵 Google でログイン
        </button>

        <button
          onClick={async () => { await signInAsGuest(); router.push('/play'); }}
          className="text-sm text-[#94a3b8] underline text-center"
        >
          ゲストのままプレイする
        </button>
      </div>
    </div>
  );
}
