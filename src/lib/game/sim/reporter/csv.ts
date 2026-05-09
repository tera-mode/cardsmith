import type { MatrixResult } from '../types';

export function reportCsv(result: MatrixResult): string {
  const { axisA, axisB } = result.config;
  const rows: string[] = [];

  // ヘッダー
  rows.push(['matchup_a', 'matchup_b', 'matches', 'win_rate_a', 'win_rate_b', 'draw_rate', 'avg_turns'].join(','));

  for (const cellA of axisA.cells) {
    for (const cellB of axisB.cells) {
      const key = `${cellA.id}__${cellB.id}`;
      const s = result.cells[key];
      if (!s) continue;
      rows.push([
        cellA.id,
        cellB.id,
        s.totalMatches,
        s.winRateA.toFixed(4),
        s.winRateB.toFixed(4),
        s.drawRate.toFixed(4),
        s.avgTurns.toFixed(2),
      ].join(','));
    }
  }

  return rows.join('\n');
}
