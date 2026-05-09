import { GameSession } from '@/lib/types/game';

/** ボード状態の簡易ハッシュ（ユニット数・位置・HP） */
export function boardHash(state: GameSession): string {
  const parts: string[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const u = state.board[r][c];
      if (u) parts.push(`${u.owner[0]}${r}${c}${u.currentHp}`);
    }
  }
  parts.push(`A${state.player.baseHp}B${state.ai.baseHp}`);
  return parts.join(',');
}

/** 直近のハッシュ履歴から膠着を検知。3ターン（= 6ハーフターン）変化なしで true */
export function isStagnant(history: string[], currentHash: string): boolean {
  if (history.length < 6) return false;
  const recent = history.slice(-6);
  return recent.every(h => h === currentHash);
}
