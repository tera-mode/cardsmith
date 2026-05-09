import { BattleAIProfile } from './types';

const registry = new Map<string, BattleAIProfile>();

export function registerProfile(p: BattleAIProfile): void {
  registry.set(p.id, p);
}

export function getProfile(id: string): BattleAIProfile {
  const p = registry.get(id);
  if (!p) throw new Error(`BattleAIProfile not found: "${id}". Registered: [${[...registry.keys()].join(', ')}]`);
  return p;
}

export function getAllProfiles(): BattleAIProfile[] {
  return [...registry.values()];
}
