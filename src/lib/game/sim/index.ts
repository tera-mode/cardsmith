export { runMatch } from './runMatch';
export { runBatch } from './runBatch';
export { runMatrix } from './runMatrix';
export { reportMarkdown, reportJson, reportCsv } from './reporter/index';
export type {
  Side, SideConfig, MatchConfig, MatchResult, MatchStats,
  BatchConfig, BatchResult, BatchSummary,
  MatrixConfig, MatrixResult, MatrixAxis,
} from './types';
