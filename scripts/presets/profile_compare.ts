/**
 * Profile compare preset: 4プロファイル総当たり × 100試合 (1,600試合)
 * 目標: 5分以内
 */
import { buildEnemyDeck } from '../../src/lib/game/decks';
import { runMatrix } from '../../src/lib/game/sim/runMatrix';
import { reportMarkdown } from '../../src/lib/game/sim/reporter/markdown';
import type { MatrixAxis, MatrixConfig, MatrixResult } from '../../src/lib/game/sim/types';

import '../../src/lib/game/skills/index';
import '../../src/lib/game/ai/profiles/index';

const PROFILES = ['tutorial_scripted', 'easy_balanced', 'normal_balanced', 'hard_balanced'];

export async function runProfileCompare(opts: {
  countPerCell?: number;
  baseSeed?: number;
} = {}): Promise<{ result: MatrixResult; md: string }> {
  const count = opts.countPerCell ?? 100;
  const standardDeck = buildEnemyDeck('sei', 3);

  const axis: MatrixAxis = {
    label: 'AI Profile',
    cells: PROFILES.map(id => ({ id, sideConfig: { profileId: id, deck: standardDeck } })),
  };

  const config: MatrixConfig = {
    axisA: axis,
    axisB: axis,
    countPerCell: count,
    baseSeed: opts.baseSeed ?? 42,
    defaultBaseHp: 8,
    maxTurns: 50,
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} cells`),
  };

  const totalMatches = PROFILES.length ** 2 * count;
  console.log(`▶ Profile compare: 4×4 profiles × ${count} matches = ${totalMatches} total`);
  const result = await runMatrix(config);
  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s`);

  const md = reportMarkdown(result, { title: 'Profile Compare: 4 profiles vs 4 profiles' });
  return { result, md };
}
