import { registerProfile } from '../profile_registry';
import { balanced } from '../tactics/balanced';

registerProfile({
  id: 'hard_balanced',
  displayName: 'ハード',
  description: 'ヒーラー・スキルを重視する上級バランス型AI（2手読み）',
  tacticId: 'balanced',
  searchDepth: 2,
  evalWeights: {
    ...balanced.defaultWeights,
    healerPresence: 12,
    skillPotential: 4,
    enemyAttackThreat: -12,
  },
  searchOptions: { topKSummon: 5, topKAction: 5 },
  defaultBaseHp: 10,
});
