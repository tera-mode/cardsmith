#!/usr/bin/env node
/**
 * cardsmith バトルシミュレーター CLI
 * Usage: npm run sim <subcommand> [options]
 */

// スキル・プロファイル登録（副作用import）
import '../src/lib/game/skills/index';
import '../src/lib/game/ai/profiles/index';

import * as fs from 'fs';
import * as path from 'path';
import { runMatch } from '../src/lib/game/sim/runMatch';
import { runBatch } from '../src/lib/game/sim/runBatch';
import { reportMarkdown } from '../src/lib/game/sim/reporter/markdown';
import { reportJson } from '../src/lib/game/sim/reporter/json';
import { reportCsv } from '../src/lib/game/sim/reporter/csv';
import { buildEnemyDeck, buildStarterDeck, shuffleDeckWithRng } from '../src/lib/game/decks';
import { getProfile } from '../src/lib/game/ai/profile_registry';
import { createRng } from '../src/lib/game/ai/rng';
import type { Archetype } from '../src/lib/game/decks';

// ─── 引数パーサー ─────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (!arg.startsWith('-') && !args['_sub']) {
      args['_sub'] = arg;
    }
  }
  return args;
}

// ─── デッキ解決 ───────────────────────────────────────────────────────────

function resolveDeck(deckId: string, rng?: ReturnType<typeof createRng>) {
  const m = deckId.match(/^([a-z]+)_([1-5])$/);
  if (m) return buildEnemyDeck(m[1] as Archetype, parseInt(m[2]) as 1|2|3|4|5);
  if (deckId === 'standard') return buildStarterDeck('sei');
  const archetypes: Archetype[] = ['sei','mei','shin','en','sou','kou'];
  if (archetypes.includes(deckId as Archetype)) return buildStarterDeck(deckId as Archetype);
  throw new Error(`Unknown deck: ${deckId}`);
}

// ─── 出力 ─────────────────────────────────────────────────────────────────

function writeOutput(content: string, outputPath?: string, ext = 'md') {
  if (!outputPath) {
    console.log('\n' + content);
    return;
  }
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n📄 Saved to: ${outputPath}`);
}

function defaultOutputPath(preset: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `docs/sim_reports/${preset}_${date}.${ext}`;
}

// ─── サブコマンド ─────────────────────────────────────────────────────────

async function cmdMatch(args: Record<string, string | boolean>) {
  const aiA = String(args['aiA'] ?? 'normal_balanced');
  const aiB = String(args['aiB'] ?? 'normal_balanced');
  const deckAId = String(args['deckA'] ?? 'sei_3');
  const deckBId = String(args['deckB'] ?? 'sei_3');
  const n = parseInt(String(args['n'] ?? '10'));
  const seed = parseInt(String(args['seed'] ?? String(Date.now())));
  const outputPath = args['output'] ? String(args['output']) : undefined;

  const rng = createRng(seed);
  const profileA = getProfile(aiA);
  const profileB = getProfile(aiB);
  const deckA = resolveDeck(deckAId, rng);
  const deckB = resolveDeck(deckBId, rng);

  console.log(`▶ Match: ${aiA}(${deckAId}) vs ${aiB}(${deckBId}) × ${n} matches`);

  const { runBatch } = await import('../src/lib/game/sim/runBatch');
  const result = await runBatch({
    baseConfig: {
      sideA: { profileId: aiA, deck: deckA, baseHp: profileA.defaultBaseHp },
      sideB: { profileId: aiB, deck: deckB, baseHp: profileB.defaultBaseHp },
      maxTurns: 50,
    },
    count: n,
    baseSeed: seed,
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} matches`),
  });

  const s = result.summary;
  console.log(`\n✓ Done: A wins ${(s.winRateA * 100).toFixed(1)}% | B wins ${(s.winRateB * 100).toFixed(1)}% | draw ${(s.drawRate * 100).toFixed(1)}% | avg ${s.avgTurns.toFixed(1)} turns`);

  const md = reportMarkdown(result, { title: `Match: ${aiA}(${deckAId}) vs ${aiB}(${deckBId})` });
  writeOutput(md, outputPath ?? defaultOutputPath('match', 'md'));
}

async function cmdMatrix(args: Record<string, string | boolean>) {
  const axisAType = String(args['axisA'] ?? 'profiles');
  const axisBType = String(args['axisB'] ?? 'profiles');
  const n = parseInt(String(args['n'] ?? '20'));
  const outputPath = args['output'] ? String(args['output']) : undefined;

  const { runMatrix } = await import('../src/lib/game/sim/runMatrix');
  const { MatrixAxis } = await import('../src/lib/game/sim/types' as any);

  let axisA: any, axisB: any;

  if (axisAType === 'profiles' || axisBType === 'profiles') {
    const profileIds = ['tutorial_scripted', 'easy_balanced', 'normal_balanced', 'hard_balanced'];
    const standardDeck = buildStarterDeck('sei');
    const profileAxis = {
      label: 'AI Profile',
      cells: profileIds.map(id => ({ id, sideConfig: { profileId: id, deck: standardDeck } })),
    };
    if (axisAType === 'profiles') axisA = profileAxis;
    if (axisBType === 'profiles') axisB = profileAxis;
  }

  if (axisAType === 'decks' || axisBType === 'decks') {
    const aiProfile = String(args['aiA'] ?? args['aiB'] ?? 'normal_balanced');
    const archetypes: Archetype[] = ['sei','mei','shin','en','sou','kou'];
    const deckAxis = {
      label: 'Decks',
      cells: archetypes.flatMap(arch =>
        ([1,2,3,4,5] as const).map(order => ({
          id: `${arch}_${order}`,
          sideConfig: { profileId: aiProfile, deck: buildEnemyDeck(arch, order) },
        }))
      ),
    };
    if (axisAType === 'decks') axisA = deckAxis;
    if (axisBType === 'decks') axisB = deckAxis;
  }

  if (!axisA || !axisB) {
    console.error('Invalid axis configuration');
    process.exit(1);
  }

  const total = axisA.cells.length * axisB.cells.length * n;
  console.log(`▶ Matrix: ${axisA.cells.length}×${axisB.cells.length} × ${n} = ${total} matches`);

  const result = await runMatrix({
    axisA, axisB,
    countPerCell: n,
    baseSeed: 42,
    defaultBaseHp: 8,
    maxTurns: 50,
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} cells`),
  });

  console.log(`\n✓ Done in ${(result.totalDurationMs / 1000).toFixed(1)}s`);

  const md = reportMarkdown(result, { title: `Matrix: ${axisAType} vs ${axisBType}` });
  const ext = outputPath?.endsWith('.csv') ? 'csv' : outputPath?.endsWith('.json') ? 'json' : 'md';
  const content = ext === 'csv' ? reportCsv(result) : ext === 'json' ? reportJson(result) : md;
  writeOutput(content, outputPath ?? defaultOutputPath('matrix', ext));
}

async function cmdPreset(args: Record<string, string | boolean>) {
  const preset = String(args['_sub2'] ?? Object.keys(args).find(k => k !== '_sub' && k !== '_sub2') ?? 'smoke');

  if (preset === 'smoke') {
    const { runSmoke } = await import('./presets/smoke');
    const { result, md } = await (runSmoke as any)();
    writeOutput(md, String(args['output'] ?? defaultOutputPath('smoke', 'md')));
  } else if (preset === 'deck_balance') {
    const { runDeckBalance } = await import('./presets/deck_balance');
    const arch = String(args['arch'] ?? 'sei') as Archetype;
    const { result, md, csv } = await runDeckBalance({ archetype: arch });
    const outPath = String(args['output'] ?? defaultOutputPath(`deck_balance_${arch}`, 'md'));
    writeOutput(md, outPath);
    writeOutput(csv, outPath.replace('.md', '.csv'));
  } else if (preset === 'profile_compare') {
    const { runProfileCompare } = await import('./presets/profile_compare');
    const { result, md } = await runProfileCompare();
    writeOutput(md, String(args['output'] ?? defaultOutputPath('profile_compare', 'md')));
  } else {
    console.error(`Unknown preset: ${preset}`);
    console.error('Available: smoke, deck_balance, profile_compare');
    process.exit(1);
  }
}

// ─── エントリ ─────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const sub = String(args['_sub'] ?? 'help');

  // preset サブコマンドの場合、第2引数をプリセット名として取り出す
  if (sub === 'preset') {
    const presetName = argv[1];
    args['_sub2'] = presetName;
  }

  switch (sub) {
    case 'match':  await cmdMatch(args); break;
    case 'matrix': await cmdMatrix(args); break;
    case 'preset': await cmdPreset(args); break;
    default:
      console.log([
        'cardsmith Battle Simulator',
        '',
        'Usage:',
        '  npm run sim match  --aiA <profile> --aiB <profile> --deckA <deck> --deckB <deck> --n <N>',
        '  npm run sim matrix --axisA profiles --axisB profiles --n <N>',
        '  npm run sim preset smoke',
        '  npm run sim preset deck_balance [--arch sei]',
        '  npm run sim preset profile_compare',
        '',
        'Examples:',
        '  npm run sim match --aiA hard_balanced --aiB easy_balanced --deckA sei_5 --deckB en_3 --n 50',
        '  npm run sim preset smoke',
      ].join('\n'));
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
