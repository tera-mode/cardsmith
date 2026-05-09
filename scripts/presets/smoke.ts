/**
 * Smoke preset: 4プロファイル × 標準デッキ × 5試合 (80試合)
 * 目標: 30秒以内
 */
import { buildEnemyDeck } from '../../src/lib/game/decks';
import { runMatrix } from '../../src/lib/game/sim/runMatrix';
import { reportMarkdown } from '../../src/lib/game/sim/reporter/markdown';
import type { MatrixAxis, MatrixConfig } from '../../src/lib/game/sim/types';

// スキル・プロファイル登録
import '../../src/lib/game/skills/index';
import '../../src/lib/game/ai/profiles/index';

const PROFILES = ['tutorial_scripted', 'easy_balanced', 'normal_balanced', 'hard_balanced'];
const SEI_DECK = buildEnemyDeck('sei', 3);

export async function runSmoke(opts: { baseSeed?: number; output?: string } = {}): Promise<{ result: import('../../src/lib/game/sim/types').MatrixResult; md: string }> {
  const axisA: MatrixAxis = {
    label: 'Profile A',
    cells: PROFILES.map(id => ({ id, sideConfig: { profileId: id, deck: SEI_DECK } })),
  };
  const axisB: MatrixAxis = {
    label: 'Profile B',
    cells: PROFILES.map(id => ({ id, sideConfig: { profileId: id, deck: SEI_DECK } })),
  };

  const config: MatrixConfig = {
    axisA, axisB,
    countPerCell: 5,
    baseSeed: opts.baseSeed ?? 1000,
    defaultBaseHp: 8,
    maxTurns: 50,
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} cells`),
  };

  console.log('▶ Smoke preset: 4 profiles × 4 profiles × 5 matches each');
  const result = await runMatrix(config);
  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s`);

  const md = reportMarkdown(result, { title: 'Smoke: Profile × Profile' });
  return { result, md };
}
