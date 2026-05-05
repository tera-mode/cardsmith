'use client';

import { useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/ProfileContext';

interface Props {
  backHref?: string;
  title?: string;
}

export default function AppHeader({ backHref, title }: Props) {
  const router = useRouter();
  const { profile, expProgress, loading } = useProfile();

  return (
    <header className="flex-shrink-0 bg-[#0a0e27]/90 backdrop-blur-sm border-b border-[#1e3a5f]/50 px-3 py-2 h-14 flex items-center gap-2">
      {/* 左：戻るボタン or タイトル */}
      <div className="w-8 flex-shrink-0">
        {backHref ? (
          <button
            onClick={() => router.push(backHref)}
            className="text-[#94a3b8] hover:text-white text-xl leading-none"
            aria-label="戻る"
          >
            ←
          </button>
        ) : null}
      </div>

      {/* 中央：Lv/EXPバー or タイトル */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        {title ? (
          <button onClick={() => router.push('/')} className="text-sm font-bold text-white truncate">
            {title}
          </button>
        ) : loading || !profile ? (
          <div className="w-32 h-4 bg-[#1e3a5f] rounded animate-pulse" />
        ) : (
          <div
            className="w-full max-w-[200px] cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-[#22d3ee]">Lv {profile.level}</span>
              <span className="text-[10px] text-[#64748b]">
                {expProgress.current}/{expProgress.required} EXP
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] rounded-full transition-all duration-500"
                style={{ width: `${expProgress.pct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 右：ルーン残高 */}
      <div className="w-20 flex-shrink-0 flex justify-end">
        {loading || !profile ? (
          <div className="w-16 h-4 bg-[#1e3a5f] rounded animate-pulse" />
        ) : (
          <span
            data-testid="header-runes"
            className="text-sm font-bold text-[#fbbf24]"
          >
            💎 {profile.runes.toLocaleString()}
          </span>
        )}
      </div>

      {/* 非表示だが testid 提供 */}
      {profile && (
        <>
          <span data-testid="header-level" className="sr-only">{profile.level}</span>
          <span data-testid="header-exp-bar" className="sr-only">{expProgress.pct}</span>
        </>
      )}
    </header>
  );
}
