import '../src/lib/game/skills/index';
import '../src/lib/game/ai/profiles/index';
import { buildEnemyDeck } from '../src/lib/game/decks';
import type { Archetype } from '../src/lib/game/decks';
import { getProfile } from '../src/lib/game/ai/profile_registry';
import { runMatrix } from '../src/lib/game/sim/runMatrix';
import { reportMarkdown } from '../src/lib/game/sim/reporter/markdown';
import * as fs from 'fs';

const ARCHS: Archetype[] = ['sei','mei','shin','en','sou','kou'];
const STAGE = 3; // 中間ステージデッキで測定

async function main() {
  const profile = getProfile('normal_balanced');
  const axis = {
    label: 'Element (stage 3)',
    cells: ARCHS.map(a => ({
      id: a,
      sideConfig: { profileId: 'normal_balanced', deck: buildEnemyDeck(a, STAGE) },
    })),
  };

  console.log(`▶ Element Balance: 6×6 matrix × 100 matches (${6*6*100} total)`);
  const result = await runMatrix({
    axisA: axis, axisB: axis,
    countPerCell: 100, baseSeed: 42,
    defaultBaseHp: profile.defaultBaseHp,
    maxTurns: 50,
    onProgress: (d, t) => process.stdout.write(`\r  ${d}/${t} cells`),
  });

  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s`);

  const md = reportMarkdown(result, { title: 'Element Balance: 6系統 stage3デッキ (normal_balanced mirror)' });
  const path = `docs/sim_reports/element_balance_${new Date().toISOString().slice(0,10)}.md`;
  fs.mkdirSync('docs/sim_reports', { recursive: true });
  fs.writeFileSync(path, md);
  console.log(`📄 ${path}`);

  // ミラー勝率サマリー（先行後攻テスト）
  console.log('\n=== Mirror match win rates (A = first player) ===');
  for (const a of ARCHS) {
    const key = `${a}__${a}`;
    const s = result.cells[key];
    console.log(`  ${a} mirror: ${(s.winRateA * 100).toFixed(1)}% (avg ${s.avgTurns.toFixed(1)} turns)`);
  }
}
main().catch(console.error);
