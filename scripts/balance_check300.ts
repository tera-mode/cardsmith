import '../src/lib/game/skills/index';
import '../src/lib/game/ai/profiles/index';
import { buildEnemyDeck } from '../src/lib/game/decks';
import type { Archetype } from '../src/lib/game/decks';
import { getProfile } from '../src/lib/game/ai/profile_registry';
import { runMatrix } from '../src/lib/game/sim/runMatrix';

const ARCHS: Archetype[] = ['sei','mei','shin','en','sou','kou'];

async function main() {
  const profile = getProfile('normal_balanced');
  const axis = {
    label: 'Element (stage 3)',
    cells: ARCHS.map(a => ({
      id: a,
      sideConfig: { profileId: 'normal_balanced', deck: buildEnemyDeck(a, 3) },
    })),
  };

  console.log('▶ High-precision check: 300 matches/cell');
  const result = await runMatrix({
    axisA: axis, axisB: axis,
    countPerCell: 300, baseSeed: 42,
    defaultBaseHp: profile.defaultBaseHp,
    maxTurns: 50,
    onProgress: (d, t) => process.stdout.write(`\r  ${d}/${t} cells`),
  });

  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s\n`);

  // Average win rates
  console.log('=== Average win rate by archetype ===');
  for (const a of ARCHS) {
    const wins = ARCHS.reduce((sum, b) => {
      const key = `${a}__${b}`;
      return sum + (result.cells[key]?.winRateA ?? 0);
    }, 0);
    const avg = (wins / 6 * 100).toFixed(1);
    const mirror = ((result.cells[`${a}__${a}`]?.winRateA ?? 0) * 100).toFixed(1);
    console.log(`  ${a}: avg=${avg}% mirror=${mirror}%`);
  }

  // Outlier pairs (>70% or <30%)
  console.log('\n=== Outlier pairs (>70% or <30%) ===');
  for (const a of ARCHS) {
    for (const b of ARCHS) {
      const key = `${a}__${b}`;
      const wr = (result.cells[key]?.winRateA ?? 0) * 100;
      if (wr > 70 || wr < 30) {
        console.log(`  ${a} vs ${b}: ${wr.toFixed(1)}%`);
      }
    }
  }
}

main().catch(console.error);
