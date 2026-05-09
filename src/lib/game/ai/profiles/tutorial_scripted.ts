import { registerProfile } from '../profile_registry';
import { scripted } from '../tactics/scripted';

registerProfile({
  id: 'tutorial_scripted',
  displayName: 'チュートリアル',
  description: '最安カードを召喚し前進と攻撃のみ行う入門AI',
  tacticId: 'scripted',
  searchDepth: 0,
  evalWeights: scripted.defaultWeights,
  defaultBaseHp: 3,
});
