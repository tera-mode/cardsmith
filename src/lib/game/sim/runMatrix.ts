import { runBatch } from './runBatch';
import type { BatchConfig, MatrixConfig, MatrixResult } from './types';

export async function runMatrix(config: MatrixConfig): Promise<MatrixResult> {
  const t0 = Date.now();
  const cells: MatrixResult['cells'] = {};
  const defaultHp = config.defaultBaseHp ?? 8;

  const totalCells = config.axisA.cells.length * config.axisB.cells.length;
  let doneCount = 0;

  for (const cellA of config.axisA.cells) {
    for (const cellB of config.axisB.cells) {
      const key = `${cellA.id}__${cellB.id}`;

      const batchConfig: BatchConfig = {
        baseConfig: {
          sideA: {
            profileId: cellA.sideConfig.profileId,
            deck: cellA.sideConfig.deck,
            baseHp: cellA.sideConfig.baseHp ?? defaultHp,
          },
          sideB: {
            profileId: cellB.sideConfig.profileId,
            deck: cellB.sideConfig.deck,
            baseHp: cellB.sideConfig.baseHp ?? defaultHp,
          },
          firstSide: config.firstSide ?? 'A',
          maxTurns: config.maxTurns ?? 50,
        },
        count: config.countPerCell,
        seedStrategy: 'incremental',
        baseSeed: (config.baseSeed ?? 42) + doneCount * config.countPerCell,
      };

      const result = await runBatch(batchConfig);
      cells[key] = result.summary;

      doneCount++;
      if (config.onProgress) config.onProgress(doneCount, totalCells);
    }
  }

  return {
    config,
    cells,
    generatedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - t0,
  };
}
