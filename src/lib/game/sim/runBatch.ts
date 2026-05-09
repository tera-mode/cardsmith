import { runMatch } from './runMatch';
import { summarizeStats, percentile } from './stats';
import type { BatchConfig, BatchResult, BatchSummary, MatchResult } from './types';

export async function runBatch(config: BatchConfig): Promise<BatchResult> {
  const {
    baseConfig,
    count,
    seedStrategy = 'incremental',
    baseSeed = Date.now(),
    onProgress,
  } = config;

  const matches: MatchResult[] = [];

  for (let i = 0; i < count; i++) {
    const seed = seedStrategy === 'incremental'
      ? baseSeed + i
      : Math.floor(Math.random() * 2 ** 31);

    const result = await runMatch({ ...baseConfig, seed });
    matches.push(result);

    if (onProgress) onProgress(i + 1, count);
  }

  const summary = buildSummary(matches, config);
  return { config, matches, summary };
}

function buildSummary(matches: MatchResult[], config: BatchConfig): BatchSummary {
  const n = matches.length;
  if (n === 0) {
    return {
      totalMatches: 0, winsA: 0, winsB: 0, draws: 0,
      winRateA: 0, winRateB: 0, drawRate: 0,
      avgTurns: 0, medianTurns: 0, p95Turns: 0,
      avgDurationMs: 0, totalDurationMs: 0,
      avgFinalBaseHpDiff: 0, avgStats: {
        summonsA: 0, summonsB: 0, skillUsesA: 0, skillUsesB: 0,
        totalAttacksA: 0, totalAttacksB: 0,
        damageDealtToBaseA: 0, damageDealtToBaseB: 0,
        unitsKilledA: 0, unitsKilledB: 0,
      },
    };
  }

  const winsA = matches.filter(m => m.winner === 'A').length;
  const winsB = matches.filter(m => m.winner === 'B').length;
  const draws = matches.filter(m => m.winner === 'draw').length;
  const turns = matches.map(m => m.turns);
  const durations = matches.map(m => m.durationMs);
  const totalDurationMs = durations.reduce((a, b) => a + b, 0);

  return {
    totalMatches: n,
    winsA, winsB, draws,
    winRateA: winsA / n,
    winRateB: winsB / n,
    drawRate: draws / n,
    avgTurns: turns.reduce((a, b) => a + b, 0) / n,
    medianTurns: percentile(turns, 50),
    p95Turns: percentile(turns, 95),
    avgDurationMs: totalDurationMs / n,
    totalDurationMs,
    avgFinalBaseHpDiff: matches.reduce((s, m) => s + (m.finalBaseHpA - m.finalBaseHpB), 0) / n,
    avgStats: summarizeStats(matches.map(m => m.stats)),
  };
}
