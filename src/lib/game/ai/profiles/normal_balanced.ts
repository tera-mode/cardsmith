import { registerProfile } from '../profile_registry';
import { balanced } from '../tactics/balanced';

registerProfile({
  id: 'normal_balanced',
  displayName: 'ノーマル',
  description: '標準的なバランス型AI（1手読み）',
  tacticId: 'balanced',
  searchDepth: 1,
  evalWeights: { ...balanced.defaultWeights },
  defaultBaseHp: 8,
});
