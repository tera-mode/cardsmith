import type { BatchResult, MatrixResult, BatchSummary } from '../types';

function fmtPct(v: number): string { return `${(v * 100).toFixed(1)}%`; }
function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
}

export function reportMarkdown(
  result: MatrixResult | BatchResult,
  opts: { title?: string; outlierThreshold?: number } = {},
): string {
  const title = opts.title ?? 'Battle Sim Report';
  const outlierThreshold = opts.outlierThreshold ?? 0.3;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const lines: string[] = [
    `# ${title}`,
    '',
    `Generated: ${now}`,
  ];

  if ('cells' in result) {
    return reportMatrix(result, lines, title, now, outlierThreshold, opts);
  } else {
    return reportBatch(result, lines, title, now);
  }
}

function reportBatch(result: BatchResult, lines: string[], title: string, now: string): string {
  const s = result.summary;
  lines.push(
    `Total matches: ${s.totalMatches}`,
    `Total duration: ${fmtMs(s.totalDurationMs)}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Win Rate A | ${fmtPct(s.winRateA)} |`,
    `| Win Rate B | ${fmtPct(s.winRateB)} |`,
    `| Draw Rate | ${fmtPct(s.drawRate)} |`,
    `| Avg Turns | ${s.avgTurns.toFixed(1)} |`,
    `| Median Turns | ${s.medianTurns} |`,
    `| p95 Turns | ${s.p95Turns} |`,
    `| Avg Duration | ${fmtMs(s.avgDurationMs)} |`,
    `| Avg HP Diff (A-B) | ${s.avgFinalBaseHpDiff.toFixed(2)} |`,
    '',
    '## Action Stats (avg)',
    '',
    `| | Summons | Attacks | Skill Uses | Base Dmg | Units Killed |`,
    `|---|---|---|---|---|---|`,
    `| Side A | ${s.avgStats.summonsA.toFixed(1)} | ${s.avgStats.totalAttacksA.toFixed(1)} | ${s.avgStats.skillUsesA.toFixed(1)} | ${s.avgStats.damageDealtToBaseA.toFixed(1)} | ${s.avgStats.unitsKilledA.toFixed(1)} |`,
    `| Side B | ${s.avgStats.summonsB.toFixed(1)} | ${s.avgStats.totalAttacksB.toFixed(1)} | ${s.avgStats.skillUsesB.toFixed(1)} | ${s.avgStats.damageDealtToBaseB.toFixed(1)} | ${s.avgStats.unitsKilledB.toFixed(1)} |`,
  );
  return lines.join('\n');
}

function reportMatrix(
  result: MatrixResult,
  lines: string[],
  title: string,
  now: string,
  outlierThreshold: number,
  opts: { title?: string; outlierThreshold?: number },
): string {
  const { axisA, axisB, countPerCell } = result.config;
  const totalMatches = axisA.cells.length * axisB.cells.length * countPerCell;

  lines.push(
    `Total matches: ${totalMatches}`,
    `Total duration: ${fmtMs(result.totalDurationMs)}`,
    '',
    '## Configuration',
    '',
    `- Axis A: ${axisA.label} (${axisA.cells.length} cells)`,
    `- Axis B: ${axisB.label} (${axisB.cells.length} cells)`,
    `- Matches per cell: ${countPerCell}`,
    `- Base seed: ${result.config.baseSeed ?? 42}`,
    '',
    '## Win Rate Matrix (A wins %)',
    '',
  );

  // ヘッダー行
  const header = ['', ...axisB.cells.map(c => c.id)].join(' | ');
  const sep = ['---', ...axisB.cells.map(() => '---')].join(' | ');
  lines.push(`| ${header} |`, `| ${sep} |`);

  // データ行
  for (const cellA of axisA.cells) {
    const row = [cellA.id, ...axisB.cells.map(cellB => {
      const key = `${cellA.id}__${cellB.id}`;
      const s = result.cells[key];
      return s ? fmtPct(s.winRateA) : '-';
    })];
    lines.push(`| ${row.join(' | ')} |`);
  }

  // 平均ターン数テーブル
  lines.push('', '## Average Turns Matrix', '');
  lines.push(`| ${header} |`, `| ${sep} |`);
  for (const cellA of axisA.cells) {
    const row = [cellA.id, ...axisB.cells.map(cellB => {
      const key = `${cellA.id}__${cellB.id}`;
      const s = result.cells[key];
      return s ? s.avgTurns.toFixed(1) : '-';
    })];
    lines.push(`| ${row.join(' | ')} |`);
  }

  // Outliers
  const outliers: string[] = [];
  for (const [key, s] of Object.entries(result.cells)) {
    if (s.winRateA <= outlierThreshold || s.winRateA >= (1 - outlierThreshold)) {
      const [aId, bId] = key.split('__');
      const dir = s.winRateA <= outlierThreshold ? `${bId} too strong` : `${aId} too strong`;
      outliers.push(`- **${aId} vs ${bId}** (${s.totalMatches} matches): A win rate = ${fmtPct(s.winRateA)} _(${dir})_`);
    }
  }

  lines.push('', '## Outliers', '');
  if (outliers.length === 0) {
    lines.push('_None (all matchups within acceptable range)_');
  } else {
    lines.push(...outliers);
  }

  // Top/Bottom 5 (Aとして戦ったときの平均勝率)
  const deckWinRates: { id: string; avgWinRate: number }[] = axisA.cells.map(cellA => {
    const rates = axisB.cells
      .map(cellB => result.cells[`${cellA.id}__${cellB.id}`]?.winRateA ?? 0.5);
    return { id: cellA.id, avgWinRate: rates.reduce((a, b) => a + b, 0) / rates.length };
  });
  deckWinRates.sort((a, b) => b.avgWinRate - a.avgWinRate);

  lines.push('', '## Top 5 (avg win rate as A)', '');
  deckWinRates.slice(0, 5).forEach((d, i) =>
    lines.push(`${i + 1}. **${d.id}**: ${fmtPct(d.avgWinRate)}`));

  lines.push('', '## Bottom 5 (avg win rate as A)', '');
  [...deckWinRates].reverse().slice(0, 5).forEach((d, i) =>
    lines.push(`${i + 1}. **${d.id}**: ${fmtPct(d.avgWinRate)}`));

  return lines.join('\n');
}
