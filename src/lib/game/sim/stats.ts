import { GameSession } from '@/lib/types/game';
import { applyAction } from '@/lib/game/apply';
import type { AIAction, Owner } from '@/lib/game/ai/types';
import type { MatchStats, Side } from './types';

export function initStats(): MatchStats {
  return {
    summonsA: 0, summonsB: 0,
    skillUsesA: 0, skillUsesB: 0,
    totalAttacksA: 0, totalAttacksB: 0,
    damageDealtToBaseA: 0, damageDealtToBaseB: 0,
    unitsKilledA: 0, unitsKilledB: 0,
  };
}

/** applyAction のラッパー。statsを副作用なしに集計（mutate） */
export function applyActionWithStats(
  state: GameSession,
  action: AIAction,
  owner: Owner,
  side: Side,
  stats: MatchStats,
): GameSession {
  // 適用前の盤面ユニット数（相手側）
  const enemyOwner: Owner = owner === 'ai' ? 'player' : 'ai';
  const countEnemyBefore = countUnits(state, enemyOwner);
  const enemyBaseHpBefore = owner === 'player' ? state.ai.baseHp : state.player.baseHp;

  const next = applyAction(state, action, owner);

  // 統計更新
  if (action.type === 'summon') {
    if (side === 'A') stats.summonsA++; else stats.summonsB++;
  } else if (action.type === 'skill') {
    if (side === 'A') stats.skillUsesA++; else stats.skillUsesB++;
  } else if (action.type === 'attack') {
    if (side === 'A') stats.totalAttacksA++; else stats.totalAttacksB++;
    const enemyBaseHpAfter = owner === 'player' ? next.ai.baseHp : next.player.baseHp;
    const baseDmg = enemyBaseHpBefore - enemyBaseHpAfter;
    if (baseDmg > 0) {
      if (side === 'A') stats.damageDealtToBaseA += baseDmg;
      else               stats.damageDealtToBaseB += baseDmg;
    }
    const countEnemyAfter = countUnits(next, enemyOwner);
    const killed = countEnemyBefore - countEnemyAfter;
    if (killed > 0) {
      if (side === 'A') stats.unitsKilledA += killed;
      else               stats.unitsKilledB += killed;
    }
  }

  return next;
}

function countUnits(state: GameSession, owner: Owner): number {
  let n = 0;
  for (const row of state.board) for (const u of row) if (u?.owner === owner) n++;
  return n;
}

export function summarizeStats(matches: MatchStats[]): MatchStats {
  const n = matches.length || 1;
  const keys = Object.keys(initStats()) as (keyof MatchStats)[];
  const result = initStats();
  for (const k of keys) {
    result[k] = matches.reduce((s, m) => s + m[k], 0) / n;
  }
  return result;
}

export function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}
