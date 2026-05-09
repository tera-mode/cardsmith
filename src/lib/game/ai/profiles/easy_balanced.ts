import { registerProfile } from '../profile_registry';
import { balanced } from '../tactics/balanced';

registerProfile({
  id: 'easy_balanced',
  displayName: 'イージー',
  description: '判断力が弱く脅威評価が低いバランス型AI',
  tacticId: 'balanced',
  searchDepth: 1,
  evalWeights: {
    ...balanced.defaultWeights,
    baseHpDiff: 25,
    alliedUnitValue: 2,
    enemyUnitValue: -2,
    enemyAttackThreat: -3,
    alliedAttackThreat: 3,
  },
  defaultBaseHp: 6,
});
