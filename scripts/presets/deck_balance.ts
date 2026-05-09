/**
 * Deck balance preset: 特定系統の5デッキ総当たり（normal_balanced ミラー）
 */
import { buildEnemyDeck } from '../../src/lib/game/decks';
import type { Archetype } from '../../src/lib/game/decks';
import { getProfile } from '../../src/lib/game/ai/profile_registry';
import { runMatrix } from '../../src/lib/game/sim/runMatrix';
import { reportMarkdown } from '../../src/lib/game/sim/reporter/markdown';
import { reportCsv } from '../../src/lib/game/sim/reporter/csv';
import type { MatrixAxis, MatrixConfig, MatrixResult } from '../../src/lib/game/sim/types';

import '../../src/lib/game/skills/index';
import '../../src/lib/game/ai/profiles/index';

export async function runDeckBalance(opts: {
  archetype?: Archetype;
  aiProfile?: string;
  countPerCell?: number;
  baseSeed?: number;
} = {}): Promise<{ result: MatrixResult; md: string; csv: string }> {
  const archetype = opts.archetype ?? 'sei';
  const profileId = opts.aiProfile ?? 'normal_balanced';
  const count = opts.countPerCell ?? 30;

  const decks = ([1, 2, 3, 4, 5] as const).map(order => ({
    id: `${archetype}_${order}`,
    deck: buildEnemyDeck(archetype, order),
  }));

  const profile = getProfile(profileId);
  const axis: MatrixAxis = {
    label: `${archetype} decks`,
    cells: decks.map(d => ({ id: d.id, sideConfig: { profileId, deck: d.deck } })),
  };

  const config: MatrixConfig = {
    axisA: axis,
    axisB: axis,
    countPerCell: count,
    baseSeed: opts.baseSeed ?? 42,
    defaultBaseHp: profile.defaultBaseHp,
    maxTurns: 50,
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} cells`),
  };

  const totalMatches = 5 * 5 * count;
  console.log(`▶ Deck balance [${archetype}]: 5×5 matrix × ${count} matches = ${totalMatches} total`);
  const result = await runMatrix(config);
  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s`);

  const md = reportMarkdown(result, { title: `Deck Balance: ${archetype} (${profileId} mirror)` });
  const csv = reportCsv(result);

  return { result, md, csv };
}
