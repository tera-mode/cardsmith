import { Card, GameSession } from '@/lib/types/game';
import type { AIAction } from '@/lib/game/ai/types';

export type Side = 'A' | 'B';

export interface SideConfig {
  profileId: string;
  deck: Card[];
  baseHp: number;
}

export interface MatchConfig {
  seed: number;
  sideA: SideConfig;
  sideB: SideConfig;
  firstSide?: Side;
  maxTurns?: number;
  collectFinalState?: boolean;
  collectLog?: boolean;
  collectActionTrace?: boolean;
}

export interface MatchStats {
  summonsA: number;
  summonsB: number;
  skillUsesA: number;
  skillUsesB: number;
  totalAttacksA: number;
  totalAttacksB: number;
  damageDealtToBaseA: number;
  damageDealtToBaseB: number;
  unitsKilledA: number;
  unitsKilledB: number;
}

export interface MatchResult {
  matchId: string;
  seed: number;
  config: MatchConfig;
  winner: Side | 'draw';
  endReason: 'base_hp_zero' | 'max_turns' | 'no_legal_action';
  turns: number;
  durationMs: number;
  finalBaseHpA: number;
  finalBaseHpB: number;
  stats: MatchStats;
  finalState?: GameSession;
  log?: string[];
  actionTrace?: { side: Side; turn: number; action: AIAction }[];
}

// ─── Batch ────────────────────────────────────────────────────────────────

export interface BatchConfig {
  baseConfig: Omit<MatchConfig, 'seed'>;
  count: number;
  seedStrategy?: 'incremental' | 'random';
  baseSeed?: number;
  onProgress?: (done: number, total: number) => void;
}

export interface BatchSummary {
  totalMatches: number;
  winsA: number;
  winsB: number;
  draws: number;
  winRateA: number;
  winRateB: number;
  drawRate: number;
  avgTurns: number;
  medianTurns: number;
  p95Turns: number;
  avgDurationMs: number;
  totalDurationMs: number;
  avgFinalBaseHpDiff: number;
  avgStats: MatchStats;
}

export interface BatchResult {
  config: BatchConfig;
  matches: MatchResult[];
  summary: BatchSummary;
}

// ─── Matrix ───────────────────────────────────────────────────────────────

export interface MatrixAxis {
  label: string;
  cells: { id: string; sideConfig: Omit<SideConfig, 'baseHp'> & { baseHp?: number } }[];
}

export interface MatrixConfig {
  axisA: MatrixAxis;
  axisB: MatrixAxis;
  countPerCell: number;
  baseSeed?: number;
  defaultBaseHp?: number;
  firstSide?: Side;
  maxTurns?: number;
  onProgress?: (done: number, total: number) => void;
}

export interface MatrixResult {
  config: MatrixConfig;
  cells: Record<string, BatchSummary>;
  generatedAt: string;
  totalDurationMs: number;
}
