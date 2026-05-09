import { TacticId, TacticStrategy } from '../types';
import { balanced } from './balanced';
import { scripted } from './scripted';

const registry = new Map<TacticId, TacticStrategy>();

function registerTactic(t: TacticStrategy): void {
  registry.set(t.id, t);
}

export function getTactic(id: TacticId): TacticStrategy {
  const t = registry.get(id);
  if (!t) throw new Error(`Tactic not found: ${id}`);
  return t;
}

// 登録
registerTactic(balanced);
registerTactic(scripted);
