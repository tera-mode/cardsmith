import type { BatchResult, MatrixResult } from '../types';

export function reportJson(result: MatrixResult | BatchResult): string {
  return JSON.stringify(result, null, 2);
}
