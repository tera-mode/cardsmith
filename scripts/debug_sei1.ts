/**
 * sei_1 低下の原因特定
 * strong_blow の影響を分離して確認
 */
import '../src/lib/game/skills/index';
import '../src/lib/game/ai/profiles/index';
import { buildEnemyDeck } from '../src/lib/game/decks';
import { runBatch } from '../src/lib/game/sim/runBatch';
import { getProfile } from '../src/lib/game/ai/profile_registry';

async function main() {
  const profile = getProfile('normal_balanced');
  const sei1 = buildEnemyDeck('sei', 1);
  const sei5 = buildEnemyDeck('sei', 5);

  // sei_1 vs sei_1 (先攻後攻補正あり、現在の設定)
  const r1 = await runBatch({
    baseConfig: {
      sideA: { profileId: 'normal_balanced', deck: sei1, baseHp: profile.defaultBaseHp },
      sideB: { profileId: 'normal_balanced', deck: sei1, baseHp: profile.defaultBaseHp },
    },
    count: 100, baseSeed: 42,
  });
  console.log(`sei_1(A) vs sei_1(B): ${(r1.summary.winRateA * 100).toFixed(1)}% A wins (avg ${r1.summary.avgTurns.toFixed(1)} turns)`);

  // sei_1 vs sei_5 (弱い方 vs 強い方)
  const r2 = await runBatch({
    baseConfig: {
      sideA: { profileId: 'normal_balanced', deck: sei1, baseHp: profile.defaultBaseHp },
      sideB: { profileId: 'normal_balanced', deck: sei5, baseHp: profile.defaultBaseHp },
    },
    count: 100, baseSeed: 42,
  });
  console.log(`sei_1(A) vs sei_5(B): ${(r2.summary.winRateA * 100).toFixed(1)}% A wins`);

  // sei_5 vs sei_1
  const r3 = await runBatch({
    baseConfig: {
      sideA: { profileId: 'normal_balanced', deck: sei5, baseHp: profile.defaultBaseHp },
      sideB: { profileId: 'normal_balanced', deck: sei1, baseHp: profile.defaultBaseHp },
    },
    count: 100, baseSeed: 42,
  });
  console.log(`sei_5(A) vs sei_1(B): ${(r3.summary.winRateA * 100).toFixed(1)}% A wins`);

  // sei_1 vs sei_3
  const sei3 = buildEnemyDeck('sei', 3);
  const r4 = await runBatch({
    baseConfig: {
      sideA: { profileId: 'normal_balanced', deck: sei3, baseHp: profile.defaultBaseHp },
      sideB: { profileId: 'normal_balanced', deck: sei1, baseHp: profile.defaultBaseHp },
    },
    count: 100, baseSeed: 42,
  });
  console.log(`sei_3(A) vs sei_1(B): ${(r4.summary.winRateA * 100).toFixed(1)}% A wins`);

  // 各デッキの構成を表示
  console.log('\n--- Deck compositions ---');
  const sei2 = buildEnemyDeck('sei', 2);
  const cardNames = (deck: any[]) => {
    const counts: Record<string, number> = {};
    deck.forEach(c => counts[c.name] = (counts[c.name] || 0) + 1);
    return Object.entries(counts).map(([n, c]) => `${n}×${c}`).join(', ');
  };
  console.log('sei_1:', cardNames(sei1));
  console.log('sei_2:', cardNames(sei2));
  console.log('sei_3:', cardNames(sei3));
  console.log('sei_5:', cardNames(sei5));
}

main().catch(console.error);
